import assert from 'node:assert/strict'
import test from 'node:test'
import * as vue from 'vue'
import { loadTypeScriptModule } from './helpers/load-typescript.mjs'

function loadModule(file, dependencies = {}, globals = {}) {
  return loadTypeScriptModule(new URL(file, import.meta.url), dependencies, globals)
}
const validation = loadModule('../src/utils/validation.ts')

test('email login validation accepts legacy usernames separately and bounds full emails', () => {
  assert.equal(validation.isValidUsername('chen_404'), true)
  assert.equal(validation.isValidEmail(' user+tag@example.com '), true)
  assert.equal(validation.isValidEmail('a'.repeat(60) + '@' + 'b'.repeat(35) + '.com'), true)
  assert.equal(validation.isValidEmail('a'.repeat(60) + '@' + 'b'.repeat(36) + '.com'), false)
  for (const value of ['', 'name@', 'a b@example.com', '@example.com']) assert.equal(validation.isValidEmail(value), false)
})

test('profile updates send explicit false privacy flags and only supported fields', async () => {
  let captured
  const api = loadModule('../src/api/auth.ts', {
    './request': { put: async (url, payload) => { captured = { url, payload }; return { id: 1 } } },
    '@/sdk/generated': { Service: {} }, '@/sdk/runtime': {}, '@/utils/authSession': {},
  })
  const result = await api.updateProfile({ nickname: 'Reader', avatar: '/avatar.png', bio: '', profileVisible: false, emailPublic: false, role: 'admin' })
  assert.equal(result.id, 1)
  assert.equal(captured.url, '/auth/profile')
  assert.deepEqual(JSON.parse(JSON.stringify(captured.payload)), { nickname: 'Reader', avatar: '/avatar.png', bio: '', profileVisible: false, emailPublic: false })
})

function codeHarness(type = 'register') {
  let now = 0, email = ' reader@example.com ', finish
  const timers = new Map(), requests = [], notices = [], failures = []
  const scope = vue.effectScope()
  const api = loadModule('../src/composables/useEmailVerificationCode.ts', {
    vue,
    '@/api/auth': { sendVerifyCode: data => { requests.push(data); return new Promise(resolve => { finish = resolve }) } },
    '@/lib/feedback': { notify: { success: text => notices.push(text), warning: text => notices.push(text) } },
    '@/utils/authFeedback': { notifyAuthFailure: (...args) => failures.push(args) },
    '@/utils/validation': validation,
  }, { Date: { now: () => now }, window: { setInterval: callback => { timers.set(1, callback); return 1 }, clearInterval: id => timers.delete(id) } })
  const state = scope.run(() => api.useEmailVerificationCode(type, () => email))
  return { state, timers, requests, notices, failures, close: () => scope.stop(), finish: value => finish(value), email: value => { email = value }, advance: milliseconds => { now += milliseconds; timers.get(1)?.() } }
}

test('verification sending is single-flight and uses elapsed time after timer throttling', async () => {
  const h = codeHarness('reset')
  const pending = h.state.send()
  await h.state.send()
  assert.equal(h.requests.length, 1)
  assert.deepEqual(JSON.parse(JSON.stringify(h.requests[0])), { email: 'reader@example.com', type: 'reset' })
  h.finish({ expireSeconds: 300 }); await pending
  assert.equal(h.state.remaining.value, 60)
  h.advance(23000)
  assert.equal(h.state.remaining.value, 37)
  await h.state.send(); assert.equal(h.requests.length, 1)
  h.advance(50000)
  assert.equal(h.state.remaining.value, 0)
  assert.equal(h.timers.size, 0)
  h.close()
})

test('disposing a form during the request never starts an orphan timer or displays a stale notice', async () => {
  const h = codeHarness()
  const pending = h.state.send()
  h.close()
  h.finish({ expireSeconds: 300 }); await pending
  assert.equal(h.state.sending.value, false)
  assert.equal(h.timers.size, 0)
  assert.equal(h.notices.length, 0)
  await h.state.send(); assert.equal(h.requests.length, 1)
})

test('invalid email makes no request and scope disposal clears a running cooldown', async () => {
  const h = codeHarness()
  h.email('invalid@'); await h.state.send()
  assert.equal(h.requests.length, 0)
  h.email('reader@example.com')
  const pending = h.state.send(); h.finish({ expireSeconds: Number.NaN }); await pending
  assert.equal(h.state.remaining.value, 60)
  h.close(); assert.equal(h.timers.size, 0)
})
