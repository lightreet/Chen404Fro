import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { getDefaultRadio } from '@/api/music'
import type { MusicPlaylist, MusicTrack } from '@/types'

export type MusicPlayMode = 'sequence' | 'shuffle' | 'single'

const STORAGE_VOLUME_KEY = 'chen404.music.volume'
const STORAGE_MODE_KEY = 'chen404.music.mode'

export const useMusicPlayerStore = defineStore('music-player', () => {
  const queue = ref<MusicTrack[]>([])
  const currentIndex = ref(-1)
  const currentPlaylist = ref<MusicPlaylist | null>(null)
  const playing = ref(false)
  const loading = ref(false)
  const duration = ref(0)
  const currentTime = ref(0)
  const volume = ref(Number(window.localStorage.getItem(STORAGE_VOLUME_KEY) ?? '0.72'))
  const mode = ref<MusicPlayMode>((window.localStorage.getItem(STORAGE_MODE_KEY) as MusicPlayMode) || 'sequence')
  const audio = new Audio()
  audio.volume = Math.min(1, Math.max(0, volume.value))

  const currentTrack = computed(() => {
    if (currentIndex.value < 0) return null
    return queue.value[currentIndex.value] ?? null
  })

  const hasQueue = computed(() => queue.value.length > 0)

  audio.addEventListener('timeupdate', () => {
    currentTime.value = audio.currentTime || 0
  })

  audio.addEventListener('loadedmetadata', () => {
    duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
  })

  audio.addEventListener('ended', () => {
    void next()
  })

  audio.addEventListener('error', () => {
    if (!currentTrack.value) return
    ElMessage.warning('这首歌暂时播放不了，Lyra 帮你切到下一首')
    void next()
  })

  function setQueue(tracks: MusicTrack[], playlist?: MusicPlaylist | null) {
    queue.value = tracks.filter((track) => Boolean(track.audioUrl))
    currentPlaylist.value = playlist ?? currentPlaylist.value
    if (!queue.value.length) {
      currentIndex.value = -1
      stop()
      return
    }
    if (currentIndex.value < 0 || currentIndex.value >= queue.value.length) {
      currentIndex.value = 0
    }
  }

  async function loadDefaultRadio() {
    loading.value = true
    try {
      const radio = await getDefaultRadio()
      setQueue(radio.tracks ?? [], radio)
      return radio
    } finally {
      loading.value = false
    }
  }

  async function playTrack(track: MusicTrack, tracks?: MusicTrack[], playlist?: MusicPlaylist | null) {
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
      ElMessage.info('Sakura Radio 还没有可以播放的歌曲')
      return
    }
    if (audio.src !== track.audioUrl) {
      audio.src = track.audioUrl
      currentTime.value = 0
      duration.value = 0
    }
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
  }

  async function toggle() {
    if (playing.value) {
      pause()
      return
    }
    if (!hasQueue.value) {
      await loadDefaultRadio()
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
    audio.currentTime = value
    currentTime.value = value
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

  return {
    queue,
    currentIndex,
    currentPlaylist,
    currentTrack,
    playing,
    loading,
    duration,
    currentTime,
    volume,
    mode,
    hasQueue,
    setQueue,
    loadDefaultRadio,
    playTrack,
    playCurrent,
    pause,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    setMode,
  }
})
