<template>
  <div class="profile-creation-panel">
    <UiTabs
      v-model="activeKind"
      :items="creationTabs"
      variant="line"
      class="creation-tabs"
      @change="handleKindChange"
    >
      <template #actions>
        <UiButton
          v-if="currentAction"
          variant="primary"
          size="sm"
          icon="add"
          @click="router.push(currentAction.path)"
        >
          {{ currentAction.label }}
        </UiButton>
      </template>

      <div v-if="!currentCanCreate" class="creation-permission-note">
        <UiIcon name="lock" />
        <span>你仍可查看历史记录，当前账号暂时不能新增或编辑这类内容。</span>
      </div>

      <div class="creation-filter-bar">
        <UiRadioGroup
          v-if="activeKind === 'articles'"
          v-model="articleStatus"
          variant="button"
          :options="articleStatusOptions"
          @change="refreshArticles(1)"
        />
        <UiSearchBar
          v-model="currentSearchInput"
          class="creation-search"
          :placeholder="currentSearchPlaceholder"
          :loading="currentLoading"
          @search="handleCurrentSearch"
        />
      </div>

      <UiLoadingState
        :loading="currentLoading"
        :message="currentLoadingMessage"
        variant="plain"
        class="creation-loading"
      >
        <section v-if="activeKind === 'articles'" aria-label="我的文章">
          <UiEmpty
            v-if="!articleLoading && visibleArticles.length === 0"
            :title="articleHasFilters ? '没有找到文章' : '还没有文章'"
            :description="articleHasFilters
              ? '调整关键词或发布状态后再试。'
              : canWriteArticle
                ? '写下第一篇文章，它会出现在这里。'
                : '当前没有可查看的文章记录。'"
            icon="article"
          />
          <div v-else class="article-list-shell">
            <div class="article-list">
              <ArticleCard
                v-for="(article, index) in visibleArticles"
                :key="String(article.id)"
                :article="article"
                :index="index"
                :mode="canWriteArticle ? 'manage' : 'home'"
                compact
                profile-feed
                @edit="handleEditArticle"
                @delete="handleDeleteArticle"
              />
            </div>
            <UiPagination
              v-if="articleTotal > articlePageSize"
              :current="articlePage"
              :page-size="articlePageSize"
              :total="articleTotal"
              class="creation-pager"
              @change="refreshArticles"
            />
          </div>
        </section>

        <section v-else-if="activeKind === 'travel'" aria-label="我的旅行地点">
          <UiEmpty
            v-if="!travelLoading && filteredTravelMemories.length === 0"
            :title="travelKeyword ? '没有找到旅行地点' : '还没有旅行地点'"
            :description="travelKeyword
              ? '换个地点名称或城市再试。'
              : canWriteTravel
                ? '把一次旅途放进地图，它会出现在这里。'
                : '当前没有可查看的旅行记录。'"
            icon="location"
          />
          <div v-else class="creation-record-shell">
            <div class="creation-record-list">
              <article
                v-for="memory in paginatedTravelMemories"
                :key="String(memory.id)"
                class="creation-record"
              >
                <span class="creation-record__icon is-travel">
                  <UiIcon name="location" />
                </span>
                <div class="creation-record__copy">
                  <strong>{{ memory.title }}</strong>
                  <span>
                    {{ memory.city || memory.province || '未标注城市' }}
                    ·
                    {{ formatDate(memory.updateTime) }}
                  </span>
                </div>
                <div class="creation-record__actions">
                  <UiBadge :tone="memory.status === 1 ? 'success' : 'neutral'" size="sm">
                    {{ memory.status === 1 ? '地图展示' : '暂不展示' }}
                  </UiBadge>
                  <UiButton
                    v-if="canWriteTravel && memory.canEdit"
                    variant="text"
                    size="sm"
                    @click="router.push(`/memory-map/edit/${String(memory.id)}`)"
                  >
                    编辑
                  </UiButton>
                </div>
              </article>
            </div>
            <UiPagination
              v-if="filteredTravelMemories.length > travelPageSize"
              :current="travelPage"
              :page-size="travelPageSize"
              :total="filteredTravelMemories.length"
              class="creation-pager"
              @change="handleTravelPageChange"
            />
          </div>
        </section>

        <section v-else aria-label="我的音乐">
          <UiEmpty
            v-if="!musicLoading && filteredMusicTracks.length === 0"
            :title="musicKeyword ? '没有找到音乐' : '还没有音乐'"
            :description="musicKeyword
              ? '换个曲名、歌手或专辑再试。'
              : canWriteMusic
                ? '上传第一首音乐，它会出现在这里。'
                : '当前没有可查看的音乐记录。'"
            icon="music"
          />
          <div v-else class="creation-record-shell">
            <div class="creation-record-list">
              <article
                v-for="track in paginatedMusicTracks"
                :key="String(track.id)"
                class="creation-record"
              >
                <span class="creation-record__icon is-music">
                  <UiIcon name="music" />
                </span>
                <div class="creation-record__copy">
                  <strong>{{ track.title }}</strong>
                  <span>{{ track.artist }} · {{ formatDate(track.updateTime) }}</span>
                </div>
                <div class="creation-record__actions">
                  <UiBadge :tone="track.status === 'published' ? 'success' : 'neutral'" size="sm">
                    {{ musicStatusLabel(track.status) }}
                  </UiBadge>
                  <UiButton
                    v-if="canWriteMusic && track.canEdit"
                    variant="text"
                    size="sm"
                    @click="router.push(`/music/tracks/${String(track.id)}/edit`)"
                  >
                    编辑
                  </UiButton>
                </div>
              </article>
            </div>
            <UiPagination
              v-if="filteredMusicTracks.length > musicPageSize"
              :current="musicPage"
              :page-size="musicPageSize"
              :total="filteredMusicTracks.length"
              class="creation-pager"
              @change="handleMusicPageChange"
            />
          </div>
        </section>
      </UiLoadingState>
    </UiTabs>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import ArticleCard from '@/components/ArticleCard/ArticleCard.vue'
import {
  UiBadge,
  UiButton,
  UiEmpty,
  UiIcon,
  UiLoadingState,
  UiPagination,
  UiRadioGroup,
  UiSearchBar,
  UiTabs,
  type UiTabItem,
} from '@/components/ui'
import { deleteArticle, getMyArticles } from '@/api/article'
import { getMyMusicTracks } from '@/api/music'
import { getMyTravelMemories } from '@/api/travel-memory'
import { confirmDelete, notify } from '@/lib/feedback'
import { useUserStore } from '@/stores/user'
import { hasCapability } from '@/utils/permission'
import type {
  ArticleListItem,
  MusicTrack,
  MusicTrackStatus,
  TravelMemoryLocationDetail,
} from '@/types'

type CreationKind = 'articles' | 'travel' | 'music'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const articles = ref<ArticleListItem[]>([])
const articleLoading = ref(false)
const articlePage = ref(1)
const articlePageSize = 5
const articleTotal = ref(0)
const articleStatus = ref(-1)
const articleKeyword = ref('')

const travelMemories = ref<TravelMemoryLocationDetail[]>([])
const travelLoading = ref(false)
const travelPage = ref(1)
const travelPageSize = 10
const travelSearchInput = ref('')
const travelKeyword = ref('')
const musicTracks = ref<MusicTrack[]>([])
const musicLoading = ref(false)
const musicPage = ref(1)
const musicPageSize = 10
const musicSearchInput = ref('')
const musicKeyword = ref('')

const resolveKind = (value: unknown): CreationKind => {
  if (value === 'travel' || value === 'music') return value
  return 'articles'
}

const activeKind = ref<CreationKind>(resolveKind(route.query.content))

const canWriteArticle = computed(() => hasCapability(user.value, 'article:create'))
const canWriteTravel = computed(() => hasCapability(user.value, 'travel:create'))
const canWriteMusic = computed(() => hasCapability(user.value, 'music:create'))
const visibleArticles = computed(() => articles.value.map((article) => ({
  ...article,
  canEdit: canWriteArticle.value && article.canEdit,
  canDelete: canWriteArticle.value && article.canDelete,
})))
const articleHasFilters = computed(
  () => articleStatus.value !== -1 || Boolean(articleKeyword.value.trim()),
)

const normalizeSearchText = (value: unknown) =>
  String(value ?? '').trim().toLocaleLowerCase()

const matchesKeyword = (keyword: string, values: unknown[]) => {
  const normalizedKeyword = normalizeSearchText(keyword)
  if (!normalizedKeyword) return true
  return values.some((value) => normalizeSearchText(value).includes(normalizedKeyword))
}

const filteredTravelMemories = computed(() =>
  travelMemories.value.filter((memory) =>
    matchesKeyword(travelKeyword.value, [
      memory.title,
      memory.province,
      memory.city,
      memory.summaryNote,
    ]),
  ),
)

const paginatedTravelMemories = computed(() => {
  const start = (travelPage.value - 1) * travelPageSize
  return filteredTravelMemories.value.slice(start, start + travelPageSize)
})

const filteredMusicTracks = computed(() =>
  musicTracks.value.filter((track) =>
    matchesKeyword(musicKeyword.value, [
      track.title,
      track.artist,
      track.album,
      track.genre,
      track.tags?.join(' '),
    ]),
  ),
)

const paginatedMusicTracks = computed(() => {
  const start = (musicPage.value - 1) * musicPageSize
  return filteredMusicTracks.value.slice(start, start + musicPageSize)
})

const creationTabs = computed<UiTabItem[]>(() => [
  { value: 'articles', label: '文章', icon: 'article', badge: articleTotal.value },
  { value: 'travel', label: '旅行', icon: 'location', badge: travelMemories.value.length },
  { value: 'music', label: '音乐', icon: 'music', badge: musicTracks.value.length },
])

const currentCanCreate = computed(() => {
  if (activeKind.value === 'articles') return canWriteArticle.value
  if (activeKind.value === 'travel') return canWriteTravel.value
  return canWriteMusic.value
})
const currentAction = computed(() => {
  if (!currentCanCreate.value) return null
  if (activeKind.value === 'articles') return { label: '写文章', path: '/article/edit' }
  if (activeKind.value === 'travel') return { label: '记旅途', path: '/memory-map/create' }
  return { label: '传音乐', path: '/music/tracks/new' }
})
const currentLoading = computed(() => {
  if (activeKind.value === 'articles') return articleLoading.value
  if (activeKind.value === 'travel') return travelLoading.value
  return musicLoading.value
})
const currentLoadingMessage = computed(() => {
  if (activeKind.value === 'articles') return '正在整理文章记录...'
  if (activeKind.value === 'travel') return '正在整理旅行记录...'
  return '正在整理音乐记录...'
})
const currentSearchInput = computed({
  get: () => {
    if (activeKind.value === 'articles') return articleKeyword.value
    if (activeKind.value === 'travel') return travelSearchInput.value
    return musicSearchInput.value
  },
  set: (value: string) => {
    if (activeKind.value === 'articles') {
      articleKeyword.value = value
      return
    }
    if (activeKind.value === 'travel') {
      travelSearchInput.value = value
      return
    }
    musicSearchInput.value = value
  },
})
const currentSearchPlaceholder = computed(() => {
  if (activeKind.value === 'articles') return '按标题搜索文章'
  if (activeKind.value === 'travel') return '按地点或城市搜索旅行'
  return '按曲名、歌手或专辑搜索音乐'
})

const articleStatusOptions = [
  { label: '全部', value: -1 },
  { label: '草稿', value: 0 },
  { label: '已发布', value: 1 },
]

const loadArticles = async (page = 1) => {
  articlePage.value = page
  articleLoading.value = true
  try {
    const result = await getMyArticles({
      page,
      size: articlePageSize,
      status: articleStatus.value === -1 ? undefined : articleStatus.value,
      keyword: articleKeyword.value.trim() || undefined,
    })
    articles.value = result.list ?? []
    articleTotal.value = result.total ?? 0
  } finally {
    articleLoading.value = false
  }
}

const loadTravelMemories = async () => {
  travelLoading.value = true
  try {
    travelMemories.value = await getMyTravelMemories()
  } finally {
    travelLoading.value = false
  }
}

const loadMusicTracks = async () => {
  musicLoading.value = true
  try {
    musicTracks.value = await getMyMusicTracks()
  } finally {
    musicLoading.value = false
  }
}

const refreshArticles = async (page = 1) => {
  try {
    await loadArticles(page)
  } catch {
    notify.error('文章记录加载失败，请稍后重试')
  }
}

const handleCurrentSearch = (keyword: string) => {
  if (activeKind.value === 'articles') {
    articleKeyword.value = keyword
    void refreshArticles(1)
    return
  }
  if (activeKind.value === 'travel') {
    travelPage.value = 1
    travelKeyword.value = keyword.trim()
    return
  }
  musicPage.value = 1
  musicKeyword.value = keyword.trim()
}

const handleTravelPageChange = (page: number) => {
  travelPage.value = page
}

const handleMusicPageChange = (page: number) => {
  musicPage.value = page
}

const handleKindChange = (value: string) => {
  const content = resolveKind(value)
  activeKind.value = content
  void router.replace({
    query: {
      ...route.query,
      tab: 'creations',
      content,
    },
  })
}

const handleEditArticle = (id: number | string) => {
  if (!canWriteArticle.value) return
  void router.push(`/article/edit/${String(id)}`)
}

const handleDeleteArticle = async (id: number | string) => {
  if (!canWriteArticle.value) return
  const confirmed = await confirmDelete('确定要删除这篇文章吗？删除后将无法恢复。')
  if (!confirmed) return
  try {
    await deleteArticle(String(id))
    notify.success('文章已删除')
    await loadArticles(articlePage.value)
  } catch {
    // 请求层已展示具体错误。
  }
}

const formatDate = (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD') : '刚刚')

const musicStatusLabel = (status: MusicTrackStatus) => {
  if (status === 'published') return '已发布'
  if (status === 'archived') return '已归档'
  return '草稿'
}

watch(
  () => route.query.content,
  (value) => {
    activeKind.value = resolveKind(value)
  },
)

onMounted(async () => {
  const results = await Promise.allSettled([
    loadArticles(1),
    loadTravelMemories(),
    loadMusicTracks(),
  ])
  if (results.some((result) => result.status === 'rejected')) {
    notify.error('部分创作记录加载失败，请稍后重试')
  }
})
</script>

<style scoped lang="scss">
.profile-creation-panel {
  min-width: 0;
}

.creation-tabs :deep(.ui-tabs__panel) {
  margin-top: 12px;
}

.creation-tabs :deep(.ui-tabs__nav) {
  flex-wrap: wrap;
}

.creation-permission-note {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.creation-loading {
  min-height: 260px;
}

.creation-filter-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.creation-search {
  flex: 0 1 340px;
  min-width: 220px;
}

.article-list-shell,
.article-list {
  display: flex;
  flex-direction: column;
}

.article-list-shell {
  gap: var(--space-lg);
}

.article-list {
  gap: var(--space-md);
}

.creation-pager {
  align-self: center;
}

.creation-record-shell {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.creation-record-list {
  display: grid;
}

.creation-record {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
  padding: 16px 4px;
  border-bottom: 1px solid var(--color-border-light);

  &:first-child {
    padding-top: 4px;
  }

  &:last-child {
    border-bottom: 0;
  }
}

.creation-record__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: var(--color-info-soft);
  color: var(--color-info);
  font-size: 18px;

  &.is-music {
    background: var(--color-warning-soft);
    color: var(--color-warning);
  }
}

.creation-record__copy {
  display: grid;
  gap: 4px;
  min-width: 0;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
  }

  span {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }
}

.creation-record__actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

@media (max-width: 720px) {
  .creation-tabs :deep(.ui-tabs__nav) {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .creation-tabs :deep(.ui-tabs__nav::-webkit-scrollbar) {
    display: none;
  }

  .creation-filter-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .creation-search {
    width: 100%;
    min-width: 0;
    flex-basis: auto;
  }
}

@media (max-width: 560px) {
  .creation-record {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .creation-record__actions {
    grid-column: 2;
    justify-content: space-between;
  }
}
</style>
