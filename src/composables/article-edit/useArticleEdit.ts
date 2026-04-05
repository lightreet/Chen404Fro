import { ref, reactive, computed, onMounted, onUnmounted, onUpdated, watch, nextTick } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { ExposeParam, ToolbarNames } from 'md-editor-v3';
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
import { mdImageResizeEmitter } from '@/utils/mdImageResizeEmitter';
import { useUserStore } from '@/stores/user';
import { isAdminUser } from '@/utils/permission';

export function useArticleEdit() {
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
const articleEditRootRef = ref<HTMLElement | null>(null);
const editTopDockRef = ref<HTMLElement | null>(null);
const editFooterRef = ref<HTMLElement | null>(null);
const settingsAnchorRef = ref<HTMLElement | null>(null);
const paperEditorHostRef = ref<HTMLElement | null>(null);
const articleEditTopOffset = ref(96);

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
  articleEditTopOffset.value = topH;
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
  return {
    articleEditRootRef,
    editTopDockRef,
    editFooterRef,
    articleEditTopOffset,
    settingsAnchorRef,
    paperEditorHostRef,
    editorRef,
    canSetArticleTop,
    onMdToolbarItemClickOpenDropdown,
    goBack,
    scrollToArticleSettings,
    editorTheme,
    toolbars,
    form,
    contentCharCount,
    visibilityOptions,
    commentPolicyOptions,
    formTagIds,
    customTagNames,
    newTagName,
    showTagSuggestions,
    advancedOpen,
    categories,
    tags,
    isDraftSaving,
    publishing,
    autoSaveState,
    handleCoverUpload,
    beforeCoverUpload,
    onUploadImg,
    handleSaveDraft,
    handlePublish,
    autoSaveStatusText,
    addCustomTag,
    removeCustomTag,
    selectedTagNames,
    suggestedTags,
    removeTagById,
    addTagById,
    onTagsInputBlur,
    onTagsWrapMouseEnter,
    onTagsWrapMouseLeave,
  };
}
