<template>
  <DefaultLayout>
    <div class="category-detail-page">
      <div class="page-header" v-if="category">
        <h1 class="page-title">{{ category.name }}</h1>
        <p class="page-desc">{{ category.description || '该分类下的文章' }}</p>
      </div>

      <div v-if="loading && !articleList.length" class="loading-state">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中…</p>
      </div>

      <template v-else>
        <div class="article-list">
          <ArticleCard
            v-for="(article, index) in articleList"
            :key="article.id"
            :article="article"
            :index="index"
          />
        </div>

        <div v-if="!loading && articleList.length === 0" class="empty-state">
          <p>该分类下暂无文章</p>
        </div>

        <div v-if="hasMore" class="load-more">
          <el-button
            class="jp-btn-primary !border-0"
            :loading="loading"
            @click="loadMore"
          >
            {{ loading ? '加载中...' : '加载更多' }}
          </el-button>
        </div>

        <div v-else-if="articleList.length > 0" class="no-more">
          <el-divider>
            <span class="no-more-text">已经到底啦 ~</span>
          </el-divider>
        </div>
      </template>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import ArticleCard from '@/components/ArticleCard/ArticleCard.vue';
import type { Article, Category } from '@/types';
import { getArticles, getCategoryById } from '@/api/article';

const route = useRoute();
const categoryId = computed(() => route.params.id as string);

const category = ref<Category | null>(null);
const articleList = ref<Article[]>([]);
const currentPage = ref(1);
const total = ref(0);
const loading = ref(false);
const pageSize = 6;

const hasMore = computed(
  () => articleList.value.length < total.value
);

const loadCategory = async () => {
  if (!categoryId.value) return;
  try {
    category.value = await getCategoryById(categoryId.value);
  } catch {
    category.value = null;
  }
};

const loadArticles = async (page: number = 1) => {
  if (!categoryId.value) return;
  loading.value = true;
  try {
    const res = await getArticles({
      page,
      size: pageSize,
      status: 1,
      categoryId: Number(categoryId.value),
    });
    const list = res?.list ?? [];
    const totalCount = res?.total ?? 0;
    if (page === 1) {
      articleList.value = list;
    } else {
      articleList.value.push(...list);
    }
    total.value = totalCount;
  } catch (err) {
    console.error('加载文章失败', err);
    ElMessage.error('加载文章失败，请稍后重试');
    if (currentPage.value === 1) articleList.value = [];
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  if (loading.value || !hasMore.value) return;
  currentPage.value++;
  loadArticles(currentPage.value);
};

onMounted(() => {
  loadCategory();
  loadArticles();
});

watch(categoryId, () => {
  currentPage.value = 1;
  articleList.value = [];
  total.value = 0;
  loadCategory();
  loadArticles();
});
</script>

<style scoped lang="scss">
.category-detail-page {
  padding-top: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.page-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.loading-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-secondary);

  .loading-icon {
    font-size: 32px;
    margin-bottom: 12px;
    animation: spin 1s linear infinite;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.article-list {
  margin-bottom: 24px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-tertiary);
  font-size: 15px;
}

.load-more {
  text-align: center;
  padding: 24px 0;
}

.no-more {
  padding: 24px 0;

  .no-more-text {
    color: var(--text-tertiary);
    font-size: 14px;
  }
}
</style>
