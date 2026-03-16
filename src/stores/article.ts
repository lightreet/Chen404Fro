import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Article, Category, Tag } from '@/types';

export const useArticleStore = defineStore('article', () => {
  // 文章列表
  const articleList = ref<Article[]>([]);

  // 当前文章
  const currentArticle = ref<Article | null>(null);

  // 分类列表
  const categoryList = ref<Category[]>([]);

  // 标签列表
  const tagList = ref<Tag[]>([]);

  // 加载状态
  const loading = ref(false);

  // 设置文章列表
  const setArticleList = (list: Article[]) => {
    articleList.value = list;
  };

  // 添加文章到列表
  const appendArticles = (articles: Article[]) => {
    articleList.value.push(...articles);
  };

  // 设置当前文章
  const setCurrentArticle = (article: Article | null) => {
    currentArticle.value = article;
  };

  // 设置分类列表
  const setCategoryList = (list: Category[]) => {
    categoryList.value = list;
  };

  // 设置标签列表
  const setTagList = (list: Tag[]) => {
    tagList.value = list;
  };

  return {
    articleList,
    currentArticle,
    categoryList,
    tagList,
    loading,
    setArticleList,
    appendArticles,
    setCurrentArticle,
    setCategoryList,
    setTagList,
  };
});
