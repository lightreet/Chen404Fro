<template>
  <DefaultLayout wide-content>
    <template #hero>
      <PageHero
        title="书架"
        eyebrow="Reading Shelf"
        subtitle="浏览公开故事，也为自己保留一处安静的阅读空间。"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="64vh"
        align="left"
        compact
        scroll-target="#bookshelf-content"
      />
    </template>

    <main id="bookshelf-content" class="bookshelf-page">
      <UiLoadingState :loading="loading" message="正在整理你的书架…">
        <template v-if="books.length">
          <div class="library-toolbar">
            <div>
              <h2>全部藏书</h2>
              <span>按阅读习惯整理你的书目</span>
            </div>
            <div class="library-toolbar__controls">
              <UiInput
                v-model="keyword"
                clearable
                prefix-icon="search"
                placeholder="搜索书名或作者"
              />
              <UiSelect v-model="sortBy" :options="sortOptions" />
              <UiButton v-if="canImportBooks" variant="primary" icon="upload" @click="openImport">
                导入小说
              </UiButton>
            </div>
          </div>

          <div v-if="filteredBooks.length" class="book-grid">
            <article
              v-for="book in filteredBooks"
              :key="String(book.id)"
              class="book-card"
              :class="`is-${book.status}`"
            >
              <button type="button" class="book-card__main" @click="openBookDetail(book)">
                <ReaderBookCover
                  :title="book.title"
                  :format="book.sourceFormat"
                  :url="book.coverUrl"
                />
                <div class="book-card__info">
                  <h3 :title="book.title">{{ book.title }}</h3>
                  <p class="book-card__author">{{ book.author || '未知作者' }}</p>
                  <p v-if="book.status === 'ready'" class="book-card__meta">
                    <span>{{ book.chapterCount }} 章</span>
                  </p>
                  <p v-if="book.status === 'ready'" class="book-card__progress">
                    <span>进度</span>
                    <span class="book-card__progress-value">
                      {{ isLoggedIn ? formatProgress(book.progressPercent) : '0%' }}
                    </span>
                  </p>
                  <p v-else class="book-card__task-status" :class="`is-${book.status}`">
                    <span aria-hidden="true" />
                    {{ book.status === 'importing' ? '后台导入中' : '导入失败' }}
                  </p>
                  <p class="book-card__description">
                    {{ book.status === 'ready'
                      ? (book.description || '暂时没有留下简介。')
                      : (book.parseMessage || (book.status === 'importing'
                        ? '正在解析目录和正文，可继续浏览其他内容。'
                        : '请删除后重新导入。')) }}
                  </p>
                </div>
              </button>
            </article>
          </div>

          <UiEmpty
            v-else
            title="没有找到匹配的小说"
            description="换一个书名或作者关键词试试"
            icon="search"
            size="sm"
          />
        </template>

        <UiEmpty
          v-else-if="!loading"
          title="书架还是空的"
          description="这里会展示公开书籍。"
          icon="book"
          size="lg"
        >
          <template #action>
            <UiButton v-if="canImportBooks" variant="primary" icon="upload" @click="openImport">
              导入第一本小说
            </UiButton>
          </template>
        </UiEmpty>
      </UiLoadingState>
    </main>

    <ReaderImportDialog
      v-model="importOpen"
      @imported="handleImported"
    />

    <ReaderImportDialog
      v-model="editOpen"
      mode="edit"
      :book="editingBook"
      @updated="handleUpdated"
    />

    <ReaderBookDetailDialog
      v-model="detailOpen"
      :book="detailBook"
      @read="openBook"
      @edit="openEditFromDetail"
      @delete="removeBookFromDetail"
    />
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import ReaderBookCover from '@/components/Reader/ReaderBookCover.vue'
import ReaderBookDetailDialog from '@/components/Reader/ReaderBookDetailDialog.vue'
import ReaderImportDialog from '@/components/Reader/ReaderImportDialog.vue'
import {
  UiButton,
  UiEmpty,
  UiLoadingState,
} from '@/components/ui'
import { deleteReaderBook, getReaderBookImportStatus, listReaderBooks } from '@/api/reader'
import { confirmDelete, notify } from '@/lib/feedback'
import { useUserStore } from '@/stores/user'
import { useSiteConfig } from '@/composables/useSiteConfig'
import { hasCapability } from '@/utils/permission'
import type { ReaderBook } from '@/types/reader'
import { resolveHeroImage, resolveHeroImagePosition } from '@/utils/siteConfig'

const BOOKSHELF_HERO_IMAGE =
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=2200&q=88'
const BOOKSHELF_HERO_POSITION = '50% 47%'

const router = useRouter()
const userStore = useUserStore()
const { loadSiteConfig } = useSiteConfig()
userStore.initUser()
const { isLoggedIn, user } = storeToRefs(userStore)
const heroBgImage = ref(BOOKSHELF_HERO_IMAGE)
const heroBgPosition = ref(BOOKSHELF_HERO_POSITION)
const books = ref<ReaderBook[]>([])
const loading = ref(true)
const importOpen = ref(false)
const editOpen = ref(false)
const editingBook = ref<ReaderBook>()
const detailOpen = ref(false)
const detailBook = ref<ReaderBook>()
const keyword = ref('')
const sortBy = ref('recent')
let importPollTimer: number | undefined

const sortOptions = [
  { label: '最近阅读', value: 'recent' },
  { label: '最近导入', value: 'created' },
  { label: '书名排序', value: 'title' },
  { label: '阅读进度', value: 'progress' },
]
const pendingImportBooks = computed(() => books.value.filter((book) => (
  book.ownedByCurrentUser && book.status === 'importing'
)))
const canImportBooks = computed(() => hasCapability(user.value, 'friend-content:view'))
const filteredBooks = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  const result = books.value.filter((book) => !query
    || book.title.toLowerCase().includes(query)
    || (book.author || '').toLowerCase().includes(query))
  return [...result].sort((left, right) => {
    if (sortBy.value === 'title') return left.title.localeCompare(right.title, 'zh-CN')
    if (sortBy.value === 'created') return Date.parse(right.createTime) - Date.parse(left.createTime)
    if (sortBy.value === 'progress') return Number(right.progressPercent) - Number(left.progressPercent)
    return Date.parse(right.lastReadAt || right.updateTime) - Date.parse(left.lastReadAt || left.updateTime)
  })
})

const loadBooks = async () => {
  loading.value = true
  try {
    books.value = await listReaderBooks()
    scheduleImportPolling(900)
  } finally {
    loading.value = false
  }
}

const openBook = (book: ReaderBook) => {
  if (book.status !== 'ready') {
    notify.info(book.status === 'importing'
      ? '小说仍在后台导入，完成后即可阅读'
      : (book.parseMessage || '小说导入失败，请删除后重试'))
    return
  }
  void router.push({ name: 'NovelReader', params: { bookId: String(book.id) } })
}

const openBookDetail = (book: ReaderBook) => {
  detailBook.value = book
  detailOpen.value = true
}

const openImport = () => {
  if (!canImportBooks.value) return
  importOpen.value = true
}

const handleImported = (book: ReaderBook) => {
  upsertBook(book, true)
  scheduleImportPolling(900)
}

const handleUpdated = (book: ReaderBook) => {
  upsertBook(book)
}

const upsertBook = (book: ReaderBook, prepend = false) => {
  const remaining = books.value.filter((item) => String(item.id) !== String(book.id))
  books.value = prepend ? [book, ...remaining] : books.value.map((item) => (
    String(item.id) === String(book.id) ? book : item
  ))
  if (!prepend && !books.value.some((item) => String(item.id) === String(book.id))) {
    books.value = [book, ...books.value]
  }
  if (detailBook.value && String(detailBook.value.id) === String(book.id)) {
    detailBook.value = book
  }
  if (editingBook.value && String(editingBook.value.id) === String(book.id)) {
    editingBook.value = book
  }
}

const scheduleImportPolling = (delay = 2_000) => {
  if (importPollTimer != null || !isLoggedIn.value || !pendingImportBooks.value.length) return
  importPollTimer = window.setTimeout(() => {
    importPollTimer = undefined
    void pollImportTasks()
  }, delay)
}

const pollImportTasks = async () => {
  const pending = [...pendingImportBooks.value]
  if (!pending.length || !isLoggedIn.value) return
  const results = await Promise.allSettled(
    pending.map((book) => getReaderBookImportStatus(book.id)),
  )
  let requestFailed = false
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      requestFailed = true
      return
    }
    const previous = pending[index]
    const current = result.value
    upsertBook(current)
    if (previous.status === 'importing' && current.status === 'ready') {
      notify.success(`《${current.title}》后台导入完成，共 ${current.chapterCount} 章`)
    } else if (previous.status === 'importing' && current.status === 'failed') {
      notify.error(current.parseMessage || `《${current.title}》导入失败，请删除后重试`)
    }
  })
  scheduleImportPolling(requestFailed ? 5_000 : 2_000)
}

const editBook = (book: ReaderBook) => {
  editingBook.value = book
  editOpen.value = true
}

const openEditFromDetail = (book: ReaderBook) => {
  detailOpen.value = false
  editBook(book)
}

const removeBookFromDetail = (book: ReaderBook) => {
  detailOpen.value = false
  void removeBook(book)
}

const removeBook = async (book: ReaderBook) => {
  const confirmed = await confirmDelete(
    `确定从书架删除《${book.title}》吗？正文、目录和阅读进度会一起删除，且无法恢复。`,
    { title: '删除小说', confirmText: '确认删除' },
  )
  if (!confirmed) return
  await deleteReaderBook(book.id)
  books.value = books.value.filter((item) => String(item.id) !== String(book.id))
  notify.success('小说已从书架删除')
}

const formatProgress = (value: number) => `${Math.max(0, Math.min(100, Number(value || 0))).toFixed(1)}%`

onMounted(() => {
  void loadBooks()
  void loadSiteConfig(true).then((config) => {
    heroBgImage.value = resolveHeroImage(config, 'bookshelf', BOOKSHELF_HERO_IMAGE)
    heroBgPosition.value = resolveHeroImagePosition(
      config,
      'bookshelf',
      BOOKSHELF_HERO_POSITION,
    )
  })
})

onBeforeUnmount(() => {
  if (importPollTimer != null) window.clearTimeout(importPollTimer)
})
</script>

<style scoped lang="scss">
.bookshelf-page {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0 72px;
}

:deep(.page-hero--left .page-hero__content) {
  max-width: 1120px;
}

:deep(.page-hero__meta) {
  margin-top: 1.55rem;
}

.library-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 26px;
}

.library-toolbar h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 24px;
}

.library-toolbar > div > span {
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.library-toolbar__controls {
  --bookshelf-toolbar-control-height: var(--control-height-md);
  display: grid;
  grid-template-columns: minmax(220px, 320px) 150px auto;
  gap: 10px;
  align-items: stretch;
}

.library-toolbar__controls > :deep(.ui-input),
.library-toolbar__controls > :deep(.ui-select),
.library-toolbar__controls > :deep(.ui-button) {
  height: var(--bookshelf-toolbar-control-height) !important;
}

.library-toolbar__controls > :deep(.ui-select .el-select__wrapper) {
  box-sizing: border-box;
  height: var(--bookshelf-toolbar-control-height) !important;
  min-height: var(--bookshelf-toolbar-control-height) !important;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px 16px;
  justify-content: start;
}

.book-card {
  position: relative;
  min-width: 0;
}

.book-card__main {
  position: relative;
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 16px;
  min-height: 160px;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: transform var(--motion-duration-base) var(--motion-ease-standard);
}

.book-card__main:hover {
  transform: translateY(-2px);
}

.book-card__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 3px 0 0;
  text-align: left;
}

.book-card h3 {
  margin: 0;
  overflow: hidden;
  color: var(--color-text-primary);
  display: -webkit-box;
  font-size: 16px;
  line-height: 1.45;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.book-card__author {
  margin: 0;
  overflow: hidden;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.55;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.book-card__progress {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  color: var(--color-text-tertiary);
  font-family: inherit;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.55;
}

.book-card__progress-value {
  color: inherit;
  font: inherit;
  letter-spacing: normal;
}

.book-card__description {
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  letter-spacing: normal;
  line-height: 1.65;
}

.book-card__task-status {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 7px;
  margin: 2px 0 0;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
}

.book-card__task-status > span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.book-card__task-status.is-importing > span {
  animation: bookshelf-task-pulse 1.5s ease-in-out infinite;
}

.book-card__task-status.is-failed {
  color: var(--color-danger);
}

.book-card.is-importing .book-card__main {
  cursor: progress;
}

.book-card.is-importing :deep(.book-cover) {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary) 22%, transparent);
}

.book-card__description {
  display: -webkit-box;
  margin: auto 0 0;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

@keyframes bookshelf-task-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

.book-card :deep(.book-cover) {
  align-self: start;
  padding: 12px;
}

.book-card :deep(.book-cover::after) {
  inset: 7px;
}

.book-card :deep(.book-cover__ornament) {
  font-size: 16px !important;
}

@media (max-width: 720px) {
  .bookshelf-page {
    width: min(100% - 24px, 1120px);
    padding-top: 18px;
  }
  .library-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .library-toolbar__controls {
    grid-template-columns: 1fr;
  }
  .book-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

</style>
