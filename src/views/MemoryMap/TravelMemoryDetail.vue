<template>
  <div class="travel-detail-page">
    <header class="detail-topbar">
      <div class="detail-topbar__inner">
        <button type="button" class="detail-topbar__back" @click="goToMap">
          <UiIcon name="back" />
          <span>返回</span>
        </button>
        <strong class="detail-topbar__brand">{{ siteName }}</strong>
        <div class="detail-topbar__context">
          <span v-if="visitDate">{{ visitDate }}</span>
          <span v-if="locationText">{{ locationText }}</span>
        </div>
      </div>
    </header>

    <div v-if="loading" class="detail-loading">
      <UiSkeleton :rows="12" size="lg" />
    </div>

    <section v-else-if="detail" class="travel-detail-shell">
      <article class="detail-overview-card">
        <div class="detail-overview-card__meta">
          <span v-if="visitDate">{{ visitDate }}</span>
          <span v-if="locationText">{{ locationText }}</span>
        </div>

        <div class="detail-overview-card__stamp">
          <span>记忆</span>
        </div>

        <h1>{{ detail.title }}</h1>
        <p class="detail-overview-card__summary">{{ journalQuote }}</p>

        <div class="detail-overview-card__stats" aria-label="旅程概览">
          <article>
            <span>Fragments</span>
            <strong>{{ storyStops.length.toString().padStart(2, '0') }}</strong>
          </article>
          <article>
            <span>Photos</span>
            <strong>{{ allEntries.length.toString().padStart(2, '0') }}</strong>
          </article>
          <article>
            <span>Days</span>
            <strong>{{ durationNumber.toString().padStart(2, '0') }}</strong>
          </article>
        </div>
      </article>

      <section class="detail-reading-band">
        <article class="detail-fragment-card" aria-label="当前旅行片段">
          <header class="detail-fragment-card__head">
            <div class="detail-fragment-card__marker">{{ currentStopLabel }}</div>
            <div class="detail-fragment-card__meta">
              <span>{{ currentStopDate }}</span>
            </div>
          </header>

          <h2>{{ currentStop.title }}</h2>
          <p v-for="paragraph in currentStopParagraphs" :key="paragraph">{{ paragraph }}</p>
        </article>

        <aside class="detail-directory-card" aria-label="片段目录">
          <div class="detail-directory-card__title">
            <h2>片段目录</h2>
          </div>

          <div class="detail-directory-card__list">
            <button
              v-for="(stop, index) in storyStops"
              :key="stop.id || `catalog-${index}`"
              type="button"
              class="detail-directory-item"
              :class="{ 'is-active': index === activeStopIndex }"
              @click="selectStop(index)"
            >
              <b>{{ String(index + 1).padStart(2, '0') }}.</b>
              <span>{{ stop.title }}</span>
            </button>
          </div>

          <button type="button" class="detail-directory-card__footer" @click="showAllStops">
            组织好整个 {{ monthLabel }} 的片段
          </button>
        </aside>
      </section>

      <section class="detail-photo-panel">
        <header class="detail-photo-panel__head">
          <h2>照片面板</h2>
          <p>拖动照片球查看所有照片，点击照片切换到所属片段</p>
        </header>

        <TravelPhotoSphere
          :entries="allEntries"
          :title="detail.title"
          :active-stop-index="activeStopIndex"
          :selected-entry-key="selectedEntryKey"
          :stop-index-by-key="stopIndexByKey"
          @select-entry="handleEntryKeySelect"
        />
      </section>

      <nav class="detail-adjacent-nav" aria-label="上一篇和下一篇游记">
        <button
          type="button"
          class="detail-adjacent-nav__item"
          :disabled="!previousMemory"
          @click="previousMemory && goToMemory(previousMemory.id)"
        >
          <small>上一篇</small>
          <strong>{{ previousMemory?.title || '顺序尚未开始' }}</strong>
        </button>
        <button
          type="button"
          class="detail-adjacent-nav__item"
          :disabled="!nextMemory"
          @click="nextMemory && goToMemory(nextMemory.id)"
        >
          <small>下一篇</small>
          <strong>{{ nextMemory?.title || '未完待续' }}</strong>
        </button>
      </nav>
    </section>

    <section v-else class="travel-detail-empty">
      <p>{{ errorMessage }}</p>
      <UiButton variant="primary" round @click="goToMap">返回旅行地图</UiButton>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'
import { getTravelMemories, getTravelMemoryDetail } from '@/api/travel-memory'
import { UiButton, UiIcon, UiSkeleton } from '@/components/ui'
import TravelPhotoSphere from '@/components/TravelMemoryMap/TravelPhotoSphere.vue'
import { useSiteConfig } from '@/composables/useSiteConfig'
import type { TravelMemoryEntry, TravelMemoryLocationDetail, TravelMemoryLocationListItem, TravelMemoryStop } from '@/types'
import { applySiteMeta, resolveSeoDescription, resolveSiteName } from '@/utils/siteConfig'

const route = useRoute()
const router = useRouter()
const { siteConfig, loadSiteConfig } = useSiteConfig()

const loading = ref(false)
const detail = ref<TravelMemoryLocationDetail | null>(null)
const memories = ref<TravelMemoryLocationListItem[]>([])
const activeStopIndex = ref(0)
const selectedEntryKey = ref('')
const errorMessage = ref('这篇旅行游记不存在或暂时无法查看。')
let detailRequestVersion = 0

const siteName = computed(() => resolveSiteName(siteConfig.value))

const storyStops = computed<TravelMemoryStop[]>(() => {
  if (!detail.value) return []
  if (detail.value.stops?.length) {
    return detail.value.stops
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((stop, index) => ({
        ...stop,
        entries: (stop.entries || []).slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
        sortOrder: stop.sortOrder ?? index,
      }))
  }

  const fallbackEntries = (detail.value.entries || []).slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  if (!fallbackEntries.length) return []

  return [
    {
      title: detail.value.title || '旅行片段',
      storyNote: detail.value.summaryNote || '',
      coverImage: detail.value.coverImage,
      visitedAt: detail.value.visitedAt,
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
      const key = entryKey(entry)
      if (seen.has(key) || !entry.imageUrl) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
})

const stopIndexByKey = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {}
  storyStops.value.forEach((stop, stopIndex) => {
    stop.entries.forEach((entry) => {
      map[entryKey(entry)] = stopIndex
    })
  })
  return map
})

const currentStop = computed(() => {
  if (!storyStops.value.length) {
    return {
      title: detail.value?.title || '旅行片段',
      storyNote: detail.value?.summaryNote || '',
      entries: allEntries.value,
      visitedAt: detail.value?.visitedAt,
    } as TravelMemoryStop
  }
  return storyStops.value[Math.min(activeStopIndex.value, storyStops.value.length - 1)]
})

const currentStopParagraphs = computed(() => {
  const note = currentStop.value.storyNote?.trim() || stopSceneSummary(currentStop.value)
  return note
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
})

const locationText = computed(() => formatLocation(detail.value))
const visitDate = computed(() => formatDateRange(detail.value?.visitedAt, detail.value?.visitedEndAt))
const durationNumber = computed(() => {
  const start = detail.value?.visitedAt
  const end = detail.value?.visitedEndAt || start
  if (!start || !end) return 1
  const days = dayjs(end).startOf('day').diff(dayjs(start).startOf('day'), 'day') + 1
  return Number.isFinite(days) && days > 0 ? days : 1
})

const monthLabel = computed(() => {
  const start = detail.value?.visitedAt
  return start ? dayjs(start).format('M 月') : '旅程'
})

const currentStopLabel = computed(() => `${String(activeStopIndex.value + 1).padStart(2, '0')}.`)
const currentStopDate = computed(() => formatDate(currentStop.value.visitedAt) || visitDate.value || '未记录日期')
const journalQuote = computed(() => {
  const summary = detail.value?.summaryNote?.trim()
  if (summary) return summary
  const firstNote = allEntries.value[0]?.thanksNote?.trim()
  return firstNote || '这趟旅行把片刻轻轻收好，剩下的是能被再次翻开的光线、街道和风。'
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

function entryKey(entry: TravelMemoryEntry) {
  return String(entry.id ?? entry.imageUrl)
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

function formatLocation(location?: { province?: string; city?: string } | null) {
  if (!location) return ''
  return [location.province, location.city].filter(Boolean).join(' · ')
}

function stopSceneSummary(stop: TravelMemoryStop) {
  const cover = stop.entries.find((entry) => entry.stopCover) || stop.entries.find((entry) => entry.cover) || stop.entries[0]
  return cover?.thanksNote?.trim() || cover?.remark?.trim() || journalQuote.value
}

function applyDetailMeta() {
  if (!detail.value) return
  applySiteMeta(
    siteConfig.value,
    `${detail.value.title} - 旅行游记`,
    detail.value.summaryNote?.trim() || resolveSeoDescription(siteConfig.value),
  )
}

function selectStop(index: number) {
  activeStopIndex.value = index
  const firstEntry = storyStops.value[index]?.entries?.[0]
  if (firstEntry) {
    selectedEntryKey.value = entryKey(firstEntry)
  }
}

function handleEntryKeySelect(key: string) {
  selectedEntryKey.value = key
  const stopIndex = stopIndexByKey.value[key]
  if (stopIndex != null && stopIndex >= 0) {
    activeStopIndex.value = stopIndex
  }
}

function showAllStops() {
  activeStopIndex.value = 0
}

async function loadDetail() {
  const requestVersion = ++detailRequestVersion
  const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  const numericId = Number(rawId)
  if (!Number.isFinite(numericId)) {
    if (requestVersion === detailRequestVersion) {
      detail.value = null
      memories.value = []
      errorMessage.value = '这篇旅行游记不存在或暂时无法查看。'
    }
    return
  }

  loading.value = true
  activeStopIndex.value = 0
  selectedEntryKey.value = ''
  errorMessage.value = '这篇旅行游记不存在或暂时无法查看。'

  try {
    const [, detailResult, memoryList] = await Promise.all([
      loadSiteConfig().catch(() => null),
      getTravelMemoryDetail(numericId),
      getTravelMemories().catch(() => []),
    ])
    if (requestVersion !== detailRequestVersion) return
    detail.value = detailResult
    memories.value = memoryList
    applyDetailMeta()
  } catch {
    if (requestVersion !== detailRequestVersion) return
    detail.value = null
    memories.value = []
  } finally {
    if (requestVersion === detailRequestVersion) {
      loading.value = false
    }
  }
}

function goToMap() {
  const routeId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  const fallbackId = Number(routeId)
  const focusId = detail.value?.id ?? (Number.isFinite(fallbackId) ? fallbackId : null)
  router.push({
    path: '/memory-map',
    query: focusId != null ? { focus: String(focusId) } : undefined,
  })
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
  () => [detail.value?.id, storyStops.value.length],
  () => {
    if (!selectedEntryKey.value && storyStops.value[0]?.entries?.[0]) {
      selectedEntryKey.value = entryKey(storyStops.value[0].entries[0])
    }
    if (activeStopIndex.value >= storyStops.value.length) {
      activeStopIndex.value = 0
    }
  },
  { flush: 'post' },
)

onMounted(() => {
  void loadDetail()
})
</script>

<style scoped lang="scss">
.travel-detail-page {
  min-height: 100vh;
  padding: calc(112px + env(safe-area-inset-top, 0px)) 0 70px;
  color: #201a1f;
  background:
    linear-gradient(90deg, rgba(255, 247, 249, 0.96), rgba(255, 247, 249, 0.96)),
    linear-gradient(180deg, #fff 0%, #fff7fa 100%);
}

.detail-topbar,
.detail-loading,
.travel-detail-shell,
.travel-detail-empty {
  position: relative;
  z-index: 1;
}

.detail-topbar {
  position: fixed;
  inset: 0 0 auto;
  z-index: 280;
  padding-top: env(safe-area-inset-top, 0px);
  border-bottom: 1px solid rgba(155, 59, 82, 0.16);
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 30px rgba(155, 59, 82, 0.06);
}

.detail-topbar__inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: min(1120px, calc(100vw - 48px));
  min-height: 72px;
  margin: 0 auto;
  color: #9b3b52;
  font-size: 14px;
  font-weight: 600;
}

.detail-topbar__back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  justify-self: start;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  cursor: pointer;
  transition: color var(--motion-duration-fast) var(--motion-ease-standard);
}

.detail-topbar__back:hover {
  color: #7f6672;
}

.detail-topbar__brand {
  justify-self: center;
  color: #9b3b52;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.detail-topbar__context {
  display: inline-flex;
  gap: 8px;
  justify-self: end;
  color: #554245;
}

.detail-loading,
.travel-detail-empty {
  width: min(1120px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 28px;
  border-radius: 16px;
  border: 1px solid rgba(219, 192, 195, 0.3);
  background: #fff;
  box-shadow: 0 8px 30px rgba(155, 59, 82, 0.08);
}

.travel-detail-empty {
  display: grid;
  justify-items: center;
  gap: 18px;
  text-align: center;
}

.travel-detail-shell {
  display: grid;
  gap: 64px;
  width: min(1120px, calc(100vw - 48px));
  margin: 0 auto;
}

.detail-overview-card,
.detail-fragment-card,
.detail-directory-card,
.detail-photo-panel,
.detail-adjacent-nav__item {
  border-radius: 16px;
  border: 1px solid rgba(219, 192, 195, 0.3);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 30px rgba(155, 59, 82, 0.08);
}

.detail-overview-card {
  position: relative;
  overflow: hidden;
  padding: 49px;
}

.detail-overview-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #5f5a63;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.detail-overview-card__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 13px;
  border-radius: 999px;
  border: 1px solid rgba(219, 192, 195, 0.3);
  background: #f8eaf2;
}

.detail-overview-card__stamp {
  position: absolute;
  top: 40px;
  right: 48px;
  display: grid;
  place-items: center;
  width: 72px;
  aspect-ratio: 1;
  border-radius: 999px;
  border: 1px solid rgba(219, 120, 140, 0.32);
  color: #c98298;
  font-size: 16px;
  background: rgba(255, 247, 249, 0.6);
}

.detail-overview-card h1 {
  max-width: 10ch;
  margin: 24px 0 18px;
  color: #201a1f;
  font-family: 'Noto Serif SC', 'Songti SC', 'SimSun', serif;
  font-size: clamp(3.2rem, 5.8vw, 5.9rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

.detail-overview-card__summary {
  max-width: 74ch;
  margin: 0;
  color: #554245;
  font-size: 18px;
  line-height: 1.72;
}

.detail-overview-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  max-width: 512px;
  gap: 32px;
  margin-top: 48px;
  padding-top: 27px;
  border-top: 1px solid rgba(219, 192, 195, 0.2);
}

.detail-overview-card__stats article {
  display: grid;
  gap: 6px;
}

.detail-overview-card__stats span {
  color: #5f5a63;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.detail-overview-card__stats strong {
  color: #9b3b52;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
  font-weight: 600;
}

.detail-reading-band {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 48px;
  align-items: stretch;
}

.detail-fragment-card {
  grid-column: span 7;
  display: flex;
  min-height: 486px;
  max-height: 486px;
  flex-direction: column;
  padding: 41px;
  overflow: hidden;
}

.detail-fragment-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-fragment-card__marker {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #9b3b52;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 14px;
  font-weight: 700;
}

.detail-fragment-card__marker::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #9b3b52;
}

.detail-fragment-card__meta {
  color: #9f7c87;
  font-size: 13px;
  font-weight: 600;
}

.detail-fragment-card h2 {
  margin: 20px 0 18px;
  color: #201a1f;
  font-family: 'Noto Serif SC', 'Songti SC', 'SimSun', serif;
  font-size: 32px;
  font-weight: 650;
  line-height: 1.3;
}

.detail-fragment-card p {
  max-width: 65ch;
  margin: 0 0 24px;
  color: #554245;
  font-size: 18px;
  line-height: 1.72;
}

.detail-fragment-card p:first-of-type {
  margin-top: 8px;
}

.detail-directory-card {
  grid-column: span 5;
  display: flex;
  min-height: 486px;
  max-height: 486px;
  flex-direction: column;
  padding: 24px;
  overflow: hidden;
}

.detail-directory-card__title h2 {
  margin: 0;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(219, 192, 195, 0.2);
  color: #5f5a63;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.detail-directory-card__list {
  display: grid;
  position: relative;
  gap: 4px;
  margin-top: 16px;
  padding-bottom: 16px;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(155, 59, 82, 0.28) transparent;
}

.detail-directory-card__list::before {
  content: '';
  position: absolute;
  top: 16px;
  bottom: 16px;
  left: 11px;
  width: 2px;
  background: rgba(219, 192, 195, 0.2);
}

.detail-directory-item {
  position: relative;
  display: flex;
  gap: 16px;
  align-items: center;
  min-height: 52px;
  padding: 8px 12px 8px 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #7f6c76;
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    color var(--motion-duration-fast) var(--motion-ease-standard);
}

.detail-directory-item b {
  position: relative;
  z-index: 1;
  display: grid;
  width: 24px;
  place-items: center;
  color: transparent;
  font-size: 0;
}

.detail-directory-item b::after {
  content: '';
  width: 8px;
  height: 8px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #dbc0c3;
}

.detail-directory-item span {
  min-width: 0;
  overflow: hidden;
  color: #5f5a63;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-directory-item.is-active {
  background: #fef0f7;
}

.detail-directory-item.is-active b::after {
  background: #9b3b52;
  box-shadow: 0 0 0 2px rgba(155, 59, 82, 0.1);
}

.detail-directory-item.is-active span {
  color: #9b3b52;
}

.detail-directory-card__footer {
  min-height: 38px;
  margin-top: auto;
  border: 1px solid rgba(219, 192, 195, 0.3);
  border-radius: 999px;
  color: #5f5a63;
  background: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  cursor: pointer;
  transition:
    color var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard);
}

.detail-directory-card__footer:hover {
  color: #b78693;
}

.detail-photo-panel {
  overflow: hidden;
  min-height: 875px;
  padding: 48px 48px 34px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 12px 40px rgba(155, 59, 82, 0.1);
}

.detail-photo-panel__head {
  display: grid;
  justify-items: center;
  gap: 6px;
  text-align: center;
}

.detail-photo-panel__head h2 {
  margin: 0;
  color: #9b3b52;
  font-family: 'Noto Serif SC', 'Songti SC', 'SimSun', serif;
  font-size: 32px;
  font-weight: 650;
}

.detail-photo-panel__head p {
  margin: 0;
  color: #5f5a63;
  font-size: 13px;
  letter-spacing: 0.1em;
}

.detail-adjacent-nav {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.detail-adjacent-nav__item {
  display: grid;
  gap: 6px;
  min-height: 80px;
  padding: 24px;
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--motion-duration-fast) var(--motion-ease-standard),
    box-shadow var(--motion-duration-base) var(--motion-ease-standard);
}

.detail-adjacent-nav__item small {
  color: #bc98a5;
  font-size: 13px;
}

.detail-adjacent-nav__item strong {
  color: #201a1f;
  font-family: 'Noto Serif SC', 'Songti SC', 'SimSun', serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.55;
}

.detail-adjacent-nav__item:hover:not(:disabled) {
  transform: translateY(-1px);
}

.detail-adjacent-nav__item:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 920px) {
  .detail-topbar__inner,
  .detail-loading,
  .travel-detail-shell,
  .travel-detail-empty {
    width: min(100vw - 24px, 100%);
  }

  .detail-reading-band {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .detail-fragment-card,
  .detail-directory-card {
    grid-column: auto;
    min-height: auto;
    max-height: none;
  }

  .detail-adjacent-nav {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .travel-detail-page {
    padding-top: calc(86px + env(safe-area-inset-top, 0px));
  }

  .detail-topbar__inner {
    grid-template-columns: 1fr;
    gap: 6px;
    justify-items: start;
    min-height: 72px;
  }

  .detail-topbar__brand,
  .detail-topbar__context {
    justify-self: start;
  }

  .detail-overview-card,
  .detail-fragment-card,
  .detail-directory-card,
  .detail-photo-panel {
    padding-left: 18px;
    padding-right: 18px;
  }

  .travel-detail-shell {
    gap: 28px;
  }

  .detail-overview-card h1 {
    font-size: 3rem;
  }

  .detail-overview-card__summary,
  .detail-fragment-card p {
    font-size: 15px;
  }

  .detail-photo-panel {
    min-height: 640px;
    padding-top: 34px;
  }

  .detail-overview-card__stamp {
    top: 18px;
    right: 18px;
  }
}
</style>
