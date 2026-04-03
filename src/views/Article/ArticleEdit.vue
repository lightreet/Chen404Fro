<template>
  <div ref="articleEditRootRef" class="article-edit-page">
    <!-- 顶部 fixed 栏（返回与草稿状态）；Markdown 工具栏在正文内 sticky，避免迁出 DOM 导致下拉失效 -->
    <header ref="editTopDockRef" class="edit-top-dock">
      <div class="edit-dock-row edit-dock-row--back">
        <button type="button" class="back-link" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </button>
        <div class="dock-back-meta">
          <span class="draft-hint">
            {{ form.status === ArticleStatus.PUBLISHED ? '已发布' : '草稿' }}
            · {{ form.title?.trim() ? form.title : '无标题' }}
          </span>
          <span class="autosave-text" :class="`is-${autoSaveState}`">
            {{ autoSaveStatusText }}
          </span>
        </div>
      </div>
    </header>

    <div class="edit-container">
      <!-- 正文纸媒：标题 → 分割线 → 编辑器（目录由 md-editor catalog 固定在左侧） -->
      <main class="edit-paper">
        <div class="paper-title-block">
          <el-input
            v-model="form.title"
            placeholder="请输入文章标题（5～100 个字）"
            size="large"
            class="paper-title-input"
            maxlength="100"
            show-word-limit
          />
        </div>
        <div class="paper-title-divider"></div>

        <div
          ref="paperEditorHostRef"
          class="paper-editor-host"
          @click.capture="onMdToolbarItemClickOpenDropdown"
        >
          <MdEditor
            ref="editorRef"
            v-model="form.content"
            :theme="editorTheme"
            :toolbars="toolbars"
            :preview="true"
            :previewComponent="MdResizablePreview"
            catalog-layout="flat"
            :catalog-max-depth="4"
            placeholder="开始编写正文，支持 Markdown…"
            @on-upload-img="onUploadImg"
          />
        </div>
      </main>

      <!-- 文章设置：始终在正文之后 -->
      <aside ref="settingsAnchorRef" class="edit-settings-after" id="article-edit-settings">
        <div class="sidebar-card settings-card">
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
                    :icon="resolveCategoryIcon(category.icon || 'mdi:folder')"
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
                </div>
              </Transition>
            </section>
        </div>
      </aside>
    </div>

    <!-- 底部固定操作栏（参考 CSDN 发文条） -->
    <footer ref="editFooterRef" class="edit-footer-bar">
      <div class="footer-left">
        <span class="footer-word-count">共 {{ contentCharCount }} 字</span>
        <span class="footer-hint">正文与设置修改后请及时保存</span>
        <button type="button" class="footer-settings-link" @click="scrollToArticleSettings">
          发文设置
        </button>
      </div>
      <div class="footer-actions">
        <button
          type="button"
          class="footer-btn footer-btn--ghost"
          @click="handleSaveDraft"
          :disabled="isDraftSaving"
        >
          保存草稿
        </button>
        <el-button type="primary" class="footer-publish" @click="handlePublish" :loading="publishing">
          {{ form.status === ArticleStatus.PUBLISHED ? '更新发布' : '发布文章' }}
        </el-button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, onUpdated, watch, nextTick } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Icon } from '@iconify/vue';
import { resolveCategoryIcon } from '@/utils/categoryIcon';
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
/** 草稿快照 JSON 对比防抖，避免长文每次按键都 stringify */
const DRAFT_COMPARE_DEBOUNCE_MS = 250;
const AUTO_SAVE_REQUEST_CONFIG: RequestConfig = { suppressErrorMessage: true };

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
/** 仅管理员可设置置顶 */
const canSetArticleTop = computed(() => isAdminUser(userStore.user));
const editorRef = ref<ExposeParam>();
defineExpose({ editorRef });

const articleEditRootRef = ref<HTMLElement | null>(null);
const editTopDockRef = ref<HTMLElement | null>(null);
const editFooterRef = ref<HTMLElement | null>(null);
const settingsAnchorRef = ref<HTMLElement | null>(null);
const paperEditorHostRef = ref<HTMLElement | null>(null);

/**
 * md-editor-v3 下拉类工具栏（标题、表格、图片、公式等）仅用 mouseenter 打开菜单，单击无悬停轨迹时无效。
 * 在捕获阶段对工具栏按钮补发一次 mouseenter，使点击与触摸也能展开下拉。
 */
const onMdToolbarItemClickOpenDropdown = (e: MouseEvent) => {
  if (e.button !== 0) return;
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  const item = target.closest('.md-editor-toolbar-item');
  if (!(item instanceof HTMLElement)) return;
  if (!paperEditorHostRef.value?.contains(item)) return;
  item.dispatchEvent(
    new MouseEvent('mouseenter', { bubbles: false, cancelable: true, view: window }),
  );
};

let chromeResizeObserver: ResizeObserver | null = null;

function applyLayoutMetrics() {
  const root = articleEditRootRef.value;
  if (!root) return;
  const dock = editTopDockRef.value;
  /*
   * 顶栏 fixed + z-index 高于目录(298)，若 --article-edit-top-h 小于顶栏实际底边，左侧大纲首条会被返回栏盖住。
   * +2 消除亚像素/边框误差；须在首屏尽早测量（见 onMounted），勿长期沿用 96px 默认值。
   */
  const topH = dock
    ? Math.max(56, Math.ceil(dock.getBoundingClientRect().bottom) + 2)
    : 96;
  const footEl = editFooterRef.value;
  const footH = footEl ? Math.max(48, Math.ceil(footEl.getBoundingClientRect().height)) : 72;
  root.style.setProperty('--article-edit-top-h', `${topH}px`);
  root.style.setProperty('--article-edit-footer-h', `${footH}px`);
}

const TITLE_LEN_MIN = 5;
const TITLE_LEN_MAX = 100;

const goBack = () => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
    return;
  }
  router.push('/');
};

const scrollToArticleSettings = () => {
  settingsAnchorRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

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

const contentCharCount = computed(() => (form.content ?? '').length);

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
let draftCompareDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let autoSaveIntervalId: ReturnType<typeof setInterval> | null = null;
let lastSavedSnapshot = '';
let queuedAutoSave = false;
/** 合并 MdEditor 等高频更新触发的布局测量，避免每帧多次 getBoundingClientRect */
let layoutMetricsRaf = 0;

/** md-editor-v3 默认 catalogVisible 为 false，需 toggleCatalog(true) 才会挂载左侧目录；单次调用若早于内部 onMounted 注册会无效 */
function ensureCatalogShown() {
  editorRef.value?.toggleCatalog?.(true);
}

let catalogShownRetryTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleEnsureCatalogShown() {
  ensureCatalogShown();
  void nextTick(ensureCatalogShown);
  requestAnimationFrame(() => {
    ensureCatalogShown();
    requestAnimationFrame(ensureCatalogShown);
  });
  if (catalogShownRetryTimer) {
    clearTimeout(catalogShownRetryTimer);
  }
  catalogShownRetryTimer = setTimeout(() => {
    catalogShownRetryTimer = null;
    ensureCatalogShown();
  }, 150);
}

let layoutMetricsLateTimer: ReturnType<typeof setTimeout> | null = null;

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
  const title = form.title?.trim() ?? '';
  if (!title) {
    ElMessage.warning('请输入文章标题');
    return false;
  }
  if (title.length < TITLE_LEN_MIN) {
    ElMessage.warning(`文章标题至少 ${TITLE_LEN_MIN} 个字`);
    return false;
  }
  if (title.length > TITLE_LEN_MAX) {
    ElMessage.warning(`文章标题不能超过 ${TITLE_LEN_MAX} 个字`);
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

/** 全量序列化开销大，避免用 computed 在每次按键时重复 stringify */
const computeDraftSnapshot = () => JSON.stringify(buildDraftSubmitData());

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

const clearDraftCompareDebounce = () => {
  if (draftCompareDebounceTimer) {
    clearTimeout(draftCompareDebounceTimer);
    draftCompareDebounceTimer = null;
  }
};

const syncSavedSnapshot = (state: AutoSaveState = 'idle') => {
  clearDraftCompareDebounce();
  lastSavedSnapshot = computeDraftSnapshot();
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

  if (source !== 'manual' && !hasPendingChanges.value && computeDraftSnapshot() === lastSavedSnapshot) {
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
/** 防抖后对比快照：用于「改回与上次保存一致」时取消未保存态，避免每键一次 stringify */
const runDraftSnapshotReconcile = () => {
  if (!editorReady.value) return;

  const newSnapshot = computeDraftSnapshot();
  if (newSnapshot === lastSavedSnapshot) {
    hasPendingChanges.value = false;
    autoSaveState.value = lastSavedAt.value ? 'saved' : 'idle';
    clearAutoSaveDebounce();
  }
};

const scheduleDraftSnapshotReconcile = () => {
  if (!editorReady.value) return;
  clearDraftCompareDebounce();
  draftCompareDebounceTimer = setTimeout(() => {
    draftCompareDebounceTimer = null;
    runDraftSnapshotReconcile();
  }, DRAFT_COMPARE_DEBOUNCE_MS);
};

watch(
  [
    () => form.title,
    () => form.content,
    () => form.summary,
    () => form.coverImage,
    () => form.categoryId,
    () => form.status,
    () => form.visibility,
    () => form.commentPolicy,
    () => form.isTop,
    formTagIds,
    customTagNames,
  ],
  () => {
    if (!editorReady.value) return;

    hasPendingChanges.value = true;

    if (isDraftSaving.value) {
      queuedAutoSave = true;
    } else {
      autoSaveState.value = 'dirty';
      scheduleAutoSave();
    }

    scheduleDraftSnapshotReconcile();
  },
);

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

const scheduleLayoutMetricsRaf = () => {
  if (layoutMetricsRaf) return;
  layoutMetricsRaf = requestAnimationFrame(() => {
    layoutMetricsRaf = 0;
    applyLayoutMetrics();
  });
};

onUpdated(() => {
  scheduleLayoutMetricsRaf();
});

onMounted(async () => {
  offResizeListener = mdImageResizeEmitter.on(({ src, width }) => {
    upsertImageWidthBySrc(src, width);
  });

  await nextTick();
  applyLayoutMetrics();
  requestAnimationFrame(() => {
    applyLayoutMetrics();
    requestAnimationFrame(applyLayoutMetrics);
  });
  window.addEventListener('resize', scheduleLayoutMetricsRaf);

  await Promise.all([
    fetchCategoriesAndTags(),
    isEdit.value ? fetchArticleDetail() : Promise.resolve(),
  ]);

  syncSavedSnapshot();
  editorReady.value = true;
  runDraftSnapshotReconcile();

  await nextTick();
  scheduleEnsureCatalogShown();
  applyLayoutMetrics();
  requestAnimationFrame(() => {
    applyLayoutMetrics();
    requestAnimationFrame(applyLayoutMetrics);
  });
  if (layoutMetricsLateTimer) clearTimeout(layoutMetricsLateTimer);
  layoutMetricsLateTimer = window.setTimeout(() => {
    layoutMetricsLateTimer = null;
    applyLayoutMetrics();
  }, 320);

  chromeResizeObserver = new ResizeObserver(() => applyLayoutMetrics());
  if (editTopDockRef.value) {
    chromeResizeObserver.observe(editTopDockRef.value);
  }
  if (editFooterRef.value) {
    chromeResizeObserver.observe(editFooterRef.value);
  }

  autoSaveIntervalId = setInterval(() => {
    if (!hasPendingChanges.value || !isAutoSaveEnabled.value || !canSaveDraft()) return;
    void saveDraftCore({ source: 'auto', silent: true });
  }, AUTO_SAVE_INTERVAL_MS);

  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  if (catalogShownRetryTimer) {
    clearTimeout(catalogShownRetryTimer);
    catalogShownRetryTimer = null;
  }

  if (layoutMetricsLateTimer) {
    clearTimeout(layoutMetricsLateTimer);
    layoutMetricsLateTimer = null;
  }

  if (layoutMetricsRaf) {
    cancelAnimationFrame(layoutMetricsRaf);
    layoutMetricsRaf = 0;
  }

  if (chromeResizeObserver) {
    chromeResizeObserver.disconnect();
    chromeResizeObserver = null;
  }

  if (offResizeListener) {
    offResizeListener();
    offResizeListener = null;
  }

  clearAutoSaveDebounce();
  clearDraftCompareDebounce();
  if (autoSaveIntervalId) {
    clearInterval(autoSaveIntervalId);
    autoSaveIntervalId = null;
  }
  if (tagSuggestionsBlurTimer) {
    clearTimeout(tagSuggestionsBlurTimer);
    tagSuggestionsBlurTimer = null;
  }
  window.removeEventListener('resize', scheduleLayoutMetricsRaf);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped lang="scss">
.article-edit-page {
  /* JS 未跑通前兜底：接近安全区 + 一行顶栏；实测由 applyLayoutMetrics 覆盖 */
  --article-edit-top-h: calc(56px + env(safe-area-inset-top, 0px));
  --article-edit-footer-h: 72px;
  --article-edit-catalog-w: 200px;
  /* 目录右缘与正文区之间的间距 */
  --article-edit-catalog-gap: 1vw;
  /* 正文+设置块在「目录以右」区域内居中时的最大宽度 */
  --article-edit-content-max: 1600px;
  --article-edit-accent: var(--primary, #fb7299);
  --article-edit-accent-soft: color-mix(in srgb, var(--primary, #fb7299) 9%, var(--bg-secondary, #ffffff));
  --article-edit-accent-border: color-mix(in srgb, var(--primary, #fb7299) 12%, var(--border-color, #e3e5e7));
  --article-edit-surface: var(--bg-secondary, #ffffff);
  /* 编辑页背景：中性灰，不显粉色调 */
  --article-edit-title-color: #475569;
  --article-edit-title-placeholder: #94a3b8;

  min-height: 100vh;
  background-color: #ffffff;
  background-image: none;
  padding: 0;
  padding-top: var(--article-edit-top-h);
  padding-left: 0;
  padding-bottom: calc(var(--article-edit-footer-h) + env(safe-area-inset-bottom, 0));
  /* visible：避免 clip 在部分环境下裁切 position:fixed 的左侧目录 */
  overflow-x: visible;
  box-sizing: border-box;
  position: relative;
}

[data-theme='dark'] .article-edit-page {
  --article-edit-accent-soft: color-mix(in srgb, var(--primary) 13%, #ffffff);
  --article-edit-accent-border: color-mix(in srgb, var(--primary) 12%, var(--border-color, #e3e5e7));
  --article-edit-title-color: #475569;
  --article-edit-title-placeholder: #94a3b8;
  --bg-primary: #ffffff;
  --bg-secondary: #ffffff;
  --text-primary: #212121;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --border-color: #e3e5e7;
  --border-light: #f1f2f3;
  background-color: #ffffff;
  background-image: none;
}

@media (min-width: 769px) {
  .article-edit-page {
    padding-left: calc(
      env(safe-area-inset-left, 0px) + var(--article-edit-catalog-w) + var(--article-edit-catalog-gap)
    );
  }
}

// ---------- 顶栏双层（fixed，与 CSDN 顶栏一致）----------
.edit-top-dock {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 300;
  background: #ffffff;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.65) inset,
    0 10px 32px rgba(15, 23, 42, 0.06);
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
  box-sizing: border-box;
}

[data-theme='dark'] .edit-top-dock {
  background: #ffffff;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.65) inset,
    0 10px 32px rgba(15, 23, 42, 0.06);
}

.edit-dock-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  min-height: 48px;

  &--back {
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color, #e3e5e7);
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  color: var(--text-secondary, #666666);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: var(--primary);
  }
}

.dock-back-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 1;
  min-width: 0;
}

.draft-hint {
  font-size: 13px;
  color: var(--text-secondary, #666666);
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.autosave-text {
  font-size: 13px;
  color: var(--text-tertiary, #999999);
  transition: color 0.2s ease;
  white-space: nowrap;

  &.is-dirty,
  &.is-saving {
    color: var(--primary);
  }

  &.is-saved {
    color: var(--success, #10b981);
  }

  &.is-error {
    color: var(--danger, #ef4444);
  }
}

// ---------- 主内容区（在目录以右的可用宽度内水平居中，宽度上限见 --article-edit-content-max）----------
.edit-container {
  width: 100%;
  max-width: var(--article-edit-content-max);
  margin-left: auto;
  margin-right: auto;
  /* 顶边与 fixed 返回栏盒底对齐（页面 padding-r-top 已为顶栏留位，此处不再额外下推） */
  padding: 0 24px 32px;
  box-sizing: border-box;
  background: #ffffff;
}

[data-theme='dark'] .edit-container {
  background: #ffffff;
}

.edit-paper {
  /* 与工具栏左右内边距对齐 */
  --article-edit-paper-pad-x: 32px;

  background: #ffffff;
  border-radius: var(--radius-xl, 16px);
  border-block: none;
  border-inline: 1px solid var(--border-color, #e3e5e7);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.55) inset,
    0 10px 36px rgba(15, 23, 42, 0.04),
    0 2px 12px rgba(15, 23, 42, 0.03);
  /* 减小上内边距，让标题→工具栏→正文整体上移，与顶栏盒底、左侧目录更齐 */
  padding: 4px var(--article-edit-paper-pad-x) 20px;
  margin-bottom: 24px;
}

[data-theme='dark'] .edit-paper {
  background: #ffffff;
  border-inline-color: var(--border-color, #e3e5e7);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.55) inset,
    0 10px 36px rgba(15, 23, 42, 0.04),
    0 2px 12px rgba(15, 23, 42, 0.03);
}

.paper-title-block {
  margin-bottom: 4px;
}

.paper-title-input {
  :deep(.el-input__wrapper) {
    box-shadow: none;
    border: none;
    padding: 4px 4px;
    background: transparent;
  }

  :deep(.el-input__inner) {
    font-size: 26px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--article-edit-title-color);
    letter-spacing: -0.02em;
  }

  :deep(.el-input__inner::placeholder) {
    color: var(--article-edit-title-placeholder);
  }
}

.paper-title-divider {
  height: 1px;
  border-radius: 0;
  margin: 4px 0 8px;
  background: var(--border-color, #e2e8f0);
  opacity: 1;
}

.paper-editor-host {
  min-height: 520px;

  /*
   * 工具栏必须保留在 MdEditor 内部，Vue 才能正确 patch DOM；下拉（标题等）依赖 offsetParent 与库内定位。
   * 使用 sticky 贴在固定顶栏下方；需让 .md-editor 对 sticky 不设为裁剪根（默认 overflow:hidden 会失效 sticky）。
   */
  :deep(.md-editor) {
    border: none;
    border-radius: 0;
    min-height: 500px;
    box-shadow: none;
    overflow: visible;

    &[data-theme='dark'] {
      background: transparent;
    }
  }

  :deep(.md-editor-toolbar-wrapper) {
    position: sticky;
    top: var(--article-edit-top-h);
    z-index: 295;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    row-gap: 8px;
    column-gap: 2px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding-block: 6px;
    padding-inline: 6px;
    background: #ffffff;
    border: 1px solid var(--md-border-color, var(--border-color, #e3e5e7));
    border-radius: 12px;
    box-shadow:
      0 4px 18px rgba(15, 23, 42, 0.07),
      0 1px 0 rgba(255, 255, 255, 0.45) inset;
    /*
     * 库默认 .md-editor-toolbar-wrapper 为 overflow-y:hidden，会把标题/表格等绝对定位下拉裁掉，悬停看不见菜单。
     * 本页工具栏已 flex-wrap，无需再隐藏纵向溢出。
     */
    overflow-x: visible;
    overflow-y: visible;
  }

  :deep(.md-editor-toolbar) {
    flex-direction: row;
    flex-wrap: wrap;
    max-height: none;
    overflow: visible;
    justify-content: center;
    align-items: center;
    width: auto;
    max-width: 100%;
    gap: 2px;
  }

  :deep(.md-editor-toolbar-left),
  :deep(.md-editor-toolbar-right) {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    align-content: center;
  }

  /*
   * 库默认 .md-editor-toolbar-item 为 flex-direction:column（图标上、文字下），
   * 再叠加固定 height 时容易图标不垂直居中。改为横向工具条：单行 flex + 图标与文字并排，
   * 仅图标时也在按钮内绝对几何居中。
   */
  :deep(.md-editor-toolbar-item) {
    display: inline-flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: center !important;
    width: auto;
    min-width: 34px;
    min-height: 34px;
    height: auto !important;
    padding: 6px 8px;
    margin-block: 0;
    margin-inline: 1px;
    line-height: 1;
    border-radius: 8px;
    box-sizing: border-box;
    gap: 4px;
    transition:
      background-color 0.2s ease,
      color 0.2s ease,
      box-shadow 0.2s ease;
  }

  :deep(.md-editor-toolbar-item svg) {
    display: block;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    vertical-align: middle;
  }

  :deep(.md-editor-toolbar-item-name) {
    font-size: 11px;
    line-height: 1.2;
    margin: 0;
    max-width: 7em;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :deep(.md-editor-toolbar-item:not([disabled]):hover) {
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.35);
  }

  :deep(.md-editor-toolbar-item.md-editor-toolbar-active) {
    box-shadow: 0 0 0 1px rgba(100, 116, 139, 0.45);
    background-color: color-mix(in srgb, #64748b 12%, var(--md-bk-color-outstand, #ececec)) !important;
  }

  :deep(.md-editor-divider) {
    position: relative;
    width: 1px;
    height: 18px;
    align-self: center;
    margin-block: 0;
    margin-inline: 6px;
    inset-block-start: 0;
    flex-shrink: 0;
    display: inline-block;
    vertical-align: middle;
    opacity: 0.85;
  }

  :deep(.md-editor-preview img),
  :deep(.md-editor-html-preview img) {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 20px auto;
    border-radius: 12px;
  }

  /* 大纲目录：覆盖 md-editor 默认 #73d13d，与全站中性灰文案一致 */
  :deep(.md-editor-catalog-link span) {
    color: var(--text-secondary, #64748b);
  }

  :deep(.md-editor-catalog-link span:hover) {
    color: var(--text-primary, #475569);
  }

  :deep(.md-editor-catalog-active > span) {
    color: var(--text-primary, #334155);
    font-weight: 600;
  }

  :deep(.md-editor-catalog-indicator) {
    background-color: var(--text-tertiary, #94a3b8);
  }
}

[data-theme='dark'] .paper-editor-host {
  :deep(.md-editor-catalog-link span) {
    color: #94a3b8;
  }

  :deep(.md-editor-catalog-link span:hover) {
    color: #cbd5e1;
  }

  :deep(.md-editor-catalog-active > span) {
    color: #e2e8f0;
  }

  :deep(.md-editor-catalog-indicator) {
    background-color: #64748b;
  }
}

@media (min-width: 769px) {
  .paper-editor-host {
    :deep(.md-editor-content) {
      flex-direction: row;
      align-items: stretch;
    }

    /* 视口左侧固定目录（与 CSDN 一致），不占正文流宽度 */
    :deep(.md-editor-catalog-flat) {
      position: fixed;
      left: env(safe-area-inset-left, 0);
      /* 须严格等于顶栏底边距（见 applyLayoutMetrics），否则会与 z-index:300 的返回栏重叠 */
      top: var(--article-edit-top-h);
      bottom: var(--article-edit-footer-h);
      width: var(--article-edit-catalog-w);
      /* 高于 sticky 工具栏(295)，低于返回顶栏(300)，避免大纲被正文区盖住又压在返回栏下 */
      z-index: 298;
      max-height: none;
      align-self: stretch;
      border-radius: 0;
      box-shadow: 4px 0 24px rgba(15, 23, 42, 0.07);
      background: #ffffff;
      border-right: 1px solid var(--border-color, #e3e5e7);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    :deep(.md-editor-catalog-editor) {
      flex: 1;
      min-height: 0;
      height: auto !important;
      max-height: none !important;
      border-inline-start: none !important;
      border-inline-end: none !important;
    }

    /* 与正文区一并上移后略减顶留白，避免左右「第一条大纲 / 工具栏」高低差过大 */
    :deep(.md-editor-catalog-container > .md-editor-catalog-link:first-child) {
      padding-top: 30px;
    }
  }
}

// 文末设置（与正文同宽、同居中）
.edit-settings-after {
  width: 100%;
  max-width: var(--article-edit-content-max);
  margin-left: auto;
  margin-right: auto;
  scroll-margin-top: calc(var(--article-edit-top-h, 96px) + 12px);
  box-sizing: border-box;
}

.sidebar-card {
  padding: 20px 24px;
  border-radius: var(--radius-xl, 16px);
  border: 1px solid var(--border-color, #e3e5e7);
  background: #ffffff;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.78) inset,
    0 12px 40px rgba(15, 23, 42, 0.06),
    0 2px 10px rgba(15, 23, 42, 0.04);
  position: relative;
  overflow: hidden;
}

[data-theme='dark'] .sidebar-card {
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.35);
}

.settings-card {
  position: static;
  max-height: none;
  overflow: visible;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #212121);
  margin: 0 0 20px;
  padding-bottom: 12px;
  padding-left: 10px;
  border-bottom: 1px solid var(--border-color, #e3e5e7);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.15em;
    bottom: 0.15em;
    width: 3px;
    border-radius: 999px;
    background: #cbd5e1;
  }
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
    color: var(--text-secondary, #666666);
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
    border: 2px dashed var(--border-color, #e2e8f0);
    background: #ffffff;
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
    border-color: var(--border-color, #e2e8f0);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  :deep(.el-textarea__inner:focus) {
    border-color: var(--border-color, #94a3b8);
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.35);
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
    color: var(--text-secondary, #666666);
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: var(--text-primary, #212121);
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
    border-top: 1px solid var(--border-color, #e3e5e7);
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
    color: var(--text-secondary, #666666);
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
    color: var(--text-secondary, #666666);
    margin-bottom: 8px;
  }

  .form-tip {
    margin-top: 8px;
  }
}

.settings-card .meta-section {
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
    border: 1px solid var(--border-color, #e3e5e7);
    background: #ffffff;
    color: var(--text-secondary, #666666);
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
      color: var(--text-primary, #212121);
      background: #ffffff;
    }

    &.selected {
      border-color: var(--primary);
      background: #ffffff;
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
    border: 1px solid var(--border-color, #e3e5e7);
    background: #ffffff;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  }

  .tag-suggestions-title {
    font-size: 12px;
    color: var(--text-tertiary, #999999);
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
    border: 1px solid var(--border-color, #e3e5e7);
    background: #ffffff;
    color: var(--text-secondary, #666666);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .tag-suggestion-item:hover {
    background: #ffffff;
    border-color: var(--primary);
    color: var(--primary);
  }

  .tags-input {
    :deep(.el-input__wrapper) {
      border-radius: 12px;
      border: 1px solid var(--border-color, #e3e5e7);
      background: #ffffff;
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
    border: 1px solid var(--border-color, #e3e5e7);
    background: #ffffff;
    color: var(--text-secondary, #666666);
    font-size: 13px;
    font-weight: 500;
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

// 底部固定栏
.edit-footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 290;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px calc(24px + env(safe-area-inset-right, 0)) calc(12px + env(safe-area-inset-bottom, 0))
    calc(24px + env(safe-area-inset-left, 0));
  background: #ffffff;
  border-top: 1px solid var(--border-color, #e3e5e7);
  box-shadow: 0 -8px 32px rgba(15, 23, 42, 0.04);
  box-sizing: border-box;
}

[data-theme='dark'] .edit-footer-bar {
  background: #ffffff;
  border-top-color: var(--border-color, #e3e5e7);
  box-shadow: 0 -8px 32px rgba(15, 23, 42, 0.04);
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.footer-settings-link {
  margin: 6px 0 0;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  font-weight: 500;
  text-align: left;
  width: fit-content;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    opacity: 0.85;
  }
}

.footer-word-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #212121);
}

.footer-hint {
  font-size: 12px;
  color: var(--text-tertiary, #999999);
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;

  &--ghost {
    border: 1px solid var(--border-color, #e3e5e7);
    background: #ffffff;
    color: var(--text-secondary, #666666);

    &:hover:not(:disabled) {
      border-color: var(--primary);
      color: var(--primary);
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }
}

.footer-publish {
  min-width: 120px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
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


@media (max-width: 1024px) {
  .paper-editor-host {
    min-height: 420px;

    :deep(.md-editor) {
      min-height: 400px;
    }
  }
}

@media (max-width: 768px) {
  .article-edit-page {
    padding-left: 0;
  }

  .edit-container {
    padding: 0 16px 24px;
  }

  .edit-paper {
    --article-edit-paper-pad-x: 16px;
    padding: 8px var(--article-edit-paper-pad-x) 16px;
  }

  .edit-dock-row {
    padding-left: 12px;
    padding-right: 12px;
  }

  .dock-back-meta {
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  .paper-editor-host {
    :deep(.md-editor-content) {
      flex-direction: column;
    }

    :deep(.md-editor-catalog-flat) {
      position: relative;
      left: auto;
      top: auto;
      bottom: auto;
      max-height: min(220px, 40vh);
      width: 100% !important;
      order: -1;
      border-radius: 10px 10px 0 0;
      box-shadow: none;
      background: #ffffff;
      border-right: none;
      display: block;
      overflow: visible;
    }

    :deep(.md-editor-catalog-editor) {
      width: 100% !important;
      flex: none;
      min-height: unset;
      border-inline-end: none !important;
      border-block-end: 1px solid var(--md-border-color, var(--border-color, #e3e5e7)) !important;
    }
  }

  .paper-editor-host :deep(.md-editor) {
    min-height: 360px;
  }

  .edit-footer-bar {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
