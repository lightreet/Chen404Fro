import { get, post } from './request';
import type {
  AiArticleAssistRequest,
  AiArticleAssistResponse,
  AiChatRequest,
  AiChatResponse,
  AiChatSessionDetailResponse,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export type AiChatStreamEvent =
  | { event: 'session'; data: { sessionId: string; scene: 'helper' | 'companion' } }
  | { event: 'message_start'; data: { messageId: string; scene: 'helper' | 'companion'; mood: string } }
  | { event: 'delta'; data: { messageId: string; text: string } }
  | { event: 'citation'; data: { articleId: number | string; articleTitle: string; url: string; snippet?: string } }
  | { event: 'suggestions'; data: { messageId: string; items: string[] } }
  | { event: 'done'; data: { messageId: string; finishReason: string; traceId: string } }
  | { event: 'error'; data: { message: string } };

export function generateArticleAiAssist(data: AiArticleAssistRequest): Promise<AiArticleAssistResponse> {
  return post('/articles/ai/assist', data);
}

export function sendMaidChat(data: AiChatRequest): Promise<AiChatResponse> {
  return post('/ai/chat', data);
}

export function getMaidChatSessionDetail(sessionId: string, visitorId?: string): Promise<AiChatSessionDetailResponse> {
  return get(`/ai/chat/sessions/${encodeURIComponent(sessionId)}`, visitorId ? { visitorId } : undefined);
}

export async function streamMaidChat(
  data: AiChatRequest,
  handlers: {
    onEvent: (event: AiChatStreamEvent) => void;
    signal?: AbortSignal;
  },
): Promise<void> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    signal: handlers.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error('流式聊天请求失败');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let currentEvent = '';
  let currentData = '';

  const flushBlock = () => {
    if (!currentEvent || !currentData) {
      currentEvent = '';
      currentData = '';
      return;
    }
    handlers.onEvent({
      event: currentEvent as AiChatStreamEvent['event'],
      data: JSON.parse(currentData),
    } as AiChatStreamEvent);
    currentEvent = '';
    currentData = '';
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      flushBlock();
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) {
        flushBlock();
        continue;
      }
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
        continue;
      }
      if (line.startsWith('data:')) {
        currentData += line.slice(5).trim();
      }
    }
  }
}
