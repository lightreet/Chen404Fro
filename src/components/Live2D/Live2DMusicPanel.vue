<template>
  <section
    id="live2d-music-panel"
    class="music-panel"
    aria-label="Lyra 音乐播放器"
    @keydown.esc.stop="emit('close')"
  >
    <header class="music-panel__header">
      <div class="music-panel__identity">
        <span class="music-panel__identity-mark" aria-hidden="true">
          <UiIcon name="Headset" />
        </span>
        <div>
          <strong>Lyra Music</strong>
          <span>随身播放器</span>
        </div>
      </div>
      <button type="button" class="icon-btn" aria-label="关闭音乐播放器" @click="emit('close')">
        <UiIcon name="Close" />
      </button>
    </header>

    <section class="now-playing" aria-label="当前播放">
      <div class="now-playing__cover" :class="{ 'is-playing': player.playing }">
        <img
          v-if="displayTrack?.coverUrl"
          :src="displayTrack.coverUrl"
          :alt="`${displayTrack.title}封面`"
        />
        <span v-else class="now-playing__cover-fallback" aria-hidden="true">
          <small>LYRA</small>
          <strong>MUSIC</strong>
        </span>
        <span class="now-playing__state">
          {{ track ? (player.playing ? '播放中' : '已暂停') : '待播放' }}
        </span>
      </div>

      <div class="now-playing__content">
        <div class="now-playing__meta">
          <span class="now-playing__eyebrow">
            {{ player.currentPlaylist?.name || (track ? '当前曲目' : '为你推荐') }}
          </span>
          <strong>{{ displayTrack?.title || '准备听点什么？' }}</strong>
          <p>{{ displayTrackDescription }}</p>
        </div>

        <div class="music-panel__controls">
          <button
            type="button"
            class="round-btn"
            aria-label="上一首"
            :disabled="!player.hasQueue"
            @click="player.previous"
          >
            <UiIcon name="Back" />
          </button>
          <button
            type="button"
            class="round-btn round-btn--primary"
            :aria-label="primaryPlaybackLabel"
            @click="togglePlay"
          >
            <UiIcon :name="player.playing ? 'VideoPause' : 'VideoPlay'" />
          </button>
          <button
            type="button"
            class="round-btn"
            aria-label="下一首"
            :disabled="!player.hasQueue"
            @click="player.next"
          >
            <UiIcon name="Right" />
          </button>
          <button
            type="button"
            class="round-btn"
            :class="{ 'is-active': settingsVisible }"
            aria-label="播放设置"
            :aria-expanded="settingsVisible"
            aria-controls="live2d-playback-settings"
            @click="settingsVisible = !settingsVisible"
          >
            <UiIcon name="Setting" />
          </button>
        </div>
      </div>
    </section>

    <div class="music-panel__progress">
      <span>{{ formatTime(player.playbackTime) }}</span>
      <UiSlider
        :model-value="player.playbackTime"
        :max="Math.max(player.duration, 1)"
        :show-tooltip="false"
        aria-label="播放进度"
        @input="handleSeekPreview"
        @change="handleSeek"
      />
      <span>{{ formatTime(player.duration) }}</span>
    </div>

    <div
      v-if="settingsVisible"
      id="live2d-playback-settings"
      class="playback-settings"
      aria-label="播放设置"
    >
      <div class="volume-control">
        <UiIcon :name="player.volume === 0 ? 'mdi:volume-off' : 'mdi:volume-high'" />
        <UiSlider
          :model-value="Math.round(player.volume * 100)"
          :max="100"
          :show-tooltip="false"
          aria-label="播放音量"
          @input="handleVolume"
          @change="handleVolume"
        />
      </div>
      <div class="mode-control" aria-label="播放模式">
        <button
          v-for="option in modeOptions"
          :key="option.value"
          type="button"
          :class="{ 'is-active': player.mode === option.value }"
          :aria-label="option.label"
          :aria-pressed="player.mode === option.value"
          @click="player.setMode(option.value)"
        >
          <UiIcon :name="option.icon" />
        </button>
      </div>
    </div>

    <nav class="music-panel__tabs" role="tablist" aria-label="音乐功能">
      <button
        v-for="tab in tabs"
        :id="`music-tab-${tab.value}`"
        :key="tab.value"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.value"
        :aria-controls="`music-panel-${tab.value}`"
        :class="{ 'is-active': activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span v-if="tab.value === 'queue'">{{ player.queue.length }}</span>
      </button>
    </nav>

    <div ref="panelBodyRef" class="music-panel__body">
      <section
        v-if="activeTab === 'catalog'"
        id="music-panel-catalog"
        class="catalog-panel"
        role="tabpanel"
        aria-labelledby="music-tab-catalog"
      >
        <UiInput
          v-model="catalog.keyword.value"
          prefix-icon="search"
          clearable
          size="sm"
          placeholder="搜索歌曲、歌手、专辑或标签"
          aria-label="搜索歌曲"
        />

        <div class="playlist-filter" aria-label="歌曲分类">
          <button
            type="button"
            :class="{ 'is-active': catalog.selectedPlaylistId.value == null }"
            @click="catalog.selectPlaylist(null)"
          >
            全部
          </button>
          <button
            v-for="playlist in catalog.playlists.value"
            :key="playlist.id ?? playlist.name"
            type="button"
            :class="{ 'is-active': catalog.selectedPlaylistId.value === playlist.id }"
            @click="catalog.selectPlaylist(playlist.id ?? null)"
          >
            {{ playlist.name }}
          </button>
        </div>

        <div class="catalog-panel__heading">
          <strong>{{ catalogHeading }}</strong>
          <span>共 {{ catalog.filteredTracks.value.length }} 首</span>
        </div>

        <UiLoadingState
          :loading="catalog.loading.value"
          message="正在整理曲库"
          variant="plain"
        >
          <div v-if="catalog.error.value" class="catalog-message" role="alert">
            <UiIcon name="warning" />
            <div>
              <strong>曲库暂时没有加载出来</strong>
              <p>{{ catalog.error.value }}</p>
            </div>
            <button type="button" @click="catalog.retry">重新加载</button>
          </div>

          <UiEmpty
            v-else-if="catalog.filteredTracks.value.length === 0"
            size="sm"
            icon="Search"
            title="没有找到匹配的歌曲"
            description="换个关键词，或者选择其他分类试试。"
          />

          <div v-else class="track-list" aria-label="点歌列表">
            <button
              v-for="item in visibleCatalogTracks"
              :key="item.id"
              type="button"
              class="track-row"
              :class="{ 'is-current': player.currentTrack?.id === item.id }"
              @click="playCatalogTrack(item)"
            >
              <span class="track-row__cover">
                <img v-if="item.coverUrl" :src="item.coverUrl" alt="" />
                <UiIcon v-else name="mdi:music-note" />
              </span>
              <span class="track-row__meta">
                <strong>{{ item.title }}</strong>
                <small>{{ item.artist }}<template v-if="item.album"> · {{ item.album }}</template></small>
              </span>
              <UiIcon
                class="track-row__action"
                :name="player.currentTrack?.id === item.id && player.playing ? 'VideoPause' : 'VideoPlay'"
              />
            </button>
          </div>
        </UiLoadingState>

        <div v-if="!catalog.loading.value && !catalog.error.value" class="catalog-actions">
          <button
            v-if="remainingTrackCount > 0"
            type="button"
            class="catalog-actions__more"
            @click="showMoreTracks"
          >
            再显示 {{ Math.min(CATALOG_PAGE_SIZE, remainingTrackCount) }} 首
          </button>
          <RouterLink class="music-hall-link" to="/music">
            完整音乐馆
            <UiIcon name="ArrowRight" />
          </RouterLink>
        </div>
      </section>

      <section
        v-else-if="activeTab === 'queue'"
        id="music-panel-queue"
        class="queue-panel"
        role="tabpanel"
        aria-labelledby="music-tab-queue"
      >
        <UiEmpty
          v-if="player.queue.length === 0"
          size="sm"
          icon="Headset"
          title="播放队列还是空的"
          description="去“点歌”里选一首，相关歌曲会自动加入队列。"
        />

        <div v-else class="queue-list" aria-label="当前播放队列">
          <button
            v-for="(item, index) in player.queue"
            :key="item.id"
            type="button"
            class="queue-row"
            :class="{ 'is-current': player.currentTrack?.id === item.id }"
            @click="playQueuedTrack(item)"
          >
            <span class="queue-row__index">
              <UiIcon
                v-if="player.currentTrack?.id === item.id"
                :name="player.playing ? 'mdi:volume-high' : 'VideoPlay'"
              />
              <template v-else>{{ String(index + 1).padStart(2, '0') }}</template>
            </span>
            <span>
              <strong>{{ item.title }}</strong>
              <small>{{ item.artist }}</small>
            </span>
            <small v-if="item.duration">{{ formatTime(item.duration) }}</small>
          </button>
        </div>
      </section>

      <section
        v-else
        id="music-panel-lyrics"
        class="lyrics-panel"
        role="tabpanel"
        aria-labelledby="music-tab-lyrics"
      >
        <div class="lyrics-panel__head">
          <strong>{{ track?.title || '当前歌词' }}</strong>
          <span>{{ track?.lyricType === 'lrc' ? '随播放进度滚动' : '歌词预览' }}</span>
        </div>
        <div class="lyrics-panel__body">
          <p v-if="currentLyricLines.length === 0" class="is-empty">
            {{ track ? '这首歌还没有歌词。' : '播放歌曲后，这里会显示歌词。' }}
          </p>
          <p
            v-for="line in currentLyricLines"
            :key="line.key"
            :class="{ 'is-current': line.current }"
          >
            {{ line.text }}
          </p>
        </div>
        <p v-if="track?.lyricSource" class="lyrics-panel__source">
          歌词来源：{{ track.lyricSource }}
        </p>
      </section>
    </div>

    <span class="sr-only" role="status" aria-live="polite">
      {{ player.playing && track ? `正在播放 ${track.title}` : '音乐已暂停' }}
    </span>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { UiEmpty, UiIcon, UiInput, UiLoadingState, UiSlider } from '@/components/ui'
import { usePublicMusicCatalog } from '@/composables/usePublicMusicCatalog'
import { useMusicPlayerStore, type MusicPlayMode } from '@/stores/music-player'
import type { MusicTrack } from '@/types'

const emit = defineEmits<{
  close: []
}>()

type MusicPanelTab = 'catalog' | 'queue' | 'lyrics'

const CATALOG_PAGE_SIZE = 6
const player = useMusicPlayerStore()
const catalog = usePublicMusicCatalog()
const activeTab = ref<MusicPanelTab>('catalog')
const settingsVisible = ref(false)
const visibleTrackLimit = ref(CATALOG_PAGE_SIZE)
const panelBodyRef = ref<HTMLElement | null>(null)
const track = computed(() => player.currentTrack)
const displayTrack = computed(() => track.value ?? catalog.tracks.value[0] ?? null)
const displayTrackDescription = computed(() => {
  if (!displayTrack.value) return '曲库加载后，会在这里为你留一张唱片。'
  const details = [displayTrack.value.artist, displayTrack.value.album].filter(Boolean)
  if (!track.value) details.push('点击播放开始')
  return details.join(' · ')
})
const primaryPlaybackLabel = computed(() => {
  if (player.playing) return '暂停播放'
  return displayTrack.value ? `播放 ${displayTrack.value.title}` : '开始播放'
})
const catalogHeading = computed(() => {
  if (catalog.keyword.value.trim()) return '搜索结果'
  return catalog.selectedPlaylist.value?.name || '推荐点歌'
})
const visibleCatalogTracks = computed(() =>
  catalog.filteredTracks.value.slice(0, visibleTrackLimit.value),
)
const remainingTrackCount = computed(() =>
  Math.max(0, catalog.filteredTracks.value.length - visibleCatalogTracks.value.length),
)
const currentLyricLines = computed<LyricLine[]>(() => getTrackLyricLines(track.value, player.playbackTime))

const tabs: Array<{ label: string; value: MusicPanelTab }> = [
  { label: '点歌', value: 'catalog' },
  { label: '队列', value: 'queue' },
  { label: '歌词', value: 'lyrics' },
]

const modeOptions: Array<{ value: MusicPlayMode; label: string; icon: string }> = [
  { value: 'sequence', label: '顺序播放', icon: 'mdi:playlist-play' },
  { value: 'shuffle', label: '随机播放', icon: 'mdi:shuffle-variant' },
  { value: 'single', label: '单曲循环', icon: 'mdi:repeat-once' },
]

interface LyricLine {
  key: string
  time?: number
  text: string
  current: boolean
}

onMounted(() => {
  void catalog.loadCatalog()
})

watch(activeTab, async () => {
  await nextTick()
  if (panelBodyRef.value) {
    panelBodyRef.value.scrollTop = 0
  }
})

watch([catalog.keyword, catalog.selectedPlaylistId], () => {
  visibleTrackLimit.value = CATALOG_PAGE_SIZE
  if (panelBodyRef.value) {
    panelBodyRef.value.scrollTop = 0
  }
})

async function togglePlay() {
  if (!track.value && displayTrack.value) {
    await player.playTrack(displayTrack.value, catalog.tracks.value)
    return
  }
  await player.toggle()
}

async function playCatalogTrack(item: MusicTrack) {
  if (player.currentTrack?.id === item.id && player.playing) {
    player.pause()
    return
  }
  const queue = catalog.filteredTracks.value.length
    ? catalog.filteredTracks.value
    : catalog.tracks.value
  await player.playTrack(item, queue, catalog.selectedPlaylist.value)
}

async function playQueuedTrack(item: MusicTrack) {
  if (player.currentTrack?.id === item.id && player.playing) {
    player.pause()
    return
  }
  await player.playTrack(item)
}

function showMoreTracks() {
  visibleTrackLimit.value += CATALOG_PAGE_SIZE
}

function handleSeek(value: number | number[]) {
  player.seek(readSliderValue(value))
}

function handleSeekPreview(value: number | number[]) {
  player.previewSeek(readSliderValue(value))
}

function handleVolume(value: number | number[]) {
  player.setVolume(readSliderValue(value) / 100)
}

function readSliderValue(value: number | number[]) {
  return Array.isArray(value) ? value[0] : value
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '00:00'
  const minute = Math.floor(value / 60)
  const second = Math.floor(value % 60)
  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

function getTrackLyricLines(currentTrack: MusicTrack | null, playbackTime: number): LyricLine[] {
  const lyrics = currentTrack?.lyrics?.trim()
  if (!currentTrack || !lyrics) return []
  if (currentTrack.lyricType !== 'lrc') {
    return splitMeaningfulLines(lyrics).slice(0, 10).map((text, index) => ({
      key: `plain-${index}`,
      text,
      current: index === 0,
    }))
  }

  const lines = parseLrc(lyrics)
  if (!lines.length) return []

  let currentIndex = 0
  for (let index = 0; index < lines.length; index += 1) {
    if ((lines[index].time ?? 0) <= playbackTime) {
      currentIndex = index
    }
  }

  return lines.slice(Math.max(0, currentIndex - 2), currentIndex + 7).map((line, offset) => ({
    ...line,
    current: Math.max(0, currentIndex - 2) + offset === currentIndex,
  }))
}

function splitMeaningfulLines(input: string) {
  return input.split('\n').map((line) => line.trim()).filter(Boolean)
}

function parseLrc(input: string): LyricLine[] {
  return splitMeaningfulLines(input).map((raw, index) => {
    const match = raw.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?](.*)$/)
    if (!match) return null
    const minute = Number(match[1])
    const second = Number(match[2])
    const ms = Number((match[3] || '0').padEnd(3, '0'))
    const text = match[4].trim()
    if (!text) return null
    return {
      key: `lrc-${index}`,
      time: minute * 60 + second + ms / 1000,
      text,
      current: false,
    }
  }).filter(Boolean) as LyricLine[]
}
</script>

<style scoped lang="scss">
.music-panel {
  --music-accent-strong: var(--color-accent-strong, var(--primary-dark, #e44d78));
  --music-text-muted: var(--color-text-secondary, #75616b);

  display: flex;
  width: 404px;
  max-width: calc(100vw - 24px);
  max-height: min(680px, calc(100dvh - 32px));
  flex-direction: column;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--primary) 14%, var(--color-border, #eee1e6));
  border-radius: 16px;
  background: var(--color-surface, #fff);
  box-shadow: 0 18px 44px rgba(65, 45, 56, 0.18);
  color: var(--color-text-primary, #4f3c46);
}

.music-panel__header,
.now-playing,
.music-panel__controls,
.music-panel__progress,
.playback-settings,
.volume-control,
.mode-control,
.music-panel__tabs,
.track-row,
.queue-row,
.lyrics-panel__head {
  display: flex;
  align-items: center;
}

.music-panel__header {
  flex: 0 0 auto;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 10px 6px 16px;
}

.music-panel__identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
}

.music-panel__identity-mark {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 11px;
  background: var(--color-accent-soft, color-mix(in srgb, var(--primary) 14%, transparent));
  color: var(--music-accent-strong);
  font-size: 17px;
}

.music-panel__identity strong,
.music-panel__identity span {
  display: block;
}

.music-panel__identity strong {
  font-size: 14px;
  letter-spacing: 0.01em;
}

.music-panel__identity div > span {
  margin-top: 1px;
  color: var(--color-text-secondary, #7c6872);
  font-size: 11px;
}

.icon-btn,
.round-btn,
.mode-control button,
.music-panel__tabs button,
.playlist-filter button,
.catalog-message button {
  border: 0;
  cursor: pointer;
}

.icon-btn {
  display: grid;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 12px;
  background: transparent;
  color: var(--color-text-secondary, #7c6872);
}

.icon-btn:hover,
.icon-btn:focus-visible {
  background: var(--color-surface-muted, #fff4f8);
  color: var(--primary, #fb7299);
}

.now-playing {
  align-items: stretch;
  gap: 16px;
  padding: 6px 18px 12px;
}

.now-playing__cover {
  position: relative;
  display: grid;
  flex: 0 0 96px;
  width: 96px;
  height: 96px;
  overflow: hidden;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--primary) 18%, var(--color-border, #eee1e6));
  border-radius: 16px;
  background: var(--color-surface-muted, #fff3f7);
  color: var(--music-accent-strong);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--primary) 13%, transparent);
}

.now-playing__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.now-playing__cover.is-playing img {
  animation: cover-breathe 3s ease-in-out infinite;
}

.now-playing__cover-fallback {
  display: grid;
  place-items: center;
  line-height: 1;
  text-align: center;
}

.now-playing__cover-fallback small {
  font-size: 9px;
  letter-spacing: 0.22em;
}

.now-playing__cover-fallback strong {
  margin-top: 5px;
  font-size: 17px;
  letter-spacing: 0.04em;
}

.now-playing__state {
  position: absolute;
  bottom: 6px;
  left: 6px;
  padding: 3px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(65, 45, 56, 0.12);
  color: var(--music-accent-strong);
  font-size: 9px;
  font-weight: 700;
  line-height: 1.2;
}

.now-playing__content {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
}

.now-playing__meta {
  min-width: 0;
}

.now-playing__meta strong,
.now-playing__meta p {
  margin: 0;
}

.now-playing__meta strong {
  display: block;
  overflow: hidden;
  margin-top: 3px;
  font-size: 16px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.now-playing__meta p {
  margin-top: 4px;
  overflow: hidden;
  color: var(--color-text-secondary, #7c6872);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.now-playing__eyebrow {
  display: block;
  color: var(--music-accent-strong);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.music-panel__controls {
  gap: 5px;
  margin-top: 8px;
}

.round-btn {
  display: grid;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-secondary, #7c6872);
}

.round-btn--primary {
  flex-basis: 46px;
  width: 46px;
  height: 46px;
  background: var(--music-accent-strong);
  color: #fff;
  box-shadow: 0 8px 18px color-mix(in srgb, var(--primary) 26%, transparent);
}

.round-btn:not(:disabled):hover,
.round-btn:not(:disabled):focus-visible,
.round-btn.is-active {
  background: var(--color-surface-muted, #fff4f8);
  color: var(--music-accent-strong);
}

.round-btn--primary:hover,
.round-btn--primary:focus-visible {
  background: var(--music-accent-strong);
  color: #fff;
  transform: translateY(-1px);
}

.round-btn:disabled {
  cursor: not-allowed;
  opacity: 0.36;
}

.music-panel__progress {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: 36px minmax(0, 1fr) 36px;
  gap: 8px;
  padding: 0 18px 8px;
  color: var(--music-text-muted);
  font-size: 11px;
}

.music-panel__progress > span:last-child {
  text-align: right;
}

.playback-settings {
  flex: 0 0 auto;
  justify-content: space-between;
  gap: 12px;
  margin: 0 14px 10px;
  padding: 6px 8px 6px 10px;
  border: 1px solid color-mix(in srgb, var(--primary) 10%, var(--color-border, #eee1e6));
  border-radius: 13px;
  background: var(--color-surface-muted, #fff7fa);
}

.volume-control {
  display: grid;
  flex: 1;
  grid-template-columns: 18px minmax(72px, 1fr);
  gap: 8px;
  color: var(--color-text-secondary, #7c6872);
}

.mode-control {
  gap: 0;
}

.mode-control button {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 11px;
  background: transparent;
  color: var(--music-text-muted);
}

.mode-control button:hover,
.mode-control button:focus-visible,
.mode-control button.is-active {
  background: var(--color-surface-muted, #fff3f7);
  color: var(--music-accent-strong);
}

.music-panel__tabs {
  flex: 0 0 auto;
  gap: 2px;
  padding: 0 14px;
  border-top: 1px solid var(--color-border, #eee1e6);
  border-bottom: 1px solid var(--color-border, #eee1e6);
}

.music-panel__tabs button {
  position: relative;
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 5px;
  padding: 0 14px;
  background: transparent;
  color: var(--color-text-secondary, #7c6872);
  font-size: 13px;
  font-weight: 600;
}

.music-panel__tabs button::after {
  position: absolute;
  right: 12px;
  bottom: -1px;
  left: 12px;
  height: 2px;
  border-radius: 2px;
  background: transparent;
  content: '';
}

.music-panel__tabs button.is-active {
  color: var(--music-accent-strong);
}

.music-panel__tabs button.is-active::after {
  background: var(--primary, #fb7299);
}

.music-panel__tabs button span {
  display: inline-grid;
  min-width: 18px;
  height: 18px;
  place-items: center;
  border-radius: 999px;
  background: var(--color-surface-muted, #fff3f7);
  font-size: 10px;
}

.music-panel__body {
  min-height: 0;
  flex: 1 1 280px;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.catalog-panel,
.queue-panel,
.lyrics-panel {
  padding: 12px 14px 14px;
}

.playlist-filter {
  display: flex;
  gap: 6px;
  margin: 8px 0 10px;
  padding-bottom: 2px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.playlist-filter button {
  flex: 0 0 auto;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--color-surface-muted, #fff4f8);
  color: var(--color-text-secondary, #7c6872);
  font-size: 12px;
}

.catalog-panel__heading {
  display: flex;
  min-height: 28px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 4px;
}

.catalog-panel__heading strong {
  font-size: 12px;
}

.catalog-panel__heading span {
  color: var(--music-text-muted);
  font-size: 11px;
}

.playlist-filter button:hover,
.playlist-filter button:focus-visible,
.playlist-filter button.is-active {
  background: var(--music-accent-strong);
  color: #fff;
}

.track-list,
.queue-list {
  min-height: 120px;
  overflow: hidden;
  border: 1px solid var(--color-border, #eee1e6);
  border-radius: 12px;
}

.track-row,
.queue-row {
  width: 100%;
  border: 0;
  border-bottom: 1px solid var(--color-border, #eee1e6);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.track-row {
  display: grid;
  min-height: 60px;
  grid-template-columns: 42px minmax(0, 1fr) 44px;
  gap: 10px;
  padding: 8px 4px 8px 9px;
}

.track-row:hover,
.queue-row:hover,
.track-row:focus-visible,
.queue-row:focus-visible {
  background: var(--color-surface-muted, #fff7fa);
}

.track-row:focus-visible,
.queue-row:focus-visible,
.catalog-actions a:focus-visible,
.catalog-actions button:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid var(--music-accent-strong);
  outline-offset: -2px;
}

.track-row.is-current,
.queue-row.is-current {
  background: var(--color-accent-soft, color-mix(in srgb, var(--primary) 12%, transparent));
  color: var(--music-accent-strong);
}

.track-row__cover {
  display: grid;
  width: 42px;
  height: 42px;
  overflow: hidden;
  place-items: center;
  border-radius: 9px;
  background: var(--color-surface-muted, #fff3f7);
  color: var(--primary, #fb7299);
}

.track-row__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.track-row__meta {
  min-width: 0;
  align-self: center;
}

.track-row__meta strong,
.track-row__meta small,
.queue-row strong,
.queue-row small {
  display: block;
}

.track-row__meta strong,
.queue-row strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-row__meta small,
.queue-row small {
  margin-top: 3px;
  overflow: hidden;
  color: var(--music-text-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-row__action {
  justify-self: center;
  align-self: center;
  color: var(--primary, #fb7299);
  font-size: 18px;
}

.catalog-message {
  display: grid;
  min-height: 150px;
  place-content: center;
  justify-items: center;
  gap: 8px;
  padding: 20px;
  color: var(--color-text-secondary, #7c6872);
  text-align: center;
}

.catalog-message > .ui-icon {
  color: var(--primary, #fb7299);
  font-size: 24px;
}

.catalog-message strong,
.catalog-message p {
  margin: 0;
}

.catalog-message p {
  max-width: 32ch;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.55;
}

.catalog-message button {
  min-height: 32px;
  padding: 0 13px;
  border-radius: 9px;
  background: var(--music-accent-strong);
  color: #fff;
  font-size: 12px;
}

.catalog-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.catalog-actions__more,
.music-hall-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid var(--color-border, #eee1e6);
  border-radius: 11px;
  background: transparent;
  color: var(--color-text-secondary, #7c6872);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

.catalog-actions__more {
  cursor: pointer;
}

.catalog-actions > .music-hall-link:only-child {
  grid-column: 1 / -1;
}

.catalog-actions__more:hover,
.catalog-actions__more:focus-visible,
.music-hall-link:hover,
.music-hall-link:focus-visible {
  border-color: color-mix(in srgb, var(--primary) 45%, var(--color-border, #eee1e6));
  background: var(--color-surface-muted, #fff7fa);
  color: var(--music-accent-strong);
}

.queue-row {
  display: grid;
  min-height: 60px;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 8px;
  padding: 10px 6px;
}

.queue-row__index {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  color: var(--music-text-muted);
  font-size: 11px;
}

.lyrics-panel__head {
  justify-content: space-between;
  gap: 12px;
}

.lyrics-panel__head strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lyrics-panel__head span,
.lyrics-panel__source {
  color: var(--music-text-muted);
  font-size: 11px;
}

.lyrics-panel__body {
  min-height: 210px;
  margin-top: 12px;
  padding: 10px 4px;
}

.lyrics-panel__body p {
  margin: 0;
  padding: 5px 8px;
  border-radius: 8px;
  color: var(--color-text-secondary, #7c6872);
  font-size: 12px;
  line-height: 1.7;
  transition: background 180ms ease-out, color 180ms ease-out, transform 180ms ease-out;
}

.lyrics-panel__body p.is-current {
  background: var(--color-surface-muted, #fff3f7);
  color: var(--music-accent-strong);
  font-weight: 700;
  transform: translateX(3px);
}

.lyrics-panel__body p.is-empty {
  padding-top: 72px;
  color: var(--music-text-muted);
  text-align: center;
}

.lyrics-panel__source {
  margin: 8px 4px 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@keyframes cover-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}

@media (max-width: 1023px) {
  .music-panel {
    width: 100%;
    max-width: none;
    max-height: calc(100dvh - 112px);
  }

  .music-panel__header {
    padding-top: 14px;
  }

  .music-panel__body {
    min-height: 0;
  }
}

@media (max-height: 560px) {
  .music-panel__header {
    padding-top: 6px;
    padding-bottom: 4px;
  }

  .now-playing {
    gap: 12px;
    padding-top: 2px;
    padding-bottom: 6px;
  }

  .now-playing__cover {
    flex-basis: 78px;
    width: 78px;
    height: 78px;
    border-radius: 14px;
  }

  .music-panel__controls {
    margin-top: 2px;
  }

  .playback-settings {
    margin-bottom: 6px;
  }
}

@media (max-width: 520px) {
  .music-panel__header,
  .now-playing,
  .music-panel__progress,
  .playback-settings,
  .music-panel__tabs,
  .catalog-panel,
  .queue-panel,
  .lyrics-panel {
    padding-right: 14px;
    padding-left: 14px;
  }

  .now-playing__cover {
    flex-basis: 84px;
    width: 84px;
    height: 84px;
  }

  .track-row {
    grid-template-columns: 40px minmax(0, 1fr) 44px;
  }

  .volume-control {
    grid-template-columns: 18px minmax(68px, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .now-playing__cover.is-playing img {
    animation: none;
  }

  .round-btn,
  .lyrics-panel__body p {
    transition-duration: 0.01ms;
  }
}
</style>
