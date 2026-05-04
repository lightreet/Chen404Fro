import { ref, reactive, computed, onMounted, onUnmounted, onUpdated, watch, nextTick } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { ExposeParam, ToolbarNames } from 'md-editor-v3';
import type { Category, Tag } from '@/types';
import { ArticleStatus, ArticleVisibility, ArticleCommentPolicy } from '@/types';
import {
  createArticle,
  updateArticle,
  uploadImage,
  uploadCover,
} from '@/api';
import type { RequestConfig } from '@/api';
import { validateImageFile, DEFAULT_IMAGE_MAX_MB } from '@/utils/validation';
import { mdImageResizeEmitter } from '@/utils/mdImageResizeEmitter';
import { useUserStore } from '@/stores/user';
import { isAdminUser } from '@/utils/permission';
import {
  AUTO_SAVE_DEBOUNCE_MS,
  AUTO_SAVE_INTERVAL_MS,
  DRAFT_COMPARE_DEBOUNCE_MS,
  TITLE_LEN_MAX,
  TITLE_LEN_MIN,
  buildArticleSubmitData,
  buildDraftSubmitData,
  commentPolicyOptions,
  fetchArticleEditorDetail,
  fetchArticleEditorOptions,
  type ArticleEditorForm,
  type AutoSaveState,
  type DraftSaveSource,
  useArticleTagSelector,
  visibilityOptions,
} from '@/modules/article-edit';

export function useArticleEdit() {
  const AUTO_SAVE_REQUEST_CONFIG: RequestConfig = { suppressErrorMessage: true };

  const route = useRoute();
  const router = useRouter();
  const userStore = useUserStore();
  const canSetArticleTop = computed(() => isAdminUser(userStore.user));
  const editorRef = ref<ExposeParam>();
  const articleEditRootRef = ref<HTMLElement | null>(null);
  const editTopDockRef = ref<HTMLElement | null>(null);
  const editFooterRef = ref<HTMLElement | null>(null);
  const settingsAnchorRef = ref<HTMLElement | null>(null);
  const paperEditorHostRef = ref<HTMLElement | null>(null);
  const articleEditTopOffset = ref(96);

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
    const topH = dock ? Math.max(56, Math.ceil(dock.getBoundingClientRect().bottom) + 2) : 96;
    const footEl = editFooterRef.value;
    const footH = footEl ? Math.max(48, Math.ceil(footEl.getBoundingClientRect().height)) : 72;
    root.style.setProperty('--article-edit-top-h', `${topH}px`);
    root.style.setProperty('--article-edit-footer-h', `${footH}px`);
    articleEditTopOffset.value = topH;
  }

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

  const articleId = computed(() => {
    const id = route.params.id;
    return typeof id === 'string' ? id : null;
  });
  const isEdit = computed(() => !!articleId.value);

  const editorTheme = computed(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

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
    0,
    1,
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

  const getPreviewScroller = () => {
    const host = paperEditorHostRef.value;
    if (!host) return null;
    return host.querySelector<HTMLElement>('.md-editor-preview-wrapper, .md-editor-html-preview');
  };

  const capturePreviewScrollState = () => {
    const scroller = getPreviewScroller();
    if (!scroller) return null;
    return {
      top: scroller.scrollTop,
      left: scroller.scrollLeft,
    };
  };

  const restorePreviewScrollState = (state: { top: number; left: number } | null) => {
    if (!state) return;

    const apply = () => {
      const scroller = getPreviewScroller();
      if (!scroller) return false;
      scroller.scrollTop = state.top;
      scroller.scrollLeft = state.left;
      return true;
    };

    if (apply()) return;

    void nextTick(() => {
      if (apply()) return;
      requestAnimationFrame(() => {
        if (apply()) return;
        requestAnimationFrame(apply);
      });
    });
  };

  const form = reactive<ArticleEditorForm>({
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
  const categories = ref<Category[]>([]);
  const tags = ref<Tag[]>([]);

  const {
    formTagIds,
    customTagNames,
    newTagName,
    showTagSuggestions,
    selectedTagNames,
    suggestedTags,
    addCustomTag,
    removeCustomTag,
    removeTagById,
    addTagById,
    setSelectedTagIds,
    setCustomTagNames,
    onTagsInputBlur,
    onTagsWrapMouseEnter,
    onTagsWrapMouseLeave,
    cleanupTagSelector,
  } = useArticleTagSelector(tags);

  const advancedOpen = ref(false);
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
  let layoutMetricsRaf = 0;

  const upsertImageWidthBySrc = (src: string, width: string) => {
    const content = form.content ?? '';
    if (!content) return;
    const previewScrollState = capturePreviewScrollState();

    const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const imgTagRegex = new RegExp(`<img\\s+[^>]*?src="${escapedSrc}"[^>]*?>`, 'i');
    const match = content.match(imgTagRegex);
    if (match && match[0]) {
      const tag = match[0];
      const hasStyle = /\sstyle="[^"]*"/i.test(tag);
      const nextTag = hasStyle
        ? tag.replace(/\sstyle="[^"]*"/i, (styleAttr) => {
            const style = styleAttr.replace(/^ style="/i, '').replace(/"$/i, '');
            const cleaned = style
              .split(';')
              .map((item) => item.trim())
              .filter(Boolean)
              .filter((item) => !item.toLowerCase().startsWith('width:'));
            cleaned.unshift(`width: ${width}`);
            cleaned.push('max-width: 100%');
            cleaned.push('height: auto');
            return ` style="${cleaned.join('; ')}"`;
          })
        : tag.replace(/<img/i, `<img style="width: ${width}; max-width: 100%; height: auto;"`);

      form.content = content.replace(tag, nextTag);
      restorePreviewScrollState(previewScrollState);
      return;
    }

    const mdImgRegex = new RegExp(`!\\[[^\\]]*\\]\\(\\s*${escapedSrc}\\s*(?:"[^"]*")?\\)`, 'i');
    const mdMatch = content.match(mdImgRegex);
    if (!mdMatch || !mdMatch[0]) return;

    const mdToken = mdMatch[0];
    const alt = mdToken.match(/^!\[([^\]]*)\]/)?.[1] ?? '';
    const title = mdToken.match(/"([^"]*)"\s*\)$/)?.[1] ?? '';
    const titleAttr = title ? ` title="${escapeHtmlAttr(title)}"` : '';
    const nextTag = `<img src="${src}" alt="${escapeHtmlAttr(alt)}"${titleAttr} style="width: ${width}; max-width: 100%; height: auto;" />`;
    form.content = content.replace(mdToken, nextTag);
    restorePreviewScrollState(previewScrollState);
  };

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

  let layoutMetricsLateTimer: number | null = null;

  const fetchCategoriesAndTags = async () => {
    try {
      const options = await fetchArticleEditorOptions();
      categories.value = options.categories;
      tags.value = options.tags;
    } catch (error) {
      console.error('获取分类/标签失败:', error);
      categories.value = [];
      tags.value = [];
    }
  };

  const fetchArticleDetail = async () => {
    if (!articleId.value) return;

    loading.value = true;
    try {
      const article = await fetchArticleEditorDetail(articleId.value);
      loadedArticleStatus.value = article.status;
      Object.assign(form, article);
      if (article.tags) {
        setSelectedTagIds(article.tags.map((tag) => Number(tag.id)));
        setCustomTagNames([]);
      }
    } catch (error) {
      console.error('获取文章详情失败', error);
      ElMessage.error('获取文章详情失败');
      router.push('/');
    } finally {
      loading.value = false;
    }
  };

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

  const beforeCoverUpload = (file: File) => {
    const result = validateImageFile(file, DEFAULT_IMAGE_MAX_MB);
    if (!result.valid) {
      ElMessage.error(result.message);
      return false;
    }
    return true;
  };

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

      const uploadPromises = validFiles.map(async (file) => {
        try {
          const res = await uploadImage(file);
          return res.url;
        } catch (error) {
          console.error(`${'上传失败:'} ${file.name}`, error);
          ElMessage.error(`${file.name} 上传失败`);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const urls = results.filter((url): url is string => url !== null);

      callback(urls);
      if (urls.length > 0) {
        ElMessage.success(`成功上传 ${urls.length} 张图片`);
      }
    } catch (error) {
      console.error('图片上传失败', error);
      ElMessage.error('图片上传失败');
    }
  };

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

  const buildSubmitData = () => buildArticleSubmitData(form, formTagIds.value, customTagNames.value);
  const buildDraftPayload = () => buildDraftSubmitData(form, formTagIds.value, customTagNames.value);
  const computeDraftSnapshot = () => JSON.stringify(buildDraftPayload());

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
      || customTagNames.value.length,
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
        const data = buildDraftPayload();
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
        console.error(`${source} 保存草稿失败`, error);
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

  const handleSaveDraft = async () => {
    await saveDraftCore({ source: 'manual' });
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    try {
      await ElMessageBox.confirm('确定要发布这篇文章吗？', '确认发布', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      });
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
      console.error('发布失败', error);
      ElMessage.error('发布失败');
    } finally {
      publishing.value = false;
    }
  };

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
    cleanupTagSelector();
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
