import { ArticleCommentPolicy, ArticleVisibility } from '@/types';

export const TITLE_LEN_MIN = 5;
export const TITLE_LEN_MAX = 100;

export const AUTO_SAVE_DEBOUNCE_MS = 5000;
export const AUTO_SAVE_INTERVAL_MS = 30000;
export const DRAFT_COMPARE_DEBOUNCE_MS = 250;

export const visibilityOptions = [
  { label: '公开', value: ArticleVisibility.PUBLIC },
  { label: '登录可见', value: ArticleVisibility.LOGIN },
  { label: '知友可见', value: ArticleVisibility.FRIEND },
  { label: '私密', value: ArticleVisibility.PRIVATE },
];

export const commentPolicyOptions = [
  { label: '关闭评论', value: ArticleCommentPolicy.CLOSED },
  { label: '登录可评论', value: ArticleCommentPolicy.REGISTERED },
  { label: '知友可评论', value: ArticleCommentPolicy.FRIEND },
  { label: '游客可评论', value: ArticleCommentPolicy.PUBLIC },
];
