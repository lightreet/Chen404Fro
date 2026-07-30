<template>
  <UiDialog
    :model-value="modelValue"
    title="导入小说"
    size="lg"
    :close-on-click-modal="!importing"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="import-form" @submit.prevent="submit">
      <section class="source-section" aria-labelledby="source-file-title">
        <div class="section-heading">
          <div>
            <h3 id="source-file-title">选择小说文件</h3>
            <p>支持 TXT、EPUB、HTML、Markdown 和 FB2，最大 60MB。</p>
          </div>
          <span v-if="selectedFile" class="source-section__ready">文件已就绪</span>
        </div>
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
          <span class="drop-zone__copy">
            <strong>{{ selectedFile?.name || '拖入小说文件，或点击选择' }}</strong>
            <small v-if="selectedFile">{{ formatBytes(selectedFile.size) }} · {{ selectedFile.name.split('.').pop()?.toUpperCase() }} 文件</small>
            <small v-else>选好后可以继续填写封面、简介和阅读权限。</small>
          </span>
          <span v-if="selectedFile" class="drop-zone__action">更换文件</span>
        </button>
      </section>
      <input
        ref="fileInput"
        class="visually-hidden"
        type="file"
        accept=".txt,.epub,.html,.htm,.xhtml,.md,.markdown,.fb2"
        @change="handleFileInput"
      />

      <section class="book-profile" aria-labelledby="book-profile-title">
        <div class="book-profile__head">
          <div>
            <h3 id="book-profile-title">书籍资料</h3>
            <p>书名、简介和封面会展示在书架中，导入后仍可修改。</p>
          </div>
        </div>

        <div class="book-profile__layout">
          <div class="cover-field">
            <span>自定义封面</span>
            <UiUpload
              :show-file-list="false"
              :http-request="handleCoverUpload"
              :before-upload="beforeCoverUpload"
              accept="image/jpeg,image/png,image/webp,image/gif"
              :disabled="importing || uploadingCover"
            >
              <div class="cover-picker" :class="{ 'has-cover': coverUrl, 'is-uploading': uploadingCover }">
                <img v-if="coverUrl" :src="coverUrl" alt="书籍封面预览" />
                <template v-else>
                  <UiIcon name="upload" />
                  <strong>{{ uploadingCover ? '正在上传' : '上传封面' }}</strong>
                  <small>JPG、PNG、WEBP 或 GIF<br />建议使用竖版图片</small>
                </template>
              </div>
            </UiUpload>
            <button v-if="coverUrl" type="button" class="cover-remove" :disabled="importing" @click="clearCover">
              移除封面
            </button>
          </div>

          <div class="book-profile__fields">
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
            <label>
              <span>简介（可选）</span>
              <UiTextarea
                v-model="description"
                :rows="3"
                :maxlength="4000"
                :show-count="true"
                resize="vertical"
                placeholder="写下这本书适合怎样的阅读时刻，公开书籍会向访客展示这段简介。"
              />
            </label>
          </div>
        </div>
      </section>

      <section class="import-options" aria-label="导入设置">
        <div class="section-heading">
          <div>
            <h3>导入设置</h3>
            <p>系统会自动识别文本编码；阅读权限可在导入后调整。</p>
          </div>
        </div>
        <div class="import-form__grid">
          <label class="import-form__encoding">
            <span>文本编码</span>
            <UiSelect v-model="encoding" :options="encodingOptions" placeholder="自动识别" />
            <small>乱码时可手动指定。</small>
          </label>
          <label>
            <span>可见范围</span>
            <UiSelect v-model="visibility" :options="visibilityOptions" />
            <small>公开书籍任何访客可读，知友可见仅开放给站点知友。</small>
          </label>
        </div>
      </section>

      <div class="format-note" role="note">
        <UiIcon name="info" />
        <p>EPUB 会保留书脊顺序、多级目录和内嵌插图；纯文本会识别卷、部、章、序章、番外等标题。MOBI、AZW3 与 PDF 请先用 Calibre 转换为 EPUB。</p>
      </div>

      <div v-if="importing" class="import-progress" aria-live="polite">
        <div
          role="progressbar"
          aria-label="小说导入进度"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="uploadProgress"
        ><span :style="{ transform: `scaleX(${uploadProgress / 100})` }" /></div>
        <p>{{ uploadProgress < 100 ? `正在上传 ${uploadProgress}%` : '正在解析目录和正文…' }}</p>
      </div>
    </form>

    <template #footer>
      <UiButton variant="text" :disabled="importing" @click="emit('update:modelValue', false)">取消</UiButton>
      <UiButton
        variant="primary"
        icon="upload"
        :loading="importing"
        :disabled="!selectedFile || uploadingCover"
        @click="submit"
      >
        导入书架
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { UiButton, UiDialog, UiIcon, UiInput, UiSelect, UiTextarea, UiUpload } from '@/components/ui'
import type { UploadRequestOptions } from '@/components/ui'
import { importReaderBook, uploadReaderBookCover } from '@/api/reader'
import { notify } from '@/lib/feedback'
import type { ReaderBook, ReaderBookVisibility } from '@/types/reader'
import { DEFAULT_IMAGE_MAX_MB, validateImageFile } from '@/utils/validation'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'imported', value: ReaderBook): void
}>()

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File>()
const title = ref('')
const author = ref('')
const description = ref('')
const encoding = ref('')
const visibility = ref<ReaderBookVisibility>('public')
const coverFileId = ref<string | number>()
const coverUrl = ref('')
const dragging = ref(false)
const importing = ref(false)
const uploadingCover = ref(false)
const uploadProgress = ref(0)

const encodingOptions = [
  { label: '自动识别（推荐）', value: '' },
  { label: 'UTF-8', value: 'UTF-8' },
  { label: 'GB18030 / GBK', value: 'GB18030' },
  { label: 'Big5', value: 'Big5' },
  { label: 'UTF-16 LE', value: 'UTF-16LE' },
  { label: 'UTF-16 BE', value: 'UTF-16BE' },
]
const visibilityOptions = [
  { label: '公开（默认）', value: 'public' },
  { label: '知友可见', value: 'friend' },
  { label: '仅自己可见', value: 'private' },
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

const handleFileInput = (event: Event) => selectFile((event.target as HTMLInputElement).files?.[0])
const handleDrop = (event: DragEvent) => selectFile(event.dataTransfer?.files?.[0])
const formatBytes = (bytes: number) => bytes >= 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
  : `${Math.max(1, Math.round(bytes / 1024))} KB`

const beforeCoverUpload = (file: File) => {
  const result = validateImageFile(file, DEFAULT_IMAGE_MAX_MB)
  if (!result.valid) notify.warning(result.message)
  return result.valid
}

const handleCoverUpload = async (options: UploadRequestOptions) => {
  uploadingCover.value = true
  try {
    const uploaded = await uploadReaderBookCover(options.file as File)
    if (uploaded.id == null || !uploaded.url) throw new Error('封面上传结果不完整')
    coverFileId.value = uploaded.id
    coverUrl.value = uploaded.url
    options.onSuccess?.(uploaded)
    notify.success('封面已上传，将在导入时绑定')
  } catch (error) {
    options.onError?.(error as any)
    notify.error('封面上传失败，请重新选择图片')
  } finally {
    uploadingCover.value = false
  }
}

const clearCover = () => {
  coverFileId.value = undefined
  coverUrl.value = ''
}

const reset = () => {
  selectedFile.value = undefined
  title.value = ''
  author.value = ''
  description.value = ''
  encoding.value = ''
  visibility.value = 'public'
  clearCover()
  uploadProgress.value = 0
  if (fileInput.value) fileInput.value.value = ''
}

const submit = async () => {
  if (!selectedFile.value || importing.value || uploadingCover.value) return
  importing.value = true
  uploadProgress.value = 1
  try {
    const book = await importReaderBook(selectedFile.value, {
      title: title.value,
      author: author.value,
      description: description.value,
      encoding: encoding.value,
      visibility: visibility.value,
      coverFileId: coverFileId.value,
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
.import-form { display: grid; gap: 26px; }

.source-section, .book-profile, .import-options { display: grid; gap: 16px; }
.section-heading, .book-profile__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.section-heading h3, .book-profile__head h3 { margin: 0; color: var(--color-text-primary); font-size: 16px; }
.section-heading p, .book-profile__head p { margin: 5px 0 0; color: var(--color-text-secondary); font-size: 13px; line-height: 1.6; }
.source-section__ready { padding: 4px 8px; border-radius: var(--radius-pill); background: var(--color-accent-soft); color: var(--color-action-text); font-size: 12px; font-weight: 700; }

.drop-zone {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 108px;
  padding: 20px 22px;
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--motion-duration-fast), background-color var(--motion-duration-fast);
}

.drop-zone:hover, .drop-zone.is-dragging { border-color: var(--color-action-border); background: var(--color-accent-soft); }
.drop-zone.has-file { border-style: solid; border-color: var(--color-action-border); }
.drop-zone :deep(.ui-icon) { flex: 0 0 auto; font-size: 28px; color: var(--primary); }
.drop-zone__copy { display: grid; min-width: 0; gap: 4px; }
.drop-zone strong { overflow: hidden; color: var(--color-text-primary); font-size: 15px; text-overflow: ellipsis; white-space: nowrap; }
.drop-zone small { color: var(--color-text-secondary); font-size: 13px; line-height: 1.5; }
.drop-zone__action { margin-left: auto; color: var(--color-action-text); font-size: 13px; font-weight: 700; white-space: nowrap; }

.book-profile, .import-options { padding-top: 24px; border-top: 1px solid var(--color-border-light); }
.book-profile__layout { display: grid; grid-template-columns: 118px minmax(0, 1fr); gap: 24px; }
.book-profile__fields { display: grid; align-content: start; gap: 16px; }

.cover-field { display: grid; align-content: start; gap: 8px; color: var(--color-text-secondary); font-size: 13px; font-weight: 600; }
.cover-picker { display: grid; place-content: center; justify-items: center; gap: 6px; width: 112px; aspect-ratio: 2 / 3; overflow: hidden; border: 1px dashed var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-muted); color: var(--color-text-secondary); text-align: center; transition: border-color var(--motion-duration-fast), background-color var(--motion-duration-fast); }
.cover-picker:hover, .cover-picker.is-uploading { border-color: var(--color-action-border); background: var(--color-accent-soft); }
.cover-picker :deep(.ui-icon) { color: var(--primary); font-size: 20px; }
.cover-picker strong { color: var(--color-text-primary); font-size: 12px; }
.cover-picker small { color: var(--color-text-tertiary); font-size: 10px; font-weight: 400; line-height: 1.5; }
.cover-picker img { width: 100%; height: 100%; object-fit: cover; }
.cover-remove { justify-self: start; padding: 0; border: 0; background: transparent; color: var(--color-action-text); cursor: pointer; font: inherit; font-size: 12px; }
.cover-remove:disabled { cursor: not-allowed; opacity: .6; }

.import-form__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.import-form label { display: grid; gap: 8px; color: var(--color-text-secondary); font-size: 13px; font-weight: 600; }
.import-form__encoding { max-width: 360px; }
.import-form small { color: var(--color-text-tertiary); font-weight: 400; line-height: 1.6; }

.format-note { display: flex; align-items: flex-start; gap: 10px; padding: 12px 0 0; border-top: 1px solid var(--color-border-light); color: var(--color-text-secondary); }
.format-note :deep(.ui-icon) { flex: 0 0 auto; margin-top: 2px; color: var(--color-action-text); }
.format-note p { margin: 0; font-size: 13px; line-height: 1.7; }
.import-progress { display: grid; gap: 8px; }
.import-progress > div { height: 5px; overflow: hidden; border-radius: var(--radius-pill); background: var(--color-border-light); }
.import-progress span { display: block; width: 100%; height: 100%; transform-origin: left center; background: var(--primary); transition: transform 180ms ease; }
.import-progress p { margin: 0; color: var(--color-text-secondary); font-size: 12px; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }

@media (max-width: 640px) {
  .import-form__grid { grid-template-columns: 1fr; }
  .drop-zone { min-height: 96px; padding: 16px; }
  .drop-zone__action { display: none; }
  .book-profile, .import-options { padding-top: 20px; }
  .book-profile__layout { grid-template-columns: 92px minmax(0, 1fr); gap: 14px; }
  .cover-picker { width: 88px; }
}
</style>
