<template>
  <div class="mobile-music" :class="{ 'is-fullscreen': fullscreen }">
    <div v-if="fullscreen" class="full-player__backdrop" aria-hidden="true">
      <img v-if="player.currentTrack?.coverUrl && !coverFailed" :src="player.currentTrack.coverUrl" alt="" @error="coverFailed = true" />
    </div>
    <UiLoadingState :loading="loading" message="正在加载音乐…">
      <UiEmpty v-if="error" title="音乐暂时未能加载" :description="error" icon="music"><template #action><UiButton @click="emit('retry')">重新加载</UiButton></template></UiEmpty>
      <template v-else-if="fullscreen">
        <div v-if="player.currentTrack" class="full-player">
          <div class="full-player__stage">
            <div v-if="!lyricsVisible" class="full-player__artwork">
              <svg class="full-player__tonearm" :class="{ 'is-playing': player.playing }" viewBox="0 0 160 180" fill="none" aria-hidden="true">
                <circle cx="22" cy="20" r="20" fill="white" fill-opacity=".06" />
                <circle cx="22" cy="20" r="10" fill="#dadbda" />
                <path d="M22 22V66Q22 76 30 84L107 151" stroke="#dadbda" stroke-width="7" stroke-linecap="round" />
                <path d="m103 148 22 19" stroke="#dadbda" stroke-width="15" stroke-linecap="round" />
              </svg>
              <button
                ref="coverButton"
                class="full-player__cover"
                type="button"
                aria-label="显示歌词"
                @click="lyricsVisible = true"
              >
                <span class="full-player__record" :class="{ 'is-playing': player.playing }">
                  <span class="full-player__record-label">
                    <img v-if="player.currentTrack.coverUrl && !coverFailed" :src="player.currentTrack.coverUrl" :alt="player.currentTrack.title" @error="coverFailed = true" />
                    <UiIcon v-else name="music" :size="64" />
                  </span>
                </span>
              </button>
            </div>
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
              @scroll.passive="onLyricScroll"
              @wheel.passive="pauseLyricFollow"
              @touchmove.passive="pauseLyricFollow"
            >
              <div v-if="lyrics.length" class="mobile-lyrics__lines" :style="{ paddingBlock: `${lyricViewportHeight / 2}px` }">
                <p v-for="line in lyrics" :key="line.key" :data-lyric-key="line.key" :class="{ active: line.key === highlightedLyricKey }">{{ line.text }}</p>
              </div>
              <UiEmpty v-if="!lyrics.length" title="这首歌暂时没有歌词" icon="music" size="sm" />
            </div>
          </div>
          <div class="full-player__heading">
            <div><h1 :title="player.currentTrack.title">{{ player.currentTrack.title }}</h1><p :title="player.currentTrack.artist">{{ player.currentTrack.artist }}</p></div>
            <button class="app-mobile-icon" type="button" aria-label="歌曲更多操作" @click="selectedTrack = player.currentTrack"><UiIcon name="more" :size="24" /></button>
          </div>
          <section class="full-player__playback" aria-label="播放控制">
            <UiSlider :model-value="player.playbackTime" :max="player.duration || 1" :disabled="!player.duration" :show-tooltip="false" aria-label="播放进度" @input="previewSeek" @change="seek" />
            <div class="full-player__time"><span>{{ formatTime(player.playbackTime) }}</span><span>{{ formatTime(player.duration) }}</span></div>
            <div class="full-player__controls">
              <button class="app-mobile-icon" type="button" :aria-label="`播放模式：${modeLabel}，点击切换`" :title="modeLabel" @click="cycleMode"><UiIcon :name="modeIcon" :size="26" /></button>
              <button class="app-mobile-icon" type="button" aria-label="上一首" @click="emit('previous')"><UiIcon name="skip-previous" :size="34" /></button>
              <button class="full-player__play" type="button" :aria-label="player.playing ? '暂停' : '播放'" @click="emit('toggle')"><UiIcon :name="player.playing ? 'pause' : 'play'" :size="36" /></button>
              <button class="app-mobile-icon" type="button" aria-label="下一首" @click="emit('next')"><UiIcon name="skip-next" :size="34" /></button>
              <button class="app-mobile-icon" type="button" aria-label="播放队列" @click="queueOpen = true"><UiIcon name="list" :size="26" /></button>
            </div>
          </section>
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
            <button class="song-row__play" type="button" :aria-label="`${player.currentTrack?.id === track.id && player.playing ? '正在播放' : '播放'} ${track.title}`" :disabled="!track.audioUrl" @click="emit('play', track)">
              <span class="song-row__cover"><img v-if="track.coverUrl" :src="track.coverUrl" alt="" loading="lazy" /><UiIcon v-else name="music" :size="24" /></span>
              <span class="song-row__copy"><strong>{{ track.title }}</strong><small>{{ track.artist }}<template v-if="track.album"> · {{ track.album }}</template></small><small v-if="track.status !== 'published'">{{ track.status === 'draft' ? '草稿' : '已归档' }}</small></span>
              <UiIcon v-if="player.currentTrack?.id === track.id && player.playing" name="music" :size="20" />
            </button>
            <button
              class="app-mobile-icon song-row__enqueue"
              :class="{ 'is-queued': queuedIds.has(track.id) }"
              type="button"
              :disabled="!track.audioUrl || queuedIds.has(track.id)"
              :aria-label="queuedIds.has(track.id) ? `${track.title}已在播放队列` : `将 ${track.title} 加入播放队列`"
              :title="queuedIds.has(track.id) ? '已在播放队列' : '加入播放队列'"
              @click="addToQueue(track)"
            ><UiIcon :name="queuedIds.has(track.id) ? 'check' : 'list-plus'" :size="22" /></button>
            <button class="app-mobile-icon" type="button" :aria-label="`${track.title}的更多操作`" @click="selectedTrack = track"><UiIcon name="more" :size="24" /></button>
          </article>
        </div>
        <UiEmpty v-else title="没有找到歌曲" description="换个关键词或分类试试。" icon="music" />
        <UiButton v-if="visibleCount < tracks.length" class="load-more" block @click="visibleCount += 20">加载更多</UiButton>
      </template>
    </UiLoadingState>
    <MusicQueueSheet v-model="queueOpen" />
    <div class="queue-feedback" aria-live="polite">
      <div v-if="lastAddedTrack" class="queue-feedback__notice">
        <span>已加入《{{ lastAddedTrack.title }}》</span>
        <button v-if="canUndoEnqueue" type="button" @click="undoEnqueue">撤销</button>
        <button class="app-mobile-icon" type="button" aria-label="关闭入队提示" @click="dismissQueueNotice"><UiIcon name="close" :size="18" /></button>
      </div>
    </div>
    <UiDialog :model-value="Boolean(selectedTrack)" :title="selectedTrack?.title || '歌曲详情'" @update:model-value="!$event && (selectedTrack = null)">
      <template v-if="selectedTrack">
        <p class="sheet-meta">{{ selectedTrack.artist }}<template v-if="selectedTrack.album"> · {{ selectedTrack.album }}</template></p>
        <p v-if="selectedTrack.recommendation" class="song-description">{{ selectedTrack.recommendation }}</p>
        <div class="song-actions">
          <UiButton v-if="canEdit(selectedTrack)" icon="edit" @click="editSelected">编辑歌曲</UiButton>
          <UiButton v-if="selectedTrack.canDelete" variant="danger" icon="delete" @click="deleteSelected">删除歌曲</UiButton>
        </div>
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { UiButton, UiDialog, UiEmpty, UiIcon, UiInput, UiLoadingState, UiSlider } from '@/components/ui'
import { useMusicPlayerStore } from '@/stores/music-player'
import { PLAY_MODES, formatMusicTime } from '@/modules/music/presentation'
import { notify } from '@/lib/feedback'
import MusicQueueSheet from './MusicQueueSheet.vue'
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
const queuedIds = computed(() => new Set(player.queue.map(track => track.id)))
const lastAddedTrack = ref<MusicTrack | null>(null)
const canUndoEnqueue = computed(() => lastAddedTrack.value && queuedIds.value.has(lastAddedTrack.value.id)
  && player.currentTrack?.id !== lastAddedTrack.value.id)
let queueNoticeTimer: ReturnType<typeof setTimeout> | undefined
const lyricContainer = ref<HTMLElement>()
const lyricViewportHeight = ref(0)
const highlightedLyricKey = ref('')
const currentLyricKey = computed(() => props.lyrics.find(line => line.current)?.key ?? '')
const LYRIC_BROWSE_PAUSE_MS = 4000
let lyricFollowPausedUntil = 0
let automaticLyricScrollTop = 0
const coverButton = ref<HTMLButtonElement>()
const coverFailed = ref(false)
const visibleCount = ref(20)
const visibleTracks = computed(() => props.tracks.slice(0, visibleCount.value))
const category = computed(() => props.categories.find(item => item.id === categoryId.value))
const modeLabel = computed(() => PLAY_MODES[player.mode].label)
const modeIcon = computed(() => PLAY_MODES[player.mode].icon)
watch([keyword, categoryId], () => { visibleCount.value = 20 })
watch(() => player.currentTrack?.coverUrl, () => { coverFailed.value = false })
watch(() => props.fullscreen, () => { lyricsVisible.value = false; queueOpen.value = false; dismissQueueNotice() })
onBeforeUnmount(dismissQueueNotice)
watch(lyricsVisible, async (visible) => {
  await nextTick()
  if (props.fullscreen) (visible ? lyricContainer.value : coverButton.value)?.focus({ preventScroll: true })
})
watch([lyricsVisible, () => player.currentTrack?.id], async () => {
  lyricFollowPausedUntil = 0
  highlightedLyricKey.value = currentLyricKey.value
  await nextTick()
  centerCurrentLyric()
})
watch(currentLyricKey, async () => {
  await nextTick()
  if (Date.now() >= lyricFollowPausedUntil) centerCurrentLyric()
})
watch(lyricContainer, (container, _previous, onCleanup) => {
  if (!container) return
  const observer = new ResizeObserver(async () => {
    lyricViewportHeight.value = container.clientHeight
    await nextTick()
    if (Date.now() >= lyricFollowPausedUntil) centerCurrentLyric()
    else highlightCenteredLyric()
  })
  observer.observe(container)
  onCleanup(() => observer.disconnect())
})
function centerCurrentLyric() {
  const container = lyricContainer.value
  if (!container) return
  const lines = Array.from(container.querySelectorAll<HTMLElement>('[data-lyric-key]'))
  const line = lines.find(item => item.dataset.lyricKey === currentLyricKey.value) ?? lines[0]
  if (!line) {
    highlightedLyricKey.value = ''
    return
  }
  const lineRect = line.getBoundingClientRect()
  container.scrollTop += lineRect.top - container.getBoundingClientRect().top
    - container.clientHeight / 2 + lineRect.height / 2
  automaticLyricScrollTop = container.scrollTop
  highlightedLyricKey.value = line.dataset.lyricKey ?? ''
}
function pauseLyricFollow() {
  lyricFollowPausedUntil = Date.now() + LYRIC_BROWSE_PAUSE_MS
}
function onLyricScroll() {
  const container = lyricContainer.value
  if (!container) return
  // 自动跟随产生的 scroll 不应被当作用户正在浏览歌词。
  if (Math.abs(container.scrollTop - automaticLyricScrollTop) > 1) pauseLyricFollow()
  highlightCenteredLyric()
}
function highlightCenteredLyric() {
  const container = lyricContainer.value
  if (!container) return
  const center = container.getBoundingClientRect().top + container.clientHeight / 2
  let closestKey = ''
  let closestDistance = Infinity
  container.querySelectorAll<HTMLElement>('[data-lyric-key]').forEach(line => {
    const rect = line.getBoundingClientRect()
    const distance = Math.abs(rect.top + rect.height / 2 - center)
    if (distance < closestDistance) {
      closestDistance = distance
      closestKey = line.dataset.lyricKey ?? ''
    }
  })
  highlightedLyricKey.value = closestKey
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
const formatTime = (value: number) => formatMusicTime(value, { padMinutes: false })
function addToQueue(track: MusicTrack) {
  const result = player.enqueue(track)
  if (result !== 'added') {
    notify.info(result === 'full' ? '播放队列最多保留 200 首，请先移除部分歌曲'
      : result === 'duplicate' ? '这首歌已在播放队列中' : '这首歌暂时没有可播放音频')
    return
  }
  dismissQueueNotice()
  lastAddedTrack.value = track
  queueNoticeTimer = setTimeout(dismissQueueNotice, 6000)
}
function dismissQueueNotice() {
  if (queueNoticeTimer) clearTimeout(queueNoticeTimer)
  queueNoticeTimer = undefined
  lastAddedTrack.value = null
}
function undoEnqueue() {
  if (lastAddedTrack.value && player.removeFromQueue(lastAddedTrack.value.id)) {
    dismissQueueNotice()
    notify.info('已撤销加入播放队列')
  }
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
.mobile-music.is-fullscreen { padding-top: 0; }
.full-player__backdrop { position: fixed; inset: 0; z-index: -1; overflow: hidden; background: #272e2b; pointer-events: none; }
.full-player__backdrop img { width: 100%; height: 100%; object-fit: cover; filter: blur(64px) saturate(.55); opacity: .2; transform: scale(1.2); }
.full-player__backdrop::after { content: ''; position: absolute; inset: 0; background: linear-gradient(rgb(19 24 22 / 12%), rgb(15 19 17 / 82%)); }
.is-fullscreen :deep(.ui-empty) { --color-text-primary: var(--player-foreground); --color-text-secondary: var(--player-muted); }
.music-categories { display: flex; gap: 8px; overflow-x: auto; padding-block: 20px 12px; scrollbar-width: none; }
.music-categories button { flex: none; min-height: 44px; padding: 8px 18px; border: 0; border-radius: 24px; background: var(--color-surface); color: var(--color-text-secondary); font-size: 14px; }
.music-categories button.active { background: var(--control-selected-background); color: var(--control-selected-text); }
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
.active { color: var(--color-accent); }
.song-row__enqueue { flex: none; color: var(--color-text-secondary); }
.song-row__enqueue.is-queued { color: var(--color-accent); }
.song-row__enqueue:disabled { cursor: default; }
.song-row__enqueue:disabled:not(.is-queued) { opacity: .4; }
.queue-feedback { position: fixed; left: 12px; right: 12px; bottom: calc(var(--mobile-player-bottom, var(--mobile-nav-height)) + var(--mobile-player-height, 58px) + 16px); z-index: var(--z-sticky); pointer-events: none; }
.queue-feedback__notice { display: flex; align-items: center; gap: 8px; padding: 4px 8px 4px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); box-shadow: var(--shadow-md); pointer-events: auto; }
.queue-feedback__notice > span { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 13px; }
.queue-feedback__notice > button:not(.app-mobile-icon) { min-height: 44px; min-width: 44px; padding: 0 4px; border: 0; background: transparent; color: var(--color-accent-readable); font-size: 13px; cursor: pointer; }
.queue-feedback__notice button:focus-visible { outline: 2px solid var(--color-accent-readable); outline-offset: -2px; }
.load-more { margin-top: 20px; }
.full-player {
  display: grid;
  grid-template-rows: minmax(220px, 1fr) auto auto;
  gap: 20px;
  min-height: calc(100dvh - var(--mobile-header-height) - env(safe-area-inset-top));
  max-width: 480px;
  margin: 0 auto;
  padding: 8px 4px max(32px, env(safe-area-inset-bottom));
  color: var(--player-foreground);
}
.full-player__playback { min-width: 0; padding-inline: 4px; }
.full-player__playback :deep(.ui-slider) {
  --el-slider-height: 3px;
  --el-slider-button-size: 10px;
  --el-slider-main-bg-color: var(--player-foreground);
  --el-slider-runway-bg-color: rgb(255 255 255 / 18%);
  --el-slider-stop-bg-color: var(--player-foreground);
}
.full-player__stage { position: relative; min-width: 0; display: grid; place-items: center; padding-top: 20px; }
.full-player__artwork { position: relative; width: min(75%, clamp(138px, calc(75dvh - 292.5px), 270px)); aspect-ratio: 1; }
.full-player__tonearm {
  position: absolute;
  top: -26%;
  left: calc(50% - 15px);
  z-index: 1;
  width: 40%;
  height: auto;
  transform-origin: 13.75% 11.11%;
  transform: rotate(-28deg);
  transition: transform 500ms ease;
  pointer-events: none;
}
.full-player__tonearm.is-playing { transform: rotate(0); }
.full-player__cover {
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  box-shadow: 0 0 0 9px rgb(255 255 255 / 4%), 0 12px 32px rgb(0 0 0 / 25%);
  cursor: pointer;
}
.full-player__record {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border: 2px solid #121413;
  border-radius: inherit;
  background: repeating-radial-gradient(circle, transparent 0 2px, rgb(255 255 255 / 3%) 3px, transparent 4px), conic-gradient(#111312, #282b29 40deg, #111312 90deg, #222522 150deg, #111312 210deg, #282b29 260deg, #111312 320deg);
  animation: mobile-record-turn 28s linear infinite;
  animation-play-state: paused;
}
.full-player__record.is-playing { animation-play-state: running; }
.full-player__record-label { display: grid; place-items: center; width: 66%; aspect-ratio: 1; border-radius: 50%; overflow: hidden; color: var(--player-muted); background: #363b38; box-shadow: 0 0 0 5px #101211; }
.full-player__record-label img { width: 100%; height: 100%; object-fit: cover; }
.full-player__heading { display: flex; align-items: center; gap: 12px; }
.full-player__heading > div { min-width: 0; flex: 1; }
.full-player h1 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; font-size: 23px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
.full-player__heading p { font-size: 15px; color: var(--player-muted); margin: 8px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.full-player__time { display: flex; justify-content: space-between; font-size: 12px; color: var(--player-muted); font-variant-numeric: tabular-nums; }
.full-player__controls { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 22px; }
.full-player__play { flex: none; border: 1.5px solid rgb(255 255 255 / 85%); border-radius: 50%; width: 68px; height: 68px; padding: 0; display: grid; place-items: center; color: var(--player-foreground); background: transparent; cursor: pointer; }
.full-player button:focus-visible, .mobile-lyrics:focus-visible { outline: 2px solid var(--player-foreground); outline-offset: 5px; }
.sheet-meta { color: var(--color-text-secondary); font-size: 13px; margin: 0 0 20px; overflow-wrap: anywhere; }
.mobile-lyrics { position: absolute; inset: 12px 0; overflow-y: auto; overscroll-behavior: contain; overflow-anchor: none; scrollbar-width: none; text-align: center; padding-inline: 12px; border-radius: var(--mobile-card-radius); color: var(--player-muted); cursor: pointer; }
.mobile-lyrics::-webkit-scrollbar { display: none; width: 0; height: 0; }
.mobile-lyrics p { margin: 0; padding-block: 12px; font-size: 18px; line-height: 1.8; overflow-wrap: anywhere; }
.mobile-lyrics .active { color: var(--player-foreground); font-weight: 700; }
@keyframes mobile-record-turn { to { transform: rotate(360deg); } }
@media (max-height: 680px) {
  .full-player { grid-template-rows: minmax(204px, 1fr) auto auto; gap: 12px; padding-top: 0; padding-bottom: max(16px, env(safe-area-inset-bottom)); }
  .full-player__stage { padding-top: 12px; }
  .full-player h1 { font-size: 20px; }
  .full-player__heading p { margin-top: 4px; font-size: 14px; }
  .full-player__controls { margin-top: 12px; }
  .full-player__play { width: 56px; height: 56px; }
}
@media (prefers-reduced-motion: reduce) {
  .full-player__record { animation: none; }
  .full-player__tonearm { transition: none; }
}
.song-description { font-size: 15px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; margin-bottom: 20px; }
.song-actions { display: grid; gap: 12px; }
</style>
