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
      <article class="detail-overview-card" :class="{ 'has-media': heroImage }">
        <div class="detail-overview-card__content">
          <div class="detail-overview-card__meta">
            <span v-if="visitDate">{{ visitDate }}</span>
            <span v-if="locationText">{{ locationText }}</span>
          </div>

          <h1>{{ detail.title }}</h1>
          <p class="detail-overview-card__summary">{{ journalQuote }}</p>

          <div class="detail-overview-card__stats" aria-label="旅程概览">
            <article>
              <span>片段</span>
              <strong>{{ storyStops.length.toString().padStart(2, '0') }}</strong>
            </article>
            <article>
              <span>照片</span>
              <strong>{{ allEntries.length.toString().padStart(2, '0') }}</strong>
            </article>
            <article>
              <span>天数</span>
              <strong>{{ durationNumber.toString().padStart(2, '0') }}</strong>
            </article>
          </div>
        </div>

        <figure v-if="heroImage" class="detail-overview-card__media">
          <img :src="heroImage" :alt="detail.title" />
        </figure>
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
            回到第一个片段
          </button>
        </aside>
      </section>

      <section class="detail-photo-panel">
        <header class="detail-photo-panel__head">
          <h2>旅程相册</h2>
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

const heroImage = computed(() => detail.value?.coverImage || allEntries.value[0]?.imageUrl || '')

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
  /* 与旅行地图页共享的图鉴词汇 */
  --atlas-route: #d75f87;
  --atlas-ink: #4e353e;
  --detail-line: rgba(232, 214, 221, 0.72);
  --detail-surface: #ffffff;
  --detail-text: #565057;
  --detail-text-muted: #8a7a84;
  --detail-label: #9d7583;
  --detail-rose-wash: #fff1f6;
  /* 原先散落在各处的裸色号，收进 token，方便和暗色主题联动 */
  --detail-quiet-action: #926978;
  --detail-dot-idle: #f3c7d7;
  --detail-title-font:
    'Microsoft YaHei UI',
    'PingFang SC',
    'Hiragino Sans GB',
    'Noto Sans CJK SC',
    sans-serif;
  min-height: 100vh;
  padding: calc(112px + env(safe-area-inset-top, 0px)) 0 70px;
  /* 与全站保持一致：复用系统的淡樱粉尘渐变背景，不再单独铺一层偏暖的图鉴纸色 */
  background-color: var(--bg-primary);
  background-image: var(--page-background-image);
  background-attachment: fixed;
  color: var(--detail-text);
}

[data-theme='dark'] .travel-detail-page {
  --detail-line: rgba(255, 230, 239, 0.14);
  --detail-surface: #2b2431;
  --detail-text: #c9bcc6;
  --detail-text-muted: #9b8d99;
  --detail-label: #d8b3c2;
  --detail-rose-wash: rgba(242, 154, 182, 0.16);
  --detail-quiet-action: #d8b3c2;
  --detail-dot-idle: rgba(242, 154, 182, 0.4);
  --atlas-ink: #f2ebf0;
  --atlas-route: #f29ab6;
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
  z-index: var(--z-sticky, 100);
  padding-top: env(safe-area-inset-top, 0px);
  border-bottom: 1px solid var(--detail-line, rgba(232, 214, 221, 0.72));
  background: var(--bg-glass-strong, rgba(255, 255, 255, 0.84));
  backdrop-filter: blur(8px);
}

.detail-topbar__inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: min(1120px, calc(100vw - 48px));
  min-height: 72px;
  margin: 0 auto;
  font-size: 14px;
  font-weight: 600;
}

.detail-topbar__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-self: start;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid var(--detail-line, rgba(232, 214, 221, 0.72));
  border-radius: 999px;
  color: var(--detail-quiet-action, #926978);
  background: rgba(255, 255, 255, 0.72);
  font: inherit;
  cursor: pointer;
  transition:
    color var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard);
}

.detail-topbar__back:hover {
  color: var(--primary-dark, #e44d78);
  border-color: rgba(215, 95, 135, 0.4);
}

.detail-topbar__brand {
  justify-self: center;
  color: var(--atlas-ink, #4e353e);
  font-family: var(--detail-title-font);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.detail-topbar__context {
  display: inline-flex;
  gap: 8px;
  justify-self: end;
  color: var(--detail-text-muted, #8a7a84);
  font-weight: 500;
}

.detail-loading,
.travel-detail-empty {
  width: min(1120px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 28px;
  border-radius: 16px;
  border: 1px solid var(--detail-line, rgba(232, 214, 221, 0.72));
  background: var(--detail-surface, #fff);
}

.travel-detail-empty {
  display: grid;
  justify-items: center;
  gap: 18px;
  text-align: center;
}

.travel-detail-shell {
  display: grid;
  gap: 48px;
  width: min(1120px, calc(100vw - 48px));
  margin: 0 auto;
}

.detail-overview-card,
.detail-fragment-card,
.detail-directory-card,
.detail-photo-panel,
.detail-adjacent-nav__item {
  border-radius: 16px;
  border: 1px solid var(--detail-line, rgba(232, 214, 221, 0.72));
  background: var(--detail-surface, #fff);
}

.detail-overview-card {
  position: relative;
  overflow: hidden;
  padding: clamp(28px, 3.4vw, 44px);
  border-radius: 22px;
}

.detail-overview-card.has-media {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 400px);
  gap: clamp(28px, 3.4vw, 48px);
  align-items: stretch;
}

.detail-overview-card__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.detail-overview-card__media {
  position: relative;
  overflow: hidden;
  margin: 0;
  min-height: 300px;
  border-radius: 16px;
  box-shadow: 0 18px 42px rgba(74, 43, 55, 0.13);
}

.detail-overview-card__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-overview-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
}

.detail-overview-card__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(215, 95, 135, 0.18);
  background: var(--detail-rose-wash, #fff1f6);
  color: var(--detail-quiet-action, #926978);
  letter-spacing: 0.01em;
}

.detail-overview-card h1 {
  margin: 20px 0 14px;
  color: var(--atlas-ink, #4e353e);
  font-family: var(--detail-title-font);
  font-size: clamp(2rem, 3.6vw, 2.75rem);
  font-weight: 700;
  line-height: 1.16;
  letter-spacing: -0.01em;
  text-wrap: balance;
}

.detail-overview-card__summary {
  max-width: 62ch;
  margin: 0;
  color: var(--detail-text, #565057);
  font-size: 16px;
  line-height: 1.8;
}

.detail-overview-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  max-width: 420px;
  gap: 24px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--detail-line, rgba(232, 214, 221, 0.72));
}

.detail-overview-card__stats article {
  display: grid;
  gap: 4px;
}

.detail-overview-card__stats span {
  color: var(--detail-label, #9d7583);
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.06em;
}

.detail-overview-card__stats strong {
  color: var(--atlas-ink, #4e353e);
  font-family: var(--detail-title-font);
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.detail-reading-band {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 32px;
  align-items: stretch;
}

.detail-fragment-card {
  grid-column: span 7;
  display: flex;
  min-height: 486px;
  max-height: 486px;
  flex-direction: column;
  padding: clamp(28px, 3vw, 40px);
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
  gap: 10px;
  color: var(--atlas-ink, #4e353e);
  font-family: var(--detail-title-font);
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.detail-fragment-card__marker::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--atlas-route, #d75f87);
}

.detail-fragment-card__meta {
  color: var(--detail-label, #9d7583);
  font-size: 13px;
  font-weight: 600;
}

.detail-fragment-card h2 {
  margin: 18px 0 14px;
  color: var(--atlas-ink, #4e353e);
  font-family: var(--detail-title-font);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.35;
}

.detail-fragment-card p {
  max-width: 65ch;
  margin: 0 0 20px;
  color: var(--detail-text, #565057);
  font-size: 16px;
  line-height: 1.8;
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
  border-bottom: 1px solid var(--detail-line, rgba(232, 214, 221, 0.72));
  color: var(--detail-label, #9d7583);
  font-family: var(--detail-title-font);
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0.06em;
}

.detail-directory-card__list {
  display: grid;
  position: relative;
  gap: 4px;
  margin-top: 16px;
  padding-bottom: 16px;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(215, 95, 135, 0.32) transparent;
}

.detail-directory-card__list::before {
  content: '';
  position: absolute;
  top: 16px;
  bottom: 16px;
  left: 11px;
  width: 2px;
  background: var(--detail-line, rgba(232, 214, 221, 0.72));
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
  background: var(--detail-dot-idle, #f3c7d7);
}

.detail-directory-item span {
  min-width: 0;
  overflow: hidden;
  color: var(--detail-text, #565057);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-directory-item:hover {
  background: rgba(255, 241, 246, 0.6);
}

.detail-directory-item.is-active {
  background: var(--detail-rose-wash, #fff1f6);
}

.detail-directory-item.is-active b::after {
  background: var(--atlas-route, #d75f87);
  box-shadow: 0 0 0 2px rgba(215, 95, 135, 0.14);
}

.detail-directory-item.is-active span {
  color: var(--atlas-ink, #4e353e);
}

.detail-directory-card__footer {
  min-height: 38px;
  margin-top: auto;
  border: 1px solid var(--detail-line, rgba(232, 214, 221, 0.72));
  border-radius: 999px;
  color: var(--detail-quiet-action, #926978);
  background: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    color var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard);
}

.detail-directory-card__footer:hover {
  color: var(--primary-dark, #e44d78);
  border-color: rgba(215, 95, 135, 0.4);
}

.detail-photo-panel {
  overflow: hidden;
  min-height: 780px;
  padding: 40px 48px 34px;
  border-radius: 22px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 18px 42px rgba(74, 43, 55, 0.13);
}

.detail-photo-panel__head {
  display: grid;
  justify-items: center;
  gap: 6px;
  text-align: center;
}

.detail-photo-panel__head h2 {
  margin: 0;
  color: var(--atlas-ink, #4e353e);
  font-family: var(--detail-title-font);
  font-size: clamp(22px, 1.7vw, 28px);
  font-weight: 700;
}

.detail-photo-panel__head p {
  margin: 0;
  color: var(--detail-text-muted, #8a7a84);
  font-size: 13px;
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
  padding: 22px 24px;
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard);
}

.detail-adjacent-nav__item small {
  color: var(--detail-label, #9d7583);
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.06em;
}

.detail-adjacent-nav__item strong {
  color: var(--atlas-ink, #4e353e);
  font-family: var(--detail-title-font);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.5;
}

.detail-adjacent-nav__item:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(215, 95, 135, 0.4);
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

  .detail-overview-card.has-media {
    grid-template-columns: 1fr;
    gap: 22px;
  }

  .detail-overview-card__media {
    order: -1;
    min-height: 0;
  }

  .detail-overview-card__media img {
    position: static;
    aspect-ratio: 16 / 10;
    height: auto;
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
    font-size: 1.75rem;
  }

  .detail-overview-card__summary,
  .detail-fragment-card p {
    font-size: 15px;
  }

  .detail-photo-panel {
    min-height: 640px;
    padding-top: 34px;
  }
}
</style>
