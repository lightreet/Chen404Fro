<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="旅行纪念地图"
        eyebrow="Memory Map"
        subtitle="把去过的地方，连成一张只对知友开放的私藏宝图。"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="72vh"
        :overlay-opacity="0.42"
        compact
      />
    </template>

    <div class="memory-map-page">
      <section class="memory-map-overview glass-panel">
        <div>
          <span class="eyebrow">Private Atlas</span>
          <h2>只留给知友看的旅行痕迹</h2>
          <p>每一个点位，都是一次停留、一次拍照、一次认真保存下来的心情。</p>
        </div>
        <div class="overview-stats">
          <div>
            <span>地点数</span>
            <strong>{{ locations.length }}</strong>
          </div>
          <div>
            <span>已选地点</span>
            <strong>{{ activeDetail?.city || activeDetail?.title || '未选择' }}</strong>
          </div>
        </div>
      </section>

      <TravelMemoryManager
        v-if="canManage"
        :selected-id="activeId"
        @changed="handleManagerChanged"
        @focus="handleSelectLocation"
      />

      <div class="memory-map-grid">
        <section class="glass-panel map-panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow">Map View</span>
              <h3>旅行落点</h3>
            </div>
          </div>
          <TravelMemoryMap
            :locations="locations"
            :active-id="activeId"
            @select="handleSelectLocation"
          />
        </section>

        <section class="glass-panel detail-panel">
          <div v-if="loadingDetail" class="detail-loading">地点详情加载中...</div>
          <template v-else-if="activeDetail">
            <div class="panel-head panel-head--detail">
              <div>
                <span class="eyebrow">Memory Detail</span>
                <h3>{{ activeDetail.title }}</h3>
              </div>
              <div class="detail-meta">
                <span>{{ formatLocation(activeDetail) }}</span>
                <span v-if="activeDetail.visitedAt">{{ formatDate(activeDetail.visitedAt) }}</span>
              </div>
            </div>

            <p v-if="activeDetail.summaryNote" class="detail-summary">{{ activeDetail.summaryNote }}</p>

            <el-carousel
              v-if="activeDetail.entries?.length"
              :interval="5000"
              height="260px"
              class="detail-carousel"
            >
              <el-carousel-item v-for="entry in activeDetail.entries" :key="entry.id || entry.imageUrl">
                <div class="detail-slide">
                  <img :src="entry.imageUrl" :alt="entry.remark || activeDetail.title" />
                </div>
              </el-carousel-item>
            </el-carousel>

            <div class="entry-list">
              <article
                v-for="entry in activeDetail.entries"
                :key="entry.id || entry.imageUrl"
                class="entry-card"
              >
                <div class="entry-card__top">
                  <span class="entry-chip" :class="{ 'entry-chip--cover': entry.cover }">
                    {{ entry.cover ? '封面' : '照片' }}
                  </span>
                  <span v-if="entry.shotAt" class="entry-time">{{ formatDate(entry.shotAt) }}</span>
                </div>
                <h4 v-if="entry.remark">{{ entry.remark }}</h4>
                <p v-if="entry.thanksNote">{{ entry.thanksNote }}</p>
              </article>
            </div>
          </template>
          <div v-else class="detail-empty">先从地图上点开一个地点吧。</div>
        </section>
      </div>

      <section class="glass-panel location-list-panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Locations</span>
            <h3>地点列表</h3>
          </div>
        </div>

        <div v-if="loading" class="list-loading">地点加载中...</div>
        <div v-else-if="!locations.length" class="list-empty">还没有可展示的旅行回忆。</div>
        <div v-else class="location-grid">
          <button
            v-for="location in locations"
            :key="location.id"
            type="button"
            class="location-card"
            :class="{ 'is-active': activeId === location.id }"
            @click="handleSelectLocation(location.id)"
          >
            <div class="location-card__cover">
              <img v-if="location.coverImage" :src="location.coverImage" :alt="location.title" />
              <div v-else class="location-card__cover-empty">MEMORY MAP</div>
            </div>
            <div class="location-card__body">
              <h4>{{ location.title }}</h4>
              <p>{{ formatLocation(location) }}</p>
              <span>{{ location.entryCount || 0 }} 张照片</span>
            </div>
          </button>
        </div>
      </section>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import TravelMemoryManager from '@/components/TravelMemoryManager/TravelMemoryManager.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import TravelMemoryMap from '@/components/TravelMemoryMap/TravelMemoryMap.vue'
import { getTravelMemories, getTravelMemoryDetail } from '@/api/travel-memory'
import { useSiteConfig } from '@/composables/useSiteConfig'
import { useUserStore } from '@/stores/user'
import type { TravelMemoryLocationDetail, TravelMemoryLocationListItem } from '@/types'
import { isAdminUser } from '@/utils/permission'
import { resolveHeroImage, resolveHeroImagePosition } from '@/utils/siteConfig'

const DEFAULT_HERO =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1920&q=80'
const DEFAULT_HERO_POSITION = '50% 48%'

const { siteConfig, loadSiteConfig } = useSiteConfig()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const heroBgImage = ref(DEFAULT_HERO)
const heroBgPosition = ref(DEFAULT_HERO_POSITION)
const loading = ref(false)
const loadingDetail = ref(false)
const locations = ref<TravelMemoryLocationListItem[]>([])
const activeId = ref<number | null>(null)
const activeDetail = ref<TravelMemoryLocationDetail | null>(null)
const detailCache = ref<Record<number, TravelMemoryLocationDetail>>({})
const canManage = computed(() => isAdminUser(user.value))

async function loadMemories(preferredId?: number | null) {
  loading.value = true
  try {
    const list = await getTravelMemories()
    locations.value = list || []
    const nextId =
      preferredId != null && locations.value.some((item) => item.id === preferredId)
        ? preferredId
        : activeId.value != null && locations.value.some((item) => item.id === activeId.value)
          ? activeId.value
          : locations.value[0]?.id

    if (nextId != null) {
      await handleSelectLocation(nextId)
    } else {
      activeId.value = null
      activeDetail.value = null
    }
  } catch {
    ElMessage.error('旅行纪念地图加载失败')
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

function formatDate(value?: string) {
  return value ? dayjs(value).format('YYYY.MM.DD HH:mm') : ''
}

function formatLocation(location?: { province?: string; city?: string }) {
  if (!location) return '未标注地点'
  return [location.province, location.city].filter(Boolean).join(' · ') || '未标注地点'
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
  display: grid;
  gap: 24px;
}

.glass-panel {
  border-radius: 28px;
  padding: 24px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 248, 251, 0.76)),
    radial-gradient(circle at top right, rgba(255, 221, 232, 0.24), transparent 34%);
  border: 1px solid rgba(236, 220, 228, 0.82);
  box-shadow: 0 18px 40px rgba(215, 184, 196, 0.12);
}

.eyebrow {
  display: inline-block;
  color: #c57f9a;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.memory-map-overview {
  display: flex;
  justify-content: space-between;
  gap: 24px;

  h2 {
    margin: 8px 0;
    font-size: 28px;
    color: #4e3441;
  }

  p {
    color: var(--text-secondary);
  }
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
  gap: 14px;

  div {
    padding: 16px 18px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(238, 224, 231, 0.9);
  }

  span {
    display: block;
    font-size: 12px;
    color: var(--text-tertiary);
  }

  strong {
    display: block;
    margin-top: 10px;
    color: #5d3d4b;
    font-size: 18px;
  }
}

.memory-map-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr);
  gap: 24px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;

  h3 {
    margin: 6px 0 0;
    color: var(--text-primary);
    font-size: 22px;
  }
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: right;
  color: var(--text-tertiary);
  font-size: 12px;
}

.detail-summary {
  margin-bottom: 18px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.detail-carousel {
  margin-bottom: 20px;
  border-radius: 22px;
  overflow: hidden;
}

.detail-slide {
  width: 100%;
  height: 100%;
  background: rgba(249, 244, 247, 0.8);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.entry-list {
  display: grid;
  gap: 14px;
}

.entry-card {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(239, 226, 233, 0.9);

  h4 {
    margin: 10px 0 6px;
    color: #5c3f4d;
    font-size: 15px;
  }

  p {
    color: var(--text-secondary);
    line-height: 1.8;
    white-space: pre-wrap;
  }
}

.entry-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.entry-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 239, 245, 0.9);
  color: #b26d88;
  font-size: 12px;
}

.entry-chip--cover {
  background: rgba(255, 225, 236, 0.96);
  color: #ff5f8b;
}

.entry-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.detail-loading,
.detail-empty,
.list-loading,
.list-empty {
  min-height: 160px;
  display: grid;
  place-items: center;
  text-align: center;
  color: var(--text-secondary);
}

.location-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.location-card {
  border: 1px solid rgba(239, 226, 233, 0.9);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.74);
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;

  &:hover,
  &.is-active {
    transform: translateY(-4px);
    border-color: rgba(255, 176, 201, 0.88);
    box-shadow: 0 18px 30px rgba(255, 174, 197, 0.16);
  }
}

.location-card__cover {
  height: 180px;
  background: linear-gradient(135deg, rgba(255, 238, 244, 0.94), rgba(245, 249, 255, 0.82));

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.location-card__cover-empty {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #be8ca2;
  letter-spacing: 0.16em;
  font-size: 12px;
}

.location-card__body {
  padding: 16px;

  h4 {
    margin: 0 0 8px;
    color: var(--text-primary);
    font-size: 16px;
  }

  p {
    margin: 0 0 10px;
    color: var(--text-secondary);
    font-size: 13px;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

@media (max-width: 1100px) {
  .memory-map-grid,
  .location-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .glass-panel {
    padding: 18px;
  }

  .memory-map-overview {
    flex-direction: column;
  }

  .overview-stats {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
