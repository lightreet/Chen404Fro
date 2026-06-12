<template>
  <DefaultLayout>
    <div class="tag-detail-page">
      <div class="page-header" v-if="tag">
        <div class="tag-chip" :style="tagChipStyle">
          {{ tag.name }}
        </div>
        <p class="page-desc">
          {{ (tag.articleCount ?? total) }} 篇相关文章
        </p>
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
          <p>该标签下暂无文章</p>
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
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { notify } from '@/lib/feedback';
import { Loading } from '@element-plus/icons-vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import ArticleCard from '@/components/ArticleCard/ArticleCard.vue';
import { useSiteConfig } from '@/composables/useSiteConfig';
import type { Article, Tag } from '@/types';
import { getArticlesByTag, getTagById } from '@/api/article';
import { resolveArticlePageSize } from '@/utils/siteConfig';

const route = useRoute();
const tagId = computed(() => route.params.id as string);

const tag = ref<Tag | null>(null);
const articleList = ref<Article[]>([]);
const currentPage = ref(1);
const total = ref(0);
const loading = ref(false);
const { siteConfig, loadSiteConfig } = useSiteConfig();
const pageSize = computed(() => resolveArticlePageSize(siteConfig.value, 6));

const hasMore = computed(() => articleList.value.length < total.value);
const tagChipStyle = computed(() => ({
  backgroundColor: `${tag.value?.color || '#409EFF'}20`,
  color: tag.value?.color || '#409EFF',
}));

const loadTag = async () => {
  if (!tagId.value) return;
  try {
    tag.value = await getTagById(tagId.value);
  } catch (err) {
    console.error('加载标签详情失败', err);
    tag.value = null;
    notify.error('标签不存在或已被删除');
  }
};

const loadArticles = async (page: number = 1) => {
  if (!tagId.value) return;
  loading.value = true;
  try {
    const res = await getArticlesByTag(tagId.value, {
      page,
      size: pageSize.value,
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
    console.error('加载标签文章失败', err);
    notify.error('加载标签文章失败，请稍后重试');
    if (page === 1) {
      articleList.value = [];
      total.value = 0;
    }
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  if (loading.value || !hasMore.value) return;
  currentPage.value += 1;
  void loadArticles(currentPage.value);
};

onMounted(() => {
  void loadSiteConfig().finally(() => {
    void loadTag();
    void loadArticles();
  });
});

watch(tagId, () => {
  currentPage.value = 1;
  articleList.value = [];
  total.value = 0;
  void loadTag();
  void loadArticles();
});
</script>

<style scoped lang="scss">
.tag-detail-page {
  padding-top: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.15rem;
  border-radius: 999px;
  font-size: 28px;
  font-weight: 600;
}

.page-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 12px 0 0;
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
