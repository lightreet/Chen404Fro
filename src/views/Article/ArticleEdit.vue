<template>
  <div class="article-edit-page">
    <div class="edit-container">
      <!-- 顶部栏：左侧状态 + 返回，右侧保存/发布 -->
      <header class="edit-header">
        <div class="header-left">
          <router-link to="/" class="back-link">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回</span>
          </router-link>
          <span class="status-text">
            状态：{{ form.status === ArticleStatus.PUBLISHED ? '已发布' : '草稿' }}
          </span>
          <span class="autosave-text" :class="`is-${autoSaveState}`">
            {{ autoSaveStatusText }}
          </span>
        </div>
        <div class="header-actions">
          <button type="button" class="header-link" @click="handleSaveDraft" :disabled="isDraftSaving">
            保存草稿
          </button>
          <el-button type="primary" @click="handlePublish" :loading="publishing">
            {{ form.status === ArticleStatus.PUBLISHED ? '更新发布' : '发布文章' }}
          </el-button>
        </div>
      </header>

      <!-- 主体：左侧编辑区 + 右侧设置栏 -->
      <div class="edit-body">
        <!-- 左侧：标题 + 正文 -->
        <main class="edit-main">
          <div class="form-item title-row">
            <el-input
              v-model="form.title"
              placeholder="请输入文章标题"
              size="large"
              class="title-input"
              maxlength="100"
              show-word-limit
            />
          </div>
          <div class="form-item editor-wrapper">
            <MdEditor
              ref="editorRef"
              v-model="form.content"
              :theme="editorTheme"
              :toolbars="toolbars"
              :preview="true"
              :previewComponent="MdResizablePreview"
              placeholder="开始编写文章内容..."
              @on-upload-img="onUploadImg"
            />
          </div>
        </main>

        <!-- 右侧：文章设置 -->
        <aside class="edit-sidebar">
          <div class="sidebar-card">
            <h2 class="sidebar-title">文章设置</h2>

            <!-- 封面 -->
            <section class="sidebar-section cover-section">
              <div class="section-label">文章封面</div>
              <el-upload
                class="cover-uploader"
                :http-request="handleCoverUpload"
                :show-file-list="false"
                :before-upload="beforeCoverUpload"
                accept="image/*"
              >
                <img v-if="form.coverImage" :src="form.coverImage" class="cover-preview" />
                <div v-else class="cover-placeholder">
                  <el-icon><Plus /></el-icon>
                  <span>点击上传封面</span>
                  <span class="cover-tip">建议尺寸 1200×630</span>
                </div>
              </el-upload>
              <el-button
                v-if="form.coverImage"
                type="danger"
                link
                size="small"
                @click="form.coverImage = ''"
                class="remove-cover"
              >
                移除封面
              </el-button>
            </section>

            <!-- 分类 -->
            <section class="sidebar-section meta-section category-section">
              <label class="meta-section-label">选择分类</label>
              <div class="category-grid">
                <button
                  v-for="category in categories"
                  :key="category.id"
                  type="button"
                  class="category-card"
                  :class="{ selected: form.categoryId === category.id }"
                  @click="form.categoryId = category.id"
                >
                  <Icon
                    class="category-card-icon"
                    :icon="category.icon || 'mdi:folder'"
                    width="14"
                    height="14"
                  />
                  {{ category.name }}
                </button>
              </div>
              <p v-if="categories.length === 0" class="form-tip">
                暂无分类，请先在
                <router-link to="/profile">个人中心</router-link>
                → 分类管理 中添加（需管理员账号）。
              </p>
            </section>

            <!-- 标签 -->
            <section class="sidebar-section meta-section tags-section">
              <label class="meta-section-label">标签</label>
              <div
                class="tags-input-wrap"
                @mouseenter="onTagsWrapMouseEnter"
                @mouseleave="onTagsWrapMouseLeave"
              >
                <el-input
                  v-model="newTagName"
                  placeholder="输入标签，按回车添加"
                  size="large"
                  clearable
                  class="tags-input"
                  @keyup.enter="addCustomTag"
                  @focus="showTagSuggestions = true"
                  @blur="onTagsInputBlur"
                />
                <Transition name="suggest-fade">
                  <div
                    v-show="showTagSuggestions && suggestedTags.length > 0"
                    class="tag-suggestions"
                    @mousedown.prevent
                  >
                    <div class="tag-suggestions-title">常用标签</div>
                    <div class="tag-suggestions-list">
                      <button
                        v-for="tag in suggestedTags"
                        :key="tag.id"
                        type="button"
                        class="tag-suggestion-item"
                        @mousedown="addTagById(tag.id)"
                      >
                        {{ tag.name }}
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
              <div v-if="selectedTagNames.length > 0 || customTagNames.length > 0" class="chips-wrap">
                <span
                  v-for="item in selectedTagNames"
                  :key="`id-${item.id}`"
                  class="chip"
                >
                  {{ item.name }}
                  <button type="button" class="chip-remove" aria-label="移除" @click="removeTagById(item.id)">×</button>
                </span>
                <span
                  v-for="name in customTagNames"
                  :key="`name-${name}`"
                  class="chip"
                >
                  {{ name }}
                  <button type="button" class="chip-remove" aria-label="移除" @click="removeCustomTag(name)">×</button>
                </span>
              </div>
            </section>

            <!-- 摘要 -->
            <section class="sidebar-section summary-section">
              <label class="section-label">内容摘要</label>
              <el-input
                v-model="form.summary"
                type="textarea"
                :rows="3"
                placeholder="选填，不填将自动提取正文前200字"
                maxlength="500"
                show-word-limit
              />
            </section>

            <!-- 高级设置（可折叠） -->
            <section class="sidebar-section advanced-section">
              <button
                type="button"
                class="advanced-toggle"
                @click="advancedOpen = !advancedOpen"
              >
                <span>高级设置</span>
                <el-icon class="toggle-icon" :class="{ open: advancedOpen }"><ArrowDown /></el-icon>
              </button>
              <Transition name="slide-down">
                <div v-show="advancedOpen" class="advanced-content">
                  <div class="advanced-field">
                    <label class="advanced-field-label">文章可见性</label>
                    <el-select v-model="form.visibility" class="advanced-select">
                      <el-option
                        v-for="item in visibilityOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </div>
                  <div class="advanced-field">
                    <label class="advanced-field-label">评论策略</label>
                    <el-select v-model="form.commentPolicy" class="advanced-select">
                      <el-option
                        v-for="item in commentPolicyOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </div>
                  <el-checkbox
                    v-if="canSetArticleTop"
                    v-model="form.isTop"
                    :true-value="1"
                    :false-value="0"
                  >
                    置顶文章
                  </el-checkbox>
                  <el-radio-group v-model="form.status" size="small">
                    <el-radio-button :value="ArticleStatus.DRAFT">草稿</el-radio-button>
                    <el-radio-button :value="ArticleStatus.PUBLISHED">发布</el-radio-button>
                  </el-radio-group>
                </div>
              </Transition>
            </section>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Icon } from '@iconify/vue';
import { ArrowLeft, ArrowDown, Plus } from '@element-plus/icons-vue';
import { MdEditor } from 'md-editor-v3';
import type { ExposeParam, ToolbarNames } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import type { Article, Category, Tag } from '@/types';
import { ArticleStatus, ArticleVisibility, ArticleCommentPolicy } from '@/types';
import {
  getArticleById,
  createArticle,
  updateArticle,
  getCategories,
  getTags,
  uploadImage,
  uploadCover,
} from '@/api';
import type { RequestConfig } from '@/api';
import { validateImageFile, DEFAULT_IMAGE_MAX_MB } from '@/utils/validation';
import MdResizablePreview from '@/components/MdResizablePreview/MdResizablePreview.vue';
import { mdImageResizeEmitter } from '@/utils/mdImageResizeEmitter';
import { useUserStore } from '@/stores/user';
import { isAdminUser } from '@/utils/permission';

type DraftSaveSource = 'manual' | 'auto' | 'leave';
type AutoSaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

const AUTO_SAVE_DEBOUNCE_MS = 5000;
const AUTO_SAVE_INTERVAL_MS = 30000;
const AUTO_SAVE_REQUEST_CONFIG: RequestConfig = { suppressErrorMessage: true };

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
/** 仅管理员可设置置顶 */
const canSetArticleTop = computed(() => isAdminUser(userStore.user));
const editorRef = ref<ExposeParam>();
defineExpose({ editorRef });

let offResizeListener: (() => void) | null = null;

// 判断是否为编辑模式
const articleId = computed(() => {
  const id = route.params.id;
  return typeof id === 'string' ? id : null;
});
const isEdit = computed(() => !!articleId.value);

// 编辑器主题
const editorTheme = computed(() => {
  const savedTheme = localStorage.getItem('theme');
  return savedTheme === 'dark' ? 'dark' : 'light';
});

// 编辑器工具栏配置
const toolbars: ToolbarNames[] = [
  'bold',
  'underline',
  'italic',
  '-',
  'title',
  'strikeThrough',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'mermaid',
  'katex',
  '-',
  'revoke',
  'next',
  'save',
  '=',
  'preview',
  'htmlPreview',
  'catalog',
];

const escapeHtmlAttr = (value: string) => value.replace(/"/g, '&quot;');

const upsertImageWidthBySrc = (src: string, width: string) => {
  const content = form.content ?? '';
  if (!content) return;

  // 优先更新已存在的 HTML <img ...>（避免重复转换）
  const imgTagRegex = new RegExp(`<img\\s+[^>]*?src="${src.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}"[^>]*?>`, 'i');
  const match = content.match(imgTagRegex);
  if (match && match[0]) {
    const tag = match[0];
    const hasStyle = /\sstyle="[^"]*"/i.test(tag);
    const nextTag = hasStyle
      ? tag.replace(/\sstyle="[^"]*"/i, (styleAttr) => {
          const style = styleAttr.replace(/^ style="/i, '').replace(/"$/i, '');
          const cleaned = style
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
            .filter((s) => !s.toLowerCase().startsWith('width:'));
          cleaned.unshift(`width: ${width}`);
          cleaned.push('max-width: 100%');
          cleaned.push('height: auto');
          return ` style="${cleaned.join('; ')}"`;
        })
      : tag.replace(/<img/i, `<img style="width: ${width}; max-width: 100%; height: auto;"`);

    form.content = content.replace(tag, nextTag);
    return;
  }

  // 否则尝试把 markdown 图片语法转换为 HTML img（按 src 匹配）
  const mdImgRegex = new RegExp(`!\\[[^\\]]*\\]\\(\\s*${src.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*(?:\"[^\"]*\")?\\)`, 'i');
  const mdMatch = content.match(mdImgRegex);
  if (!mdMatch || !mdMatch[0]) return;

  const mdToken = mdMatch[0];
  const alt = mdToken.match(/^!\[([^\]]*)\]/)?.[1] ?? '';
  const title = mdToken.match(/"([^"]*)"\s*\)$/)?.[1] ?? '';
  const titleAttr = title ? ` title="${escapeHtmlAttr(title)}"` : '';
  const nextTag = `<img src="${src}" alt="${escapeHtmlAttr(alt)}"${titleAttr} style="width: ${width}; max-width: 100%; height: auto;" />`;
  form.content = content.replace(mdToken, nextTag);
};

// 表单数据；置顶 isTop 仅管理员可在界面修改（受信用户新建时后端也会强制为 0）。推荐 isRecommend 不在此编辑
const form = reactive<Partial<Article>>({
  title: '',
  content: '',
  summary: '',
  coverImage: '',
  categoryId: undefined,
  status: ArticleStatus.DRAFT,
  isTop: 0,
  visibility: ArticleVisibility.PUBLIC,
  commentPolicy: ArticleCommentPolicy.REGISTERED,
});

const visibilityOptions = [
  { label: '公开', value: ArticleVisibility.PUBLIC },
  { label: '登录可见', value: ArticleVisibility.LOGIN },
  { label: '好友可见', value: ArticleVisibility.FRIEND },
  { label: '私密', value: ArticleVisibility.PRIVATE },
];

const commentPolicyOptions = [
  { label: '关闭评论', value: ArticleCommentPolicy.CLOSED },
  { label: '登录可评论', value: ArticleCommentPolicy.REGISTERED },
  { label: '好友可评论', value: ArticleCommentPolicy.FRIEND },
  { label: '游客可评论', value: ArticleCommentPolicy.PUBLIC },
];

// 标签云已选 ID
const formTagIds = ref<number[]>([]);
// 用户输入的自定义标签名（后端 findOrCreate）
const customTagNames = ref<string[]>([]);
const newTagName = ref('');
// 是否展示常用标签下拉（聚焦或悬浮时）
const showTagSuggestions = ref(false);
// 高级设置是否展开
const advancedOpen = ref(false);
let tagSuggestionsBlurTimer: ReturnType<typeof setTimeout> | null = null;

// 分类和标签列表
const categories = ref<Category[]>([]);
const tags = ref<Tag[]>([]);

// 加载状态
const isDraftSaving = ref(false);
const publishing = ref(false);
const loading = ref(false);
const autoSaveState = ref<AutoSaveState>('idle');
const lastSavedAt = ref<Date | null>(null);
const hasPendingChanges = ref(false);
const editorReady = ref(false);
const loadedArticleStatus = ref<ArticleStatus | null>(null);

let activeSavePromise: Promise<boolean> | null = null;
let autoSaveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let autoSaveIntervalId: ReturnType<typeof setInterval> | null = null;
let lastSavedSnapshot = '';
let queuedAutoSave = false;

// 获取分类和标签列表
const fetchCategoriesAndTags = async () => {
  try {
    const [categoriesRes, tagsRes] = await Promise.all([
      getCategories(),
      getTags(),
    ]);
    categories.value = categoriesRes || [];
    tags.value = tagsRes || [];
  } catch (error) {
    console.error('获取分类/标签失败:', error);
    // 失败时显示空列表，不提示用户
    categories.value = [];
    tags.value = [];
  }
};

// 获取文章详情（编辑模式）
const fetchArticleDetail = async () => {
  if (!articleId.value) return;

  loading.value = true;
  try {
    const article = await getArticleById(articleId.value);
    loadedArticleStatus.value = article.status;
    Object.assign(form, article);
    if (article.tags) {
      formTagIds.value = article.tags.map((tag) => Number(tag.id));
      customTagNames.value = [];
    }
  } catch (error) {
    console.error('获取文章详情失败:', error);
    ElMessage.error('获取文章详情失败');
    router.push('/');
  } finally {
    loading.value = false;
  }
};

// 封面上传（自定义上传）
const handleCoverUpload = async (options: { file: File; onSuccess: (res: any) => void; onError: (error: any) => void }) => {
  try {
    const res = await uploadCover(options.file);
    form.coverImage = res.url;
    options.onSuccess(res);
    ElMessage.success('封面上传成功');
  } catch (error) {
    options.onError(error);
    ElMessage.error('封面上传失败');
  }
};

// 封面上传前校验（与个人中心头像校验共用工具）
const beforeCoverUpload = (file: File) => {
  const result = validateImageFile(file, DEFAULT_IMAGE_MAX_MB);
  if (!result.valid) {
    ElMessage.error(result.message);
    return false;
  }
  return true;
};

// 编辑器内图片上传（并行上传优化版）
const onUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
  try {
    const validFiles = files.filter((file) => {
      const result = validateImageFile(file, DEFAULT_IMAGE_MAX_MB);
      if (!result.valid) {
        ElMessage.error(`${file.name}: ${result.message}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      callback([]);
      return;
    }

    // 并行上传所有图片
    const uploadPromises = validFiles.map(async (file) => {
      try {
        const res = await uploadImage(file);
        return res.url;
      } catch (error) {
        console.error(`上传失败: ${file.name}`, error);
        ElMessage.error(`${file.name} 上传失败`);
        return null;
      }
    });

    // 等待所有上传完成
    const results = await Promise.all(uploadPromises);

    // 过滤掉失败的
    const urls = results.filter((url): url is string => url !== null);

    callback(urls);

    if (urls.length > 0) {
      ElMessage.success(`成功上传 ${urls.length} 张图片`);
    }
  } catch (error) {
    console.error('图片上传失败:', error);
    ElMessage.error('图片上传失败');
  }
};

// 表单验证
const validateForm = (): boolean => {
  if (!form.title?.trim()) {
    ElMessage.warning('请输入文章标题');
    return false;
  }
  if (!form.categoryId) {
    ElMessage.warning('请选择文章分类');
    return false;
  }
  if (!form.content?.trim()) {
    ElMessage.warning('请输入文章内容');
    return false;
  }
  return true;
};

// 构建提交数据（标签：数字为 id，字符串为新标签名，后端会 findOrCreate）
const buildSubmitData = (): Partial<Article> => {
  let summary = form.summary?.trim();
  if (!summary && form.content) {
    summary = form.content
      .replace(/[#*`\[\]!()]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
  }
  const tagIds = [...formTagIds.value];
  const tagNames = customTagNames.value.map((s) => s.trim()).filter(Boolean);

  return {
    ...form,
    summary,
    tagIds,
    ...(tagNames.length > 0 ? { tagNames } : {}),
  };
};

const buildDraftSubmitData = (): Partial<Article> => {
  return {
    ...buildSubmitData(),
    status: ArticleStatus.DRAFT,
  };
};

const currentDraftSnapshot = computed(() => JSON.stringify(buildDraftSubmitData()));

const isAutoSaveEnabled = computed(() => {
  return !(isEdit.value && loadedArticleStatus.value === ArticleStatus.PUBLISHED);
});

const hasMeaningfulDraftContent = computed(() => {
  return Boolean(
    form.title?.trim()
    || form.content?.trim()
    || form.summary?.trim()
    || form.coverImage
    || form.categoryId
    || formTagIds.value.length
    || customTagNames.value.length
  );
});

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

const autoSaveStatusText = computed(() => {
  if (!hasMeaningfulDraftContent.value && !lastSavedAt.value) {
    return '自动保存已开启';
  }

  if (!isAutoSaveEnabled.value) {
    return hasPendingChanges.value ? '已发布文章改动未自动保存' : '已发布文章暂不自动保存';
  }

  if (autoSaveState.value === 'saving') {
    return '自动保存中...';
  }

  if (autoSaveState.value === 'error') {
    return '自动保存失败，等待重试';
  }

  if (hasPendingChanges.value) {
    return form.title?.trim() ? '未保存' : '未保存，填写标题后自动保存';
  }

  if (lastSavedAt.value) {
    return `已自动保存 ${formatTime(lastSavedAt.value)}`;
  }

  return '自动保存已开启';
});

const canSaveDraft = (showMessage: boolean = false) => {
  if (form.title?.trim()) {
    return true;
  }

  if (showMessage) {
    ElMessage.warning('请输入文章标题');
  }
  return false;
};

const clearAutoSaveDebounce = () => {
  if (autoSaveDebounceTimer) {
    clearTimeout(autoSaveDebounceTimer);
    autoSaveDebounceTimer = null;
  }
};

const syncSavedSnapshot = (state: AutoSaveState = 'idle') => {
  lastSavedSnapshot = currentDraftSnapshot.value;
  hasPendingChanges.value = false;
  autoSaveState.value = state;
};

const scheduleAutoSave = () => {
  if (!editorReady.value || !isAutoSaveEnabled.value || !canSaveDraft()) return;

  clearAutoSaveDebounce();
  autoSaveDebounceTimer = setTimeout(() => {
    void saveDraftCore({ source: 'auto', silent: true });
  }, AUTO_SAVE_DEBOUNCE_MS);
};

const shouldWarnBeforeUnload = () => {
  if (publishing.value || !hasMeaningfulDraftContent.value) {
    return false;
  }

  return hasPendingChanges.value || isDraftSaving.value;
};

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!shouldWarnBeforeUnload()) return;

  event.preventDefault();
  event.returnValue = '';
};

const addCustomTag = () => {
  const name = newTagName.value?.trim();
  if (!name) return;
  const existsInCloud = tags.value.some((t) => t.name === name);
  if (existsInCloud) {
    const tag = tags.value.find((t) => t.name === name);
    if (tag && !formTagIds.value.includes(Number(tag.id))) {
      formTagIds.value = [...formTagIds.value, Number(tag.id)];
    }
    newTagName.value = '';
    return;
  }
  if (customTagNames.value.includes(name)) {
    newTagName.value = '';
    return;
  }
  customTagNames.value = [...customTagNames.value, name];
  newTagName.value = '';
};
const removeCustomTag = (name: string) => {
  customTagNames.value = customTagNames.value.filter((n) => n !== name);
};

// 已选中的标签（用于展示 chip 名称）
const selectedTagNames = computed(() => {
  return formTagIds.value
    .map((id) => {
      const t = tags.value.find((t) => Number(t.id) === id);
      return t ? { id: Number(t.id), name: t.name } : null;
    })
    .filter((x): x is { id: number; name: string } => x != null);
});

// 常用标签：未选中的系统标签，用于悬浮/聚焦时展示
const suggestedTags = computed(() => {
  return tags.value.filter((t) => !formTagIds.value.includes(Number(t.id)));
});

const removeTagById = (id: number) => {
  formTagIds.value = formTagIds.value.filter((x) => x !== id);
};

// 点击常用标签项，加入已选
const addTagById = (id: number) => {
  const numId = Number(id);
  if (formTagIds.value.includes(numId)) return;
  formTagIds.value = [...formTagIds.value, numId];
};

const onTagsInputBlur = () => {
  tagSuggestionsBlurTimer = setTimeout(() => {
    showTagSuggestions.value = false;
    tagSuggestionsBlurTimer = null;
  }, 150);
};

const onTagsWrapMouseEnter = () => {
  if (tagSuggestionsBlurTimer) {
    clearTimeout(tagSuggestionsBlurTimer);
    tagSuggestionsBlurTimer = null;
  }
  showTagSuggestions.value = true;
};

const onTagsWrapMouseLeave = () => {
  if (tagSuggestionsBlurTimer) {
    clearTimeout(tagSuggestionsBlurTimer);
    tagSuggestionsBlurTimer = null;
  }
  showTagSuggestions.value = false;
};

const saveDraftCore = async ({
  source,
  silent = false,
}: {
  source: DraftSaveSource;
  silent?: boolean;
}): Promise<boolean> => {
  if (publishing.value) {
    return false;
  }

  if (source !== 'manual' && !isAutoSaveEnabled.value) {
    return false;
  }

  const shouldShowValidationMessage = !silent && source === 'manual';
  if (!canSaveDraft(shouldShowValidationMessage)) {
    if (hasMeaningfulDraftContent.value) {
      autoSaveState.value = 'dirty';
    }
    return false;
  }

  if (source !== 'manual' && !hasPendingChanges.value && currentDraftSnapshot.value === lastSavedSnapshot) {
    return true;
  }

  if (isDraftSaving.value) {
    queuedAutoSave = true;
    return activeSavePromise ?? false;
  }

  clearAutoSaveDebounce();
  isDraftSaving.value = true;
  autoSaveState.value = 'saving';

  const savePromise = (async () => {
    try {
      const data = buildDraftSubmitData();
      const requestConfig = silent ? AUTO_SAVE_REQUEST_CONFIG : undefined;

      if (isEdit.value && articleId.value) {
        await updateArticle(articleId.value, data, requestConfig);
      } else {
        const res = await createArticle(data, requestConfig);
        if (res.id) {
          await router.replace(`/article/edit/${res.id}`);
        }
      }

      loadedArticleStatus.value = ArticleStatus.DRAFT;
      lastSavedAt.value = new Date();
      syncSavedSnapshot('saved');

      if (!silent && source === 'manual') {
        ElMessage.success('草稿保存成功');
      }
      return true;
    } catch (error) {
      console.error(`${source} 保存草稿失败:`, error);
      hasPendingChanges.value = true;
      autoSaveState.value = 'error';

      if (!silent && source === 'manual') {
        ElMessage.error('保存草稿失败');
      }
      return false;
    } finally {
      isDraftSaving.value = false;
      activeSavePromise = null;

      if (queuedAutoSave && hasPendingChanges.value && isAutoSaveEnabled.value && canSaveDraft()) {
        queuedAutoSave = false;
        void saveDraftCore({ source: 'auto', silent: true });
      } else {
        queuedAutoSave = false;
      }
    }
  })();

  activeSavePromise = savePromise;
  return savePromise;
};

// 保存草稿
const handleSaveDraft = async () => {
  await saveDraftCore({ source: 'manual' });
};

// 发布文章
const handlePublish = async () => {
  if (!validateForm()) return;

  // 确认发布
  try {
    await ElMessageBox.confirm(
      '确定要发布这篇文章吗？',
      '确认发布',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }
    );
  } catch {
    return;
  }

  publishing.value = true;
  try {
    clearAutoSaveDebounce();
    const data = buildSubmitData();
    data.status = ArticleStatus.PUBLISHED;

    if (isEdit.value && articleId.value) {
      await updateArticle(articleId.value, data);
      ElMessage.success('文章更新成功');
      router.push(`/article/${articleId.value}`);
    } else {
      const res = await createArticle(data);
      ElMessage.success('文章发布成功');
      if (res.id) {
        router.push(`/article/${res.id}`);
      }
    }
  } catch (error) {
    console.error('发布失败:', error);
    ElMessage.error('发布失败');
  } finally {
    publishing.value = false;
  }
};

// 页面加载时获取数据
watch(currentDraftSnapshot, (newSnapshot) => {
  if (!editorReady.value) return;

  if (newSnapshot === lastSavedSnapshot) {
    hasPendingChanges.value = false;
    autoSaveState.value = lastSavedAt.value ? 'saved' : 'idle';
    clearAutoSaveDebounce();
    return;
  }

  hasPendingChanges.value = true;

  if (isDraftSaving.value) {
    queuedAutoSave = true;
    return;
  }

  autoSaveState.value = 'dirty';
  scheduleAutoSave();
});

onBeforeRouteLeave(async () => {
  if (!shouldWarnBeforeUnload()) {
    return true;
  }

  if (activeSavePromise) {
    await activeSavePromise.catch(() => false);
  }

  if (!hasPendingChanges.value) {
    return true;
  }

  if (isAutoSaveEnabled.value && canSaveDraft()) {
    const saved = await saveDraftCore({ source: 'leave', silent: true });
    if (saved && !hasPendingChanges.value) {
      return true;
    }
  }

  return window.confirm('草稿还有未同步的改动，确定离开当前页面吗？');
});

onMounted(async () => {
  offResizeListener = mdImageResizeEmitter.on(({ src, width }) => {
    upsertImageWidthBySrc(src, width);
  });

  await fetchCategoriesAndTags();
  if (isEdit.value) {
    await fetchArticleDetail();
  }

  syncSavedSnapshot();
  editorReady.value = true;

  autoSaveIntervalId = setInterval(() => {
    if (!hasPendingChanges.value || !isAutoSaveEnabled.value || !canSaveDraft()) return;
    void saveDraftCore({ source: 'auto', silent: true });
  }, AUTO_SAVE_INTERVAL_MS);

  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  if (offResizeListener) {
    offResizeListener();
    offResizeListener = null;
  }

  clearAutoSaveDebounce();
  if (autoSaveIntervalId) {
    clearInterval(autoSaveIntervalId);
    autoSaveIntervalId = null;
  }
  if (tagSuggestionsBlurTimer) {
    clearTimeout(tagSuggestionsBlurTimer);
    tagSuggestionsBlurTimer = null;
  }
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped lang="scss">
.article-edit-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 0;
  overflow-x: visible;
  overflow-y: visible;
}

.edit-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px 24px;
  overflow: visible;
}

// 顶部栏：状态 + 保存/发布
.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  padding: 0 8px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s;

    &:hover {
      color: var(--primary);
    }
  }

  .status-text {
    font-size: 13px;
    color: var(--text-tertiary, #94a3b8);
  }

  .autosave-text {
    font-size: 13px;
    color: var(--text-tertiary, #94a3b8);
    transition: color 0.2s ease;

    &.is-dirty,
    &.is-saving {
      color: var(--primary, #ec4899);
    }

    &.is-saved {
      color: var(--success, #10b981);
    }

    &.is-error {
      color: var(--danger, #ef4444);
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-link {
    padding: 8px 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    background: var(--bg-primary, #fff);
    color: var(--text-secondary, #64748b);
    font-size: 14px;
    cursor: pointer;
    border-radius: 10px;
    transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;

    &:hover:not(:disabled) {
      border-color: rgba(0, 0, 0, 0.12);
      background: var(--bg-secondary, #f1f5f9);
      color: var(--text-primary, #334155);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

// 主体：左编辑区 + 右侧边栏
.edit-body {
  display: flex;
  gap: 32px;
  margin-top: 24px;
  align-items: flex-start;
  overflow: visible;
}

.edit-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: stretch;
}

.edit-sidebar {
  flex-shrink: 0;
  width: 320px;
  align-self: flex-start;
}

.sidebar-card {
  position: sticky;
  /* 编写页无站点顶栏，贴近视口顶部；侧栏过高时在卡片内滚动 */
  top: 16px;
  max-height: calc(100vh - 32px);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-primary, #fff);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #334155);
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.sidebar-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  .section-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary, #64748b);
    margin-bottom: 8px;
  }
}

.cover-section {
  .cover-uploader :deep(.el-upload) {
    width: 100%;
    display: block;
  }

  .cover-preview,
  .cover-placeholder {
    width: 100%;
    height: 160px;
    border-radius: 10px;
  }

  .cover-placeholder {
    border: 2px dashed var(--border-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--text-secondary);
    font-size: 13px;

    .cover-tip {
      font-size: 12px;
      color: var(--text-tertiary);
    }
  }

  .cover-preview {
    object-fit: cover;
    display: block;
  }

  .remove-cover {
    margin-top: 8px;
  }
}

.summary-section {
  :deep(.el-textarea__inner) {
    border-radius: 10px;
    font-size: 13px;
  }
}

.advanced-section {
  .advanced-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0;
    border: none;
    background: none;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary, #64748b);
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: var(--text-primary, #334155);
    }

    .toggle-icon {
      transition: transform 0.2s ease;

      &.open {
        transform: rotate(180deg);
      }
    }
  }

  .advanced-content {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border-color, #e2e8f0);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .advanced-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .advanced-field-label {
    font-size: 12px;
    color: var(--text-secondary, #64748b);
  }

  .advanced-select {
    width: 100%;
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.form-row {
  display: flex;
  gap: 16px;

  .flex-1 {
    flex: 1;
  }

  .flex-2 {
    flex: 2;
  }
}

// 极简卡片风：留白、rounded-xl、少边框、单一主色
.meta-section {
  margin-bottom: 20px;

  .meta-section-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary, #64748b);
    margin-bottom: 8px;
  }

  .form-tip {
    margin-top: 8px;
  }
}

.edit-sidebar .meta-section {
  margin-bottom: 18px;
}

.category-section {
  .category-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .category-card {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    background: var(--bg-primary, #fff);
    color: var(--text-secondary, #64748b);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;

    .category-card-icon {
      margin-right: 6px;
      flex-shrink: 0;
    }

    &:hover {
      border-color: var(--primary);
      color: var(--text-primary, #334155);
      background: rgba(251, 114, 153, 0.04);
    }

    &.selected {
      border-color: var(--primary);
      background: rgba(251, 114, 153, 0.1);
      color: var(--primary);
    }
  }
}

.tags-section {
  .tags-input-wrap {
    position: relative;
    margin-bottom: 12px;
  }

  .tag-suggestions {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 6px);
    z-index: 10;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    background: var(--bg-primary, #fff);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .tag-suggestions-title {
    font-size: 12px;
    color: var(--text-tertiary, #94a3b8);
    margin-bottom: 8px;
    padding: 0 4px;
  }

  .tag-suggestions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tag-suggestion-item {
    padding: 6px 12px;
    border-radius: 12px;
    border: none;
    background: var(--bg-secondary, #f1f5f9);
    color: var(--text-secondary, #64748b);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .tag-suggestion-item:hover {
    background: rgba(251, 114, 153, 0.12);
    color: var(--primary);
  }

  .tags-input {
    :deep(.el-input__wrapper) {
      border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-primary, #fff);
      box-shadow: none;
      transition: border-color 0.2s ease;
    }

    :deep(.el-input__wrapper:hover),
    :deep(.el-input__wrapper.is-focus) {
      border-color: var(--primary);
    }
  }

  .chips-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 12px;
    background: var(--bg-secondary, #f1f5f9);
    color: var(--text-secondary, #64748b);
    font-size: 13px;
    font-weight: 500;
    border: none;
  }

  .chip-remove {
    margin-left: 2px;
    padding: 0;
    width: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: inherit;
    opacity: 0.7;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    border-radius: 4px;
    transition: opacity 0.2s ease, background 0.2s ease;

    &:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.08);
    }
  }
}

// 常用标签下拉显隐过渡
.suggest-fade-enter-active,
.suggest-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.suggest-fade-enter-from,
.suggest-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.edit-main .form-item {
  &.title-row {
    min-height: 64px;
  }

  &.title-row .title-input :deep(.el-input__wrapper) {
    border: 1px solid var(--border-color, #e2e8f0);
    box-shadow: none;
    padding: 12px 14px;
    min-height: 56px;
    font-size: 22px;
    font-weight: 600;
    line-height: 1.35;
    border-radius: 12px;
    background: var(--bg-primary, #fff);
  }

  &.title-row .title-input :deep(.el-input__inner) {
    --el-input-placeholder-color: var(--text-tertiary, #94a3b8);
  }

  &.editor-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 560px;

    :deep(.md-editor) {
      flex: 1;
      min-height: 560px;
      border-radius: 12px;
      border: 1px solid var(--border-color);

      &[data-theme='dark'] {
        background: var(--bg-secondary);
      }
    }

    :deep(.md-editor-preview img),
    :deep(.md-editor-html-preview img) {
      max-width: min(100%, 720px);
      height: auto;
      display: block;
      margin: 20px auto;
      border-radius: 12px;
    }
  }
}

.form-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-tertiary);

  a {
    color: var(--primary);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

.full-width {
  width: 100%;
}


// 响应式：小屏改为单栏，侧栏在下
@media (max-width: 1024px) {
  .edit-body {
    flex-direction: column;
  }

  .edit-sidebar {
    width: 100%;
    max-width: 100%;
    align-self: stretch;
  }

  .sidebar-card {
    position: static;
    top: auto;
    max-height: none;
    overflow: visible;
    max-width: 480px;
  }
}

@media (max-width: 768px) {
  .edit-container {
    padding: 0 16px 16px;
  }

  .edit-header {
    flex-wrap: wrap;
    height: auto;
    padding: 12px 0;
    gap: 12px;

    .header-left {
      flex-wrap: wrap;
    }
  }

  .edit-main .form-item.editor-wrapper :deep(.md-editor) {
    min-height: 400px;
  }
}
</style>
