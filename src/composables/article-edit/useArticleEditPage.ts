import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ExposeParam, ToolbarNames } from 'md-editor-v3'
import type { Article, Category, Tag } from '@/types'
import { ArticleStatus, ArticleVisibility, ArticleCommentPolicy } from '@/types'
import {
  getArticleById,
  createArticle,
  updateArticle,
  getCategories,
  getTags,
} from '@/api/article'
import { uploadImage, uploadCover } from '@/api/upload'
import type { RequestConfig } from '@/api/request'
import { validateImageFile, DEFAULT_IMAGE_MAX_MB } from '@/utils/validation'
import { mdImageResizeEmitter } from '@/utils/mdImageResizeEmitter'
import { useUserStore } from '@/stores/user'
import { isAdminUser } from '@/utils/permission'


export function useArticleEditPage() {
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
// ---------------------------------------------------------------------------
// 桌面端竖条 Markdown 工具栏（FAB + fixed 面板）：毛玻璃 wrapper 与库内下拉定位需补丁
// ---------------------------------------------------------------------------
const isToolbarOpen = ref(false);
const editorWrapperRef = ref<HTMLElement | null>(null);
const toolbarFloatTipRef = ref<HTMLElement | null>(null);
const toolbarDockPos = reactive({ topPx: 96, leftPx: 16 });
const toolbarFloatTip = reactive({
  visible: false,
  text: '',
  top: 0,
  left: 0,
});

let toolbarTipCurrentButton: HTMLElement | null = null;
let toolbarTipScrollBar: HTMLElement | null = null;
let onToolbarTipScroll: (() => void) | null = null;

function detachToolbarTipScrollListener() {
  if (toolbarTipScrollBar && onToolbarTipScroll) {
    toolbarTipScrollBar.removeEventListener('scroll', onToolbarTipScroll);
  }
  toolbarTipScrollBar = null;
  onToolbarTipScroll = null;
}

function updateToolbarFloatTipPosition(btn: HTMLElement) {
  const r = btn.getBoundingClientRect();
  const margin = 10;
  const pad = 8;
  const cy = r.top + r.height / 2;
  toolbarFloatTip.top = cy;
  const tipEl = toolbarFloatTipRef.value;
  const w = tipEl?.getBoundingClientRect().width || 180;
  let left = r.right + margin;
  const rightEdge = left + w;
  if (rightEdge > window.innerWidth - pad) {
    left = r.left - margin - w;
  }
  if (left < pad) left = pad;
  toolbarFloatTip.left = left;
}

function hideToolbarFloatTip() {
  toolbarFloatTip.visible = false;
  toolbarFloatTip.text = '';
  toolbarTipCurrentButton = null;
  detachToolbarTipScrollListener();
}

function showToolbarFloatTip(btn: HTMLElement) {
  const text = btn.getAttribute('aria-label') || btn.getAttribute('title') || '';
  if (!text) {
    hideToolbarFloatTip();
    return;
  }
  toolbarTipCurrentButton = btn;
  toolbarFloatTip.text = text;
  toolbarFloatTip.visible = true;
  void nextTick(() => {
    updateToolbarFloatTipPosition(btn);
    requestAnimationFrame(() => updateToolbarFloatTipPosition(btn));
    const root = editorWrapperRef.value;
    const bar = root?.querySelector('.md-editor-toolbar') as HTMLElement | null;
    if (!bar) return;
    detachToolbarTipScrollListener();
    toolbarTipScrollBar = bar;
    onToolbarTipScroll = () => {
      if (toolbarTipCurrentButton) updateToolbarFloatTipPosition(toolbarTipCurrentButton);
    };
    bar.addEventListener('scroll', onToolbarTipScroll, { passive: true });
  });
}

function onToolbarTipMouseOver(ev: MouseEvent) {
  if (!isToolbarOpen.value) return;
  const t = ev.target;
  if (!(t instanceof Element)) return;
  const root = editorWrapperRef.value;
  const mdWrap = root?.querySelector('[id$="-toolbar-wrapper"]');
  if (mdWrap?.contains(t)) scheduleRepositionDropdown();
  const btn = t.closest('.md-editor-toolbar-item') as HTMLElement | null;
  if (btn && !btn.closest('.md-editor-menu')) {
    mdToolbarItemHoverAnchor = btn;
  }
  if (!btn || btn.closest('.md-editor-menu')) return;
  if (!root || !root.contains(btn)) return;
  if (btn.hasAttribute('disabled') || btn.classList.contains('md-editor-disabled')) return;
  showToolbarFloatTip(btn);
}

function onToolbarTipMouseOut(ev: MouseEvent) {
  if (!isToolbarOpen.value) return;
  const t = ev.target;
  if (!(t instanceof Element)) return;
  const btn = t.closest('.md-editor-toolbar-item') as HTMLElement | null;
  if (!btn) return;
  const rel = ev.relatedTarget;
  if (rel instanceof Node && btn.contains(rel)) return;
  // 移入 md-editor 子菜单（与触发按钮为兄弟节点）时不要当作离开按钮；库内仅用 10ms 衔接 hover
  if (
    rel instanceof Element &&
    (rel.closest('.md-editor-dropdown') || rel.closest('.md-editor-menu'))
  ) {
    return;
  }
  hideToolbarFloatTip();
}

function onWindowResizeToolbarTip() {
  if (toolbarTipCurrentButton && toolbarFloatTip.visible) {
    updateToolbarFloatTipPosition(toolbarTipCurrentButton);
  }
}

let resizeObserver: ResizeObserver | null = null;
let removeResizeListener: (() => void) | null = null;
let removeDocPointerListener: (() => void) | null = null;
let removeKeydownListener: (() => void) | null = null;

let offResizeListener: (() => void) | null = null;

let mdToolbarDropdownObserver: MutationObserver | null = null;
let repositionDropdownRaf = 0;
let dropdownFollowRafId = 0;
let dropdownFollowFrames = 0;
let removeDropdownRepositionListeners: (() => void) | null = null;

/** 当前指针下的工具栏按钮；仅一条可见下拉时用其 rect 对齐菜单 */
let mdToolbarItemHoverAnchor: HTMLElement | null = null;

/** 覆盖过渡与库晚写入的 style；少量帧即可，避免多帧改写 top 造成持续漂移（见调试 H3） */
const DROPDOWN_FOLLOW_MAX_FRAMES = 3;

function cancelDropdownFollowLoop() {
  if (dropdownFollowRafId) {
    cancelAnimationFrame(dropdownFollowRafId);
    dropdownFollowRafId = 0;
  }
  dropdownFollowFrames = 0;
}

/** 下拉可见期间短时跟帧重贴，抵消库对 inset 的回写 */
function startDropdownFollowLoop() {
  cancelDropdownFollowLoop();
  const step = () => {
    repositionMdEditorDropdownFix();
    const root = editorWrapperRef.value;
    const hasVisible =
      isToolbarOpen.value &&
      !!root?.querySelector('[id$="-toolbar-wrapper"] .md-editor-dropdown:not(.md-editor-dropdown-hidden)');
    dropdownFollowFrames += 1;
    if (hasVisible && dropdownFollowFrames < DROPDOWN_FOLLOW_MAX_FRAMES) {
      dropdownFollowRafId = requestAnimationFrame(step);
    } else {
      cancelDropdownFollowLoop();
    }
  };
  dropdownFollowRafId = requestAnimationFrame(step);
}

/** 图片等工具在 fragment 中前置 label/input，dropdown 的前一个兄弟未必是按钮。 */
function resolveMdDropdownTrigger(dd: Element): HTMLElement | null {
  let el: Element | null = dd.previousElementSibling;
  let steps = 0;
  while (el && steps < 14) {
    if (el instanceof HTMLElement) {
      if (el.matches?.('.md-editor-toolbar-item')) return el;
      const inner = el.querySelector?.('.md-editor-toolbar-item');
      if (inner instanceof HTMLElement) return inner;
    }
    el = el.previousElementSibling;
    steps++;
  }
  return null;
}

/**
 * 必须相对 .md-editor-toolbar-wrapper 定位：该节点有 backdrop-filter，子元素 position:fixed 会相对此层而非视口；
 * 若仍用视口坐标的 top/left，菜单会整块偏到编辑区（与「公式 / 图片」等现象一致）。
 */
function applyMdDropdownPositionInWrapper(dd: HTMLElement, trigger: HTMLElement, wrap: HTMLElement) {
  const tr = trigger.getBoundingClientRect();
  const wr = wrap.getBoundingClientRect();
  /** 略小可缩短「按钮 → 下拉」移动距离，配合 vite 中延长的 hover 关闭延迟，减少误关 */
  const gap = 2;
  const pad = 4;
  dd.style.setProperty('position', 'absolute', 'important');
  dd.style.setProperty('transform', 'none', 'important');
  dd.style.setProperty('inset-block-start', 'auto', 'important');
  dd.style.setProperty('inset-inline-start', 'auto', 'important');
  dd.style.setProperty('inset', 'auto', 'important');
  dd.style.setProperty('right', 'auto', 'important');
  dd.style.setProperty('bottom', 'auto', 'important');
  let dw = dd.offsetWidth;
  if (!dw) dw = 160;
  let left = tr.left - wr.left + tr.width / 2 - dw / 2;
  const maxLeft = Math.max(pad, wr.width - dw - pad);
  left = Math.min(Math.max(pad, left), maxLeft);
  let top = tr.bottom - wr.top + gap;
  const dh = dd.offsetHeight || 0;
  const innerH = wrap.clientHeight || wr.height;
  let usedFlip = false;
  /** 表格格点展开时高度剧变，上下翻转阈值反复越过会导致 top/usedFlip 抖动，故表格选择器固定向下展开 */
  const isTablePicker = Boolean(dd.querySelector('.md-editor-table-shape'));
  if (!isTablePicker && dh > 0 && top + dh > innerH - pad) {
    top = Math.max(pad, tr.top - wr.top - gap - dh);
    usedFlip = true;
  }
  dd.style.setProperty('left', `${left}px`, 'important');
  dd.style.setProperty('top', `${top}px`, 'important');
  dd.style.setProperty('z-index', '14000', 'important');

  dd.classList.toggle('md-editor-dropdown-open-up', usedFlip);
}

/** md-editor 下拉：库内 offsetTop 与竖栏滚动不一致 + wrapper 上 backdrop-filter 使 fixed 参照错误；用 wrapper 内 absolute 纠正。 */
function repositionMdEditorDropdownFix() {
  const root = editorWrapperRef.value;
  if (!root || !isToolbarOpen.value) return;
  const wrap = root.querySelector('[id$="-toolbar-wrapper"]');
  if (!wrap || !(wrap instanceof HTMLElement)) return;
  const dropdowns = wrap.querySelectorAll('.md-editor-dropdown:not(.md-editor-dropdown-hidden)');
  if (!dropdowns.length) return;

  const anchorOk =
    mdToolbarItemHoverAnchor instanceof HTMLElement && wrap.contains(mdToolbarItemHoverAnchor);
  let list = Array.from(dropdowns).filter((n): n is HTMLElement => n instanceof HTMLElement);

  /** 过渡期可能同时有两个「未 hidden」的下拉；只重贴与当前 hover 按钮匹配的那一项，避免串台（见调试 H5） */
  if (anchorOk && mdToolbarItemHoverAnchor && list.length > 1) {
    const matched = list.filter((node) => resolveMdDropdownTrigger(node) === mdToolbarItemHoverAnchor);
    if (matched.length >= 1) list = matched;
  }

  list.forEach((node) => {
    const resolved = resolveMdDropdownTrigger(node);
    const trigger =
      list.length === 1 && anchorOk
        ? mdToolbarItemHoverAnchor
        : resolved ?? (anchorOk ? mdToolbarItemHoverAnchor : null);
    if (!trigger) return;
    applyMdDropdownPositionInWrapper(node, trigger, wrap);
  });
}

function scheduleRepositionDropdown() {
  if (repositionDropdownRaf) cancelAnimationFrame(repositionDropdownRaf);
  const run = () => {
    repositionMdEditorDropdownFix();
    requestAnimationFrame(() => repositionMdEditorDropdownFix());
  };
  repositionDropdownRaf = requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      repositionDropdownRaf = 0;
      run();
      startDropdownFollowLoop();
    });
  });
}

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

// 编辑器工具栏配置（0 = #defToolbars 第一项：表情面板，数据来自 @/emoji registry + article 场景策略）
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
  '-',
  0,
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

const toggleToolbar = () => {
  isToolbarOpen.value = !isToolbarOpen.value;
};

watch(isToolbarOpen, (open) => {
  if (!open) {
    hideToolbarFloatTip();
    cancelDropdownFollowLoop();
    mdToolbarItemHoverAnchor = null;
  }
});

const computeToolbarDock = async () => {
  await nextTick();
  const el = editorWrapperRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  // 顶部与正文编辑框对齐（只在布局变化时重新计算；滚动时保持相对视口静止）
  toolbarDockPos.topPx = Math.max(80, Math.round(rect.top));
  // 左侧悬浮：toolbar(56px) + gap(12px)
  toolbarDockPos.leftPx = Math.max(12, Math.round(rect.left) - 68);
};

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
  await computeToolbarDock();
  const onWindowResize = () => {
    void computeToolbarDock();
    if (isToolbarOpen.value) {
      scheduleRepositionDropdown();
      onWindowResizeToolbarTip();
    }
  };
  window.addEventListener('resize', onWindowResize);
  removeResizeListener = () => window.removeEventListener('resize', onWindowResize);

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => void computeToolbarDock());
    if (editorWrapperRef.value) resizeObserver.observe(editorWrapperRef.value);
  }

  const onDocPointerDown = (ev: MouseEvent) => {
    if (!isToolbarOpen.value) return;
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.md-toolbar-fab')) return;
    if (target.closest('.md-editor-toolbar-wrapper')) return;
    // 正文/预览编辑区：继续写作不应收起工具栏（否则一点击输入区就关闭）
    if (target.closest('.md-editor-content')) return;
    // 工具栏下拉/弹层可能挂到 body，需排除
    if (target.closest('.md-editor-dropdown')) return;
    if (target.closest('.md-editor-modal-mask')) return;
    if (target.closest('.md-editor-modal')) return;
    isToolbarOpen.value = false;
  };
  document.addEventListener('mousedown', onDocPointerDown);
  removeDocPointerListener = () => document.removeEventListener('mousedown', onDocPointerDown);

  const onKeydown = (ev: KeyboardEvent) => {
    if (!isToolbarOpen.value) return;
    if (ev.key === 'Escape') isToolbarOpen.value = false;
  };
  window.addEventListener('keydown', onKeydown);
  removeKeydownListener = () => window.removeEventListener('keydown', onKeydown);

  offResizeListener = mdImageResizeEmitter.on(({ src, width }) => {
    upsertImageWidthBySrc(src, width);
  });

  await Promise.all([
    fetchCategoriesAndTags(),
    isEdit.value ? fetchArticleDetail() : Promise.resolve(),
  ]);

  syncSavedSnapshot();
  editorReady.value = true;

  void nextTick(() => {
    const wrap = editorWrapperRef.value;
    if (!wrap) return;

    const barScroll = wrap.querySelector('.md-editor-toolbar') as HTMLElement | null;
    const onBarScroll = () => scheduleRepositionDropdown();
    barScroll?.addEventListener('scroll', onBarScroll, { passive: true });

    wrap.addEventListener('mouseover', onToolbarTipMouseOver, true);
    wrap.addEventListener('mouseout', onToolbarTipMouseOut, true);

    const mdToolbarWrapper = wrap.querySelector('[id$="-toolbar-wrapper"]');
    if (mdToolbarWrapper && typeof MutationObserver !== 'undefined') {
      mdToolbarDropdownObserver = new MutationObserver(() => scheduleRepositionDropdown());
      mdToolbarDropdownObserver.observe(mdToolbarWrapper, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    }

    removeDropdownRepositionListeners = () => {
      mdToolbarDropdownObserver?.disconnect();
      mdToolbarDropdownObserver = null;
      barScroll?.removeEventListener('scroll', onBarScroll);
      wrap.removeEventListener('mouseover', onToolbarTipMouseOver, true);
      wrap.removeEventListener('mouseout', onToolbarTipMouseOut, true);
      hideToolbarFloatTip();
    };
  });

  autoSaveIntervalId = setInterval(() => {
    if (!hasPendingChanges.value || !isAutoSaveEnabled.value || !canSaveDraft()) return;
    void saveDraftCore({ source: 'auto', silent: true });
  }, AUTO_SAVE_INTERVAL_MS);

  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  if (removeResizeListener) {
    removeResizeListener();
    removeResizeListener = null;
  }
  if (removeDocPointerListener) {
    removeDocPointerListener();
    removeDocPointerListener = null;
  }
  if (removeKeydownListener) {
    removeKeydownListener();
    removeKeydownListener = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  if (offResizeListener) {
    offResizeListener();
    offResizeListener = null;
  }
  if (removeDropdownRepositionListeners) {
    removeDropdownRepositionListeners();
    removeDropdownRepositionListeners = null;
  }
  mdToolbarDropdownObserver?.disconnect();
  mdToolbarDropdownObserver = null;
  cancelDropdownFollowLoop();
  mdToolbarItemHoverAnchor = null;

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

  return {
    editorRef,
    canSetArticleTop,
    isToolbarOpen,
    editorWrapperRef,
    toolbarFloatTipRef,
    toolbarDockPos,
    toolbarFloatTip,
    toggleToolbar,
    editorTheme,
    toolbars,
    form,
    visibilityOptions,
    commentPolicyOptions,
    customTagNames,
    newTagName,
    showTagSuggestions,
    advancedOpen,
    categories,
    isDraftSaving,
    publishing,
    autoSaveState,
    autoSaveStatusText,
    handleCoverUpload,
    beforeCoverUpload,
    onUploadImg,
    handleSaveDraft,
    handlePublish,
    addCustomTag,
    removeCustomTag,
    selectedTagNames,
    suggestedTags,
    removeTagById,
    addTagById,
    onTagsInputBlur,
    onTagsWrapMouseEnter,
    onTagsWrapMouseLeave,
    ArticleStatus,
  }
}
