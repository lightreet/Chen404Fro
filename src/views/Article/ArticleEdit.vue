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
        </div>
        <div class="header-actions">
          <button type="button" class="header-link" @click="handleSaveDraft" :disabled="savingDraft">
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
              v-model="form.content"
              :theme="editorTheme"
              :toolbars="toolbars"
              :preview="true"
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
                  <el-checkbox v-model="form.isTop" :true-value="1" :false-value="0">置顶文章</el-checkbox>
                  <el-checkbox v-model="form.isRecommend" :true-value="1" :false-value="0">推荐文章</el-checkbox>
                  <el-radio-group v-model="form.status" size="small">
                    <el-radio-button :label="ArticleStatus.DRAFT">草稿</el-radio-button>
                    <el-radio-button :label="ArticleStatus.PUBLISHED">发布</el-radio-button>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Icon } from '@iconify/vue';
import { ArrowLeft, ArrowDown, Plus } from '@element-plus/icons-vue';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import type { Article, Category, Tag } from '@/types';
import { ArticleStatus } from '@/types';
import {
  getArticleById,
  createArticle,
  updateArticle,
  getCategories,
  getTags,
  uploadImage,
  uploadImages,
  uploadCover,
} from '@/api';
import { validateImageFile, DEFAULT_IMAGE_MAX_MB } from '@/utils/validation';

const route = useRoute();
const router = useRouter();

// 判断是否为编辑模式
const articleId = computed(() => {
  const id = route.params.id;
  return id ? parseInt(id as string, 10) : null;
});
const isEdit = computed(() => !!articleId.value);

// 编辑器主题
const editorTheme = computed(() => {
  const savedTheme = localStorage.getItem('theme');
  return savedTheme === 'dark' ? 'dark' : 'light';
});

// 编辑器工具栏配置
const toolbars = [
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

// 表单数据（与后端/数据库一致：置顶、推荐为 0/1 整型）
const form = reactive<Partial<Article>>({
  title: '',
  content: '',
  summary: '',
  coverImage: '',
  categoryId: undefined,
  status: ArticleStatus.DRAFT,
  isTop: 0,
  isRecommend: 0,
});

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
const savingDraft = ref(false);
const publishing = ref(false);
const loading = ref(false);

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

// 保存草稿
const handleSaveDraft = async () => {
  if (!form.title?.trim()) {
    ElMessage.warning('请输入文章标题');
    return;
  }

  savingDraft.value = true;
  try {
    const data = buildSubmitData();
    data.status = ArticleStatus.DRAFT;

    if (isEdit.value && articleId.value) {
      await updateArticle(articleId.value, data);
      ElMessage.success('草稿保存成功');
    } else {
      const res = await createArticle(data);
      ElMessage.success('草稿保存成功');
      // 跳转到编辑页面
      if (res.id) {
        router.replace(`/article/edit/${res.id}`);
      }
    }
  } catch (error) {
    console.error('保存草稿失败:', error);
    ElMessage.error('保存草稿失败');
  } finally {
    savingDraft.value = false;
  }
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
onMounted(() => {
  fetchCategoriesAndTags();
  if (isEdit.value) {
    fetchArticleDetail();
  }
});
</script>

<style scoped lang="scss">
.article-edit-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 0;
}

.edit-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px 24px;
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
  position: sticky;
  top: calc(var(--header-height, 64px) + 16px);
}

.sidebar-card {
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
    position: static;
  }

  .sidebar-card {
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
