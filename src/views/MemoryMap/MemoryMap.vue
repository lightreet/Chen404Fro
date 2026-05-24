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
        :overlay-opacity="0.5"
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
          <div class="memory-spread__spine" aria-hidden="true">
            <span v-for="ring in 7" :key="ring" class="memory-spread__ring" />
          </div>

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
                @select="handleSelectLocation"
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
            <div v-if="loadingDetail" class="journal-state">地点详情加载中...</div>
            <template v-else-if="activeDetail">
              <div class="travel-journal">
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
                    v-for="entry in noteEntries"
                    :key="entry.id || entry.imageUrl"
                    class="journal-note"
                  >
                    <div class="journal-note__thumb">
                      <img :src="entry.imageUrl" :alt="entry.remark || activeDetail.title" />
                    </div>
                    <div class="journal-note__body">
                      <h4>{{ entry.remark || '旅途碎片' }}</h4>
                      <p>{{ entry.thanksNote || '把这一刻写进记忆里，留给未来再次翻阅。' }}</p>
                      <span>{{ formatDate(entry.shotAt) || '留白的一天' }}</span>
                    </div>
                  </article>
                </div>

                <div class="travel-journal__quote">
                  <span class="travel-journal__quote-mark">❝</span>
                  <p>{{ journalQuote }}</p>
                </div>

                <div v-if="canManage" class="travel-journal__actions travel-journal__actions--note">
                  <el-button plain class="journal-action journal-action--note-edit" @click="openCurrentEditDialog">
                    <el-icon><EditPen /></el-icon>
                    编辑该游记
                  </el-button>
                  <el-button class="journal-action journal-action--note-danger" @click="deleteCurrentLocation">
                    <el-icon><Delete /></el-icon>
                    删除该游记
                  </el-button>
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

        <section id="memory-gallery" class="memory-panel memory-panel--gallery">
          <div class="panel-heading panel-heading--gallery">
            <div class="panel-heading__copy">
              <span class="eyebrow">Travel Gallery</span>
              <div class="panel-heading__title">
                <h2>旅行胶片</h2>
              </div>
            </div>
            <div class="panel-caption">
              <span>{{ locations.length }} 个地点 · {{ totalPhotoCount }} 张照片</span>
            </div>
          </div>

          <div v-if="loading" class="gallery-state">地点加载中...</div>
          <div v-else-if="!locations.length" class="gallery-track gallery-track--placeholder">
            <article
              v-for="card in placeholderFilmCards"
              :key="card.title"
              class="gallery-card gallery-card--placeholder"
            >
              <div class="gallery-card__cover gallery-card__cover--placeholder">
                <span>{{ card.label }}</span>
              </div>
              <div class="gallery-card__body">
                <h3>{{ card.title }}</h3>
                <div class="gallery-card__place">
                  <el-icon><Location /></el-icon>
                  <span>{{ card.place }}</span>
                </div>
                <p>{{ card.copy }}</p>
                <div class="gallery-card__footer">
                  <span class="gallery-card__date">
                    <el-icon><Calendar /></el-icon>
                    {{ card.date }}
                  </span>
                  <strong>{{ card.meta }}</strong>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="gallery-grid">
            <button
              v-for="location in visibleGalleryLocations"
              :key="location.id"
              type="button"
              class="gallery-card"
              :class="{ 'is-active': activeId === location.id }"
              :ref="(element) => setGalleryCardRef(location.id, element)"
              @click="openGalleryLocationDetail(location.id)"
            >
              <div class="gallery-card__cover">
                <img v-if="location.coverImage" :src="location.coverImage" :alt="location.title" />
                <div v-else class="gallery-card__cover-empty">TRAVEL</div>
              </div>
              <div class="gallery-card__body">
                <h3>{{ location.title }}</h3>
                <div class="gallery-card__place">
                  <el-icon><Location /></el-icon>
                  <span>{{ formatLocation(location) }}</span>
                </div>
                <p>{{ galleryLocationSummary(location) }}</p>
                <div class="gallery-card__footer">
                  <span class="gallery-card__date">
                    <el-icon><Calendar /></el-icon>
                    {{ galleryLocationDate(location) }}
                  </span>
                  <strong>{{ location.entryCount || 0 }} 张照片</strong>
                </div>
              </div>
            </button>
          </div>

          <div v-if="canLoadMoreGallery" class="gallery-load-more">
            <el-button plain class="gallery-load-more__button" @click="loadMoreGallery">
              加载更多
              <span class="gallery-load-more__count">剩余 {{ remainingGalleryCount }} 个地点</span>
            </el-button>
          </div>
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
import { Calendar, Delete, EditPen, Location } from '@element-plus/icons-vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import FeatureAccessCover from '@/components/FeatureAccessCover.vue'
import TravelMemoryMap from '@/components/TravelMemoryMap/TravelMemoryMap.vue'
import { deleteTravelMemory, getTravelMemories, getTravelMemoryDetail } from '@/api/travel-memory'
import { useSiteConfig } from '@/composables/useSiteConfig'
import { buildMemoryMapCoverConfig, resolveFeatureHero } from '@/modules/feature-access/constants'
import { useUserStore } from '@/stores/user'
import type { TravelMemoryEntry, TravelMemoryLocationDetail, TravelMemoryLocationListItem } from '@/types'
import { isAdminUser, isFriendUser } from '@/utils/permission'
import tapeCornerAsset from '@/assets/memory-map/tape-corner.svg'

const INITIAL_GALLERY_VISIBLE_COUNT = 4
const GALLERY_LOAD_MORE_STEP = 5

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
      }
      return
    }
    detailCache.value = {}
    locations.value = []
    resetGalleryVisibleCount()
    activeId.value = null
    activeDetail.value = null
  } catch {
    detailCache.value = {}
    locations.value = []
    resetGalleryVisibleCount()
    activeId.value = null
    activeDetail.value = null
    ElMessage.error('旅行地点加载失败')
  } finally {
    loading.value = false
  }
}

async function handleSelectLocation(id: number, options: { syncGallery?: boolean } = {}) {
  activeId.value = id
  ensureGalleryLocationVisible(id)
  await nextTick()
  if (options.syncGallery !== false) {
    scrollGalleryCardIntoView(id)
  }

  if (detailCache.value[id]) {
    activeDetail.value = detailCache.value[id]
    return
  }

  activeDetail.value = null
  loadingDetail.value = true
  try {
    const detail = await getTravelMemoryDetail(id)
    detailCache.value[id] = detail
    activeDetail.value = detail
  } catch {
    ElMessage.error('地点详情加载失败')
  } finally {
    loadingDetail.value = false
  }
}

function openCurrentEditDialog() {
  if (!activeDetail.value) {
    ElMessage.info('先选择一个地点，再进行编辑。')
    return
  }
  router.push({ name: 'TravelMemoryEdit', params: { id: activeDetail.value.id } })
}

function openCreateDialog() {
  router.push({ name: 'TravelMemoryCreate' })
}

async function deleteCurrentLocation() {
  if (!activeDetail.value) {
    ElMessage.info('先选择一个地点，再进行删除。')
    return
  }

  const target = activeDetail.value
  try {
    await ElMessageBox.confirm(
      `确定要删除“${target.title}”吗？删除后将无法恢复。`,
      '删除旅行地点',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    await deleteTravelMemory(target.id)
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

function galleryLocationSummary(location: TravelMemoryLocationListItem) {
  return location.summaryNote?.trim() || '把旅途里的光影、街道和心情收进这一张胶片。'
}

function galleryLocationDate(location: TravelMemoryLocationListItem) {
  return formatDateRange(location.visitedAt, location.visitedEndAt) || '留白的一天'
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

function openGalleryLocationDetail(id: number) {
  router.push({ name: 'TravelMemoryDetail', params: { id } })
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
  width: min(1240px, calc(100vw - 148px));
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

.memory-spread,
.memory-panel--gallery {
  position: relative;
  border-radius: var(--memory-card-radius);
  background:
    linear-gradient(180deg, rgba(255, 253, 251, 0.97), rgba(255, 247, 244, 0.95)),
    radial-gradient(circle at top right, rgba(255, 219, 230, 0.26), transparent 34%),
    url('@/assets/memory-map/paper-texture.svg');
  background-size: auto, auto, 320px 320px;
  border: 1px solid rgba(232, 213, 206, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 26px 54px rgba(216, 184, 188, 0.16);
}

.memory-spread {
  display: grid;
  grid-template-columns: minmax(0, 1.36fr) minmax(340px, 0.84fr);
  overflow: hidden;
}

.memory-spread::before {
  content: '';
  position: absolute;
  top: 20px;
  bottom: 20px;
  left: calc(100% * 1.36 / 2.2);
  width: 18px;
  transform: translateX(-50%);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(224, 191, 181, 0.22), rgba(255, 255, 255, 0.84), rgba(224, 191, 181, 0.22));
  box-shadow:
    inset -1px 0 0 rgba(198, 156, 148, 0.16),
    inset 1px 0 0 rgba(255, 255, 255, 0.86);
  pointer-events: none;
}

.memory-spread__spine {
  position: absolute;
  top: 38px;
  bottom: 38px;
  left: calc(100% * 1.36 / 2.2);
  width: 28px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
  pointer-events: none;
}

.memory-spread__ring {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: linear-gradient(180deg, #d1b0a3, #f7ece5);
  border: 1px solid rgba(182, 145, 136, 0.46);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    0 2px 3px rgba(171, 133, 124, 0.14);
}

.memory-spread__page {
  position: relative;
  min-width: 0;
  padding: clamp(22px, 1.8vw, 26px);
}

.memory-spread__page::before {
  content: '';
  position: absolute;
  inset: 14px;
  border-radius: calc(var(--memory-card-radius) - 10px);
  border: 1px solid rgba(229, 209, 201, 0.72);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.42);
  pointer-events: none;
}

.memory-spread__page--map::before {
  display: none;
}

.memory-spread__page--detail {
  padding-left: clamp(38px, 3.2vw, 50px);
  padding-right: clamp(32px, 3vw, 42px);
  background:
    linear-gradient(180deg, rgba(255, 252, 249, 0.42), rgba(255, 246, 242, 0.32));
}

.travel-journal__head,
.travel-journal__footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
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

.memory-spread__page--map {
  padding-right: clamp(24px, 2vw, 30px);
  display: flex;
}

.spread-map-card {
  width: 100%;
  min-height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 18px;
  padding: clamp(24px, 2vw, 28px);
  border-radius: 32px;
  background:
    linear-gradient(180deg, rgba(255, 252, 250, 0.94), rgba(255, 247, 244, 0.82)),
    radial-gradient(circle at top right, rgba(255, 224, 233, 0.22), transparent 30%);
  border: 1px solid rgba(231, 214, 207, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 20px 40px rgba(219, 189, 194, 0.12);
}

.spread-map-card__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.spread-heading {
  display: block;
  min-width: 0;
}

.spread-heading__copy {
  display: grid;
  gap: 10px;
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
  padding: 14px 18px;
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
  min-height: 520px;
  padding: 8px 6px 82px;
}

:deep(.travel-map-board) {
  width: 97%;
  margin: 0 auto;
}

:deep(.travel-map-controls) {
  left: 8px;
  bottom: 18px;
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
  display: grid;
  gap: 18px;
}

.travel-journal__head {
  align-items: flex-start;
}

.travel-journal__copy {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.travel-journal__headline {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.travel-journal__flower {
  color: #db7f9d;
  font-size: 22px;
  line-height: 1;
  transform: translateY(8px);
}

.travel-journal__headline h2 {
  margin: 0;
  color: #4c333d;
  font-family: var(--memory-title-font);
  font-size: clamp(24px, 1.8vw, 31px);
  font-weight: 700;
  line-height: 1.18;
}

.travel-journal__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
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
  min-width: 102px;
  min-height: 102px;
  padding: 10px;
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
  font-size: 17px;
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

.travel-journal__cover {
  position: relative;
  height: 214px;
  padding: 12px;
  border-radius: 18px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(252, 250, 247, 0.95)),
    linear-gradient(135deg, rgba(255, 239, 245, 0.94), rgba(245, 249, 255, 0.82));
  border: 1px solid rgba(237, 221, 228, 0.9);
  box-shadow:
    0 16px 28px rgba(217, 189, 198, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.72);
}

.travel-journal__cover img:last-child {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.travel-journal__tape {
  position: absolute;
  top: 10px;
  left: 18px;
  width: 92px;
  z-index: 2;
  pointer-events: none;
}

.travel-journal__cover::after {
  content: '✿';
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 251, 252, 0.84);
  color: #d78aa5;
  font-size: 18px;
  box-shadow: 0 12px 20px rgba(224, 186, 198, 0.16);
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.travel-journal__entries--placeholder {
  opacity: 0.94;
}

.journal-note {
  position: relative;
  display: grid;
  grid-template-rows: 78px 1fr;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(239, 226, 233, 0.92);
  overflow: hidden;
  box-shadow: 0 12px 22px rgba(220, 191, 200, 0.1);
}

.journal-note::after {
  content: '✿';
  position: absolute;
  right: 8px;
  bottom: 8px;
  color: rgba(221, 147, 172, 0.32);
  font-size: 12px;
}

.journal-note__thumb {
  background: rgba(249, 244, 247, 0.86);
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
  gap: 6px;
  align-content: start;
  min-height: 128px;
  padding: 10px 11px 14px;
  text-align: left;
}

.journal-note__body h4 {
  margin: 0;
  color: #5d3d4b;
  font-size: 13px;
  line-height: 1.5;
}

.journal-note__body p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.72;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
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
  border: 1px solid rgba(240, 214, 220, 0.96);
  background:
    linear-gradient(180deg, rgba(255, 252, 252, 0.98), rgba(255, 247, 248, 0.94)),
    radial-gradient(circle at top right, rgba(255, 224, 233, 0.18), transparent 38%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 12px 24px rgba(226, 196, 206, 0.12);
}

.travel-journal__quote-mark {
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 16px;
}

.travel-journal__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  gap: 12px;
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

.journal-action--note-edit {
  width: 100%;
  min-width: 0;
  flex-basis: auto;
  box-shadow: 0 10px 20px rgba(214, 194, 201, 0.16);
}

.journal-action--note-danger {
  --el-button-bg-color: linear-gradient(135deg, rgba(255, 133, 176, 0.98), rgba(247, 113, 158, 0.98));
  min-width: 0;
  width: 100%;
  flex-basis: auto;
  color: #fff !important;
  border: none !important;
  background: linear-gradient(135deg, rgba(255, 133, 176, 0.98), rgba(247, 113, 158, 0.98)) !important;
  box-shadow: 0 12px 22px rgba(243, 136, 171, 0.28) !important;
}

:deep(.journal-action--note-danger:hover),
:deep(.journal-action--note-danger:focus-visible) {
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

.memory-panel--gallery {
  overflow: hidden;
  padding: clamp(18px, 1.6vw, 22px);
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
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
  font-size: clamp(20px, 1.35vw, 24px);
  font-weight: 700;
  line-height: 1.16;
}

.panel-caption {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.gallery-state {
  min-height: 220px;
}

.gallery-track {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 260px));
  gap: 14px;
  justify-content: start;
  padding-bottom: 4px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 260px));
  gap: 16px;
  justify-content: start;
  align-items: start;
}

.gallery-card {
  position: relative;
  width: 100%;
  padding: 0;
  border-radius: 16px;
  border: 1px solid rgba(246, 191, 211, 0.74);
  background: rgba(255, 255, 255, 0.97);
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  box-shadow:
    0 12px 24px rgba(220, 171, 188, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
  transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
}

.gallery-card:hover,
.gallery-card.is-active {
  transform: translateY(-3px);
  border-color: rgba(237, 133, 173, 0.82);
  box-shadow:
    0 14px 28px rgba(218, 158, 180, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.96);
}

.gallery-card__cover {
  height: clamp(148px, 15vw, 168px);
  background: linear-gradient(135deg, #fff0f5, #f5f8ff);
}

.gallery-card__cover img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.gallery-card__cover-empty,
.gallery-card__cover--placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #c18ca3;
  letter-spacing: 0.18em;
  font-size: 12px;
}

.gallery-card__body {
  display: grid;
  gap: 8px;
  min-height: 132px;
  padding: 12px 14px 11px;
  border-top: 1px solid rgba(243, 224, 231, 0.84);
}

.gallery-card__body h3 {
  margin: 0;
  color: #4f3c46;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.32;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.gallery-card__place,
.gallery-card__date {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  color: #d7689a;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.gallery-card__place span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-card__place :deep(.el-icon),
.gallery-card__date :deep(.el-icon) {
  flex: 0 0 auto;
  font-size: 13px;
}

.gallery-card__body p {
  min-height: 40px;
  margin: 0;
  color: #8d7b84;
  font-size: 12px;
  line-height: 1.65;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.gallery-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  padding-top: 9px;
  border-top: 1px solid rgba(244, 224, 231, 0.86);
}

.gallery-card__date {
  color: #a58c98;
  font-weight: 600;
}

.gallery-card__footer strong {
  flex: 0 0 auto;
  padding: 6px 9px;
  border-radius: 999px;
  background: rgba(255, 244, 247, 0.95);
  border: 1px solid rgba(237, 214, 223, 0.92);
  color: #e66f9a;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

.gallery-load-more {
  display: flex;
  justify-content: center;
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

.gallery-card--placeholder {
  cursor: default;
}

@media (max-width: 1200px) {
  .memory-spread {
    grid-template-columns: 1fr;
  }

  .memory-spread::before,
  .memory-spread__spine {
    display: none;
  }

  .memory-spread__page--map,
  .memory-spread__page--detail {
    padding-left: clamp(24px, 2vw, 32px);
    padding-right: clamp(24px, 2vw, 32px);
  }
}

@media (max-width: 900px) {
  .memory-map-page {
    width: min(1240px, calc(100vw - 40px));
    margin-top: 20px;
  }

  .travel-journal__head,
  .travel-journal__footer,
  .panel-heading {
    flex-direction: column;
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
}

@media (max-width: 768px) {
  .memory-map-page {
    width: min(1240px, calc(100vw - 24px));
    margin-top: 16px;
  }

  .memory-spread,
  .memory-panel--gallery {
    border-radius: 24px;
  }

  .memory-spread__page,
  .memory-panel--gallery {
    padding: 18px;
  }

  .memory-spread__page::before {
    inset: 10px;
    border-radius: 18px;
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
    min-height: 420px;
    padding: 6px 0 74px;
  }

  :deep(.travel-map-board) {
    width: 100%;
  }

  .travel-journal__headline h2 {
    font-size: 28px;
  }

  .travel-journal__cover {
    height: 220px;
  }

  .travel-journal__entries {
    grid-template-columns: 1fr;
  }

  .journal-note {
    grid-template-columns: 108px minmax(0, 1fr);
    grid-template-rows: none;
  }

  .journal-note__thumb {
    height: auto;
    min-height: 108px;
  }

  .travel-journal__actions {
    justify-content: stretch;
  }

  .journal-action {
    width: 100%;
    flex-basis: 100%;
  }

  .gallery-grid,
  .gallery-track {
    grid-template-columns: repeat(auto-fit, minmax(220px, 260px));
    justify-content: center;
  }
}

@media (max-width: 560px) {
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

  .gallery-card__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .gallery-load-more__button {
    width: 100%;
  }

  .gallery-load-more__count {
    display: block;
    margin-top: 4px;
    margin-left: 0;
  }
}
</style>
