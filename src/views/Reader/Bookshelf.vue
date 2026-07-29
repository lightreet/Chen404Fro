<template>
  <DefaultLayout wide-content>
    <section class="bookshelf-page">
      <header class="bookshelf-hero">
        <div>
          <p class="eyebrow"><UiIcon name="book" /> PRIVATE LIBRARY</p>
          <h1>我的书架</h1>
          <p>把故事带进来，从上次停下的地方继续。</p>
        </div>
        <UiButton variant="primary" size="lg" icon="upload" @click="importOpen = true">
          导入小说
        </UiButton>
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
              <span>{{ books.length }} 本 · {{ totalChapterCount }} 章</span>
            </div>
            <div class="library-toolbar__controls">
              <UiInput
                v-model="keyword"
                clearable
                prefix-icon="search"
                placeholder="搜索书名或作者"
              />
              <UiSelect v-model="sortBy" :options="sortOptions" />
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
                  {{ book.finished ? '已读完' : book.progressPercent > 0 ? formatProgress(book.progressPercent) : '未开始' }}
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
                </div>
                <div class="book-card__progress">
                  <span :style="{ width: `${book.progressPercent || 0}%` }" />
                </div>
                <div class="book-card__actions">
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
          description="导入 TXT、EPUB、HTML、Markdown 或 FB2，目录和阅读位置会自动保存。"
          icon="book"
          size="lg"
        >
          <template #action>
            <UiButton variant="primary" icon="upload" @click="importOpen = true">导入第一本小说</UiButton>
          </template>
        </UiEmpty>
      </UiLoadingState>
    </section>

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
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import ReaderBookCover from '@/components/Reader/ReaderBookCover.vue'
import ReaderImportDialog from '@/components/Reader/ReaderImportDialog.vue'
import {
  UiButton,
  UiDialog,
  UiEmpty,
  UiIcon,
  UiInput,
  UiLoadingState,
  UiSelect,
} from '@/components/ui'
import { deleteReaderBook, listReaderBooks, updateReaderBook } from '@/api/reader'
import { confirmDelete, notify } from '@/lib/feedback'
import type { ReaderBook } from '@/types/reader'

const router = useRouter()
const books = ref<ReaderBook[]>([])
const loading = ref(true)
const importOpen = ref(false)
const editOpen = ref(false)
const savingEdit = ref(false)
const editingId = ref<ReaderBook['id']>()
const keyword = ref('')
const sortBy = ref('recent')
const editForm = reactive({ title: '', author: '', description: '' })

const sortOptions = [
  { label: '最近阅读', value: 'recent' },
  { label: '最近导入', value: 'created' },
  { label: '书名排序', value: 'title' },
  { label: '阅读进度', value: 'progress' },
]

const continueBook = computed(() => books.value.find((book) => book.lastReadAt && !book.finished))
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

const handleImported = (book: ReaderBook) => {
  books.value = [book, ...books.value]
}

const editBook = (book: ReaderBook) => {
  editingId.value = book.id
  editForm.title = book.title
  editForm.author = book.author || ''
  editForm.description = book.description || ''
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
    })
    books.value = books.value.map((book) => String(book.id) === String(updated.id) ? updated : book)
    editOpen.value = false
    notify.success('书籍信息已更新')
  } finally {
    savingEdit.value = false
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
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 32px clamp(4px, 2vw, 20px) 72px;
}

.bookshelf-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 42px;
  padding: 22px 4px 30px;
  border-bottom: 1px solid var(--color-border-light);
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.bookshelf-hero h1 {
  margin: 0;
  color: var(--color-text-primary);
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: clamp(36px, 6vw, 62px);
  font-weight: 700;
  letter-spacing: -0.04em;
}

.bookshelf-hero > div > p:last-child {
  margin: 12px 0 0;
  color: var(--color-text-secondary);
  font-size: 16px;
}

.continue-reading {
  display: grid;
  grid-template-columns: 170px 1fr;
  gap: clamp(24px, 4vw, 54px);
  align-items: center;
  margin-bottom: 58px;
  padding: clamp(24px, 4vw, 44px);
  overflow: hidden;
  border: 1px solid var(--color-border-light);
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
  margin-bottom: 24px;
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
  grid-template-columns: minmax(220px, 320px) 150px;
  gap: 10px;
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

@media (max-width: 720px) {
  .bookshelf-page {
    padding-top: 10px;
  }
  .bookshelf-hero,
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
