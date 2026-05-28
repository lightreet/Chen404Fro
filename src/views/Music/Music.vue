<template>
  <DefaultLayout wide-content>
    <template #hero>
      <PageHero
        title="Sakura Radio"
        eyebrow="Music Room"
        subtitle="今晚，Lyra 为你调好一首歌。"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="72vh"
        :wave-height="132"
        compact
      />
    </template>

    <div class="music-page">
      <section class="radio-panel">
        <div class="radio-panel__visual">
          <div class="radio-panel__cover" :class="{ 'is-playing': player.playing }">
            <div class="record-disc">
              <div class="record-disc__rings"></div>
              <img v-if="activeTrack?.coverUrl" :src="activeTrack.coverUrl" :alt="activeTrack.title" />
              <div v-else class="radio-panel__cover-empty">Sakura<br />Radio</div>
            </div>
          </div>
          <div class="tone-arm" :class="{ 'is-playing': player.playing }">
            <span class="tone-arm__base"></span>
            <span class="tone-arm__needle"></span>
          </div>
        </div>

        <div class="radio-panel__body">
          <div class="radio-panel__topline">
            <span class="eyebrow">Now Playing</span>
            <div v-if="canManage" class="radio-panel__admin-actions">
              <el-button type="primary" plain :icon="Plus" @click="openCreateTrack">新增歌曲</el-button>
              <el-button plain @click="openPlaylistManager">管理歌单</el-button>
            </div>
          </div>

          <div class="radio-panel__title-row">
            <div>
              <h2>{{ activeTrack?.title || 'Sakura Radio' }}</h2>
              <p>{{ activeTrack ? `${activeTrack.artist}${activeTrack.album ? ` · ${activeTrack.album}` : ''}` : '等待第一首歌被放进电台。' }}</p>
            </div>
            <span v-if="player.currentPlaylist?.name" class="playlist-badge">{{ player.currentPlaylist.name }}</span>
          </div>

          <div class="radio-panel__meta">
            <span>{{ activeTrack?.genre || 'Sakura FM' }}</span>
            <span>{{ activeTrack?.language || 'Lyra Select' }}</span>
            <span>{{ player.queue.length }} 首在队列</span>
          </div>

          <p class="radio-panel__recommendation">
            {{ activeTrack?.recommendation || player.currentPlaylist?.openingText || '点一张唱片，Lyra 会把它轻轻放进今晚的播放队列。' }}
          </p>

          <div class="player-controls">
            <button type="button" class="control-btn" title="上一首" @click="player.previous">
              <el-icon><Back /></el-icon>
            </button>
            <button type="button" class="control-btn control-btn--primary" title="播放/暂停" @click="player.toggle">
              <el-icon>
                <VideoPause v-if="player.playing" />
                <VideoPlay v-else />
              </el-icon>
            </button>
            <button type="button" class="control-btn" title="下一首" @click="player.next">
              <el-icon><Right /></el-icon>
            </button>
            <button type="button" class="mode-btn" @click="cycleMode">{{ modeLabel }}</button>
          </div>

          <div class="progress-row">
            <span>{{ formatTime(player.playbackTime) }}</span>
            <el-slider
              class="progress-slider"
              :model-value="player.playbackTime"
              :max="Math.max(player.duration, 1)"
              :show-tooltip="false"
              @input="handleSeekPreview"
              @change="handleSeek"
            />
            <span>{{ formatTime(player.duration) }}</span>
          </div>

          <div class="player-subcontrols">
            <span>音量</span>
            <el-slider
              class="volume-slider"
              :model-value="Math.round(player.volume * 100)"
              :max="100"
              :show-tooltip="false"
              @change="handleVolumeChange"
            />
            <span>{{ Math.round(player.volume * 100) }}%</span>
          </div>

          <div class="lyric-window">
            <p v-if="activeLyricLines.length === 0">这首歌还没有写下歌词。</p>
            <p v-for="line in activeLyricLines" :key="line.key" :class="{ 'is-current': line.current }">
              {{ line.text }}
            </p>
          </div>
        </div>
      </section>

      <section class="playlist-strip">
        <button
          v-for="playlist in playlists"
          :key="playlist.id || playlist.name"
          type="button"
          class="playlist-chip"
          :class="{ 'is-active': player.currentPlaylist?.id === playlist.id }"
          @click="selectPlaylist(playlist)"
        >
          <strong>{{ playlist.name }}</strong>
          <span>{{ getPlaylistTrackCount(playlist) }} 首</span>
        </button>
      </section>

      <section class="music-shelf">
        <div class="shelf-heading">
          <div>
            <span class="eyebrow">Record Shelf</span>
            <h2>当前音乐</h2>
          </div>
          <el-button v-if="canManage" :icon="Refresh" plain @click="loadMusic">重新加载</el-button>
        </div>

        <div v-if="loading" class="music-state">Sakura Radio 正在调频...</div>
        <div v-else-if="tracks.length === 0" class="music-state">
          这里还没有公开歌曲。
          <el-button v-if="canManage" type="primary" link @click="openCreateTrack">现在新增</el-button>
        </div>
        <div v-else class="track-list-shell">
          <article
            v-for="(track, index) in tracks"
            :key="track.id"
            class="track-row"
            :class="{
              'is-active': activeTrack?.id === track.id,
              'is-expanded': expandedTrackId === track.id,
            }"
          >
            <button type="button" class="track-row__main" @click="toggleTrackExpanded(track.id)">
              <span class="track-row__index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="track-row__cover">
                <img v-if="track.coverUrl" :src="track.coverUrl" :alt="track.title" />
                <span v-else>RADIO</span>
              </span>
              <span class="track-row__meta">
                <strong>{{ track.title }}</strong>
                <span>{{ track.artist }}{{ track.album ? ` · ${track.album}` : '' }}</span>
                <small>
                  {{ track.genre || '音乐' }}
                  <template v-if="track.language"> · {{ track.language }}</template>
                  <template v-if="track.tags.length"> · {{ track.tags.slice(0, 3).join(' / ') }}</template>
                </small>
              </span>
              <span class="track-row__state">
                <span v-if="activeTrack?.id === track.id" class="track-row__playing">{{ formatPlaybackSummary(track) }}</span>
                <span v-else class="track-row__duration">{{ formatTrackDuration(track) }}</span>
              </span>
              <span class="track-row__chevron" :class="{ 'is-expanded': expandedTrackId === track.id }">▾</span>
            </button>

            <transition name="track-detail-fade">
              <div v-if="expandedTrackId === track.id" class="track-detail">
                <button type="button" class="track-detail__play" @click="playTrack(track)">
                  <span>{{ activeTrack?.id === track.id ? '当前歌曲' : '播放这首' }}</span>
                </button>
                <div class="track-detail__main">
                  <div class="track-detail__cover">
                    <img v-if="track.coverUrl" :src="track.coverUrl" :alt="track.title" />
                    <span v-else>RADIO</span>
                  </div>
                  <div class="track-detail__content">
                    <div class="track-detail__title">
                      <div>
                        <strong>{{ track.title }}</strong>
                        <p>{{ track.artist }}{{ track.album ? ` · ${track.album}` : '' }}</p>
                      </div>
                      <div v-if="canManage" class="track-detail__actions">
                        <button type="button" class="track-detail__icon" title="编辑" @click.stop="openEditTrack(track)">
                          <el-icon><EditPen /></el-icon>
                        </button>
                        <button type="button" class="track-detail__icon track-detail__icon--danger" title="删除" @click.stop="removeTrack(track)">
                          <el-icon><Delete /></el-icon>
                        </button>
                      </div>
                    </div>

                    <div class="track-detail__tags">
                      <span v-if="canManage" class="track-detail__status">{{ statusLabel(track.status) }}</span>
                      <span v-for="tag in track.tags.slice(0, 5)" :key="tag">{{ tag }}</span>
                    </div>

                    <p class="track-detail__note">{{ track.recommendation || track.moodText || 'Lyra 还在等这首歌的推荐语。' }}</p>
                    <div class="track-detail__info">
                      <span v-if="track.genre">风格：{{ track.genre }}</span>
                      <span v-if="track.language">语言：{{ track.language }}</span>
                      <span v-if="track.releaseYear">年份：{{ track.releaseYear }}</span>
                      <span>时长：{{ formatTrackDuration(track) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </article>
        </div>
      </section>

      <el-drawer
        v-model="playlistDrawerVisible"
        class="music-playlist-drawer"
        size="min(96vw, 1080px)"
        append-to-body
        :with-header="false"
      >
        <section class="playlist-manager">
          <header class="playlist-manager__header">
            <div>
              <span class="eyebrow">Playlist Desk</span>
              <h2>整理音乐分类</h2>
              <p>先选择或新建歌单分类，再从所有歌曲里把合适的曲目放进去。</p>
            </div>
            <div class="playlist-manager__summary">
              <span>{{ adminPlaylists.length }} 个歌单</span>
              <span>{{ tracks.length }} 首歌曲</span>
              <span>{{ selectedPlaylistIds.length }} 已选</span>
              <el-button text @click="playlistDrawerVisible = false">关闭</el-button>
            </div>
          </header>

          <div class="playlist-workbench">
            <aside class="playlist-categories" v-loading="playlistLoading">
              <div class="playlist-categories__top">
                <div>
                  <strong>歌单分类</strong>
                  <span>像整理唱片夹一样管理分类。</span>
                </div>
                <el-button class="playlist-categories__new" type="primary" plain :icon="Plus" @click="resetPlaylistForm">
                  新建
                </el-button>
              </div>

              <button
                v-for="playlist in adminPlaylists"
                :key="playlist.id || playlist.name"
                type="button"
                class="playlist-category-card"
                :class="{ 'is-editing': playlistEditingId === playlist.id }"
                @click="editPlaylist(playlist)"
              >
                <span class="playlist-category-card__cover">
                  <img v-if="playlist.coverUrl" :src="playlist.coverUrl" :alt="playlist.name" />
                  <span v-else>{{ playlist.name.slice(0, 2) }}</span>
                </span>
                <span class="playlist-category-card__copy">
                  <strong>{{ playlist.name }}</strong>
                  <small>
                    {{ playlist.tracks?.length || 0 }} 首 · {{ playlist.publicPlaylist ? '公开' : '私密' }}
                    {{ playlist.defaultPlaylist ? ' · 默认' : '' }}
                  </small>
                </span>
              </button>

              <div v-if="!playlistLoading && adminPlaylists.length === 0" class="playlist-categories__empty">
                还没有歌单分类，先新建一个“今日电台”吧。
              </div>
            </aside>

            <main class="playlist-workspace">
              <section class="playlist-editor">
                <div class="playlist-editor__title">
                  <div>
                    <strong>{{ playlistEditingId == null ? '新建歌单分类' : '编辑歌单分类' }}</strong>
                    <span>{{ playlistEditingId == null ? '保存后会出现在公开音乐馆的歌单区。' : '修改基础信息，并继续整理歌曲顺序。' }}</span>
                  </div>
                  <div class="playlist-editor__tools">
                    <el-button
                      v-if="playlistEditingId != null && !playlistForm.defaultPlaylist"
                      text
                      @click="markEditingPlaylistDefault"
                    >
                      设为默认
                    </el-button>
                    <el-button text @click="resetPlaylistForm">清空</el-button>
                  </div>
                </div>

                <div class="playlist-form-grid">
                  <el-form-item label="歌单名称">
                    <el-input v-model="playlistForm.name" maxlength="120" placeholder="今日电台 / 夜读 / 写代码" />
                  </el-form-item>
                  <el-form-item label="封面地址">
                    <el-input v-model="playlistForm.coverUrl" clearable placeholder="可选，填写图片 URL" />
                  </el-form-item>
                </div>
                <div class="playlist-form-grid playlist-form-grid--wide">
                  <el-form-item label="描述">
                    <el-input v-model="playlistForm.description" maxlength="500" placeholder="这张歌单适合怎样的夜晚？" />
                  </el-form-item>
                </div>
                <el-form-item label="开场文案">
                  <el-input v-model="playlistForm.openingText" type="textarea" :rows="2" maxlength="255" />
                </el-form-item>

                <div class="playlist-switches">
                  <el-switch v-model="playlistForm.publicPlaylist" active-text="公开歌单" inactive-text="私密维护" />
                  <el-switch v-model="playlistForm.defaultPlaylist" active-text="默认电台" inactive-text="普通歌单" />
                </div>
              </section>

              <div class="playlist-track-workspace">
                <section class="playlist-library">
                  <div class="playlist-library__header">
                    <div>
                      <strong>所有歌曲</strong>
                      <span>点击歌曲即可加入或移出当前歌单。</span>
                    </div>
                    <el-button :disabled="!filteredUnselectedTracks.length" @click="addVisibleTracksToPlaylist">
                      加入当前筛选
                    </el-button>
                  </div>

                  <div class="playlist-library__filters">
                    <el-input v-model="playlistSearch" clearable placeholder="搜索歌名、歌手、专辑或标签" />
                    <el-segmented v-model="playlistStatusFilter" :options="playlistStatusOptions" />
                  </div>

                  <div v-if="filteredLibraryTracks.length === 0" class="playlist-library__empty">
                    没有匹配的歌曲。可以先去新增歌曲，或换个关键词试试。
                  </div>
                  <div v-else class="playlist-library__grid">
                    <button
                      v-for="track in filteredLibraryTracks"
                      :key="track.id"
                      type="button"
                      class="playlist-library-track"
                      :class="{ 'is-selected': selectedPlaylistIdSet.has(track.id) }"
                      @click="togglePlaylistTrack(track.id)"
                    >
                      <span class="playlist-library-track__cover">
                        <img v-if="track.coverUrl" :src="track.coverUrl" :alt="track.title" />
                        <span v-else>RADIO</span>
                      </span>
                      <span class="playlist-library-track__body">
                        <strong>{{ track.title }}</strong>
                        <small>{{ track.artist }}{{ track.album ? ` · ${track.album}` : '' }}</small>
                        <span>
                          {{ statusLabel(track.status) }}
                          <template v-if="track.genre"> · {{ track.genre }}</template>
                        </span>
                      </span>
                      <span class="playlist-library-track__state">
                        {{ selectedPlaylistIdSet.has(track.id) ? '已加入' : '加入' }}
                      </span>
                    </button>
                  </div>
                </section>

                <section class="playlist-selected">
                  <div class="playlist-selected__header">
                    <div>
                      <strong>当前歌单曲目</strong>
                      <span>{{ selectedPlaylistIds.length }} 首歌，保存后按这里的顺序播放。</span>
                    </div>
                    <el-button text :disabled="selectedPlaylistIds.length === 0" @click="clearSelectedPlaylistTracks">清空歌曲</el-button>
                  </div>

                  <div v-if="selectedPlaylistIds.length === 0" class="playlist-track-empty">
                    还没有加入歌曲。从左侧“所有歌曲”里点几首，歌单就有骨架了。
                  </div>
                  <div v-else class="playlist-track-list">
                    <article v-for="(trackId, index) in selectedPlaylistIds" :key="trackId" class="playlist-track-row">
                      <span class="playlist-track-row__index">{{ index + 1 }}</span>
                      <div>
                        <strong>{{ findTrack(trackId)?.title || `歌曲 ${trackId}` }}</strong>
                        <small>{{ findTrack(trackId)?.artist || '未知歌手' }} · {{ statusLabel(findTrack(trackId)?.status || 'draft') }}</small>
                      </div>
                      <div class="playlist-track-row__actions">
                        <button type="button" :disabled="index === 0" @click="movePlaylistTrack(index, -1)">上移</button>
                        <button type="button" :disabled="index === selectedPlaylistIds.length - 1" @click="movePlaylistTrack(index, 1)">下移</button>
                        <button type="button" @click="removeTrackFromPlaylist(trackId)">移除</button>
                      </div>
                    </article>
                  </div>
                </section>
              </div>

              <footer class="playlist-editor__footer">
                <span>{{ playlistForm.name.trim() || '未命名歌单' }} · {{ selectedPlaylistIds.length }} 首歌已选</span>
                <el-button type="primary" :loading="playlistSaving" :disabled="!canSavePlaylist" @click="savePlaylist">
                  保存歌单
                </el-button>
              </footer>
            </main>
          </div>
        </section>
      </el-drawer>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back, Delete, EditPen, Plus, Refresh, Right, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import {
  createMusicPlaylist,
  deleteMusicTrack,
  getAdminMusicPlaylists,
  getAdminMusicTracks,
  getDefaultRadio,
  getPublicMusicPlaylist,
  getPublicMusicPlaylists,
  getPublicMusicTracks,
  saveMusicPlaylistTracks,
  setDefaultMusicPlaylist,
  updateMusicPlaylist,
} from '@/api/music'
import { useMusicPlayerStore } from '@/stores/music-player'
import { useSiteConfig } from '@/composables/useSiteConfig'
import { resolveFeatureHero } from '@/modules/feature-access/constants'
import { useUserStore } from '@/stores/user'
import { isAdminUser } from '@/utils/permission'
import type { MusicPlaylist, MusicPlaylistUpsertCommand, MusicTrack, MusicTrackStatus } from '@/types'

interface LyricLine {
  key: string
  time?: number
  text: string
  current: boolean
}

const defaultHero = resolveFeatureHero(null, 'music')
const heroBgImage = ref(defaultHero.bgImage)
const heroBgPosition = ref(defaultHero.bgPosition)
const tracks = ref<MusicTrack[]>([])
const playlists = ref<MusicPlaylist[]>([])
const adminPlaylists = ref<MusicPlaylist[]>([])
const loading = ref(false)
const playlistDrawerVisible = ref(false)
const playlistLoading = ref(false)
const playlistSaving = ref(false)
const playlistEditingId = ref<number | null>(null)
const selectedPlaylistIds = ref<number[]>([])
const playlistSearch = ref('')
const playlistStatusFilter = ref<'all' | MusicTrackStatus>('all')
const expandedTrackId = ref<number | null>(null)
const player = useMusicPlayerStore()
const userStore = useUserStore()
const router = useRouter()
const { user } = storeToRefs(userStore)
const { loadSiteConfig } = useSiteConfig()
const canManage = computed(() => isAdminUser(user.value))
const activeTrack = computed(() => player.currentTrack)
const playlistForm = reactive<MusicPlaylistUpsertCommand>(createEmptyPlaylistForm())

const modeLabel = computed(() => {
  if (player.mode === 'single') return '单曲'
  if (player.mode === 'shuffle') return '随机'
  return '顺序'
})

const canSavePlaylist = computed(() => Boolean(playlistForm.name.trim()) && !playlistSaving.value)

const playlistStatusOptions = [
  { label: '全部', value: 'all' },
  { label: '公开', value: 'published' },
  { label: '草稿', value: 'draft' },
  { label: '归档', value: 'archived' },
]

const selectedPlaylistIdSet = computed(() => new Set(selectedPlaylistIds.value))

const filteredLibraryTracks = computed(() => {
  const keyword = playlistSearch.value.trim().toLowerCase()
  return tracks.value.filter((track) => {
    if (playlistStatusFilter.value !== 'all' && track.status !== playlistStatusFilter.value) return false
    if (!keyword) return true
    return [
      track.title,
      track.artist,
      track.album,
      track.genre,
      track.language,
      ...(track.tags || []),
    ].some((text) => (text || '').toLowerCase().includes(keyword))
  })
})

const filteredUnselectedTracks = computed(() => {
  return filteredLibraryTracks.value.filter((track) => !selectedPlaylistIdSet.value.has(track.id))
})

const activeLyricLines = computed<LyricLine[]>(() => {
  const track = activeTrack.value
  const lyrics = track?.lyrics?.trim()
  if (!lyrics) return []
  if (track?.lyricType !== 'lrc') {
    return lyrics.split('\n').filter(Boolean).slice(0, 8).map((text, index) => ({
      key: `plain-${index}`,
      text,
      current: index === 0,
    }))
  }
  const lines = parseLrc(lyrics)
  if (!lines.length) return []
  let currentIndex = 0
  for (let i = 0; i < lines.length; i++) {
    if ((lines[i].time ?? 0) <= player.playbackTime) currentIndex = i
  }
  return lines.slice(Math.max(0, currentIndex - 1), currentIndex + 3).map((line, offset) => ({
    ...line,
    current: Math.max(0, currentIndex - 1) + offset === currentIndex,
  }))
})

watch(
  activeTrack,
  (track) => {
    if (track?.id) {
      expandedTrackId.value = track.id
    }
  },
  { immediate: true },
)

onMounted(() => {
  void userStore.syncAuthState().finally(loadMusic)
  void loadSiteConfig(true).then((config) => {
    const hero = resolveFeatureHero(config, 'music')
    heroBgImage.value = hero.bgImage
    heroBgPosition.value = hero.bgPosition
  })
})

async function loadMusic() {
  loading.value = true
  try {
    const [trackRows, publicPlaylistRows, radio, adminPlaylistRows] = await Promise.all([
      canManage.value ? getAdminMusicTracks() : getPublicMusicTracks(),
      getPublicMusicPlaylists(),
      getDefaultRadio(),
      canManage.value ? getAdminMusicPlaylists() : Promise.resolve([]),
    ])
    tracks.value = trackRows
    adminPlaylists.value = adminPlaylistRows
    playlists.value = await hydratePublicPlaylists(publicPlaylistRows, radio)
    if (!player.hasQueue && radio.tracks?.length) {
      player.setQueue(radio.tracks, radio)
    }
  } finally {
    loading.value = false
  }
}

async function hydratePublicPlaylists(rows: MusicPlaylist[], radio: MusicPlaylist) {
  const details = await Promise.all(rows.map(async (playlist) => {
    if (!playlist.id) return playlist
    try {
      return await getPublicMusicPlaylist(playlist.id)
    } catch {
      return playlist
    }
  }))
  return mergePlaylists(radio.id ? [radio, ...details] : details)
}

function mergePlaylists(rows: MusicPlaylist[]) {
  const map = new Map<string, MusicPlaylist>()
  for (const row of rows) {
    const key = row.id == null ? `name:${row.name}` : `id:${row.id}`
    const existing = map.get(key)
    if (!existing) {
      map.set(key, { ...row, tracks: row.tracks ?? [] })
      continue
    }
    const rowTracks = row.tracks ?? []
    map.set(key, {
      ...existing,
      ...row,
      tracks: rowTracks.length ? rowTracks : existing.tracks,
    })
  }
  return Array.from(map.values())
}

async function selectPlaylist(playlist: MusicPlaylist) {
  const detail = playlist.id ? await getPublicMusicPlaylist(playlist.id) : playlist
  updateCachedPlaylist(detail)
  if (!detail.tracks?.length) {
    ElMessage.info('这个歌单还没有公开歌曲')
    return
  }
  player.setQueue(detail.tracks, detail)
  await player.playTrack(detail.tracks[0], detail.tracks, detail)
}

function updateCachedPlaylist(detail: MusicPlaylist) {
  const index = playlists.value.findIndex((playlist) => playlist.id === detail.id)
  if (index >= 0) {
    playlists.value.splice(index, 1, detail)
  }
}

async function playTrack(track: MusicTrack) {
  expandedTrackId.value = track.id
  await player.playTrack(track, tracks.value, player.currentPlaylist)
}

function toggleTrackExpanded(trackId: number) {
  expandedTrackId.value = expandedTrackId.value === trackId ? null : trackId
}

function cycleMode() {
  if (player.mode === 'sequence') player.setMode('shuffle')
  else if (player.mode === 'shuffle') player.setMode('single')
  else player.setMode('sequence')
}

function handleSeek(value: number | number[]) {
  player.seek(Array.isArray(value) ? value[0] : value)
}

function handleSeekPreview(value: number | number[]) {
  player.previewSeek(Array.isArray(value) ? value[0] : value)
}

function handleVolumeChange(value: number | number[]) {
  const nextValue = Array.isArray(value) ? value[0] : value
  player.setVolume(nextValue / 100)
}

function formatTrackDuration(track: MusicTrack) {
  const rawDuration = (track as MusicTrack & { duration?: number }).duration
  if (Number.isFinite(rawDuration) && (rawDuration || 0) > 0) {
    return formatTime(rawDuration as number)
  }
  return track.lyricType === 'lrc' ? 'LRC' : '歌词'
}

function formatPlaybackSummary(track: MusicTrack) {
  return `${formatTime(player.playbackTime)} / ${formatTrackDuration(track)}`
}

function openCreateTrack() {
  void router.push('/music/tracks/new')
}

function openEditTrack(track: MusicTrack) {
  void router.push(`/music/tracks/${track.id}/edit`)
}

async function removeTrack(track: MusicTrack) {
  try {
    await ElMessageBox.confirm(`确定删除《${track.title}》吗？如果它还在歌单里，后端会拒绝删除。`, '删除歌曲', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteMusicTrack(track.id)
    if (player.queue.some((item) => item.id === track.id)) {
      player.setQueue(player.queue.filter((item) => item.id !== track.id), player.currentPlaylist)
    }
    if (activeTrack.value?.id === track.id) {
      player.pause()
    }
    ElMessage.success('歌曲已删除')
    await loadMusic()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}

function openPlaylistManager() {
  playlistDrawerVisible.value = true
  resetPlaylistForm()
  void refreshAdminPlaylists()
}

async function refreshAdminPlaylists() {
  if (!canManage.value) return
  playlistLoading.value = true
  try {
    adminPlaylists.value = await getAdminMusicPlaylists()
  } finally {
    playlistLoading.value = false
  }
}

function editPlaylist(playlist: MusicPlaylist) {
  playlistEditingId.value = playlist.id ?? null
  Object.assign(playlistForm, {
    name: playlist.name || '',
    description: playlist.description || '',
    coverFileId: playlist.coverFileId,
    coverUrl: playlist.coverUrl || '',
    openingText: playlist.openingText || '',
    defaultPlaylist: Boolean(playlist.defaultPlaylist),
    publicPlaylist: playlist.publicPlaylist !== false,
  })
  selectedPlaylistIds.value = (playlist.tracks ?? []).map((track) => track.id)
}

function resetPlaylistForm() {
  playlistEditingId.value = null
  Object.assign(playlistForm, createEmptyPlaylistForm())
  selectedPlaylistIds.value = []
}

async function savePlaylist() {
  if (!canSavePlaylist.value) return
  playlistSaving.value = true
  try {
    const payload: MusicPlaylistUpsertCommand = {
      ...playlistForm,
      name: playlistForm.name.trim(),
      publicPlaylist: playlistForm.defaultPlaylist ? true : playlistForm.publicPlaylist,
    }
    const saved = playlistEditingId.value == null
      ? await createMusicPlaylist(payload)
      : await updateMusicPlaylist(playlistEditingId.value, payload)
    if (saved.id) {
      await saveMusicPlaylistTracks(saved.id, { trackIds: selectedPlaylistIds.value })
    }
    ElMessage.success('歌单已保存')
    resetPlaylistForm()
    await loadMusic()
    await refreshAdminPlaylists()
  } finally {
    playlistSaving.value = false
  }
}

async function markDefaultPlaylist(playlist: MusicPlaylist) {
  if (!playlist.id) return
  await setDefaultMusicPlaylist(playlist.id)
  ElMessage.success('默认电台已更新')
  await loadMusic()
  await refreshAdminPlaylists()
}

async function markEditingPlaylistDefault() {
  if (playlistEditingId.value == null) return
  await markDefaultPlaylist({ ...playlistForm, id: playlistEditingId.value, tracks: [] })
  playlistForm.defaultPlaylist = true
  playlistForm.publicPlaylist = true
}

function togglePlaylistTrack(trackId: number) {
  if (selectedPlaylistIdSet.value.has(trackId)) {
    removeTrackFromPlaylist(trackId)
    return
  }
  selectedPlaylistIds.value = [...selectedPlaylistIds.value, trackId]
}

function addVisibleTracksToPlaylist() {
  const selected = selectedPlaylistIdSet.value
  const nextTrackIds = filteredLibraryTracks.value
    .filter((track) => !selected.has(track.id))
    .map((track) => track.id)
  if (!nextTrackIds.length) return
  selectedPlaylistIds.value = [...selectedPlaylistIds.value, ...nextTrackIds]
}

function clearSelectedPlaylistTracks() {
  selectedPlaylistIds.value = []
}

function movePlaylistTrack(index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= selectedPlaylistIds.value.length) return
  const rows = [...selectedPlaylistIds.value]
  const current = rows[index]
  rows[index] = rows[nextIndex]
  rows[nextIndex] = current
  selectedPlaylistIds.value = rows
}

function removeTrackFromPlaylist(trackId: number) {
  selectedPlaylistIds.value = selectedPlaylistIds.value.filter((id) => id !== trackId)
}

function findTrack(trackId: number) {
  return tracks.value.find((track) => track.id === trackId)
}

function getPlaylistTrackCount(playlist: MusicPlaylist) {
  if (playlist.tracks?.length) return playlist.tracks.length
  if (player.currentPlaylist?.id === playlist.id) return player.queue.length
  return 0
}

function statusLabel(status: MusicTrackStatus) {
  if (status === 'published') return '公开'
  if (status === 'archived') return '归档'
  return '草稿'
}

function parseLrc(input: string): LyricLine[] {
  return input.split('\n').map((raw, index) => {
    const match = raw.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?](.*)$/)
    if (!match) return null
    const minute = Number(match[1])
    const second = Number(match[2])
    const ms = Number((match[3] || '0').padEnd(3, '0'))
    const text = match[4].trim()
    if (!text) return null
    return { key: `lrc-${index}`, time: minute * 60 + second + ms / 1000, text, current: false }
  }).filter(Boolean) as LyricLine[]
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '00:00'
  const minute = Math.floor(value / 60)
  const second = Math.floor(value % 60)
  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

function createEmptyPlaylistForm(): MusicPlaylistUpsertCommand {
  return {
    name: '',
    description: '',
    coverUrl: '',
    openingText: '',
    defaultPlaylist: false,
    publicPlaylist: true,
  }
}
</script>

<style scoped lang="scss">
.music-page {
  width: min(1180px, calc(100vw - 40px));
  margin: 0 auto;
  padding: 28px 0 44px;
  display: grid;
  gap: 22px;
}

.radio-panel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(240px, 340px) minmax(0, 1fr);
  gap: clamp(22px, 3vw, 34px);
  padding: clamp(18px, 2.3vw, 28px);
  border-radius: 30px;
  border: 1px solid rgba(255, 220, 232, 0.66);
  background:
    radial-gradient(circle at 8% 8%, rgba(255, 209, 226, 0.32), transparent 34%),
    radial-gradient(circle at 92% 12%, rgba(199, 189, 217, 0.24), transparent 32%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(255, 248, 252, 0.82));
  box-shadow: 0 22px 44px rgba(219, 174, 191, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

.radio-panel::before {
  content: '';
  position: absolute;
  inset: 18px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  pointer-events: none;
}

.radio-panel__visual {
  position: relative;
  min-width: 0;
  display: grid;
  place-items: center;
}

.radio-panel__cover {
  position: relative;
  width: min(100%, 310px);
  aspect-ratio: 1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, rgba(255, 248, 252, 0.92), rgba(239, 232, 245, 0.82));
  box-shadow:
    0 24px 42px rgba(164, 126, 148, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

.record-disc {
  position: relative;
  width: 86%;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.9) 0 10%, rgba(255, 180, 210, 0.44) 11% 18%, transparent 19%),
    repeating-radial-gradient(circle, rgba(255, 255, 255, 0.24) 0 2px, rgba(132, 92, 112, 0.08) 3px 5px),
    linear-gradient(135deg, #fff0f6, #efeaf7);
}

.record-disc::after {
  content: '';
  position: absolute;
  inset: 42%;
  border-radius: 50%;
  background: rgba(255, 252, 254, 0.88);
  box-shadow: inset 0 0 0 1px rgba(235, 203, 218, 0.9);
}

.record-disc__rings {
  position: absolute;
  inset: 11%;
  border-radius: 50%;
  border: 1px solid rgba(149, 118, 134, 0.16);
  box-shadow:
    0 0 0 28px rgba(255, 255, 255, 0.09),
    0 0 0 54px rgba(123, 87, 106, 0.06);
  pointer-events: none;
}

.radio-panel__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  transform: scale(0.72);
  box-shadow: 0 16px 30px rgba(90, 61, 77, 0.16);
}

.radio-panel__cover.is-playing .record-disc {
  animation: record-spin 24s linear infinite;
}

.tone-arm {
  position: absolute;
  top: 13%;
  right: 4%;
  width: 86px;
  height: 132px;
  transform: rotate(-20deg);
  transform-origin: 72px 20px;
  transition: transform 0.28s ease;
}

.tone-arm.is-playing {
  transform: rotate(-2deg);
}

.tone-arm__base {
  position: absolute;
  top: 0;
  right: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 252, 254, 0.88);
  box-shadow:
    0 10px 18px rgba(164, 126, 148, 0.16),
    inset 0 0 0 1px rgba(232, 204, 216, 0.74);
}

.tone-arm__needle {
  position: absolute;
  top: 30px;
  right: 19px;
  width: 10px;
  height: 112px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(207, 122, 154, 0.92), rgba(108, 80, 95, 0.62));
  transform: rotate(24deg);
  transform-origin: top center;
}

.radio-panel__cover-empty {
  position: relative;
  z-index: 1;
  color: #d57398;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.5;
  text-align: center;
}

.radio-panel__body {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 14px;
  align-content: start;
  min-width: 0;
}

.radio-panel__meta,
.radio-panel__admin-actions,
.track-card__actions,
.playlist-switches,
.playlist-editor__title,
.playlist-editor__footer,
.playlist-editor__tools,
.playlist-manager__summary,
.playlist-categories__top,
.playlist-category-card,
.playlist-library__header,
.playlist-selected__header,
.playlist-track-row,
.playlist-track-row__actions {
  display: flex;
  align-items: center;
}

.radio-panel__meta {
  flex-wrap: wrap;
  gap: 8px;
}

.radio-panel__meta span {
  padding: 6px 10px;
  border-radius: 999px;
  color: #9a6b7e;
  background: rgba(255, 250, 252, 0.74);
  border: 1px solid rgba(239, 216, 226, 0.72);
  font-size: 12px;
  line-height: 1;
}

.radio-panel__topline,
.radio-panel__title-row,
.shelf-heading,
.playlist-manager__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.radio-panel__admin-actions {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.eyebrow {
  color: #d984a5;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.radio-panel h2,
.shelf-heading h2,
.playlist-manager__header h2 {
  margin: 4px 0 0;
  color: #4f3c46;
  font-size: clamp(26px, 3vw, 42px);
  line-height: 1.12;
}

.radio-panel__title-row p,
.radio-panel__recommendation,
.playlist-manager__header p {
  margin: 8px 0 0;
  color: #8d7b84;
  line-height: 1.7;
}

.playlist-badge {
  flex: 0 0 auto;
  padding: 8px 12px;
  border-radius: 999px;
  color: #d86f98;
  background: rgba(255, 242, 247, 0.9);
  border: 1px solid rgba(239, 204, 217, 0.78);
  font-size: 12px;
  font-weight: 700;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.control-btn {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #8a7580;
  background: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(238, 218, 226, 0.82);
  transition: transform 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.control-btn:hover {
  transform: translateY(-1px);
  color: #fb7299;
  background: rgba(255, 250, 252, 0.96);
}

.control-btn--primary {
  width: 52px;
  height: 52px;
  color: #fff;
  background: linear-gradient(135deg, #fb7299, #ff95b7);
  box-shadow: 0 14px 26px rgba(251, 114, 153, 0.28);
}

.mode-btn {
  min-height: 36px;
  padding: 0 13px;
  border: 1px solid rgba(238, 218, 226, 0.86);
  border-radius: 999px;
  color: #a16d82;
  background: rgba(255, 252, 253, 0.9);
  cursor: pointer;
}

.progress-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  color: #a3919b;
  font-size: 12px;
}

.player-subcontrols {
  display: grid;
  grid-template-columns: auto minmax(96px, 180px) auto;
  gap: 10px;
  align-items: center;
  justify-content: start;
  color: #9b8792;
  font-size: 12px;
}

.volume-slider {
  width: 100%;
}

.lyric-window {
  min-height: 144px;
  max-height: 190px;
  overflow: auto;
  padding: 18px 20px;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 252, 253, 0.82), rgba(255, 247, 251, 0.68)),
    repeating-linear-gradient(180deg, transparent 0 33px, rgba(225, 197, 210, 0.25) 34px 35px);
  border: 1px solid rgba(241, 222, 230, 0.86);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.lyric-window p {
  margin: 0;
  color: #8d7b84;
  line-height: 1.9;
}

.lyric-window p.is-current {
  color: #e44d78;
  font-weight: 800;
}

.playlist-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 2px 8px;
}

.playlist-chip {
  min-width: 150px;
  padding: 12px 14px;
  border: 1px solid rgba(238, 218, 226, 0.84);
  border-radius: 18px;
  display: grid;
  gap: 6px;
  text-align: left;
  color: #6c5661;
  background: rgba(255, 255, 255, 0.78);
  cursor: pointer;
}

.playlist-chip.is-active {
  border-color: rgba(251, 114, 153, 0.56);
  background: rgba(255, 241, 247, 0.92);
}

.playlist-chip span {
  color: #c57b98;
  font-size: 12px;
}

.music-shelf {
  padding: clamp(18px, 2vw, 24px);
  border-radius: 26px;
  border: 1px solid rgba(238, 218, 226, 0.72);
  background: rgba(255, 255, 255, 0.74);
}

.shelf-heading {
  margin-bottom: 18px;
}

.shelf-heading h2 {
  font-size: 28px;
}

.music-state {
  padding: 42px 18px;
  text-align: center;
  color: #8d7b84;
}

.track-list-shell {
  display: grid;
  gap: 10px;
}

.track-row {
  overflow: hidden;
  border: 1px solid rgba(240, 216, 226, 0.86);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 24px rgba(220, 184, 198, 0.08);
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.track-row:hover,
.track-row.is-expanded,
.track-row.is-active {
  border-color: rgba(251, 114, 153, 0.52);
  box-shadow: 0 16px 30px rgba(220, 184, 198, 0.14);
  transform: translateY(-1px);
}

.track-row__main {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: auto 48px minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.track-row__index {
  color: #b88a9c;
  font-size: 12px;
  font-weight: 800;
}

.track-row__cover {
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #cf7b99;
  background: linear-gradient(135deg, #fff0f6, #f7f9ff);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.track-row__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.track-row__meta {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.track-row__meta strong {
  overflow: hidden;
  color: #4f3c46;
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-row__meta > span,
.track-row__meta small {
  overflow: hidden;
  color: #8d7b84;
  font-size: 12px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-row__state {
  display: flex;
  justify-content: flex-end;
}

.track-row__duration,
.track-row__playing {
  min-width: 82px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}

.track-row__duration {
  color: #9b8792;
  background: rgba(247, 243, 246, 0.94);
}

.track-row__playing {
  color: #d76e97;
  background: rgba(255, 242, 247, 0.96);
}

.track-row__chevron {
  color: #b58d9e;
  font-size: 14px;
  transition: transform 0.2s ease;
}

.track-row__chevron.is-expanded {
  transform: rotate(180deg);
}

.track-detail {
  border-top: 1px solid rgba(241, 223, 231, 0.92);
  background:
    linear-gradient(180deg, rgba(255, 250, 252, 0.98), rgba(255, 247, 251, 0.9)),
    radial-gradient(circle at 92% 8%, rgba(255, 204, 223, 0.18), transparent 28%);
}

.track-detail__play {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  padding: 12px 14px 0;
  border: 0;
  background: transparent;
  color: #d46d96;
  font-weight: 800;
  cursor: pointer;
}

.track-detail__main {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 14px;
  padding: 14px;
}

.track-detail__cover {
  width: 100%;
  min-height: 180px;
  border: 0;
  border-radius: 18px;
  overflow: hidden;
  display: grid;
  place-items: center;
  color: #cf7b99;
  background: linear-gradient(135deg, #fff0f6, #f7f9ff);
  cursor: pointer;
}

.track-detail__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.track-detail__cover span {
  letter-spacing: 0.12em;
  font-size: 12px;
  font-weight: 900;
}

.track-detail__content {
  min-width: 0;
  display: grid;
  gap: 10px;
  align-content: start;
}

.track-detail__title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.track-detail__title strong {
  color: #4f3c46;
  font-size: 18px;
}

.track-detail__title p,
.track-detail__note {
  margin: 0;
  color: #8d7b84;
  line-height: 1.65;
}

.track-detail__actions {
  display: flex;
  gap: 8px;
  flex: 0 0 auto;
}

.track-detail__icon {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #d56f95;
  background: rgba(255, 242, 247, 0.92);
  cursor: pointer;
}

.track-detail__icon--danger {
  color: #bd5f69;
  background: rgba(255, 239, 240, 0.94);
}

.track-detail__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.track-detail__tags span {
  padding: 5px 8px;
  border-radius: 999px;
  color: #d56f95;
  background: rgba(255, 243, 248, 0.96);
  font-size: 11px;
}

.track-detail__tags .track-detail__status {
  color: #7f6874;
  background: rgba(246, 241, 245, 0.96);
}

.track-detail__info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: #9b8792;
  font-size: 12px;
}

.track-detail-fade-enter-active,
.track-detail-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.track-detail-fade-enter-from,
.track-detail-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.playlist-manager {
  min-height: 100%;
  padding: clamp(18px, 2vw, 26px);
  color: #4f3c46;
  background:
    radial-gradient(circle at 12% 0%, rgba(255, 218, 232, 0.42), transparent 30%),
    radial-gradient(circle at 92% 14%, rgba(199, 189, 217, 0.25), transparent 28%),
    linear-gradient(180deg, #fffafd, #f8f4f7);
}

.playlist-manager__header {
  margin-bottom: 18px;
}

.playlist-manager__header h2 {
  font-size: clamp(30px, 3vw, 42px);
}

.playlist-manager__summary {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.playlist-manager__summary span {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(238, 218, 226, 0.9);
  border-radius: 999px;
  color: #9b7384;
  background: rgba(255, 255, 255, 0.74);
  font-size: 12px;
  font-weight: 800;
  line-height: 32px;
}

.playlist-workbench {
  display: grid;
  grid-template-columns: minmax(230px, 280px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.playlist-categories,
.playlist-editor,
.playlist-library,
.playlist-selected,
.playlist-editor__footer {
  border: 1px solid rgba(238, 218, 226, 0.84);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 34px rgba(217, 174, 190, 0.11);
}

.playlist-categories {
  position: sticky;
  top: 18px;
  display: grid;
  gap: 10px;
  max-height: calc(100vh - 74px);
  overflow: auto;
  padding: 14px;
}

.playlist-categories__top {
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 4px;
}

.playlist-categories__top div,
.playlist-editor__title div,
.playlist-library__header div,
.playlist-selected__header div {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.playlist-categories__top strong,
.playlist-editor__title strong,
.playlist-library__header strong,
.playlist-selected__header strong {
  color: #4f3c46;
  font-size: 16px;
}

.playlist-categories__top span,
.playlist-editor__title span,
.playlist-library__header span,
.playlist-selected__header span {
  color: #9b8792;
  font-size: 12px;
  line-height: 1.45;
}

.playlist-categories__new {
  flex: 0 0 auto;
}

.playlist-category-card {
  width: 100%;
  gap: 10px;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 17px;
  text-align: left;
  color: inherit;
  background: rgba(255, 250, 252, 0.72);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.playlist-category-card:hover,
.playlist-category-card.is-editing {
  transform: translateY(-1px);
  border-color: rgba(251, 114, 153, 0.42);
  background: rgba(255, 241, 247, 0.94);
}

.playlist-category-card__cover {
  flex: 0 0 46px;
  width: 46px;
  height: 46px;
  overflow: hidden;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #d46d96;
  background: linear-gradient(135deg, rgba(255, 239, 246, 0.96), rgba(244, 240, 249, 0.9));
  font-size: 13px;
  font-weight: 900;
}

.playlist-category-card__cover img,
.playlist-library-track__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-category-card__copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.playlist-category-card__copy strong,
.playlist-library-track__body strong {
  overflow: hidden;
  color: #4f3c46;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-category-card__copy small,
.playlist-library-track__body small,
.playlist-library-track__body > span,
.playlist-track-row small {
  overflow: hidden;
  color: #8d7b84;
  font-size: 12px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-categories__empty,
.playlist-library__empty,
.playlist-track-empty {
  padding: 24px 14px;
  border: 1px dashed rgba(238, 218, 226, 0.9);
  border-radius: 16px;
  color: #9b8792;
  text-align: center;
  background: rgba(255, 250, 252, 0.56);
}

.playlist-workspace {
  display: grid;
  gap: 14px;
}

.playlist-track-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(280px, 0.82fr);
  gap: 14px;
  align-items: stretch;
}

.playlist-editor {
  display: grid;
  gap: 14px;
  padding: 18px 18px 16px;
}

.playlist-editor__title,
.playlist-editor__footer {
  justify-content: space-between;
  gap: 12px;
}

.playlist-editor__tools {
  flex: 0 0 auto;
  gap: 4px;
}

.playlist-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px;
  gap: 12px;
}

.playlist-form-grid--wide {
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.88fr);
}

.playlist-switches {
  gap: 18px;
  flex-wrap: wrap;
}

.playlist-library,
.playlist-selected {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.playlist-library__header,
.playlist-selected__header {
  justify-content: space-between;
  gap: 12px;
}

.playlist-library__filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.playlist-library__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
  max-height: 306px;
  overflow: auto;
  padding-right: 2px;
}

.playlist-library-track {
  min-width: 0;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 9px;
  border: 1px solid rgba(238, 224, 231, 0.86);
  border-radius: 17px;
  text-align: left;
  color: inherit;
  background: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.playlist-library-track:hover {
  transform: translateY(-1px);
  border-color: rgba(251, 114, 153, 0.36);
  background: rgba(255, 250, 252, 0.96);
}

.playlist-library-track.is-selected {
  border-color: rgba(251, 114, 153, 0.55);
  background: rgba(255, 241, 247, 0.94);
}

.playlist-library-track__cover {
  width: 54px;
  height: 54px;
  overflow: hidden;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #cf7b99;
  background: linear-gradient(135deg, #fff0f6, #f7f9ff);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.playlist-library-track__body {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.playlist-library-track__state {
  min-width: 48px;
  padding: 6px 9px;
  border-radius: 999px;
  color: #d76e97;
  background: rgba(255, 242, 247, 0.92);
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}

.playlist-library-track.is-selected .playlist-library-track__state {
  color: #fff;
  background: linear-gradient(135deg, #fb7299, #ff95b7);
}

.playlist-track-list {
  display: grid;
  gap: 8px;
  max-height: 306px;
  overflow: auto;
  padding-right: 2px;
}

.playlist-track-row {
  gap: 12px;
  padding: 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(238, 224, 231, 0.8);
}

.playlist-track-row__index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #d96f98;
  background: rgba(255, 241, 247, 0.9);
  font-weight: 800;
}

.playlist-track-row div:nth-child(2) {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 3px;
}

.playlist-track-row strong {
  color: #4f3c46;
}

.playlist-track-row__actions {
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.playlist-track-row__actions button {
  border: 1px solid rgba(238, 218, 226, 0.9);
  border-radius: 999px;
  color: #9a6b7e;
  background: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}

.playlist-track-row__actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.playlist-editor__footer {
  padding: 12px 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 250, 253, 0.92)),
    radial-gradient(circle at 100% 0%, rgba(255, 203, 223, 0.28), transparent 34%);
}

:deep(.music-playlist-drawer .el-drawer__body) {
  padding: 0;
}

:deep(.playlist-manager .el-form-item) {
  margin-bottom: 0;
}

:deep(.playlist-manager .el-form-item__label) {
  color: #4f3c46;
  font-weight: 800;
}

@keyframes record-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .radio-panel__cover.is-playing .record-disc {
    animation: none;
  }
}

@media (max-width: 860px) {
  .music-page {
    width: min(100vw - 24px, 100%);
    padding-top: 18px;
  }

  .radio-panel {
    grid-template-columns: 1fr;
  }

  .radio-panel__cover {
    width: min(100%, 320px);
    justify-self: center;
  }

  .radio-panel__topline,
  .radio-panel__title-row,
  .shelf-heading,
  .playlist-manager__header,
  .playlist-library__header,
  .playlist-selected__header {
    flex-direction: column;
  }

  .playlist-form-grid,
  .playlist-form-grid--wide,
  .playlist-library__filters,
  .playlist-workbench,
  .playlist-track-workspace {
    grid-template-columns: 1fr;
  }

  .playlist-categories {
    position: static;
    max-height: none;
  }

  .track-row__main,
  .track-detail__main {
    grid-template-columns: 1fr;
  }

  .track-row__main {
    gap: 10px;
  }

  .track-row__state {
    justify-content: flex-start;
  }

  .track-row__chevron {
    justify-self: end;
  }

  .track-detail__cover {
    min-height: 220px;
  }

  .track-detail__title {
    flex-direction: column;
  }
}
</style>
