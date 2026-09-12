<template>
  <div class="profile-creation-panel">
    <UiTabs
      v-if="isPhone"
      v-model="activeKind"
      :items="creationTabs"
      variant="line"
      class="creation-tabs"
      @change="handleKindChange"
    />
    <header v-if="!isPhone" class="creation-toolbar">
      <div class="creation-heading">
        <h2>{{ currentSection.title }}</h2>
        <span v-if="!currentLoading && !currentError" class="creation-total">{{ currentTotal }} {{ currentSection.unit }}</span>
      </div>
      <UiButton
        v-if="currentAction"
        variant="primary"
        :size="isPhone ? 'lg' : 'md'"
        icon="add"
        class="creation-create"
        @click="router.push(currentAction.path)"
      >
        {{ currentAction.label }}
      </UiButton>
    </header>

    <div v-if="!currentCanCreate" class="creation-permission-note">
      <UiIcon name="lock" />
      <span>你仍可查看历史记录，当前账号暂时不能新增或编辑这类内容。</span>
    </div>

    <div class="creation-filter-bar">
      <UiRadioGroup
        v-if="activeKind === 'articles'"
        v-model="articleStatus"
        variant="line"
        :size="isPhone ? 'lg' : 'md'"
        :options="articleStatusOptions"
        class="creation-status"
        aria-label="文章发布状态"
        @change="refreshArticles(1)"
      />
      <form class="creation-search" role="search" :aria-label="`搜索${currentSection.label}`" @submit.prevent="handleCurrentSearch(currentSearchInput)">
        <UiInput
          v-model="currentSearchInput"
          clearable
          type="search"
          :size="isPhone ? 'lg' : 'md'"
          :placeholder="currentSearchPlaceholder"
          :aria-label="currentSearchPlaceholder"
          @clear="handleCurrentSearch('')"
        >
          <template #prefix>
            <button class="creation-search-submit" type="submit" :disabled="currentLoading" :aria-label="`搜索${currentSection.label}`">
              <UiIcon name="search" :size="18" />
            </button>
          </template>
        </UiInput>
      </form>
      <UiButton
        v-if="isPhone && currentAction"
        variant="primary"
        size="lg"
        icon="add"
        class="creation-create"
        @click="router.push(currentAction.path)"
      >{{ currentAction.label }}</UiButton>
    </div>

    <UiLoadingState
      :loading="currentLoading"
      :message="currentLoadingMessage"
      variant="plain"
      class="creation-loading"
    >
      <UiEmpty v-if="currentError" :title="`${currentSection.label}记录加载失败`" :description="currentError" icon="warning">
        <template #action><UiButton variant="secondary" @click="retryCurrent">重新加载</UiButton></template>
      </UiEmpty>
      <section v-else-if="activeKind === 'articles'" aria-label="我的文章">
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
                <img
                  v-if="memory.coverImage"
                  class="creation-record__cover"
                  :src="memory.coverImage"
                  :alt="`${memory.title}旅行封面`"
                  decoding="async"
                  @load="handleCoverImageLoad"
                  @error="handleCoverImageError"
                />
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
                <img
                  v-if="track.coverUrl"
                  class="creation-record__cover"
                  :src="track.coverUrl"
                  :alt="`${track.title}音乐封面`"
                  decoding="async"
                  @load="handleCoverImageLoad"
                  @error="handleCoverImageError"
                />
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
  UiInput,
  UiTabs,
  type UiTabItem,
} from '@/components/ui'
import { deleteArticle, getMyArticles } from '@/api/article'
import { getMyMusicTracks } from '@/api/music'
import { getMyTravelMemories } from '@/api/travel-memory'
import { confirmDelete, notify } from '@/lib/feedback'
import { useUserStore } from '@/stores/user'
import { hasCapability } from '@/utils/permission'
import { useMobileViewport } from '@/composables/useMobileViewport'
import { creationSections, resolveCreationKind } from './creationNavigation'
import type {
  ArticleListItem,
  MusicTrack,
  MusicTrackStatus,
  TravelMemoryLocationDetail,
} from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const { isMobile: isPhone } = useMobileViewport()
const loadErrors = ref({ articles: '', travel: '', music: '' })

const articles = ref<ArticleListItem[]>([])
const articleLoading = ref(false)
const articlePage = ref(1)
const articlePageSize = 5
const articleTotal = ref(0)
const articleStatus = ref(-1)
const articleKeyword = ref('')
let articleRequestId = 0

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

const activeKind = ref(resolveCreationKind(route.query.content))
const currentSection = computed(() => creationSections.find(section => section.value === activeKind.value) ?? creationSections[0])
const currentError = computed(() => loadErrors.value[activeKind.value])

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
const currentTotal = computed(() => activeKind.value === 'articles' ? articleTotal.value
  : activeKind.value === 'travel' ? filteredTravelMemories.value.length : filteredMusicTracks.value.length)

const currentCanCreate = computed(() => {
  if (activeKind.value === 'articles') return canWriteArticle.value
  if (activeKind.value === 'travel') return canWriteTravel.value
  return canWriteMusic.value
})
const currentAction = computed(() => {
  if (!currentCanCreate.value) return null
  if (activeKind.value === 'articles') return { label: '写文章', path: '/article/edit' }
  if (activeKind.value === 'travel') return { label: '写游记', path: '/memory-map/create' }
  return { label: '上传音乐', path: '/music/tracks/new' }
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
  if (isPhone.value) return `搜索${currentSection.value.label === '旅行' ? '游记' : currentSection.value.label}`
  if (activeKind.value === 'articles') return '搜索文章标题'
  if (activeKind.value === 'travel') return '搜索游记、城市'
  return '搜索曲名、歌手、专辑'
})

const articleStatusOptions = [
  { label: '全部', value: -1 },
  { label: '草稿', value: 0 },
  { label: '已发布', value: 1 },
]

const loadArticles = async (page = 1) => {
  const requestId = ++articleRequestId
  articlePage.value = page
  articleLoading.value = true
  loadErrors.value.articles = ''
  try {
    const result = await getMyArticles(
      {
        page,
        size: articlePageSize,
        status: articleStatus.value === -1 ? undefined : articleStatus.value,
        keyword: articleKeyword.value.trim() || undefined,
      },
      { suppressErrorMessage: true },
    )
    if (requestId !== articleRequestId) return
    articles.value = result.list ?? []
    articleTotal.value = result.total ?? 0
  } catch (error) {
    if (requestId !== articleRequestId) return
    loadErrors.value.articles = '暂时无法获取文章记录，请重试。'
    throw error
  } finally {
    if (requestId === articleRequestId) articleLoading.value = false
  }
}

const loadTravelMemories = async () => {
  travelLoading.value = true
  loadErrors.value.travel = ''
  try {
    travelMemories.value = await getMyTravelMemories({ suppressErrorMessage: true })
  } catch (error) {
    loadErrors.value.travel = '暂时无法获取旅行记录，请重试。'
    throw error
  } finally {
    travelLoading.value = false
  }
}

const loadMusicTracks = async () => {
  musicLoading.value = true
  loadErrors.value.music = ''
  try {
    musicTracks.value = await getMyMusicTracks({ suppressErrorMessage: true })
  } catch (error) {
    loadErrors.value.music = '暂时无法获取音乐记录，请重试。'
    throw error
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
  const content = resolveCreationKind(value)
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

const handleCoverImageLoad = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement
  image.hidden = false
}

const handleCoverImageError = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement
  image.hidden = true
}

const musicStatusLabel = (status: MusicTrackStatus) => {
  if (status === 'published') return '已发布'
  if (status === 'archived') return '已归档'
  return '草稿'
}

watch(
  () => route.query.content,
  (value) => {
    activeKind.value = resolveCreationKind(value)
  },
)

const retryCurrent = async () => {
  if (currentLoading.value) return
  const loaders = { articles: () => loadArticles(articlePage.value), travel: loadTravelMemories, music: loadMusicTracks }
  await Promise.allSettled([loaders[activeKind.value]()])
}

onMounted(async () => {
  await Promise.allSettled([
    loadArticles(1),
    loadTravelMemories(),
    loadMusicTracks(),
  ])
})
</script>

<style scoped lang="scss">
.profile-creation-panel {
  min-width: 0;
  container-type: inline-size;
}

.creation-tabs :deep(.ui-tabs__panel) {
  display: none;
}

.creation-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.creation-heading { display: flex; align-items: baseline; gap: 8px; margin-right: auto; }
.creation-heading h2 { margin: 0; color: var(--color-text-primary); font-size: 24px; font-weight: 600; line-height: 1.4; }
.creation-total { color: var(--color-text-secondary); font-size: 13px; white-space: nowrap; }
.creation-search { flex: 0 1 260px; min-width: 200px; margin-left: auto; }
.creation-status { flex: none; }
.creation-search-submit { display: grid; place-items: center; border: 0; padding: 0; min-width: 24px; min-height: 32px; background: transparent; color: var(--color-text-secondary); cursor: pointer; }
.creation-search-submit:focus-visible { outline: 2px solid var(--color-accent-readable); outline-offset: 2px; }
.creation-search :deep(.ui-input__inner::placeholder) { color: var(--color-text-secondary); }
.creation-create { flex: none; }

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
  margin-bottom: var(--space-md);
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

  :deep(.article-card.compact.manage-mode) {
    width: 100%;
    margin-right: 0;
    margin-left: 0;
  }
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
  position: relative;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-info-soft);
  color: var(--color-info);
  font-size: 18px;

  &.is-music {
    background: var(--color-warning-soft);
    color: var(--color-warning);
  }
}

.creation-record__cover {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
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

.creation-record__cover[hidden] { display: none; }

@container (max-width: 590px) {
  .creation-search { flex-grow: 1; }
}

@media (max-width: 767px) {
  .article-list { gap: var(--mobile-article-list-gap); }
  .creation-tabs { margin-bottom: 16px; }
  .creation-search { flex: 1; min-width: 0; }
  .creation-search-submit { min-height: 44px; min-width: 44px; }
  .creation-create { padding-inline: 12px; }
  .creation-permission-note { align-items: flex-start; }
  .creation-tabs :deep(.ui-tabs__nav) {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .creation-tabs :deep(.ui-tabs__nav::-webkit-scrollbar) {
    display: none;
  }

  .creation-filter-bar {
    gap: 12px 8px;
  }
  .creation-status { flex-basis: 100%; }

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
