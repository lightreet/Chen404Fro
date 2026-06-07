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
          <div class="detail-hero-cover__facts">
            <span>
              <el-icon><CollectionTag /></el-icon>
              {{ storyStops.length }} 个片段
            </span>
            <span>
              <el-icon><Picture /></el-icon>
              {{ allEntries.length }} 张照片
            </span>
            <span>
              <el-icon><DataLine /></el-icon>
              {{ durationText }}
            </span>
          </div>
        </div>
      </article>

      <main class="travel-detail-main" aria-label="旅行游记正文">
        <section class="detail-story-list" aria-label="旅行片段">
          <div class="story-list-head">
            <span></span>
            <h2>旅行片段</h2>
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

            <figure class="detail-story-card__cover">
              <img
                v-if="stopCoverEntry(stop)?.imageUrl"
                :src="stopCoverEntry(stop)?.imageUrl"
                :alt="stopCoverEntry(stop)?.remark || stop.title"
              />
              <div v-else class="detail-story-card__empty">暂无片段照片</div>
            </figure>

            <div v-if="stopThumbnailEntries(stop).length" class="detail-story-card__thumbs">
              <button
                v-for="entry in stopThumbnailEntries(stop).slice(0, 4)"
                :key="entry.id || entry.imageUrl"
                type="button"
                class="detail-thumb"
                :aria-label="entry.remark || stop.title"
                @click="focusEntry(entry)"
              >
                <img :src="entry.imageUrl" :alt="entry.remark || stop.title" />
              </button>
            </div>
          </article>
        </section>

        <section class="detail-route-panel">
          <div class="section-head">
            <div>
              <h2>这趟路的节奏</h2>
              <p>把片段按时间轻轻串起来，方便回望这段旅程。</p>
            </div>
            <strong>共 {{ storyStops.length }} 段</strong>
          </div>
          <div class="detail-route">
            <article
              v-for="(stop, index) in storyStops"
              :key="stop.id || `route-${index}`"
              class="detail-route-step"
              :style="{ '--route-tone': routeTones[index % routeTones.length] }"
            >
              <b>{{ String(index + 1).padStart(2, '0') }}</b>
              <h3>{{ stop.title }}</h3>
              <p>{{ stop.storyNote?.trim() || stopSceneSummary(stop) }}</p>
            </article>
          </div>
        </section>

        <section class="detail-quote-card">
          <p>{{ journalQuote }}</p>
        </section>
      </main>

      <aside class="travel-detail-sidebar travel-detail-sidebar--left" aria-label="旅行信息">
        <section class="detail-card location-card">
          <span class="detail-card__eyebrow">旅行地点</span>
          <h2>{{ locationText || detail.title }}</h2>
          <p>{{ journalQuote }}</p>
          <div class="location-card__stamp">
            <span>旅行邮戳</span>
            <strong>{{ stampLabel }}</strong>
          </div>
        </section>

        <section class="detail-card info-card">
          <div class="detail-card__head">
            <h2>旅行信息</h2>
            <el-icon><Calendar /></el-icon>
          </div>
          <dl class="detail-info-list">
            <div>
              <el-icon class="detail-info-list__icon"><MapLocation /></el-icon>
              <dt>省份</dt>
              <dd>{{ detail.province || '暂未记录' }}</dd>
            </div>
            <div>
              <el-icon class="detail-info-list__icon"><Location /></el-icon>
              <dt>城市</dt>
              <dd>{{ detail.city || '暂未记录' }}</dd>
            </div>
            <div>
              <el-icon class="detail-info-list__icon"><Calendar /></el-icon>
              <dt>旅行时间</dt>
              <dd>{{ visitDate || '暂未记录' }}</dd>
            </div>
            <div>
              <el-icon class="detail-info-list__icon"><Picture /></el-icon>
              <dt>照片数量</dt>
              <dd>{{ allEntries.length }} 张</dd>
            </div>
          </dl>
        </section>

        <section class="detail-card mood-card">
          <div class="detail-card__head">
            <h2>旅行心情</h2>
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <blockquote>{{ coverEntry?.thanksNote?.trim() || journalQuote }}</blockquote>
          <span class="mood-card__note">{{ updatedText }}</span>
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
            :class="{ 'is-active': index === 0 }"
            :href="`#travel-stop-${index}`"
          >
            <b>{{ String(index + 1).padStart(2, '0') }}</b>
            <span>
              <strong>{{ stop.title }}</strong>
              <small>{{ stopDateText(stop) || visitDate || '未记录日期' }}</small>
            </span>
          </a>
        </nav>
      </aside>

      <aside class="travel-detail-sidebar travel-detail-sidebar--right" aria-label="旅行辅助信息">
        <section class="detail-card mini-map-card">
          <div class="detail-card__head">
            <h2>地图位置</h2>
            <el-icon><MapLocation /></el-icon>
          </div>
          <div
            class="mini-map-card__canvas"
            :class="{ 'has-static-map': showStaticMap }"
          >
            <img
              v-if="showStaticMap"
              class="mini-map-card__image"
              :src="staticMapImage"
              :alt="`${detail.city || detail.province || detail.title} 地图位置`"
              @error="staticMapFailed = true"
            />
            <span class="mini-map-card__road mini-map-card__road--main" aria-hidden="true"></span>
            <span class="mini-map-card__road mini-map-card__road--river" aria-hidden="true"></span>
            <span class="mini-map-card__block mini-map-card__block--one" aria-hidden="true"></span>
            <span class="mini-map-card__block mini-map-card__block--two" aria-hidden="true"></span>
            <span class="mini-map-card__pin" aria-hidden="true"></span>
            <div class="mini-map-card__label">
              <strong>{{ detail.city || detail.province || '旅行坐标' }}</strong>
              <small>{{ locationText || coordinateText }}</small>
            </div>
          </div>
          <p class="mini-map-card__coord">{{ coordinateText }}</p>
          <button type="button" class="mini-map-card__link" @click="goToMap">
            在地图上查看
            <el-icon><ArrowRight /></el-icon>
          </button>
        </section>

        <section class="detail-card album-card">
          <div class="detail-card__head">
            <h2>旅行相册</h2>
            <span>共 {{ allEntries.length }} 张</span>
          </div>
          <div v-if="allEntries.length" class="album-grid">
            <button
              v-for="entry in allEntries.slice(0, 9)"
              :key="entry.id || entry.imageUrl"
              type="button"
              class="album-grid__item"
              :aria-label="entry.remark || detail.title"
              @click="focusEntry(entry)"
            >
              <img :src="entry.imageUrl" :alt="entry.remark || detail.title" />
            </button>
          </div>
          <p v-else class="album-card__empty">这篇游记还没有公开照片。</p>
        </section>

        <section class="detail-card stats-card">
          <div class="detail-card__head">
            <h2>记录统计</h2>
            <el-icon><DataLine /></el-icon>
          </div>
          <div class="stats-grid">
            <div class="stats-item stats-item--stops">
              <el-icon><CollectionTag /></el-icon>
              <div class="stats-item__copy">
                <span class="stats-item__label">片段数量</span>
                <small>整理出的旅行片段</small>
              </div>
              <div class="stats-item__value">
                <strong>{{ storyStops.length }}</strong>
              </div>
            </div>
            <div class="stats-item stats-item--photos">
              <el-icon><Picture /></el-icon>
              <div class="stats-item__copy">
                <span class="stats-item__label">照片数量</span>
                <small>公开在游记里的照片</small>
              </div>
              <div class="stats-item__value">
                <strong>{{ allEntries.length }}</strong>
              </div>
            </div>
            <div class="stats-item stats-item--days">
              <el-icon><Calendar /></el-icon>
              <div class="stats-item__copy">
                <span class="stats-item__label">旅行天数</span>
                <small>从开始到结束的天数</small>
              </div>
              <div class="stats-item__value">
                <strong>{{ durationNumber }}</strong>
              </div>
            </div>
            <div class="stats-item stats-item--index">
              <el-icon><DataLine /></el-icon>
              <div class="stats-item__copy">
                <span class="stats-item__label">游记序号</span>
                <small>当前所在的游记位置</small>
              </div>
              <div class="stats-item__value">
                <strong>{{ memoryIndexText }}</strong>
              </div>
            </div>
          </div>
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
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChatDotRound,
  CollectionTag,
  DataLine,
  Location,
  MapLocation,
  Picture,
} from '@element-plus/icons-vue'
import { getTravelMemories, getTravelMemoryDetail } from '@/api/travel-memory'
import { useSiteConfig } from '@/composables/useSiteConfig'
import type { TravelMemoryEntry, TravelMemoryLocationDetail, TravelMemoryLocationListItem, TravelMemoryStop } from '@/types'
import { wgs84ToGcj02 } from '@/utils/coordinate'
import { applySiteMeta, resolveSeoDescription } from '@/utils/siteConfig'

const route = useRoute()
const router = useRouter()
const { siteConfig, loadSiteConfig } = useSiteConfig()

const loading = ref(false)
const detail = ref<TravelMemoryLocationDetail | null>(null)
const memories = ref<TravelMemoryLocationListItem[]>([])
const staticMapFailed = ref(false)
const errorMessage = ref('这篇旅行游记不存在或暂时无法查看。')
const routeTones = [
  'rgba(255, 234, 242, 0.68)',
  'rgba(255, 239, 246, 0.62)',
  'rgba(255, 243, 229, 0.64)',
  'rgba(250, 238, 255, 0.58)',
]

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

const durationText = computed(() => `${durationNumber.value} 天行程`)
const coordinateText = computed(() => {
  if (detail.value?.latitude == null || detail.value?.longitude == null) return '暂未记录精确坐标'
  return `${Number(detail.value.latitude).toFixed(4)}, ${Number(detail.value.longitude).toFixed(4)}`
})
const staticMapImage = computed(() => {
  const key = (import.meta.env.VITE_AMAP_KEY || '').trim()
  const latitude = detail.value?.latitude
  const longitude = detail.value?.longitude
  if (!key || latitude == null || longitude == null) return ''

  const coordinate = wgs84ToGcj02(Number(latitude), Number(longitude))
  const center = `${coordinate.longitude.toFixed(6)},${coordinate.latitude.toFixed(6)}`
  const params = new URLSearchParams({
    key,
    location: center,
    zoom: '12',
    size: '520*300',
    scale: '2',
    markers: `mid,,A:${center}`,
  })
  return `https://restapi.amap.com/v3/staticmap?${params.toString()}`
})
const showStaticMap = computed(() => Boolean(staticMapImage.value && !staticMapFailed.value))
const updatedText = computed(() => {
  const updateTime = formatDate(detail.value?.updateTime)
  const createTime = formatDate(detail.value?.createTime)
  if (updateTime) return `最后整理于 ${updateTime}`
  if (createTime) return `创建于 ${createTime}`
  return '这一段还停在记忆最柔软的地方'
})
const memoryIndexText = computed(() => {
  const index = currentMemoryIndex.value
  if (index < 0) return '-'
  return `${index + 1}/${sortedMemories.value.length}`
})

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

function focusEntry(entry: TravelMemoryEntry) {
  const stopIndex = storyStops.value.findIndex((stop) =>
    stop.entries.some((item) => item === entry || item.id === entry.id || item.imageUrl === entry.imageUrl),
  )
  if (stopIndex >= 0) {
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

function goToMemory(id: number) {
  router.push({ name: 'TravelMemoryDetail', params: { id } })
}

watch(
  () => route.params.id,
  () => {
    void loadDetail()
  },
)

watch(staticMapImage, () => {
  staticMapFailed.value = false
})

onMounted(() => {
  void loadDetail()
})
</script>

<style scoped lang="scss">
.travel-detail-page {
  min-height: 100vh;
  padding: calc(64px + env(safe-area-inset-top, 0px)) 0 64px;
  color: #2f2530;
  background:
    radial-gradient(circle at 12% 0%, rgba(255, 231, 240, 0.36), transparent 24%),
    radial-gradient(circle at 88% 12%, rgba(255, 246, 250, 0.5), transparent 30%),
    linear-gradient(180deg, #fffafc 0%, #fff8fb 48%, #fff6f9 100%);
}

.detail-top-dock {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 300;
  border-bottom: 1px solid var(--border-color, #e3e5e7);
  background: #ffffff;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.65) inset,
    0 10px 32px rgba(15, 23, 42, 0.06);
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
  box-sizing: border-box;
}

.detail-dock-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 48px;
  padding: 0 20px;
}

.mini-map-card__link,
.detail-memory-nav__item,
.detail-thumb,
.album-grid__item {
  font: inherit;
  cursor: pointer;
}

.detail-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: none;
  color: var(--text-secondary, #666666);
  background: none;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: var(--primary, #fb7299);
  }
}

.detail-loading {
  width: min(1440px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 28px;
  border: 1px solid rgba(251, 114, 153, 0.14);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.94);
}

.travel-detail-shell {
  display: grid;
  grid-template-areas:
    "left hero right"
    "left main right"
    "left pager right";
  grid-template-columns: minmax(190px, 236px) minmax(0, 1fr) minmax(220px, 286px);
  align-items: start;
  gap: clamp(18px, 2vw, 28px);
  width: min(1480px, calc(100vw - 48px));
  margin: 0 auto;
}

.travel-detail-main {
  grid-area: main;
  display: grid;
  gap: 22px;
  min-width: 0;
}

.travel-detail-sidebar {
  position: sticky;
  top: calc(72px + env(safe-area-inset-top, 0px));
  display: grid;
  gap: 12px;
}

.travel-detail-sidebar--left {
  grid-area: left;
}

.travel-detail-sidebar--right {
  grid-area: right;
}

.detail-card,
.detail-quote-card,
.detail-memory-nav__item {
  border: 1px solid rgba(251, 114, 153, 0.16);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 26px rgba(251, 114, 153, 0.045);
}

.detail-card {
  overflow: hidden;
  padding: 16px;
  border-radius: 18px;
}

.detail-card__eyebrow,
.section-head span,
.story-list-head span,
.detail-quote-card span {
  color: #9a707c;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.detail-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #7a6870;

  h2 {
    margin: 0;
    color: #2f2530;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.35;
  }
}

.detail-hero-cover {
  grid-area: hero;
  position: relative;
  overflow: hidden;
  min-height: clamp(540px, 54vw, 700px);
  border-radius: 30px;
  color: #fff;
  background: linear-gradient(135deg, #8d6a75, #4b303a);
  box-shadow: 0 18px 42px rgba(74, 43, 55, 0.12);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(24, 15, 19, 0.1) 0%, rgba(24, 15, 19, 0.03) 44%, transparent 82%),
      linear-gradient(0deg, rgba(23, 15, 19, 0.38) 0%, rgba(23, 15, 19, 0.14) 34%, rgba(23, 15, 19, 0.01) 72%, rgba(23, 15, 19, 0.03) 100%);
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
    filter: saturate(1.08) brightness(1.04) contrast(1.02);
  }
}

.detail-hero-cover__empty {
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.78);
  background: linear-gradient(135deg, #4d3441, #9f6b7b);
  font-weight: 700;
  letter-spacing: 0.14em;
}

.detail-hero-cover__content {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: end;
  box-sizing: border-box;
  width: min(680px, 100%);
  min-height: inherit;
  padding: clamp(32px, 5vw, 64px);

  h1 {
    max-width: 13em;
    margin: 14px 0 0;
    color: #fff;
    font-family: "Microsoft YaHei UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", sans-serif;
    font-size: clamp(38px, 3.6vw, 52px);
    font-weight: 700;
    line-height: 1.16;
    text-shadow: 0 4px 12px rgba(26, 17, 21, 0.16);
  }

  p {
    max-width: 42ch;
    margin: 14px 0 0;
    color: rgba(255, 255, 255, 0.9);
    font-size: clamp(14px, 1.1vw, 16px);
    font-weight: 500;
    line-height: 1.75;
    text-shadow: 0 3px 10px rgba(26, 17, 21, 0.12);
  }
}

.detail-hero-cover__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  max-width: 100%;

  span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 34px;
    padding: 0 12px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 999px;
    color: rgba(255, 255, 255, 0.94);
    background: rgba(255, 255, 255, 0.2);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      0 8px 20px rgba(20, 15, 18, 0.1);
    font-size: 13px;
    font-weight: 500;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
}

.detail-hero-cover__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 999px;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.18);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
    font-size: 13px;
    font-weight: 500;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}

.location-card {
  position: relative;
  min-height: 154px;
  border-color: rgba(251, 114, 153, 0.16);
  background:
    radial-gradient(circle at 82% 12%, rgba(255, 224, 233, 0.18), transparent 32%),
    linear-gradient(145deg, #fff, #fff9fc);

  h2 {
    margin: 10px 0 0;
    color: #2f2530;
    font-size: 21px;
    font-weight: 700;
    line-height: 1.15;
  }

  p {
    display: -webkit-box;
    overflow: hidden;
    margin: 10px 0 0;
    max-width: calc(100% - 52px);
    color: #6f5f67;
    font-size: 13px;
    line-height: 1.7;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

.location-card__stamp {
  position: absolute;
  right: 14px;
  bottom: 14px;
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border: 1px dashed rgba(251, 114, 153, 0.16);
  border-radius: 999px;
  color: #9a707c;
  background: rgba(255, 255, 255, 0.86);
  text-align: center;
  opacity: 0.82;
  transform: rotate(-8deg);

  span {
    font-size: 10px;
    font-weight: 500;
  }

  strong {
    max-width: 4em;
    font-size: 14px;
    line-height: 1.05;
  }
}

.info-card {
  background: rgba(255, 255, 255, 0.94);
}

.detail-info-list {
  display: grid;
  gap: 6px;
  margin: 14px 0 0;

  div {
    display: grid;
    grid-template-columns: 10px 62px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    min-height: 30px;
    padding: 2px 0;

    &::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: rgba(251, 114, 153, 0.42);
    }
  }

  dt {
    grid-column: 2;
    color: #7a6870;
    font-size: 12px;
    font-weight: 500;
  }

  dd {
    grid-column: 3;
    margin: 0;
    color: #2f2530;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.45;
  }
}

.mood-card {
  border-color: rgba(251, 114, 153, 0.14);
  background: linear-gradient(180deg, #fff, #fff9fc);
  box-shadow: none;

  blockquote {
    margin: 12px 0 0;
    color: #3f3038;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.75;
  }
}

.mood-card__note {
  display: inline-flex;
  margin-top: 12px;
  color: #7a6870;
  font-size: 12px;
}

.fragment-card {
  border-color: rgba(251, 114, 153, 0.14);
  background: #fff;
  box-shadow: none;

  h2 {
    margin: 0;
    color: #2f2530;
    font-size: 15px;
  }
}

.fragment-link {
  position: relative;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  padding: 10px 8px 10px 0;
  color: #3f3038;
  text-decoration: none;
  border-top: 1px solid rgba(251, 114, 153, 0.1);
  border-radius: 12px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 12px;
    width: 1px;
    background: rgba(251, 114, 153, 0.16);
  }

  &:first-of-type::before {
    top: 12px;
  }

  &:last-of-type::before {
    bottom: calc(100% - 22px);
  }

  &.is-active {
    padding-left: 0;
    background: rgba(251, 114, 153, 0.08);
    color: #fb4f86;

    b {
      color: #fff;
      border-color: #fb4f86;
      background: #fb4f86;
    }
  }

  b {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    border: 1px solid rgba(251, 114, 153, 0.16);
    color: #7a6870;
    background: #fff9fc;
    font-size: 10px;
    font-weight: 600;
  }

  span {
    display: grid;
    gap: 3px;
    overflow: hidden;
  }

  strong {
    overflow: hidden;
    color: inherit;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 600;
  }

  small {
    overflow: hidden;
    color: #8d7a82;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 400;
  }
}

.detail-quote-card {
  padding: clamp(22px, 2.6vw, 30px);
  border-radius: 24px;
}

.detail-route-panel {
  padding: clamp(18px, 2.2vw, 24px) 0 clamp(16px, 2.2vw, 22px);
  border-top: 1px solid rgba(251, 114, 153, 0.14);
  border-bottom: 0;
}

.section-head,
.story-list-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    color: #2f2530;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
  }

  p {
    margin: 7px 0 0;
    color: #7a6870;
    font-size: 14px;
    line-height: 1.6;
  }

  strong {
    color: #7a6870;
    font-size: 13px;
    font-weight: 500;
  }
}

.story-list-head {
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  margin-bottom: 0;

  span {
    width: 5px;
    height: 22px;
    border-radius: 999px;
    background: #fb4f86;
  }

  h2 {
    font-size: clamp(24px, 2.4vw, 32px);
  }
}

.detail-route-panel .section-head {
  align-items: center;
  margin-bottom: 14px;

  h2 {
    font-size: 18px;
    font-weight: 600;
  }

  p {
    margin-top: 5px;
    font-size: 13px;
  }
}

.detail-route {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
  gap: 10px;
}

.detail-route-step {
  min-height: 86px;
  padding: 13px 12px;
  border: 1px solid rgba(251, 114, 153, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.66);

  b {
    display: inline-grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 999px;
    color: #fb4f86;
    background: #fff0f5;
    font-size: 13px;
    font-weight: 600;
  }

  h3 {
    margin: 12px 0 0;
    color: #2f2530;
    font-size: 15px;
    font-weight: 600;
  }

  p {
    display: -webkit-box;
    overflow: hidden;
    margin: 7px 0 0;
    color: #7a6870;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

.detail-story-list {
  display: grid;
  gap: 24px;
}

.detail-story-card {
  position: relative;
  display: grid;
  gap: 18px;
  scroll-margin-top: 92px;
  padding: clamp(22px, 3vw, 36px);
  border: 1px solid rgba(251, 114, 153, 0.16);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(251, 114, 153, 0.05);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 24px;
    width: 18px;
    height: 34px;
    border-radius: 0 0 3px 3px;
    background: #fb4f86;
    box-shadow: 0 10px 18px rgba(251, 114, 153, 0.12);
  }
}

.detail-story-card__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 16px;
  max-width: 74ch;

  h3 {
    margin: 0;
    color: #2f2530;
    font-size: clamp(20px, 1.7vw, 23px);
    font-weight: 700;
    line-height: 1.34;
  }

  p {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    margin: 8px 0 0;
    color: #7a6870;
    font-size: 13px;
    font-weight: 500;
  }
}

.detail-story-card__index {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 999px;
  color: #fff;
  background: #fb4f86;
  box-shadow: 0 10px 20px rgba(251, 114, 153, 0.14);
  font-size: 13px;
  font-weight: 700;
}

.detail-story-card__note {
  max-width: 68ch;
  margin: 0;
  color: #3f3038;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.9;
}

.detail-story-card__cover {
  overflow: hidden;
  margin: 0;
  aspect-ratio: 16 / 8;
  min-height: 280px;
  border-radius: 18px;
  background: linear-gradient(135deg, #fff1f5, #fff8fb);
  box-shadow:
    0 12px 26px rgba(251, 114, 153, 0.055),
    0 0 0 5px rgba(255, 255, 255, 0.72);

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
    transition: transform 0.24s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }
}

.detail-thumb {
  aspect-ratio: 1.35;
  border-radius: 13px;
}

.detail-quote-card {
  border-color: rgba(251, 114, 153, 0.14);
  background: rgba(255, 255, 255, 0.94);

  p {
    max-width: 58ch;
    margin: 0;
    color: #3f3038;
    font-size: clamp(18px, 1.7vw, 24px);
    font-weight: 500;
    line-height: 1.7;
  }
}

.detail-memory-nav {
  grid-area: pager;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(251, 114, 153, 0.14);
}

.detail-memory-nav__item {
  display: grid;
  gap: 8px;
  min-width: 0;
  width: 100%;
  padding: 16px 18px;
  border: 1px solid transparent;
  border-radius: 16px;
  color: #3f3038;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: none;
  text-align: left;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

  span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #7a6870;
    font-size: 12px;
    font-weight: 500;
  }

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 16px;
    font-weight: 600;
  }

  &:not(:disabled):hover {
    background: #fff;
    border-color: rgba(251, 114, 153, 0.18);
    transform: translateY(-2px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }
}

.detail-memory-nav__item.is-next {
  justify-items: end;
  text-align: right;
}

.mini-map-card {
  border-color: rgba(251, 114, 153, 0.14);
  background: rgba(255, 255, 255, 0.94);
}

.mini-map-card__canvas {
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
  min-height: 190px;
  margin-top: 16px;
  border: 1px solid rgba(251, 114, 153, 0.12);
  border-radius: 18px;
  color: #5f4350;
  text-align: center;
  background-size: cover;
  background-position: center;
  background:
    linear-gradient(90deg, rgba(251, 114, 153, 0.055) 1px, transparent 1px) 0 0 / 30px 30px,
    linear-gradient(0deg, rgba(251, 114, 153, 0.045) 1px, transparent 1px) 0 0 / 30px 30px,
    radial-gradient(circle at 28% 22%, rgba(255, 236, 243, 0.66), transparent 26%),
    radial-gradient(circle at 82% 74%, rgba(255, 250, 252, 0.92), transparent 30%),
    linear-gradient(135deg, #fffafc, #fff4f8);
}

.mini-map-card__canvas.has-static-map {
  background: #fff8fb;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(0deg, rgba(255, 248, 251, 0.08), rgba(255, 248, 251, 0.08));
    pointer-events: none;
  }

  .mini-map-card__road,
  .mini-map-card__block,
  .mini-map-card__pin {
    display: none;
  }
}

.mini-map-card__image {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mini-map-card__label {
  position: relative;
  z-index: 4;
  display: grid;
  gap: 5px;
  max-width: 76%;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 10px 22px rgba(251, 114, 153, 0.06);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  strong {
    color: #2f2530;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
  }

  small {
    color: #7a6870;
    font-weight: 500;
  }
}

.mini-map-card__coord {
  margin: 10px 0 0;
  color: #7a6870;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.45;
}

.mini-map-card__road {
  position: absolute;
  z-index: 1;
  border-radius: 999px;
  pointer-events: none;
}

.mini-map-card__road--main {
  top: 54%;
  left: -18%;
  width: 140%;
  height: 14px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 1px rgba(251, 114, 153, 0.12);
  transform: rotate(-18deg);
}

.mini-map-card__road--river {
  top: 20%;
  left: -12%;
  width: 124%;
  height: 28px;
  border: 1px solid rgba(251, 114, 153, 0.12);
  background: rgba(255, 226, 236, 0.34);
  transform: rotate(26deg);
}

.mini-map-card__block {
  position: absolute;
  z-index: 1;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.44);
  box-shadow: inset 0 0 0 1px rgba(251, 114, 153, 0.1);
  pointer-events: none;
}

.mini-map-card__block--one {
  top: 18px;
  left: 18px;
  width: 78px;
  height: 54px;
  transform: rotate(-8deg);
}

.mini-map-card__block--two {
  right: 18px;
  bottom: 22px;
  width: 88px;
  height: 58px;
  transform: rotate(10deg);
}

.mini-map-card__pin {
  position: absolute;
  z-index: 2;
  top: 47%;
  left: 50%;
  width: 24px;
  height: 24px;
  border-radius: 999px 999px 999px 0;
  background: #fb4f86;
  box-shadow: 0 12px 26px rgba(251, 114, 153, 0.2);
  transform: translate(-50%, -50%) rotate(-45deg);

  &::after {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: 999px;
    background: #fff;
  }
}

.mini-map-card__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  min-height: 38px;
  margin-top: 14px;
  border: 1px solid rgba(251, 114, 153, 0.16);
  border-radius: 999px;
  color: #3f3038;
  background: #fff;
  font-weight: 600;
}

.album-card {
  border-color: rgba(251, 114, 153, 0.14);
  background: rgba(255, 255, 255, 0.94);
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-top: 16px;
}

.album-grid__item {
  aspect-ratio: 1;
  border-radius: 10px;
}

.album-card__empty {
  margin: 16px 0 0;
  font-size: 13px;
}

.stats-card {
  border-color: rgba(251, 114, 153, 0.14);
  background: rgba(255, 255, 255, 0.94);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  margin-top: 14px;

  .stats-item {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 10px;
    min-height: 58px;
    padding: 10px 0;
    color: #3f3038;

    & + .stats-item {
      border-top: 1px solid rgba(251, 114, 153, 0.08);
    }
  }

  .stats-item__copy {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  .stats-item__label {
    overflow: hidden;
    color: #2f2530;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
  }

  small {
    overflow: hidden;
    color: #a18d96;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.25;
  }

  .stats-item__value {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 42px;
    color: #2f2530;
  }

  strong {
    color: #2f2530;
    font-size: 17px;
    font-weight: 700;
    line-height: 1;
  }

  .el-icon {
    width: 16px;
    height: 16px;
    color: #c16f8b;
    font-size: 16px;
    line-height: 1;
  }

  .stats-item--photos .el-icon {
    color: #a986ba;
  }

  .stats-item--days .el-icon {
    color: #d28a63;
  }

  .stats-item--index .el-icon {
    color: #b9788d;
  }
}

.travel-detail-empty {
  display: grid;
  place-items: center;
  gap: 16px;
  width: min(720px, calc(100vw - 40px));
  min-height: 320px;
  margin: 0 auto;
  padding: 40px 24px;
  border: 1px solid rgba(234, 216, 210, 0.9);
  border-radius: 28px;
  background: rgba(255, 252, 250, 0.94);
  text-align: center;
}

@media (max-width: 1280px) {
  .travel-detail-shell {
    grid-template-areas:
      "left hero"
      "left main"
      "right right"
      ". pager";
    grid-template-columns: minmax(210px, 260px) minmax(0, 1fr);
  }

  .travel-detail-sidebar--right {
    position: static;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .detail-hero-cover {
    min-height: clamp(460px, 58vw, 620px);
  }
}

@media (max-width: 1040px) {
  .travel-detail-shell {
    grid-template-areas:
      "hero"
      "left"
      "main"
      "right"
      "pager";
    grid-template-columns: 1fr;
  }

  .travel-detail-sidebar {
    position: static;
  }

  .travel-detail-sidebar--left {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .travel-detail-sidebar--right {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .fragment-card {
    grid-column: 1 / -1;
    order: 99;
  }

  .detail-route {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .travel-detail-page {
    padding-top: calc(58px + env(safe-area-inset-top, 0px));
    padding-bottom: 32px;
  }

  .detail-dock-row {
    min-height: 48px;
    padding: 0 16px;
  }

  .travel-detail-shell,
  .detail-loading {
    width: min(100vw - 20px, 100%);
  }

  .travel-detail-shell {
    gap: 14px;
    grid-template-areas:
      "hero"
      "left"
      "main"
      "right"
      "pager";
  }

  .travel-detail-sidebar--left,
  .travel-detail-sidebar--right {
    grid-template-columns: 1fr;
  }

  .location-card {
    order: 1;
  }

  .info-card {
    order: 2;
  }

  .mood-card {
    order: 3;
  }

  .fragment-card {
    order: 10;
  }

  .mini-map-card {
    order: 1;
  }

  .album-card {
    order: 2;
  }

  .stats-card {
    order: 3;
  }

  .detail-card {
    padding: 14px;
    border-radius: 18px;
  }

  .location-card {
    min-height: 146px;

    p {
      max-width: calc(100% - 52px);
      -webkit-line-clamp: 2;
    }
  }

  .location-card__stamp {
    width: 58px;
    height: 58px;
  }

  .detail-hero-cover {
    min-height: clamp(360px, 82vw, 430px);
    border-radius: 24px;

    &::after {
      background:
        linear-gradient(90deg, rgba(17, 13, 18, 0.08) 0%, rgba(17, 13, 18, 0.03) 58%, transparent 100%),
        linear-gradient(0deg, rgba(17, 13, 18, 0.4) 0%, rgba(17, 13, 18, 0.14) 42%, rgba(17, 13, 18, 0.02) 74%, rgba(17, 13, 18, 0.04) 100%);
    }
  }

  .detail-hero-cover__content {
    padding: 22px 18px 24px;

    h1 {
      max-width: 12em;
      font-size: clamp(27px, 7.2vw, 34px);
      font-weight: 700;
      line-height: 1.18;
    }

    p {
      max-width: 34ch;
      font-size: 14px;
      line-height: 1.65;
    }
  }

  .detail-hero-cover__meta span,
  .detail-hero-cover__facts span {
    min-height: 32px;
    padding: 0 10px;
    font-size: 12px;
  }

  .detail-hero-cover__facts {
    gap: 8px;
    margin-top: 18px;
  }

  .detail-route-panel,
  .detail-quote-card {
    padding: 18px 0;
    border-radius: 20px;
  }

  .detail-quote-card {
    padding: 20px;
  }

  .detail-route {
    grid-template-columns: 1fr;
  }

  .detail-story-card {
    gap: 16px;
    padding: 18px 16px;
    border-radius: 20px;
  }

  .detail-story-card__head {
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 12px;
  }

  .detail-story-card__index {
    width: 42px;
    height: 42px;
  }

  .detail-story-card__cover {
    aspect-ratio: 4 / 3;
    min-height: 190px;
    border-radius: 16px;
  }

  .detail-story-card__note {
    font-size: 15px;
    line-height: 1.85;
  }

  .mini-map-card__canvas {
    min-height: 170px;
  }

  .detail-memory-nav {
    grid-template-columns: 1fr;
    gap: 8px;
    padding-top: 12px;
  }

  .detail-memory-nav__item {
    width: 100%;
  }
}

.travel-detail-page {
  padding: calc(64px + env(safe-area-inset-top, 0px)) 0 58px;
  background:
    radial-gradient(circle at 10% 4%, rgba(255, 225, 236, 0.42), transparent 28%),
    radial-gradient(circle at 92% 18%, rgba(246, 232, 246, 0.38), transparent 30%),
    linear-gradient(180deg, #fffafb 0%, #fff6f9 38%, #fff9fb 100%);
}

.travel-detail-page::before {
  content: '';
  position: fixed;
  inset: calc(48px + env(safe-area-inset-top, 0px)) 0 0;
  z-index: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, transparent 0, rgba(251, 114, 153, 0.032) 1px, transparent 1px) 0 0 / 44px 44px,
    linear-gradient(0deg, transparent 0, rgba(251, 114, 153, 0.026) 1px, transparent 1px) 0 0 / 44px 44px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.58), transparent 62%);
}

.travel-detail-shell,
.detail-loading,
.travel-detail-empty {
  position: relative;
  z-index: 1;
}

.travel-detail-shell {
  grid-template-columns: minmax(210px, 248px) minmax(620px, 1fr) minmax(230px, 292px);
  gap: clamp(18px, 1.8vw, 30px);
  width: min(1540px, calc(100vw - 48px));
}

.travel-detail-main {
  gap: 18px;
}

.travel-detail-sidebar {
  top: calc(72px + env(safe-area-inset-top, 0px));
  gap: 14px;
}

.detail-card,
.detail-quote-card,
.detail-memory-nav__item {
  border-color: rgba(251, 114, 153, 0.13);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 251, 253, 0.92));
  box-shadow:
    0 16px 34px rgba(213, 132, 164, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.detail-card {
  padding: 18px;
  border-radius: 20px;
}

.detail-card__head {
  .el-icon {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    color: #9a707c;
    background: #fff0f5;
  }
}

.detail-hero-cover {
  height: clamp(430px, 30vw, 560px);
  min-height: 0;
  border-radius: 24px;
  box-shadow:
    0 18px 42px rgba(74, 43, 55, 0.14),
    0 0 0 1px rgba(255, 255, 255, 0.62) inset;

  &::after {
    background:
      linear-gradient(90deg, rgba(20, 14, 18, 0.24) 0%, rgba(20, 14, 18, 0.08) 52%, rgba(20, 14, 18, 0.02) 100%),
      linear-gradient(0deg, rgba(20, 14, 18, 0.52) 0%, rgba(20, 14, 18, 0.18) 42%, rgba(20, 14, 18, 0.04) 78%, rgba(20, 14, 18, 0.08) 100%);
  }
}

.detail-hero-cover__content {
  width: min(620px, 100%);
  min-height: 100%;
  padding: clamp(28px, 3.4vw, 46px);

  h1 {
    margin-top: 12px;
    font-size: clamp(34px, 3vw, 46px);
    letter-spacing: 0;
  }

  p {
    margin-top: 10px;
    max-width: 34ch;
  }
}

.detail-hero-cover__facts {
  margin-top: 20px;

  span {
    min-height: 40px;
    padding: 0 15px;
    background: rgba(255, 255, 255, 0.15);
  }
}

.story-list-head {
  margin-top: 4px;
  margin-bottom: -2px;

  h2 {
    font-size: clamp(24px, 2.1vw, 30px);
    letter-spacing: 0;
  }
}

.detail-story-list {
  gap: 20px;
}

.detail-story-card {
  gap: 16px;
  padding: clamp(22px, 2.4vw, 32px);
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 252, 253, 0.95));
  box-shadow:
    0 18px 38px rgba(213, 132, 164, 0.075),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);

  &::after {
    right: 26px;
    width: 18px;
    height: 42px;
    border-radius: 0 0 5px 5px;
    background: linear-gradient(180deg, #ff5f95, #fb3f7e);
  }
}

.detail-story-card__head {
  max-width: none;
}

.detail-story-card__note {
  max-width: 62ch;
  font-size: 15px;
  line-height: 1.8;
}

.detail-story-card__cover {
  aspect-ratio: 16 / 7.1;
  min-height: 0;
  max-height: 360px;
  border-radius: 16px;
}

.detail-story-card__thumbs {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.detail-thumb {
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(251, 114, 153, 0.1) inset;
}

.location-card {
  min-height: 158px;
  background:
    radial-gradient(circle at 84% 20%, rgba(255, 229, 238, 0.58), transparent 34%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(255, 247, 251, 0.92));
}

.detail-info-list {
  gap: 8px;

  div {
    grid-template-columns: 30px 58px minmax(0, 1fr);
    min-height: 36px;
    padding: 3px 0;

    &::before {
      width: 24px;
      height: 24px;
      background:
        radial-gradient(circle, #fb4f86 0 4px, transparent 4px),
        #fff0f5;
      box-shadow: inset 0 0 0 1px rgba(251, 114, 153, 0.1);
    }
  }
}

.fragment-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 252, 0.95));
}

.fragment-link {
  margin-top: 7px;
  padding: 11px 9px 11px 0;

  &.is-active {
    background: linear-gradient(90deg, rgba(251, 114, 153, 0.12), rgba(251, 114, 153, 0.035));
  }
}

.detail-route-panel {
  padding: 20px;
  border: 1px solid rgba(251, 114, 153, 0.12);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.62);
}

.detail-route-step {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(255, 249, 252, 0.72)),
    var(--route-tone);
}

.mini-map-card__canvas {
  min-height: 188px;
  border-radius: 18px;
  background:
    linear-gradient(90deg, rgba(251, 114, 153, 0.06) 1px, transparent 1px) 0 0 / 28px 28px,
    linear-gradient(0deg, rgba(251, 114, 153, 0.048) 1px, transparent 1px) 0 0 / 28px 28px,
    radial-gradient(circle at 28% 22%, rgba(227, 242, 238, 0.82), transparent 28%),
    radial-gradient(circle at 72% 70%, rgba(238, 244, 239, 0.88), transparent 30%),
    linear-gradient(135deg, #f9fcfb, #fff4f8);
}

.mini-map-card__road--main {
  height: 18px;
  background: rgba(255, 255, 255, 0.9);
}

.mini-map-card__road--river {
  height: 34px;
  border-color: rgba(130, 177, 190, 0.14);
  background: rgba(201, 229, 232, 0.28);
}

.mini-map-card__link {
  min-height: 40px;
  transition: color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    color: #fb4f86;
    border-color: rgba(251, 114, 153, 0.28);
    box-shadow: 0 10px 20px rgba(251, 114, 153, 0.08);
    transform: translateY(-1px);
  }
}

.album-grid {
  gap: 8px;
}

.album-grid__item {
  border-radius: 11px;
  box-shadow: 0 0 0 1px rgba(251, 114, 153, 0.1) inset;
}

.detail-quote-card {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 94% 50%, rgba(255, 222, 233, 0.42), transparent 30%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 240, 246, 0.82));

  &::before {
    content: '“';
    position: absolute;
    top: 12px;
    left: 24px;
    color: rgba(251, 114, 153, 0.42);
    font-size: 40px;
    line-height: 1;
  }

  p {
    padding-left: 42px;
    font-size: clamp(15px, 1.25vw, 18px);
  }
}

@media (max-width: 1280px) {
  .travel-detail-shell {
    grid-template-areas:
      "hero"
      "main"
      "left"
      "right"
      "pager";
    grid-template-columns: 1fr;
    width: min(1040px, calc(100vw - 40px));
  }

  .travel-detail-sidebar {
    position: static;
  }

  .travel-detail-sidebar--left,
  .travel-detail-sidebar--right {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fragment-card,
  .stats-card {
    grid-column: 1 / -1;
  }

  .detail-hero-cover {
    height: clamp(390px, 46vw, 540px);
  }
}

@media (max-width: 760px) {
  .travel-detail-page {
    padding-top: calc(58px + env(safe-area-inset-top, 0px));
  }

  .travel-detail-page::before {
    inset: calc(48px + env(safe-area-inset-top, 0px)) 0 0;
  }

  .detail-dock-row {
    min-height: 48px;
    padding: 0 16px;
  }

  .travel-detail-shell {
    width: min(100vw - 20px, 100%);
    gap: 14px;
  }

  .travel-detail-sidebar--left,
  .travel-detail-sidebar--right {
    grid-template-columns: 1fr;
  }

  .detail-hero-cover {
    height: clamp(320px, 82vw, 410px);
    border-radius: 22px;
  }

  .detail-hero-cover__content {
    padding: 22px 18px 24px;
  }

  .detail-hero-cover__facts span {
    min-height: 32px;
    padding: 0 10px;
  }

  .detail-story-card__cover {
    aspect-ratio: 4 / 3;
    max-height: 300px;
  }

  .detail-story-card__thumbs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-route-panel {
    padding: 16px;
  }

  .detail-quote-card p {
    padding-left: 28px;
  }
}

/* Final detail-page polish: align the travel journal shell as one sakura paper system. */
.travel-detail-page {
  --travel-paper: rgba(255, 253, 254, 0.9);
  --travel-paper-strong: rgba(255, 255, 255, 0.94);
  --travel-rose-border: rgba(239, 136, 171, 0.16);
  --travel-rose-border-soft: rgba(239, 136, 171, 0.1);
  --travel-rose-shadow: 0 16px 38px rgba(220, 138, 170, 0.09);
  --travel-inner-light: inset 0 1px 0 rgba(255, 255, 255, 0.82);
  --travel-ink: #35262f;
  --travel-muted: #7a6870;

  padding: calc(76px + env(safe-area-inset-top, 0px)) 0 56px;
  background:
    radial-gradient(circle at 12% 2%, rgba(255, 224, 236, 0.58), transparent 30%),
    radial-gradient(circle at 84% 8%, rgba(250, 238, 255, 0.34), transparent 32%),
    linear-gradient(180deg, #fff8fb 0%, #fff5f9 42%, #fff9fb 100%);
}

.travel-detail-page::before {
  inset: calc(56px + env(safe-area-inset-top, 0px)) 0 0;
  opacity: 0.78;
  background:
    linear-gradient(90deg, transparent 0, rgba(239, 136, 171, 0.03) 1px, transparent 1px) 0 0 / 44px 44px,
    linear-gradient(0deg, transparent 0, rgba(239, 136, 171, 0.024) 1px, transparent 1px) 0 0 / 44px 44px;
}

.detail-top-dock {
  border-bottom: 1px solid var(--travel-rose-border-soft);
  background:
    linear-gradient(180deg, rgba(255, 252, 254, 0.9), rgba(255, 246, 250, 0.78));
  box-shadow:
    var(--travel-inner-light),
    0 12px 30px rgba(220, 138, 170, 0.08);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.detail-dock-row {
  min-height: 56px;
  width: min(1516px, calc(100vw - 64px));
  margin: 0 auto;
  padding: 0;
}

.detail-back-link {
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid rgba(239, 136, 171, 0.18);
  border-radius: 999px;
  color: #b55373;
  background: rgba(255, 255, 255, 0.64);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 8px 18px rgba(220, 138, 170, 0.08);
  font-weight: 650;

  .el-icon {
    width: 16px;
    height: 16px;
    font-size: 16px;
  }

  &:hover {
    color: #fb4f86;
    border-color: rgba(251, 114, 153, 0.3);
    background: rgba(255, 238, 246, 0.78);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      0 10px 22px rgba(220, 138, 170, 0.12);
  }
}

.travel-detail-shell {
  grid-template-columns: 248px minmax(0, 940px) 292px;
  align-items: start;
  justify-content: center;
  gap: 24px;
  width: min(1516px, calc(100vw - 64px));
}

.travel-detail-main,
.travel-detail-sidebar {
  gap: 18px;
}

.travel-detail-sidebar {
  top: calc(76px + env(safe-area-inset-top, 0px));
}

.detail-hero-cover {
  height: min(520px, calc(100vh - 210px));
  min-height: 430px;
  border: 1px solid rgba(255, 255, 255, 0.54);
  border-radius: 24px;
  box-shadow:
    0 18px 42px rgba(74, 43, 55, 0.13),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
}

.detail-hero-cover__content {
  padding: clamp(28px, 3vw, 42px);

  h1 {
    max-width: 10em;
    margin-top: 10px;
    font-family: "Patrick Hand", "ZCOOL KuaiLe", "Microsoft YaHei UI", "PingFang SC", sans-serif;
    font-size: clamp(38px, 3.2vw, 50px);
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: 0;
  }

  p {
    max-width: 34ch;
    margin-top: 12px;
    font-size: 15px;
    line-height: 1.72;
  }
}

.detail-hero-cover__meta span,
.detail-hero-cover__facts span {
  min-height: 34px;
  gap: 7px;
  border-color: rgba(255, 255, 255, 0.28);

  .el-icon {
    width: 16px;
    height: 16px;
    font-size: 16px;
  }
}

.detail-hero-cover__facts {
  margin-top: 18px;
}

.detail-card,
.detail-route-panel,
.detail-story-card,
.detail-quote-card,
.detail-memory-nav__item {
  border: 1px solid var(--travel-rose-border);
  background:
    linear-gradient(180deg, var(--travel-paper-strong), var(--travel-paper));
  box-shadow:
    var(--travel-rose-shadow),
    var(--travel-inner-light);
}

.detail-card {
  padding: 18px;
  border-radius: 20px;
}

.detail-card__head {
  min-height: 32px;
  align-items: center;

  h2 {
    color: var(--travel-ink);
    font-size: 15px;
    line-height: 1.35;
  }

  > .el-icon {
    width: 18px;
    height: 18px;
    border-radius: 0;
    color: #b9788d;
    background: transparent;
    font-size: 18px;
  }

  > span {
    color: var(--travel-muted);
    font-size: 13px;
    font-weight: 600;
  }
}

.detail-card__eyebrow,
.section-head span,
.story-list-head span {
  color: #ad7a8c;
}

.location-card {
  min-height: 158px;
}

.detail-info-list {
  gap: 7px;

  div {
    grid-template-columns: 16px 58px minmax(0, 1fr);
    min-height: 34px;
    gap: 10px;

    &::before {
      width: 7px;
      height: 7px;
      margin-left: 4px;
      border-radius: 999px;
      background: #fb7299;
      box-shadow: 0 0 0 5px rgba(251, 114, 153, 0.08);
    }
  }
}

.fragment-card {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 66px;
    bottom: 22px;
    left: 30px;
    width: 1px;
    background: linear-gradient(180deg, rgba(251, 114, 153, 0.24), rgba(251, 114, 153, 0.04));
  }
}

.fragment-link {
  position: relative;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 10px;
  min-height: 52px;
  margin-top: 8px;
  padding: 8px 10px 8px 0;
  border-radius: 14px;

  b {
    width: 24px;
    height: 24px;
    margin-left: 0;
    border: 1px solid rgba(251, 114, 153, 0.22);
    color: #a86c80;
    background: rgba(255, 255, 255, 0.86);
    box-shadow: 0 6px 12px rgba(220, 138, 170, 0.06);
    font-size: 10px;
  }

  strong {
    color: var(--travel-ink);
  }

  small {
    color: #a7959c;
    font-size: 11px;
  }

  &.is-active {
    background: linear-gradient(90deg, rgba(251, 114, 153, 0.15), rgba(255, 241, 247, 0.54));

    b {
      color: #fff;
      border-color: transparent;
      background: #fb7299;
      box-shadow: 0 8px 16px rgba(251, 114, 153, 0.2);
    }
  }
}

.story-list-head {
  margin-top: 0;
}

.story-list-head h2 {
  color: var(--travel-ink);
  font-family: "Microsoft YaHei UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", sans-serif;
  font-size: 28px;
  letter-spacing: 0;
}

.detail-story-card {
  padding: 26px 28px;
  border-radius: 20px;
}

.detail-story-card__index {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(251, 114, 153, 0.16);
  background: linear-gradient(135deg, #fb7299, #ff8bad);
  box-shadow: 0 10px 20px rgba(251, 114, 153, 0.16);
}

.detail-story-card__head h3 {
  color: var(--travel-ink);
  font-size: 21px;
  letter-spacing: 0;
}

.detail-story-card__head p,
.detail-story-card__note {
  color: var(--travel-muted);
}

.detail-story-card__cover {
  aspect-ratio: 16 / 7;
  max-height: 330px;
}

.detail-route-panel {
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(255, 248, 251, 0.7));
}

.detail-route-panel .section-head {
  min-height: 36px;
}

.mini-map-card__canvas {
  min-height: 178px;
  border: 1px solid rgba(239, 136, 171, 0.12);
  background:
    linear-gradient(90deg, rgba(173, 131, 145, 0.035) 1px, transparent 1px) 0 0 / 28px 28px,
    linear-gradient(0deg, rgba(173, 131, 145, 0.03) 1px, transparent 1px) 0 0 / 28px 28px,
    linear-gradient(135deg, rgba(228, 244, 241, 0.72), rgba(255, 246, 250, 0.92));
}

.mini-map-card__pin {
  width: 22px;
  height: 22px;
  background: #fb4f86;
  box-shadow:
    0 12px 24px rgba(251, 114, 153, 0.22),
    0 0 0 8px rgba(251, 114, 153, 0.12);
}

.mini-map-card__label {
  min-width: 120px;
  padding: 12px 16px;
  border-color: rgba(239, 136, 171, 0.12);
}

.mini-map-card__coord {
  margin-top: 12px;
  color: var(--travel-muted);
}

.mini-map-card__link {
  min-height: 40px;
  gap: 7px;
  border-color: rgba(251, 114, 153, 0.2);
  color: var(--travel-ink);
  background: rgba(255, 255, 255, 0.72);

  .el-icon {
    width: 16px;
    height: 16px;
    font-size: 16px;
  }
}

.album-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.album-grid__item {
  aspect-ratio: 1;
  border-radius: 11px;

  &:hover {
    transform: none;
    box-shadow: 0 0 0 1px rgba(251, 114, 153, 0.22) inset;
  }
}

@media (max-width: 1500px) {
  .travel-detail-shell,
  .detail-dock-row {
    width: min(1380px, calc(100vw - 44px));
  }

  .travel-detail-shell {
    grid-template-columns: 232px minmax(0, 1fr) 272px;
    gap: 20px;
  }
}

@media (max-width: 1280px) {
  .travel-detail-shell {
    grid-template-columns: 1fr;
    width: min(1040px, calc(100vw - 40px));
  }

  .detail-hero-cover {
    height: clamp(390px, 46vw, 520px);
    min-height: 380px;
  }
}

@media (max-width: 760px) {
  .travel-detail-page {
    padding-top: calc(64px + env(safe-area-inset-top, 0px));
  }

  .travel-detail-page::before {
    inset: calc(56px + env(safe-area-inset-top, 0px)) 0 0;
  }

  .detail-dock-row {
    width: min(100vw - 28px, 100%);
    min-height: 56px;
  }

  .detail-hero-cover {
    height: clamp(320px, 82vw, 410px);
    min-height: 320px;
  }

  .detail-story-card__cover {
    max-height: 300px;
  }
}

/* Match the travel editor topbar and clean up dense info/stat icon alignment. */
.detail-top-dock {
  z-index: 285;
  padding:
    calc(9px + env(safe-area-inset-top, 0))
    calc(24px + env(safe-area-inset-right, 0))
    9px
    calc(24px + env(safe-area-inset-left, 0));
  border-bottom: 1px solid rgba(238, 226, 235, 0.78);
  background: rgba(255, 250, 253, 0.78);
  box-shadow: 0 10px 30px rgba(219, 192, 206, 0.08);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.detail-dock-row {
  width: min(1540px, calc(100vw - 72px));
  min-height: 38px;
}

.detail-back-link {
  min-height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  color: #8f8290;
  background: transparent;
  box-shadow: none;
  font-weight: 700;

  &:hover {
    color: #fb4f86;
    background: rgba(255, 238, 246, 0.68);
    box-shadow: none;
  }
}

.detail-info-list {
  gap: 10px;

  div {
    grid-template-columns: 18px 58px minmax(0, 1fr);
    min-height: 34px;
    gap: 11px;

    &::before {
      display: none;
    }
  }
}

.detail-info-list__icon {
  grid-column: 1;
  align-self: center;
  width: 16px;
  height: 16px;
  color: #cf7f9a;
  font-size: 16px;
}

</style>
