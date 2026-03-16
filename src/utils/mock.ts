// 模拟数据

import type { Article, Category, Tag } from '@/types';

// 模拟分类
export const mockCategories: Category[] = [
  { id: 1, name: '野生技术协会', slug: 'tech', description: '技术相关文章', sortOrder: 1 },
  { id: 2, name: '碎碎念', slug: 'thoughts', description: '日常随笔', sortOrder: 2 },
  { id: 3, name: '前端开发', slug: 'frontend', description: '前端技术', sortOrder: 3 },
  { id: 4, name: '后端开发', slug: 'backend', description: '后端技术', sortOrder: 4 },
];

// 模拟标签
export const mockTags: Tag[] = [
  { id: 1, name: 'Vue', slug: 'vue', color: '#4FC08D' },
  { id: 2, name: 'TypeScript', slug: 'typescript', color: '#3178C6' },
  { id: 3, name: 'Java', slug: 'java', color: '#007396' },
  { id: 4, name: 'SpringBoot', slug: 'springboot', color: '#6DB33F' },
  { id: 5, name: 'CSS', slug: 'css', color: '#264DE4' },
  { id: 6, name: '性能优化', slug: 'performance', color: '#FF6B6B' },
];

// 模拟作者
const mockAuthor = {
  id: 1,
  username: 'chen404',
  nickname: 'Chen',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen404',
};

// 模拟文章内容
const mockArticleContents = [
  {
    title: '基于 AIDA64 和现代 web 技术的电脑性能监控页',
    summary: '最近给电脑加了一块副屏，打算玩游戏的时候用来显示一下硬件状态。研究了一下发现大部分副屏监控的解决方案就是...',
    coverImage: 'https://images.unsplash.com/photo-1587202372634-32705e3e568e?w=800&h=450&fit=crop',
    categoryId: 1,
    tags: [1, 2],
    viewCount: 22183,
    commentCount: 24,
    publishTime: '2023-10-06',
  },
  {
    title: '基于 SCSS mixin 的 flex gap polyfill',
    summary: '一直以来，习惯在 flex 布局中使用 gap 这个属性设置间距，一直以来也都是在最新的 Chrome 上调试，所以从来没有想在...',
    coverImage: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=450&fit=crop',
    categoryId: 2,
    tags: [5, 1],
    viewCount: 47210,
    commentCount: 51,
    publishTime: '2021-07-30',
  },
  {
    title: 'Vue 3 Composition API 最佳实践',
    summary: 'Vue 3 带来了全新的 Composition API，它让我们能够更好地组织代码逻辑。本文将分享在实际项目中总结的最佳实践...',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
    categoryId: 3,
    tags: [1, 2],
    viewCount: 15320,
    commentCount: 36,
    publishTime: '2024-01-15',
  },
  {
    title: 'Spring Boot 3.0 新特性详解',
    summary: 'Spring Boot 3.0 正式发布，带来了众多新特性和改进。本文将详细介绍 GraalVM 原生镜像支持、 Jakarta EE 9 迁移等重要更新...',
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=450&fit=crop',
    categoryId: 4,
    tags: [3, 4],
    viewCount: 8950,
    commentCount: 18,
    publishTime: '2024-02-20',
  },
  {
    title: '前端性能优化实战指南',
    summary: '性能优化是前端开发中的重要课题。本文从加载性能、运行时性能、渲染性能三个维度，分享实用的优化技巧...',
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop',
    categoryId: 3,
    tags: [1, 6],
    viewCount: 32560,
    commentCount: 42,
    publishTime: '2024-03-01',
  },
  {
    title: 'TypeScript 高级类型体操',
    summary: '类型体操是 TypeScript 的高级玩法，掌握这些技巧可以让你的代码更加类型安全。本文将介绍条件类型、映射类型等高级用法...',
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=450&fit=crop',
    categoryId: 3,
    tags: [2],
    viewCount: 12800,
    commentCount: 28,
    publishTime: '2024-03-10',
  },
];

// 生成模拟文章列表
export function generateMockArticles(page = 1, pageSize = 10): Article[] {
  const articles: Article[] = [];
  const start = (page - 1) * pageSize;

  for (let i = 0; i < pageSize; i++) {
    const template = mockArticleContents[i % mockArticleContents.length];
    const id = start + i + 1;

    articles.push({
      id,
      ...template,
      content: '',
      authorId: 1,
      status: 1,
      isTop: i === 0 ? 1 : 0,
      isRecommend: i < 2 ? 1 : 0,
      createTime: template.publishTime,
      updateTime: template.publishTime,
      author: mockAuthor,
      category: mockCategories.find(c => c.id === template.categoryId),
      tags: mockTags.filter(t => template.tags.includes(t.id)),
    });
  }

  return articles;
}

// 获取文章总数
export function getMockTotal(): number {
  return 100;
}
