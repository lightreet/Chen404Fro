<template>
  <div class="mobile-music">
    <UiLoadingState :loading="loading" message="正在加载音乐…">
      <UiEmpty v-if="error" title="音乐暂时未能加载" :description="error" icon="music"><template #action><UiButton @click="emit('retry')">重新加载</UiButton></template></UiEmpty>
      <template v-else-if="fullscreen">
        <div v-if="player.currentTrack" class="full-player">
          <section class="full-player__playback" aria-label="播放控制">
            <div class="full-player__controls">
              <button class="app-mobile-icon" type="button" :aria-label="`播放模式：${modeLabel}，点击切换`" :title="modeLabel" @click="cycleMode"><UiIcon :name="modeIcon" :size="24" /></button>
              <button class="app-mobile-icon" type="button" aria-label="上一首" @click="emit('previous')"><UiIcon name="skip-previous" :size="30" /></button>
              <button class="full-player__play" type="button" :aria-label="player.playing ? '暂停' : '播放'" @click="emit('toggle')"><UiIcon :name="player.playing ? 'pause' : 'play'" :size="34" /></button>
              <button class="app-mobile-icon" type="button" aria-label="下一首" @click="emit('next')"><UiIcon name="skip-next" :size="30" /></button>
              <button class="app-mobile-icon" type="button" aria-label="播放队列" @click="queueOpen = true"><UiIcon name="list" :size="24" /></button>
            </div>
            <UiSlider :model-value="player.playbackTime" :max="player.duration || 1" :disabled="!player.duration" :show-tooltip="false" aria-label="播放进度" @input="previewSeek" @change="seek" />
            <div class="full-player__time"><span>{{ formatTime(player.playbackTime) }}</span><span>{{ formatTime(player.duration) }}</span></div>
          </section>

          <div class="full-player__heading">
            <div><h1>{{ player.currentTrack.title }}</h1><p>{{ player.currentTrack.artist }}</p></div>
            <button class="app-mobile-icon" type="button" aria-label="歌曲更多操作" @click="selectedTrack = player.currentTrack"><UiIcon name="more" :size="24" /></button>
          </div>
          <div class="full-player__stage">
            <button
              v-if="!lyricsVisible"
              ref="coverButton"
              class="full-player__cover"
              type="button"
              aria-label="显示歌词"
              @click="lyricsVisible = true"
            >
              <img v-if="player.currentTrack.coverUrl" :src="player.currentTrack.coverUrl" :alt="player.currentTrack.title" />
              <UiIcon v-else name="music" :size="72" />
            </button>
            <div
              v-else
              ref="lyricContainer"
              class="mobile-lyrics"
              role="button"
              tabindex="0"
              aria-label="歌词，点击返回封面"
              @click="lyricsVisible = false"
              @keydown.enter.prevent="lyricsVisible = false"
              @keydown.space.prevent="lyricsVisible = false"
            >
              <p v-for="line in lyrics" :key="line.key" :class="{ active: line.current }">{{ line.text }}</p>
              <UiEmpty v-if="!lyrics.length" title="这首歌暂时没有歌词" icon="music" size="sm" />
            </div>
          </div>
        </div>
        <UiEmpty v-else title="还没有正在播放的歌曲" description="先从音乐馆选一首喜欢的歌。" icon="music"><template #action><UiButton @click="router.replace('/music')">去选歌</UiButton></template></UiEmpty>
      </template>
      <template v-else>
        <UiInput v-model="keyword" clearable prefix-icon="search" placeholder="搜索歌曲、歌手或专辑" aria-label="搜索歌曲、歌手或专辑" />
        <div class="music-categories" aria-label="音乐分类">
          <button type="button" :class="{ active: categoryId === null }" :aria-pressed="categoryId === null" @click="categoryId = null">全部</button>
          <button v-for="category in categories" :key="category.id ?? category.name" type="button" :class="{ active: categoryId === category.id }" :aria-pressed="categoryId === category.id" @click="categoryId = category.id ?? null">{{ category.name }}</button>
        </div>
        <div class="music-list-heading"><h2>{{ category?.name || '全部歌曲' }} <small>{{ tracks.length }}</small></h2><UiButton variant="text" icon="play" :disabled="!tracks.some(track => track.audioUrl)" @click="emit('playAll')">播放全部</UiButton></div>
        <div v-if="tracks.length" class="song-list">
          <article v-for="track in visibleTracks" :key="track.id" class="song-row" :class="{ active: player.currentTrack?.id === track.id }">
            <button class="song-row__play" type="button" :aria-label="`${player.currentTrack?.id === track.id && player.playing ? '打开播放器' : '播放'} ${track.title}`" :disabled="!track.audioUrl" @click="emit('play', track)">
              <span class="song-row__cover"><img v-if="track.coverUrl" :src="track.coverUrl" alt="" loading="lazy" /><UiIcon v-else name="music" :size="24" /></span>
              <span class="song-row__copy"><strong>{{ track.title }}</strong><small>{{ track.artist }}<template v-if="track.album"> · {{ track.album }}</template></small><small v-if="track.status !== 'published'">{{ track.status === 'draft' ? '草稿' : '已归档' }}</small></span>
              <UiIcon v-if="player.currentTrack?.id === track.id && player.playing" name="music" :size="20" />
            </button>
            <button class="app-mobile-icon" type="button" :aria-label="`${track.title}的更多操作`" @click="selectedTrack = track"><UiIcon name="more" :size="24" /></button>
          </article>
        </div>
        <UiEmpty v-else title="没有找到歌曲" description="换个关键词或分类试试。" icon="music" />
        <UiButton v-if="visibleCount < tracks.length" class="load-more" block @click="visibleCount += 20">加载更多</UiButton>
      </template>
    </UiLoadingState>
    <UiDialog v-model="queueOpen" title="播放队列">
      <p class="sheet-meta">{{ player.queue.length }} 首歌曲</p>
      <div class="queue-list">
        <div v-for="track in player.queue" :key="track.id" class="queue-row" :class="{ active: player.currentTrack?.id === track.id }">
          <button type="button" @click="selectQueuedTrack(track)">
            <strong>{{ track.title }}</strong><small>{{ track.artist }}</small>
          </button>
          <button
            v-if="player.currentTrack?.id !== track.id"
            class="app-mobile-icon"
            type="button"
            :aria-label="`移除 ${track.title}`"
            @click="player.removeFromQueue(track.id)"
          ><UiIcon name="close" :size="20" /></button>
        </div>
      </div>
      <UiEmpty v-if="!player.queue.length" title="队列还是空的" icon="music" size="sm" />
    </UiDialog>
    <UiDialog :model-value="Boolean(selectedTrack)" :title="selectedTrack?.title || '歌曲详情'" @update:model-value="!$event && (selectedTrack = null)">
      <template v-if="selectedTrack">
        <p class="sheet-meta">{{ selectedTrack.artist }}<template v-if="selectedTrack.album"> · {{ selectedTrack.album }}</template></p>
        <p v-if="selectedTrack.recommendation" class="song-description">{{ selectedTrack.recommendation }}</p>
        <div class="song-actions">
          <UiButton icon="list" @click="enqueueSelected">加入播放队列</UiButton>
          <UiButton v-if="canEdit(selectedTrack)" icon="edit" @click="editSelected">编辑歌曲</UiButton>
          <UiButton v-if="selectedTrack.canDelete" variant="danger" icon="delete" @click="deleteSelected">删除歌曲</UiButton>
        </div>
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { UiButton, UiDialog, UiEmpty, UiIcon, UiInput, UiLoadingState, UiSlider } from '@/components/ui'
import { useMusicPlayerStore } from '@/stores/music-player'
import type { MusicPlaylist, MusicTrack } from '@/types'

const props = defineProps<{
  tracks: MusicTrack[];
  categories: MusicPlaylist[];
  fullscreen: boolean;
  loading: boolean;
  error: string;
  lyrics: Array<{ key: string; text: string; current: boolean }>;
  canEdit: (track: MusicTrack) => boolean;
}>()
const keyword = defineModel<string>('keyword', { required: true })
const categoryId = defineModel<number | null>('categoryId', { required: true })
const emit = defineEmits<{
  play: [MusicTrack];
  playQueued: [MusicTrack];
  enqueue: [MusicTrack];
  edit: [MusicTrack];
  delete: [MusicTrack];
  previous: [];
  next: [];
  toggle: [];
  retry: [];
  playAll: [];
}>()
const player = useMusicPlayerStore()
const router = useRouter()
const queueOpen = ref(false)
const lyricsVisible = ref(false)
const selectedTrack = ref<MusicTrack | null>(null)
const lyricContainer = ref<HTMLElement>()
const coverButton = ref<HTMLButtonElement>()
const visibleCount = ref(20)
const visibleTracks = computed(() => props.tracks.slice(0, visibleCount.value))
const category = computed(() => props.categories.find(item => item.id === categoryId.value))
const modeLabel = computed(() => ({ sequence: '顺序播放', shuffle: '随机播放', single: '单曲循环' }[player.mode]))
const modeIcon = computed(() => ({ sequence: 'sequence-play', shuffle: 'shuffle', single: 'repeat-one' }[player.mode]))
watch([keyword, categoryId], () => { visibleCount.value = 20 })
watch(() => props.fullscreen, () => { lyricsVisible.value = false; queueOpen.value = false })
watch(lyricsVisible, async (visible) => {
  await nextTick()
  if (props.fullscreen) (visible ? lyricContainer.value : coverButton.value)?.focus({ preventScroll: true })
})
watch([lyricsVisible, () => player.currentTrack?.id, () => props.lyrics.find(line => line.current)?.key], async () => {
  if (!lyricsVisible.value) return
  await nextTick()
  const container = lyricContainer.value
  const line = container?.querySelector<HTMLElement>('.active')
  if (container && line) {
    container.scrollTop += line.getBoundingClientRect().top - container.getBoundingClientRect().top
      - container.clientHeight / 2 + line.clientHeight / 2
  } else if (container) container.scrollTop = 0
})
function selectQueuedTrack(track: MusicTrack) {
  emit('playQueued', track)
  queueOpen.value = false
}
function cycleMode() {
  player.setMode(player.mode === 'sequence' ? 'shuffle' : player.mode === 'shuffle' ? 'single' : 'sequence')
}
function seek(value: number | number[]) {
  player.seek(Array.isArray(value) ? value[0] : value)
}
function previewSeek(value: number | number[]) {
  player.previewSeek(Array.isArray(value) ? value[0] : value)
}
function formatTime(value: number) {
  const seconds = Math.max(0, Math.floor(value || 0))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
function enqueueSelected() {
  if (selectedTrack.value) emit('enqueue', selectedTrack.value)
  selectedTrack.value = null
}
function editSelected() {
  if (selectedTrack.value) emit('edit', selectedTrack.value)
  selectedTrack.value = null
}
function deleteSelected() {
  if (selectedTrack.value) emit('delete', selectedTrack.value)
  selectedTrack.value = null
}
</script>

<style scoped lang="scss">
.mobile-music { padding-top: 12px; }
.music-categories { display: flex; gap: 8px; overflow-x: auto; padding-block: 20px 12px; scrollbar-width: none; }
.music-categories button { flex: none; min-height: 44px; padding: 8px 18px; border: 0; border-radius: 24px; background: var(--color-surface); color: var(--color-text-secondary); font-size: 14px; }
.music-categories button.active { background: var(--color-text-primary); color: var(--color-surface); }
.music-list-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.music-list-heading h2 { font-size: 20px; margin: 0; }
.music-list-heading small { font-size: 13px; color: var(--color-text-secondary); font-weight: 400; }
.song-list { border-radius: var(--mobile-card-radius); padding: 4px 0; background: var(--color-surface); }
.song-row { display: flex; align-items: center; padding: 10px 4px 10px 12px; }
.song-row + .song-row { border-top: 1px solid var(--color-border-light); }
.song-row__play { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; border: 0; padding: 0; color: inherit; background: transparent; text-align: left; }
.song-row__cover { flex: none; width: 48px; height: 48px; display: grid; place-items: center; border-radius: 10px; overflow: hidden; background: var(--color-accent-soft); color: var(--color-accent-readable); }
.song-row__cover img { width: 100%; height: 100%; object-fit: cover; }
.song-row__copy { flex: 1; min-width: 0; display: grid; gap: 4px; }
.song-row__copy strong { font-size: 15px; font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.song-row__copy small { font-size: 12px; color: var(--color-text-secondary); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.active { color: var(--color-accent-readable); }
.load-more { margin-top: 20px; }
.full-player { display: grid; gap: 24px; padding: 4px 0 16px; }
.full-player__playback { min-width: 0; }
.full-player__stage { min-width: 0; }
.full-player__cover { width: min(100%, 360px); aspect-ratio: 1; margin: 0 auto; padding: 0; border: 0; display: grid; place-items: center; border-radius: var(--mobile-card-radius); overflow: hidden; color: var(--color-accent-readable); background: var(--color-accent-soft); cursor: pointer; }
.full-player__cover img { width: 100%; height: 100%; object-fit: cover; }
.full-player__heading { display: flex; align-items: center; gap: 12px; }
.full-player__heading > div { min-width: 0; flex: 1; }
.full-player h1 { margin: 0; font-size: 24px; line-height: 1.5; overflow-wrap: anywhere; }
.full-player__heading p { font-size: 15px; color: var(--color-text-secondary); margin: 6px 0 0; overflow-wrap: anywhere; }
.full-player__time { display: flex; justify-content: space-between; font-size: 12px; color: var(--color-text-secondary); }
.full-player__controls { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 16px; }
.full-player__play { border: 0; border-radius: 50%; width: 64px; height: 64px; display: grid; place-items: center; color: var(--color-on-accent-readable); background: var(--color-accent-readable); }
.full-player button:focus-visible, .mobile-lyrics:focus-visible { outline: 2px solid var(--color-accent-readable); outline-offset: 4px; }
.sheet-meta { color: var(--color-text-secondary); font-size: 13px; margin: 0 0 20px; overflow-wrap: anywhere; }
.queue-list { max-height: 55dvh; overflow-y: auto; }
.queue-row { display: flex; align-items: center; border-bottom: 1px solid var(--color-border-light); }
.queue-row > button:first-child { display: grid; flex: 1; min-width: 0; overflow-wrap: anywhere; gap: 6px; text-align: left; min-height: 64px; padding: 12px 0; background: none; border: 0; color: inherit; }
.queue-row strong { font-size: 15px; font-weight: 500; }
.queue-row small { color: var(--color-text-secondary); font-size: 12px; }
.mobile-lyrics { --lyrics-height: clamp(280px, 48dvh, 480px); height: var(--lyrics-height); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; text-align: center; padding: calc((var(--lyrics-height) - 56px) / 2) 12px; border-radius: var(--mobile-card-radius); color: var(--color-text-secondary); cursor: pointer; }
.mobile-lyrics p { margin: 0; padding-block: 12px; font-size: 18px; line-height: 1.8; overflow-wrap: anywhere; }
.mobile-lyrics .active { font-weight: 700; }
.song-description { font-size: 15px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; margin-bottom: 20px; }
.song-actions { display: grid; gap: 12px; }
</style>
