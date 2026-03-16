<template>
  <div class="article-edit-page">
    <div class="edit-container">
      <!-- 页面头部 -->
      <div class="edit-header">
        <div class="header-left">
          <router-link to="/" class="back-link">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回首页</span>
          </router-link>
          <h1 class="page-title">{{ isEdit ? '编辑文章' : '编写文章' }}</h1>
        </div>
        <div class="header-actions">
          <el-button @click="handleSaveDraft" :loading="savingDraft">
            保存草稿
          </el-button>
          <el-button type="primary" @click="handlePublish" :loading="publishing">
            {{ form.status === ArticleStatus.PUBLISHED ? '更新发布' : '立即发布' }}
          </el-button>
        </div>
      </div>

      <!-- 编辑表单 -->
      <div class="edit-form">
        <!-- 文章标题 -->
        <div class="form-item">
          <el-input
            v-model="form.title"
            placeholder="请输入文章标题"
            size="large"
            class="title-input"
            maxlength="100"
            show-word-limit
          />
        </div>

        <!-- 基本信息行 -->
        <div class="form-row">
          <!-- 分类选择 -->
          <div class="form-item flex-1">
            <el-select
              v-model="form.categoryId"
              placeholder="选择分类"
              size="large"
              class="full-width"
            >
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </div>

          <!-- 标签输入 -->
          <div class="form-item flex-2">
            <el-select
              v-model="form.tagIds"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="选择或输入标签"
              size="large"
              class="full-width"
              :reserve-keyword="false"
            >
              <el-option
                v-for="tag in tags"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              />
            </el-select>
          </div>
        </div>

        <!-- 封面上传 -->
        <div class="form-item">
          <div class="cover-upload">
            <div class="cover-label">文章封面</div>
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
          </div>
        </div>

        <!-- 文章摘要 -->
        <div class="form-item">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="3"
            placeholder="请输入文章摘要（选填，不填将自动提取正文前200字）"
            maxlength="500"
            show-word-limit
          />
        </div>

        <!-- Markdown 编辑器 -->
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

        <!-- 高级设置 -->
        <div class="advanced-settings">
          <el-divider>高级设置</el-divider>
          <div class="settings-row">
            <el-checkbox v-model="form.isTop" :true-value="1" :false-value="0">置顶文章</el-checkbox>
            <el-checkbox v-model="form.isRecommend" :true-value="1" :false-value="0">推荐文章</el-checkbox>
            <el-radio-group v-model="form.status" size="small">
              <el-radio-button :label="ArticleStatus.DRAFT">草稿</el-radio-button>
              <el-radio-button :label="ArticleStatus.PUBLISHED">发布</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Plus } from '@element-plus/icons-vue';
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

// 标签ID数组（单独处理）
const formTagIds = ref<number[]>([]);

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
      formTagIds.value = article.tags.map((tag) => tag.id);
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

// 封面上传前校验
const beforeCoverUpload = (file: File) => {
  const isImage = file.type.startsWith('image/');
  const isLt12M = file.size / 1024 / 1024 < 12;

  if (!isImage) {
    ElMessage.error('只能上传图片文件!');
    return false;
  }
  if (!isLt12M) {
    ElMessage.error('图片大小不能超过 12MB!');
    return false;
  }
  return true;
};

// 编辑器内图片上传（并行上传优化版）
const onUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
  try {
    // 先校验所有文件大小
    const validFiles = files.filter(file => {
      if (file.size > 12 * 1024 * 1024) {
        ElMessage.error(`${file.name} 大小超过12MB限制`);
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

// 构建提交数据
const buildSubmitData = (): Partial<Article> => {
  // 如果没有填写摘要，从内容中提取
  let summary = form.summary?.trim();
  if (!summary && form.content) {
    // 移除Markdown标记，提取纯文本
    summary = form.content
      .replace(/[#*`\[\]!()]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
  }

  return {
    ...form,
    summary,
    tagIds: formTagIds.value,
  };
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
  padding: 24px 0;
}

.edit-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

// 页面头部
.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .back-link {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 14px;
    transition: color 0.3s;

    &:hover {
      color: var(--primary);
    }
  }

  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

// 编辑表单
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.form-item {
  &.editor-wrapper {
    :deep(.md-editor) {
      height: 600px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);

      &[data-theme='dark'] {
        background: var(--bg-secondary);
      }
    }
  }
}

.title-input {
  :deep(.el-input__inner) {
    font-size: 20px;
    font-weight: 500;
  }
}

.full-width {
  width: 100%;
}

// 封面上传
.cover-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .cover-label {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .cover-uploader {
    :deep(.el-upload) {
      border: 2px dashed var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s;

      &:hover {
        border-color: var(--primary);
      }
    }
  }

  .cover-preview {
    width: 400px;
    height: 210px;
    object-fit: cover;
    display: block;
  }

  .cover-placeholder {
    width: 400px;
    height: 210px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    gap: 8px;

    .el-icon {
      font-size: 32px;
    }

    span {
      font-size: 14px;
    }

    .cover-tip {
      font-size: 12px;
      color: var(--text-tertiary);
    }
  }

  .remove-cover {
    width: fit-content;
  }
}

// 高级设置
.advanced-settings {
  margin-top: 16px;

  .settings-row {
    display: flex;
    align-items: center;
    gap: 24px;
  }
}

// 响应式
@media (max-width: 768px) {
  .edit-container {
    padding: 0 16px;
  }

  .edit-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;

    .header-left {
      flex-direction: column;
      gap: 8px;
    }
  }

  .form-row {
    flex-direction: column;
  }

  .cover-upload {
    .cover-preview,
    .cover-placeholder {
      width: 100%;
      height: 180px;
    }
  }

  .advanced-settings {
    .settings-row {
      flex-wrap: wrap;
      gap: 12px;
    }
  }
}
</style>
