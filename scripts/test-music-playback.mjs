import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'
import * as vue from 'vue'

const source = readFileSync(new URL('../src/stores/music-player.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const tracks = [1, 2].map(id => ({ id, title: `Track ${id}`, status: 'published', audioUrl: `/audio-${id}.mp3` }))

function harness(saved = null) {
  const messages = [], storage = new Map(), listeners = new Map()
  if (saved) storage.set('chen404.music.player-state.guest', JSON.stringify(saved))
  const audio = {
    src: '', volume: 1, currentTime: 0, duration: 120, readyState: 0, paused: true, error: null,
    playCalls: 0, loadCalls: 0, playResult: () => Promise.resolve(),
    play() { this.playCalls++; this.paused = false; return this.playResult() },
    pause() { this.paused = true }, load() { this.loadCalls++ },
    addEventListener(name, handler) { listeners.set(name, handler) },
    removeEventListener(name) { listeners.delete(name) },
  }
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }
  const scope = vue.effectScope()
  const module = { exports: {} }
  vm.runInNewContext(compiled, {
    module, exports: module.exports, URL, console,
    Audio: function() { return audio },
    window: { localStorage, location: { href: 'http://localhost:20204/' }, setTimeout: () => 1, clearTimeout() {} },
    document: { addEventListener() {}, removeEventListener() {}, visibilityState: 'visible' },
    require(name) {
      if (name === 'vue') return vue
      if (name === 'pinia') return { defineStore: (_name, setup) => () => setup() }
      if (name === '@/lib/feedback') return { notify: Object.fromEntries(['info', 'warning', 'error', 'success'].map(key => [key, text => messages.push({ key, text })])) }
      if (name === '@/stores/user') return { useUserStore: () => ({ isLoggedIn: false, user: null }) }
      if (name === '@/api/music') return { getPublicMusicTracks: async () => tracks, getMusicPlayerState: async () => null, saveMusicPlayerState: async () => {}, clearMusicPlayerState: async () => {} }
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const state = scope.run(() => module.exports.useMusicPlayerStore())
  return { state, audio, messages, emit: name => listeners.get(name)?.(), close: () => scope.stop() }
}

test('failed metadata restoration stays paused and does not start cycling the queue', async () => {
  const h = harness({ trackIds: [1, 2], currentTrackId: 1, currentTime: 30, mode: 'sequence' })
  await h.state.initializePersistence()
  h.emit('error')
  assert.equal(h.audio.playCalls, 0)
  assert.equal(h.state.currentTrack.value.id, 1)
  assert.equal(h.state.playing.value, false)
  assert.equal(h.messages.length, 0)
  h.close()
})

test('a rejected play request gives one actionable message and no unhandled rejection', async () => {
  const h = harness()
  h.audio.playResult = () => Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }))
  await assert.doesNotReject(h.state.playTrack(tracks[0], tracks))
  assert.equal(h.state.playing.value, false)
  assert.equal(h.messages.length, 1)
  assert.equal(h.audio.playCalls, 1)
  h.close()
})

test('pausing before play settles must not restore the playing state', async () => {
  const h = harness()
  let finish
  h.audio.playResult = () => new Promise(resolve => { finish = resolve })
  const pending = h.state.playTrack(tracks[0], tracks)
  h.state.pause()
  finish()
  await pending
  assert.equal(h.state.playing.value, false)
  h.close()
})

test('audio error and rejected play promise report the same failure only once', async () => {
  const h = harness()
  let rejectPlay
  h.audio.playResult = () => new Promise((_resolve, reject) => { rejectPlay = reject })
  const pending = h.state.playTrack(tracks[0], tracks)
  h.emit('error')
  rejectPlay(Object.assign(new Error('missing media'), { name: 'NotSupportedError' }))
  await assert.doesNotReject(pending)
  assert.equal(h.messages.length, 1)
  assert.equal(h.audio.playCalls, 1)
  assert.equal(h.state.currentTrack.value.id, 1)
  assert.equal(h.state.playing.value, false)
  h.close()
})

test('playing the current song from a new list updates the queue without restarting it', async () => {
  const h = harness()
  await h.state.playTrack(tracks[0], tracks)
  await h.state.playTrack(tracks[0], [tracks[0]])
  assert.deepEqual(Array.from(h.state.queue.value, track => track.id), [1])
  assert.equal(h.audio.playCalls, 1)
  assert.equal(h.state.playing.value, true)
  h.close()
})

const song = id => ({ id, title: `Track ${id}`, status: 'published', audioUrl: `/audio-${id}.mp3` })
const queueIds = h => Array.from(h.state.queue.value, track => track.id)

test('playing a new song preserves the songs already waiting in the queue', async () => {
  const h = harness()
  await h.state.playTrack(tracks[0], tracks)
  h.state.enqueue(song(3))
  await h.state.playTrack(song(4))
  assert.deepEqual(queueIds(h), [1, 4, 2, 3])
  assert.equal(h.state.currentTrack.value.id, 4)
  h.close()
})

test('playing a queued song brings it forward without skipping other waiting songs', async () => {
  const h = harness()
  await h.state.playTrack(tracks[0], [...tracks, song(3)])
  await h.state.playTrack(song(3))
  assert.deepEqual(queueIds(h), [1, 3, 2])
  await h.state.next()
  assert.equal(h.state.currentTrack.value.id, 2)
  h.close()
})

test('replaying an earlier song preserves the current song and the pending order', async () => {
  const h = harness()
  await h.state.playTrack(tracks[1], [...tracks, song(3)])
  await h.state.playTrack(tracks[0])
  assert.deepEqual(queueIds(h), [2, 1, 3])
  assert.equal(h.state.currentTrack.value.id, 1)
  await h.state.playTrack(tracks[0])
  assert.equal(h.audio.playCalls, 2)
  h.close()
})

test('browsing the catalog does not silently add the entire catalog to the queue', async () => {
  const h = harness()
  await h.state.initializePersistence()
  assert.deepEqual(queueIds(h), [])
  assert.equal(h.state.currentTrack.value, null)
  assert.equal(h.audio.playCalls, 0)
  h.close()
})

test('adding the first song stays pending, can be undone, and does not start playback', async () => {
  const h = harness()
  assert.equal(h.state.enqueue(tracks[0]), 'added')
  assert.equal(h.state.currentTrack.value, null)
  assert.equal(h.audio.playCalls, 0)
  assert.equal(h.state.enqueue(tracks[0]), 'duplicate')
  assert.equal(h.state.removeFromQueue(tracks[0].id), true)
  assert.deepEqual(queueIds(h), [])
  h.state.enqueue(tracks[1])
  await h.state.toggle()
  assert.equal(h.state.currentTrack.value.id, 2)
  assert.equal(h.state.playing.value, true)
  h.close()
})

test('restoring songs that were only queued does not select or load a song', async () => {
  const h = harness({ trackIds: [2, 1], currentTime: 0, mode: 'sequence' })
  await h.state.initializePersistence()
  assert.deepEqual(queueIds(h), [2, 1])
  assert.equal(h.state.currentTrack.value, null)
  assert.equal(h.audio.loadCalls, 0)
  await h.state.next()
  assert.equal(h.state.currentTrack.value.id, 2)
  assert.equal(h.state.playing.value, true)
  h.close()
})

test('reordering pending songs does not move the current song or restart playback', async () => {
  const h = harness()
  await h.state.playTrack(tracks[0], [...tracks, song(3)])
  assert.equal(h.state.moveUpcoming(3, -1), true)
  assert.deepEqual(queueIds(h), [1, 3, 2])
  assert.equal(h.state.moveUpcoming(3, -1), false)
  assert.equal(h.state.moveUpcoming(1, 1), false)
  assert.equal(h.state.moveUpcoming(2, 1), false)
  assert.equal(h.state.currentTrack.value.id, 1)
  assert.equal(h.audio.playCalls, 1)
  h.state.clearUpcoming()
  assert.deepEqual(queueIds(h), [1])
  assert.equal(h.state.playing.value, true)
  await h.state.playTrack(song(4))
  h.state.enqueue(song(5))
  h.state.clearUpcoming()
  assert.deepEqual(queueIds(h), [1, 4])
  assert.equal(h.state.currentTrack.value.id, 4)
  assert.equal(h.state.playing.value, true)
  h.close()
})

test('unplayable songs and a full queue cannot destroy the current listening session', async () => {
  const h = harness()
  const fullQueue = Array.from({ length: 200 }, (_, i) => song(i + 1))
  await h.state.playTrack(fullQueue[0], fullQueue)
  await h.state.playTrack({ ...song(201), audioUrl: '' })
  assert.equal(h.state.currentTrack.value.id, 1)
  await h.state.playTrack(song(201))
  assert.deepEqual(queueIds(h), fullQueue.map(track => track.id))
  assert.equal(h.state.currentTrack.value.id, 1)
  assert.equal(h.audio.playCalls, 1)
  h.close()
})
