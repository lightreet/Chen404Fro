import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as vue from 'vue'

// 在真实 Vue 响应式之上替换网络和生命周期调度，直接执行被测 composable，避免依赖真实账号或服务器。
const source = fs
  .readFileSync(new URL('../src/composables/useTravelMobileUpload.ts', import.meta.url), 'utf8')
  .replaceAll('import.meta.env.VITE_API_BASE_URL', "'/api'")
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function snapshot(id, images = []) {
  return { sessionId: id, status: 'active', expiresAt: Date.now() + 900_000, images, receipts: [] }
}
function created(id) {
  return { sessionId: id, uploadUrl: `https://example.org/#${id}`, session: snapshot(id) }
}
const target = (key) => ({ key, kind: 'stop', label: key, travelTitle: 'Test trip' })

function harness(overrides = {}, qr = async (url) => `qr:${url}`) {
  const closed = [],
    received = [],
    revocations = []
  let dispose
  const api = {
    createMobileUpload: async (t) => created(t.key),
    pollMobileUpload: async (id) => snapshot(id),
    closeMobileUpload: async (id) => {
      closed.push(id)
      return { ...snapshot(id), status: 'closed' }
    },
    isMobileUploadForbidden: (e) => e.status === 403,
    isMobileUploadGone: (e) => e.status === 410,
    mobileUploadError: (e) => e.message || 'request failed',
    ...overrides,
  }
  const module = { exports: {} }
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    Date,
    Set,
    Promise,
    setTimeout: () => 1,
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    window: { addEventListener() {}, removeEventListener() {} },
    fetch: async (url) => {
      revocations.push(url)
    },
    require: (name) => {
      if (name === 'vue')
        return {
          ...vue,
          onBeforeUnmount: (callback) => {
            dispose = callback
          },
        }
      if (name === 'qrcode') return { toDataURL: qr }
      if (name.endsWith('travel-mobile-upload')) return api
      if (name.endsWith('authSession')) return { readAccessToken: () => 'test-token' }
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const state = module.exports.useTravelMobileUpload((image, t) => received.push({ image, target: t }))
  return { state, closed, received, revocations, dispose: () => dispose() }
}

test('离开编辑器后迟到的创建结果必须撤销，不能重新绑定', async () => {
  const pending = deferred()
  const h = harness({ createMobileUpload: () => pending.promise })
  const starting = h.state.start(target('old'))
  await Promise.resolve()
  h.state.detach()
  pending.resolve(created('old'))
  await starting
  assert.equal(h.state.target, undefined)
  assert.equal(h.state.qr, '')
  assert.equal(h.state.busy, false)
  assert.deepEqual(h.closed, ['old'])
  h.dispose()
})

test('旧轮询的失败不能关闭新会话或覆盖错误状态', async () => {
  const pending = deferred()
  const h = harness({ pollMobileUpload: () => pending.promise })
  await h.state.start(target('old'))
  const polling = h.state.poll()
  h.state.detach()
  await h.state.start(target('new'))
  pending.reject({ status: 410, message: 'old session expired' })
  await polling
  assert.equal(h.state.session.sessionId, 'new')
  assert.equal(h.state.active, true)
  assert.equal(h.state.error, '')
  h.dispose()
})

test('迟到的关闭回执不能把旧照片追加到新表单', async () => {
  const pending = deferred()
  const h = harness({ closeMobileUpload: () => pending.promise })
  await h.state.start(target('old'))
  const closing = h.state.finish()
  await Promise.resolve()
  h.state.detach()
  await h.state.start(target('new'))
  pending.resolve({ ...snapshot('old', [{ id: 1, url: '/old-photo' }]), status: 'closed' })
  await closing
  assert.equal(h.state.session.sessionId, 'new')
  assert.equal(h.received.length, 0)
  h.dispose()
})

test('二维码生成失败清空旧二维码，并撤销新创建的会话', async () => {
  const h = harness({}, async (url) => {
    if (url.endsWith('#new')) throw new Error('qr generation failed')
    return `qr:${url}`
  })
  await h.state.start(target('old'))
  assert.notEqual(h.state.qr, '')
  await h.state.start(target('new'))
  assert.equal(h.state.qr, '')
  assert.equal(h.state.active, false)
  assert.equal(h.state.error, 'qr generation failed')
  assert.deepEqual(h.closed, ['old', 'new'])
  h.dispose()
})

test('迟到的二维码绘制结果不能覆盖新二维码', async () => {
  const oldQr = deferred()
  const h = harness({}, (url) => (url.endsWith('#old') ? oldQr.promise : Promise.resolve(`qr:${url}`)))
  const oldStart = h.state.start(target('old'))
  for (let i = 0; i < 5; i++) await Promise.resolve()
  h.state.detach()
  await h.state.start(target('new'))
  oldQr.resolve('old-qr')
  await oldStart
  assert.equal(h.state.qr, 'qr:https://example.org/#new')
  assert.equal(h.state.target.key, 'new')
  h.dispose()
})

test('保存前合并最后回执且重复结束不会重复追加', async () => {
  const h = harness({
    closeMobileUpload: async (id) => ({ ...snapshot(id, [{ id: 9, url: '/photo' }]), status: 'closed' }),
  })
  await h.state.start(target('stop'))
  await h.state.finish()
  await h.state.finish()
  assert.equal(h.received.length, 1)
  assert.equal(h.received[0].target.key, 'stop')
  h.dispose()
})

test('原批次尚未结束时拒绝切换，但保留原目标的可用二维码', async () => {
  const h = harness({ closeMobileUpload: async () => { throw new Error('batch still uploading') } })
  await h.state.start(target('old'))
  const qr = h.state.qr
  await h.state.start(target('new'))
  assert.equal(h.state.target.key, 'old')
  assert.equal(h.state.qr, qr)
  assert.equal(h.state.active, true)
  h.dispose()
})
