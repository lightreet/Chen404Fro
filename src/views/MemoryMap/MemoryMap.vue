<template>
  <DefaultLayout :wide-content="true" :show-live2-d="false">
    <template #hero>
      <PageHero
        title="旅行纪念地图"
        eyebrow="Memory Map"
        subtitle="把途经的城市、光影与心情，整理成一张可以慢慢翻阅的旅行地图。"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="70vh"
        compact
      />
    </template>

    <div class="memory-map-page">
      <FeatureAccessCover
        v-if="!canViewContent"
        v-bind="memoryMapCover"
        :icon="Location"
      />

      <template v-else>
        <section class="memory-spread">
          <aside class="memory-spread__page memory-spread__page--rail">
            <div class="memory-rail">
              <div class="panel-heading panel-heading--rail">
                <div class="panel-heading__copy">
                  <span class="eyebrow">Travel Index</span>
                  <div class="panel-heading__title">
                    <h2>旅行索引</h2>
                  </div>
                </div>
                <div class="panel-caption">
                  <span>{{ locations.length }} 个地点 · {{ totalPhotoCount }} 张照片</span>
                </div>
              </div>

              <div v-if="loading" class="gallery-state memory-rail__state">地点加载中...</div>
              <div v-else-if="!locations.length" class="memory-rail__list memory-rail__list--placeholder">
                <article
                  v-for="card in placeholderFilmCards"
                  :key="card.title"
                  class="rail-item rail-item--placeholder"
                >
                  <div class="rail-item__thumb rail-item__thumb--placeholder">
                    <span>{{ card.label }}</span>
                  </div>
                </article>
              </div>
              <div v-else class="memory-rail__list">
                <article
                  v-for="location in visibleGalleryLocations"
                  :key="location.id"
                  class="rail-item"
                  :class="{ 'is-active': activeId === location.id }"
                  role="button"
                  tabindex="0"
                  :ref="(element) => setGalleryCardRef(location.id, element)"
                  @click="selectGalleryLocation(location.id)"
                  @keydown.enter.prevent="selectGalleryLocation(location.id)"
                  @keydown.space.prevent="selectGalleryLocation(location.id)"
                >
                  <div class="rail-item__thumb-wrap">
                    <img
                      v-if="location.coverImage"
                      class="rail-item__thumb"
                      :src="location.coverImage"
                      :alt="location.title"
                    />
                    <div v-else class="rail-item__thumb rail-item__thumb--empty">TRAVEL</div>

                    <div v-if="canManage" class="rail-item__admin-overlay" @click.stop>
                      <button
                        type="button"
                        class="rail-item__admin-button"
                        aria-label="编辑地点"
                        @click="editGalleryLocation(location.id)"
                      >
                        <el-icon><EditPen /></el-icon>
                      </button>
                      <button
                        type="button"
                        class="rail-item__admin-button rail-item__admin-button--danger"
                        aria-label="删除地点"
                        @click="deleteGalleryLocation(location)"
                      >
                        <el-icon><Delete /></el-icon>
                      </button>
                    </div>
                  </div>
                </article>
              </div>

              <div v-if="canLoadMoreGallery" class="gallery-load-more memory-rail__load-more">
                <el-button plain class="gallery-load-more__button" @click="loadMoreGallery">
                  加载更多
                  <span class="gallery-load-more__count">剩余 {{ remainingGalleryCount }} 个地点</span>
                </el-button>
              </div>
            </div>
          </aside>

          <article class="memory-spread__page memory-spread__page--map">
            <div class="spread-map-card">
              <div class="spread-map-card__hero">
                <div class="spread-heading">
                  <div class="spread-heading__copy">
                    <span class="eyebrow">Memory Map</span>
                    <div class="spread-heading__title">
                      <h2>旅行足迹</h2>
                      <span class="spread-heading__flower">✿</span>
                    </div>
                  </div>
                </div>

                <div class="spread-badge">
                  <span class="spread-badge__label">当前地点</span>
                  <div class="spread-badge__body">
                    <el-icon><Location /></el-icon>
                    <strong>{{ currentLocationName }}</strong>
                  </div>
                </div>
              </div>

              <TravelMemoryMap
                :locations="locations"
                :active-id="activeId"
                @select="selectMapLocation"
              />

              <div v-if="canManage" class="spread-map-actions">
                <el-button type="primary" plain class="journal-action journal-action--primary map-action" @click="openCreateDialog">
                  <span class="map-action__lead">
                    <el-icon><Location /></el-icon>
                    <span>新增旅游地点</span>
                  </span>
                  <span class="map-action__arrow" aria-hidden="true">→</span>
                </el-button>
              </div>
            </div>
          </article>

          <aside class="memory-spread__page memory-spread__page--detail">
            <template v-if="activeDetail">
              <div
                class="travel-journal"
                :class="{ 'is-loading': loadingDetail }"
                :aria-busy="loadingDetail"
              >
                <div v-if="loadingDetail" class="travel-journal__loading-note">正在切换地点...</div>
                <div class="travel-journal__head">
                  <div class="travel-journal__copy">
                    <span class="eyebrow">Travel Detail</span>
                    <div class="travel-journal__headline">
                      <span class="travel-journal__flower">✿</span>
                      <h2>{{ journalTitle }}</h2>
                    </div>
                    <div class="travel-journal__facts">
                      <span v-if="journalLocationText" class="travel-journal__fact travel-journal__fact--location">
                        <el-icon><Location /></el-icon>
                        <span>{{ journalLocationText }}</span>
                      </span>
                      <span v-if="journalDateRange" class="travel-journal__fact travel-journal__fact--date">
                        <el-icon><Calendar /></el-icon>
                        <span>{{ journalDateRange }}</span>
                      </span>
                    </div>
                  </div>

                  <div class="travel-journal__stamp">
                    <span>旅途邮戳</span>
                    <strong>{{ journalStampLabel }}</strong>
                  </div>
                </div>

                <div class="travel-journal__media">
                  <div class="travel-journal__cover">
                    <img class="travel-journal__tape" :src="tapeCornerAsset" alt="" aria-hidden="true" />
                    <img
                      v-if="coverEntry?.imageUrl"
                      :src="coverEntry.imageUrl"
                      :alt="coverEntry.remark || activeDetail.title"
                    />
                    <div v-else class="travel-journal__cover-empty">等待封面图片</div>
                  </div>

                  <div class="travel-journal__entries">
                    <article
                      v-for="note in journalNotes"
                      :key="note.key"
                      class="journal-note"
                    >
                      <div class="journal-note__thumb">
                        <img v-if="note.imageUrl" :src="note.imageUrl" :alt="note.title" />
                        <div v-else class="journal-note__thumb--placeholder" />
                      </div>
                      <div class="journal-note__body">
                        <h4>{{ note.title }}</h4>
                        <p>{{ note.copy }}</p>
                        <span>{{ formatDate(note.date) || '留白的一天' }}</span>
                      </div>
                    </article>
                  </div>
                </div>

                <div class="travel-journal__footer">
                  <div class="travel-journal__quote">
                    <p>{{ journalQuote }}</p>
                  </div>

                  <div v-if="activeDetail" class="travel-journal__actions travel-journal__actions--note">
                    <el-button type="primary" class="journal-action journal-action--detail-view" @click="openCurrentDetailPage">
                      <el-icon><View /></el-icon>
                      查看游记
                    </el-button>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="travel-journal travel-journal--empty">
                <div class="travel-journal__head">
                  <div class="travel-journal__copy">
                    <span class="eyebrow">Travel Detail</span>
                    <div class="travel-journal__headline">
                      <span class="travel-journal__flower">✿</span>
                      <h2>等待旅程开始</h2>
                    </div>
                  </div>

                  <div class="travel-journal__stamp travel-journal__stamp--placeholder">
                    Waiting
                    <strong>Stamp</strong>
                  </div>
                </div>

                <div class="travel-journal__cover travel-journal__cover--placeholder">
                  <img class="travel-journal__tape" :src="tapeCornerAsset" alt="" aria-hidden="true" />
                  <div class="travel-journal__cover-empty">Your First Journey</div>
                </div>

                <div class="travel-journal__entries travel-journal__entries--placeholder">
                  <article
                    v-for="card in placeholderNotes"
                    :key="card.title"
                    class="journal-note journal-note--placeholder"
                  >
                    <div class="journal-note__thumb journal-note__thumb--placeholder" />
                    <div class="journal-note__body">
                      <h4>{{ card.title }}</h4>
                      <p>{{ card.copy }}</p>
                      <span>{{ card.date }}</span>
                    </div>
                  </article>
                </div>
              </div>
            </template>
          </aside>
        </section>
      </template>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Delete, EditPen, Location, View } from '@element-plus/icons-vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import FeatureAccessCover from '@/components/FeatureAccessCover.vue'
import TravelMemoryMap from '@/components/TravelMemoryMap/TravelMemoryMap.vue'
import { deleteTravelMemory, getTravelMemories, getTravelMemoryDetail } from '@/api/travel-memory'
import { useSiteConfig } from '@/composables/useSiteConfig'
import { buildMemoryMapCoverConfig, resolveFeatureHero } from '@/modules/feature-access/constants'
import { useUserStore } from '@/stores/user'
import type { TravelMemoryEntry, TravelMemoryLocationDetail, TravelMemoryLocationListItem, TravelMemoryStop } from '@/types'
import { isAdminUser, isFriendUser } from '@/utils/permission'
import tapeCornerAsset from '@/assets/memory-map/tape-corner.svg'

const INITIAL_GALLERY_VISIBLE_COUNT = 6
const GALLERY_LOAD_MORE_STEP = 4

const { siteConfig, loadSiteConfig } = useSiteConfig()
const userStore = useUserStore()
const { isLoggedIn, user } = storeToRefs(userStore)
const router = useRouter()

const defaultHero = resolveFeatureHero(null, 'memory-map')
const heroBgImage = ref(defaultHero.bgImage)
const heroBgPosition = ref(defaultHero.bgPosition)
const loading = ref(false)
const loadingDetail = ref(false)
const locations = ref<TravelMemoryLocationListItem[]>([])
const visibleGalleryCount = ref(INITIAL_GALLERY_VISIBLE_COUNT)
const activeId = ref<number | null>(null)
const activeDetail = ref<TravelMemoryLocationDetail | null>(null)
const detailCache = ref<Record<number, TravelMemoryLocationDetail>>({})
const galleryCardRefs = new Map<number, HTMLElement>()
let detailRequestVersion = 0
const canManage = computed(() => isAdminUser(user.value))
const canViewContent = computed(() => isAdminUser(user.value) || isFriendUser(user.value))
const memoryMapCover = computed(() => buildMemoryMapCoverConfig(isLoggedIn.value))
const coverEntry = computed<TravelMemoryEntry | null>(() => {
  const entries = activeDetail.value?.entries || []
  return entries.find((entry) => entry.cover) || entries[0] || null
})
const noteEntries = computed(() => {
  const entries = activeDetail.value?.entries || []
  return entries.slice(0, 3)
})
interface JournalNote {
  key: string
  imageUrl: string
  title: string
  copy: string
  date?: string
}

const journalNotes = computed<JournalNote[]>(() => {
  const detail = activeDetail.value
  if (!detail) return []
  const stops = (detail.stops || []).filter((stop) => stop.entries?.length)
  if (!stops.length) {
    return noteEntries.value.map((entry, index) => buildEntryJournalNote(entry, index, detail.title, detail.visitedAt))
  }

  const notes: JournalNote[] = []
  const usedEntries = new Set<TravelMemoryEntry>()
  stops.slice(0, 3).forEach((stop, stopIndex) => {
    const entry = stopCoverEntry(stop)
    if (!entry) return
    usedEntries.add(entry)
    notes.push(buildStopJournalNote(stop, entry, stopIndex, detail.title, detail.visitedAt))
  })

  const overflowEntries = stops
    .flatMap((stop) => stop.entries.map((entry) => ({ stop, entry })))
    .filter(({ entry }) => !usedEntries.has(entry))

  for (const { stop, entry } of overflowEntries) {
    if (notes.length >= 3) break
    notes.push(buildStopJournalNote(stop, entry, notes.length, detail.title, detail.visitedAt))
  }

  return notes.slice(0, 3)
})
const totalPhotoCount = computed(() =>
  locations.value.reduce((sum, location) => sum + Number(location.entryCount || 0), 0),
)
const visibleGalleryLocations = computed(() =>
  locations.value.slice(0, visibleGalleryCount.value),
)
const remainingGalleryCount = computed(() =>
  Math.max(0, locations.value.length - visibleGalleryLocations.value.length),
)
const canLoadMoreGallery = computed(() => remainingGalleryCount.value > 0)
const currentLocationName = computed(
  () => activeDetail.value?.city || activeDetail.value?.province || activeDetail.value?.title || '未选择',
)
const journalTitle = computed(() => activeDetail.value?.title?.trim() || '旅行详情')
const journalLocationText = computed(() => {
  if (!activeDetail.value) return ''
  const value = formatLocation(activeDetail.value)
  return value === '未标注地点' ? '' : value
})
const journalDateRange = computed(() =>
  formatDateRange(activeDetail.value?.visitedAt, activeDetail.value?.visitedEndAt),
)
const journalStampLabel = computed(() => currentLocationName.value)
const journalQuote = computed(() => {
  const summary = activeDetail.value?.summaryNote?.trim()
  if (summary) return summary
  const coverNote = coverEntry.value?.thanksNote?.trim()
  if (coverNote) return coverNote
  const firstNote = noteEntries.value[0]?.thanksNote?.trim()
  return firstNote || '海面在发着光，心情也跟着慢慢静下来。'
})
const placeholderNotes = [
  {
    title: '写下第一句感想',
    copy: '海风、山色、街角黄昏，都可以从这里开始被认真收藏。',
    date: '等待第一天',
  },
  {
    title: '放进一张封面照',
    copy: '上传照片之后，这里会像一本真正的纪念册，把旅途装订起来。',
    date: '等待第二页',
  },
  {
    title: '点亮地图印章',
    copy: '左侧地图和底部胶片会随着第一个地点一起醒来，开始连成足迹。',
    date: '等待启程',
  },
] as const
const placeholderFilmCards = [
  {
    label: 'SPRING',
    title: '樱花季的小旅行',
    place: '等待标注城市',
    copy: '第一段回忆会从这里展开',
    date: '等待日期',
    meta: '等待收藏',
  },
  {
    label: 'SEA',
    title: '海边的晚风',
    place: '等待标注城市',
    copy: '把夕阳和潮声装进胶片里',
    date: '等待日期',
    meta: '等待收藏',
  },
  {
    label: 'MOUNTAIN',
    title: '山野来信',
    place: '等待标注城市',
    copy: '留给未来再翻阅的一页',
    date: '等待日期',
    meta: '等待收藏',
  },
] as const

async function loadMemories(preferredId?: number | null) {
  loading.value = true
  try {
    const list = await getTravelMemories()
    if (list?.length) {
      locations.value = list
      resetGalleryVisibleCount()
      const nextId = resolveDefaultLocationId(locations.value, preferredId, activeId.value)

      if (nextId != null) {
        await handleSelectLocation(nextId, { syncGallery: false })
      } else {
        activeId.value = null
        activeDetail.value = null
        loadingDetail.value = false
      }
      return
    }
    detailRequestVersion += 1
    detailCache.value = {}
    locations.value = []
    resetGalleryVisibleCount()
    activeId.value = null
    activeDetail.value = null
    loadingDetail.value = false
  } catch {
    detailRequestVersion += 1
    detailCache.value = {}
    locations.value = []
    resetGalleryVisibleCount()
    activeId.value = null
    activeDetail.value = null
    loadingDetail.value = false
    ElMessage.error('旅行地点加载失败')
  } finally {
    loading.value = false
  }
}

async function handleSelectLocation(id: number, options: { syncGallery?: boolean } = {}) {
  const requestVersion = ++detailRequestVersion
  activeId.value = id
  ensureGalleryLocationVisible(id)
  await nextTick()
  if (options.syncGallery !== false) {
    scrollGalleryCardIntoView(id)
  }

  if (detailCache.value[id]) {
    loadingDetail.value = false
    activeDetail.value = detailCache.value[id]
    return
  }

  loadingDetail.value = true
  try {
    const detail = await getTravelMemoryDetail(id)
    if (requestVersion !== detailRequestVersion || activeId.value !== id) {
      return
    }
    detailCache.value[id] = detail
    activeDetail.value = detail
  } catch {
    if (requestVersion === detailRequestVersion && activeId.value === id) {
      ElMessage.error('地点详情加载失败')
    }
  } finally {
    if (requestVersion === detailRequestVersion) {
      loadingDetail.value = false
    }
  }
}

function openCreateDialog() {
  router.push({ name: 'TravelMemoryCreate' })
}

function openCurrentDetailPage() {
  if (!activeDetail.value) {
    ElMessage.info('先选择一个地点，再查看游记。')
    return
  }
  router.push({ name: 'TravelMemoryDetail', params: { id: activeDetail.value.id } })
}

function editGalleryLocation(id: number) {
  router.push({ name: 'TravelMemoryEdit', params: { id } })
}

async function deleteGalleryLocation(location: TravelMemoryLocationListItem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除“${location.title}”吗？删除后将无法恢复。`,
      '删除旅行地点',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    await deleteTravelMemory(location.id)
    ElMessage.success('地点已删除')
    detailCache.value = {}
    await loadMemories()
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    ElMessage.error('删除地点失败')
  }
}

function formatDate(value?: string) {
  return value ? dayjs(value).format('YYYY.MM.DD') : ''
}

function formatDateRange(start?: string, end?: string) {
  const startText = formatDate(start)
  const endText = formatDate(end)
  if (!startText) return endText
  if (!endText || endText === startText) return startText
  return `${startText} - ${endText}`
}

function formatLocation(location?: { province?: string; city?: string }) {
  if (!location) return '未标注地点'
  return [location.province, location.city].filter(Boolean).join(' · ') || '未标注地点'
}

function stopCoverEntry(stop: TravelMemoryStop) {
  return stop.entries.find((entry) => entry.stopCover) || stop.entries[0] || null
}

function buildStopJournalNote(
  stop: TravelMemoryStop,
  entry: TravelMemoryEntry,
  index: number,
  fallbackTitle: string,
  fallbackDate?: string,
): JournalNote {
  const title = stop.title?.trim() || fallbackTitle?.trim() || `第 ${index + 1} 站`
  return {
    key: `stop-${stop.id || index}-${entry.id || entry.imageUrl || index}`,
    imageUrl: entry.imageUrl,
    title,
    copy: entry.remark?.trim() || stop.storyNote?.trim() || entry.thanksNote?.trim() || '把这一刻写进记忆里，留给未来再次翻阅。',
    date: stop.visitedAt || entry.shotAt || fallbackDate,
  }
}

function selectGalleryLocation(id: number) {
  void handleSelectLocation(id)
}

function selectMapLocation(id: number) {
  void handleSelectLocation(id, { syncGallery: false })
}

function buildEntryJournalNote(
  entry: TravelMemoryEntry,
  index: number,
  fallbackTitle: string,
  fallbackDate?: string,
): JournalNote {
  return {
    key: `entry-${entry.id || entry.imageUrl || index}`,
    imageUrl: entry.imageUrl,
    title: entry.remark?.trim() || fallbackTitle || '旅途碎片',
    copy: entry.thanksNote?.trim() || '把这一刻写进记忆里，留给未来再次翻阅。',
    date: entry.shotAt || fallbackDate,
  }
}

function resetGalleryVisibleCount() {
  visibleGalleryCount.value = INITIAL_GALLERY_VISIBLE_COUNT
}

function loadMoreGallery() {
  visibleGalleryCount.value = Math.min(
    locations.value.length,
    visibleGalleryCount.value + GALLERY_LOAD_MORE_STEP,
  )
}

function ensureGalleryLocationVisible(id: number) {
  const targetIndex = locations.value.findIndex((location) => location.id === id)
  if (targetIndex >= visibleGalleryCount.value) {
    visibleGalleryCount.value = targetIndex + 1
  }
}

function setGalleryCardRef(id: number, element: unknown) {
  if (element instanceof HTMLElement) {
    galleryCardRefs.set(id, element)
    return
  }
  galleryCardRefs.delete(id)
}

function scrollGalleryCardIntoView(id: number) {
  galleryCardRefs.get(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest',
  })
}

function resolveDefaultLocationId(
  list: TravelMemoryLocationListItem[],
  preferredId?: number | null,
  currentId?: number | null,
) {
  if (preferredId != null && list.some((item) => item.id === preferredId)) {
    return preferredId
  }
  if (currentId != null && list.some((item) => item.id === currentId)) {
    return currentId
  }

  return list[0]?.id ?? null
}

onMounted(async () => {
  await Promise.all([
    userStore.syncAuthState().catch(() => false),
    loadSiteConfig().catch(() => null),
  ])

  const hero = resolveFeatureHero(siteConfig.value, 'memory-map')
  heroBgImage.value = hero.bgImage
  heroBgPosition.value = hero.bgPosition

  if (canViewContent.value) {
    await loadMemories()
  }
})
</script>

<style scoped lang="scss">
.memory-map-page {
  --memory-gap: clamp(22px, 2vw, 30px);
  --memory-card-radius: 34px;
  --memory-title-font:
    'Microsoft YaHei UI',
    'PingFang SC',
    'Hiragino Sans GB',
    'Noto Sans CJK SC',
    sans-serif;
  display: grid;
  gap: var(--memory-gap);
  width: min(1720px, calc(100vw - 40px));
  max-width: 100%;
  margin-inline: auto;
  margin-top: clamp(18px, 2.4vw, 30px);
  padding-bottom: 44px;
  position: relative;
  z-index: 2;
}

.eyebrow {
  display: inline-block;
  color: #d18ca5;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.memory-spread {
  position: relative;
  display: grid;
  grid-template-columns: minmax(372px, 438px) minmax(0, 1.8fr) minmax(328px, 372px);
  gap: clamp(16px, 1.1vw, 24px);
  min-height: 840px;
  overflow: visible;
  align-items: stretch;
}

.memory-spread__page {
  position: relative;
  min-width: 0;
  padding: 0;
}

.memory-spread__page + .memory-spread__page {
  box-shadow: none;
}

.memory-spread__page--rail {
  display: flex;
  min-height: 0;
  background: transparent;
}

.panel-caption span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 999px;
  background: rgba(255, 244, 247, 0.92);
  border: 1px solid rgba(240, 218, 224, 0.92);
  color: #926978;
  font-size: 12px;
  line-height: 1;
  text-align: center;
}

.memory-rail {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 18px;
  padding: clamp(18px, 1.25vw, 24px);
  border-radius: 32px;
  background:
    linear-gradient(180deg, rgba(255, 252, 250, 0.9), rgba(255, 247, 244, 0.76)),
    radial-gradient(circle at top left, rgba(255, 224, 233, 0.18), transparent 34%);
  border: 1px solid rgba(243, 227, 233, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 16px 34px rgba(220, 191, 199, 0.07);
}

.panel-heading {
  display: grid;
  gap: 14px;
}

.panel-heading__copy {
  display: grid;
  gap: 10px;
  max-width: 34rem;
}

.panel-heading__title {
  display: block;
}

.panel-heading__copy h2 {
  margin: 0;
  color: #4e353e;
  font-family: var(--memory-title-font);
  font-size: clamp(24px, 1.7vw, 30px);
  font-weight: 700;
  line-height: 1.12;
}

.memory-rail__state {
  min-height: 220px;
}

.memory-rail__list {
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 18px;
  overflow: auto;
  padding-right: 8px;
}

.memory-rail__list::-webkit-scrollbar {
  width: 8px;
}

.memory-rail__list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(216, 177, 193, 0.54);
}

.memory-rail__list--placeholder {
  overflow: hidden;
}

.memory-rail__load-more {
  margin-top: 0;
  justify-content: stretch;
}

.memory-spread__page--map {
  display: flex;
  min-width: 0;
  background: transparent;
}

.memory-spread__page--detail {
  display: flex;
  min-width: 0;
  background: transparent;
}

.spread-map-card {
  width: 100%;
  min-height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
  padding: clamp(16px, 1.1vw, 20px);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 252, 250, 0.54), rgba(255, 247, 244, 0.34)),
    radial-gradient(circle at top right, rgba(255, 224, 233, 0.08), transparent 28%);
  border: 1px solid rgba(244, 228, 233, 0.38);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 10px 24px rgba(219, 189, 194, 0.05);
}

.spread-map-card__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.spread-heading {
  display: block;
  min-width: 0;
}

.spread-heading__copy {
  display: grid;
  gap: 8px;
  max-width: 32rem;
}

.spread-heading__title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.spread-heading__copy h2 {
  margin: 0;
  color: #4e353e;
  font-family: var(--memory-title-font);
  font-size: clamp(30px, 2.3vw, 40px);
  font-weight: 700;
  line-height: 1.08;
}

.spread-heading__flower {
  color: #ef88ab;
  font-size: 28px;
  line-height: 1;
  transform: translateY(4px);
}

.spread-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  min-width: 144px;
  padding: 12px 16px;
  border-radius: 22px;
  background: rgba(255, 251, 252, 0.92);
  border: 1px solid rgba(239, 220, 226, 0.94);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 16px 28px rgba(223, 193, 202, 0.12);
  text-align: left;
  white-space: nowrap;
}

.spread-badge__label {
  color: #9d7583;
  font-size: 12px;
  line-height: 1;
  letter-spacing: 0.06em;
  flex: 0 0 auto;
}

.spread-badge__body {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #5a3d47;
  min-width: 0;
}

.spread-badge__body .el-icon {
  color: #f07ca3;
  font-size: 16px;
}

.spread-badge strong {
  color: #5a3d47;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.spread-map-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 18px;
}

.spread-map-actions :deep(.el-button) {
  margin-left: 0;
}

:deep(.travel-map-shell) {
  min-height: 100%;
  border-radius: 28px;
  background: transparent;
  border: none;
  box-shadow: none;
}

:deep(.travel-map-stage) {
  min-height: 640px;
  padding: 6px 0 74px;
}

:deep(.travel-map-board) {
  width: 100%;
  margin: 0 auto;
}

:deep(.travel-map-controls) {
  top: 16px;
  right: 16px;
  left: auto;
  bottom: auto;
}

:deep(.travel-map-control) {
  border-radius: 14px;
}

:deep(.travel-map-legend) {
  right: 8px;
  bottom: 16px;
  background: rgba(255, 252, 251, 0.92);
}

.travel-journal {
  position: relative;
  flex: 1;
  min-height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: clamp(16px, 1.4vw, 20px);
  border-radius: 32px;
  background:
    linear-gradient(180deg, rgba(255, 252, 250, 0.74), rgba(255, 247, 244, 0.58)),
    radial-gradient(circle at top right, rgba(255, 224, 233, 0.14), transparent 30%);
  border: none;
  box-shadow: 0 14px 30px rgba(219, 189, 194, 0.05);
}

.travel-journal.is-loading {
  opacity: 0.94;
}

.travel-journal__loading-note {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 2;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(241, 206, 219, 0.92);
  color: #bd6d89;
  background: rgba(255, 250, 252, 0.94);
  box-shadow: 0 10px 22px rgba(225, 181, 197, 0.14);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.travel-journal__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 20px;
  width: 100%;
}

.travel-journal__copy {
  display: grid;
  gap: 11px;
  min-width: 0;
}

.travel-journal__headline {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.travel-journal__flower {
  color: #db7f9d;
  font-size: 20px;
  line-height: 1;
  transform: translateY(6px);
}

.travel-journal__headline h2 {
  margin: 0;
  color: #4c333d;
  font-family: var(--memory-title-font);
  font-size: clamp(20px, 1.45vw, 26px);
  font-weight: 700;
  line-height: 1.18;
}

.travel-journal__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.travel-journal__fact {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #7f626e;
  font-size: 13px;
  line-height: 1.4;
}

.travel-journal__fact .el-icon {
  color: #df8aa8;
  font-size: 14px;
}

.travel-journal__stamp {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 88px;
  min-height: 88px;
  padding: 7px;
  border-radius: 999px;
  color: #c1708b;
  text-align: center;
  background:
    rgba(255, 247, 244, 0.72)
    url('@/assets/memory-map/stamp-ring.svg') center / 100% 100% no-repeat;
  transform: rotate(-7deg);
}

.travel-journal__stamp span {
  font-size: 11px;
  letter-spacing: 0.08em;
  opacity: 0.84;
}

.travel-journal__stamp strong {
  margin-top: 4px;
  font-family: var(--memory-title-font);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.1;
}

.travel-journal__stamp--placeholder {
  font-size: 13px;
  line-height: 1.1;
}

.travel-journal__stamp--placeholder strong {
  font-size: 24px;
}

.travel-journal__media {
  display: grid;
  gap: 22px;
  width: 100%;
  margin-top: 0;
}

.travel-journal__cover {
  position: relative;
  height: 156px;
  padding: 9px;
  border-radius: 18px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(252, 250, 247, 0.95)),
    linear-gradient(135deg, rgba(255, 239, 245, 0.94), rgba(245, 249, 255, 0.82));
  box-shadow:
    0 16px 28px rgba(217, 189, 198, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.travel-journal__cover img:last-child {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.travel-journal__tape {
  position: absolute;
  top: 7px;
  left: 12px;
  width: 72px;
  z-index: 2;
  pointer-events: none;
}

.travel-journal__cover--placeholder {
  background:
    linear-gradient(135deg, rgba(255, 241, 246, 0.96), rgba(247, 247, 252, 0.84)),
    radial-gradient(circle at top right, rgba(255, 211, 226, 0.36), transparent 34%);
}

.travel-journal__cover-empty,
.journal-state,
.gallery-state {
  display: grid;
  place-items: center;
  text-align: center;
  color: var(--text-secondary);
}

.travel-journal__cover-empty {
  height: 100%;
  border-radius: 10px;
  color: #be92a1;
  letter-spacing: 0.16em;
}

.travel-journal__entries {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  align-items: stretch;
}

.travel-journal__entries--placeholder {
  opacity: 0.94;
}

.journal-note {
  position: relative;
  display: grid;
  grid-template-columns: 108px minmax(0, 1fr);
  align-items: stretch;
  min-height: 0;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  overflow: hidden;
  box-shadow:
    0 12px 22px rgba(220, 191, 200, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.journal-note__thumb {
  background: rgba(249, 244, 247, 0.86);
  min-height: 108px;
}

.journal-note__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.journal-note__thumb--placeholder {
  background:
    linear-gradient(135deg, rgba(255, 240, 246, 0.98), rgba(245, 248, 254, 0.9)),
    repeating-linear-gradient(
      -35deg,
      rgba(255, 255, 255, 0.2),
      rgba(255, 255, 255, 0.2) 8px,
      rgba(255, 226, 236, 0.24) 8px,
      rgba(255, 226, 236, 0.24) 16px
    );
}

.journal-note__body {
  display: grid;
  gap: 5px;
  align-content: start;
  min-height: 0;
  padding: 10px 10px 12px;
  text-align: left;
}

.journal-note__body h4 {
  margin: 0;
  color: #5d3d4b;
  font-size: 13px;
  line-height: 1.42;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.journal-note__body p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.68;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.journal-note__body span {
  margin-top: 4px;
  color: #c57f9a;
  font-size: 11px;
}

.journal-note--placeholder {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 248, 251, 0.74)),
    radial-gradient(circle at top right, rgba(252, 221, 231, 0.18), transparent 42%);
}

.travel-journal__quote {
  position: relative;
  display: grid;
  gap: 10px;
  padding: 18px 20px 18px 50px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 252, 252, 0.98), rgba(255, 247, 248, 0.94)),
    radial-gradient(circle at top right, rgba(255, 224, 233, 0.18), transparent 38%);
  border: 1px solid rgba(240, 214, 220, 0.96);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 12px 24px rgba(226, 196, 206, 0.12);
}

.travel-journal__footer {
  display: grid;
  gap: 18px;
  margin-top: auto;
  padding-top: 6px;
}

.travel-journal__quote::before {
  content: '“';
  position: absolute;
  top: 16px;
  left: 18px;
  color: #ff8fb1;
  font-size: 18px;
  line-height: 1;
}

.travel-journal__quote p {
  margin: 0;
  color: #6c4d5a;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.75;
}

.travel-journal__actions--note {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
  gap: 18px;
  width: 100%;
}

.travel-journal__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  gap: 12px;
}

.travel-journal__actions.travel-journal__actions--note {
  display: grid;
  gap: 18px;
}

.travel-journal__actions--empty {
  display: flex;
  justify-content: center;
}

.journal-action {
  --el-button-bg-color: rgba(255, 251, 252, 0.92);
  --el-button-border-color: rgba(235, 214, 223, 0.96);
  --el-button-text-color: #7c5b68;
  --el-button-hover-bg-color: rgba(255, 246, 249, 0.96);
  --el-button-hover-border-color: rgba(230, 182, 198, 0.96);
  --el-button-hover-text-color: #704d5b;
  min-height: 40px;
  width: 156px;
  flex: 0 0 156px;
  padding-inline: 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  box-shadow: 0 10px 20px rgba(225, 190, 202, 0.1);
}

.journal-action--primary {
  --el-button-bg-color: rgba(255, 243, 247, 0.96);
  --el-button-border-color: rgba(231, 187, 201, 0.96);
  --el-button-text-color: #cb6f8e;
}

.journal-action--danger {
  --el-button-text-color: #d07a8f;
}

.journal-action--detail-view {
  --el-button-text-color: #ffffff;
  --el-button-hover-text-color: #ffffff;
  width: 100%;
  min-width: 0;
  flex-basis: 100%;
  padding-inline: 16px;
  color: #fff !important;
  border: none !important;
  background: linear-gradient(135deg, rgba(255, 133, 176, 0.98), rgba(247, 113, 158, 0.98)) !important;
  box-shadow: 0 12px 22px rgba(243, 136, 171, 0.28) !important;
}

:deep(.journal-action--detail-view:hover),
:deep(.journal-action--detail-view:focus-visible) {
  color: #fff !important;
  border: none !important;
  background: linear-gradient(135deg, rgba(255, 145, 184, 1), rgba(248, 123, 166, 1)) !important;
}

.map-action {
  --el-button-bg-color: transparent;
  --el-button-border-color: transparent;
  --el-button-text-color: #c86f8f;
  --el-button-hover-bg-color: transparent;
  --el-button-hover-border-color: transparent;
  --el-button-hover-text-color: #ba5d81;
  width: auto;
  min-width: 0;
  flex-basis: auto;
  padding: 0;
  border: none !important;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow:
    0 14px 28px rgba(220, 190, 198, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.92) !important;
}

:deep(.map-action:hover),
:deep(.map-action:focus-visible) {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.72) !important;
  box-shadow:
    0 16px 32px rgba(220, 190, 198, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.96) !important;
}

:deep(.map-action > span) {
  width: auto;
  min-width: 0;
  justify-content: space-between;
  gap: 18px;
  padding: 10px 16px;
}

.map-action__lead {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.map-action__lead .el-icon {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  color: #ef7fa4;
  background: rgba(255, 236, 243, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.map-action__arrow {
  color: #d982a0;
  font-size: 16px;
  line-height: 1;
}

:deep(.journal-action > span) {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  line-height: 1.2;
  white-space: nowrap;
}

:deep(.journal-action .el-icon) {
  flex: 0 0 auto;
  font-size: 14px;
  line-height: 1;
}

:deep(.journal-action .el-icon svg) {
  display: block;
}

:deep(.travel-journal__actions .el-button + .el-button) {
  margin-left: 0;
}

.journal-state {
  min-height: 620px;
}

.gallery-state {
  min-height: 220px;
}

.panel-caption {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.rail-item {
  position: relative;
  display: block;
  width: 100%;
  min-height: 0;
  padding: 0;
  border-radius: 16px;
  border: 1px solid rgba(239, 223, 229, 0.82);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 248, 250, 0.9)),
    radial-gradient(circle at top left, rgba(255, 224, 233, 0.18), transparent 42%);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 12px 24px rgba(220, 171, 188, 0.08);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.rail-item:hover,
.rail-item.is-active,
.rail-item:focus-visible {
  transform: translateY(-1px);
  border-color: rgba(235, 145, 180, 0.96);
  background:
    linear-gradient(180deg, rgba(255, 252, 253, 0.98), rgba(255, 243, 247, 0.92)),
    radial-gradient(circle at top left, rgba(255, 214, 226, 0.28), transparent 44%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.98),
    0 20px 32px rgba(218, 158, 180, 0.18);
}

.rail-item.is-active {
  border-color: rgba(231, 119, 164, 0.98);
  box-shadow:
    inset 0 0 0 1px rgba(255, 245, 248, 0.9),
    0 22px 36px rgba(220, 146, 175, 0.22);
}

.rail-item:focus-visible {
  outline: none;
}

.rail-item__thumb-wrap {
  position: relative;
  overflow: hidden;
  border-radius: inherit;
}

.rail-item__thumb-wrap::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 36%;
  background: linear-gradient(180deg, rgba(91, 58, 69, 0), rgba(91, 58, 69, 0.18));
  pointer-events: none;
}

.rail-item__thumb {
  width: 100%;
  aspect-ratio: 12 / 5;
  display: block;
  object-fit: cover;
  object-position: center center;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255, 240, 246, 0.98), rgba(245, 248, 254, 0.9));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 8px 18px rgba(219, 182, 194, 0.1);
}

.rail-item__thumb--empty,
.rail-item__thumb--placeholder {
  display: grid;
  place-items: center;
  color: #c18ca3;
  letter-spacing: 0.16em;
  font-size: 12px;
}

.rail-item--placeholder {
  cursor: default;
}

.rail-item__admin-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  padding: 14px 10px 12px;
  background: linear-gradient(180deg, rgba(40, 32, 38, 0.04), rgba(40, 32, 38, 0.58));
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease;
}

.rail-item:hover .rail-item__admin-overlay,
.rail-item:focus-within .rail-item__admin-overlay,
.rail-item.is-active .rail-item__admin-overlay {
  opacity: 1;
  pointer-events: auto;
}

.rail-item__admin-button {
  width: 34px;
  height: 34px;
  display: inline-grid;
  place-items: center;
  align-items: center;
  padding: 0;
  border: 1px solid rgba(255, 246, 250, 0.82);
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.rail-item__admin-button .el-icon {
  font-size: 15px;
}

.rail-item__admin-button:hover,
.rail-item__admin-button:focus-visible {
  transform: translateY(-1px);
  color: #fff;
  background: rgba(255, 255, 255, 0.28);
  border-color: rgba(255, 255, 255, 0.94);
  outline: none;
}

.rail-item__admin-button--danger {
  color: #ffedf3;
  border-color: rgba(255, 161, 190, 0.58);
  background: rgba(255, 85, 132, 0.36);
}

.rail-item__admin-button--danger:hover,
.rail-item__admin-button--danger:focus-visible {
  background: rgba(201, 64, 92, 0.84);
}

.gallery-load-more {
  display: flex;
  margin-top: 22px;
}

.gallery-load-more__button {
  --el-button-bg-color: rgba(255, 252, 253, 0.92);
  --el-button-border-color: rgba(235, 214, 223, 0.94);
  --el-button-text-color: #7d5d69;
  --el-button-hover-bg-color: rgba(255, 247, 249, 0.98);
  --el-button-hover-border-color: rgba(228, 183, 199, 0.94);
  --el-button-hover-text-color: #6f4f5b;
  min-height: 44px;
  width: 100%;
  padding: 0 18px;
  border-radius: 999px;
  box-shadow: 0 12px 24px rgba(225, 190, 202, 0.12);
}

.gallery-load-more__count {
  margin-left: 10px;
  color: #c6829d;
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 1439px) {
  .memory-map-page {
    width: min(1640px, calc(100vw - 32px));
  }

  .memory-spread {
    grid-template-columns: minmax(336px, 390px) minmax(0, 1.64fr) minmax(316px, 350px);
  }
}

@media (max-width: 1280px) {
  .memory-spread {
    grid-template-columns: minmax(320px, 356px) minmax(0, 1.34fr) minmax(300px, 332px);
    gap: 16px;
  }
}

@media (max-width: 1180px) {
  .memory-spread {
    grid-template-columns: minmax(0, 1.14fr) minmax(300px, 0.86fr);
    grid-template-areas:
      'map detail'
      'rail rail';
  }

  .memory-spread__page--rail {
    grid-area: rail;
    box-shadow: inset 0 1px 0 rgba(230, 212, 205, 0.78);
  }

  .memory-spread__page--map {
    grid-area: map;
  }

  .memory-spread__page--detail {
    grid-area: detail;
  }
}

@media (max-width: 900px) {
  .memory-map-page {
    width: calc(100vw - 28px);
    margin-top: 20px;
  }

  .travel-journal__head,
  .travel-journal__footer {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .travel-journal__stamp {
    justify-self: start;
  }

  .spread-map-card__hero {
    flex-direction: column;
  }

  .spread-badge {
    width: auto;
    max-width: 100%;
  }

  .panel-caption {
    justify-content: flex-start;
  }

  .rail-item__thumb {
    aspect-ratio: 12 / 5;
  }
}

@media (max-width: 768px) {
  .memory-map-page {
    width: calc(100vw - 24px);
    margin-top: 16px;
  }

  .memory-spread {
    grid-template-columns: 1fr;
    grid-template-areas:
      'map'
      'detail'
      'rail';
    border-radius: 24px;
  }

  .memory-spread__page {
    padding: 18px;
  }

  .memory-spread__page + .memory-spread__page {
    box-shadow: inset 0 1px 0 rgba(230, 212, 205, 0.78);
  }

  .spread-map-card {
    padding: 18px;
    border-radius: 24px;
  }

  .spread-map-actions {
    justify-content: center;
  }

  .map-action {
    width: auto;
    flex-basis: auto;
    max-width: 100%;
  }

  :deep(.travel-map-stage) {
    min-height: 500px;
    padding: 6px 0 74px;
  }

  :deep(.travel-map-board) {
    width: 100%;
  }

  .travel-journal__headline h2 {
    font-size: 28px;
  }

  .travel-journal__head {
    gap: 10px;
  }

  .travel-journal {
    gap: 18px;
  }

  .travel-journal__footer {
    margin-top: 0;
  }

  .travel-journal__cover {
    height: 220px;
  }

  .journal-note {
    grid-template-columns: 108px minmax(0, 1fr);
  }

  .journal-note__thumb {
    min-height: 108px;
  }

  .travel-journal__actions {
    justify-content: stretch;
  }

  .journal-action {
    width: 100%;
    flex-basis: 100%;
  }
}

@media (max-width: 560px) {
  .memory-rail__list {
    padding-right: 0;
  }

  .rail-item__thumb {
    aspect-ratio: 12 / 5;
  }

  .travel-journal__stamp {
    min-width: 104px;
    min-height: 104px;
  }

  .travel-journal__stamp strong {
    font-size: 20px;
  }

  .journal-note {
    grid-template-columns: 1fr;
  }

  .journal-note__thumb {
    min-height: 156px;
  }

  .travel-journal__actions--note {
    grid-template-columns: 1fr;
  }

  .gallery-load-more__count {
    display: block;
    margin-top: 4px;
    margin-left: 0;
  }
}
</style>
