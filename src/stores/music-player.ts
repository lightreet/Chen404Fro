import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { notify } from '@/lib/feedback';
import {
  clearMusicPlayerState,
  getMusicPlayerState,
  getPublicMusicTracks,
  saveMusicPlayerState,
} from '@/api/music'
import { useUserStore } from '@/stores/user'
import type {
  MusicPlayerState,
  MusicPlayerStateCommand,
  MusicPlaylist,
  MusicTrack,
} from '@/types'

export type MusicPlayMode = MusicPlayerStateCommand['mode']

const STORAGE_VOLUME_KEY = 'chen404.music.volume'
const STORAGE_MODE_KEY = 'chen404.music.mode'
const STORAGE_GUEST_STATE_KEY = 'chen404.music.player-state.guest'
const PERSIST_DEBOUNCE_MS = 600
const PROGRESS_PERSIST_INTERVAL_SECONDS = 15
const MAX_QUEUE_SIZE = 200
const DEFAULT_VOLUME = 0.72
const DEFAULT_PLAY_MODE: MusicPlayMode = 'sequence'
const SUPPORTED_PLAY_MODES = new Set<MusicPlayMode>(['sequence', 'shuffle', 'single'])

interface MusicAudioRuntime {
  audio: HTMLAudioElement
  cleanup?: () => void
}

type MusicPlayerPersistenceScope = 'guest' | `user:${string}`

interface MusicPlayerPersistenceSnapshot {
  scope: MusicPlayerPersistenceScope
  state: MusicPlayerStateCommand
}

type MusicQueueEnqueueResult = 'added' | 'duplicate' | 'full' | 'unplayable'

declare global {
  interface Window {
    __chen404MusicAudioRuntime?: MusicAudioRuntime
  }
}

const sharedAudioRuntime = getMusicAudioRuntime()

export const useMusicPlayerStore = defineStore('music-player', () => {
  const userStore = useUserStore()
  const queue = ref<MusicTrack[]>([])
  const currentIndex = ref(-1)
  const currentPlaylist = ref<MusicPlaylist | null>(null)
  const playing = ref(false)
  const loading = ref(false)
  const duration = ref(0)
  const currentTime = ref(0)
  const isSeeking = ref(false)
  const seekPreviewTime = ref(0)
  const volume = ref(parseStoredVolume(window.localStorage.getItem(STORAGE_VOLUME_KEY)))
  const mode = ref<MusicPlayMode>(parsePlayMode(window.localStorage.getItem(STORAGE_MODE_KEY)))
  const audioRuntime = sharedAudioRuntime
  const audio = audioRuntime.audio
  let persistenceInitializedScope: MusicPlayerPersistenceScope | null = null
  let persistenceInitializing: Promise<void> | null = null
  let persistenceInitializingScope: MusicPlayerPersistenceScope | null = null
  let persistenceInitializationId = 0
  let persistenceTimer: number | null = null
  let persistenceWriteChain: Promise<void> = Promise.resolve()
  let lastProgressPersistTime = 0
  let pendingRestore: { trackId: number; time: number } | null = null
  audio.volume = Math.min(1, Math.max(0, volume.value))

  const currentTrack = computed(() => {
    if (currentIndex.value < 0) return null
    return queue.value[currentIndex.value] ?? null
  })

  const hasQueue = computed(() => queue.value.length > 0)
  const playbackTime = computed(() => (isSeeking.value ? seekPreviewTime.value : currentTime.value))

  audioRuntime.cleanup?.()

  const handleTimeUpdate = () => {
    if (isSeeking.value) return
    currentTime.value = audio.currentTime || 0
    if (Math.abs(currentTime.value - lastProgressPersistTime) >= PROGRESS_PERSIST_INTERVAL_SECONDS) {
      lastProgressPersistTime = currentTime.value
      schedulePersistence()
    }
  }

  const handleLoadedMetadata = () => {
    duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
    applyPendingRestore()
  }

  const handleEnded = () => {
    void next()
  }

  const handleError = () => {
    if (!currentTrack.value) return
    notify.warning('这首歌暂时播放不了，Lyra 帮你切到下一首')
    void next()
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      void flushPersistence()
    }
  }

  audio.addEventListener('timeupdate', handleTimeUpdate)
  audio.addEventListener('loadedmetadata', handleLoadedMetadata)
  audio.addEventListener('ended', handleEnded)
  audio.addEventListener('error', handleError)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  audioRuntime.cleanup = () => {
    audio.removeEventListener('timeupdate', handleTimeUpdate)
    audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    audio.removeEventListener('ended', handleEnded)
    audio.removeEventListener('error', handleError)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }

  function setQueue(
    tracks: MusicTrack[],
    playlist: MusicPlaylist | null = null,
    preferredTrackId?: number,
  ) {
    queue.value = normalizeQueueTracks(tracks, preferredTrackId)
    currentPlaylist.value = playlist
    if (!queue.value.length) {
      currentIndex.value = -1
      stop()
      schedulePersistence()
      return
    }
    if (currentIndex.value < 0 || currentIndex.value >= queue.value.length) {
      currentIndex.value = 0
    }
    schedulePersistence()
  }

  function enqueue(track: MusicTrack): MusicQueueEnqueueResult {
    if (!track.audioUrl) {
      return 'unplayable'
    }
    if (queue.value.some((item) => item.id === track.id)) {
      return 'duplicate'
    }
    if (queue.value.length >= MAX_QUEUE_SIZE) {
      return 'full'
    }
    queue.value.push(track)
    if (currentIndex.value < 0) {
      currentIndex.value = 0
    }
    schedulePersistence()
    return 'added'
  }

  function removeFromQueue(trackId: number) {
    const index = queue.value.findIndex((item) => item.id === trackId)
    if (index < 0 || index === currentIndex.value) {
      return false
    }

    queue.value.splice(index, 1)
    if (index < currentIndex.value) {
      currentIndex.value -= 1
    }
    schedulePersistence()
    return true
  }

  function clearUpcoming() {
    const track = currentTrack.value
    if (!track) {
      queue.value = []
      currentIndex.value = -1
      currentPlaylist.value = null
      schedulePersistence()
      return
    }
    queue.value = [track]
    currentIndex.value = 0
    currentPlaylist.value = null
    schedulePersistence()
  }

  async function loadPublicQueue() {
    loading.value = true
    try {
      const tracks = await getPublicMusicTracks()
      const publishedTracks = tracks.filter((track) => track.status === 'published' && track.audioUrl)
      await initializePersistence(publishedTracks)
      return publishedTracks
    } finally {
      loading.value = false
    }
  }

  async function playTrack(track: MusicTrack, tracks?: MusicTrack[], playlist?: MusicPlaylist | null) {
    if (currentTrack.value?.id === track.id && playing.value) return
    if (currentTrack.value?.id !== track.id) {
      pendingRestore = null
    }

    if (tracks?.length) {
      setQueue(tracks, playlist, track.id)
      const nextIndex = queue.value.findIndex((item) => item.id === track.id)
      currentIndex.value = nextIndex >= 0 ? nextIndex : 0
    } else if (!queue.value.some((item) => item.id === track.id)) {
      setQueue([track], playlist)
      currentIndex.value = 0
    } else {
      currentIndex.value = queue.value.findIndex((item) => item.id === track.id)
    }
    await playCurrent()
    schedulePersistence()
  }

  async function playCurrent() {
    const track = currentTrack.value
    if (!track?.audioUrl) {
      notify.info('音乐馆还没有可以播放的歌曲')
      return
    }
    const nextAudioSrc = resolveAudioSrc(track.audioUrl)
    if (audio.src !== nextAudioSrc) {
      audio.pause()
      audio.src = nextAudioSrc
      currentTime.value = 0
      duration.value = 0
      playing.value = false
      resetSeekState()
    }
    if (playing.value && !audio.paused) return

    await audio.play()
    playing.value = true
    schedulePersistence()
  }

  function pause() {
    audio.pause()
    playing.value = false
    void flushPersistence()
  }

  function stop() {
    audio.pause()
    playing.value = false
    currentTime.value = 0
    resetSeekState()
    schedulePersistence()
  }

  async function toggle() {
    if (playing.value) {
      pause()
      return
    }
    if (!hasQueue.value) {
      await loadPublicQueue()
    }
    await playCurrent()
    schedulePersistence()
  }

  async function next() {
    if (!queue.value.length) return
    if (mode.value === 'single') {
      audio.currentTime = 0
      await playCurrent()
      return
    }
    if (mode.value === 'shuffle' && queue.value.length > 1) {
      let nextIndex = currentIndex.value
      while (nextIndex === currentIndex.value) {
        nextIndex = Math.floor(Math.random() * queue.value.length)
      }
      currentIndex.value = nextIndex
    } else {
      currentIndex.value = (currentIndex.value + 1) % queue.value.length
    }
    await playCurrent()
    schedulePersistence()
  }

  async function previous() {
    if (!queue.value.length) return
    currentIndex.value = currentIndex.value <= 0 ? queue.value.length - 1 : currentIndex.value - 1
    await playCurrent()
  }

  function seek(value: number) {
    const nextValue = clampSeekValue(value)
    audio.currentTime = nextValue
    currentTime.value = nextValue
    seekPreviewTime.value = nextValue
    isSeeking.value = false
    lastProgressPersistTime = nextValue
    schedulePersistence(0)
  }

  function previewSeek(value: number) {
    isSeeking.value = true
    seekPreviewTime.value = clampSeekValue(value)
  }

  function cancelSeek() {
    resetSeekState()
  }

  function resetSeekState() {
    isSeeking.value = false
    seekPreviewTime.value = currentTime.value
  }

  function clampSeekValue(value: number) {
    if (!Number.isFinite(value)) {
      return 0
    }
    return Math.min(Math.max(0, value), Math.max(duration.value, 0))
  }

  function setVolume(value: number) {
    volume.value = normalizeVolume(value)
    audio.volume = volume.value
    window.localStorage.setItem(STORAGE_VOLUME_KEY, String(volume.value))
  }

  function setMode(value: MusicPlayMode) {
    mode.value = parsePlayMode(value)
    window.localStorage.setItem(STORAGE_MODE_KEY, mode.value)
    schedulePersistence()
  }

  async function initializePersistence(availableTracks?: MusicTrack[], force = false) {
    const scope = getPersistenceScope()
    if (persistenceInitializedScope === scope && !force) {
      return
    }
    if (persistenceInitializing && persistenceInitializingScope === scope && !force) {
      return persistenceInitializing
    }

    const initializationId = ++persistenceInitializationId
    persistenceInitializedScope = null
    persistenceInitializingScope = scope
    cancelPersistenceTimer()

    const initialization = (async () => {
      const trackRows = availableTracks ?? await getPublicMusicTracks()
      const playableTracks = trackRows.filter((track) => track.status === 'published' && Boolean(track.audioUrl))
      const storedState = await readPersistedState(scope)
      if (initializationId !== persistenceInitializationId || getPersistenceScope() !== scope) {
        return
      }
      const restored = storedState ? restorePlaybackState(playableTracks, storedState) : false

      if (!restored && (force || !hasQueue.value)) {
        setQueue(playableTracks, null)
        if (force) {
          resetPlaybackForScopeChange()
        }
      }

      persistenceInitializedScope = scope
      schedulePersistence(0)
    })().catch((error) => {
      if (initializationId !== persistenceInitializationId || getPersistenceScope() !== scope) {
        return
      }
      console.warn('[music-player] 播放现场恢复失败，已使用当前队列', error)
      persistenceInitializedScope = scope
    }).finally(() => {
      if (persistenceInitializing === initialization) {
        persistenceInitializing = null
        persistenceInitializingScope = null
      }
    })

    persistenceInitializing = initialization
    return persistenceInitializing
  }

  async function readPersistedState(scope: MusicPlayerPersistenceScope) {
    if (scope !== 'guest') {
      return getMusicPlayerState()
    }
    return readGuestState()
  }

  function readGuestState(): MusicPlayerState | null {
    const raw = window.localStorage.getItem(STORAGE_GUEST_STATE_KEY)
    if (!raw) return null
    try {
      const state = parseStoredPlayerState(JSON.parse(raw))
      if (state) return state
      window.localStorage.removeItem(STORAGE_GUEST_STATE_KEY)
      return null
    } catch {
      window.localStorage.removeItem(STORAGE_GUEST_STATE_KEY)
      return null
    }
  }

  function restorePlaybackState(availableTracks: MusicTrack[], state: MusicPlayerState) {
    if (!Array.isArray(state.trackIds)) return false

    const trackMap = new Map(availableTracks.map((track) => [track.id, track]))
    const restoredQueue = Array.from(new Set(state.trackIds))
      .slice(0, MAX_QUEUE_SIZE)
      .map((trackId) => trackMap.get(trackId))
      .filter((track): track is MusicTrack => Boolean(track?.audioUrl))

    if (!restoredQueue.length) return false

    queue.value = restoredQueue
    currentPlaylist.value = null
    const restoredIndex = restoredQueue.findIndex((track) => track.id === state.currentTrackId)
    currentIndex.value = restoredIndex >= 0 ? restoredIndex : 0
    mode.value = parsePlayMode(state.mode)
    window.localStorage.setItem(STORAGE_MODE_KEY, mode.value)
    restoreAudioPosition(currentTrack.value, state.currentTime)
    return true
  }

  function restoreAudioPosition(track: MusicTrack | null, value: number) {
    if (!track?.audioUrl) return

    const restoredTime = Number.isFinite(value) && value > 0 ? value : 0
    const nextAudioSrc = resolveAudioSrc(track.audioUrl)
    audio.pause()
    playing.value = false
    pendingRestore = { trackId: track.id, time: restoredTime }
    currentTime.value = restoredTime
    seekPreviewTime.value = restoredTime
    lastProgressPersistTime = restoredTime
    if (audio.src !== nextAudioSrc) {
      audio.src = nextAudioSrc
      duration.value = 0
      audio.load()
    }
    applyPendingRestore()
  }

  function applyPendingRestore() {
    if (!pendingRestore || currentTrack.value?.id !== pendingRestore.trackId || audio.readyState < 1) {
      return
    }
    const restoredTime = Math.min(
      pendingRestore.time,
      Number.isFinite(audio.duration) ? Math.max(audio.duration, 0) : pendingRestore.time,
    )
    audio.currentTime = restoredTime
    currentTime.value = restoredTime
    seekPreviewTime.value = restoredTime
    pendingRestore = null
  }

  function schedulePersistence(delay = PERSIST_DEBOUNCE_MS) {
    if (persistenceInitializedScope !== getPersistenceScope()) return
    cancelPersistenceTimer()
    persistenceTimer = window.setTimeout(() => {
      persistenceTimer = null
      void persistState()
    }, delay)
  }

  async function flushPersistence() {
    if (persistenceInitializedScope !== getPersistenceScope()) return
    cancelPersistenceTimer()
    await persistState()
  }

  function persistState() {
    const scope = getPersistenceScope()
    if (persistenceInitializedScope !== scope) {
      return Promise.resolve()
    }
    const snapshot: MusicPlayerPersistenceSnapshot = {
      scope,
      state: createPlayerState(),
    }
    persistenceWriteChain = persistenceWriteChain
      .catch(() => undefined)
      .then(() => writePersistedState(snapshot))
    return persistenceWriteChain
  }

  async function writePersistedState(snapshot: MusicPlayerPersistenceSnapshot) {
    if (getPersistenceScope() !== snapshot.scope) {
      return
    }
    const { state } = snapshot
    try {
      if (snapshot.scope !== 'guest') {
        if (state.trackIds.length) {
          await saveMusicPlayerState(state)
        } else {
          await clearMusicPlayerState()
        }
        return
      }

      if (state.trackIds.length) {
        window.localStorage.setItem(STORAGE_GUEST_STATE_KEY, JSON.stringify(state))
      } else {
        window.localStorage.removeItem(STORAGE_GUEST_STATE_KEY)
      }
    } catch (error) {
      console.warn('[music-player] 播放现场同步失败，当前播放不受影响', error)
    }
  }

  function createPlayerState(): MusicPlayerStateCommand {
    return {
      trackIds: queue.value.slice(0, MAX_QUEUE_SIZE).map((track) => track.id),
      currentTrackId: currentTrack.value?.id,
      currentTime: Math.max(0, Number(currentTime.value.toFixed(2))),
      mode: mode.value,
    }
  }

  function resolveAudioSrc(url: string) {
    try {
      return new URL(url, window.location.href).href
    } catch {
      return url
    }
  }

  function getPersistenceScope(): MusicPlayerPersistenceScope {
    if (!userStore.isLoggedIn || userStore.user?.id == null) {
      return 'guest'
    }
    return `user:${String(userStore.user.id)}`
  }

  function cancelPersistenceTimer() {
    if (persistenceTimer == null) return
    window.clearTimeout(persistenceTimer)
    persistenceTimer = null
  }

  function resetPlaybackForScopeChange() {
    audio.pause()
    playing.value = false
    pendingRestore = null
    currentIndex.value = queue.value.length ? 0 : -1
    currentTime.value = 0
    duration.value = 0
    lastProgressPersistTime = 0
    resetSeekState()
  }

  watch(
    getPersistenceScope,
    (scope, previousScope) => {
      if (scope === previousScope) return
      cancelPersistenceTimer()
      persistenceInitializedScope = null
      void initializePersistence(undefined, true)
    },
  )

  return {
    queue,
    currentIndex,
    currentPlaylist,
    currentTrack,
    playing,
    loading,
    duration,
    currentTime,
    playbackTime,
    isSeeking,
    volume,
    mode,
    audio,
    hasQueue,
    setQueue,
    enqueue,
    removeFromQueue,
    clearUpcoming,
    loadPublicQueue,
    playTrack,
    playCurrent,
    pause,
    toggle,
    next,
    previous,
    previewSeek,
    seek,
    cancelSeek,
    setVolume,
    setMode,
    initializePersistence,
    flushPersistence,
  }
})

function getMusicAudioRuntime() {
  if (!window.__chen404MusicAudioRuntime) {
    window.__chen404MusicAudioRuntime = {
      audio: new Audio(),
    }
  }
  return window.__chen404MusicAudioRuntime
}

function parseStoredVolume(raw: string | null) {
  if (raw == null || raw.trim() === '') {
    return DEFAULT_VOLUME
  }
  return normalizeVolume(Number(raw))
}

function normalizeVolume(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_VOLUME
  }
  return Math.min(1, Math.max(0, value))
}

function parsePlayMode(value: unknown): MusicPlayMode {
  return typeof value === 'string' && SUPPORTED_PLAY_MODES.has(value as MusicPlayMode)
    ? value as MusicPlayMode
    : DEFAULT_PLAY_MODE
}

function parseStoredPlayerState(value: unknown): MusicPlayerState | null {
  if (!isRecord(value) || !Array.isArray(value.trackIds)) {
    return null
  }

  const trackIds = Array.from(new Set(
    value.trackIds.filter((trackId): trackId is number => (
      typeof trackId === 'number'
      && Number.isSafeInteger(trackId)
      && trackId > 0
    )),
  )).slice(0, MAX_QUEUE_SIZE)
  const currentTrackId = typeof value.currentTrackId === 'number' && trackIds.includes(value.currentTrackId)
    ? value.currentTrackId
    : trackIds[0]
  const currentTime = typeof value.currentTime === 'number' && Number.isFinite(value.currentTime)
    ? Math.max(0, value.currentTime)
    : 0

  return {
    trackIds,
    currentTrackId,
    currentTime,
    mode: parsePlayMode(value.mode),
  }
}

function normalizeQueueTracks(tracks: MusicTrack[], preferredTrackId?: number) {
  const seenTrackIds = new Set<number>()
  const playableTracks = tracks.filter((track) => {
    if (!track.audioUrl || seenTrackIds.has(track.id)) {
      return false
    }
    seenTrackIds.add(track.id)
    return true
  })
  if (playableTracks.length <= MAX_QUEUE_SIZE) {
    return playableTracks
  }

  const preferredIndex = preferredTrackId == null
    ? -1
    : playableTracks.findIndex((track) => track.id === preferredTrackId)
  if (preferredIndex < 0) {
    return playableTracks.slice(0, MAX_QUEUE_SIZE)
  }

  const halfWindow = Math.floor(MAX_QUEUE_SIZE / 2)
  const startIndex = Math.min(
    Math.max(0, preferredIndex - halfWindow),
    playableTracks.length - MAX_QUEUE_SIZE,
  )
  return playableTracks.slice(startIndex, startIndex + MAX_QUEUE_SIZE)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
