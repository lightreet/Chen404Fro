<template>
  <div class="travel-detail-page">
    <header class="detail-top-dock">
      <div class="detail-dock-row">
        <button type="button" class="detail-back-link" @click="goToMap">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </button>
      </div>
    </header>

    <div v-if="loading" class="detail-loading">
      <el-skeleton :rows="14" animated />
    </div>

    <section v-else-if="detail" class="travel-detail-shell">
      <article class="detail-hero-cover">
        <img v-if="heroImage" :src="heroImage" :alt="detail.title" />
        <div v-else class="detail-hero-cover__empty">等待封面照片</div>

        <div class="detail-hero-cover__content">
          <div class="detail-hero-cover__meta">
            <span v-if="locationText">
              <el-icon><Location /></el-icon>
              {{ locationText }}
            </span>
            <span v-if="visitDate">
              <el-icon><Calendar /></el-icon>
              {{ visitDate }}
            </span>
          </div>
          <h1>{{ detail.title }}</h1>
          <p>{{ journalQuote }}</p>
        </div>
      </article>

      <main class="travel-detail-main" aria-label="旅行游记正文">
        <section class="detail-story-list" aria-label="旅行片段">
          <div class="story-list-head">
            <span class="story-list-head__eyebrow">旅途展开</span>
            <div class="story-list-head__copy">
              <h2>旅行片段</h2>
              <p>把照片、时间和当时的心情按顺序翻开，这一趟的节奏会更清楚。</p>
            </div>
          </div>

          <article
            v-for="(stop, index) in storyStops"
            :id="`travel-stop-${index}`"
            :key="stop.id || `scene-${index}`"
            class="detail-story-card"
          >
            <div class="detail-story-card__head">
              <span class="detail-story-card__index">{{ String(index + 1).padStart(2, '0') }}</span>
              <div>
                <h3>{{ stop.title }}</h3>
                <p>
                  <el-icon><Calendar /></el-icon>
                  {{ stopDateText(stop) || visitDate || '旅行片段' }}
                  <template v-if="stop.entries.length"> · {{ stop.entries.length }} 张照片</template>
                </p>
              </div>
            </div>

            <p class="detail-story-card__note">{{ stop.storyNote?.trim() || stopSceneSummary(stop) }}</p>

            <el-tooltip
              effect="light"
              placement="top"
              :show-after="120"
              popper-class="travel-photo-tooltip"
              :disabled="!hasPhotoDescription(stopCoverEntry(stop))"
            >
              <figure class="detail-story-card__cover">
                <img
                  v-if="stopCoverEntry(stop)?.imageUrl"
                  :src="stopCoverEntry(stop)?.imageUrl"
                  :alt="photoTooltipTitle(stopCoverEntry(stop), stop.title)"
                />
                <div v-else class="detail-story-card__empty">暂无片段照片</div>
              </figure>
              <template #content>
                <div class="travel-photo-tooltip__title">
                  {{ photoTooltipTitle(stopCoverEntry(stop), stop.title) }}
                </div>
                <p v-if="photoTooltipNote(stopCoverEntry(stop))" class="travel-photo-tooltip__note">
                  {{ photoTooltipNote(stopCoverEntry(stop)) }}
                </p>
              </template>
            </el-tooltip>

            <div v-if="stopThumbnailEntries(stop).length" class="detail-story-card__thumbs">
              <el-tooltip
                v-for="entry in stopThumbnailEntries(stop).slice(0, 4)"
                :key="entry.id || entry.imageUrl"
                effect="light"
                placement="top"
                :show-after="120"
                popper-class="travel-photo-tooltip"
                :disabled="!hasPhotoDescription(entry)"
              >
                <button
                  type="button"
                  class="detail-thumb"
                  :aria-label="photoTooltipTitle(entry, stop.title)"
                  @click="focusEntry(entry)"
                >
                  <img :src="entry.imageUrl" :alt="photoTooltipTitle(entry, stop.title)" />
                </button>
                <template #content>
                  <div class="travel-photo-tooltip__title">{{ photoTooltipTitle(entry, stop.title) }}</div>
                  <p v-if="photoTooltipNote(entry)" class="travel-photo-tooltip__note">{{ photoTooltipNote(entry) }}</p>
                </template>
              </el-tooltip>
            </div>
          </article>
        </section>
      </main>

      <aside class="travel-detail-rail" aria-label="旅行辅助信息">
        <section class="detail-card overview-card" aria-label="地点与旅程概览">
          <div class="overview-card__topline">
            <span class="detail-card__eyebrow">旅行地点</span>
            <div class="overview-card__seal">
              <span>旅行邮戳</span>
              <strong>{{ stampLabel }}</strong>
            </div>
          </div>
          <h2>{{ locationText || detail.title }}</h2>
          <p class="overview-card__date">{{ visitDate || '暂未记录' }}</p>
          <div class="overview-card__facts" aria-label="旅程概览">
            <article class="overview-card__fact">
              <span>片段</span>
              <strong>{{ storyStops.length }}</strong>
            </article>
            <article class="overview-card__fact">
              <span>照片</span>
              <strong>{{ allEntries.length }}</strong>
            </article>
            <article class="overview-card__fact">
              <span>天数</span>
              <strong>{{ durationNumber }}</strong>
            </article>
          </div>
        </section>

        <nav class="detail-card fragment-card" aria-label="片段目录">
          <div class="detail-card__head">
            <h2>片段目录</h2>
            <span>{{ storyStops.length.toString().padStart(2, '0') }}</span>
          </div>
          <a
            v-for="(stop, index) in storyStops"
            :key="stop.id || `catalog-${index}`"
            class="fragment-link"
            :class="{ 'is-active': index === activeStopIndex }"
            :href="`#travel-stop-${index}`"
            :aria-current="index === activeStopIndex ? 'location' : undefined"
            @click="activeStopIndex = index"
          >
            <b>{{ String(index + 1).padStart(2, '0') }}</b>
            <span>
              <strong>{{ stop.title }}</strong>
              <small>{{ stopDateText(stop) || visitDate || '未记录日期' }}</small>
            </span>
          </a>
        </nav>

        <section class="detail-card mini-map-card">
          <div class="detail-card__head">
            <h2>地图位置</h2>
            <el-icon><MapLocation /></el-icon>
          </div>
          <div
            class="mini-map-card__canvas"
            :class="{ 'has-amap': showAmap, 'has-error': amapErrorText }"
            aria-label="高德地图定位"
          >
            <div ref="amapContainerRef" class="mini-map-card__amap"></div>
            <div v-if="amapErrorText" class="mini-map-card__fallback">
              <el-icon><MapLocation /></el-icon>
              <strong>{{ detail.city || detail.province || '旅行坐标' }}</strong>
              <small>{{ amapErrorText }}</small>
            </div>
          </div>
          <p class="mini-map-card__coord">
            <span>坐标</span>
            {{ coordinateText }}
          </p>
        </section>

        <section class="detail-card album-card">
          <div class="detail-card__head">
            <h2>旅行相册</h2>
            <span>共 {{ allEntries.length }} 张</span>
          </div>
          <div v-if="allEntries.length" class="album-grid">
            <el-tooltip
              v-for="entry in allEntries.slice(0, 9)"
              :key="entry.id || entry.imageUrl"
              effect="light"
              placement="top"
              :show-after="120"
              popper-class="travel-photo-tooltip"
              :disabled="!hasPhotoDescription(entry)"
            >
              <button
                type="button"
                class="album-grid__item"
                :aria-label="photoTooltipTitle(entry, detail.title)"
                @click="focusEntry(entry)"
              >
                <img :src="entry.imageUrl" :alt="photoTooltipTitle(entry, detail.title)" />
              </button>
              <template #content>
                <div class="travel-photo-tooltip__title">{{ photoTooltipTitle(entry, detail.title) }}</div>
                <p v-if="photoTooltipNote(entry)" class="travel-photo-tooltip__note">{{ photoTooltipNote(entry) }}</p>
              </template>
            </el-tooltip>
          </div>
          <p v-else class="album-card__empty">这篇游记还没有公开照片。</p>
        </section>
      </aside>

      <nav class="detail-memory-nav" aria-label="上一篇和下一篇游记">
        <button
          type="button"
          class="detail-memory-nav__item is-prev"
          :disabled="!previousMemory"
          @click="previousMemory && goToMemory(previousMemory.id)"
        >
          <span>
            <el-icon><ArrowLeft /></el-icon>
            上一篇游记
          </span>
          <strong>{{ previousMemory?.title || '已经是第一篇' }}</strong>
        </button>
        <button
          type="button"
          class="detail-memory-nav__item is-next"
          :disabled="!nextMemory"
          @click="nextMemory && goToMemory(nextMemory.id)"
        >
          <span>
            下一篇游记
            <el-icon><ArrowRight /></el-icon>
          </span>
          <strong>{{ nextMemory?.title || '已经是最后一篇' }}</strong>
        </button>
      </nav>
    </section>

    <section v-else class="travel-detail-empty">
      <p>{{ errorMessage }}</p>
      <el-button type="primary" @click="goToMap">返回旅行地图</el-button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Calendar, Location, MapLocation } from '@element-plus/icons-vue'
import { getTravelMemories, getTravelMemoryDetail } from '@/api/travel-memory'
import { useSiteConfig } from '@/composables/useSiteConfig'
import type { TravelMemoryEntry, TravelMemoryLocationDetail, TravelMemoryLocationListItem, TravelMemoryStop } from '@/types'
import { getAmapUnavailableReason, loadAmap } from '@/utils/amap'
import { wgs84ToGcj02 } from '@/utils/coordinate'
import { applySiteMeta, resolveSeoDescription } from '@/utils/siteConfig'

const route = useRoute()
const router = useRouter()
const { siteConfig, loadSiteConfig } = useSiteConfig()

const loading = ref(false)
const detail = ref<TravelMemoryLocationDetail | null>(null)
const memories = ref<TravelMemoryLocationListItem[]>([])
const activeStopIndex = ref(0)
const amapContainerRef = ref<HTMLElement | null>(null)
const amapInstance = shallowRef<any | null>(null)
const amapMarker = shallowRef<any | null>(null)
const amapErrorText = ref('')
const errorMessage = ref('这篇旅行游记不存在或暂时无法查看。')
let storyStopObserver: IntersectionObserver | null = null

const storyStops = computed<TravelMemoryStop[]>(() => {
  if (!detail.value) return []
  if (detail.value.stops?.length) {
    return detail.value.stops
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((stop, index) => ({
        ...stop,
        entries: (stop.entries || [])
          .slice()
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
        sortOrder: stop.sortOrder ?? index,
      }))
  }

  const fallbackEntries = (detail.value.entries || [])
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))

  if (!fallbackEntries.length) return []

  return [
    {
      title: detail.value.title || '旅行片段',
      storyNote: detail.value.summaryNote || '',
      coverImage: detail.value.coverImage,
      visitedAt: detail.value.visitedAt,
      latitude: detail.value.latitude,
      longitude: detail.value.longitude,
      sortOrder: 0,
      entryCount: fallbackEntries.length,
      entries: fallbackEntries,
    },
  ]
})

const allEntries = computed<TravelMemoryEntry[]>(() => {
  const seen = new Set<string>()
  const entries = [...storyStops.value.flatMap((stop) => stop.entries), ...(detail.value?.entries || [])]
  return entries
    .filter((entry) => {
      const key = String(entry.id ?? entry.imageUrl)
      if (seen.has(key)) return false
      seen.add(key)
      return Boolean(entry.imageUrl)
    })
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
})

const coverEntry = computed<TravelMemoryEntry | null>(() => {
  return allEntries.value.find((entry) => entry.cover) || allEntries.value[0] || null
})

const heroImage = computed(() => detail.value?.coverImage || coverEntry.value?.imageUrl || '')
const locationText = computed(() => formatLocation(detail.value))
const visitDate = computed(() => formatDateRange(detail.value?.visitedAt, detail.value?.visitedEndAt))
const stampLabel = computed(() => detail.value?.city || detail.value?.province || detail.value?.title || '旅行')
const journalQuote = computed(() => {
  const summary = detail.value?.summaryNote?.trim()
  if (summary) return summary
  const coverNote = coverEntry.value?.thanksNote?.trim()
  if (coverNote) return coverNote
  const firstNote = allEntries.value[0]?.thanksNote?.trim()
  return firstNote || '风把旅途吹得很轻，阳光、街道和傍晚都像在慢慢发亮。'
})

const sortedMemories = computed(() => {
  return memories.value
    .slice()
    .sort((a, b) => {
      const timeA = dayjs(a.visitedAt || '').valueOf() || 0
      const timeB = dayjs(b.visitedAt || '').valueOf() || 0
      if (timeA !== timeB) return timeB - timeA
      return b.id - a.id
    })
})

const currentMemoryIndex = computed(() => {
  if (!detail.value) return -1
  return sortedMemories.value.findIndex((item) => item.id === detail.value?.id)
})

const previousMemory = computed(() => {
  const index = currentMemoryIndex.value
  return index > 0 ? sortedMemories.value[index - 1] : null
})

const nextMemory = computed(() => {
  const index = currentMemoryIndex.value
  return index >= 0 && index < sortedMemories.value.length - 1 ? sortedMemories.value[index + 1] : null
})

const durationNumber = computed(() => {
  const start = detail.value?.visitedAt
  const end = detail.value?.visitedEndAt || start
  if (!start || !end) return 1
  const days = dayjs(end).startOf('day').diff(dayjs(start).startOf('day'), 'day') + 1
  return Number.isFinite(days) && days > 0 ? days : 1
})

const coordinateText = computed(() => {
  if (detail.value?.latitude == null || detail.value?.longitude == null) return '暂未记录精确坐标'
  return `${Number(detail.value.latitude).toFixed(4)}, ${Number(detail.value.longitude).toFixed(4)}`
})

const amapCoordinate = computed(() => {
  const latitude = detail.value?.latitude
  const longitude = detail.value?.longitude
  if (latitude == null || longitude == null) return null
  return wgs84ToGcj02(Number(latitude), Number(longitude))
})

const showAmap = computed(() => Boolean(amapCoordinate.value && !amapErrorText.value))

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

function formatLocation(location?: { province?: string; city?: string } | null) {
  if (!location) return ''
  return [location.province, location.city].filter(Boolean).join(' · ')
}

function stopCoverEntry(stop: TravelMemoryStop) {
  return stop.entries.find((entry) => entry.stopCover) || stop.entries.find((entry) => entry.cover) || stop.entries[0] || null
}

function isSameEntry(a: TravelMemoryEntry | null | undefined, b: TravelMemoryEntry | null | undefined) {
  if (!a || !b) return false
  if (a.id != null && b.id != null && a.id === b.id) return true
  return Boolean(a.imageUrl && b.imageUrl && a.imageUrl === b.imageUrl)
}

function stopThumbnailEntries(stop: TravelMemoryStop) {
  const cover = stopCoverEntry(stop)
  return stop.entries.filter((entry) => !isSameEntry(entry, cover))
}

function stopDateText(stop: TravelMemoryStop) {
  return formatDate(stop.visitedAt)
}

function stopSceneSummary(stop: TravelMemoryStop) {
  const cover = stopCoverEntry(stop)
  return cover?.thanksNote?.trim() || cover?.remark?.trim() || journalQuote.value
}

function photoTooltipTitle(entry: TravelMemoryEntry | null | undefined, fallback: string) {
  return entry?.remark?.trim() || fallback
}

function photoTooltipNote(entry: TravelMemoryEntry | null | undefined) {
  return entry?.thanksNote?.trim() || ''
}

function hasPhotoDescription(entry: TravelMemoryEntry | null | undefined) {
  return Boolean(entry?.remark?.trim() || entry?.thanksNote?.trim())
}

function parseStopIndex(id: string) {
  const match = id.match(/travel-stop-(\d+)/)
  if (!match) return -1
  return Number(match[1])
}

function destroyStoryStopObserver() {
  if (!storyStopObserver) return
  storyStopObserver.disconnect()
  storyStopObserver = null
}

async function bindStoryStopObserver() {
  destroyStoryStopObserver()
  await nextTick()

  const sections = Array.from(document.querySelectorAll<HTMLElement>('[id^="travel-stop-"]'))
  if (!sections.length) {
    activeStopIndex.value = 0
    return
  }

  const visibleRatios = new Map<number, number>()
  const updateActiveStop = () => {
    if (visibleRatios.size) {
      activeStopIndex.value = [...visibleRatios.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]
      return
    }

    const closest = sections
      .map((section) => ({
        index: parseStopIndex(section.id),
        distance: Math.abs(section.getBoundingClientRect().top - 148),
      }))
      .filter((item) => item.index >= 0)
      .sort((a, b) => a.distance - b.distance)[0]

    if (closest) {
      activeStopIndex.value = closest.index
    }
  }

  storyStopObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const index = parseStopIndex((entry.target as HTMLElement).id)
        if (index < 0) continue
        if (entry.isIntersecting) {
          visibleRatios.set(index, entry.intersectionRatio)
        } else {
          visibleRatios.delete(index)
        }
      }
      updateActiveStop()
    },
    {
      rootMargin: '-120px 0px -52% 0px',
      threshold: [0.16, 0.38, 0.65, 0.9],
    },
  )

  for (const section of sections) {
    storyStopObserver.observe(section)
  }

  updateActiveStop()
}

function focusEntry(entry: TravelMemoryEntry) {
  const stopIndex = storyStops.value.findIndex((stop) =>
    stop.entries.some((item) => item === entry || item.id === entry.id || item.imageUrl === entry.imageUrl),
  )
  if (stopIndex >= 0) {
    activeStopIndex.value = stopIndex
    document.querySelector(`#travel-stop-${stopIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function applyDetailMeta() {
  if (!detail.value) return
  applySiteMeta(
    siteConfig.value,
    `${detail.value.title} - 旅行游记`,
    detail.value.summaryNote?.trim() || resolveSeoDescription(siteConfig.value),
  )
}

async function loadDetail() {
  const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  const numericId = Number(rawId)
  if (!Number.isFinite(numericId)) {
    detail.value = null
    errorMessage.value = '这篇旅行游记不存在或暂时无法查看。'
    return
  }

  loading.value = true
  activeStopIndex.value = 0
  errorMessage.value = '这篇旅行游记不存在或暂时无法查看。'
  try {
    const [, detailResult, memoryList] = await Promise.all([
      loadSiteConfig().catch(() => null),
      getTravelMemoryDetail(numericId),
      getTravelMemories().catch(() => []),
    ])
    detail.value = detailResult
    memories.value = memoryList
    applyDetailMeta()
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
}

function goToMap() {
  router.push('/memory-map')
}

function destroyMiniAmap() {
  amapMarker.value = null
  if (amapInstance.value?.destroy) {
    amapInstance.value.destroy()
  }
  amapInstance.value = null
}

async function renderMiniAmap() {
  const coordinate = amapCoordinate.value
  if (!coordinate) {
    amapErrorText.value = '暂未记录精确坐标'
    destroyMiniAmap()
    return
  }

  await nextTick()
  const container = amapContainerRef.value
  if (!container) return

  try {
    amapErrorText.value = ''
    const AMap = await loadAmap()
    const center = [coordinate.longitude, coordinate.latitude]

    if (!amapInstance.value) {
      amapInstance.value = new AMap.Map(container, {
        resizeEnable: true,
        zoom: 15,
        center,
        mapStyle: 'amap://styles/whitesmoke',
        viewMode: '2D',
        dragEnable: true,
        zoomEnable: true,
        scrollWheel: true,
        doubleClickZoom: true,
      })
    } else {
      amapInstance.value.setZoomAndCenter(15, center)
    }

    if (!amapMarker.value) {
      amapMarker.value = new AMap.Marker({
        position: center,
        title: detail.value?.city || detail.value?.title || '旅行位置',
        offset: new AMap.Pixel(-13, -30),
      })
      amapInstance.value.add(amapMarker.value)
    } else {
      amapMarker.value.setPosition(center)
      amapMarker.value.setTitle(detail.value?.city || detail.value?.title || '旅行位置')
    }
  } catch {
    destroyMiniAmap()
    amapErrorText.value = getAmapUnavailableReason() || '高德地图加载失败'
  }
}

function goToMemory(id: number) {
  router.push({ name: 'TravelMemoryDetail', params: { id } })
}

watch(
  () => route.params.id,
  () => {
    void loadDetail()
  },
)

watch(
  amapCoordinate,
  () => {
    void renderMiniAmap()
  },
  { flush: 'post' },
)

watch(
  () => [detail.value?.id, storyStops.value.length],
  () => {
    activeStopIndex.value = 0
    void bindStoryStopObserver()
  },
  { flush: 'post' },
)

onMounted(() => {
  void loadDetail()
  void renderMiniAmap()
})

onBeforeUnmount(() => {
  destroyStoryStopObserver()
  destroyMiniAmap()
})
</script>

<style scoped lang="scss">
.travel-detail-page {
  --travel-ink: #34262e;
  --travel-body: #615661;
  --travel-muted: #887d88;
  --travel-soft: #9d8d99;
  --travel-accent: #eb739d;
  --travel-accent-strong: #d85d86;
  --travel-border: rgba(210, 196, 205, 0.7);
  --travel-border-strong: rgba(199, 183, 193, 0.9);
  --travel-card: rgba(248, 243, 246, 0.94);
  --travel-card-strong: rgba(253, 249, 251, 0.98);
  --travel-shadow: 0 16px 36px rgba(166, 144, 158, 0.09);

  position: relative;
  min-height: 100vh;
  padding: calc(72px + env(safe-area-inset-top, 0px)) 0 56px;
  color: var(--travel-ink);
  background:
    radial-gradient(circle at 12% 0%, rgba(239, 226, 234, 0.76), transparent 30%),
    radial-gradient(circle at 88% 8%, rgba(233, 232, 240, 0.92), transparent 34%),
    linear-gradient(180deg, #f8f3f6 0%, #f5f0f4 42%, #fbf8fa 100%);

  &::before {
    content: '';
    position: fixed;
    inset: calc(58px + env(safe-area-inset-top, 0px)) 0 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.4;
    background:
      linear-gradient(90deg, transparent 0, rgba(176, 141, 153, 0.018) 1px, transparent 1px) 0 0 / 46px 46px,
      linear-gradient(0deg, transparent 0, rgba(176, 141, 153, 0.014) 1px, transparent 1px) 0 0 / 46px 46px;
  }
}

.detail-top-dock,
.detail-loading,
.travel-detail-shell,
.travel-detail-empty {
  position: relative;
  z-index: 1;
}

.detail-top-dock {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 280;
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
  border-bottom: 1px solid rgba(214, 202, 210, 0.88);
  background: linear-gradient(180deg, rgba(249, 245, 248, 0.94), rgba(243, 238, 243, 0.84));
  box-shadow: 0 10px 24px rgba(166, 146, 157, 0.08);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-sizing: border-box;
}

.detail-dock-row {
  display: flex;
  align-items: center;
  width: min(1360px, calc(100vw - 48px));
  min-height: 52px;
  margin: 0 auto;
}

.detail-back-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  color: #7f737f;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.18s ease, background-color 0.18s ease;

  .el-icon {
    width: 16px;
    height: 16px;
    font-size: 16px;
  }

  &:hover {
    color: #564650;
    background: rgba(235, 115, 157, 0.08);
  }
}

.detail-loading {
  width: min(1360px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 28px;
  border: 1px solid var(--travel-border);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--travel-shadow);
}

.travel-detail-shell {
  display: grid;
  grid-template-areas:
    "hero rail"
    "main rail"
    "pager rail";
  grid-template-columns: minmax(0, 1fr) 300px;
  justify-content: center;
  align-items: start;
  gap: 28px;
  width: min(1360px, calc(100vw - 48px));
  margin: 0 auto;
}

.detail-hero-cover {
  grid-area: hero;
  position: relative;
  overflow: hidden;
  min-height: 460px;
  height: clamp(460px, 44vw, 520px);
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 28px;
  color: #fff;
  background: linear-gradient(135deg, #87626f, #4f3640);
  box-shadow:
    0 22px 48px rgba(86, 56, 68, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.44);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(18, 13, 16, 0.34) 0%, rgba(18, 13, 16, 0.12) 40%, rgba(18, 13, 16, 0.02) 76%, rgba(18, 13, 16, 0.08) 100%),
      linear-gradient(0deg, rgba(20, 14, 18, 0.48) 0%, rgba(20, 14, 18, 0.16) 42%, rgba(20, 14, 18, 0.02) 78%, rgba(20, 14, 18, 0.08) 100%);
  }

  img,
  .detail-hero-cover__empty {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  img {
    object-fit: cover;
    filter: saturate(1.06) brightness(1.02) contrast(1.02);
  }
}

.detail-hero-cover__empty {
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.8);
  background: linear-gradient(135deg, #503741, #9a6c7d);
  font-weight: 700;
  letter-spacing: 0.12em;
}

.detail-hero-cover__content {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: end;
  box-sizing: border-box;
  width: min(580px, 100%);
  min-height: inherit;
  padding: clamp(30px, 3vw, 42px);

  h1 {
    max-width: 9ch;
    margin: 12px 0 0;
    color: #fff;
    font-family: "Microsoft YaHei UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", sans-serif;
    font-size: clamp(42px, 4vw, 58px);
    font-weight: 700;
    line-height: 1.04;
    letter-spacing: -0.01em;
    text-wrap: balance;
    text-shadow: 0 6px 18px rgba(16, 11, 14, 0.18);
  }

  p {
    max-width: 32ch;
    margin: 14px 0 0;
    color: rgba(255, 255, 255, 0.92);
    font-size: 15px;
    font-weight: 500;
    line-height: 1.75;
    text-shadow: 0 4px 14px rgba(16, 11, 14, 0.14);
  }
}

.detail-hero-cover__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 34px;
    padding: 0 12px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 999px;
    color: rgba(255, 255, 255, 0.94);
    background: rgba(255, 255, 255, 0.16);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
    font-size: 13px;
    font-weight: 600;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    .el-icon {
      width: 15px;
      height: 15px;
      font-size: 15px;
    }
  }
}

.travel-detail-main {
  grid-area: main;
  display: grid;
  gap: 24px;
  min-width: 0;
}

.travel-detail-rail {
  grid-area: rail;
  position: sticky;
  top: calc(72px + env(safe-area-inset-top, 0px));
  display: grid;
  gap: 16px;
  align-content: start;
}

.detail-card,
.detail-story-card,
.detail-memory-nav__item {
  border: 1px solid var(--travel-border);
  background: linear-gradient(180deg, var(--travel-card-strong), var(--travel-card));
  box-shadow:
    var(--travel-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.detail-card {
  overflow: hidden;
  padding: 20px;
  border-radius: 22px;
}

.detail-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h2 {
    margin: 0;
    color: var(--travel-ink);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.35;
  }

  > .el-icon {
    width: 18px;
    height: 18px;
    color: #bd8195;
    font-size: 18px;
  }

  > span {
    color: var(--travel-muted);
    font-size: 13px;
    font-weight: 600;
  }
}

.detail-card__eyebrow {
  color: var(--travel-soft);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.overview-card {
  background:
    radial-gradient(circle at 84% 14%, rgba(233, 225, 233, 0.82), transparent 30%),
    linear-gradient(160deg, rgba(252, 248, 250, 0.99), rgba(246, 241, 245, 0.96));
}

.overview-card__topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.overview-card__seal {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border: 1px dashed rgba(240, 111, 157, 0.22);
  border-radius: 999px;
  color: #a36f83;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.96), rgba(255, 247, 250, 0.84));
  box-shadow:
    0 10px 22px rgba(223, 153, 180, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.84);
  text-align: center;

  span {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  strong {
    max-width: 4em;
    font-size: 15px;
    line-height: 1.08;
  }
}

.overview-card h2 {
  margin: 12px 0 0;
  color: var(--travel-ink);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.18;
  text-wrap: balance;
}

.overview-card__date {
  margin: 10px 0 0;
  color: var(--travel-muted);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.6;
}

.overview-card__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.overview-card__fact {
  display: grid;
  gap: 4px;
  min-height: 72px;
  padding: 12px 10px;
  border: 1px solid rgba(212, 194, 204, 0.76);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.62);

  span {
    color: var(--travel-muted);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
  }

  strong {
    color: var(--travel-ink);
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
  }
}

.fragment-card {
  display: grid;
  gap: 8px;
}

.fragment-link {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 10px 12px;
  border-radius: 16px;
  color: var(--travel-body);
  text-decoration: none;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;

  b {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid rgba(240, 111, 157, 0.18);
    border-radius: 999px;
    color: #a86c80;
    background: rgba(255, 255, 255, 0.86);
    box-shadow: 0 6px 12px rgba(220, 138, 170, 0.05);
    font-size: 10px;
    font-weight: 700;
  }

  span {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  strong {
    overflow: hidden;
    color: inherit;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 700;
  }

  small {
    overflow: hidden;
    color: var(--travel-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 500;
  }

  &:hover {
    color: var(--travel-accent-strong);
    background: rgba(248, 241, 245, 0.96);
    transform: translateX(2px);
  }

  &.is-active {
    color: var(--travel-accent-strong);
    background: linear-gradient(90deg, rgba(235, 115, 157, 0.1), rgba(250, 246, 248, 0.94));
    box-shadow: inset 0 0 0 1px rgba(235, 115, 157, 0.12);

    b {
      color: #fff;
      border-color: transparent;
      background: linear-gradient(135deg, var(--travel-accent), #ff8eaf);
      box-shadow: 0 10px 18px rgba(240, 111, 157, 0.18);
    }
  }
}

.story-list-head {
  display: grid;
  gap: 12px;
  max-width: 58ch;
}

.story-list-head__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--travel-accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--travel-accent);
    box-shadow: 0 0 0 6px rgba(240, 111, 157, 0.12);
  }
}

.story-list-head__copy {
  display: grid;
  gap: 8px;

  h2 {
    margin: 0;
    color: var(--travel-ink);
    font-size: clamp(30px, 2.6vw, 36px);
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: -0.01em;
    text-wrap: balance;
  }

  p {
    margin: 0;
    color: var(--travel-muted);
    font-size: 15px;
    line-height: 1.75;
  }
}

.detail-story-list {
  display: grid;
  gap: 22px;
}

.detail-story-card {
  display: grid;
  gap: 18px;
  scroll-margin-top: 112px;
  padding: 28px;
  border-radius: 24px;
}

.detail-story-card__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: flex-start;
  gap: 14px;
  max-width: 74ch;

  h3 {
    margin: 0;
    color: var(--travel-ink);
    font-size: clamp(21px, 1.8vw, 25px);
    font-weight: 700;
    line-height: 1.26;
    letter-spacing: -0.01em;
    text-wrap: balance;
  }

  p {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    margin: 8px 0 0;
    color: var(--travel-muted);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
  }
}

.detail-story-card__index {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, var(--travel-accent), #ff8eaf);
  box-shadow: 0 10px 18px rgba(240, 111, 157, 0.18);
  font-size: 12px;
  font-weight: 700;
}

.detail-story-card__note {
  max-width: 68ch;
  margin: 0;
  color: var(--travel-body);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.85;
}

.detail-story-card__cover {
  overflow: hidden;
  margin: 0;
  aspect-ratio: 16 / 8.2;
  min-height: 280px;
  border-radius: 20px;
  background: linear-gradient(135deg, #fff2f6, #fff8fb);
  box-shadow:
    0 14px 28px rgba(211, 158, 180, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.68) inset;

  img,
  .detail-story-card__empty {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  }

  img {
    object-fit: cover;
  }
}

.detail-hero-cover__empty,
.detail-story-card__empty,
.album-card__empty {
  color: #c47b98;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.detail-story-card__thumbs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.detail-memory-nav__item,
.detail-thumb,
.album-grid__item {
  font: inherit;
  cursor: pointer;
}

.detail-thumb,
.album-grid__item {
  overflow: hidden;
  padding: 0;
  border: 0;
  background: transparent;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.22s ease;
  }

  &:hover img {
    transform: scale(1.04);
  }
}

.detail-thumb {
  aspect-ratio: 1.24;
  border-radius: 14px;
  box-shadow: 0 0 0 1px rgba(240, 111, 157, 0.1) inset;
}

:deep(.travel-photo-tooltip) {
  max-width: 260px;
  border: 1px solid rgba(210, 196, 205, 0.92);
  border-radius: 14px;
  background: rgba(255, 251, 253, 0.96);
  box-shadow: 0 14px 26px rgba(150, 125, 139, 0.14);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  .el-popper__arrow::before {
    border-color: rgba(210, 196, 205, 0.92);
    background: rgba(255, 251, 253, 0.96);
  }
}

.travel-photo-tooltip__title {
  color: var(--travel-ink);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
}

.travel-photo-tooltip__note {
  margin: 6px 0 0;
  color: var(--travel-body);
  font-size: 12px;
  line-height: 1.65;
}

.mini-map-card__canvas {
  position: relative;
  overflow: hidden;
  min-height: 220px;
  margin-top: 16px;
  border: 1px solid rgba(240, 111, 157, 0.12);
  border-radius: 20px;
  background: #f1edf0;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.74) inset,
    0 12px 24px rgba(173, 151, 164, 0.06);
}

.mini-map-card__amap {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.mini-map-card__canvas.has-error .mini-map-card__amap {
  display: none;
}

.mini-map-card__fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 16px;
  color: var(--travel-muted);
  text-align: center;

  .el-icon {
    width: 20px;
    height: 20px;
    color: #cf7f9a;
    font-size: 20px;
  }

  strong {
    color: var(--travel-ink);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.25;
  }

  small {
    font-size: 12px;
    font-weight: 500;
    line-height: 1.6;
  }
}

.mini-map-card__coord {
  display: grid;
  gap: 4px;
  margin: 12px 0 0;
  color: var(--travel-muted);
  font-size: 13px;
  line-height: 1.5;

  span {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.album-grid__item {
  aspect-ratio: 1;
  border-radius: 13px;
  box-shadow: 0 0 0 1px rgba(240, 111, 157, 0.1) inset;
}

.travel-detail-empty {
  display: grid;
  place-items: center;
  gap: 14px;
  min-height: calc(100vh - 200px);
  text-align: center;

  p {
    margin: 0;
    color: var(--travel-muted);
    font-size: 15px;
  }
}

.detail-memory-nav {
  grid-area: pager;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-memory-nav__item {
  display: grid;
  gap: 10px;
  min-height: 96px;
  padding: 18px 20px;
  border-radius: 22px;
  color: var(--travel-ink);
  text-align: left;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;

  span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--travel-muted);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
  }

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.35;
  }

  &:hover:not(:disabled) {
    border-color: var(--travel-border-strong);
    box-shadow:
      0 20px 42px rgba(201, 156, 178, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.84);
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

@media (max-width: 1280px) {
  .detail-dock-row,
  .detail-loading,
  .travel-detail-shell {
    width: min(1040px, calc(100vw - 40px));
  }

  .travel-detail-shell {
    grid-template-areas:
      "hero"
      "main"
      "rail"
      "pager";
    grid-template-columns: 1fr;
    gap: 22px;
  }

  .travel-detail-rail {
    position: static;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fragment-card,
  .album-card {
    grid-column: 1 / -1;
  }

  .detail-hero-cover {
    min-height: 400px;
    height: clamp(400px, 48vw, 520px);
  }
}

@media (max-width: 760px) {
  .travel-detail-page {
    padding-top: calc(64px + env(safe-area-inset-top, 0px));
    padding-bottom: 36px;

    &::before {
      inset: calc(54px + env(safe-area-inset-top, 0px)) 0 0;
    }
  }

  .detail-dock-row,
  .detail-loading,
  .travel-detail-shell {
    width: min(100vw - 20px, 100%);
  }

  .detail-dock-row {
    min-height: 50px;
  }

  .detail-back-link {
    padding: 0 10px;
  }

  .travel-detail-shell {
    gap: 16px;
  }

  .detail-hero-cover {
    min-height: 320px;
    height: clamp(320px, 82vw, 410px);
    border-radius: 24px;
  }

  .detail-hero-cover__content {
    width: min(100%, 360px);
    padding: 22px 18px 24px;

    h1 {
      max-width: 9.5ch;
      font-size: clamp(30px, 8vw, 42px);
      line-height: 1.08;
    }

    p {
      max-width: 28ch;
      font-size: 14px;
      line-height: 1.68;
    }
  }

  .detail-hero-cover__meta {
    gap: 8px;

    span {
      min-height: 32px;
      padding: 0 10px;
      font-size: 12px;
    }
  }

  .detail-card {
    padding: 16px;
    border-radius: 20px;
  }

  .travel-detail-rail {
    grid-template-columns: 1fr;
  }

  .fragment-card,
  .album-card {
    grid-column: auto;
  }

  .overview-card__seal {
    width: 58px;
    height: 58px;
  }

  .overview-card h2 {
    font-size: 22px;
  }

  .overview-card__facts {
    gap: 8px;
  }

  .overview-card__fact {
    min-height: 68px;
    padding: 11px 9px;

    strong {
      font-size: 20px;
    }
  }

  .story-list-head__copy {
    gap: 6px;

    h2 {
      font-size: 28px;
    }

    p {
      font-size: 14px;
      line-height: 1.7;
    }
  }

  .detail-story-card {
    gap: 16px;
    padding: 20px 16px;
    border-radius: 22px;
  }

  .detail-story-card__head {
    gap: 12px;

    h3 {
      font-size: 20px;
    }
  }

  .detail-story-card__index {
    width: 38px;
    height: 38px;
  }

  .detail-story-card__note {
    font-size: 15px;
    line-height: 1.82;
  }

  .detail-story-card__cover {
    aspect-ratio: 4 / 3;
    min-height: 200px;
    border-radius: 18px;
  }

  .detail-story-card__thumbs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mini-map-card__canvas {
    min-height: 176px;
  }

  .detail-memory-nav {
    grid-template-columns: 1fr;
  }

  .detail-memory-nav__item {
    min-height: 86px;
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .detail-back-link,
  .fragment-link,
  .detail-memory-nav__item,
  .detail-thumb img,
  .album-grid__item img {
    transition: none;
  }
}
</style>
