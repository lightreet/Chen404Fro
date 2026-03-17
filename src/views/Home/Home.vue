<template>
  <DefaultLayout>
    <div class="home-page">
      <!-- Discovery 标题 -->
      <div class="section-header">
        <el-icon class="section-icon"><Compass /></el-icon>
        <h2 class="section-title">Discovery</h2>
      </div>

      <!-- 文章列表 -->
      <div class="article-list">
        <ArticleCard
          v-for="(article, index) in articleList"
          :key="article.id"
          :article="article"
          :index="index"
        />
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-if="!loading && articleList.length === 0">
        <p>暂无文章，快去写一篇吧 ~</p>
      </div>

      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMore">
        <el-button
          type="primary"
          :loading="loading"
          @click="loadMore"
          class="load-more-btn"
        >
          {{ loading ? '加载中...' : '加载更多' }}
        </el-button>
      </div>

      <!-- 没有更多了 -->
      <div class="no-more" v-else-if="articleList.length > 0">
        <el-divider>
          <span class="no-more-text">已经到底啦 ~</span>
        </el-divider>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Compass } from '@element-plus/icons-vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import ArticleCard from '@/components/ArticleCard/ArticleCard.vue';
import type { Article } from '@/types';
import { getArticles } from '@/api/article';

const pageSize = 6;

// 文章列表
const articleList = ref<Article[]>([]);
const currentPage = ref(1);
const total = ref(0);
const loading = ref(false);
const hasMore = ref(true);

// 加载文章列表（仅已发布文章，对接后端 GET /api/articles）
const loadArticles = async (page: number = 1) => {
  loading.value = true;
  try {
    const res = await getArticles({
      page,
      size: pageSize,
      status: 1, // 仅已发布
    });
    const list = res?.list ?? [];
    const totalCount = res?.total ?? 0;

    if (page === 1) {
      articleList.value = list;
    } else {
      articleList.value.push(...list);
    }
    total.value = totalCount;
    hasMore.value = articleList.value.length < totalCount;
  } catch (err) {
    console.error('加载文章列表失败', err);
    ElMessage.error('加载文章列表失败，请稍后重试');
    if (currentPage.value === 1) {
      hasMore.value = false;
    }
  } finally {
    loading.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (loading.value || !hasMore.value) return;
  currentPage.value++;
  loadArticles(currentPage.value);
};

onMounted(() => {
  loadArticles();
});
</script>

<style scoped lang="scss">
.home-page {
  padding-top: 24px;
}

// 区块标题
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 0 4px;
}

.section-icon {
  font-size: 24px;
  color: var(--primary);
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 40px;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--primary-light));
    border-radius: 2px;
  }
}

// 文章列表
.article-list {
  margin-bottom: 32px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-tertiary);
  font-size: 15px;
}

// 加载更多
.load-more {
  text-align: center;
  padding: 24px 0;
}

.load-more-btn {
  min-width: 160px;
  height: 44px;
  border-radius: 22px;
  font-size: 15px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border: none;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(251, 114, 153, 0.3);
  }
}

// 没有更多了
.no-more {
  padding: 24px 0;

  .no-more-text {
    color: var(--text-tertiary);
    font-size: 14px;
  }
}

// 响应式
@media (max-width: 768px) {
  .home-page {
    padding-top: 16px;
  }

  .section-header {
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 20px;
  }
}
</style>
