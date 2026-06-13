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
        icon="Location"
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
              <div v-else-if="memoryLoadError" class="gallery-state memory-rail__state memory-rail__state--error">
                <strong>旅行地点加载失败</strong>
                <p>{{ memoryLoadError }}</p>
                <UiButton variant="secondary" class="gallery-state__retry" @click="retryMemoryList">重新加载</UiButton>
              </div>
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
                  :ref="(element) => setGalleryCardRef(location.id, element)"
                >
                  <button
                    type="button"
                    class="rail-item__select"
                    :class="{ 'is-active': activeId === location.id }"
                    :aria-label="`查看 ${location.title}`"
                    :aria-pressed="activeId === location.id"
                    @click="selectGalleryLocation(location.id)"
                  >
                    <span class="rail-item__rule" aria-hidden="true" />
                    <span class="rail-item__thumb-wrap">
                      <img
                        v-if="location.coverImage"
                        class="rail-item__thumb"
                        :src="location.coverImage"
                        :alt="location.title"
                      />
                      <span v-else class="rail-item__thumb rail-item__thumb--empty">TRAVEL</span>
                    </span>
                    <span class="rail-item__body">
                      <span class="rail-item__title-row">
                        <span class="rail-item__title">{{ location.title }}</span>
                        <span v-if="activeId === location.id" class="rail-item__active-badge">当前</span>
                      </span>
                      <span class="rail-item__place">{{ formatLocation(location) }}</span>
                      <span class="rail-item__meta">
                        <span v-if="formatDateRange(location.visitedAt, location.visitedEndAt)">
                          {{ formatDateRange(location.visitedAt, location.visitedEndAt) }}
                        </span>
                        <span v-if="location.entryCount" class="rail-item__count">
                          {{ location.entryCount }} 张
                        </span>
                      </span>
                    </span>
                  </button>
                </article>
              </div>

              <div v-if="canLoadMoreGallery" class="gallery-load-more memory-rail__load-more">
                <UiButton variant="secondary" class="gallery-load-more__button" @click="loadMoreGallery">
                  加载更多
                  <span class="gallery-load-more__count">剩余 {{ remainingGalleryCount }} 个地点</span>
                </UiButton>
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
                    <UiIcon name="Location" />
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
                <UiButton variant="ghost" icon="location" class="journal-action journal-action--primary map-action" @click="openCreateDialog">
                  <span class="map-action__lead">
                    <span>新增旅游地点</span>
                  </span>
                  <span class="map-action__arrow" aria-hidden="true">→</span>
                </UiButton>
              </div>
            </div>
          </article>

          <aside class="memory-spread__page memory-spread__page--detail">
            <template v-if="activeDetail">
              <div
                :key="activeId ?? 'empty-journal'"
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
                        <UiIcon name="Location" />
                        <span>{{ journalLocationText }}</span>
                      </span>
                      <span v-if="journalDateRange" class="travel-journal__fact travel-journal__fact--date">
                        <UiIcon name="Calendar" />
                        <span>{{ journalDateRange }}</span>
                      </span>
                    </div>
                  </div>

                  <div class="travel-journal__stamp">
                    <span>旅途邮戳</span>
                    <strong>{{ journalStampLabel }}</strong>
                  </div>
                </div>

                <div v-if="detailLoadError" class="travel-journal__error" role="status" aria-live="polite">
                  <div class="travel-journal__error-copy">
                    <strong>地点详情加载失败</strong>
                    <p>{{ detailLoadError }}</p>
                  </div>
                  <UiButton variant="secondary" class="journal-action journal-action--retry" @click="retryActiveDetail">重新加载</UiButton>
                </div>

                <div class="travel-journal__media">
                  <div class="travel-journal__cover">
                    <img class="travel-journal__tape" :src="tapeCornerAsset" alt="" aria-hidden="true" />
                    <img
                      v-if="journalCoverImage"
                      :src="journalCoverImage"
                      :alt="journalCoverAlt"
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
                      </div>
                    </article>
                  </div>
                </div>

                <div class="travel-journal__footer">
                  <div class="travel-journal__quote">
                    <p>{{ journalQuote }}</p>
                  </div>

                  <div v-if="activeDetail" class="travel-journal__actions travel-journal__actions--note">
                    <UiButton variant="primary" icon="eye" class="journal-action journal-action--detail-view" @click="openCurrentDetailPage">
                      查看游记
                    </UiButton>
                    <div v-if="canManage" class="travel-journal__manage">
                      <UiButton variant="secondary" icon="edit" class="journal-action journal-action--manage" @click="editGalleryLocation(activeDetail.id)">
                        编辑地点
                      </UiButton>
                      <UiButton variant="danger" icon="delete" class="journal-action journal-action--danger" @click="deleteGalleryLocation(activeDetail)">
                        删除地点
                      </UiButton>
                    </div>
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
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { storeToRefs } from 'pinia'
import { notify, confirmDelete } from '@/lib/feedback'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import FeatureAccessCover from '@/components/FeatureAccessCover.vue'
import TravelMemoryMap from '@/components/TravelMemoryMap/TravelMemoryMap.vue'
import { UiButton, UiIcon } from '@/components/ui'
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
const route = useRoute()
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
const detailLoadError = ref('')
const memoryLoadError = ref('')
const galleryCardRefs = new Map<number, HTMLElement>()
let detailRequestVersion = 0
let memoryLoadVersion = 0
let hasInitializedAccessState = false
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
const journalCoverImage = computed(() => coverEntry.value?.imageUrl || activeDetail.value?.coverImage || '')
const journalCoverAlt = computed(() => coverEntry.value?.remark || activeDetail.value?.title || '旅行封面')
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
  const requestVersion = ++memoryLoadVersion
  loading.value = true
  detailLoadError.value = ''
  memoryLoadError.value = ''
  try {
    const list = await getTravelMemories()
    if (requestVersion !== memoryLoadVersion || !canViewContent.value) return
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
    resetMemoryState()
  } catch {
    if (requestVersion !== memoryLoadVersion) return
    resetMemoryState()
    memoryLoadError.value = '请检查登录状态、接口连通性，或稍后再试。'
    notify.error('旅行地点加载失败')
  } finally {
    if (requestVersion === memoryLoadVersion) {
      loading.value = false
    }
  }
}

async function handleSelectLocation(id: number, options: { syncGallery?: boolean } = {}) {
  const requestVersion = ++detailRequestVersion
  const cachedDetail = detailCache.value[id]
  const summary = locations.value.find((location) => location.id === id)
  activeId.value = id
  detailLoadError.value = ''
  activeDetail.value = cachedDetail || (summary ? buildPendingDetail(summary) : null)
  ensureGalleryLocationVisible(id)
  await nextTick()
  if (options.syncGallery !== false) {
    scrollGalleryCardIntoView(id)
  }

  if (cachedDetail) {
    loadingDetail.value = false
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
      detailLoadError.value = '当前先展示基础摘要，你可以稍后重新加载完整游记。'
      notify.error('地点详情加载失败')
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

function retryActiveDetail() {
  if (activeId.value == null) return
  void handleSelectLocation(activeId.value, { syncGallery: false })
}

function retryMemoryList() {
  void loadMemories(resolveRouteFocusId())
}

function openCurrentDetailPage() {
  if (!activeDetail.value) {
    notify.info('先选择一个地点，再查看游记。')
    return
  }
  router.push({ name: 'TravelMemoryDetail', params: { id: activeDetail.value.id } })
}

function editGalleryLocation(id: number) {
  router.push({ name: 'TravelMemoryEdit', params: { id } })
}

async function deleteGalleryLocation(location: Pick<TravelMemoryLocationListItem, 'id' | 'title'>) {
  const confirmed = await confirmDelete(`确定要删除“${location.title}”吗？删除后将无法恢复。`, {
    title: '删除旅行地点',
  })
  if (!confirmed) return
  try {
    await deleteTravelMemory(location.id)
    notify.success('地点已删除')
    detailCache.value = {}
    await loadMemories()
  } catch {
    notify.error('删除地点失败')
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
  void handleSelectLocation(id)
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

function buildPendingDetail(location: TravelMemoryLocationListItem): TravelMemoryLocationDetail {
  return {
    ...location,
    entries: [],
    stops: [],
  }
}

function resetMemoryState() {
  memoryLoadVersion += 1
  detailRequestVersion += 1
  detailCache.value = {}
  locations.value = []
  resetGalleryVisibleCount()
  activeId.value = null
  activeDetail.value = null
  loading.value = false
  loadingDetail.value = false
  detailLoadError.value = ''
  memoryLoadError.value = ''
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

function resolveRouteFocusId() {
  const rawValue = Array.isArray(route.query.focus) ? route.query.focus[0] : route.query.focus
  const numericId = Number(rawValue)
  return Number.isFinite(numericId) ? numericId : null
}

onMounted(async () => {
  await Promise.all([
    userStore.syncAuthState().catch(() => false),
    loadSiteConfig().catch(() => null),
  ])

  const hero = resolveFeatureHero(siteConfig.value, 'memory-map')
  heroBgImage.value = hero.bgImage
  heroBgPosition.value = hero.bgPosition
  await syncMemoryContent()
  hasInitializedAccessState = true
})

async function syncMemoryContent() {
  if (!canViewContent.value) {
    resetMemoryState()
    return
  }
  await loadMemories(resolveRouteFocusId())
}

watch(
  () => canViewContent.value,
  async (next, previous) => {
    if (!hasInitializedAccessState || next === previous) return
    await syncMemoryContent()
  },
)

watch(
  () => route.query.focus,
  (focus) => {
    if (!hasInitializedAccessState || !canViewContent.value) return
    const targetId = Array.isArray(focus) ? Number(focus[0]) : Number(focus)
    if (!Number.isFinite(targetId) || targetId === activeId.value) return
    void handleSelectLocation(targetId)
  },
)
</script>

<style scoped lang="scss">
.memory-map-page {
  --memory-gap: clamp(22px, 2vw, 30px);
  --memory-radius-panel: 22px;
  --memory-radius-card: 16px;
  /* atlas accent line shared across marker / rail / title */
  --atlas-route: #d75f87;
  --atlas-ink: #4e353e;
  --atlas-paper: #fff8f2;
  /* neutral ground + solid surfaces, pink reserved as accent */
  --memory-surface: #ffffff;
  --memory-rail-fill: rgba(255, 252, 253, 0.55);
  --memory-line: rgba(232, 214, 221, 0.72);
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
  border-radius: var(--memory-radius-panel);
  background: var(--memory-rail-fill);
  border: 1px solid var(--memory-line);
  box-shadow: none;
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
  color: var(--atlas-ink);
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
  gap: 12px;
  overflow: auto;
  padding-right: 8px;
}

.memory-rail__list::-webkit-scrollbar {
  width: 8px;
}

.memory-rail__list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(196, 178, 160, 0.5);
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
  border-radius: var(--memory-radius-panel);
  background: var(--memory-surface);
  border: 1px solid var(--memory-line);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 18px 42px rgba(74, 43, 55, 0.13);
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
  color: var(--atlas-ink);
  font-family: var(--memory-title-font);
  font-size: clamp(30px, 2.3vw, 40px);
  font-weight: 700;
  line-height: 1.08;
}

.spread-heading__flower {
  color: var(--atlas-route);
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
  padding: 10px 16px;
  border-radius: var(--memory-radius-card);
  background: var(--colors-surface-rose, #fff1f6);
  border: 1px solid rgba(215, 95, 135, 0.24);
  box-shadow: none;
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
  color: var(--atlas-route);
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
  border-radius: var(--memory-radius-card);
  background: transparent;
  border: none;
  box-shadow: none;
}

:deep(.travel-map-stage) {
  min-height: 640px;
  padding: 0 0 68px;
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
  gap: 16px;
  padding: clamp(16px, 1.2vw, 20px);
  border-radius: var(--memory-radius-panel);
  background: var(--memory-rail-fill);
  border: 1px solid var(--memory-line);
  box-shadow: none;
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

.travel-journal__error {
  display: grid;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 249, 250, 0.98), rgba(255, 242, 245, 0.94)),
    radial-gradient(circle at top right, rgba(255, 208, 220, 0.22), transparent 36%);
  border: 1px solid rgba(238, 197, 209, 0.94);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 12px 24px rgba(226, 196, 206, 0.1);
}

.travel-journal__error-copy {
  display: grid;
  gap: 6px;
}

.travel-journal__error-copy strong {
  color: #84495f;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
}

.travel-journal__error-copy p {
  margin: 0;
  color: #7b5d6a;
  font-size: 13px;
  line-height: 1.6;
}

.travel-journal__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px;
  width: 100%;
}

.travel-journal__copy {
  display: grid;
  gap: 9px;
  min-width: 0;
}

.travel-journal__headline {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.travel-journal__flower {
  color: var(--atlas-route);
  font-size: 20px;
  line-height: 1;
  transform: translateY(6px);
}

.travel-journal__headline h2 {
  margin: 0;
  color: var(--atlas-ink);
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
  min-width: 80px;
  min-height: 80px;
  padding: 6px;
  border-radius: 999px;
  color: var(--atlas-route);
  text-align: center;
  background:
    rgba(255, 247, 244, 0.72)
    url('@/assets/memory-map/stamp-ring.svg') center / 100% 100% no-repeat;
  transform: rotate(-7deg);
}

.travel-journal__stamp span {
  font-size: 10px;
  letter-spacing: 0.08em;
  opacity: 0.84;
}

.travel-journal__stamp strong {
  margin-top: 3px;
  font-family: var(--memory-title-font);
  font-size: 15px;
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
  gap: 16px;
  width: 100%;
  margin-top: 0;
}

.travel-journal__cover {
  position: relative;
  height: 184px;
  padding: 8px;
  border-radius: var(--memory-radius-card);
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
  top: 6px;
  left: 10px;
  width: 64px;
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
  gap: 8px;
  align-items: stretch;
}

.travel-journal__entries--placeholder {
  opacity: 0.94;
}

.journal-note {
  position: relative;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  align-items: stretch;
  height: 96px;
  border-radius: 14px;
  background: var(--memory-surface);
  border: 1px solid var(--memory-line);
  overflow: hidden;
  box-shadow: none;
}

.journal-note__thumb {
  height: 100%;
  min-height: 96px;
  background: rgba(249, 244, 247, 0.86);
}

.journal-note__thumb img {
  display: block;
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
  gap: 4px;
  align-content: center;
  min-height: 0;
  padding: 10px 12px;
  text-align: left;
}

.journal-note__body h4 {
  margin: 0;
  color: var(--atlas-ink);
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.35;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.journal-note__body p {
  margin: 0;
  color: #7f626e;
  font-size: 12.5px;
  line-height: 1.5;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.journal-note--placeholder {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 248, 251, 0.74)),
    radial-gradient(circle at top right, rgba(252, 221, 231, 0.18), transparent 42%);
}

.travel-journal__quote {
  position: relative;
  display: grid;
  gap: 8px;
  padding: 14px 16px 14px 40px;
  border-radius: 16px;
  background: var(--memory-surface);
  border: 1px solid var(--memory-line);
  box-shadow: none;
}

.travel-journal__footer {
  display: grid;
  gap: 12px;
  margin-top: 0;
  padding-top: 0;
}

.travel-journal__quote::before {
  content: '“';
  position: absolute;
  top: 12px;
  left: 14px;
  color: var(--atlas-route);
  font-size: 16px;
  line-height: 1;
}

.travel-journal__quote p {
  margin: 0;
  color: var(--atlas-ink);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.62;
}

.travel-journal__actions--note {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
  gap: 14px;
  width: 100%;
}

.travel-journal__manage {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  justify-content: stretch;
  align-items: stretch;
  gap: 10px;
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
  gap: 14px;
}

.travel-journal__actions--empty {
  display: flex;
  justify-content: center;
}

.journal-action {
  min-height: 38px;
  width: 100%;
  min-width: 0;
  padding-inline: 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  justify-content: center;
  white-space: nowrap;
}

.journal-action--primary {
  color: #cb6f8e;
}

.journal-action--danger {
  color: #fff;
}

.journal-action--manage {
  color: #7a5f6d;
}

.journal-action--detail-view {
  width: 100%;
  padding-inline: 16px;
}

.journal-action--retry {
  width: 100%;
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

.map-action :deep(.ui-button__label) {
  width: auto;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 10px 16px;
}

.map-action__lead {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.map-action__arrow {
  color: #d982a0;
  font-size: 16px;
  line-height: 1;
}

.journal-action :deep(.ui-button__icon) {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
}

.journal-action :deep(.ui-button__label) {
  flex: 1 1 auto;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  line-height: 1.2;
  white-space: nowrap;
}

.journal-state {
  min-height: 620px;
}

.gallery-state {
  min-height: 220px;
}

.memory-rail__state--error {
  gap: 10px;
  align-content: center;
}

.memory-rail__state--error strong {
  color: #84495f;
  font-size: 15px;
  font-weight: 700;
}

.memory-rail__state--error p {
  margin: 0;
  max-width: 18rem;
  color: #7b5d6a;
  font-size: 13px;
  line-height: 1.7;
}

.gallery-state__retry {
  min-width: 132px;
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
}

.rail-item__select {
  position: relative;
  display: grid;
  grid-template-columns: auto 72px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px 10px 0;
  border: 1px solid transparent;
  border-radius: var(--memory-radius-card);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.rail-item__select:hover {
  background: rgba(255, 252, 253, 0.92);
  border-color: var(--memory-line);
}

.rail-item__select:focus-visible {
  outline: none;
  border-color: var(--atlas-route);
  box-shadow: 0 0 0 3px rgba(215, 95, 135, 0.16);
}

/* shared atlas accent line — lights up only on the active row */
.rail-item__rule {
  width: 3px;
  align-self: stretch;
  margin: 2px 0;
  border-radius: 999px;
  background: transparent;
  transition: background 0.2s ease;
}

.rail-item__thumb-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: var(--memory-surface);
  box-shadow: inset 0 0 0 1px var(--memory-line);
}

.rail-item__thumb {
  width: 72px;
  height: 54px;
  display: block;
  object-fit: cover;
  object-position: center center;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255, 240, 246, 0.98), rgba(245, 248, 254, 0.9));
}

.rail-item__thumb--empty,
.rail-item__thumb--placeholder {
  display: grid;
  place-items: center;
  color: #c18ca3;
  letter-spacing: 0.14em;
  font-size: 10px;
}

.rail-item__body {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.rail-item__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.rail-item__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--atlas-ink);
  font-family: var(--memory-title-font);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.rail-item__active-badge {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 9px;
  border-radius: 999px;
  color: #fff;
  background: var(--atlas-route);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.rail-item__place {
  overflow: hidden;
  color: #8a6f79;
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.rail-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a98f99;
  font-size: 11.5px;
  line-height: 1.3;
}

.rail-item__count {
  position: relative;
  padding-left: 9px;
}

.rail-item__count::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: currentColor;
  transform: translateY(-50%);
  opacity: 0.6;
}

.rail-item--placeholder {
  cursor: default;
}

.rail-item.is-active .rail-item__select {
  background: var(--colors-surface-rose, #fff1f6);
  border-color: rgba(215, 95, 135, 0.28);
}

.rail-item.is-active .rail-item__rule {
  background: var(--atlas-route);
}

.rail-item.is-active .rail-item__title {
  color: var(--atlas-route);
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

  .travel-journal__manage {
    grid-template-columns: 1fr;
  }

  .gallery-load-more__count {
    display: block;
    margin-top: 4px;
    margin-left: 0;
  }
}
</style>
