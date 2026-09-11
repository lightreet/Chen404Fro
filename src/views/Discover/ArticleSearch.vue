<template>
  <DefaultLayout mobile-title="搜索文章">
    <div class="article-search">
      <form class="article-search__form" role="search" @submit.prevent="submit">
        <UiInput v-model="draft" placeholder="搜索文章标题" clearable aria-label="搜索文章标题" />
        <UiButton native-type="submit" variant="primary">搜索</UiButton>
      </form>
      <div v-if="!keyword" class="article-search__intro">
        <UiIcon name="search" :size="36" /><h1>寻找感兴趣的内容</h1><p>输入文章标题中的关键词，也可以按分类浏览。</p>
        <AppMenuLink to="/category" icon="grid" label="浏览全部分类" />
      </div>
      <template v-else>
        <p class="article-search__count">「{{ keyword }}」<span v-if="!loading"> · {{ total }} 篇文章</span></p>
        <UiLoadingState :loading="loading && !articles.length" message="正在查找文章…">
          <div class="article-search__list"><ArticleCard v-for="article in articles" :key="article.id" :article="article" /></div>
          <UiEmpty v-if="error && !articles.length" title="搜索暂时不可用" :description="error" icon="warning"><template #action><UiButton @click="load(1)">重新搜索</UiButton></template></UiEmpty>
          <UiEmpty v-else-if="!loading && !articles.length" title="没有找到相关文章" description="试试更短的关键词，或浏览文章分类。" icon="search" />
        </UiLoadingState>
        <div class="article-search__more" v-if="articles.length && (articles.length < total || error)">
          <p v-if="error" role="alert">{{ error }}</p>
          <UiButton :loading="loading" @click="load(page + 1)">{{ error ? '重新加载' : '加载更多' }}</UiButton>
        </div>
      </template>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import ArticleCard from '@/components/ArticleCard/ArticleCard.vue';
import AppMenuLink from '@/components/app/AppMenuLink/AppMenuLink.vue';
import { UiButton, UiEmpty, UiIcon, UiInput, UiLoadingState } from '@/components/ui';
import { getArticles } from '@/api/article';
import type { ArticleListItem } from '@/types';
const route = useRoute();
const router = useRouter();
const draft = ref('');
const keyword = ref('');
const articles = ref<ArticleListItem[]>([]);
const page = ref(0);
const total = ref(0);
const loading = ref(false);
const error = ref('');
let generation = 0;
async function load(nextPage: number) {
  if (!keyword.value || (loading.value && nextPage !== 1)) return;
  const request = ++generation;
  loading.value = true;
  error.value = '';
  try {
    const result = await getArticles({ page: nextPage, size: 12, status: 1, keyword: keyword.value });
    if (request !== generation) return;
    articles.value = nextPage === 1 ? result.list : [...articles.value, ...result.list];
    total.value = result.total;
    page.value = nextPage;
  } catch {
    if (request === generation) error.value = '文章没有加载成功，请检查网络后重试。';
  } finally { if (request === generation) loading.value = false; }
}
function submit() {
  const q = draft.value.trim();
  if (q === keyword.value && q) void load(1);
  else void router.replace({ query: q ? { q } : {} });
}
watch(() => route.query.q, value => {
  generation++;
  keyword.value = typeof value === 'string' ? value.trim() : '';
  draft.value = keyword.value;
  articles.value = [];
  page.value = 0;
  total.value = 0;
  loading.value = false;
  error.value = '';
  if (keyword.value) void load(1);
}, { immediate: true });
onUnmounted(() => { generation++; });
</script>

<style scoped lang="scss">
.article-search { max-width: 800px; margin: auto; padding-top: 12px; }
.article-search__form { display: flex; gap: 10px; }
.article-search__form .ui-input { min-width: 0; flex: 1; }
.article-search__count { font-size: 13px; color: var(--color-text-secondary); margin: 20px 0 12px; overflow-wrap: anywhere; }
.article-search__list { display: grid; gap: 12px; }
.article-search__intro { padding-top: 56px; text-align: center; }
.article-search__intro > .ui-icon { color: var(--color-text-secondary); }
h1 { font-size: 20px; margin: 16px 0 8px; }
.article-search__intro p { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 32px; }
.article-search__more { text-align: center; padding-block: 24px; }
.article-search__more p { color: var(--color-text-secondary); font-size: 13px; margin-bottom: 12px; }
</style>
