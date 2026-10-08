import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as vue from 'vue'

function load(path, dependencies = {}) {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} }
  vm.runInNewContext(code, {
    module, exports: module.exports, AbortController, DOMException,
    // Retry delay remains asynchronous, without adding seconds to each regression.
    setTimeout: callback => setTimeout(callback, 0), clearTimeout,
    require: name => { if (name in dependencies) return dependencies[name]; throw new Error(name) },
  })
  return module.exports
}
const policy = load('../src/modules/travel-upload/policy.ts')
const file = name => new File([new Uint8Array(3 * 1024 * 1024)], name, { type: 'image/jpeg' })
const tick = () => new Promise(resolve => setTimeout(resolve, 5))
async function until(predicate) { for (let i = 0; i < 200 && !predicate(); i++) await tick(); assert.ok(predicate()) }
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
function harness(upload) {
  const received = []
  let dispose
  const { useTravelPhotoQueue } = load('../src/composables/useTravelPhotoQueue.ts', {
    vue: { ...vue, onBeforeUnmount: fn => { dispose = fn } },
    '@/api/upload': { uploadTravelMemoryImage: upload },
    '@/modules/travel-upload/policy': policy,
  })
  const queue = useTravelPhotoQueue((image, task) => received.push({ url: image.url, target: task.target, cover: task.cover }))
  return { queue, received, dispose: () => dispose() }
}

test('多组选图与封面共享一个串行队列，保持选择顺序和目标归属', async () => {
  let active = 0, peak = 0
  const h = harness(async f => { active++; peak = Math.max(peak, active); await tick(); active--; return { url: f.name } })
  h.queue.enqueue(file('a.jpg'), 'stop-a')
  h.queue.enqueue(file('b.jpg'), 'stop-b')
  h.queue.enqueue(file('cover.jpg'), 'stop-a', true)
  assert.equal(h.queue.busy.value, true)
  await until(() => !h.queue.busy.value)
  assert.equal(peak, 1)
  assert.deepEqual(h.received, [
    { url: 'a.jpg', target: 'stop-a', cover: false }, { url: 'b.jpg', target: 'stop-b', cover: false },
    { url: 'cover.jpg', target: 'stop-a', cover: true },
  ])
  assert.ok(h.queue.tasks.every(t => !t.file))
  assert.equal(h.queue.unresolved.value, false)
})

test('单张永久失败不阻断其他照片，重试只提交失败文件', async () => {
  const sent = []; let failing = true
  const h = harness(async f => { sent.push(f.name); if (f.name === 'bad.jpg' && failing) throw { response: { status: 413 } }; return { url: f.name } })
  h.queue.enqueue(file('bad.jpg'), 'stop')
  h.queue.enqueue(file('good.jpg'), 'stop')
  await until(() => !h.queue.busy.value)
  assert.equal(h.queue.failed.value, true)
  assert.equal(h.queue.unresolved.value, true)
  assert.match(h.queue.tasks[0].error, /服务器接收限制/)
  failing = false
  h.queue.retry(h.queue.tasks[0].id)
  await until(() => !h.queue.busy.value)
  assert.deepEqual(sent, ['bad.jpg', 'good.jpg', 'bad.jpg'])
  assert.equal(h.received.length, 2)
})

test('网络抖动自动重试两次，只回填一次；鉴权和格式错误不自动重试', async () => {
  let attempts = 0
  const h = harness(async () => { if (++attempts < 3) throw { code: 'ERR_NETWORK' }; return { url: 'photo' } })
  h.queue.enqueue(file('a.jpg'), 'stop')
  await until(() => !h.queue.busy.value)
  assert.equal(attempts, 3)
  assert.equal(h.received.length, 1)
  for (const status of [400, 401, 403, 413, 415, 429]) {
    let calls = 0
    await assert.rejects(policy.retryTravelUpload(async () => { calls++; throw { response: { status } } }, new AbortController().signal))
    assert.equal(calls, 1)
  }
})

test('重试耗尽保留原文件，可以移除失败项解除保存阻挡', async () => {
  let attempts = 0
  const h = harness(async () => { attempts++; throw { code: 'ECONNABORTED' } })
  const original = file('original.jpg')
  h.queue.enqueue(original, 'stop')
  await until(() => !h.queue.busy.value)
  assert.equal(attempts, 3)
  assert.equal(h.queue.tasks[0].file, original)
  h.queue.remove(h.queue.tasks[0].id)
  assert.equal(h.queue.unresolved.value, false)
})

test('取消和删除片段后，即使服务器迟到成功也不能回填', async () => {
  const pending = deferred(); let signal
  const h = harness((_f, config) => { signal = config.signal; return pending.promise })
  h.queue.enqueue(file('old.jpg'), 'removed-stop')
  h.queue.remove(h.queue.tasks[0].id)
  assert.equal(signal.aborted, true)
  pending.resolve({ url: 'late' })
  await tick()
  assert.equal(h.received.length, 0)
})

test('切换草稿后旧上传不能污染新队列，卸载会中止请求', async () => {
  const pending = deferred(); const signals = []
  const h = harness((f, config) => { signals.push(config.signal); return f.name === 'old.jpg' ? pending.promise : Promise.resolve({ url: f.name }) })
  h.queue.enqueue(file('old.jpg'), 'old')
  h.queue.reset()
  h.queue.enqueue(file('new.jpg'), 'new')
  pending.resolve({ url: 'old' })
  await until(() => !h.queue.busy.value)
  assert.deepEqual(h.received, [{ url: 'new.jpg', target: 'new', cover: false }])
  assert.equal(signals[0].aborted, true)
  h.dispose()
  assert.equal(h.queue.tasks.length, 0)
})

test('常见 3–8 MB 原图被接受，空图、超限和 HEIC 提供明确提示', () => {
  const max = 12 * 1024 * 1024
  for (const size of [3, 8, 12]) assert.equal(policy.validateTravelPhoto({ name: 'photo.jpg', type: 'image/jpeg', size: size * 1024 * 1024 }, max), undefined)
  assert.match(policy.validateTravelPhoto({ name: 'photo.HEIC', type: 'image/heic', size: 10 }, max), /JPG/)
  assert.match(policy.validateTravelPhoto({ name: 'photo.jpg', size: 0 }, max), /为空/)
  assert.match(policy.validateTravelPhoto({ name: 'photo.jpg', size: max + 1 }, max), /12 MB/)
})
