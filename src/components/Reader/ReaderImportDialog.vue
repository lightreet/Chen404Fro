<template>
  <UiDialog
    :model-value="modelValue"
    title="导入小说"
    size="lg"
    :close-on-click-modal="!importing"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="import-form" @submit.prevent="submit">
      <button
        type="button"
        class="drop-zone"
        :class="{ 'is-dragging': dragging, 'has-file': selectedFile }"
        :disabled="importing"
        @click="fileInput?.click()"
        @dragenter.prevent="dragging = true"
        @dragover.prevent
        @dragleave.prevent="dragging = false"
        @drop.prevent="handleDrop"
      >
        <UiIcon :name="selectedFile ? 'success' : 'upload'" />
        <strong>{{ selectedFile?.name || '拖入小说文件，或点击选择' }}</strong>
        <span v-if="selectedFile">{{ formatBytes(selectedFile.size) }}</span>
        <span v-else>TXT · EPUB 2/3 · HTML · Markdown · FB2，最大 60MB</span>
      </button>
      <input
        ref="fileInput"
        class="visually-hidden"
        type="file"
        accept=".txt,.epub,.html,.htm,.xhtml,.md,.markdown,.fb2"
        @change="handleFileInput"
      />

      <div class="import-form__grid">
        <label>
          <span>书名（可选）</span>
          <UiInput v-model="title" maxlength="255" placeholder="默认读取文件或 EPUB 元数据" />
        </label>
        <label>
          <span>作者（可选）</span>
          <UiInput v-model="author" maxlength="255" placeholder="默认读取 EPUB/FB2 元数据" />
        </label>
      </div>

      <label class="import-form__encoding">
        <span>文本编码</span>
        <UiSelect
          v-model="encoding"
          :options="encodingOptions"
          placeholder="自动识别"
        />
        <small>TXT、HTML、Markdown 会自动尝试 UTF-8、GB18030、Big5 和 UTF-16；乱码时可手动指定。</small>
      </label>

      <div class="format-note">
        <UiIcon name="info" />
        <p>
          EPUB 会保留书脊顺序、多级目录和内嵌插图；纯文本会识别卷、部、章、序章、番外等标题。
          MOBI、AZW3 与 PDF 请先用 Calibre 转换为 EPUB。
        </p>
      </div>

      <div v-if="importing" class="import-progress" aria-live="polite">
        <div><span :style="{ width: `${uploadProgress}%` }" /></div>
        <p>{{ uploadProgress < 100 ? `正在上传 ${uploadProgress}%` : '正在解析目录和正文…' }}</p>
      </div>
    </form>

    <template #footer>
      <UiButton
        variant="text"
        :disabled="importing"
        @click="emit('update:modelValue', false)"
      >
        取消
      </UiButton>
      <UiButton
        variant="primary"
        icon="upload"
        :loading="importing"
        :disabled="!selectedFile"
        @click="submit"
      >
        导入书架
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { UiButton, UiDialog, UiIcon, UiInput, UiSelect } from '@/components/ui'
import { importReaderBook } from '@/api/reader'
import { notify } from '@/lib/feedback'
import type { ReaderBook } from '@/types/reader'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'imported', value: ReaderBook): void
}>()

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File>()
const title = ref('')
const author = ref('')
const encoding = ref('')
const dragging = ref(false)
const importing = ref(false)
const uploadProgress = ref(0)

const encodingOptions = [
  { label: '自动识别（推荐）', value: '' },
  { label: 'UTF-8', value: 'UTF-8' },
  { label: 'GB18030 / GBK', value: 'GB18030' },
  { label: 'Big5', value: 'Big5' },
  { label: 'UTF-16 LE', value: 'UTF-16LE' },
  { label: 'UTF-16 BE', value: 'UTF-16BE' },
]
const allowedExtensions = new Set(['txt', 'epub', 'html', 'htm', 'xhtml', 'md', 'markdown', 'fb2'])

const selectFile = (file?: File) => {
  dragging.value = false
  if (!file) return
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  if (!allowedExtensions.has(extension)) {
    notify.warning('请选择 TXT、EPUB、HTML、Markdown 或 FB2 文件')
    return
  }
  if (file.size > 60 * 1024 * 1024) {
    notify.warning('小说文件不能超过 60MB')
    return
  }
  selectedFile.value = file
  if (!title.value) title.value = file.name.replace(/\.[^.]+$/, '')
}

const handleFileInput = (event: Event) => {
  selectFile((event.target as HTMLInputElement).files?.[0])
}
const handleDrop = (event: DragEvent) => selectFile(event.dataTransfer?.files?.[0])
const formatBytes = (bytes: number) => bytes >= 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
  : `${Math.max(1, Math.round(bytes / 1024))} KB`

const reset = () => {
  selectedFile.value = undefined
  title.value = ''
  author.value = ''
  encoding.value = ''
  uploadProgress.value = 0
  if (fileInput.value) fileInput.value.value = ''
}

const submit = async () => {
  if (!selectedFile.value || importing.value) return
  importing.value = true
  uploadProgress.value = 1
  try {
    const book = await importReaderBook(selectedFile.value, {
      title: title.value,
      author: author.value,
      encoding: encoding.value,
      onProgress: (value) => {
        uploadProgress.value = value
        if (value >= 99) window.setTimeout(() => { uploadProgress.value = 100 }, 220)
      },
    })
    uploadProgress.value = 100
    notify.success(`《${book.title}》已导入，共 ${book.chapterCount} 章`)
    emit('imported', book)
    emit('update:modelValue', false)
    reset()
  } catch {
    // 请求层已经展示具体错误；这里收口事件 Promise，避免失败时产生未处理异常。
  } finally {
    importing.value = false
  }
}

watch(() => selectedFile.value?.name, () => {
  uploadProgress.value = 0
})
</script>

<style scoped lang="scss">
.import-form {
  display: grid;
  gap: 22px;
}

.drop-zone {
  display: grid;
  justify-items: center;
  gap: 8px;
  width: 100%;
  min-height: 190px;
  padding: 28px;
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    border-color var(--motion-duration-fast),
    background-color var(--motion-duration-fast),
    transform var(--motion-duration-fast);
}

.drop-zone:hover,
.drop-zone.is-dragging {
  border-color: var(--primary);
  background: var(--color-accent-soft);
}

.drop-zone.is-dragging {
  transform: scale(1.01);
}

.drop-zone :deep(.ui-icon) {
  font-size: 38px;
  color: var(--primary);
}

.drop-zone strong {
  color: var(--color-text-primary);
  font-size: 17px;
}

.drop-zone span {
  font-size: 13px;
}

.import-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.import-form label {
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.import-form__encoding {
  max-width: 360px;
}

.import-form small {
  color: var(--color-text-tertiary);
  font-weight: 400;
  line-height: 1.6;
}

.format-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-left: 3px solid var(--primary-light);
  background: var(--color-accent-soft);
  color: var(--color-text-secondary);
}

.format-note p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
}

.import-progress {
  display: grid;
  gap: 8px;
}

.import-progress > div {
  height: 5px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--color-border-light);
}

.import-progress span {
  display: block;
  height: 100%;
  background: var(--primary);
  transition: width 180ms ease;
}

.import-progress p {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

@media (max-width: 640px) {
  .import-form__grid {
    grid-template-columns: 1fr;
  }
  .drop-zone {
    min-height: 160px;
    padding: 22px 14px;
  }
}
</style>
