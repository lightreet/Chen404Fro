<template>
  <UiButton v-bind="$attrs" variant="ghost" icon="Upload" aria-label="导入 Markdown" :disabled="disabled" @click="openDialog">
    导入<span class="import-button-format"> Markdown</span>
  </UiButton>
  <UiDialog :model-value="open" title="导入 Markdown" size="xl" centered :close-on-click-modal="false" @update:model-value="closeDialog">
    <div class="markdown-import">
      <input ref="fileInput" type="file" accept=".md,.markdown" class="file-input" aria-label="选择 Markdown 文件" @change="selectFile" />
      <button type="button" class="file-drop" :disabled="busy || applying" @click="fileInput?.click()" @dragover.prevent @drop.prevent="dropFile">
        <UiIcon name="Document" :size="24" />
        <span class="file-name">{{ draft?.fileName || '选择或拖入 Markdown 文件' }}</span>
        <small>{{ reading ? '正在读取…' : '.md / .markdown · UTF-8 · 最大 1 MB' }}</small>
      </button>
      <p v-if="error" class="import-error" role="alert">{{ error }}</p>
      <template v-if="draft">
        <div class="import-fields">
          <label>文章标题<UiInput v-model="draft.title" aria-label="导入文章标题" :maxlength="100" :disabled="applying" /></label>
          <label>内容摘要<UiInput v-model="draft.summary" aria-label="导入内容摘要" type="textarea" :rows="2" :maxlength="500" :disabled="applying" /></label>
          <div class="import-meta">
            <label><span>文章分类 <span class="required">必选</span></span>
              <UiSelect v-model="categoryId" placeholder="请选择文章分类" :options="categoryOptions" :disabled="applying" />
            </label>
            <label>标签<UiInput v-model="tagText" aria-label="导入标签" placeholder="用逗号分隔，可继续修改" :disabled="applying" /></label>
          </div>
          <p v-if="!categories.length" class="import-error">暂无可选分类，请先在个人中心添加分类后再导入。</p>
        </div>

        <section class="import-images" aria-label="文章图片">
          <div class="images-heading"><strong>文章图片 · {{ imageStates.length }} 张</strong><span role="status">{{ imageStatusText }}</span></div>
          <p v-if="!imageStates.length" class="import-help">正文没有图片。导入后可用编辑器的图片工具上传、粘贴或添加图片链接。</p>
          <p v-else class="import-help">图片链接自动转存到站内。失败的图片保留原链接，也可选择本地图片替换。</p>
          <ul v-if="imageStates.length" class="image-list">
            <li v-for="(item, index) in imageStates" :key="item.image.source">
              <div class="image-label"><span>{{ item.image.alt || `图片 ${index + 1}` }}</span><small>{{ item.message }}</small></div>
              <UiButton v-if="item.status === 'error' && item.image.remote" variant="text" size="sm" :disabled="busy || applying" @click="retryImage(item)">重试</UiButton>
              <UiButton v-if="item.status !== 'done'" variant="ghost" size="sm" :disabled="busy || applying" @click="chooseReplacement(index)">手动替换</UiButton>
            </li>
          </ul>
          <input ref="imageInput" type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/bmp" class="file-input" aria-label="选择替换图片" @change="replaceImage" />
        </section>

        <details class="content-preview" open>
          <summary>正文预览</summary>
          <MdPreview id="article-markdown-import-preview" :model-value="previewContent" :theme="theme" :sanitize="sanitizeRichTextHtml" />
        </details>
      </template>
    </div>
    <template #footer>
      <span class="import-footer-hint">确认后进入草稿编辑</span>
      <UiButton variant="ghost" :disabled="applying" @click="closeDialog">取消</UiButton>
      <UiButton variant="primary" :disabled="!draft || busy || !categoryId" :loading="applying" @click="apply()">导入到编辑器</UiButton>
    </template>
  </UiDialog>
  <UiDialog v-model="replacementConfirmOpen" title="替换当前草稿内容" size="sm" centered :close-on-click-modal="false">
    <p>将替换当前草稿的标题、正文、摘要、分类和标签。封面与可见范围保持当前设置，是否继续？</p>
    <template #footer>
      <UiButton variant="ghost" @click="replacementConfirmOpen = false">取消</UiButton>
      <UiButton variant="primary" :loading="applying" @click="apply(true)">替换内容</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { MdPreview } from 'md-editor-v3';
import { isAxiosError } from 'axios';
import { UiButton, UiDialog, UiIcon, UiInput, UiSelect } from '@/components/ui';
import { importArticleImage, uploadImage } from '@/api/upload';
import type { Category } from '@/types';
import { readMarkdownArticle, type MarkdownArticleImport } from '@/modules/article-edit/markdown-import';
import { collectMarkdownImages, replaceMarkdownImages, type MarkdownImage } from '@/modules/article-edit/markdown-images';
import { sanitizeRichTextHtml } from '@/utils/richText';
import { DEFAULT_IMAGE_MAX_MB, validateImageFile } from '@/utils/validation';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  disabled: boolean;
  categories: Category[];
  theme: 'light' | 'dark';
  currentCategoryId?: number;
  hasExistingContent: boolean;
  applyImport: (draft: MarkdownArticleImport, categoryId: number) => Promise<boolean>;
}>();
const emit = defineEmits<{ (event: 'open-change', open: boolean): void }>();
type ImageState = { image: MarkdownImage; status: 'pending' | 'uploading' | 'done' | 'error'; message: string; url?: string };
const open = ref(false);
const reading = ref(false);
const uploading = ref(false);
const applying = ref(false);
const replacementConfirmOpen = ref(false);
const error = ref('');
const draft = ref<MarkdownArticleImport | null>(null);
const imageStates = shallowRef<ImageState[]>([]);
const fileInput = ref<HTMLInputElement>();
const imageInput = ref<HTMLInputElement>();
const categoryId = ref<string | number | boolean | Array<string | number | boolean> | null>();
const tagText = ref('');
const replacementIndex = ref(-1);
let generation = 0;
let abort: AbortController | null = null;
const busy = computed(() => reading.value || uploading.value);
const categoryOptions = computed(() => props.categories.map(category => ({ label: category.name, value: Number(category.id) })));
const previewContent = computed(() => replaceMarkdownImages(draft.value?.content || '', imageStates.value.map(item => item.image),
  new Map(imageStates.value.filter(item => item.url).map(item => [item.image.source, item.url!]))));
const imageStatusText = computed(() => {
  const done = imageStates.value.filter(item => item.status === 'done').length;
  const failed = imageStates.value.filter(item => item.status === 'error').length;
  return uploading.value ? `正在转存 ${done}/${imageStates.value.length}` : (failed ? `${done} 张已就绪，${failed} 张待处理` : `${done} 张已就绪`);
});

function openDialog() {
  categoryId.value = props.currentCategoryId;
  open.value = true;
  emit('open-change', true);
}

function closeDialog() {
  if (applying.value) return;
  generation++;
  abort?.abort();
  open.value = false;
  replacementConfirmOpen.value = false;
  reading.value = false;
  uploading.value = false;
  draft.value = null;
  imageStates.value = [];
  error.value = '';
  emit('open-change', false);
}

function updateImage(item: ImageState, update: Partial<ImageState>) {
  Object.assign(item, update);
  imageStates.value = [...imageStates.value];
}

async function transferImage(item: ImageState, run: number) {
  updateImage(item, { status: 'uploading', message: '正在转存…' });
  try {
    const result = await importArticleImage(item.image.source, abort?.signal);
    if (run !== generation) return;
    if (!result.url) throw new Error('转存未返回图片地址');
    updateImage(item, { status: 'done', message: '已转存到站内', url: result.url });
  } catch (cause) {
    if (run !== generation) return;
    const message = isAxiosError<{ message?: string }>(cause) ? cause.response?.data?.message : undefined;
    updateImage(item, { status: 'error', message: message || '转存失败，可重试或手动上传' });
  }
}

async function loadFile(file: File) {
  if (busy.value || applying.value) return;
  const run = ++generation;
  error.value = '';
  reading.value = true;
  draft.value = null;
  imageStates.value = [];
  try {
    const result = await readMarkdownArticle(file);
    if (run !== generation) return;
    const images = collectMarkdownImages(result.content);
    draft.value = result;
    tagText.value = result.tags.join('，');
    imageStates.value = images.map(image => ({ image, status: image.remote ? 'pending' : 'error', message: image.remote ? '等待转存' : '本地或相对路径图片，请手动替换' }));
    reading.value = false;
    uploading.value = images.some(image => image.remote);
    abort = new AbortController();
    // 顺序转存，每个作者只发起一个下载；取消后不继续处理其余图片。
    for (const item of imageStates.value) {
      if (run !== generation) return;
      if (item.image.remote) await transferImage(item, run);
    }
  } catch (cause) {
    if (run === generation) error.value = cause instanceof Error ? cause.message : '读取文件失败，请重试';
  } finally {
    if (run === generation) { reading.value = false; uploading.value = false; }
  }
}

function selectFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) void loadFile(file);
}

function dropFile(event: DragEvent) {
  if (event.dataTransfer?.files.length !== 1) { error.value = '请一次选择一篇 Markdown 文章'; return; }
  const file = event.dataTransfer.files[0];
  if (file) void loadFile(file);
}

async function retryImage(item: ImageState) {
  uploading.value = true;
  const run = generation;
  abort = new AbortController();
  await transferImage(item, run);
  if (run === generation) uploading.value = false;
}

function chooseReplacement(index: number) {
  replacementIndex.value = index;
  imageInput.value?.click();
}

async function replaceImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  const item = imageStates.value[replacementIndex.value];
  if (!file || !item || busy.value) return;
  const validation = validateImageFile(file, DEFAULT_IMAGE_MAX_MB);
  if (!validation.valid) { error.value = validation.message || '图片格式或大小无效'; return; }
  uploading.value = true;
  const run = generation;
  try {
    const result = await uploadImage(file);
    if (!result.url) throw new Error('上传未返回图片地址');
    if (run === generation) updateImage(item, { status: 'done', message: '已手动上传', url: result.url });
  } catch {
    if (run === generation) error.value = '图片上传失败，请重试';
  } finally {
    if (run === generation) uploading.value = false;
  }
}

async function apply(replacementConfirmed = false) {
  if (!draft.value || busy.value || applying.value) return;
  const selectedCategory = Number(categoryId.value);
  if (!categoryOptions.value.some(option => option.value === selectedCategory)) { error.value = '请选择有效的文章分类'; return; }
  if (draft.value.title.trim().length < 5) { error.value = '文章标题至少 5 个字'; return; }
  const tags = [...new Set(tagText.value.split(/[,，]/).map(tag => tag.trim()).filter(Boolean))];
  if (tags.length > 20 || tags.some(tag => tag.length > 50)) { error.value = '最多 20 个标签，每个标签最多 50 个字符'; return; }
  if (props.hasExistingContent && !replacementConfirmed) { replacementConfirmOpen.value = true; return; }
  replacementConfirmOpen.value = false;
  applying.value = true;
  let applied = false;
  try {
    applied = await props.applyImport({ ...draft.value, title: draft.value.title.trim(), content: previewContent.value, tags }, selectedCategory);
  } catch {
    error.value = '导入失败，已保留预览内容，请重试';
  } finally {
    applying.value = false;
  }
  if (applied) closeDialog();
}

onBeforeUnmount(() => { generation++; abort?.abort(); });
</script>

<style scoped lang="scss">
.markdown-import { display: grid; gap: var(--space-lg); }
.file-input { display: none; }
.file-drop { display: grid; grid-template-columns: 24px minmax(0, 1fr); align-items: center; gap: 8px 12px; width: 100%; padding: 16px; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-muted); color: var(--color-text-primary); font: inherit; text-align: left; cursor: pointer; }
.file-name { min-width: 0; overflow-wrap: anywhere; }
.file-drop small { grid-column: 2; }
.file-drop small, .import-help, .image-label small, .images-heading > span { color: var(--color-text-secondary); font-size: 13px; line-height: 1.6; }
.file-drop:disabled { cursor: wait; }
.file-drop:focus-visible, summary:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; }
.import-fields, .import-fields label { display: grid; gap: 8px; }
.import-fields { gap: 16px; }
.import-fields label { font-size: 14px; font-weight: 500; }
.import-meta { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }
.required { color: var(--color-text-secondary); font-size: 12px; }
.import-error { color: var(--color-danger, #c3314b); font-size: 14px; margin: 0; }
.import-images { border-block: 1px solid var(--color-border-light); padding-block: 16px; }
.images-heading { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; }
.import-help { margin: 8px 0 0; }
.image-list { list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 8px; }
.image-list li { display: flex; align-items: center; gap: 8px; }
.image-label { display: grid; gap: 3px; flex: 1; min-width: 0; font-size: 14px; overflow-wrap: anywhere; }
.content-preview summary { cursor: pointer; font-weight: 600; margin-bottom: 12px; }
.content-preview :deep(.md-editor) { background: transparent; }
.content-preview :deep(img) { max-width: 100%; height: auto; }
.content-preview :deep(pre), .content-preview :deep(.md-editor-preview-wrapper) { min-width: 0; overflow-x: auto; }
.import-footer-hint { margin-right: auto; color: var(--color-text-secondary); font-size: 13px; }
@media (max-width: 767px) {
  .import-button-format { display: none; }
  .import-meta { grid-template-columns: 1fr; }
  .file-drop small { width: 100%; }
  .import-footer-hint { display: none; }
  .image-list li { flex-wrap: wrap; }
  .image-label { flex-basis: 100%; }
  .image-list :deep(button) { min-height: 44px; }
  .content-preview :deep(.md-editor-preview-wrapper) { padding: 0; }
}
</style>
