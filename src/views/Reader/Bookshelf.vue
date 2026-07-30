<template>
  <DefaultLayout wide-content>
    <template #hero>
      <PageHero
        title="书架"
        eyebrow="Reading Shelf"
        subtitle="浏览公开故事，也为自己保留一处安静的阅读空间。"
        :bg-image="BOOKSHELF_HERO_IMAGE"
        bg-position="50% 47%"
        min-height="64vh"
        align="left"
        compact
        scroll-target="#bookshelf-content"
      />
    </template>

    <main id="bookshelf-content" class="bookshelf-page">
      <header class="bookshelf-content__heading">
        <div>
          <h2>阅读清单</h2>
          <p>已公开的书籍可直接阅读，你导入的书籍可随时调整可见范围。</p>
        </div>
        <span v-if="books.length" class="bookshelf-content__count">
          {{ books.length }} 本 · {{ totalChapterCount }} 章
        </span>
      </header>

      <UiLoadingState :loading="loading" message="正在整理你的书架…">
        <template v-if="books.length">
          <article v-if="continueBook" class="continue-reading">
            <div class="continue-reading__cover">
              <ReaderBookCover
                :title="continueBook.title"
                :format="continueBook.sourceFormat"
                :url="continueBook.coverUrl"
              />
            </div>
            <div class="continue-reading__body">
              <span>继续阅读</span>
              <h2>{{ continueBook.title }}</h2>
              <p>
                {{ continueBook.currentChapterTitle || '从正文开始' }}
                <template v-if="continueBook.lastReadAt">
                  · {{ relativeTime(continueBook.lastReadAt) }}
                </template>
              </p>
              <div class="continue-reading__progress">
                <div><span :style="{ width: `${continueBook.progressPercent || 0}%` }" /></div>
                <small>{{ formatProgress(continueBook.progressPercent) }}</small>
              </div>
              <UiButton variant="primary" icon="book" @click="openBook(continueBook)">
                接着读
              </UiButton>
            </div>
          </article>

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
              <UiButton variant="primary" :icon="isLoggedIn ? 'upload' : 'user'" @click="openImport">
                {{ isLoggedIn ? '导入小说' : '登录后导入' }}
              </UiButton>
            </div>
          </div>

          <div v-if="filteredBooks.length" class="book-grid">
            <article v-for="book in filteredBooks" :key="String(book.id)" class="book-card">
              <button type="button" class="book-card__main" @click="openBook(book)">
                <ReaderBookCover
                  :title="book.title"
                  :format="book.sourceFormat"
                  :url="book.coverUrl"
                />
                <span class="book-card__status">
                  {{ book.ownedByCurrentUser
                    ? (book.finished ? '已读完' : book.progressPercent > 0 ? formatProgress(book.progressPercent) : '未开始')
                    : '公开阅读' }}
                </span>
              </button>
              <div class="book-card__info">
                <div>
                  <h3 :title="book.title">{{ book.title }}</h3>
                  <p>{{ book.author || '未知作者' }}</p>
                </div>
                <div class="book-card__meta">
                  <span>{{ book.chapterCount }} 章</span>
                  <span>{{ formatCharCount(book.totalCharCount) }}</span>
                  <span>{{ book.sourceFormat.toUpperCase() }}</span>
                  <span>{{ book.visibility === 'public' ? '公开' : '仅自己' }}</span>
                </div>
                <div v-if="book.ownedByCurrentUser" class="book-card__progress">
                  <span :style="{ width: `${book.progressPercent || 0}%` }" />
                </div>
                <div v-if="book.ownedByCurrentUser" class="book-card__actions">
                  <UiButton variant="text" size="sm" icon="edit" @click="editBook(book)">编辑</UiButton>
                  <UiButton variant="text" size="sm" icon="delete" @click="removeBook(book)">删除</UiButton>
                </div>
              </div>
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
          :description="isLoggedIn
            ? '导入 TXT、EPUB、HTML、Markdown 或 FB2，目录和阅读位置会自动保存。'
            : '这里会展示公开书籍。登录后可以导入小说，并选择公开或仅自己可见。'"
          icon="book"
          size="lg"
        >
          <template #action>
            <UiButton
              variant="primary"
              :icon="isLoggedIn ? 'upload' : 'user'"
              @click="openImport"
            >
              {{ isLoggedIn ? '导入第一本小说' : '登录后导入小说' }}
            </UiButton>
          </template>
        </UiEmpty>
      </UiLoadingState>
    </main>

    <ReaderImportDialog
      v-model="importOpen"
      @imported="handleImported"
    />

    <UiDialog v-model="editOpen" title="编辑书籍信息" size="sm">
      <div class="edit-form">
        <label>
          <span>书名</span>
          <UiInput v-model="editForm.title" maxlength="255" />
        </label>
        <label>
          <span>作者</span>
          <UiInput v-model="editForm.author" maxlength="255" />
        </label>
        <label>
          <span>简介</span>
          <UiInput v-model="editForm.description" type="textarea" :rows="4" maxlength="4000" />
        </label>
        <label>
          <span>封面</span>
          <div class="edit-cover">
            <UiUpload
              :show-file-list="false"
              :http-request="handleEditCoverUpload"
              :before-upload="beforeEditCoverUpload"
              accept="image/jpeg,image/png,image/webp,image/gif"
              :disabled="uploadingEditCover"
            >
              <div class="edit-cover__picker" :class="{ 'has-cover': editForm.coverUrl }">
                <img v-if="editForm.coverUrl" :src="editForm.coverUrl" alt="书籍封面预览" />
                <template v-else>
                  <UiIcon name="upload" />
                  <span>{{ uploadingEditCover ? '正在上传' : '更换封面' }}</span>
                </template>
              </div>
            </UiUpload>
            <small>上传新图片后，保存书籍信息即可生效。</small>
          </div>
        </label>
        <label>
          <span>可见范围</span>
          <UiSelect v-model="editForm.visibility" :options="visibilityOptions" />
        </label>
      </div>
      <template #footer>
        <UiButton variant="text" @click="editOpen = false">取消</UiButton>
        <UiButton variant="primary" :loading="savingEdit" @click="saveEdit">保存</UiButton>
      </template>
    </UiDialog>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import ReaderBookCover from '@/components/Reader/ReaderBookCover.vue'
import ReaderImportDialog from '@/components/Reader/ReaderImportDialog.vue'
import {
  UiButton,
  UiDialog,
  UiEmpty,
  UiInput,
  UiLoadingState,
  UiSelect,
  UiUpload,
} from '@/components/ui'
import type { UploadRequestOptions } from '@/components/ui'
import { deleteReaderBook, listReaderBooks, updateReaderBook, uploadReaderBookCover } from '@/api/reader'
import { confirmDelete, notify } from '@/lib/feedback'
import { useUserStore } from '@/stores/user'
import type { ReaderBook, ReaderBookVisibility } from '@/types/reader'
import { DEFAULT_IMAGE_MAX_MB, validateImageFile } from '@/utils/validation'

const BOOKSHELF_HERO_IMAGE =
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=2200&q=88'

const router = useRouter()
const userStore = useUserStore()
userStore.initUser()
const { isLoggedIn } = storeToRefs(userStore)
const books = ref<ReaderBook[]>([])
const loading = ref(true)
const importOpen = ref(false)
const editOpen = ref(false)
const savingEdit = ref(false)
const editingId = ref<ReaderBook['id']>()
const keyword = ref('')
const sortBy = ref('recent')
const editForm = reactive<{
  title: string
  author: string
  description: string
  coverUrl: string
  coverFileId?: ReaderBook['id']
  visibility: ReaderBookVisibility
}>({ title: '', author: '', description: '', coverUrl: '', coverFileId: undefined, visibility: 'private' })
const uploadingEditCover = ref(false)

const sortOptions = [
  { label: '最近阅读', value: 'recent' },
  { label: '最近导入', value: 'created' },
  { label: '书名排序', value: 'title' },
  { label: '阅读进度', value: 'progress' },
]
const visibilityOptions = [
  { label: '仅自己可见', value: 'private' },
  { label: '公开，所有访客可阅读', value: 'public' },
]

const continueBook = computed(() => books.value.find((book) => book.ownedByCurrentUser && book.lastReadAt && !book.finished))
const totalChapterCount = computed(() => books.value.reduce((sum, book) => sum + book.chapterCount, 0))
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
  } finally {
    loading.value = false
  }
}

const openBook = (book: ReaderBook) => {
  void router.push({ name: 'NovelReader', params: { bookId: String(book.id) } })
}

const openImport = () => {
  if (isLoggedIn.value) {
    importOpen.value = true
    return
  }
  void router.push({ path: '/login', query: { redirect: '/bookshelf' } })
}

const handleImported = (book: ReaderBook) => {
  books.value = [book, ...books.value.filter((item) => String(item.id) !== String(book.id))]
}

const editBook = (book: ReaderBook) => {
  editingId.value = book.id
  editForm.title = book.title
  editForm.author = book.author || ''
  editForm.description = book.description || ''
  editForm.coverUrl = book.coverUrl || ''
  editForm.coverFileId = undefined
  editForm.visibility = book.visibility
  editOpen.value = true
}

const saveEdit = async () => {
  if (!editingId.value || !editForm.title.trim() || savingEdit.value) return
  savingEdit.value = true
  try {
    const updated = await updateReaderBook(editingId.value, {
      title: editForm.title.trim(),
      author: editForm.author.trim() || undefined,
      description: editForm.description.trim() || undefined,
      coverFileId: editForm.coverFileId,
      visibility: editForm.visibility,
    })
    books.value = books.value.map((book) => String(book.id) === String(updated.id) ? updated : book)
    editOpen.value = false
    notify.success('书籍信息已更新')
  } finally {
    savingEdit.value = false
  }
}

const beforeEditCoverUpload = (file: File) => {
  const result = validateImageFile(file, DEFAULT_IMAGE_MAX_MB)
  if (!result.valid) notify.warning(result.message)
  return result.valid
}

const handleEditCoverUpload = async (options: UploadRequestOptions) => {
  uploadingEditCover.value = true
  try {
    const uploaded = await uploadReaderBookCover(options.file as File)
    if (uploaded.id == null || !uploaded.url) throw new Error('封面上传结果不完整')
    editForm.coverFileId = uploaded.id
    editForm.coverUrl = uploaded.url
    options.onSuccess?.(uploaded)
    notify.success('封面已上传，保存后生效')
  } catch (error) {
    options.onError?.(error as any)
    notify.error('封面上传失败，请重新选择图片')
  } finally {
    uploadingEditCover.value = false
  }
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
const formatCharCount = (value: number) => value >= 10_000
  ? `${(value / 10_000).toFixed(value >= 100_000 ? 0 : 1)} 万字`
  : `${value} 字`
const relativeTime = (value: string) => {
  const diff = Date.now() - Date.parse(value)
  const minutes = Math.max(1, Math.round(diff / 60_000))
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.round(hours / 24)
  return days < 30 ? `${days} 天前` : new Date(value).toLocaleDateString('zh-CN')
}

onMounted(loadBooks)
</script>

<style scoped lang="scss">
.bookshelf-page {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0 72px;
}

.bookshelf-content__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin: 0 0 28px;
  padding: 0 4px 22px;
  border-bottom: 1px solid var(--color-border-light);
}

.bookshelf-content__heading h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 24px;
  font-weight: 700;
}

.bookshelf-content__heading p {
  max-width: 620px;
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.bookshelf-content__count {
  flex: 0 0 auto;
  padding-top: 5px;
  color: var(--color-text-tertiary);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

:deep(.page-hero--left .page-hero__content) {
  max-width: 1120px;
}

:deep(.page-hero__meta) {
  margin-top: 1.55rem;
}

.continue-reading {
  display: grid;
  grid-template-columns: 170px 1fr;
  gap: clamp(24px, 4vw, 54px);
  align-items: center;
  margin-bottom: 58px;
  padding: clamp(24px, 4vw, 44px);
  overflow: hidden;
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 90% 8%, color-mix(in srgb, var(--primary) 13%, transparent), transparent 34%),
    var(--color-surface);
}

.continue-reading__cover {
  width: 170px;
}

.continue-reading__body > span {
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.continue-reading h2 {
  margin: 8px 0 8px;
  color: var(--color-text-primary);
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.2;
}

.continue-reading p {
  margin: 0;
  color: var(--color-text-secondary);
}

.continue-reading__progress {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 460px;
  margin: 24px 0 20px;
}

.continue-reading__progress > div {
  flex: 1;
  height: 4px;
  overflow: hidden;
  background: var(--color-border-light);
}

.continue-reading__progress span,
.book-card__progress span {
  display: block;
  height: 100%;
  background: var(--primary);
}

.continue-reading__progress small {
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.library-toolbar {
  display: flex;
  align-items: flex-end;
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
  display: grid;
  grid-template-columns: minmax(220px, 320px) 150px auto;
  gap: 10px;
  align-items: center;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: clamp(24px, 3vw, 38px) clamp(20px, 3vw, 34px);
}

.book-card {
  min-width: 0;
}

.book-card__main {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: transform var(--motion-duration-base) var(--motion-ease-standard);
}

.book-card__main:hover {
  transform: translateY(-5px);
}

.book-card__status {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 5px 8px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  background: rgba(27, 20, 24, 0.7);
  color: #fff;
  font-size: 11px;
  backdrop-filter: blur(7px);
}

.book-card__info {
  display: grid;
  gap: 10px;
  padding-top: 15px;
}

.book-card h3 {
  margin: 0;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: 17px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-card p {
  margin: 4px 0 0;
  overflow: hidden;
  color: var(--color-text-tertiary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 10px;
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.book-card__meta span + span::before {
  content: '·';
  margin-right: 10px;
}

.book-card__progress {
  height: 3px;
  overflow: hidden;
  background: var(--color-border-light);
}

.book-card__actions {
  display: flex;
  justify-content: space-between;
  opacity: 0;
  transition: opacity var(--motion-duration-fast);
}

.book-card:hover .book-card__actions,
.book-card:focus-within .book-card__actions {
  opacity: 1;
}

.edit-form {
  display: grid;
  gap: 18px;
}

.edit-form label {
  display: grid;
  gap: 7px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.edit-cover {
  display: flex;
  align-items: center;
  gap: 12px;
}

.edit-cover__picker {
  display: grid;
  place-content: center;
  justify-items: center;
  width: 76px;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  font-size: 11px;
  text-align: center;
}

.edit-cover__picker:hover { border-color: var(--color-action-border); }
.edit-cover__picker img { width: 100%; height: 100%; object-fit: cover; }
.edit-cover__picker :deep(.ui-icon) { color: var(--primary); font-size: 18px; }
.edit-cover small { color: var(--color-text-tertiary); font-size: 12px; font-weight: 400; line-height: 1.5; }

@media (max-width: 720px) {
  .bookshelf-page {
    width: min(100% - 24px, 1120px);
    padding-top: 18px;
  }
  .bookshelf-content__heading {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 22px;
  }
  .bookshelf-content__count {
    padding-top: 0;
  }
  .library-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .continue-reading {
    grid-template-columns: 100px 1fr;
    gap: 20px;
    padding: 20px;
  }
  .continue-reading__cover {
    width: 100px;
  }
  .continue-reading h2 {
    font-size: 24px;
  }
  .library-toolbar__controls {
    grid-template-columns: 1fr;
  }
  .book-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 28px 16px;
  }
  .book-card__actions {
    opacity: 1;
  }
}

@media (max-width: 430px) {
  .continue-reading {
    grid-template-columns: 76px 1fr;
  }
  .continue-reading__cover {
    width: 76px;
  }
  .continue-reading__progress {
    display: none;
  }
}
</style>
