<template>
  <section class="music-panel" aria-label="Lyra 音乐播放器">
    <header class="music-panel__header">
      <div>
        <span>Lyra Music</span>
        <strong>{{ track?.title || '音乐馆' }}</strong>
      </div>
      <button type="button" class="icon-btn" aria-label="关闭音乐播放器" @click="$emit('close')">
        <el-icon><Close /></el-icon>
      </button>
    </header>

    <div class="music-panel__main">
      <div class="music-panel__cover" :class="{ 'is-playing': player.playing }">
        <img v-if="track?.coverUrl" :src="track.coverUrl" :alt="track.title" />
        <span v-else>MUSIC</span>
      </div>
      <div class="music-panel__meta">
        <strong>{{ track?.artist || 'Lyra' }}</strong>
        <p>{{ track?.recommendation || player.currentPlaylist?.description || '点击播放，让今天多一点旋律。' }}</p>
      </div>
    </div>

    <div class="music-panel__controls">
      <button type="button" class="round-btn" aria-label="上一首" @click="player.previous">
        <el-icon><Back /></el-icon>
      </button>
      <button type="button" class="round-btn round-btn--primary" aria-label="播放或暂停" @click="togglePlay">
        <el-icon>
          <VideoPause v-if="player.playing" />
          <VideoPlay v-else />
        </el-icon>
      </button>
      <button type="button" class="round-btn" aria-label="下一首" @click="player.next">
        <el-icon><Right /></el-icon>
      </button>
    </div>

    <div class="music-panel__progress">
      <span>{{ formatTime(player.playbackTime) }}</span>
      <el-slider
        :model-value="player.playbackTime"
        :max="Math.max(player.duration, 1)"
        :show-tooltip="false"
        size="small"
        @input="handleSeekPreview"
        @change="handleSeek"
      />
      <span>{{ formatTime(player.duration) }}</span>
    </div>

    <section class="music-panel__lyrics">
      <div class="music-panel__lyrics-head">
        <strong>当前歌词</strong>
        <span>{{ track?.lyricType === 'lrc' ? 'LRC 时间轴' : '歌词预览' }}</span>
      </div>
      <div class="music-panel__lyrics-body">
        <p v-if="currentLyricLines.length === 0" class="is-empty">这首歌还没有写下歌词。</p>
        <p
          v-for="line in currentLyricLines"
          :key="line.key"
          :class="{ 'is-current': line.current }"
        >
          {{ line.text }}
        </p>
      </div>
      <p v-if="track?.lyricSource" class="music-panel__lyric-source">歌词来源：{{ track.lyricSource }}</p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Back, Close, Right, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import { useMusicPlayerStore } from '@/stores/music-player'
import type { MusicTrack } from '@/types'

defineEmits<{
  close: []
}>()

const player = useMusicPlayerStore()
const track = computed(() => player.currentTrack)
const currentLyricLines = computed<LyricLine[]>(() => getTrackLyricLines(track.value, player.playbackTime))

interface LyricLine {
  key: string
  time?: number
  text: string
  current: boolean
}

async function togglePlay() {
  await player.toggle()
}

function handleSeek(value: number | number[]) {
  player.seek(Array.isArray(value) ? value[0] : value)
}

function handleSeekPreview(value: number | number[]) {
  player.previewSeek(Array.isArray(value) ? value[0] : value)
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '00:00'
  const minute = Math.floor(value / 60)
  const second = Math.floor(value % 60)
  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

function getTrackLyricLines(track: MusicTrack | null, playbackTime: number): LyricLine[] {
  const lyrics = track?.lyrics?.trim()
  if (!track || !lyrics) return []
  if (track.lyricType !== 'lrc') {
    return splitMeaningfulLines(lyrics).slice(0, 6).map((text, index) => ({
      key: `plain-${index}`,
      text,
      current: index === 0,
    }))
  }

  const lines = parseLrc(lyrics)
  if (!lines.length) return []

  let currentIndex = 0
  for (let i = 0; i < lines.length; i++) {
    if ((lines[i].time ?? 0) <= playbackTime) {
      currentIndex = i
    }
  }

  return lines.slice(Math.max(0, currentIndex - 1), currentIndex + 4).map((line, offset) => ({
    ...line,
    current: Math.max(0, currentIndex - 1) + offset === currentIndex,
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
  width: 328px;
  padding: 16px;
  border: 1px solid rgba(255, 219, 231, 0.88);
  border-radius: 22px;
  background:
    radial-gradient(circle at 12% 10%, rgba(255, 218, 232, 0.5), transparent 36%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.99), rgba(255, 249, 252, 0.98));
  box-shadow: 0 24px 52px rgba(84, 60, 73, 0.2);
  backdrop-filter: blur(18px);
  color: #55424b;
}

.music-panel__header,
.music-panel__main,
.music-panel__controls,
.music-panel__progress,
.music-panel__lyrics-head {
  display: flex;
  align-items: center;
}

.music-panel__header {
  justify-content: space-between;
  gap: 12px;
}

.music-panel__header span {
  display: block;
  color: #d982a2;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.music-panel__header strong {
  display: block;
  max-width: 230px;
  overflow: hidden;
  color: #4f3c46;
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-panel__main {
  gap: 12px;
  margin-top: 14px;
}

.music-panel__cover {
  flex: 0 0 72px;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #fff0f6, #f6f8ff);
  color: #ce7898;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.16em;
  box-shadow: 0 12px 22px rgba(217, 166, 186, 0.2);
}

.music-panel__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-panel__cover.is-playing img {
  animation: cover-pulse 3.2s ease-in-out infinite;
}

.music-panel__meta {
  min-width: 0;
}

.music-panel__meta strong,
.music-panel__meta p {
  margin: 0;
}

.music-panel__meta p {
  display: -webkit-box;
  margin-top: 6px;
  overflow: hidden;
  color: #8d7b84;
  font-size: 12px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.music-panel__controls {
  justify-content: center;
  gap: 10px;
  margin-top: 14px;
}

.icon-btn,
.round-btn {
  border: none;
  display: grid;
  place-items: center;
  color: #9a7b89;
  background: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  transition: transform 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 999px;
}

.round-btn {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgba(238, 218, 226, 0.82);
}

.round-btn--primary {
  width: 46px;
  height: 46px;
  color: #fff;
  background: linear-gradient(135deg, #fb7299, #ff95b7);
  box-shadow: 0 12px 22px rgba(251, 114, 153, 0.26);
}

.icon-btn:hover,
.round-btn:hover {
  transform: translateY(-1px);
  color: #fb7299;
}

.round-btn--primary:hover {
  color: #fff;
}

.music-panel__progress {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  margin-top: 10px;
  color: #a3919b;
  font-size: 11px;
}

.music-panel__lyrics {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(238, 218, 226, 0.8);
}

.music-panel__lyrics-head {
  justify-content: space-between;
  gap: 10px;
}

.music-panel__lyrics-head strong {
  color: #4f3c46;
  font-size: 13px;
  font-weight: 800;
}

.music-panel__lyrics-head span,
.music-panel__lyric-source {
  color: #a08b96;
  font-size: 11px;
}

.music-panel__lyrics-body {
  min-height: 132px;
  max-height: 160px;
  overflow: auto;
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(240, 222, 230, 0.9);
  background:
    linear-gradient(180deg, rgba(255, 252, 253, 0.84), rgba(255, 248, 251, 0.78)),
    repeating-linear-gradient(180deg, transparent 0 31px, rgba(226, 202, 214, 0.18) 32px 33px);
}

.music-panel__lyrics-body p {
  margin: 0;
  color: #8d7b84;
  font-size: 12px;
  line-height: 1.85;
  transition: color 0.18s ease, transform 0.18s ease;
}

.music-panel__lyrics-body p + p {
  margin-top: 2px;
}

.music-panel__lyrics-body p.is-current {
  color: #e45c8c;
  font-weight: 800;
  transform: translateX(2px);
}

.music-panel__lyrics-body p.is-empty {
  color: #ab98a2;
}

.music-panel__lyric-source {
  margin: 10px 2px 0;
  line-height: 1.5;
}

@keyframes cover-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}
</style>
