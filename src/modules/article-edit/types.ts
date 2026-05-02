import type { Category, Tag } from '@/types';
import { ArticleCommentPolicy, ArticleStatus, ArticleVisibility } from '@/types';

export type DraftSaveSource = 'manual' | 'auto' | 'leave';
export type AutoSaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface ArticleEditorForm {
  title: string;
  content: string;
  summary: string;
  coverImage: string;
  categoryId?: number;
  status: ArticleStatus;
  isTop: number;
  visibility: ArticleVisibility;
  commentPolicy: ArticleCommentPolicy;
}

export interface ArticleEditorOptions {
  categories: Category[];
  tags: Tag[];
}
