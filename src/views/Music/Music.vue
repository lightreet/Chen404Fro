<template>
  <DefaultLayout wide-content>
    <template #hero>
      <PageHero
        title="音乐馆"
        eyebrow="Music Hall"
        subtitle="按分类整理每一首值得回放的歌。"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="56vh"
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
              <div v-else class="radio-panel__cover-empty">Music<br />Hall</div>
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
          </div>

          <div class="radio-panel__title-row">
            <div>
              <h2>{{ activeTrack?.title || '音乐馆' }}</h2>
              <p>{{ activeTrack ? `${activeTrack.artist}${activeTrack.album ? ` · ${activeTrack.album}` : ''}` : '等待第一首歌开始播放。' }}</p>
            </div>
            <span v-if="player.currentPlaylist?.name" class="playlist-badge">{{ player.currentPlaylist.name }}</span>
          </div>

          <div class="radio-panel__meta">
            <span>{{ activeTrack?.genre || '音乐馆' }}</span>
            <span>{{ activeTrack?.language || 'Lyra Select' }}</span>
            <span>{{ player.queue.length }} 首在队列</span>
          </div>

          <p class="radio-panel__recommendation">
            {{ activeTrack?.recommendation || player.currentPlaylist?.description || '点一首歌，让今晚从这一段旋律开始。' }}
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
          </div>

          <div class="audio-visualizer" :class="{ 'is-active': player.playing }" aria-label="Audio visualizer">
            <span class="audio-visualizer__pulse" aria-hidden="true"></span>
            <div class="audio-visualizer__bars" aria-hidden="true">
              <span
                v-for="(bar, index) in visualizerBars"
                :key="index"
                class="audio-visualizer__bar"
                :style="{
                  '--bar-height': `${bar.height}px`,
                  '--bar-delay': `${bar.delay}ms`,
                  '--bar-boost': String(bar.boost),
                }"
              ></span>
            </div>
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

      <section class="music-shelf">
        <div class="shelf-heading">
          <div class="shelf-heading__actions">
            <div class="shelf-search-shell">
              <el-input
                v-model="playlistSearch"
                class="playlist-manager__search"
                clearable
                placeholder="搜索歌曲、歌手、专辑或标签"
                @keyup.enter="handlePlaylistSearchSubmit"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button class="shelf-search-button" @click="handlePlaylistSearchSubmit">搜索</el-button>
            </div>
            <div v-if="canManage" class="playlist-status-filter" aria-label="歌曲状态筛选">
              <button
                v-for="option in playlistStatusOptions"
                :key="option.value"
                type="button"
                class="playlist-status-filter__option"
                :class="{ 'is-active': playlistStatusFilter === option.value }"
                @click="playlistStatusFilter = option.value"
              >
                {{ option.label }}
              </button>
            </div>
            <div v-if="canManage" class="shelf-heading__buttons">
              <el-button class="shelf-heading__add" type="primary" :icon="Plus" @click="openCreateTrack">新增歌曲</el-button>
              <el-button class="shelf-heading__refresh" :icon="Refresh" @click="loadMusic">刷新</el-button>
            </div>
          </div>
        </div>

        <div v-if="loading" class="music-state">音乐列表加载中...</div>
        <div v-else-if="loadError" class="music-state music-state--error">
          <strong>音乐内容加载失败</strong>
          <span>{{ loadError }}</span>
          <el-button class="shelf-heading__refresh" :icon="Refresh" @click="loadMusic">重新加载</el-button>
        </div>
        <div v-else-if="tracks.length === 0" class="music-state">
          这里还没有公开歌曲。
          <el-button v-if="canManage" type="primary" link @click="openCreateTrack">现在新增</el-button>
        </div>
        <div v-else class="music-category-workbench">
          <aside class="playlist-categories">
            <button
              type="button"
              class="playlist-category-card"
              :class="{ 'is-editing': selectedCategoryId == null }"
              @click="selectCategory(null)"
            >
              <span class="playlist-category-card__marker">
                <el-icon><Folder /></el-icon>
              </span>
              <span class="playlist-category-card__copy">
                <strong>全部分类</strong>
                <small>{{ tracks.length }} 首</small>
              </span>
            </button>

            <button
              v-for="playlist in categoryPlaylists"
              :key="playlist.id || playlist.name"
              type="button"
              class="playlist-category-card"
              :class="{ 'is-editing': selectedCategoryId === playlist.id }"
              @click="selectCategory(playlist.id ?? null)"
            >
              <span class="playlist-category-card__marker">
                <el-icon><Folder /></el-icon>
              </span>
              <span class="playlist-category-card__copy">
                <strong>{{ playlist.name }}</strong>
                <small>{{ playlist.tracks?.length ?? 0 }} 首</small>
              </span>
            </button>

            <div v-if="canManage" class="playlist-categories__create">
              <template v-if="creatingCategory">
                <el-input v-model="categoryDraft" maxlength="120" placeholder="分类名称，例如 夜读" @keyup.enter="saveCategory" />
                <div class="playlist-categories__create-actions">
                  <el-button text @click="cancelCreateCategory">取消</el-button>
                  <el-button type="primary" :loading="playlistSaving" :disabled="!categoryDraft.trim()" @click="saveCategory">
                    保存
                  </el-button>
                </div>
              </template>
              <button v-else type="button" class="playlist-categories__new" @click="startCreateCategory">
                <el-icon><Plus /></el-icon>
                新增分类
              </button>
            </div>
          </aside>

          <main class="playlist-workspace">
            <section class="category-track-board">
              <div class="category-track-board__head">
                <div>
                  <strong>{{ selectedCategoryName }}</strong>
                  <span>{{ filteredCategoryTracks.length }} 首歌曲</span>
                </div>
                <div class="category-track-board__toolbar">
                  <div class="play-mode-toggle" aria-label="播放模式">
                    <button
                      type="button"
                      :class="{ 'is-active': player.mode === 'sequence' || player.mode === 'single' }"
                      :title="player.mode === 'single' ? '当前为单曲循环，点击切回顺序播放' : '顺序播放'"
                      @click="setPlayMode('sequence')"
                    >
                      <el-icon><Sort /></el-icon>
                    </button>
                    <button
                      type="button"
                      :class="{ 'is-active': player.mode === 'shuffle' }"
                      title="随机播放"
                      @click="setPlayMode('shuffle')"
                    >
                      <Icon icon="mdi:shuffle" class="play-mode-icon" aria-hidden="true" />
                    </button>
                  </div>
                  <div
                    v-if="canManage && selectedCategory"
                    class="category-track-board__actions"
                    aria-label="分类管理"
                  >
                    <button type="button" @click="renameCategory">
                      <el-icon><Edit /></el-icon>
                      编辑分类
                    </button>
                    <button type="button" class="is-danger" @click="removeCategory">
                      <el-icon><Delete /></el-icon>
                      删除分类
                    </button>
                  </div>
                  <div class="music-view-toggle" aria-label="歌曲展示方式">
                    <button
                      type="button"
                      :class="{ 'is-active': musicDisplayMode === 'cards' }"
                      title="卡片展示"
                      @click="setMusicDisplayMode('cards')"
                    >
                      <el-icon><Grid /></el-icon>
                      卡片
                    </button>
                    <button
                      type="button"
                      :class="{ 'is-active': musicDisplayMode === 'rows' }"
                      title="列表展示"
                      @click="setMusicDisplayMode('rows')"
                    >
                      <el-icon><List /></el-icon>
                      列表
                    </button>
                  </div>
                </div>
              </div>

              <div class="category-track-board__content">
                <div v-if="filteredCategoryTracks.length === 0" class="playlist-library__empty">
                  当前分类下还没有歌曲。
                </div>
                <template v-else-if="musicDisplayMode === 'cards'">
                  <div class="category-track-board__view category-track-board__view--cards">
                    <div class="music-card-grid">
                      <article
                        v-for="track in paginatedCategoryTracks"
                        :key="track.id"
                        class="music-track-card"
                      >
                      <div class="music-track-card__cover">
                        <img v-if="track.coverUrl" :src="track.coverUrl" :alt="track.title" />
                        <span v-else class="music-track-card__fallback">Music</span>
                        <span class="music-track-card__duration">{{ getTrackDurationLabel(track) }}</span>
                        <span v-if="canManage" class="music-track-card__status">{{ statusLabel(track.status) }}</span>
                        <button type="button" class="music-track-card__play" title="播放" @click="playTrack(track)">
                          <el-icon><VideoPlay /></el-icon>
                        </button>
                      </div>

                      <div class="music-track-card__body">
                        <div class="music-track-card__titleline">
                          <strong>{{ track.title }}</strong>
                          <span class="music-track-card__meter" aria-hidden="true">
                            <i></i>
                            <i></i>
                            <i></i>
                            <i></i>
                          </span>
                        </div>
                        <span class="music-track-card__artist">{{ track.artist }}</span>
                        <p class="music-track-card__quote">{{ track.moodText || track.recommendation || track.album || '还没有写下推荐语。' }}</p>
                      </div>

                      <div class="music-track-card__meta">
                        <span>{{ track.album || '未填写专辑' }}</span>
                        <span>{{ getTrackCategoryNames(track).join(' / ') || '无分类' }}</span>
                      </div>

                      <div class="music-track-card__footer">
                        <span class="music-track-card__year">
                          <Icon icon="mdi:calendar-clock" class="music-track-card__year-icon" aria-hidden="true" />
                          {{ track.releaseYear || '年份未知' }}
                        </span>
                        <div class="music-track-card__actions">
                          <button type="button" title="播放" @click="playTrack(track)">
                            <el-icon><VideoPlay /></el-icon>
                          </button>
                          <button v-if="canManage" type="button" title="编辑歌曲" @click="openEditTrack(track)">
                            <el-icon><Edit /></el-icon>
                          </button>
                          <button
                            v-if="canManage && selectedCategory && !isTrackInSelectedCategory(track.id)"
                            type="button"
                            title="加入当前分类"
                            :disabled="playlistSaving"
                            @click="addTrackToSelectedCategory(track.id)"
                          >
                            <el-icon><Plus /></el-icon>
                          </button>
                          <button
                            v-if="canManage && selectedCategory && isTrackInSelectedCategory(track.id)"
                            type="button"
                            title="移出当前分类"
                            :disabled="playlistSaving"
                            @click="removeTrackFromSelectedCategory(track.id)"
                          >
                            <el-icon><Close /></el-icon>
                          </button>
                          <button
                            v-if="canManage"
                            type="button"
                            class="is-danger"
                            title="删除歌曲"
                            @click="removeTrack(track)"
                          >
                            <el-icon><Delete /></el-icon>
                          </button>
                        </div>
                      </div>
                      </article>
                    </div>
                    <div v-if="filteredCategoryTracks.length > musicCardPageSize" class="music-card-pagination">
                      <el-pagination
                        v-model:current-page="musicCardPage"
                        :page-size="musicCardPageSize"
                        :total="filteredCategoryTracks.length"
                        background
                        layout="prev, pager, next"
                        @current-change="handleMusicCardPageChange"
                      />
                    </div>
                  </div>
                </template>
                <div v-else class="category-track-board__view category-track-board__view--rows">
                  <div class="category-track-table">
                    <div class="category-track-table__header">
                      <span>#</span>
                      <span>标题</span>
                      <span>专辑</span>
                      <span>分类</span>
                      <span>时长</span>
                      <span>播放</span>
                      <span>详情</span>
                    </div>

                    <article
                      v-for="(track, index) in paginatedCategoryRows"
                      :key="track.id"
                      class="category-track-row"
                      :class="{ 'is-expanded': expandedManagedTrackId === track.id }"
                    >
                      <div
                        class="category-track-row__main"
                        role="button"
                        tabindex="0"
                        @click="toggleManagedTrackExpanded(track.id)"
                        @keyup.enter="toggleManagedTrackExpanded(track.id)"
                        @keyup.space.prevent="toggleManagedTrackExpanded(track.id)"
                      >
                        <span class="category-track-row__index">{{ String((musicRowPage - 1) * musicRowPageSize + index + 1).padStart(2, '0') }}</span>
                        <span class="category-track-row__title">
                          <span class="category-track-row__cover">
                            <img v-if="track.coverUrl" :src="track.coverUrl" :alt="track.title" />
                            <span v-else>♪</span>
                          </span>
                          <span>
                            <strong>{{ track.title }}</strong>
                            <small>{{ track.artist }}</small>
                          </span>
                        </span>
                        <span class="category-track-row__album">{{ track.album || '未填写专辑' }}</span>
                        <span class="category-track-row__categories">
                          {{ getTrackCategoryNames(track).join(' / ') || '无分类' }}
                        </span>
                        <span class="category-track-row__duration">{{ getTrackDurationLabel(track) }}</span>
                        <span class="category-track-row__controls">
                          <button
                            type="button"
                            class="category-track-row__play"
                            :class="{ 'is-active': activeTrack?.id === track.id && player.playing }"
                            title="播放"
                            @click.stop="playTrack(track, false)"
                          >
                            <el-icon><VideoPlay /></el-icon>
                          </button>
                          <button
                            type="button"
                            class="category-track-row__play category-track-row__play--pause"
                            :class="{ 'is-active': activeTrack?.id === track.id && !player.playing }"
                            :disabled="activeTrack?.id !== track.id"
                            title="暂停"
                            @click.stop="pauseTrack(track)"
                          >
                            <el-icon><VideoPause /></el-icon>
                          </button>
                        </span>
                        <span class="category-track-row__expand">
                          {{ expandedManagedTrackId === track.id ? '收起' : '展开' }}
                        </span>
                      </div>

                      <transition name="track-detail-fade">
                        <div v-if="expandedManagedTrackId === track.id" class="track-detail category-track-detail-card">
                          <div class="track-detail__action-bar">
                            <button v-if="canManage" type="button" class="track-detail__icon-btn" title="编辑歌曲" @click="openEditTrack(track)">
                              <el-icon><Edit /></el-icon>
                            </button>
                            <button
                              v-if="canManage && selectedCategory && !isTrackInSelectedCategory(track.id)"
                              type="button"
                              class="track-detail__icon-btn"
                              title="加入当前分类"
                              :disabled="playlistSaving"
                              @click="addTrackToSelectedCategory(track.id)"
                            >
                              <el-icon><Plus /></el-icon>
                            </button>
                            <button
                              v-if="canManage && selectedCategory && isTrackInSelectedCategory(track.id)"
                              type="button"
                              class="track-detail__icon-btn track-detail__icon-btn--danger"
                              title="移出当前分类"
                              :disabled="playlistSaving"
                              @click="removeTrackFromSelectedCategory(track.id)"
                            >
                              <el-icon><Close /></el-icon>
                            </button>
                            <button
                              v-if="canManage"
                              type="button"
                              class="track-detail__icon-btn track-detail__icon-btn--danger"
                              title="删除歌曲"
                              @click="removeTrack(track)"
                            >
                              <el-icon><Delete /></el-icon>
                            </button>
                          </div>

                          <div class="track-detail__main">
                            <section class="track-detail__identity">
                              <div class="track-detail__title">
                                <strong>{{ track.title }}</strong>
                                <p>{{ track.artist }}{{ track.album ? ` · ${track.album}` : '' }}</p>
                              </div>

                              <button
                                type="button"
                                class="track-detail__cover"
                                :class="{ 'is-playing': activeTrack?.id === track.id && player.playing }"
                                title="播放这首歌"
                                @click="playTrack(track)"
                              >
                                <span class="track-detail__record" aria-hidden="true"></span>
                                <span class="track-detail__cover-frame">
                                  <img v-if="track.coverUrl" :src="track.coverUrl" :alt="track.title" />
                                  <span v-else>PLAY</span>
                                </span>
                              </button>
                            </section>

                            <section class="track-detail__content">
                              <span v-if="track.moodText" class="track-detail__mood">{{ track.moodText }}</span>

                              <p class="track-detail__note">{{ track.recommendation || '这首歌还没有推荐语。' }}</p>

                              <div class="track-detail__tags">
                                <span v-if="canManage" class="track-detail__status">{{ statusLabel(track.status) }}</span>
                                <span v-if="track.genre">{{ track.genre }}</span>
                                <span v-if="track.language">{{ track.language }}</span>
                                <span v-for="tag in track.tags.slice(0, 4)" :key="tag">{{ tag }}</span>
                              </div>

                              <div class="category-track-detail__chips category-track-detail__chips--category">
                                <template v-if="canManage">
                                  <button
                                    v-for="playlist in categoryPlaylists"
                                    :key="playlist.id || playlist.name"
                                    type="button"
                                    :class="{ 'is-active': isTrackInCategory(track.id, playlist) }"
                                    @click.stop="toggleTrackCategory(track.id, playlist)"
                                  >
                                    {{ playlist.name }}
                                  </button>
                                  <span v-if="categoryPlaylists.length === 0">先在左侧新增分类</span>
                                </template>
                                <template v-else>
                                  <span v-for="name in getTrackCategoryNames(track)" :key="name">{{ name }}</span>
                                  <span v-if="getTrackCategoryNames(track).length === 0">无分类</span>
                                </template>
                              </div>

                              <div class="track-detail__info">
                                <span>
                                  <small>专辑</small>
                                  <strong>{{ track.album || '未填写' }}</strong>
                                </span>
                                <span>
                                  <small>年份</small>
                                  <strong>{{ track.releaseYear || '未知' }}</strong>
                                </span>
                                <span>
                                  <small>时长</small>
                                  <strong>{{ getTrackDurationLabel(track) }}</strong>
                                </span>
                                <span>
                                  <small>歌词</small>
                                  <strong>{{ track.lyricType === 'lrc' ? 'LRC 时间轴' : '普通歌词' }}</strong>
                                </span>
                              </div>
                            </section>

                            <aside class="track-detail__lyrics">
                              <div class="track-detail__lyrics-head">
                                <strong>歌词预览</strong>
                                <span>{{ track.lyricType === 'lrc' ? 'LRC' : '歌词' }}</span>
                              </div>
                              <div class="track-detail__lyrics-lines">
                                <p v-if="getTrackLyricPreview(track).length === 0" class="is-empty">这首歌还没有写下歌词。</p>
                                <p
                                  v-for="line in getTrackLyricPreview(track)"
                                  :key="line.key"
                                  :class="{ 'is-current': line.current }"
                                >
                                  {{ line.text }}
                                </p>
                              </div>
                              <p v-if="track.lyricSource" class="track-detail__lyric-source">歌词来源：{{ track.lyricSource }}</p>
                            </aside>
                          </div>
                        </div>
                      </transition>
                    </article>
                  </div>
                  <div v-if="filteredCategoryTracks.length > musicRowPageSize" class="music-list-pagination">
                    <el-pagination
                      v-model:current-page="musicRowPage"
                      :page-size="musicRowPageSize"
                      :total="filteredCategoryTracks.length"
                      background
                      layout="prev, pager, next"
                      @current-change="handleMusicRowPageChange"
                    />
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </section>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back, Close, Delete, Edit, Folder, Grid, List, Plus, Refresh, Right, Search, Sort, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import {
  createMusicPlaylist,
  deleteMusicPlaylist,
  deleteMusicTrack,
  getAdminMusicPlaylists,
  getAdminMusicTracks,
  getPublicMusicPlaylist,
  getPublicMusicPlaylists,
  getPublicMusicTracks,
  saveMusicPlaylistTracks,
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
const adminPlaylists = ref<MusicPlaylist[]>([])
const loading = ref(false)
const loadError = ref('')
const trackDurationMap = ref<Record<number, number>>({})
const playlistSaving = ref(false)
const selectedCategoryId = ref<number | null>(null)
const expandedManagedTrackId = ref<number | null>(null)
const creatingCategory = ref(false)
const categoryDraft = ref('')
const playlistSearch = ref('')
type PlaylistStatusFilter = 'all' | MusicTrackStatus

const playlistStatusFilter = ref<PlaylistStatusFilter>('all')
const musicDisplayMode = ref<'cards' | 'rows'>('cards')
const musicCardPageSize = 8
const musicCardPage = ref(1)
const musicRowPageSize = 10
const musicRowPage = ref(1)
const player = useMusicPlayerStore()
const userStore = useUserStore()
const router = useRouter()
const resolvingTrackDurationIds = new Set<number>()
const { user } = storeToRefs(userStore)
const { loadSiteConfig } = useSiteConfig()
const canManage = computed(() => isAdminUser(user.value))
const activeTrack = computed(() => player.currentTrack)
const visualizerBars = [
  { height: 16, delay: 0, boost: 1.05 },
  { height: 9, delay: 120, boost: 1.65 },
  { height: 24, delay: 240, boost: 1.2 },
  { height: 13, delay: 80, boost: 1.8 },
  { height: 30, delay: 180, boost: 1.12 },
  { height: 18, delay: 300, boost: 1.48 },
  { height: 10, delay: 40, boost: 1.9 },
  { height: 22, delay: 220, boost: 1.26 },
  { height: 35, delay: 340, boost: 1.05 },
  { height: 14, delay: 140, boost: 1.72 },
  { height: 26, delay: 260, boost: 1.16 },
  { height: 18, delay: 20, boost: 1.56 },
  { height: 31, delay: 200, boost: 1.08 },
  { height: 12, delay: 320, boost: 1.82 },
  { height: 23, delay: 100, boost: 1.32 },
  { height: 15, delay: 280, boost: 1.68 },
  { height: 28, delay: 60, boost: 1.14 },
  { height: 11, delay: 360, boost: 1.86 },
  { height: 20, delay: 160, boost: 1.42 },
  { height: 9, delay: 380, boost: 1.95 },
]

const playlistStatusOptions: Array<{ label: string; value: PlaylistStatusFilter }> = [
  { label: '全部', value: 'all' },
  { label: '已发布', value: 'published' },
  { label: '草稿', value: 'draft' },
  { label: '已归档', value: 'archived' },
]

const trackMap = computed(() => new Map(tracks.value.map((track) => [track.id, track])))
const categoryPlaylists = computed(() => adminPlaylists.value)

const selectedCategory = computed(() => {
  if (selectedCategoryId.value == null) return null
  return adminPlaylists.value.find((playlist) => playlist.id === selectedCategoryId.value) ?? null
})

const selectedCategoryName = computed(() => selectedCategory.value?.name || '全部分类')

const categoryBaseTracks = computed(() => {
  const category = selectedCategory.value
  if (!category) return tracks.value
  return (category.tracks ?? [])
    .map((track) => trackMap.value.get(track.id))
    .filter(Boolean) as MusicTrack[]
})

const filteredCategoryTracks = computed(() => {
  const keyword = playlistSearch.value.trim().toLowerCase()
  return categoryBaseTracks.value.filter((track) => {
    if (playlistStatusFilter.value !== 'all' && track.status !== playlistStatusFilter.value) {
      return false
    }
    if (!keyword) return true
    return matchesTrackKeyword(track, keyword)
  })
})

const musicCardPageCount = computed(() => Math.max(1, Math.ceil(filteredCategoryTracks.value.length / musicCardPageSize)))

const paginatedCategoryTracks = computed(() => {
  const start = (musicCardPage.value - 1) * musicCardPageSize
  return filteredCategoryTracks.value.slice(start, start + musicCardPageSize)
})

const musicRowPageCount = computed(() => Math.max(1, Math.ceil(filteredCategoryTracks.value.length / musicRowPageSize)))

const paginatedCategoryRows = computed(() => {
  const start = (musicRowPage.value - 1) * musicRowPageSize
  return filteredCategoryTracks.value.slice(start, start + musicRowPageSize)
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

function getTrackLyricPreview(track: MusicTrack): LyricLine[] {
  const lyrics = track.lyrics?.trim()
  if (!lyrics) return []

  if (track.lyricType !== 'lrc') {
    return lyrics.split('\n').filter(Boolean).map((text, index) => ({
      key: `${track.id}-plain-${index}`,
      text,
      current: activeTrack.value?.id === track.id && index === 0,
    }))
  }

  const lines = parseLrc(lyrics)
  if (!lines.length) return []

  if (activeTrack.value?.id !== track.id) {
    return lines.map((line) => ({
      ...line,
      key: `${track.id}-${line.key}`,
      current: false,
    }))
  }

  let currentIndex = 0
  for (let i = 0; i < lines.length; i++) {
    if ((lines[i].time ?? 0) <= player.playbackTime) currentIndex = i
  }

  return lines.map((line, index) => ({
    ...line,
    key: `${track.id}-${line.key}`,
    current: index === currentIndex,
  }))
}

onMounted(() => {
  void userStore.syncAuthState().finally(loadMusic)
  void loadSiteConfig(true).then((config) => {
    const hero = resolveFeatureHero(config, 'music')
    heroBgImage.value = hero.bgImage
    heroBgPosition.value = hero.bgPosition
  })
})

watch(
  () => [activeTrack.value?.id, player.duration] as const,
  ([trackId, duration]) => {
    if (trackId == null || !Number.isFinite(duration) || duration <= 0) return
    trackDurationMap.value = {
      ...trackDurationMap.value,
      [trackId]: duration,
    }
  },
  { immediate: true },
)

watch([selectedCategoryId, playlistSearch, playlistStatusFilter, musicDisplayMode], () => {
  musicCardPage.value = 1
  musicRowPage.value = 1
})

watch(
  () => filteredCategoryTracks.value.length,
  () => {
    if (musicCardPage.value > musicCardPageCount.value) {
      musicCardPage.value = musicCardPageCount.value
    }
    if (musicRowPage.value > musicRowPageCount.value) {
      musicRowPage.value = musicRowPageCount.value
    }
  },
)

async function loadMusic() {
  loading.value = true
  loadError.value = ''
  try {
    const [trackRows, categoryRows] = await Promise.all([
      canManage.value ? getAdminMusicTracks() : getPublicMusicTracks(),
      canManage.value ? getAdminMusicPlaylists() : getPublicMusicPlaylists(),
    ])
    syncTrackDurations(trackRows)
    tracks.value = trackRows
    adminPlaylists.value = canManage.value ? categoryRows : await hydratePublicCategories(categoryRows)
    void primeTrackDurations(trackRows)
    ensureSelectedCategoryExists()
    if (!player.hasQueue) {
      const publishedTracks = trackRows.filter((track) => track.status === 'published')
      player.setQueue(publishedTracks.length ? publishedTracks : trackRows, null)
    }
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '网络有点不稳定，稍后再试试。'
  } finally {
    loading.value = false
  }
}

function syncTrackDurations(trackRows: MusicTrack[]) {
  const nextDurationMap: Record<number, number> = {}
  trackRows.forEach((track) => {
    const knownDuration = resolveKnownTrackDuration(track)
    if (knownDuration != null) {
      nextDurationMap[track.id] = knownDuration
    }
  })
  trackDurationMap.value = nextDurationMap
}

function resolveKnownTrackDuration(track: MusicTrack) {
  if (Number.isFinite(track.duration) && (track.duration || 0) > 0) {
    return track.duration as number
  }
  const cachedDuration = trackDurationMap.value[track.id]
  if (Number.isFinite(cachedDuration) && cachedDuration > 0) {
    return cachedDuration
  }
  if (activeTrack.value?.id === track.id && Number.isFinite(player.duration) && player.duration > 0) {
    return player.duration
  }
  return null
}

async function primeTrackDurations(trackRows: MusicTrack[]) {
  await Promise.all(trackRows.map((track) => ensureTrackDuration(track)))
}

async function ensureTrackDuration(track: MusicTrack) {
  if (!track?.id || !track.audioUrl?.trim()) return
  if (resolveKnownTrackDuration(track) != null || resolvingTrackDurationIds.has(track.id)) return

  resolvingTrackDurationIds.add(track.id)
  try {
    const duration = await readAudioDuration(track.audioUrl)
    if (duration == null) return
    trackDurationMap.value = {
      ...trackDurationMap.value,
      [track.id]: duration,
    }
  } finally {
    resolvingTrackDurationIds.delete(track.id)
  }
}

function readAudioDuration(audioUrl: string): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio')
    const timeoutId = window.setTimeout(() => finalize(null), 12000)

    function finalize(duration: number | null) {
      window.clearTimeout(timeoutId)
      audio.onloadedmetadata = null
      audio.onerror = null
      audio.src = ''
      resolve(duration)
    }

    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : null
      finalize(duration)
    }
    audio.onerror = () => finalize(null)
    audio.src = audioUrl
  })
}

async function hydratePublicCategories(rows: MusicPlaylist[]) {
  const details = await Promise.all(rows.map(async (category) => {
    if (!category.id) return category
    try {
      return await getPublicMusicPlaylist(category.id)
    } catch {
      return category
    }
  }))
  return mergeCategories(details)
}

function mergeCategories(rows: MusicPlaylist[]) {
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

function ensureSelectedCategoryExists() {
  if (selectedCategoryId.value == null) return
  if (adminPlaylists.value.some((category) => category.id === selectedCategoryId.value)) return
  selectedCategoryId.value = null
}

async function playTrack(track: MusicTrack, expandRow = true) {
  if (musicDisplayMode.value === 'rows' && expandRow) {
    expandedManagedTrackId.value = track.id
  }
  const queue = filteredCategoryTracks.value.length ? filteredCategoryTracks.value : tracks.value
  await player.playTrack(track, queue, selectedCategory.value)
}

function pauseTrack(track: MusicTrack) {
  if (activeTrack.value?.id !== track.id) return
  player.pause()
}

function setMusicDisplayMode(mode: 'cards' | 'rows') {
  musicDisplayMode.value = mode
  expandedManagedTrackId.value = null
}

function handleMusicCardPageChange(page: number) {
  musicCardPage.value = page
  expandedManagedTrackId.value = null
}

function handleMusicRowPageChange(page: number) {
  musicRowPage.value = page
  expandedManagedTrackId.value = null
}

function setPlayMode(mode: 'sequence' | 'shuffle') {
  player.setMode(mode)
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

function getTrackDurationLabel(track: MusicTrack) {
  const knownDuration = resolveKnownTrackDuration(track)
  if (knownDuration != null) {
    return formatTime(knownDuration)
  }
  return '--:--'
}

function openCreateTrack() {
  void router.push('/music/tracks/new')
}

function openEditTrack(track: MusicTrack) {
  void router.push(`/music/tracks/${track.id}/edit`)
}

async function removeTrack(track: MusicTrack) {
  try {
    await ElMessageBox.confirm(`确定删除《${track.title}》吗？删除时会自动从所有分类中移除。`, '删除歌曲', {
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

function selectCategory(categoryId: number | null) {
  selectedCategoryId.value = categoryId
  expandedManagedTrackId.value = null
}

function startCreateCategory() {
  creatingCategory.value = true
  categoryDraft.value = ''
}

function cancelCreateCategory() {
  creatingCategory.value = false
  categoryDraft.value = ''
}

async function saveCategory() {
  const name = categoryDraft.value.trim()
  if (!name || playlistSaving.value) return
  playlistSaving.value = true
  try {
    const saved = await createMusicPlaylist({ name })
    if (saved.id) selectedCategoryId.value = saved.id
    ElMessage.success('分类已新增')
    cancelCreateCategory()
    await loadMusic()
  } finally {
    playlistSaving.value = false
  }
}

async function renameCategory() {
  const category = selectedCategory.value
  if (!category?.id || playlistSaving.value) return

  try {
    const { value } = await ElMessageBox.prompt('修改当前分类名称，歌曲归属不会受影响。', '编辑分类', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValue: category.name,
      inputPlaceholder: '分类名称，例如 夜读',
      inputValidator: (input) => Boolean(input.trim()) || '分类名称不能为空',
    })

    const name = value.trim()
    if (!name || name === category.name.trim()) return

    playlistSaving.value = true
    const saved = await updateMusicPlaylist(category.id, buildCategoryPayload(category, name))
    if (player.currentPlaylist?.id === saved.id) {
      player.setQueue(player.queue, saved)
    }
    ElMessage.success('分类已更新')
    await loadMusic()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error instanceof Error ? error.message : '分类更新失败')
  } finally {
    playlistSaving.value = false
  }
}

async function removeCategory() {
  const category = selectedCategory.value
  if (!category?.id || playlistSaving.value) return

  try {
    await ElMessageBox.confirm(
      `确定删除分类“${category.name}”吗？这只会移除分类和歌曲归属，不会删除歌曲本身。`,
      '删除分类',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    playlistSaving.value = true
    await deleteMusicPlaylist(category.id)
    if (player.currentPlaylist?.id === category.id) {
      player.setQueue(player.queue, null)
    }
    selectedCategoryId.value = null
    ElMessage.success('分类已删除')
    await loadMusic()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error instanceof Error ? error.message : '分类删除失败')
  } finally {
    playlistSaving.value = false
  }
}

function toggleManagedTrackExpanded(trackId: number) {
  expandedManagedTrackId.value = expandedManagedTrackId.value === trackId ? null : trackId
}

function matchesTrackKeyword(track: MusicTrack, keyword: string) {
  return [
    track.title,
    track.artist,
    track.album,
    track.genre,
    track.language,
    ...(track.tags || []),
  ].some((text) => (text || '').toLowerCase().includes(keyword))
}

function getTrackCategoryNames(track: MusicTrack) {
  return adminPlaylists.value
    .filter((playlist) => playlist.tracks?.some((item) => item.id === track.id))
    .map((playlist) => playlist.name)
}

function isTrackInCategory(trackId: number, category: MusicPlaylist | null) {
  return Boolean(category?.tracks?.some((track) => track.id === trackId))
}

function isTrackInSelectedCategory(trackId: number) {
  return isTrackInCategory(trackId, selectedCategory.value)
}

async function toggleTrackCategory(trackId: number, category: MusicPlaylist) {
  if (!category.id) return
  const trackIds = (category.tracks ?? []).map((track) => track.id)
  const hasTrack = trackIds.includes(trackId)
  const nextTrackIds = hasTrack ? trackIds.filter((id) => id !== trackId) : [...trackIds, trackId]
  await persistCategoryTracks(category, nextTrackIds, hasTrack ? '已移出分类' : '已加入分类')
}

async function addTrackToSelectedCategory(trackId: number) {
  const category = selectedCategory.value
  if (!category) return
  const trackIds = (category.tracks ?? []).map((track) => track.id)
  if (trackIds.includes(trackId)) return
  await persistCategoryTracks(category, [...trackIds, trackId], '已加入当前分类')
}

async function removeTrackFromSelectedCategory(trackId: number) {
  const category = selectedCategory.value
  if (!category) return
  const trackIds = (category.tracks ?? []).map((track) => track.id).filter((id) => id !== trackId)
  await persistCategoryTracks(category, trackIds, '已移出当前分类')
}

async function persistCategoryTracks(category: MusicPlaylist, trackIds: number[], successMessage: string) {
  if (!category.id || playlistSaving.value) return
  playlistSaving.value = true
  try {
    const saved = await saveMusicPlaylistTracks(category.id, { trackIds })
    replaceAdminPlaylist(saved)
    ElMessage.success(successMessage)
    await loadMusic()
  } finally {
    playlistSaving.value = false
  }
}

function replaceAdminPlaylist(saved: MusicPlaylist) {
  const index = adminPlaylists.value.findIndex((playlist) => playlist.id === saved.id)
  if (index >= 0) {
    adminPlaylists.value.splice(index, 1, saved)
    return
  }
  adminPlaylists.value.push(saved)
}

function statusLabel(status: MusicTrackStatus) {
  if (status === 'published') return '公开'
  if (status === 'archived') return '归档'
  return '草稿'
}

function buildCategoryPayload(category: MusicPlaylist, name = category.name): MusicPlaylistUpsertCommand {
  return {
    name,
    description: category.description,
    coverFileId: category.coverFileId,
    coverUrl: category.coverUrl,
    openingText: category.openingText,
    defaultPlaylist: category.defaultPlaylist,
    publicPlaylist: category.publicPlaylist,
    sortOrder: category.sortOrder,
  }
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

function handlePlaylistSearchSubmit() {
  playlistSearch.value = playlistSearch.value.trim()
}

</script>

<style scoped lang="scss">
.music-page {
  width: min(1360px, calc(100vw - 40px));
  margin: 0 auto;
  padding: 18px 0 44px;
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
.shelf-heading__actions,
.track-card__actions,
.playlist-switches,
.playlist-editor__title,
.playlist-editor__footer,
.playlist-editor__tools,
.playlist-manager__summary,
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
  align-items: center;
  gap: 16px;
}

.shelf-heading__actions {
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: clamp(18px, 3vw, 56px);
  flex-wrap: wrap;
  justify-content: flex-start;
}

.shelf-search-shell {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 0;
  width: min(100%, 420px);
  height: 42px;
  padding: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid rgba(238, 211, 224, 0.62);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.58);
  overflow: hidden;
}

.shelf-heading__copy {
  flex: 0 0 auto;
  min-width: 78px;
  display: grid;
  gap: 6px;
}

.shelf-heading__buttons {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
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

.audio-visualizer {
  position: relative;
  width: min(760px, 100%);
  min-height: 72px;
  padding: 10px 22px 10px 18px;
  border: 1px solid rgba(255, 217, 230, 0.78);
  border-radius: 24px;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  background:
    radial-gradient(circle at 12% 24%, rgba(255, 190, 216, 0.22), transparent 38%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(255, 246, 251, 0.66));
  box-shadow:
    0 14px 28px rgba(224, 165, 188, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
  overflow: hidden;
}

.audio-visualizer::before {
  content: '';
  position: absolute;
  inset: 13px 22px 13px 52px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 229, 239, 0), rgba(255, 207, 226, 0.46), rgba(255, 229, 239, 0));
  opacity: 0.72;
  pointer-events: none;
}

.audio-visualizer__pulse {
  position: relative;
  z-index: 1;
  width: 4px;
  height: 18px;
  border-radius: 999px;
  background: #ff9fc2;
  box-shadow:
    9px 8px 0 -1px rgba(251, 114, 153, 0.72),
    18px 2px 0 -1px rgba(255, 192, 218, 0.84);
  opacity: 0.78;
  transform-origin: bottom center;
}

.audio-visualizer.is-active .audio-visualizer__pulse {
  animation: visualizer-pulse 1.2s ease-out infinite;
}

.audio-visualizer__bars {
  position: relative;
  z-index: 1;
  min-width: 0;
  height: 46px;
  display: flex;
  align-items: center;
  gap: clamp(5px, 1.1vw, 10px);
  overflow: hidden;
}

.audio-visualizer__bar {
  flex: 0 0 clamp(3px, 0.55vw, 6px);
  height: var(--bar-height);
  border-radius: 999px;
  background: linear-gradient(180deg, #ffc2dc 0%, #fb7299 74%, #f59bbc 100%);
  box-shadow:
    0 7px 13px rgba(251, 114, 153, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.52);
  opacity: 0.78;
  transform-origin: center;
  transform: scaleY(0.72);
}

.audio-visualizer.is-active .audio-visualizer__bar {
  animation: visualizer-bar-dance 920ms ease-in-out infinite;
  animation-delay: var(--bar-delay);
}

.progress-row {
  width: min(920px, 100%);
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
  width: min(880px, 100%);
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
  position: relative;
  padding: clamp(20px, 2vw, 28px);
  border-radius: 28px;
  border: 1px solid rgba(238, 218, 226, 0.76);
  background:
    radial-gradient(circle at top left, rgba(255, 214, 231, 0.28), transparent 30%),
    linear-gradient(180deg, rgba(255, 253, 254, 0.96), rgba(255, 247, 251, 0.88)),
    linear-gradient(90deg, rgba(251, 114, 153, 0.06), transparent 34%);
  box-shadow:
    0 22px 46px rgba(167, 126, 145, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

.music-shelf::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 100% 0, rgba(255, 225, 236, 0.34), transparent 22%),
    radial-gradient(circle at 0 100%, rgba(247, 233, 244, 0.3), transparent 18%);
  pointer-events: none;
}

.shelf-heading {
  position: relative;
  z-index: 1;
  margin-bottom: 16px;
  padding: 0 8px 20px;
  align-items: center;
}

.shelf-heading::after {
  content: '';
  position: absolute;
  right: 8px;
  bottom: 0;
  left: 8px;
  height: 1px;
  background: linear-gradient(90deg, rgba(239, 221, 229, 0), rgba(239, 221, 229, 0.52) 14%, rgba(239, 221, 229, 0.52) 86%, rgba(239, 221, 229, 0));
}

.shelf-heading h2 {
  margin: 0;
  color: #5f4c56;
  font-size: 22px;
}

.shelf-heading .eyebrow {
  display: none;
}

.music-state {
  padding: 42px 18px;
  text-align: center;
  color: #8d7b84;
}

.music-state--error {
  display: grid;
  justify-items: center;
  gap: 10px;
}

.music-state--error strong {
  color: #7a5364;
  font-size: 18px;
}

.music-state--error span {
  color: #9d7f8d;
  font-size: 13px;
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
  position: relative;
  padding: 18px;
  border-top: 1px solid rgba(241, 223, 231, 0.92);
  background: linear-gradient(180deg, rgba(255, 254, 254, 0.98), rgba(255, 252, 253, 0.94));
}

.track-detail__menu {
  position: absolute;
  z-index: 4;
  top: 22px;
  right: 22px;
}

.track-detail__menu-trigger {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #b2778d;
  background: rgba(255, 254, 254, 0.92);
  box-shadow: 0 12px 24px rgba(167, 133, 148, 0.12);
  cursor: pointer;
  transition: transform 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.track-detail__menu-trigger:hover {
  color: #d56f95;
  background: rgba(255, 249, 252, 0.98);
  transform: translateY(-1px);
}

.track-detail__action-bar {
  position: absolute;
  z-index: 5;
  top: 18px;
  right: 18px;
  display: flex;
  gap: 10px;
}

.track-detail__icon-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #b2778d;
  background: transparent;
  cursor: pointer;
  transition: transform 0.18s ease, color 0.18s ease, background 0.18s ease;
}

.track-detail__icon-btn:hover {
  transform: translateY(-1px);
  color: #fb7299;
  background: rgba(255, 241, 247, 0.96);
}

.track-detail__icon-btn--danger:hover {
  color: #f56c6c;
  background: rgba(255, 238, 238, 0.96);
}

.track-detail__icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.track-detail__main {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) minmax(260px, 300px);
  gap: 22px;
  align-items: start;
  min-width: 0;
}

.track-detail__identity {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.track-detail__title {
  min-width: 0;
  padding-right: 42px;
  padding-left: clamp(18px, 1.5vw, 28px);
}

.track-detail__title strong {
  display: block;
  overflow: hidden;
  color: #4f3c46;
  font-size: 26px;
  line-height: 1.24;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-detail__title p {
  margin: 5px 0 0;
  overflow: hidden;
  color: #8d7b84;
  font-size: 16px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-detail__cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  display: grid;
  place-items: center;
  color: #cf7b99;
  background: transparent;
  cursor: pointer;
}

.track-detail__record {
  position: absolute;
  right: -16px;
  width: 78%;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(255, 240, 247, 0.92) 0 9%, rgba(220, 127, 166, 0.7) 10% 13%, transparent 14%),
    repeating-radial-gradient(circle, rgba(91, 70, 83, 0.62) 0 2px, rgba(72, 56, 68, 0.58) 2px 4px);
  box-shadow: 0 16px 34px rgba(89, 58, 75, 0.13);
}

.track-detail__cover-frame {
  position: relative;
  z-index: 1;
  width: calc(100% - 18px);
  aspect-ratio: 1;
  overflow: hidden;
  border: 7px solid rgba(255, 251, 253, 0.92);
  border-radius: 24px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 44%, rgba(255, 255, 255, 0.22), transparent 14%),
    linear-gradient(135deg, #fff0f6, #f7f1fb);
  box-shadow: 0 18px 38px rgba(214, 128, 162, 0.18);
}

.track-detail__cover-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.track-detail__cover-frame > span {
  letter-spacing: 0.14em;
  font-size: 12px;
  font-weight: 900;
}

.track-detail__content {
  min-width: 0;
  display: grid;
  gap: 14px;
  align-content: start;
  margin-top: 82px;
}

.track-detail__mood {
  width: fit-content;
  max-width: 100%;
  padding: 8px 14px;
  border-radius: 999px;
  color: #a86880;
  background: rgba(255, 247, 250, 0.9);
  font-size: 13px;
  font-weight: 800;
}

.track-detail__note {
  position: relative;
  margin: 0;
  padding: 18px 20px 18px 44px;
  border: 1px solid rgba(242, 222, 230, 0.92);
  border-radius: 22px;
  color: #74606b;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 252, 253, 0.92));
  line-height: 1.8;
}

.track-detail__note::before {
  content: "“";
  position: absolute;
  top: 4px;
  left: 16px;
  color: rgba(219, 135, 166, 0.36);
  font-family: Georgia, serif;
  font-size: 42px;
  line-height: 1;
}

.track-detail__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.track-detail__tags span {
  padding: 5px 8px;
  border-radius: 999px;
  color: #c87291;
  background: rgba(255, 248, 251, 0.94);
  font-size: 11px;
}

.track-detail__tags .track-detail__status {
  color: #7f6874;
  background: rgba(246, 241, 245, 0.96);
}

.track-detail__info {
  display: grid;
  grid-template-columns: repeat(4, minmax(84px, 1fr));
  gap: 10px;
}

.track-detail__info span {
  min-width: 0;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.68);
}

.track-detail__info small {
  display: block;
  margin-bottom: 4px;
  color: #b79aa8;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.track-detail__info strong {
  display: block;
  overflow: hidden;
  color: #5c4853;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-detail__lyrics {
  min-width: 0;
  margin-top: 82px;
  padding: 16px;
  border: 1px solid rgba(242, 224, 232, 0.78);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
}

.track-detail__lyrics-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.track-detail__lyrics-head strong {
  color: #5a4651;
  font-size: 15px;
}

.track-detail__lyrics-head span {
  padding: 5px 9px;
  border-radius: 999px;
  color: #c87291;
  background: rgba(255, 248, 251, 0.94);
  font-size: 11px;
  font-weight: 900;
}

.track-detail__lyrics-lines {
  max-height: clamp(170px, 18vw, 240px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 6px;
  display: grid;
  gap: 10px;
  color: #9b8792;
  font-size: 13px;
  line-height: 1.72;
  scrollbar-color: rgba(216, 138, 168, 0.34) rgba(248, 242, 245, 0.72);
  scrollbar-width: thin;
}

.track-detail__lyrics-lines::-webkit-scrollbar {
  width: 6px;
}

.track-detail__lyrics-lines::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(216, 138, 168, 0.32);
}

.track-detail__lyrics-lines::-webkit-scrollbar-track {
  border-radius: 999px;
  background: rgba(248, 242, 245, 0.72);
}

.track-detail__lyrics-lines p {
  margin: 0;
}

.track-detail__lyrics-lines p.is-current {
  padding: 9px 12px;
  border-radius: 14px;
  color: #d56f95;
  background: rgba(255, 247, 250, 0.9);
  font-weight: 900;
}

.track-detail__lyrics-lines p.is-empty,
.track-detail__lyric-source {
  color: #b29ca7;
}

.track-detail__lyric-source {
  margin: 14px 0 0;
  font-size: 12px;
  line-height: 1.6;
}

:global(.track-detail-dropdown .el-dropdown-menu__item) {
  color: #735c68;
  font-weight: 700;
}

:global(.track-detail-dropdown .el-dropdown-menu__item:hover) {
  color: #d56f95;
  background: rgba(255, 241, 247, 0.92);
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

.music-category-workbench,
.playlist-workbench {
  display: grid;
  grid-template-columns: minmax(176px, 206px) minmax(0, 1fr);
  gap: 18px;
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
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: calc(100vh - 74px);
  overflow: auto;
  padding: 10px 14px 10px 0;
  border: 0;
  border-right: 1px solid rgba(235, 214, 224, 0.62);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.playlist-editor__title div,
.playlist-library__header div,
.playlist-selected__header div {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.playlist-editor__title strong,
.playlist-library__header strong,
.playlist-selected__header strong {
  color: #4f3c46;
  font-size: 16px;
}

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
  position: relative;
  width: 100%;
  min-height: 60px;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 10px 11px 10px 12px;
  border: 0;
  border-radius: 14px;
  text-align: left;
  color: inherit;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.playlist-category-card::before {
  content: '';
  position: absolute;
  inset: 12px auto 12px 0;
  width: 4px;
  border-radius: 999px;
  background: transparent;
  transition: background 0.2s ease, box-shadow 0.2s ease, width 0.2s ease;
}

.playlist-category-card:hover {
  transform: translateX(2px);
  background: rgba(245, 155, 188, 0.1);
  box-shadow: none;
}

.playlist-category-card.is-editing {
  transform: scale(1.01);
  background: linear-gradient(135deg, rgba(255, 241, 246, 0.94), rgba(255, 255, 255, 0.78));
  box-shadow:
    0 8px 20px rgba(245, 155, 188, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    inset 0 -1px 0 rgba(251, 114, 153, 0.12),
    inset 1px 0 0 rgba(251, 114, 153, 0.08);
}

.playlist-category-card.is-editing::before {
  width: 0;
  background: transparent;
  box-shadow: none;
}

.playlist-category-card__marker {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #c86a8e;
  background: rgba(255, 247, 251, 0.72);
  font-size: 17px;
}

.playlist-category-card.is-editing .playlist-category-card__marker {
  color: #fb7299;
  background: rgba(255, 255, 255, 0.62);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    inset 0 -1px 0 rgba(251, 114, 153, 0.1);
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
  gap: 3px;
}

.playlist-category-card__copy strong,
.playlist-library-track__body strong {
  overflow: hidden;
  color: #4f3c46;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-category-card__copy small {
  overflow: hidden;
  color: #b0929f;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-category-card.is-editing .playlist-category-card__copy strong {
  color: #fb7299;
}

.playlist-category-card.is-editing .playlist-category-card__copy small {
  color: #d98aa8;
}

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
  min-width: 0;
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

.playlist-manager__header {
  position: sticky;
  top: 0;
  z-index: 4;
  padding: 12px 0 18px;
  border-bottom: 1px solid rgba(238, 218, 226, 0.78);
  background: linear-gradient(180deg, rgba(255, 250, 253, 0.96), rgba(255, 250, 253, 0.82));
}

.playlist-manager__header > strong {
  flex: 0 0 auto;
  color: #4f3c46;
  font-size: 20px;
}

.playlist-manager__search {
  flex: 1 1 auto;
  min-width: 0;
  max-width: none;
}

.playlist-status-filter {
  flex: 0 1 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(28px, 3.2vw, 56px);
  min-width: 292px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.playlist-status-filter__option {
  position: relative;
  flex: 0 0 auto;
  min-width: 48px;
  height: 36px;
  padding: 0 2px;
  border: 0;
  border-radius: 0;
  color: #4f4650;
  background: transparent;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: color 0.18s ease;
}

.playlist-status-filter__option:hover {
  color: #ef6f9f;
}

.playlist-status-filter__option.is-active {
  color: #ef6f9f;
  background: transparent;
  box-shadow: none;
}

.playlist-status-filter__option.is-active::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  border-radius: 999px;
  background: #fb7299;
}

.shelf-heading__add,
.shelf-heading__refresh {
  min-width: 92px;
  min-height: 38px;
  border-radius: 999px;
  font-weight: 800;
}

.shelf-heading__add.el-button {
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, #ff8db9, #fb7299);
  box-shadow: none;
}

.shelf-heading__add.el-button:hover,
.shelf-heading__add.el-button:focus {
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, #ff9cc3, #fb7da2);
}

.shelf-heading__refresh.el-button {
  border: 1px solid rgba(235, 219, 227, 0.7);
  color: #5f4f58;
  background: rgba(255, 255, 255, 0.48);
  box-shadow: none;
}

.shelf-heading__refresh.el-button:hover,
.shelf-heading__refresh.el-button:focus {
  border-color: rgba(251, 114, 153, 0.34);
  color: #e4779d;
  background: rgba(255, 249, 252, 0.9);
}

.playlist-categories {
  min-height: calc(100vh - 132px);
}

:deep(.playlist-manager__search .el-input__wrapper) {
  min-height: 40px;
  padding-left: 18px;
  padding-right: 10px;
  border-radius: 999px;
  box-shadow: none;
  background: transparent;
  display: flex;
  align-items: center;
  transition: background 0.18s ease;
}

:deep(.playlist-manager__search .el-input__wrapper.is-focus) {
  background: transparent;
  box-shadow: none;
}

:deep(.playlist-manager__search .el-input__prefix) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

:deep(.playlist-manager__search .el-input__prefix-inner) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #b2a0ad;
}

:deep(.playlist-manager__search .el-input__inner) {
  height: 100%;
  color: #5f4f58;
  font-size: 13px;
  font-weight: 700;
  line-height: 40px;
}

:deep(.playlist-manager__search .el-input__inner::placeholder) {
  color: #baa8b5;
  font-weight: 600;
}

.shelf-search-button {
  align-self: stretch;
  min-width: 88px;
  height: 100%;
  margin: 0;
  padding: 0 18px;
  border: none;
  border-radius: 999px 0 0 999px;
  background: linear-gradient(135deg, #ff8db9, #fb7299);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: none;
  transition:
    filter 0.22s ease;
}

.shelf-search-button.el-button:hover,
.shelf-search-button.el-button:focus {
  color: #fff;
  border: none;
  filter: brightness(1.02);
}

.playlist-categories__create {
  display: grid;
  gap: 8px;
  margin-top: 2px;
  padding-top: 0;
  border-top: 0;
}

.playlist-categories__create-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.playlist-categories__new {
  width: 100%;
  min-height: 56px;
  padding: 0 12px;
  border: 1px dashed rgba(218, 148, 175, 0.42);
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  color: #d46d96;
  background: rgba(255, 247, 251, 0.52);
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.playlist-categories__new:hover {
  transform: translateX(2px);
  border-color: rgba(251, 114, 153, 0.5);
  background: rgba(255, 241, 247, 0.78);
}

.category-track-board {
  position: relative;
  min-height: calc(100vh - 132px);
  display: flex;
  flex-direction: column;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: hidden;
}

.category-track-board__content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.category-track-board__view {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.category-track-board__head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 4px 18px;
  background: transparent;
}

.category-track-board__head::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(238, 218, 226, 0.72), rgba(238, 218, 226, 0.18));
}

.category-track-board__head > div:first-child {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.category-track-board__head strong {
  color: #4f3c46;
  font-size: 18px;
}

.category-track-board__head span {
  color: #9b8792;
  font-size: 12px;
}

.category-track-board__toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.play-mode-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  position: relative;
  padding: 3px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.24);
}

.play-mode-toggle::after {
  display: none;
}

.play-mode-toggle button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #8c7782;
  background: transparent;
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease;
}

.play-mode-toggle button:hover {
  color: #d56f95;
}

.play-mode-toggle button.is-active {
  color: #d56f95;
  background: rgba(255, 239, 246, 0.72);
  box-shadow: none;
}

.play-mode-icon {
  width: 18px;
  height: 18px;
  display: block;
}

.category-track-board__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.category-track-board__actions button {
  min-height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #8c7782;
  background: rgba(255, 255, 255, 0.28);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease;
}

.category-track-board__actions button:hover {
  color: #d56f95;
  background: rgba(255, 239, 246, 0.64);
}

.category-track-board__actions button.is-danger:hover {
  color: #db5c7f;
}

.music-view-toggle {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.24);
}

.music-view-toggle button {
  min-height: 32px;
  padding: 0 11px;
  border: 0;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #8c7782;
  background: transparent;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease;
}

.music-view-toggle button.is-active {
  color: #d56f95;
  background: rgba(255, 239, 246, 0.72);
  box-shadow: none;
}

.music-card-grid {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(214px, 1fr));
  gap: 16px;
  align-content: start;
  padding: 18px 0 4px;
}

.music-card-pagination,
.music-list-pagination {
  display: flex;
  margin-top: auto;
  justify-content: center;
  padding: 20px 0 2px;
}

:deep(.music-card-pagination .el-pagination),
:deep(.music-list-pagination .el-pagination) {
  --el-pagination-button-bg-color: rgba(255, 255, 255, 0.58);
  --el-pagination-bg-color: rgba(255, 255, 255, 0.58);
  --el-pagination-hover-color: #fb7299;
  --el-color-primary: #fb7299;
  gap: 6px;
}

:deep(.music-card-pagination .btn-prev),
:deep(.music-card-pagination .btn-next),
:deep(.music-card-pagination .el-pager li),
:deep(.music-list-pagination .btn-prev),
:deep(.music-list-pagination .btn-next),
:deep(.music-list-pagination .el-pager li) {
  min-width: 30px;
  height: 30px;
  border: 1px solid rgba(238, 218, 226, 0.64);
  border-radius: 10px;
  color: #9a8791;
  box-shadow: none;
}

:deep(.music-card-pagination .el-pagination.is-background .el-pager li.is-active),
:deep(.music-list-pagination .el-pagination.is-background .el-pager li.is-active) {
  border-color: transparent;
  color: #fff;
  background: linear-gradient(135deg, #ff8db9, #fb7299);
}

.music-track-card {
  overflow: hidden;
  min-width: 0;
  border: 0;
  border-radius: 18px;
  display: grid;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 12px 24px rgba(164, 126, 148, 0.1);
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.music-track-card:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 32px rgba(164, 126, 148, 0.14);
}

.music-track-card__cover {
  position: relative;
  aspect-ratio: 1.42;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(255, 226, 238, 0.9), rgba(235, 241, 255, 0.88));
}

.music-track-card__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(74, 37, 57, 0.12)),
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.22), transparent 24%);
  pointer-events: none;
}

.music-track-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.28s ease;
}

.music-track-card:hover .music-track-card__cover img {
  transform: scale(1.04);
}

.music-track-card__fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #d56f95;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.music-track-card__duration,
.music-track-card__status {
  position: absolute;
  min-height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  color: #fff;
  background: rgba(82, 58, 71, 0.56);
  font-size: 11px;
  font-weight: 800;
  backdrop-filter: blur(10px);
}

.music-track-card__duration {
  left: 10px;
  bottom: 10px;
}

.music-track-card__status {
  top: 10px;
  left: 10px;
  color: #d56f95;
  background: rgba(255, 255, 255, 0.86);
}

.music-track-card__play {
  position: absolute;
  right: 12px;
  bottom: 10px;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(135deg, #fb7299, #ffa3c0);
  box-shadow: 0 14px 24px rgba(251, 114, 153, 0.32);
  cursor: pointer;
}

.music-track-card__body {
  min-width: 0;
  display: grid;
  gap: 11px;
  padding: 16px 18px 12px;
}

.music-track-card__titleline {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
}

.music-track-card__body strong {
  overflow: hidden;
  flex: 0 1 auto;
  min-width: 0;
  color: #594650;
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 0.01em;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-track-card__body p,
.music-track-card__meta,
.music-track-card__footer {
  color: #8d7b84;
  font-size: 12px;
}

.music-track-card__meter {
  flex: 0 0 auto;
  height: 18px;
  display: inline-flex;
  align-items: flex-end;
  gap: 3px;
}

.music-track-card__meter i {
  width: 4px;
  border-radius: 999px 999px 3px 3px;
  background: linear-gradient(180deg, #ffc0dd, #ff92bb);
  box-shadow: 0 4px 9px rgba(251, 114, 153, 0.12);
}

.music-track-card__meter i:nth-child(1) {
  height: 8px;
  opacity: 0.72;
}

.music-track-card__meter i:nth-child(2) {
  height: 12px;
  opacity: 0.82;
}

.music-track-card__meter i:nth-child(3) {
  height: 16px;
}

.music-track-card__meter i:nth-child(4) {
  height: 18px;
  opacity: 0.9;
}

.music-track-card__artist {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  padding-left: 2px;
  color: #9b8a92;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  text-indent: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-track-card__artist::before {
  content: '';
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border: 1.5px solid rgba(251, 114, 153, 0.56);
  border-radius: 2px;
  transform: rotate(45deg);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.78);
}

.music-track-card__body p {
  position: relative;
  min-height: 46px;
  margin: 2px 0 0;
  padding: 0 22px;
  display: -webkit-box;
  overflow: hidden;
  color: #938089;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.6;
  text-align: center;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.music-track-card__quote::before,
.music-track-card__quote::after {
  position: absolute;
  color: #ffb1d1;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
}

.music-track-card__quote::before {
  content: '“';
  left: 0;
  top: -4px;
}

.music-track-card__quote::after {
  content: '”';
  right: 2px;
  bottom: -8px;
}

.music-track-card__meta {
  min-width: 0;
  display: flex;
  gap: 9px;
  padding: 0 18px 14px;
}

.music-track-card__meta span {
  overflow: hidden;
  max-width: 50%;
  padding: 6px 10px;
  border-radius: 999px;
  color: #ab9aa2;
  background: rgba(246, 242, 245, 0.86);
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-track-card__meta span:first-child {
  color: #f07da8;
  background: rgba(255, 238, 246, 0.88);
}

.music-track-card__footer {
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 16px;
  border-top: 0;
  background: rgba(255, 250, 252, 0.58);
}

.music-track-card__year {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #a8959f;
  font-weight: 700;
  line-height: 1;
}

.music-track-card__year-icon {
  flex: 0 0 auto;
  width: 15px;
  height: 15px;
  color: #d56f95;
  opacity: 0.72;
}

.music-track-card__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.music-track-card__actions button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #8d7b84;
  background: rgba(255, 255, 255, 0.62);
  cursor: pointer;
  box-shadow: none;
}

.music-track-card__actions button:hover {
  color: #d56f95;
  background: rgba(255, 242, 247, 0.98);
}

.music-track-card__actions button.is-danger:hover {
  color: #fb5f8e;
}

.music-track-card__actions button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.category-track-table {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.category-track-table__header,
.category-track-row__main {
  display: grid;
  grid-template-columns: 40px minmax(136px, 0.56fr) minmax(90px, 0.34fr) minmax(78px, 0.28fr) 70px 112px 72px;
  gap: 12px;
  align-items: center;
}

.category-track-table__header {
  padding: 11px 20px;
  color: #9b8792;
  background: rgba(250, 246, 249, 0.86);
  font-size: 12px;
  font-weight: 800;
}

.category-track-row {
  border-top: 1px solid rgba(242, 226, 233, 0.72);
}

.category-track-row__main {
  width: 100%;
  min-width: 0;
  padding: 11px 20px;
  border: 0;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
  outline: none;
  transition: background 0.18s ease;
}

.category-track-row__main:hover,
.category-track-row__main:focus-visible,
.category-track-row.is-expanded .category-track-row__main {
  background: rgba(255, 246, 250, 0.88);
}

.category-track-row__main:focus-visible {
  box-shadow: inset 0 0 0 2px rgba(251, 114, 153, 0.28);
}

.category-track-row__index,
.category-track-row__album,
.category-track-row__categories,
.category-track-row__duration,
.category-track-row__controls,
.category-track-row__expand {
  overflow: hidden;
  color: #8d7b84;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-track-row__title {
  min-width: 0;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.category-track-row__cover {
  width: 44px;
  height: 44px;
  overflow: hidden;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #d46d96;
  background: linear-gradient(135deg, #fff0f6, #f7f9ff);
  font-weight: 900;
}

.category-track-row__cover img,
.category-track-detail__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-track-row__title strong,
.category-track-row__title small {
  overflow: hidden;
  display: block;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-track-row__title strong {
  color: #4f3c46;
  font-size: 15px;
}

.category-track-row__title small {
  margin-top: 3px;
  color: #9b8792;
  font-size: 12px;
}

.category-track-row__duration {
  justify-self: start;
}

.category-track-row__controls {
  justify-self: start;
  display: inline-flex;
  gap: 8px;
}

.category-track-row__controls,
.category-track-row__controls button {
  overflow: visible;
}

.category-track-row__expand {
  justify-self: start;
  color: #d46d96;
  font-weight: 800;
}

.category-track-row__play {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(237, 211, 222, 0.92);
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #d46d96;
  background:
    radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.9), transparent 32%),
    rgba(255, 250, 252, 0.92);
  box-shadow: 0 10px 20px rgba(218, 148, 174, 0.12);
  cursor: pointer;
  transition: transform 0.18s ease, color 0.18s ease, border-color 0.18s ease, background 0.18s ease, opacity 0.18s ease;
}

.category-track-row__play:hover,
.category-track-row__play.is-active {
  transform: translateY(-1px);
  border-color: rgba(251, 114, 153, 0.58);
  color: #fff;
  background: linear-gradient(135deg, #fb7299, #ff95b7);
  box-shadow: 0 13px 24px rgba(251, 114, 153, 0.24);
}

.category-track-row__play--pause {
  color: #9d7688;
}

.category-track-row__play:disabled {
  opacity: 0.38;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.category-track-row__play:disabled:hover {
  border-color: rgba(237, 211, 222, 0.92);
  color: #9d7688;
  background:
    radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.9), transparent 32%),
    rgba(255, 250, 252, 0.92);
}

.category-track-detail-card {
  padding: 18px 18px 22px;
  border-top: 1px solid rgba(241, 223, 231, 0.92);
  background:
    linear-gradient(180deg, rgba(255, 254, 254, 0.98), rgba(255, 250, 253, 0.92));
}

.category-track-detail-card .track-detail__main {
  grid-template-columns: 190px minmax(0, 1fr) minmax(220px, 270px);
  gap: 28px;
}

.category-track-detail-card .track-detail__title {
  padding-right: 0;
  padding-left: 8px;
}

.category-track-detail-card .track-detail__cover {
  margin-top: 14px;
}

.category-track-detail-card .track-detail__content {
  padding-inline: 6px 10px;
}

.category-track-detail-card .track-detail__content,
.category-track-detail-card .track-detail__lyrics {
  margin-top: 72px;
}

.category-track-detail-card .track-detail__note {
  padding: 16px 18px 16px 40px;
}

.category-track-detail__chips--category {
  align-items: center;
}

.category-track-detail {
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr);
  gap: 16px;
  padding: 16px 20px 20px 78px;
  background: linear-gradient(180deg, rgba(255, 250, 253, 0.92), rgba(255, 247, 251, 0.72));
}

.category-track-detail__cover {
  min-height: 128px;
  overflow: hidden;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #d46d96;
  background: linear-gradient(135deg, #fff0f6, #f7f9ff);
  font-weight: 900;
}

.category-track-detail__body {
  min-width: 0;
  display: grid;
  gap: 10px;
  align-content: start;
}

.category-track-detail__title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.category-track-detail__title strong {
  color: #4f3c46;
  font-size: 18px;
}

.category-track-detail__title p,
.category-track-detail__note {
  margin: 0;
  color: #8d7b84;
  line-height: 1.6;
}

.category-track-detail__title > span {
  flex: 0 0 auto;
  padding: 5px 9px;
  border-radius: 999px;
  color: #d46d96;
  background: rgba(255, 242, 247, 0.94);
  font-size: 12px;
  font-weight: 800;
}

.category-track-detail__chips,
.category-track-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-track-detail__chips span,
.category-track-detail__chips button {
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(238, 218, 226, 0.9);
  border-radius: 999px;
  color: #9a6b7e;
  background: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  line-height: 26px;
}

.category-track-detail__chips button {
  cursor: pointer;
}

.category-track-detail__chips button.is-active {
  border-color: rgba(251, 114, 153, 0.58);
  color: #d46d96;
  background: rgba(255, 242, 247, 0.96);
  font-weight: 800;
}

@keyframes record-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes visualizer-pulse {
  0%,
  100% {
    transform: scaleY(0.76);
    opacity: 0.62;
  }

  45% {
    transform: scaleY(1.18);
    opacity: 1;
  }
}

@keyframes visualizer-bar-dance {
  0%,
  100% {
    opacity: 0.48;
    transform: scaleY(0.44);
  }

  38% {
    opacity: 1;
    transform: scaleY(var(--bar-boost));
  }

  66% {
    opacity: 0.7;
    transform: scaleY(0.82);
  }
}

@media (prefers-reduced-motion: reduce) {
  .radio-panel__cover.is-playing .record-disc {
    animation: none;
  }

  .audio-visualizer.is-active .audio-visualizer__pulse,
  .audio-visualizer.is-active .audio-visualizer__bar {
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
  .music-category-workbench,
  .playlist-workbench,
  .playlist-track-workspace {
    grid-template-columns: 1fr;
  }

  .playlist-categories {
    position: static;
    max-height: none;
    padding: 0;
    border-right: 0;
    border-bottom: 1px solid rgba(235, 214, 224, 0.62);
    padding-bottom: 12px;
  }

  .track-row__main,
  .track-detail__main {
    grid-template-columns: 1fr;
  }

  .track-detail__main {
    gap: 18px;
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
    width: min(100%, 260px);
    min-height: 0;
    justify-self: center;
  }

  .track-detail__title {
    padding-right: 48px;
    padding-left: 0;
  }

  .category-track-detail-card .track-detail__title {
    padding-right: 0;
    padding-left: 0;
  }

  .category-track-detail-card .track-detail__main {
    grid-template-columns: 1fr;
  }

  .category-track-detail-card .track-detail__content,
  .category-track-detail-card .track-detail__lyrics {
    margin-top: 0;
  }

  .track-detail__action-bar {
    position: static;
    width: fit-content;
    margin-bottom: 12px;
  }

  .track-detail__content,
  .track-detail__lyrics {
    margin-top: 0;
  }

  .track-detail__info {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .playlist-manager__header {
    position: static;
    align-items: stretch;
  }

  .shelf-heading__actions {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 16px 22px;
  }

  .shelf-heading__buttons {
    width: 100%;
    margin-left: 0;
    justify-content: flex-start;
  }

  .playlist-manager__search {
    flex-basis: 100%;
    min-width: 0;
    max-width: none;
  }

  .shelf-search-shell {
    width: 100%;
  }

  .playlist-status-filter {
    width: 100%;
    min-width: 0;
    overflow-x: auto;
    justify-content: flex-start;
  }

  .playlist-status-filter__option {
    flex: 0 0 auto;
  }

  .playlist-categories,
  .category-track-board {
    min-height: auto;
  }

  .category-track-board__head {
    flex-direction: column;
    align-items: stretch;
  }

  .category-track-board__toolbar {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .play-mode-toggle {
    order: 1;
    padding: 4px;
  }

  .play-mode-toggle::after {
    display: none;
  }

  .music-view-toggle {
    width: fit-content;
  }

  .music-card-grid {
    grid-template-columns: repeat(auto-fill, minmax(178px, 1fr));
    gap: 14px;
    padding: 14px;
  }

  .music-track-card__meta {
    flex-wrap: wrap;
  }

  .category-track-table__header {
    display: none;
  }

  .category-track-row__main {
    grid-template-columns: 36px minmax(0, 1fr) 52px 76px auto;
    gap: 10px;
    padding: 12px;
  }

  .category-track-row__album,
  .category-track-row__categories {
    display: none;
  }

  .category-track-row__duration {
    justify-self: end;
  }

  .category-track-row__expand {
    grid-column: auto;
    justify-self: end;
  }

  .category-track-row__controls {
    gap: 6px;
  }

  .category-track-row__play {
    width: 30px;
    height: 30px;
  }

  .category-track-detail {
    grid-template-columns: 1fr;
    padding: 14px;
  }

  .category-track-detail__cover {
    width: min(100%, 220px);
    min-height: 220px;
  }

  .category-track-detail__title {
    flex-direction: column;
  }
}
</style>
