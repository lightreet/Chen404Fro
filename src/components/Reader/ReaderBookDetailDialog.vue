<template>
  <UiDialog
    :model-value="modelValue"
    title="书籍详情"
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <article v-if="book" class="book-detail">
      <header class="book-detail__summary">
        <ReaderBookCover
          class="book-detail__cover"
          :title="book.title"
          :format="book.sourceFormat"
          :url="book.coverUrl"
        />
        <div class="book-detail__intro">
          <h2>{{ book.title }}</h2>
          <p class="book-detail__author">{{ book.author || '未知作者' }}</p>
          <div class="book-detail__facts" aria-label="书籍基本信息">
            <span>{{ book.sourceFormat.toUpperCase() }}</span>
            <span v-if="book.status === 'ready'">{{ book.chapterCount }} 章</span>
            <span v-if="book.status === 'ready'">{{ formatCharCount(book.totalCharCount) }}</span>
          </div>
          <div v-if="book.ownedByCurrentUser && book.status === 'ready'" class="book-detail__progress">
            <div><span :style="{ width: `${book.progressPercent || 0}%` }" /></div>
            <span>{{ formatProgress(book.progressPercent) }}</span>
          </div>
        </div>
      </header>

      <section
        v-if="book.status !== 'ready'"
        class="book-detail__task-state"
        :class="`is-${book.status}`"
        aria-live="polite"
      >
        <span aria-hidden="true" />
        <div>
          <h3>{{ book.status === 'importing' ? '正在后台导入' : '导入未完成' }}</h3>
          <p>{{ book.parseMessage || (book.status === 'importing'
            ? '正在解析目录和正文，可先关闭窗口浏览其他内容。'
            : '请删除这条记录后重新导入。') }}</p>
        </div>
      </section>

      <section class="book-detail__description" aria-labelledby="book-description-title">
        <h3 id="book-description-title">简介</h3>
        <p>{{ book.description || '暂时没有留下简介。' }}</p>
      </section>

      <dl class="book-detail__metadata" aria-label="书籍详细信息">
        <div>
          <dt>导入时间</dt>
          <dd>{{ formatDate(book.createTime) }}</dd>
        </div>
        <div v-if="book.lastReadAt">
          <dt>最近阅读</dt>
          <dd>{{ formatDate(book.lastReadAt) }}</dd>
        </div>
        <div v-if="book.sourceEncoding">
          <dt>文本编码</dt>
          <dd>{{ book.sourceEncoding }}</dd>
        </div>
        <div>
          <dt>阅读范围</dt>
          <dd>{{ visibilityLabel }}</dd>
        </div>
      </dl>
    </article>

    <template #footer>
      <div v-if="book?.ownedByCurrentUser" class="book-detail__manage">
        <UiButton v-if="book.status === 'ready'" variant="text" size="sm" icon="edit" @click="requestEdit">编辑信息</UiButton>
        <UiButton
          v-if="book.status !== 'importing'"
          class="book-detail__delete"
          variant="text"
          size="sm"
          icon="delete"
          @click="requestDelete"
        >
          删除书籍
        </UiButton>
      </div>
      <UiButton variant="text" @click="emit('update:modelValue', false)">关闭</UiButton>
      <UiButton v-if="book?.status === 'ready'" variant="primary" icon="book" @click="requestRead">
        {{ readActionLabel }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ReaderBookCover from '@/components/Reader/ReaderBookCover.vue'
import { UiButton, UiDialog } from '@/components/ui'
import type { ReaderBook } from '@/types/reader'

const props = defineProps<{
  modelValue: boolean
  book?: ReaderBook
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'read', book: ReaderBook): void
  (event: 'edit', book: ReaderBook): void
  (event: 'delete', book: ReaderBook): void
}>()

const readActionLabel = computed(() => {
  const book = props.book
  return book?.ownedByCurrentUser && book.progressPercent > 0 && !book.finished ? '继续阅读' : '开始阅读'
})

const visibilityLabel = computed(() => ({
  public: '公开',
  friend: '知友可见',
  private: '仅自己可见',
}[props.book?.visibility || 'public']))

const formatProgress = (value: number) => `${Math.max(0, Math.min(100, Number(value || 0))).toFixed(1)}%`
const formatCharCount = (value: number) => value >= 10_000
  ? `${(value / 10_000).toFixed(value >= 100_000 ? 0 : 1)} 万字`
  : `${value} 字`
const formatDate = (value: string) => new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(value))

const requestRead = () => {
  if (props.book) emit('read', props.book)
}

const requestEdit = () => {
  if (props.book) emit('edit', props.book)
}

const requestDelete = () => {
  if (props.book) emit('delete', props.book)
}
</script>

<style scoped lang="scss">
.book-detail { display: grid; gap: 24px; }

.book-detail__summary { display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 22px; align-items: start; }
.book-detail__cover { width: 132px; box-shadow: 0 8px 16px rgba(61, 38, 50, 0.14); }
.book-detail__intro { display: grid; align-content: start; gap: 8px; min-width: 0; padding-top: 2px; }
.book-detail h2 { margin: 0; color: var(--color-text-primary); font-size: 24px; line-height: 1.35; text-wrap: balance; }
.book-detail__author { margin: 0; color: var(--color-text-secondary); font-size: 15px; }
.book-detail__facts { display: flex; flex-wrap: wrap; gap: 6px 10px; margin-top: 4px; color: var(--color-text-tertiary); font-size: 12px; }
.book-detail__facts span + span::before { content: '·'; margin-right: 10px; }
.book-detail__progress { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; margin-top: 12px; color: var(--color-text-tertiary); font-size: 12px; font-variant-numeric: tabular-nums; }
.book-detail__progress > div { height: 4px; overflow: hidden; background: var(--color-border-light); }
.book-detail__progress > div span { display: block; height: 100%; background: var(--primary); }

.book-detail__task-state { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 12px; padding: 15px 16px; border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent); border-radius: var(--radius-md); background: color-mix(in srgb, var(--primary) 7%, var(--color-surface)); }
.book-detail__task-state > span { width: 9px; height: 9px; margin-top: 5px; border-radius: 50%; background: var(--primary); animation: book-detail-task-pulse 1.5s ease-in-out infinite; }
.book-detail__task-state h3 { margin: 0; color: var(--color-text-primary); font-size: 14px; }
.book-detail__task-state p { margin: 4px 0 0; color: var(--color-text-secondary); font-size: 13px; line-height: 1.65; }
.book-detail__task-state.is-failed { border-color: color-mix(in srgb, var(--color-danger) 22%, transparent); background: color-mix(in srgb, var(--color-danger) 6%, var(--color-surface)); }
.book-detail__task-state.is-failed > span { background: var(--color-danger); animation: none; }

.book-detail__description { display: grid; gap: 8px; padding-top: 20px; border-top: 1px solid var(--color-border-light); }
.book-detail__description h3 { margin: 0; color: var(--color-text-primary); font-size: 15px; }
.book-detail__description p { max-height: 12em; margin: 0; overflow: auto; color: var(--color-text-secondary); font-size: 14px; line-height: 1.8; white-space: pre-wrap; }

.book-detail__metadata { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; margin: 0; padding-top: 18px; border-top: 1px solid var(--color-border-light); }
.book-detail__metadata div { display: grid; gap: 3px; min-width: 0; }
.book-detail__metadata dt { color: var(--color-text-tertiary); font-size: 12px; }
.book-detail__metadata dd { margin: 0; overflow: hidden; color: var(--color-text-secondary); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.book-detail__manage { display: flex; gap: 4px; margin-right: auto; }
.book-detail__delete { color: var(--color-danger); }

@keyframes book-detail-task-pulse {
  0%,
  100% { opacity: 0.35; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1.15); }
}

@media (max-width: 560px) {
  .book-detail__summary { grid-template-columns: 102px minmax(0, 1fr); gap: 16px; }
  .book-detail__cover { width: 102px; }
  .book-detail h2 { font-size: 20px; }
  .book-detail__metadata { grid-template-columns: 1fr; gap: 10px; }
}
</style>
