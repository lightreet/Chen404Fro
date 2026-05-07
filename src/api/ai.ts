import { post } from './request';
import type { AiArticleAssistRequest, AiArticleAssistResponse } from '@/types';

export function generateArticleAiAssist(data: AiArticleAssistRequest): Promise<AiArticleAssistResponse> {
  return post('/articles/ai/assist', data);
}
