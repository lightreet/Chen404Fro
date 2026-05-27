<template>
  <DefaultLayout :wide-content="true" :show-live2-d="false">
    <div class="travel-memory-detail-page">
      <el-skeleton v-if="loading" :rows="12" animated />

      <section v-else-if="detail" class="travel-memory-detail-sheet">
        <div class="travel-memory-detail__toolbar">
          <el-button text class="travel-memory-detail__back" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <el-button text class="travel-memory-detail__map-link" @click="router.push('/memory-map')">
            回到旅行地图
          </el-button>
        </div>

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
              <span>{{ entryCards.length }} 张照片</span>
            </div>
            <div class="travel-memory-polaroid-hero__stamp">
              <span>旅途邮戳</span>
              <strong>{{ stampLabel }}</strong>
            </div>
          </div>
        </article>
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
import type { TravelMemoryEntry, TravelMemoryLocationDetail } from '@/types'
import { useSiteConfig } from '@/composables/useSiteConfig'
import { applySiteMeta, resolveSeoDescription } from '@/utils/siteConfig'

const route = useRoute()
const router = useRouter()
const { siteConfig, loadSiteConfig } = useSiteConfig()

const loading = ref(false)
const detail = ref<TravelMemoryLocationDetail | null>(null)
const errorMessage = ref('这篇旅行游记不存在或暂时无法查看。')
const activePhotoIndex = ref(0)

const coverEntry = computed<TravelMemoryEntry | null>(() => {
  const entries = detail.value?.entries || []
  return entries.find((entry) => entry.cover) || entries[0] || null
})
const entryCards = computed(() => {
  const entries = detail.value?.entries || []
  return entries
})
const photoSlides = computed(() => {
  const entries = entryCards.value
  if (!entries.length) return []
  const cover = coverEntry.value
  const rest = entries.filter((entry) => entry !== cover)
  return [cover, ...rest].filter(Boolean) as TravelMemoryEntry[]
})
const locationText = computed(() => formatLocation(detail.value))
const visitDate = computed(() => formatDateRange(detail.value?.visitedAt, detail.value?.visitedEndAt))
const stampLabel = computed(() => detail.value?.city || detail.value?.province || detail.value?.title || '旅途')
const journalQuote = computed(() => {
  const summary = detail.value?.summaryNote?.trim()
  if (summary) return summary
  const coverNote = coverEntry.value?.thanksNote?.trim()
  if (coverNote) return coverNote
  const firstNote = entryCards.value[0]?.thanksNote?.trim()
  return firstNote || '海风把旅途吹得很轻，阳光、街道和傍晚都像在慢慢发亮。'
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
  width: min(1120px, calc(100vw - 72px));
  margin: clamp(20px, 2.5vw, 34px) auto 52px;
}

.eyebrow {
  display: inline-block;
  color: #d18ca5;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.travel-memory-detail-sheet {
  padding: clamp(24px, 2vw, 30px);
  border-radius: 34px;
  background:
    linear-gradient(180deg, rgba(255, 252, 250, 0.96), rgba(255, 246, 243, 0.84)),
    radial-gradient(circle at top right, rgba(255, 226, 234, 0.18), transparent 30%);
  border: 1px solid rgba(234, 216, 210, 0.94);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 24px 48px rgba(219, 189, 194, 0.14);
}

.travel-memory-detail__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.travel-memory-detail__back,
.travel-memory-detail__map-link {
  color: #8f6b78;
  font-weight: 600;
}

.travel-memory-journal {
  display: grid;
  gap: 24px;
}

.travel-memory-journal__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.travel-memory-journal__copy {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.travel-memory-journal__headline {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.travel-memory-journal__flower {
  color: #db7f9d;
  font-size: 26px;
  line-height: 1;
  transform: translateY(8px);
}

.travel-memory-journal__headline h1 {
  margin: 0;
  color: #4c333d;
  font-family:
    'Microsoft YaHei UI',
    'PingFang SC',
    'Hiragino Sans GB',
    'Noto Sans CJK SC',
    sans-serif;
  font-size: clamp(34px, 3vw, 48px);
  font-weight: 700;
  line-height: 1.12;
}

.travel-memory-journal__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
}

.travel-memory-journal__fact {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #7f626e;
  font-size: 14px;
  line-height: 1.4;
}

.travel-memory-journal__fact .el-icon {
  color: #df8aa8;
  font-size: 15px;
}

.travel-memory-journal__stamp {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 134px;
  min-height: 134px;
  padding: 16px;
  border-radius: 999px;
  color: #cf7f9c;
  text-align: center;
  border: 2px dashed rgba(232, 149, 180, 0.7);
  box-shadow: inset 0 0 0 12px rgba(255, 247, 249, 0.55);
  transform: rotate(-8deg);
}

.travel-memory-journal__stamp span {
  font-size: 18px;
  line-height: 1.1;
}

.travel-memory-journal__stamp strong {
  font-size: 34px;
  line-height: 1.1;
}

.travel-memory-journal__cover {
  position: relative;
  overflow: hidden;
  height: clamp(320px, 38vw, 500px);
  padding: 12px;
  border-radius: 30px;
  background: rgba(255, 252, 253, 0.72);
  border: 1px solid rgba(238, 219, 226, 0.94);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.travel-memory-journal__cover img:not(.travel-memory-journal__tape) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 22px;
}

.travel-memory-journal__tape {
  position: absolute;
  top: 18px;
  left: 38px;
  width: 96px;
  opacity: 0.92;
  z-index: 2;
}

.travel-memory-journal__seal {
  position: absolute;
  right: 18px;
  bottom: 18px;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: rgba(255, 252, 253, 0.96);
  color: #dd8aa8;
  font-size: 24px;
  box-shadow: 0 10px 20px rgba(217, 185, 195, 0.18);
}

.travel-memory-journal__cover-empty {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  border-radius: 22px;
  color: #c58aa1;
  letter-spacing: 0.18em;
  background: linear-gradient(135deg, #fff1f5, #f8fbff);
}

.travel-memory-journal__entries {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 286px));
  justify-content: start;
  gap: 18px;
}

.travel-memory-note {
  overflow: hidden;
  display: grid;
  grid-template-rows: 172px 1fr;
  min-height: 374px;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 250, 252, 0.9)),
    radial-gradient(circle at top right, rgba(255, 230, 238, 0.2), transparent 40%);
  border: 1px solid rgba(239, 218, 227, 0.96);
  box-shadow:
    0 16px 30px rgba(222, 190, 200, 0.13),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.travel-memory-note__thumb {
  background: linear-gradient(135deg, #fff0f5, #f5f8ff);
}

.travel-memory-note__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.travel-memory-note__body {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 10px;
  min-height: 202px;
  padding: 15px 17px 16px;
  border-top: 1px solid rgba(244, 224, 231, 0.86);
}

.travel-memory-note__body h2 {
  margin: 0;
  color: #4f3c46;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.36;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.travel-memory-note__body p {
  margin: 0;
  color: #7f6c76;
  font-size: 13px;
  line-height: 1.72;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.travel-memory-note__body span {
  align-self: end;
  padding-top: 10px;
  border-top: 1px solid rgba(244, 224, 231, 0.86);
  color: #c57f9a;
  font-size: 12px;
  font-weight: 600;
}

.travel-memory-journal__quote {
  position: relative;
  padding: 28px 30px 24px 62px;
  border-radius: 28px;
  background: rgba(255, 252, 253, 0.78);
  border: 1px solid rgba(237, 213, 221, 0.94);
  box-shadow: 0 12px 24px rgba(226, 196, 206, 0.12);
}

.travel-memory-journal__quote-mark {
  position: absolute;
  top: 20px;
  left: 22px;
  color: #ff8fb1;
  font-size: 20px;
  line-height: 1;
}

.travel-memory-journal__quote p {
  margin: 0;
  color: #6c4d5a;
  font-size: clamp(20px, 2vw, 28px);
  font-weight: 700;
  line-height: 1.7;
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

@media (max-width: 960px) {
  .travel-memory-detail-page {
    width: min(1120px, calc(100vw - 32px));
  }

  .travel-memory-journal__head {
    flex-direction: column;
  }

  .travel-memory-journal__entries {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .travel-memory-detail-page {
    width: min(1120px, calc(100vw - 20px));
  }

  .travel-memory-detail-sheet {
    padding: 18px;
    border-radius: 24px;
  }

  .travel-memory-detail__toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .travel-memory-journal__cover {
    height: 240px;
    border-radius: 24px;
  }

  .travel-memory-journal__cover img:not(.travel-memory-journal__tape),
  .travel-memory-journal__cover-empty {
    border-radius: 18px;
  }

  .travel-memory-journal__quote {
    padding: 24px 20px 20px 48px;
  }

  .travel-memory-journal__quote p {
    font-size: 18px;
  }
}

.travel-memory-detail-page {
  width: min(1180px, calc(100vw - 72px));
  margin: clamp(18px, 2.4vw, 34px) auto 64px;
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

.travel-memory-detail-sheet::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.42;
  background-image:
    linear-gradient(rgba(218, 150, 176, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(218, 150, 176, 0.06) 1px, transparent 1px);
  background-size: 34px 34px;
}

.travel-memory-detail__toolbar,
.travel-memory-story {
  position: relative;
  z-index: 1;
}

.travel-memory-story {
  display: grid;
  gap: clamp(22px, 3vw, 42px);
}

.travel-memory-hero {
  position: relative;
  overflow: hidden;
  min-height: clamp(520px, 64vw, 720px);
  border-radius: 34px;
  isolation: isolate;
  background: #2f2228;
  box-shadow:
    0 28px 68px rgba(85, 45, 62, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.travel-memory-hero__media,
.travel-memory-hero__media img,
.travel-memory-hero__empty {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.travel-memory-hero__media img {
  object-fit: cover;
  transform: scale(1.02);
  filter: saturate(1.04) contrast(1.02);
}

.travel-memory-hero__empty {
  display: grid;
  place-items: center;
  color: #f4b7ca;
  letter-spacing: 0.22em;
  background:
    radial-gradient(circle at 42% 28%, rgba(255, 188, 213, 0.36), transparent 30%),
    linear-gradient(135deg, #46313c, #271c24);
}

.travel-memory-hero__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(30, 20, 27, 0.82), rgba(30, 20, 27, 0.34) 48%, rgba(30, 20, 27, 0.14)),
    linear-gradient(0deg, rgba(30, 20, 27, 0.84), transparent 44%);
}

.travel-memory-hero__content {
  position: absolute;
  left: clamp(24px, 5vw, 72px);
  bottom: clamp(30px, 5vw, 72px);
  z-index: 2;
  width: min(680px, calc(100% - 48px));
  color: #fff;
}

.travel-memory-hero__kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  color: rgba(255, 214, 226, 0.92);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.travel-memory-hero__kicker::before {
  content: '';
  width: 42px;
  height: 1px;
  background: currentColor;
}

.travel-memory-hero__content h1 {
  margin: 0;
  max-width: 9em;
  color: #fffafc;
  font-family:
    'Ma Shan Zheng',
    'ZCOOL KuaiLe',
    'PingFang SC',
    sans-serif;
  font-size: clamp(46px, 7vw, 108px);
  font-weight: 400;
  line-height: 0.98;
  text-shadow: 0 18px 42px rgba(35, 18, 26, 0.42);
}

.travel-memory-hero__content p {
  max-width: 620px;
  margin: 24px 0 0;
  color: rgba(255, 248, 250, 0.86);
  font-size: clamp(16px, 1.5vw, 21px);
  font-weight: 600;
  line-height: 1.8;
}

.travel-memory-hero__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

.travel-memory-hero__facts span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  color: rgba(255, 249, 251, 0.92);
  background: rgba(255, 255, 255, 0.12);
  font-size: 13px;
  font-weight: 700;
  backdrop-filter: blur(14px);
}

.travel-memory-hero__facts .el-icon {
  color: #ffd2df;
  font-size: 15px;
}

.travel-memory-hero__stamp {
  position: absolute;
  top: clamp(22px, 3vw, 40px);
  right: clamp(22px, 3vw, 40px);
  z-index: 2;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: clamp(116px, 13vw, 158px);
  height: clamp(116px, 13vw, 158px);
  padding: 16px;
  border-radius: 999px;
  color: rgba(255, 242, 248, 0.98);
  text-align: center;
  border: 2px dashed rgba(255, 223, 235, 0.74);
  background: rgba(91, 48, 67, 0.24);
  box-shadow:
    inset 0 0 0 12px rgba(255, 247, 249, 0.08),
    0 18px 42px rgba(35, 18, 26, 0.2);
  transform: rotate(8deg);
  backdrop-filter: blur(14px);
}

.travel-memory-hero__stamp span {
  font-size: 16px;
  line-height: 1.1;
}

.travel-memory-hero__stamp strong {
  max-width: 4em;
  font-size: clamp(26px, 3.4vw, 42px);
  line-height: 1.1;
}

.travel-memory-hero__tape {
  position: absolute;
  z-index: 2;
  width: clamp(82px, 9vw, 118px);
  opacity: 0.88;
  filter: drop-shadow(0 10px 18px rgba(55, 25, 37, 0.16));
}

.travel-memory-hero__tape--left {
  top: 22px;
  left: 32px;
  transform: rotate(-12deg);
}

.travel-memory-hero__tape--right {
  right: 34px;
  bottom: 34px;
  transform: rotate(168deg);
}

.travel-memory-prologue {
  position: relative;
  width: min(880px, 100%);
  margin: 0 auto;
  padding: clamp(24px, 4vw, 42px) clamp(24px, 5vw, 58px);
  border: 1px solid rgba(238, 207, 220, 0.94);
  border-radius: 32px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 246, 250, 0.72)),
    radial-gradient(circle at top left, rgba(255, 188, 213, 0.2), transparent 34%);
  box-shadow: 0 20px 48px rgba(172, 112, 138, 0.12);
}

.travel-memory-prologue__mark {
  position: absolute;
  top: 18px;
  left: 22px;
  color: rgba(255, 143, 177, 0.72);
  font-size: 26px;
  line-height: 1;
}

.travel-memory-prologue p {
  margin: 0;
  color: #5f4050;
  font-size: clamp(20px, 2.4vw, 34px);
  font-weight: 800;
  line-height: 1.7;
  text-align: center;
}

.travel-memory-scenes {
  position: relative;
  display: grid;
  gap: clamp(28px, 5vw, 70px);
  padding: 12px 0 18px;
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
  gap: clamp(22px, 4vw, 54px);
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

.travel-memory-scene__photo::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, transparent 62%, rgba(43, 25, 34, 0.2)),
    radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.22), transparent 28%);
}

.travel-memory-scene__photo img {
  width: 100%;
  height: 100%;
  min-height: inherit;
  display: block;
  object-fit: cover;
}

.travel-memory-scene__note {
  position: relative;
  z-index: 1;
  padding: clamp(24px, 4vw, 42px);
  border: 1px solid rgba(240, 211, 222, 0.96);
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 248, 251, 0.84)),
    radial-gradient(circle at top right, rgba(255, 205, 224, 0.2), transparent 36%);
  box-shadow: 0 18px 42px rgba(172, 112, 138, 0.12);
}

.travel-memory-scene__note::before {
  content: '';
  position: absolute;
  top: -14px;
  left: 34px;
  width: 78px;
  height: 26px;
  border-radius: 999px;
  background: rgba(255, 207, 223, 0.5);
  transform: rotate(-5deg);
}

.travel-memory-scene.is-reversed .travel-memory-scene__note::before {
  left: auto;
  right: 34px;
  transform: rotate(5deg);
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

.travel-memory-polaroid-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(420px, 1.05fr) minmax(320px, 0.95fr);
  align-items: center;
  gap: clamp(28px, 5vw, 68px);
  min-height: clamp(520px, 58vw, 680px);
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

.travel-memory-polaroid-hero::after {
  content: '';
  position: absolute;
  right: clamp(22px, 4vw, 54px);
  bottom: clamp(20px, 4vw, 52px);
  width: clamp(120px, 16vw, 210px);
  height: clamp(120px, 16vw, 210px);
  border-radius: 999px;
  pointer-events: none;
  background: radial-gradient(circle, rgba(255, 167, 199, 0.2), transparent 66%);
}

.travel-memory-polaroid-hero__stack {
  position: relative;
  z-index: 1;
  min-height: clamp(420px, 48vw, 560px);
}

.travel-memory-polaroid {
  position: absolute;
  margin: 0;
  padding: clamp(10px, 1.2vw, 14px) clamp(10px, 1.2vw, 14px) clamp(48px, 5vw, 68px);
  border-radius: 10px;
  background:
    linear-gradient(180deg, #fff, #fff8f4),
    radial-gradient(circle at top left, rgba(255, 224, 234, 0.46), transparent 42%);
  box-shadow:
    0 28px 50px rgba(108, 66, 83, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
  transform-origin: center;
}

.travel-memory-polaroid::before {
  content: '';
  position: absolute;
  top: -18px;
  left: 50%;
  z-index: 2;
  width: 82px;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 207, 223, 0.64);
  box-shadow: 0 8px 16px rgba(148, 91, 114, 0.12);
  transform: translateX(-50%) rotate(-4deg);
}

.travel-memory-polaroid img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: 5px;
  filter: saturate(1.03) contrast(1.02);
}

.travel-memory-polaroid figcaption {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  overflow: hidden;
  color: #70515d;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.travel-memory-polaroid--1 {
  left: 12%;
  top: 10%;
  z-index: 4;
  width: min(68%, 430px);
  height: clamp(330px, 37vw, 470px);
  transform: rotate(-3deg);
}

.travel-memory-polaroid--2 {
  right: 2%;
  top: 5%;
  z-index: 3;
  width: min(44%, 290px);
  height: clamp(220px, 25vw, 310px);
  transform: rotate(9deg);
}

.travel-memory-polaroid--3 {
  left: 0;
  bottom: 5%;
  z-index: 2;
  width: min(42%, 280px);
  height: clamp(210px, 24vw, 300px);
  transform: rotate(-12deg);
}

.travel-memory-polaroid--4 {
  right: 13%;
  bottom: 0;
  z-index: 1;
  width: min(38%, 250px);
  height: clamp(190px, 21vw, 270px);
  transform: rotate(5deg);
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
  font-family:
    'Ma Shan Zheng',
    'ZCOOL KuaiLe',
    'PingFang SC',
    sans-serif;
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
  box-shadow: 0 10px 20px rgba(208, 151, 174, 0.1);
}

.travel-memory-polaroid-hero__facts .el-icon {
  color: #da7ea2;
  font-size: 15px;
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

.travel-memory-polaroid-hero__stamp span {
  font-size: 14px;
  line-height: 1.1;
}

.travel-memory-polaroid-hero__stamp strong {
  max-width: 4em;
  font-size: clamp(24px, 3vw, 36px);
  line-height: 1.08;
}

@media (max-width: 960px) {
  .travel-memory-polaroid-hero {
    grid-template-columns: 1fr;
  }

  .travel-memory-polaroid-hero__stack {
    min-height: 520px;
  }

  .travel-memory-hero {
    min-height: 580px;
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
  }

  .travel-memory-detail-sheet {
    padding: 14px;
    border-radius: 24px;
  }

  .travel-memory-polaroid-hero {
    gap: 22px;
    min-height: auto;
    padding: 24px 18px 28px;
    border-radius: 26px;
  }

  .travel-memory-polaroid-hero__stack {
    min-height: 430px;
  }

  .travel-memory-polaroid--1 {
    left: 9%;
    width: 76%;
    height: 310px;
  }

  .travel-memory-polaroid--2 {
    right: 0;
    width: 44%;
    height: 190px;
  }

  .travel-memory-polaroid--3 {
    width: 46%;
    height: 180px;
  }

  .travel-memory-polaroid--4 {
    right: 6%;
    width: 42%;
    height: 170px;
  }

  .travel-memory-polaroid-hero__copy h1 {
    font-size: clamp(38px, 14vw, 62px);
  }

  .travel-memory-polaroid-hero__copy p {
    font-size: 15px;
  }

  .travel-memory-polaroid-hero__stamp {
    width: 96px;
    height: 96px;
    margin-top: 24px;
  }

  .travel-memory-hero {
    min-height: 520px;
    border-radius: 26px;
  }

  .travel-memory-hero__content {
    left: 20px;
    bottom: 24px;
    width: calc(100% - 40px);
  }

  .travel-memory-hero__content h1 {
    font-size: clamp(38px, 14vw, 62px);
  }

  .travel-memory-hero__content p {
    font-size: 15px;
  }

  .travel-memory-hero__stamp {
    width: 92px;
    height: 92px;
    top: 16px;
    right: 16px;
    padding: 12px;
  }

  .travel-memory-hero__stamp span {
    font-size: 12px;
  }

  .travel-memory-hero__stamp strong {
    font-size: 22px;
  }

  .travel-memory-prologue {
    padding: 24px 20px;
    border-radius: 24px;
  }

  .travel-memory-prologue p {
    font-size: 18px;
    text-align: left;
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

.travel-memory-polaroid-hero {
  isolation: isolate;
  grid-template-columns: minmax(360px, 0.92fr) minmax(320px, 0.78fr);
  min-height: clamp(540px, 56vw, 690px);
}

.travel-memory-polaroid-hero__gallery {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  min-height: clamp(460px, 48vw, 590px);
}

.travel-memory-polaroid-hero__stack {
  position: absolute;
  inset: 9% 7% 7% 9%;
  min-height: 0;
  pointer-events: none;
}

.travel-memory-polaroid-ghost {
  position: absolute;
  inset: 0;
  border-radius: 13px;
  background:
    linear-gradient(180deg, #fffefd 0%, #fff8f4 100%),
    radial-gradient(circle at 20% 0%, rgba(255, 212, 225, 0.52), transparent 38%);
  box-shadow: 0 22px 44px rgba(108, 66, 83, 0.14);
}

.travel-memory-polaroid-ghost--1 {
  transform: translate(22px, -18px) rotate(5deg);
}

.travel-memory-polaroid-ghost--2 {
  transform: translate(-24px, 18px) rotate(-6deg);
}

.travel-memory-polaroid-ghost--3 {
  transform: translate(34px, 28px) rotate(9deg);
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
  background:
    linear-gradient(180deg, #fffefd 0%, #fffaf7 66%, #fff8f9 100%);
  box-shadow:
    0 22px 42px rgba(108, 66, 83, 0.18),
    0 2px 0 rgba(255, 255, 255, 0.9) inset,
    0 -1px 0 rgba(236, 205, 216, 0.5) inset;
  opacity: 0;
  transform-origin: center bottom;
  transition:
    opacity 0.42s ease,
    filter 0.42s ease,
    transform 0.58s cubic-bezier(0.2, 0.82, 0.2, 1),
    z-index 0s linear 0.2s;
  will-change: transform, opacity, filter;
}

.travel-memory-polaroid.is-active {
  z-index: 5;
  opacity: 1;
  filter: none;
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
  filter: saturate(1.04) contrast(1.02);
}

.travel-memory-polaroid__photo::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent 34%),
    linear-gradient(0deg, rgba(90, 48, 66, 0.08), transparent 36%);
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

.travel-memory-polaroid__caption {
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px 12px;
  min-height: clamp(116px, 11vw, 140px);
  padding: 15px 14px 0;
  border-radius: 0 0 10px 10px;
  color: #6d4b58;
  background: rgba(255, 253, 252, 0.96);
  box-shadow: inset 0 1px 0 rgba(226, 196, 207, 0.5);
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

.travel-memory-polaroid__meta .el-icon {
  flex: 0 0 auto;
  font-size: 14px;
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

.travel-memory-polaroid__caption p .el-icon {
  margin-right: 5px;
  color: #d1769a;
  transform: translateY(2px);
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
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
  font-size: 12px;
  font-weight: 900;
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
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.travel-memory-polaroid-hero__nav:hover {
  background: #fff;
  box-shadow: 0 20px 38px rgba(148, 91, 114, 0.24);
  transform: translateY(-50%) scale(1.06);
}

.travel-memory-polaroid-hero__nav.is-prev {
  left: 2px;
}

.travel-memory-polaroid-hero__nav.is-next {
  right: 2px;
}

.travel-memory-polaroid-hero__pager {
  position: absolute;
  right: 10%;
  bottom: 0;
  z-index: 4;
  padding: 7px 13px;
  border: 1px solid rgba(233, 179, 199, 0.72);
  border-radius: 999px;
  color: #c86e92;
  background: rgba(255, 255, 255, 0.78);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  box-shadow: 0 12px 24px rgba(148, 91, 114, 0.12);
}

@media (max-width: 960px) {
  .travel-memory-polaroid-hero {
    grid-template-columns: 1fr;
  }

  .travel-memory-polaroid-hero__gallery {
    min-height: 500px;
  }
}

@media (max-width: 640px) {
  .travel-memory-polaroid-hero {
    padding: 24px 16px 30px;
  }

  .travel-memory-polaroid-hero__gallery {
    min-height: 470px;
  }

  .travel-memory-polaroid-stage {
    width: min(82%, 340px);
    height: 440px;
  }

  .travel-memory-polaroid__photo {
    height: 260px;
  }

  .travel-memory-polaroid__caption {
    min-height: 126px;
  }

  .travel-memory-polaroid-hero__nav {
    width: 40px;
    height: 40px;
  }
}
</style>
