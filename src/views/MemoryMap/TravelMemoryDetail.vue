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

        <article class="travel-memory-journal">
          <div class="travel-memory-journal__head">
            <div class="travel-memory-journal__copy">
              <div class="travel-memory-journal__headline">
                <span class="travel-memory-journal__flower">✿</span>
                <h1>{{ detail.title }}</h1>
              </div>
              <div class="travel-memory-journal__facts">
                <span v-if="locationText" class="travel-memory-journal__fact">
                  <el-icon><Location /></el-icon>
                  <span>{{ locationText }}</span>
                </span>
                <span v-if="visitDate" class="travel-memory-journal__fact">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ visitDate }}</span>
                </span>
              </div>
            </div>

            <div class="travel-memory-journal__stamp">
              <span>旅途邮戳</span>
              <strong>{{ stampLabel }}</strong>
            </div>
          </div>

          <div class="travel-memory-journal__quote">
            <span class="travel-memory-journal__quote-mark">❝</span>
            <p>{{ journalQuote }}</p>
          </div>

          <div class="travel-memory-journal__cover">
            <img class="travel-memory-journal__tape" :src="tapeCornerAsset" alt="" aria-hidden="true" />
            <img v-if="coverEntry?.imageUrl" :src="coverEntry.imageUrl" :alt="coverEntry.remark || detail.title" />
            <div v-else class="travel-memory-journal__cover-empty">等待封面图片</div>
            <span class="travel-memory-journal__seal" aria-hidden="true">✿</span>
          </div>

          <div v-if="entryCards.length" class="travel-memory-journal__entries">
            <article
              v-for="entry in entryCards"
              :key="entry.id || entry.imageUrl"
              class="travel-memory-note"
            >
              <div class="travel-memory-note__thumb">
                <img :src="entry.imageUrl" :alt="entry.remark || detail.title" />
              </div>
              <div class="travel-memory-note__body">
                <h2 v-if="entry.remark">{{ entry.remark }}</h2>
                <p>{{ entry.thanksNote || '把这一刻留给未来，再慢慢翻阅。' }}</p>
                <span>{{ formatDate(entry.shotAt) || '留白的一天' }}</span>
              </div>
            </article>
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
import { ArrowLeft, Calendar, Location } from '@element-plus/icons-vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { getTravelMemoryDetail } from '@/api/travel-memory'
import type { TravelMemoryEntry, TravelMemoryLocationDetail } from '@/types'
import { useSiteConfig } from '@/composables/useSiteConfig'
import { applySiteMeta, resolveSeoDescription } from '@/utils/siteConfig'
import tapeCornerAsset from '@/assets/memory-map/tape-corner.svg'

const route = useRoute()
const router = useRouter()
const { siteConfig, loadSiteConfig } = useSiteConfig()

const loading = ref(false)
const detail = ref<TravelMemoryLocationDetail | null>(null)
const errorMessage = ref('这篇旅行游记不存在或暂时无法查看。')

const coverEntry = computed<TravelMemoryEntry | null>(() => {
  const entries = detail.value?.entries || []
  return entries.find((entry) => entry.cover) || entries[0] || null
})
const entryCards = computed(() => {
  const entries = detail.value?.entries || []
  return entries.slice(0, 3)
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

watch(
  () => route.params.id,
  () => {
    void loadDetail()
  },
)

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
</style>
