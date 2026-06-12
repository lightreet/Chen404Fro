import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { notify } from '@/lib/feedback';
import { getPublicMusicTracks } from '@/api/music'
import type { MusicPlaylist, MusicTrack } from '@/types'

export type MusicPlayMode = 'sequence' | 'shuffle' | 'single'

const STORAGE_VOLUME_KEY = 'chen404.music.volume'
const STORAGE_MODE_KEY = 'chen404.music.mode'

interface MusicAudioRuntime {
  audio: HTMLAudioElement
  cleanup?: () => void
}

declare global {
  interface Window {
    __chen404MusicAudioRuntime?: MusicAudioRuntime
  }
}

const sharedAudioRuntime = getMusicAudioRuntime()

export const useMusicPlayerStore = defineStore('music-player', () => {
  const queue = ref<MusicTrack[]>([])
  const currentIndex = ref(-1)
  const currentPlaylist = ref<MusicPlaylist | null>(null)
  const playing = ref(false)
  const loading = ref(false)
  const duration = ref(0)
  const currentTime = ref(0)
  const isSeeking = ref(false)
  const seekPreviewTime = ref(0)
  const volume = ref(Number(window.localStorage.getItem(STORAGE_VOLUME_KEY) ?? '0.72'))
  const mode = ref<MusicPlayMode>((window.localStorage.getItem(STORAGE_MODE_KEY) as MusicPlayMode) || 'sequence')
  const audioRuntime = sharedAudioRuntime
  const audio = audioRuntime.audio
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
  }

  const handleLoadedMetadata = () => {
    duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
  }

  const handleEnded = () => {
    void next()
  }

  const handleError = () => {
    if (!currentTrack.value) return
    notify.warning('这首歌暂时播放不了，Lyra 帮你切到下一首')
    void next()
  }

  audio.addEventListener('timeupdate', handleTimeUpdate)
  audio.addEventListener('loadedmetadata', handleLoadedMetadata)
  audio.addEventListener('ended', handleEnded)
  audio.addEventListener('error', handleError)
  audioRuntime.cleanup = () => {
    audio.removeEventListener('timeupdate', handleTimeUpdate)
    audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    audio.removeEventListener('ended', handleEnded)
    audio.removeEventListener('error', handleError)
  }

  function setQueue(tracks: MusicTrack[], playlist: MusicPlaylist | null = null) {
    queue.value = tracks.filter((track) => Boolean(track.audioUrl))
    currentPlaylist.value = playlist
    if (!queue.value.length) {
      currentIndex.value = -1
      stop()
      return
    }
    if (currentIndex.value < 0 || currentIndex.value >= queue.value.length) {
      currentIndex.value = 0
    }
  }

  async function loadPublicQueue() {
    loading.value = true
    try {
      const tracks = await getPublicMusicTracks()
      const publishedTracks = tracks.filter((track) => track.status === 'published' && track.audioUrl)
      setQueue(publishedTracks, null)
      return publishedTracks
    } finally {
      loading.value = false
    }
  }

  async function playTrack(track: MusicTrack, tracks?: MusicTrack[], playlist?: MusicPlaylist | null) {
    if (currentTrack.value?.id === track.id && playing.value) return

    if (tracks?.length) {
      setQueue(tracks, playlist)
      const nextIndex = queue.value.findIndex((item) => item.id === track.id)
      currentIndex.value = nextIndex >= 0 ? nextIndex : 0
    } else if (!queue.value.some((item) => item.id === track.id)) {
      setQueue([track], playlist)
      currentIndex.value = 0
    } else {
      currentIndex.value = queue.value.findIndex((item) => item.id === track.id)
    }
    await playCurrent()
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
  }

  function pause() {
    audio.pause()
    playing.value = false
  }

  function stop() {
    audio.pause()
    playing.value = false
    currentTime.value = 0
    resetSeekState()
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
    volume.value = Math.min(1, Math.max(0, value))
    audio.volume = volume.value
    window.localStorage.setItem(STORAGE_VOLUME_KEY, String(volume.value))
  }

  function setMode(value: MusicPlayMode) {
    mode.value = value
    window.localStorage.setItem(STORAGE_MODE_KEY, value)
  }

  function resolveAudioSrc(url: string) {
    try {
      return new URL(url, window.location.href).href
    } catch {
      return url
    }
  }

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
