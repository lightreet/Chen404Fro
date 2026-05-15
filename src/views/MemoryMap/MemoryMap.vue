<template>
  <DefaultLayout :wide-content="true" :show-live2-d="false">
    <template #hero>
      <PageHero
        title="旅行纪念地图"
        eyebrow="Memory Map"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="52vh"
        :overlay-opacity="0.56"
        compact
      />
    </template>

    <div class="memory-map-page">
      <TravelMemoryManager
        v-if="canManage"
        ref="managerRef"
        :selected-id="activeId"
        :active-location="activeDetail"
        :show-toolbar="false"
        @changed="handleManagerChanged"
        @focus="handleSelectLocation"
      />

      <section class="memory-spread">
        <div class="memory-spread__spine" aria-hidden="true">
          <span v-for="ring in 7" :key="ring" class="memory-spread__ring" />
        </div>

        <article class="memory-spread__page memory-spread__page--map">
          <div class="spread-heading">
            <div class="spread-heading__copy">
              <span class="eyebrow">Memory Map</span>
              <h2>旅行足迹</h2>
            </div>
            <div class="spread-badge">
              <span>当前地点</span>
              <strong>{{ currentLocationName }}</strong>
              <em v-if="previewMode" class="spread-badge__preview">预览数据</em>
            </div>
          </div>

          <div class="spread-map-frame">
            <TravelMemoryMap
              :locations="locations"
              :active-id="activeId"
              @select="handleSelectLocation"
            />
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

              <div class="travel-journal__footer">
                <span class="travel-journal__count">
                  <el-icon><PictureFilled /></el-icon>
                  <span>共 {{ activePhotoCount }} 张照片</span>
                </span>
                <button type="button" class="detail-link" @click="scrollToGallery">查看全部记忆</button>
              </div>

              <div v-if="canManage" class="travel-journal__actions">
                <el-button type="primary" plain class="journal-action journal-action--primary" @click="openCreateDialog">
                  <el-icon><Plus /></el-icon>
                  新增旅游地点
                </el-button>
                <el-button plain class="journal-action" @click="openCurrentEditDialog">
                  <el-icon><EditPen /></el-icon>
                  编辑当前地点
                </el-button>
                <el-button type="danger" plain class="journal-action journal-action--danger" @click="deleteCurrentLocation">
                  <el-icon><Delete /></el-icon>
                  删除当前地点
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

              <div v-if="canManage" class="travel-journal__actions travel-journal__actions--empty">
                <el-button type="primary" @click="openCreateDialog">记录第一次旅行</el-button>
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
              <p>每一帧都是回忆</p>
            </div>
          </div>
          <div class="panel-caption">
            <span>{{ locations.length }} 个地点</span>
            <span>{{ totalPhotoCount }} 张照片</span>
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
              <div class="gallery-card__meta">
                <span>{{ card.copy }}</span>
                <strong>{{ card.meta }}</strong>
              </div>
            </div>
          </article>
        </div>
        <Swiper
          v-else
          class="gallery-swiper"
          :modules="swiperModules"
          :slides-per-view="1.08"
          :space-between="16"
          :navigation="true"
          :breakpoints="filmstripBreakpoints"
        >
          <SwiperSlide v-for="location in locations" :key="location.id">
            <button
              type="button"
              class="gallery-card"
              :class="{ 'is-active': activeId === location.id }"
              @click="handleSelectLocation(location.id)"
            >
              <div class="gallery-card__cover">
                <img v-if="location.coverImage" :src="location.coverImage" :alt="location.title" />
                <div v-else class="gallery-card__cover-empty">TRAVEL</div>
              </div>
              <div class="gallery-card__body">
                <h3>{{ location.title }}</h3>
                <div class="gallery-card__meta">
                  <span>{{ location.city || location.province || '未标注城市' }}</span>
                  <strong>{{ location.entryCount || 0 }} 张照片</strong>
                </div>
              </div>
            </button>
          </SwiperSlide>
        </Swiper>
      </section>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { Calendar, Delete, EditPen, Location, PictureFilled, Plus } from '@element-plus/icons-vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import TravelMemoryManager from '@/components/TravelMemoryManager/TravelMemoryManager.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import TravelMemoryMap from '@/components/TravelMemoryMap/TravelMemoryMap.vue'
import { getTravelMemories, getTravelMemoryDetail } from '@/api/travel-memory'
import { useSiteConfig } from '@/composables/useSiteConfig'
import { useUserStore } from '@/stores/user'
import type { TravelMemoryEntry, TravelMemoryLocationDetail, TravelMemoryLocationListItem } from '@/types'
import { isAdminUser } from '@/utils/permission'
import { resolveHeroImage, resolveHeroImagePosition } from '@/utils/siteConfig'
import tapeCornerAsset from '@/assets/memory-map/tape-corner.svg'
import { createDemoTravelMemoryDetailMap, createDemoTravelMemoryList } from './demoTravelMemories'

const DEFAULT_HERO =
  'https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=80'
const DEFAULT_HERO_POSITION = '50% 56%'
const swiperModules = [Navigation]
const filmstripBreakpoints = {
  640: { slidesPerView: 2.1, spaceBetween: 16 },
  960: { slidesPerView: 3.05, spaceBetween: 18 },
  1280: { slidesPerView: 5.25, spaceBetween: 18 },
}

const { siteConfig, loadSiteConfig } = useSiteConfig()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const managerRef = ref<{
  openCreateDialog: () => void
  openEditDialog: (row: TravelMemoryLocationDetail) => void
  confirmDelete: (row: TravelMemoryLocationDetail) => void
} | null>(null)

const heroBgImage = ref(DEFAULT_HERO)
const heroBgPosition = ref(DEFAULT_HERO_POSITION)
const loading = ref(false)
const loadingDetail = ref(false)
const locations = ref<TravelMemoryLocationListItem[]>([])
const activeId = ref<number | null>(null)
const activeDetail = ref<TravelMemoryLocationDetail | null>(null)
const detailCache = ref<Record<number, TravelMemoryLocationDetail>>({})
const previewMode = ref(false)
const canManage = computed(() => isAdminUser(user.value))
const coverEntry = computed<TravelMemoryEntry | null>(() => {
  const entries = activeDetail.value?.entries || []
  return entries.find((entry) => entry.cover) || entries[0] || null
})
const noteEntries = computed(() => {
  const entries = activeDetail.value?.entries || []
  const filtered = entries.filter((entry) => entry !== coverEntry.value)
  return filtered.length ? filtered.slice(0, 3) : entries.slice(0, 3)
})
const activePhotoCount = computed(() => activeDetail.value?.entries?.length || 0)
const totalPhotoCount = computed(() =>
  locations.value.reduce((sum, location) => sum + Number(location.entryCount || 0), 0),
)
const currentLocationName = computed(
  () => activeDetail.value?.city || activeDetail.value?.province || activeDetail.value?.title || '未选择',
)
const journalTitle = computed(() => activeDetail.value?.title?.trim() || '旅行详情')
const journalLocationText = computed(() => {
  if (!activeDetail.value) return ''
  const value = formatLocation(activeDetail.value)
  return value === '未标注地点' ? '' : value
})
const journalDateRange = computed(() => formatDate(activeDetail.value?.visitedAt))
const journalStampLabel = computed(() => currentLocationName.value)
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
    copy: '第一段回忆会从这里展开',
    meta: '等待收藏',
  },
  {
    label: 'SEA',
    title: '海边的晚风',
    copy: '把夕阳和潮声装进胶片里',
    meta: '等待收藏',
  },
  {
    label: 'MOUNTAIN',
    title: '山野来信',
    copy: '留给未来再翻阅的一页',
    meta: '等待收藏',
  },
] as const

async function loadMemories(preferredId?: number | null) {
  loading.value = true
  try {
    const list = await getTravelMemories()
    if (list?.length) {
      previewMode.value = false
      locations.value = list
      const nextId = resolveDefaultLocationId(locations.value, preferredId, activeId.value)

      if (nextId != null) {
        await handleSelectLocation(nextId)
      } else {
        activeId.value = null
        activeDetail.value = null
      }
      return
    }
    usePreviewMemories(preferredId)
  } catch {
    usePreviewMemories(preferredId)
  } finally {
    loading.value = false
  }
}

async function handleSelectLocation(id: number) {
  activeId.value = id
  if (detailCache.value[id]) {
    activeDetail.value = detailCache.value[id]
    return
  }

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

async function handleManagerChanged(payload: { selectedId?: number | null }) {
  detailCache.value = {}
  await loadMemories(payload.selectedId ?? null)
}

function openCurrentEditDialog() {
  if (!activeDetail.value) {
    ElMessage.info('先选择一个地点，再进行编辑。')
    return
  }
  managerRef.value?.openEditDialog(activeDetail.value)
}

function openCreateDialog() {
  managerRef.value?.openCreateDialog()
}

function deleteCurrentLocation() {
  if (!activeDetail.value) {
    ElMessage.info('先选择一个地点，再进行删除。')
    return
  }
  managerRef.value?.confirmDelete(activeDetail.value)
}

function scrollToGallery() {
  document.getElementById('memory-gallery')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function formatDate(value?: string) {
  return value ? dayjs(value).format('YYYY.MM.DD') : ''
}

function formatLocation(location?: { province?: string; city?: string }) {
  if (!location) return '未标注地点'
  return [location.province, location.city].filter(Boolean).join(' · ') || '未标注地点'
}

function usePreviewMemories(preferredId?: number | null) {
  previewMode.value = true
  detailCache.value = createDemoTravelMemoryDetailMap()
  locations.value = createDemoTravelMemoryList()

  const nextId = resolveDefaultLocationId(locations.value, preferredId, activeId.value)
  if (nextId != null) {
    activeId.value = nextId
    activeDetail.value = detailCache.value[nextId] || null
    return
  }

  activeId.value = null
  activeDetail.value = null
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

  const latestVisited = [...list]
    .filter((item) => item.visitedAt)
    .sort((left, right) => dayjs(right.visitedAt).valueOf() - dayjs(left.visitedAt).valueOf())[0]

  return latestVisited?.id ?? list[0]?.id ?? null
}

onMounted(async () => {
  await loadSiteConfig().catch(() => null)
  heroBgImage.value = resolveHeroImage(siteConfig.value, 'memory-map', DEFAULT_HERO)
  heroBgPosition.value = resolveHeroImagePosition(siteConfig.value, 'memory-map', DEFAULT_HERO_POSITION)
  await loadMemories()
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

.memory-spread__page--map {
  padding-right: clamp(24px, 2vw, 30px);
}

.memory-spread__page--map::before {
  display: none;
}

.memory-spread__page--detail {
  padding-left: clamp(38px, 3.2vw, 50px);
  background:
    linear-gradient(180deg, rgba(255, 252, 249, 0.42), rgba(255, 246, 242, 0.32));
}

.spread-heading,
.travel-journal__head,
.travel-journal__footer,
.travel-journal__actions,
.gallery-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.spread-heading {
  align-items: flex-start;
  margin-bottom: 22px;
}

.spread-heading__copy {
  display: grid;
  gap: 10px;
  max-width: 34rem;
}

.spread-heading__copy h2 {
  margin: 0;
  color: #4e353e;
  font-family: var(--memory-title-font);
  font-size: clamp(26px, 1.9vw, 34px);
  font-weight: 700;
  line-height: 1.18;
}

.spread-badge,
.panel-caption span {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 999px;
  background: rgba(255, 244, 247, 0.92);
  border: 1px solid rgba(240, 218, 224, 0.92);
  color: #926978;
  font-size: 12px;
}

.spread-badge {
  display: grid;
  align-content: center;
  flex-shrink: 0;
  min-width: 118px;
  text-align: left;
}

.spread-badge strong {
  color: #5a3d47;
  font-size: 14px;
  font-weight: 700;
}

.spread-badge__preview {
  margin-top: 4px;
  color: #c97893;
  font-size: 11px;
  font-style: normal;
  letter-spacing: 0.06em;
}

.spread-map-frame {
  padding: 16px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 250, 248, 0.86), rgba(255, 248, 251, 0.72)),
    radial-gradient(circle at top right, rgba(255, 223, 232, 0.18), transparent 34%);
  border: 1px solid rgba(234, 214, 209, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 14px 28px rgba(220, 191, 197, 0.12);
}

:deep(.travel-map-shell) {
  min-height: 100%;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 254, 252, 0.98), rgba(255, 248, 245, 0.96)),
    url('@/assets/memory-map/paper-texture.svg');
  background-size: auto, 280px 280px;
  border: 1px solid rgba(234, 216, 210, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 18px 32px rgba(214, 188, 190, 0.1);
}

:deep(.travel-map-stage) {
  min-height: 472px;
  padding: 22px 22px 78px;
}

:deep(.travel-map-board) {
  width: 88%;
  margin: 0 auto;
}

:deep(.travel-map-controls) {
  left: 24px;
  bottom: 24px;
}

:deep(.travel-map-control) {
  border-radius: 14px;
}

:deep(.travel-map-legend) {
  right: 22px;
  bottom: 20px;
  background: rgba(255, 252, 251, 0.92);
}

:deep(.travel-map-empty-callout) {
  right: 24px;
  top: 24px;
  border-radius: 20px;
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

.travel-journal__footer {
  align-items: center;
  flex-wrap: wrap;
}

.travel-journal__count {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #8a6674;
  font-size: 13px;
}

.travel-journal__count .el-icon {
  color: #db849f;
}

.detail-link {
  border: none;
  padding: 0;
  background: transparent;
  color: #d07b97;
  font-size: 13px;
  cursor: pointer;
}

.detail-link::after {
  content: ' →';
}

.travel-journal__actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
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
  min-height: 38px;
  width: 100%;
  padding-inline: 14px;
  border-radius: 999px;
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

.journal-state {
  min-height: 620px;
}

.memory-panel--gallery {
  overflow: hidden;
  padding: clamp(22px, 1.8vw, 26px);
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-heading__copy {
  display: grid;
  gap: 10px;
  max-width: 34rem;
}

.panel-heading__title {
  display: grid;
  gap: 4px;
}

.panel-heading__copy h2 {
  margin: 0;
  color: #4e353e;
  font-family: var(--memory-title-font);
  font-size: clamp(24px, 1.7vw, 30px);
  font-weight: 700;
  line-height: 1.16;
}

.panel-heading__copy p {
  margin: 0;
  color: #8d6c79;
  font-size: 13px;
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
  grid-auto-flow: column;
  grid-auto-columns: minmax(236px, 260px);
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.gallery-swiper {
  padding: 4px 22px 10px 4px;
}

.gallery-swiper :deep(.swiper-slide) {
  height: auto;
}

.gallery-swiper :deep(.swiper-button-prev),
.gallery-swiper :deep(.swiper-button-next) {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(237, 220, 227, 0.92);
  color: #c07190;
  box-shadow: 0 12px 24px rgba(226, 190, 201, 0.18);
}

.gallery-swiper :deep(.swiper-button-prev::after),
.gallery-swiper :deep(.swiper-button-next::after) {
  font-size: 15px;
  font-weight: 700;
}

.gallery-card {
  position: relative;
  width: 100%;
  padding: 0;
  border-radius: 22px;
  border: 1px solid rgba(238, 223, 229, 0.9);
  background: rgba(255, 255, 255, 0.98);
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
}

.gallery-card:hover,
.gallery-card.is-active {
  transform: translateY(-3px);
  border-color: rgba(240, 173, 195, 0.94);
  box-shadow: 0 18px 32px rgba(226, 189, 200, 0.18);
}

.gallery-card__cover {
  height: 118px;
  background: linear-gradient(135deg, #fff0f5, #f5f8ff);
}

.gallery-card__cover img {
  width: 100%;
  height: 100%;
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
  padding: 14px 16px 18px;
}

.gallery-card__body h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.4;
}

.gallery-card__meta {
  align-items: center;
}

.gallery-card__meta span {
  color: var(--text-tertiary);
  font-size: 12px;
}

.gallery-card__meta strong {
  color: #c17895;
  font-size: 12px;
  font-weight: 600;
}

.gallery-card::after {
  content: '✿';
  position: absolute;
  right: 12px;
  bottom: 10px;
  color: rgba(221, 147, 172, 0.42);
  font-size: 14px;
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

  .spread-heading,
  .travel-journal__head,
  .travel-journal__footer,
  .panel-heading {
    flex-direction: column;
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

  .spread-map-frame {
    padding: 12px;
    border-radius: 20px;
  }

  :deep(.travel-map-stage) {
    min-height: 408px;
    padding: 18px 18px 72px;
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
    grid-template-columns: 1fr;
    justify-content: flex-start;
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
}
</style>
