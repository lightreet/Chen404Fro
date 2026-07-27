<template>
  <DefaultLayout>
    <div class="studio-page">
      <header class="studio-hero">
        <div>
          <span class="studio-hero__eyebrow">Creator studio</span>
          <h1>创作中心</h1>
          <p>文章、旅途与音乐，都从这里继续生长。你只会看到自己拥有的内容。</p>
        </div>
        <div class="studio-hero__identity">
          <span>{{ user?.nickname || user?.username }}</span>
          <strong>{{ user?.memberLabel || '知友' }}</strong>
        </div>
      </header>

      <UiLoadingState :loading="loading" message="正在整理你的创作...">
        <div class="studio-grid">
          <section v-if="canWriteArticle" class="studio-section">
            <header class="studio-section__header">
              <div class="studio-section__title">
                <span class="studio-section__icon"><UiIcon name="article" /></span>
                <div>
                  <h2>文章</h2>
                  <p>{{ articles.length }} 篇内容</p>
                </div>
              </div>
              <UiButton variant="primary" size="sm" icon="add" @click="router.push('/article/edit')">
                写文章
              </UiButton>
            </header>

            <div v-if="articles.length" class="studio-list">
              <router-link
                v-for="article in articles"
                :key="article.id"
                :to="`/article/edit/${article.id}`"
                class="studio-item"
              >
                <div>
                  <strong>{{ article.title }}</strong>
                  <span>{{ formatDate(article.updateTime) }} · {{ articleStatusLabel(article.status) }}</span>
                </div>
                <UiBadge :tone="article.status === ArticleStatus.PUBLISHED ? 'success' : 'neutral'" size="sm">
                  {{ article.status === ArticleStatus.PUBLISHED ? '已发布' : '草稿' }}
                </UiBadge>
              </router-link>
            </div>
            <UiEmpty v-else description="还没有文章，写下第一篇吧。" />
          </section>

          <section v-if="canWriteTravel" class="studio-section">
            <header class="studio-section__header">
              <div class="studio-section__title">
                <span class="studio-section__icon is-travel"><UiIcon name="location" /></span>
                <div>
                  <h2>旅行地点</h2>
                  <p>{{ travelMemories.length }} 段旅途</p>
                </div>
              </div>
              <UiButton variant="primary" size="sm" icon="add" @click="router.push('/memory-map/create')">
                记旅途
              </UiButton>
            </header>

            <div v-if="travelMemories.length" class="studio-list">
              <router-link
                v-for="memory in travelMemories"
                :key="memory.id"
                :to="`/memory-map/edit/${memory.id}`"
                class="studio-item"
              >
                <div>
                  <strong>{{ memory.title }}</strong>
                  <span>{{ formatDate(memory.updateTime) }} · {{ memory.city || memory.province || '未标注城市' }}</span>
                </div>
                <UiBadge :tone="memory.status === 1 ? 'success' : 'neutral'" size="sm">
                  {{ memory.status === 1 ? '地图展示' : '暂不展示' }}
                </UiBadge>
              </router-link>
            </div>
            <UiEmpty v-else description="地图上还没有你的足迹。" />
          </section>

          <section v-if="canWriteMusic" class="studio-section">
            <header class="studio-section__header">
              <div class="studio-section__title">
                <span class="studio-section__icon is-music"><UiIcon name="music" /></span>
                <div>
                  <h2>音乐</h2>
                  <p>{{ musicTracks.length }} 首曲目</p>
                </div>
              </div>
              <UiButton variant="primary" size="sm" icon="add" @click="router.push('/music/tracks/new')">
                传音乐
              </UiButton>
            </header>

            <div v-if="musicTracks.length" class="studio-list">
              <router-link
                v-for="track in musicTracks"
                :key="track.id"
                :to="`/music/tracks/${track.id}/edit`"
                class="studio-item"
              >
                <div>
                  <strong>{{ track.title }}</strong>
                  <span>{{ track.artist }} · {{ formatDate(track.updateTime) }}</span>
                </div>
                <UiBadge :tone="track.status === 'published' ? 'success' : 'neutral'" size="sm">
                  {{ musicStatusLabel(track.status) }}
                </UiBadge>
              </router-link>
            </div>
            <UiEmpty v-else description="还没有上传音乐。" />
          </section>
        </div>
      </UiLoadingState>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { UiBadge, UiButton, UiEmpty, UiIcon, UiLoadingState } from '@/components/ui'
import { getMyArticles } from '@/api/article'
import { getMyMusicTracks } from '@/api/music'
import { getMyTravelMemories } from '@/api/travel-memory'
import { notify } from '@/lib/feedback'
import { useUserStore } from '@/stores/user'
import { hasCapability } from '@/utils/permission'
import {
  ArticleStatus,
  type ArticleListItem,
  type MusicTrack,
  type MusicTrackStatus,
  type TravelMemoryLocationDetail,
} from '@/types'

const userStore = useUserStore()
const router = useRouter()
const { user } = storeToRefs(userStore)
const articles = ref<ArticleListItem[]>([])
const travelMemories = ref<TravelMemoryLocationDetail[]>([])
const musicTracks = ref<MusicTrack[]>([])
const loading = ref(false)

const canWriteArticle = computed(() => hasCapability(user.value, 'article:create'))
const canWriteTravel = computed(() => hasCapability(user.value, 'travel:create'))
const canWriteMusic = computed(() => hasCapability(user.value, 'music:create'))

const loadStudio = async () => {
  loading.value = true
  try {
    const tasks: Promise<void>[] = []
    if (canWriteArticle.value) {
      tasks.push(getMyArticles({ page: 1, size: 100 }).then((result) => {
        articles.value = result.list ?? []
      }))
    }
    if (canWriteTravel.value) {
      tasks.push(getMyTravelMemories().then((result) => {
        travelMemories.value = result
      }))
    }
    if (canWriteMusic.value) {
      tasks.push(getMyMusicTracks().then((result) => {
        musicTracks.value = result
      }))
    }
    await Promise.all(tasks)
  } catch (error) {
    notify.error(error instanceof Error ? error.message : '创作内容加载失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD') : '刚刚'

const articleStatusLabel = (status: ArticleStatus) => {
  if (status === ArticleStatus.PUBLISHED) return '公开阅读'
  if (status === ArticleStatus.RECYCLED) return '回收站'
  return '继续编辑'
}

const musicStatusLabel = (status: MusicTrackStatus) => {
  if (status === 'published') return '已发布'
  if (status === 'archived') return '已归档'
  return '草稿'
}

onMounted(() => {
  void loadStudio()
})
</script>

<style scoped lang="scss">
.studio-page {
  display: grid;
  gap: 24px;
  width: min(1120px, 100%);
  margin: 0 auto;
}

.studio-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: clamp(24px, 4vw, 42px);
  border: 1px solid rgba(255, 160, 194, 0.22);
  border-radius: 28px;
  background:
    radial-gradient(circle at 88% 18%, rgba(255, 188, 211, 0.32), transparent 34%),
    linear-gradient(145deg, var(--color-surface), var(--color-accent-soft));
  box-shadow: var(--shadow-md);

  h1 {
    margin: 6px 0 12px;
    color: var(--color-text-primary);
    font-size: clamp(30px, 5vw, 48px);
    letter-spacing: -0.04em;
  }

  p {
    max-width: 620px;
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.8;
  }
}

.studio-hero__eyebrow {
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.studio-hero__identity {
  display: grid;
  gap: 3px;
  min-width: 120px;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.55);
  text-align: right;

  span {
    color: var(--color-text-primary);
    font-weight: 600;
  }

  strong {
    color: var(--primary);
    font-size: 12px;
  }
}

.studio-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}

.studio-section {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.studio-section__header,
.studio-section__title {
  display: flex;
  align-items: center;
}

.studio-section__header {
  justify-content: space-between;
  gap: 12px;
}

.studio-section__title {
  gap: 10px;
  min-width: 0;

  h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 18px;
  }

  p {
    margin: 3px 0 0;
    color: var(--color-text-tertiary);
    font-size: 12px;
  }
}

.studio-section__icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 13px;
  background: var(--color-accent-soft);
  color: var(--primary);
  font-size: 19px;

  &.is-travel {
    background: var(--color-info-soft);
    color: var(--color-info);
  }

  &.is-music {
    background: var(--color-warning-soft);
    color: var(--color-warning);
  }
}

.studio-list {
  display: grid;
  gap: 8px;
}

.studio-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 12px;
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
  color: inherit;
  text-decoration: none;
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);

  &:hover {
    background: var(--color-accent-soft);
    transform: translateX(2px);
  }

  > div {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--color-text-primary);
    font-size: 14px;
  }

  span {
    color: var(--color-text-tertiary);
    font-size: 12px;
  }
}

@media (max-width: 980px) {
  .studio-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .studio-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .studio-hero__identity {
    text-align: left;
  }
}
</style>
