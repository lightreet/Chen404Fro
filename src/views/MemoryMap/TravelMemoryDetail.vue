<template>
  <DefaultLayout :wide-content="true" :show-live2-d="false" :show-header="false">
    <div class="travel-memory-detail-page">
      <div v-if="detail" class="travel-memory-detail__toolbar">
        <div class="travel-memory-detail__toolbar-inner">
          <button type="button" class="travel-memory-detail__back" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回</span>
          </button>
        </div>
      </div>

      <el-skeleton v-if="loading" :rows="12" animated />

      <section v-else-if="detail" class="travel-memory-detail-sheet">
        <article class="travel-memory-polaroid-hero">
          <div class="travel-memory-polaroid-hero__gallery" aria-label="旅行照片相册">
            <div v-if="photoSlides.length" class="travel-memory-polaroid-stage">
              <figure
                v-for="(entry, index) in photoSlides"
                :key="entry.id || entry.imageUrl || index"
                class="travel-memory-polaroid"
                :class="getPhotoCardClass(index)"
                :aria-hidden="index !== activePhotoIndex"
              >
                <span class="travel-memory-polaroid__pin" aria-hidden="true">
                  <el-icon><PriceTag /></el-icon>
                </span>
                <div class="travel-memory-polaroid__photo">
                  <img :src="entry.imageUrl" :alt="entry.remark || detail.title" />
                </div>
                <figcaption class="travel-memory-polaroid__caption">
                  <span v-if="photoSlides.length > 1" class="travel-memory-polaroid__caption-pager">
                    {{ index + 1 }} / {{ photoSlides.length }}
                  </span>
                  <strong>{{ entry.remark || detail.title }}</strong>
                  <span class="travel-memory-polaroid__meta">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(entry.shotAt) || visitDate || '留白的一天' }}
                  </span>
                  <span class="travel-memory-polaroid__meta">
                    <el-icon><Location /></el-icon>
                    {{ locationText || stampLabel }}
                  </span>
                  <p>
                    <el-icon><ChatDotRound /></el-icon>
                    <span>{{ entry.thanksNote || journalQuote }}</span>
                  </p>
                </figcaption>
              </figure>
            </div>

            <div v-else class="travel-memory-polaroid-hero__empty">等待封面图片</div>

            <template v-if="photoSlides.length > 1">
              <button class="travel-memory-polaroid-hero__nav is-prev" type="button" aria-label="上一张照片" @click="switchPhoto(-1)">
                <el-icon><ArrowLeft /></el-icon>
              </button>
              <button class="travel-memory-polaroid-hero__nav is-next" type="button" aria-label="下一张照片" @click="switchPhoto(1)">
                <el-icon><ArrowRight /></el-icon>
              </button>
            </template>
          </div>

          <div class="travel-memory-polaroid-hero__copy">
            <span class="travel-memory-polaroid-hero__kicker">Travel Memory</span>
            <h1>{{ detail.title }}</h1>
            <p>{{ journalQuote }}</p>
            <div class="travel-memory-polaroid-hero__facts">
              <span v-if="locationText">
                <el-icon><Location /></el-icon>
                {{ locationText }}
              </span>
              <span v-if="visitDate">
                <el-icon><Calendar /></el-icon>
                {{ visitDate }}
              </span>
              <span>{{ photoSlides.length }} 张照片</span>
              <span>{{ storyStops.length }} 个片段</span>
            </div>
            <div class="travel-memory-polaroid-hero__stamp">
              <span>旅途邮戳</span>
              <strong>{{ stampLabel }}</strong>
            </div>
          </div>
        </article>

        <div class="travel-memory-story">
          <section class="travel-memory-prologue">
            <p>{{ journalQuote }}</p>
          </section>

          <section class="travel-memory-route-card">
            <div class="section-head">
              <h2>这趟路的节奏</h2>
              <span>{{ storyStops.length.toString().padStart(2, '0') }} Stops</span>
            </div>
            <div class="travel-memory-route">
              <div
                v-for="(stop, index) in storyStops"
                :key="stop.id || `route-${index}`"
                class="travel-memory-route-step"
                :style="{ '--route-tone': routeTones[index % routeTones.length] }"
              >
                <b>{{ String(index + 1).padStart(2, '0') }}</b>
                <h3>{{ stop.title }}</h3>
                <p>{{ stop.storyNote?.trim() || stopSceneSummary(stop) }}</p>
              </div>
            </div>
          </section>

          <section class="travel-memory-scenes">
            <div class="travel-memory-scenes__rail" aria-hidden="true"></div>
            <article
              v-for="(stop, index) in storyStops"
              :key="stop.id || `scene-${index}`"
              class="travel-memory-scene"
              :class="{ 'is-reversed': index % 2 === 1 }"
            >
              <span class="travel-memory-scene__number">{{ String(index + 1).padStart(2, '0') }}</span>
              <figure class="travel-memory-scene__photo">
                <img
                  v-if="stopCoverEntry(stop)?.imageUrl"
                  :src="stopCoverEntry(stop)?.imageUrl"
                  :alt="stopCoverEntry(stop)?.remark || stop.title"
                />
                <div v-else class="travel-memory-scene__photo-empty">等待片段照片</div>
              </figure>
              <div class="travel-memory-scene__note">
                <span class="travel-memory-scene__date">{{ stopDateText(stop) || visitDate || '旅程片段' }}</span>
                <h2>{{ stop.title }}</h2>
                <p>{{ stop.storyNote?.trim() || stopSceneSummary(stop) }}</p>
              </div>
            </article>
          </section>
        </div>
      </section>

      <section v-else class="travel-memory-detail-empty">
        <p>{{ errorMessage }}</p>
        <el-button type="primary" @click="router.push('/memory-map')">返回旅行地图</el-button>
      </section>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Calendar, ChatDotRound, Location, PriceTag } from '@element-plus/icons-vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { getTravelMemoryDetail } from '@/api/travel-memory'
import type { TravelMemoryEntry, TravelMemoryLocationDetail, TravelMemoryStop } from '@/types'
import { useSiteConfig } from '@/composables/useSiteConfig'
import { applySiteMeta, resolveSeoDescription } from '@/utils/siteConfig'

const route = useRoute()
const router = useRouter()
const { siteConfig, loadSiteConfig } = useSiteConfig()

const loading = ref(false)
const detail = ref<TravelMemoryLocationDetail | null>(null)
const errorMessage = ref('这篇旅行游记不存在或暂时无法查看。')
const activePhotoIndex = ref(0)
const routeTones = [
  'rgba(255, 198, 220, 0.56)',
  'rgba(209, 235, 247, 0.58)',
  'rgba(255, 232, 191, 0.6)',
  'rgba(219, 242, 232, 0.58)',
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
      title: detail.value.title || '旅途片段',
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

const coverEntry = computed<TravelMemoryEntry | null>(() => {
  const entries = detail.value?.entries || []
  return entries.find((entry) => entry.cover) || entries[0] || null
})

const photoSlides = computed(() => {
  const entries = (detail.value?.entries || []).slice()
  if (!entries.length) return []
  const cover = entries.find((entry) => entry.cover) || entries[0]
  const rest = entries.filter((entry) => entry !== cover)
  return [cover, ...rest]
})

const locationText = computed(() => formatLocation(detail.value))
const visitDate = computed(() => formatDateRange(detail.value?.visitedAt, detail.value?.visitedEndAt))
const stampLabel = computed(() => detail.value?.city || detail.value?.province || detail.value?.title || '旅途')
const journalQuote = computed(() => {
  const summary = detail.value?.summaryNote?.trim()
  if (summary) return summary
  const coverNote = coverEntry.value?.thanksNote?.trim()
  if (coverNote) return coverNote
  const firstNote = photoSlides.value[0]?.thanksNote?.trim()
  return firstNote || '风把旅途吹得很轻，阳光、街道和傍晚都像在慢慢发亮。'
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

function stopDateText(stop: TravelMemoryStop) {
  return formatDate(stop.visitedAt)
}

function stopSceneSummary(stop: TravelMemoryStop) {
  const cover = stopCoverEntry(stop)
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
    await loadSiteConfig().catch(() => null)
    detail.value = await getTravelMemoryDetail(numericId)
    applyDetailMeta()
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/memory-map')
}

function switchPhoto(direction: 1 | -1) {
  const total = photoSlides.value.length
  if (total <= 1) return
  activePhotoIndex.value = (activePhotoIndex.value + direction + total) % total
}

function getPhotoCardClass(index: number) {
  const total = photoSlides.value.length
  if (total <= 1) return 'is-active'

  const offset = (index - activePhotoIndex.value + total) % total
  if (offset === 0) return 'is-active'
  if (offset === 1) return 'is-next'
  if (offset === total - 1) return 'is-prev'
  return 'is-hidden'
}

watch(
  () => route.params.id,
  () => {
    activePhotoIndex.value = 0
    void loadDetail()
  },
)

watch(photoSlides, (slides) => {
  if (activePhotoIndex.value >= slides.length) {
    activePhotoIndex.value = 0
  }
})

onMounted(() => {
  void loadDetail()
})
</script>

<style scoped lang="scss">
.travel-memory-detail-page {
  width: min(1180px, calc(100vw - 72px));
  margin: clamp(18px, 2.4vw, 34px) auto 64px;
  padding-top: 98px;
}

.travel-memory-detail-sheet {
  position: relative;
  overflow: hidden;
  padding: clamp(18px, 2vw, 28px);
  border-radius: 38px;
  background:
    radial-gradient(circle at 12% 10%, rgba(255, 188, 213, 0.22), transparent 28%),
    radial-gradient(circle at 86% 22%, rgba(255, 226, 179, 0.22), transparent 26%),
    linear-gradient(135deg, rgba(255, 252, 248, 0.98), rgba(255, 244, 249, 0.9) 56%, rgba(249, 253, 255, 0.92));
  border: 1px solid rgba(239, 211, 220, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 26px 70px rgba(164, 96, 124, 0.14);
}

.travel-memory-detail__toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 285;
  padding:
    calc(11px + env(safe-area-inset-top, 0))
    calc(36px + env(safe-area-inset-right, 0))
    11px
    calc(36px + env(safe-area-inset-left, 0));
  border-bottom: 1px solid rgba(239, 211, 220, 0.9);
  background: rgba(255, 250, 253, 0.76);
  box-shadow: 0 8px 30px rgba(164, 96, 124, 0.1);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.travel-memory-detail__toolbar-inner {
  width: min(1180px, calc(100vw - 72px));
  min-height: 54px;
  margin: 0 auto;
  display: flex;
  align-items: center;
}

.travel-memory-detail__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8f6b78;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  transition: color 0.2s ease, transform 0.2s ease;
}

.travel-memory-detail__back:hover {
  color: #ff5e99;
  transform: translateY(-1px);
}

.travel-memory-polaroid-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(360px, 0.92fr) minmax(320px, 0.78fr);
  align-items: center;
  gap: clamp(28px, 5vw, 68px);
  min-height: clamp(540px, 56vw, 690px);
  padding: clamp(30px, 5vw, 72px);
  border-radius: 34px;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 179, 211, 0.28), transparent 26%),
    radial-gradient(circle at 72% 18%, rgba(255, 234, 187, 0.22), transparent 24%),
    linear-gradient(135deg, rgba(255, 252, 249, 0.96), rgba(255, 242, 248, 0.9));
  border: 1px solid rgba(239, 207, 220, 0.96);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 26px 64px rgba(155, 92, 119, 0.14);
}

.travel-memory-polaroid-hero::before {
  content: '';
  position: absolute;
  inset: 22px;
  pointer-events: none;
  border: 1px dashed rgba(224, 143, 174, 0.28);
  border-radius: 26px;
}

.travel-memory-polaroid-hero__gallery {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  min-height: clamp(460px, 48vw, 590px);
}

.travel-memory-polaroid-stage {
  position: relative;
  z-index: 2;
  width: min(78%, 430px);
  height: clamp(430px, 45vw, 560px);
  perspective: 1200px;
}

.travel-memory-polaroid {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 12px 12px 18px;
  border: 1px solid rgba(246, 222, 229, 0.96);
  border-radius: 20px 20px 16px 16px;
  background: linear-gradient(180deg, #fffefd 0%, #fffaf7 66%, #fff8f9 100%);
  box-shadow:
    0 22px 42px rgba(108, 66, 83, 0.18),
    0 2px 0 rgba(255, 255, 255, 0.9) inset,
    0 -1px 0 rgba(236, 205, 216, 0.5) inset;
  opacity: 0;
  transform-origin: center bottom;
  transition:
    opacity 0.42s ease,
    filter 0.42s ease,
    transform 0.58s cubic-bezier(0.2, 0.82, 0.2, 1);
}

.travel-memory-polaroid.is-active {
  z-index: 5;
  opacity: 1;
  transform: translate3d(0, 0, 80px) rotate(-2deg) scale(1);
}

.travel-memory-polaroid.is-prev {
  z-index: 3;
  opacity: 0.66;
  filter: saturate(0.9);
  transform: translate3d(-72px, -6px, 0) rotate(-9deg) scale(0.86);
}

.travel-memory-polaroid.is-next {
  z-index: 4;
  opacity: 0.72;
  filter: saturate(0.92);
  transform: translate3d(78px, -2px, 20px) rotate(7deg) scale(0.88);
}

.travel-memory-polaroid.is-hidden {
  z-index: 1;
  pointer-events: none;
  opacity: 0;
  filter: blur(4px);
  transform: translate3d(24px, 54px, -80px) rotate(2deg) scale(0.86);
}

.travel-memory-polaroid__pin {
  position: absolute;
  top: -15px;
  left: 50%;
  z-index: 7;
  display: grid;
  place-items: center;
  width: 56px;
  height: 28px;
  border: 1px solid rgba(244, 177, 202, 0.54);
  border-radius: 999px;
  color: #d97b9d;
  background: rgba(255, 211, 226, 0.78);
  box-shadow:
    0 10px 18px rgba(173, 98, 129, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  transform: translateX(-50%) rotate(-4deg);
}

.travel-memory-polaroid__photo {
  position: relative;
  overflow: hidden;
  height: clamp(260px, 28vw, 345px);
  border-radius: 10px;
  background: linear-gradient(135deg, #fff0f5, #edf4ff);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.72),
    0 0 0 1px rgba(225, 197, 207, 0.42);
}

.travel-memory-polaroid__photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.travel-memory-polaroid__caption {
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px 12px;
  min-height: 116px;
  padding: 15px 14px 0;
  color: #6d4b58;
  background: rgba(255, 253, 252, 0.96);
}

.travel-memory-polaroid__caption strong {
  grid-column: 1 / -1;
  overflow: hidden;
  padding-right: 80px;
  font-size: clamp(16px, 1.45vw, 20px);
  font-weight: 900;
  line-height: 1.28;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.travel-memory-polaroid__meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: #d1769a;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.travel-memory-polaroid__caption p {
  grid-column: 1 / -1;
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: #80616d;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.travel-memory-polaroid__caption-pager {
  position: absolute;
  top: 13px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  color: #c86e92;
  background: rgba(255, 247, 250, 0.86);
  border: 1px solid rgba(233, 179, 199, 0.62);
  font-size: 12px;
  font-weight: 900;
}

.travel-memory-polaroid-hero__empty {
  min-height: 420px;
  display: grid;
  place-items: center;
  border-radius: 28px;
  color: #c47b98;
  letter-spacing: 0.2em;
  background: rgba(255, 255, 255, 0.58);
  border: 1px dashed rgba(223, 145, 176, 0.48);
}

.travel-memory-polaroid-hero__copy {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: start;
  align-content: center;
}

.travel-memory-polaroid-hero__kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  color: #d17398;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}

.travel-memory-polaroid-hero__kicker::before {
  content: '';
  width: 42px;
  height: 1px;
  background: currentColor;
}

.travel-memory-polaroid-hero__copy h1 {
  margin: 0;
  color: #4c3340;
  font-family: 'Ma Shan Zheng', 'ZCOOL KuaiLe', 'PingFang SC', sans-serif;
  font-size: clamp(48px, 6.4vw, 96px);
  font-weight: 400;
  line-height: 1;
}

.travel-memory-polaroid-hero__copy p {
  max-width: 560px;
  margin: 24px 0 0;
  color: #765766;
  font-size: clamp(15px, 1.5vw, 19px);
  font-weight: 700;
  line-height: 1.9;
}

.travel-memory-polaroid-hero__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
}

.travel-memory-polaroid-hero__facts span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid rgba(235, 186, 204, 0.84);
  border-radius: 999px;
  color: #86596a;
  background: rgba(255, 255, 255, 0.68);
  font-size: 13px;
  font-weight: 800;
}

.travel-memory-polaroid-hero__stamp {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: clamp(106px, 12vw, 142px);
  height: clamp(106px, 12vw, 142px);
  margin-top: 34px;
  padding: 14px;
  border-radius: 999px;
  color: #cf6f96;
  text-align: center;
  border: 2px dashed rgba(221, 127, 163, 0.6);
  background: rgba(255, 255, 255, 0.52);
  box-shadow: inset 0 0 0 10px rgba(255, 241, 247, 0.7);
  transform: rotate(-7deg);
}

.travel-memory-polaroid-hero__stamp strong {
  max-width: 4em;
  font-size: clamp(24px, 3vw, 36px);
  line-height: 1.08;
}

.travel-memory-polaroid-hero__nav {
  position: absolute;
  top: 50%;
  z-index: 4;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  padding: 0;
  border: 1px solid rgba(233, 179, 199, 0.86);
  border-radius: 999px;
  color: #c86e92;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 16px 32px rgba(148, 91, 114, 0.18);
  cursor: pointer;
  transform: translateY(-50%);
}

.travel-memory-polaroid-hero__nav.is-prev {
  left: 2px;
}

.travel-memory-polaroid-hero__nav.is-next {
  right: 2px;
}

.travel-memory-story {
  display: grid;
  gap: 24px;
  margin-top: 24px;
}

.travel-memory-prologue,
.travel-memory-route-card,
.travel-memory-scene__note {
  border: 1px solid rgba(237, 213, 221, 0.94);
  background: rgba(255, 252, 253, 0.82);
  box-shadow: 0 12px 24px rgba(226, 196, 206, 0.12);
}

.travel-memory-prologue {
  padding: 28px 30px 24px;
  border-radius: 28px;
}

.travel-memory-prologue p {
  margin: 0;
  color: #6c4d5a;
  font-size: clamp(20px, 2vw, 28px);
  font-weight: 700;
  line-height: 1.7;
}

.travel-memory-route-card {
  padding: 24px 26px;
  border-radius: 28px;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
}

.section-head h2 {
  margin: 0;
  color: #4c3340;
  font-size: 24px;
  line-height: 1.2;
}

.section-head span {
  color: #9b7f8a;
  font-size: 13px;
  font-weight: 800;
}

.travel-memory-route {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.travel-memory-route-step {
  position: relative;
  min-height: 124px;
  padding: 18px 16px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 248, 252, 0.66)),
    linear-gradient(135deg, var(--route-tone), transparent 64%);
  border: 1px solid rgba(236, 214, 224, 0.76);
}

.travel-memory-route-step::after {
  content: '';
  position: absolute;
  top: 31px;
  right: -18px;
  width: 20px;
  height: 1px;
  background: rgba(225, 151, 180, 0.55);
}

.travel-memory-route-step:last-child::after {
  display: none;
}

.travel-memory-route-step b {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 91, 144, 0.92);
  font-size: 13px;
}

.travel-memory-route-step h3 {
  margin: 16px 0 0;
  color: #4c3340;
  font-size: 16px;
}

.travel-memory-route-step p {
  margin: 7px 0 0;
  color: #8b6f7c;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
}

.travel-memory-scenes {
  position: relative;
  display: grid;
  gap: 36px;
  padding: 6px 0 18px;
}

.travel-memory-scenes__rail {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, transparent, rgba(225, 151, 180, 0.38), transparent);
}

.travel-memory-scene {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.14fr) minmax(260px, 0.86fr);
  align-items: center;
  gap: 28px;
}

.travel-memory-scene.is-reversed {
  grid-template-columns: minmax(260px, 0.86fr) minmax(0, 1.14fr);
}

.travel-memory-scene.is-reversed .travel-memory-scene__photo {
  grid-column: 2;
}

.travel-memory-scene.is-reversed .travel-memory-scene__note {
  grid-column: 1;
  grid-row: 1;
}

.travel-memory-scene__number {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 999px;
  color: #c96e91;
  background: rgba(255, 252, 253, 0.96);
  border: 1px solid rgba(244, 207, 220, 0.96);
  box-shadow: 0 12px 28px rgba(172, 112, 138, 0.16);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.08em;
  transform: translate(-50%, -50%);
}

.travel-memory-scene__photo {
  position: relative;
  overflow: hidden;
  margin: 0;
  min-height: clamp(300px, 42vw, 520px);
  border-radius: 32px;
  background: #fff;
  box-shadow:
    0 28px 58px rgba(113, 71, 89, 0.2),
    0 0 0 10px rgba(255, 255, 255, 0.72);
  transform: rotate(-1.2deg);
}

.travel-memory-scene.is-reversed .travel-memory-scene__photo {
  transform: rotate(1.2deg);
}

.travel-memory-scene__photo img,
.travel-memory-scene__photo-empty {
  width: 100%;
  height: 100%;
  min-height: inherit;
  display: grid;
  place-items: center;
}

.travel-memory-scene__photo img {
  object-fit: cover;
}

.travel-memory-scene__photo-empty {
  color: #c47b98;
  background: linear-gradient(135deg, #fff1f5, #edf4ff);
}

.travel-memory-scene__note {
  position: relative;
  z-index: 1;
  padding: 28px 30px;
  border-radius: 30px;
}

.travel-memory-scene__date {
  display: inline-flex;
  margin-bottom: 14px;
  color: #d27798;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.travel-memory-scene__note h2 {
  margin: 0;
  color: #4d3441;
  font-size: clamp(24px, 2.8vw, 42px);
  font-weight: 900;
  line-height: 1.18;
}

.travel-memory-scene__note p {
  margin: 18px 0 0;
  color: #755a66;
  font-size: clamp(14px, 1.3vw, 17px);
  line-height: 1.9;
}

.travel-memory-detail-empty {
  display: grid;
  place-items: center;
  gap: 16px;
  min-height: 320px;
  padding: 40px 24px;
  text-align: center;
  border-radius: 28px;
  background: rgba(255, 252, 250, 0.94);
  border: 1px solid rgba(234, 216, 210, 0.9);
}

@media (max-width: 1100px) {
  .travel-memory-route {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .travel-memory-route-step:nth-child(2)::after {
    display: none;
  }
}

@media (max-width: 960px) {
  .travel-memory-polaroid-hero {
    grid-template-columns: 1fr;
  }

  .travel-memory-scenes__rail,
  .travel-memory-scene__number {
    display: none;
  }

  .travel-memory-scene,
  .travel-memory-scene.is-reversed {
    grid-template-columns: 1fr;
  }

  .travel-memory-scene.is-reversed .travel-memory-scene__photo,
  .travel-memory-scene.is-reversed .travel-memory-scene__note {
    grid-column: auto;
    grid-row: auto;
  }
}

@media (max-width: 640px) {
  .travel-memory-detail-page {
    width: min(1120px, calc(100vw - 20px));
    padding-top: 82px;
  }

  .travel-memory-detail__toolbar {
    padding:
      calc(9px + env(safe-area-inset-top, 0))
      calc(10px + env(safe-area-inset-right, 0))
      9px
      calc(10px + env(safe-area-inset-left, 0));
  }

  .travel-memory-detail__toolbar-inner {
    width: min(100vw - 20px, 100%);
    min-height: 42px;
  }

  .travel-memory-detail-sheet {
    padding: 14px;
    border-radius: 24px;
  }

  .travel-memory-polaroid-hero {
    gap: 22px;
    min-height: auto;
    padding: 24px 16px 30px;
    border-radius: 26px;
  }

  .travel-memory-polaroid-stage {
    width: min(82%, 340px);
    height: 440px;
  }

  .travel-memory-polaroid__photo {
    height: 260px;
  }

  .travel-memory-polaroid-hero__copy h1 {
    font-size: clamp(38px, 14vw, 62px);
  }

  .travel-memory-route {
    grid-template-columns: 1fr;
  }

  .travel-memory-route-step::after {
    display: none;
  }

  .travel-memory-prologue {
    padding: 24px 20px;
    border-radius: 24px;
  }

  .travel-memory-prologue p {
    font-size: 18px;
  }

  .travel-memory-scene__photo {
    min-height: 270px;
    border-radius: 24px;
    box-shadow:
      0 18px 38px rgba(113, 71, 89, 0.16),
      0 0 0 7px rgba(255, 255, 255, 0.72);
  }

  .travel-memory-scene__note {
    padding: 24px 20px;
    border-radius: 24px;
  }
}
</style>
