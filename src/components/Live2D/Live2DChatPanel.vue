<template>
  <section class="chat-panel">
    <header class="chat-panel__header">
      <div class="chat-panel__heading">
        <p class="chat-panel__eyebrow">Sakura Notes</p>
        <div class="chat-panel__title-row">
          <h3 class="chat-panel__title">Lyra</h3>
          <span class="chat-panel__status">online</span>
        </div>
      </div>

      <button
        class="chat-panel__close"
        type="button"
        aria-label="关闭聊天面板"
        @click="$emit('close')"
      >
        ×
      </button>
    </header>

    <div ref="messageListRef" class="chat-panel__messages">
      <article
        v-for="message in messages"
        :key="message.id"
        class="chat-message"
        :class="message.role === 'user' ? 'chat-message--user' : 'chat-message--assistant'"
      >
        <p class="chat-message__body">{{ message.content }}</p>

        <div v-if="message.citations?.length" class="chat-message__citations">
          <a
            v-for="citation in message.citations"
            :key="`${message.id}-${citation.articleId}`"
            class="citation-card"
            :href="citation.url"
          >
            <strong>{{ citation.articleTitle }}</strong>
            <span v-if="citation.snippet">{{ citation.snippet }}</span>
          </a>
        </div>

        <div v-if="message.relatedArticles?.length" class="chat-message__related">
          <p class="chat-message__related-label">顺手给你挑了几篇：</p>
          <a
            v-for="article in message.relatedArticles"
            :key="`${message.id}-${article.articleId}`"
            class="related-article-card"
            :href="article.url"
          >
            <strong>{{ article.articleTitle }}</strong>
            <span>打开文章看看</span>
          </a>
        </div>
      </article>

      <div v-if="isLoading" class="chat-panel__thinking">
        <span class="chat-panel__thinking-dot" aria-hidden="true"></span>
        <span>Lyra 正在翻书页呢……</span>
      </div>
    </div>

    <div v-if="suggestions.length" class="chat-panel__suggestions">
      <button
        v-for="item in visibleSuggestions"
        :key="item"
        type="button"
        class="suggestion-pill"
        :disabled="isLoading"
        @click="$emit('quick-action', item)"
      >
        {{ item }}
      </button>
    </div>

    <div class="chat-panel__composer">
      <textarea
        v-model="draft"
        class="chat-panel__input"
        rows="2"
        maxlength="300"
        placeholder="想聊聊，还是让我帮你看看这页内容呀？"
        @keydown.enter.exact.prevent="handleSubmit"
      />

      <div class="chat-panel__actions">
        <span class="chat-panel__hint">Enter 发送，Shift + Enter 换行</span>

        <div class="chat-panel__action-buttons">
          <button
            v-if="isLoading"
            class="chat-panel__stop"
            type="button"
            @click="$emit('stop')"
          >
            停止
          </button>

          <button
            class="chat-panel__send"
            type="button"
            :disabled="isLoading || !draft.trim()"
            @click="handleSubmit"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { AiChatCitation, AiChatRelatedArticle } from '@/types';

export interface Live2DChatPanelMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: AiChatCitation[];
  relatedArticles?: AiChatRelatedArticle[];
}

const props = defineProps<{
  messages: Live2DChatPanelMessage[];
  suggestions: string[];
  isLoading: boolean;
}>();

const emit = defineEmits<{
  close: [];
  send: [content: string];
  'quick-action': [content: string];
  stop: [];
}>();

const draft = ref('');
const messageListRef = ref<HTMLDivElement | null>(null);
const visibleSuggestions = computed(() => props.suggestions.slice(0, 2));

const scrollToBottom = async () => {
  await nextTick();
  if (!messageListRef.value) {
    return;
  }
  messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
};

const handleSubmit = () => {
  const content = draft.value.trim();
  if (!content) {
    return;
  }
  emit('send', content);
  draft.value = '';
};

watch(
  () => [props.messages.length, props.isLoading],
  () => {
    void scrollToBottom();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.chat-panel {
  --maid-panel-bg-top: rgba(255, 253, 254, 0.95);
  --maid-panel-bg-bottom: rgba(250, 248, 251, 0.92);
  --maid-panel-glow-pink: rgba(255, 220, 232, 0.38);
  --maid-panel-glow-blue: rgba(204, 221, 248, 0.18);
  --maid-panel-line: rgba(214, 191, 203, 0.32);
  --maid-ink-main: #5a4d57;
  --maid-ink-soft: #8c7d88;
  --maid-accent: #ee8faa;
  --maid-accent-strong: #e77b9b;
  --maid-accent-soft: rgba(245, 222, 230, 0.72);
  --maid-assistant-bg: rgba(255, 253, 254, 0.9);
  --maid-user-bg-start: #f2a7bd;
  --maid-user-bg-end: #ea89a7;

  position: relative;
  width: 336px;
  max-height: min(76vh, 680px);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 15px;
  border-radius: 26px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, var(--maid-panel-glow-pink), transparent 34%),
    radial-gradient(circle at top right, var(--maid-panel-glow-blue), transparent 30%),
    linear-gradient(180deg, var(--maid-panel-bg-top), var(--maid-panel-bg-bottom));
  border: 1px solid rgba(214, 191, 203, 0.24);
  box-shadow:
    0 28px 58px rgba(79, 54, 70, 0.14),
    0 8px 24px rgba(176, 157, 169, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
}

.chat-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.42), transparent 42%),
    radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.48), transparent 12%);
}

.chat-panel__header {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
}

.chat-panel__header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(226, 186, 202, 0.42), rgba(201, 214, 238, 0.14), transparent);
}

.chat-panel__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.chat-panel__eyebrow {
  margin: 0;
  color: rgba(154, 131, 142, 0.88);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.chat-panel__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-panel__title {
  margin: 0;
  color: var(--maid-ink-main);
  font-family:
    'Patrick Hand',
    'ZCOOL KuaiLe',
    'Segoe Print',
    cursive;
  font-size: 1.45rem;
  line-height: 1;
  font-weight: 400;
  letter-spacing: 0.03em;
}

.chat-panel__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(248, 242, 246, 0.92);
  color: #bf7a93;
  font-size: 10px;
  line-height: 1;
  text-transform: lowercase;
}

.chat-panel__status::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ee8faa, #f6b3c7);
  box-shadow: 0 0 0 4px rgba(238, 143, 170, 0.1);
}

.chat-panel__close {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(214, 191, 203, 0.24);
  border-radius: 999px;
  background: rgba(255, 250, 252, 0.88);
  color: #9b7f8d;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    background 0.22s ease,
    color 0.22s ease,
    box-shadow 0.22s ease;
}

.chat-panel__close:hover {
  transform: translateY(-1px);
  color: #fff;
  background: linear-gradient(135deg, #e6a0b6, #edb8c8);
  box-shadow: 0 8px 20px rgba(198, 154, 171, 0.18);
}

.chat-panel__messages {
  min-height: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 9px;
  overflow-y: auto;
  padding-right: 4px;
}

.chat-panel__messages::-webkit-scrollbar {
  width: 6px;
}

.chat-panel__messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-panel__messages::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(207, 186, 196, 0.54);
}

.chat-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-message--user {
  align-items: flex-end;
}

.chat-message--assistant {
  align-items: flex-start;
}

.chat-message__body {
  position: relative;
  margin: 0;
  max-width: 88%;
  padding: 10px 12px;
  border-radius: 16px;
  font-size: 12.5px;
  line-height: 1.62;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-message--assistant .chat-message__body {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(251, 249, 251, 0.96));
  color: var(--maid-ink-main);
  border: 1px solid rgba(219, 203, 211, 0.5);
  border-bottom-left-radius: 8px;
  box-shadow: 0 10px 22px rgba(149, 111, 128, 0.05);
}

.chat-message--assistant .chat-message__body::before {
  content: '';
  position: absolute;
  inset: auto auto 8px -6px;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(251, 249, 251, 0.96));
  border-left: 1px solid rgba(219, 203, 211, 0.5);
  border-bottom: 1px solid rgba(219, 203, 211, 0.5);
  transform: rotate(45deg);
}

.chat-message--user .chat-message__body {
  background: linear-gradient(135deg, var(--maid-user-bg-start), var(--maid-user-bg-end));
  color: #fff;
  border-bottom-right-radius: 8px;
  box-shadow: 0 10px 20px rgba(214, 145, 168, 0.2);
}

.chat-message__citations {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-message__related {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-message__related-label {
  margin: 0;
  padding-left: 2px;
  color: #8b7984;
  font-size: 10px;
  letter-spacing: 0.04em;
}

.citation-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 9px 11px;
  border-radius: 14px;
  background: rgba(253, 251, 252, 0.92);
  border: 1px solid rgba(219, 203, 211, 0.42);
  color: #82737d;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.citation-card:hover {
  transform: translateY(-1px);
  border-color: rgba(200, 177, 188, 0.5);
  box-shadow: 0 10px 18px rgba(165, 123, 141, 0.08);
}

.citation-card strong {
  color: #66535d;
  font-size: 11px;
}

.citation-card span {
  font-size: 11px;
  line-height: 1.5;
}

.related-article-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 11px;
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgba(255, 248, 251, 0.96), rgba(247, 249, 255, 0.92));
  border: 1px solid rgba(221, 203, 214, 0.52);
  color: #75646f;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.related-article-card:hover {
  transform: translateY(-1px);
  border-color: rgba(205, 176, 191, 0.7);
  box-shadow: 0 10px 18px rgba(165, 123, 141, 0.1);
}

.related-article-card strong {
  color: #5d4a56;
  font-size: 11px;
  line-height: 1.5;
}

.related-article-card span {
  flex-shrink: 0;
  color: #a1778a;
  font-size: 10px;
}

.chat-panel__thinking {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 2px;
  color: #8d7d87;
  font-size: 11px;
}

.chat-panel__thinking-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #e6a0b6, #f2c4d2);
  box-shadow: 0 0 0 5px rgba(230, 160, 182, 0.08);
  animation: thinking-pulse 1.4s ease-in-out infinite;
}

.chat-panel__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.suggestion-pill {
  padding: 6px 10px;
  border: 1px solid rgba(214, 191, 203, 0.34);
  border-radius: 999px;
  background: rgba(255, 252, 253, 0.9);
  color: #857680;
  font-size: 11px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.suggestion-pill:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(201, 180, 191, 0.5);
  background: rgba(249, 245, 247, 0.98);
  color: #695c65;
}

.suggestion-pill:disabled {
  opacity: 0.56;
  cursor: not-allowed;
}

.chat-panel__composer {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding-top: 8px;
  border-top: 1px solid rgba(214, 191, 203, 0.24);
}

.chat-panel__input {
  width: 100%;
  resize: none;
  border: 1px solid rgba(214, 191, 203, 0.34);
  min-height: 76px;
  border-radius: 16px;
  padding: 10px 12px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(252, 250, 251, 0.94));
  color: var(--maid-ink-main);
  font: inherit;
  font-size: 12px;
  line-height: 1.6;
  outline: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  transition:
    border-color 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease;
}

.chat-panel__input::placeholder {
  color: #a08f99;
  font-size: 11.5px;
}

.chat-panel__input:focus {
  border-color: rgba(198, 177, 188, 0.52);
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
    0 0 0 4px rgba(214, 191, 203, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

.chat-panel__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.chat-panel__action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-panel__hint {
  color: #9e8e98;
  font-size: 10px;
}

.chat-panel__send,
.chat-panel__stop {
  padding: 7px 14px;
  border: none;
  border-radius: 999px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.chat-panel__send {
  background: linear-gradient(135deg, #e8a1b7, #ee8faa);
  color: #fff;
  box-shadow: 0 10px 18px rgba(210, 155, 175, 0.2);
}

.chat-panel__send:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgba(210, 155, 175, 0.24);
}

.chat-panel__send:disabled {
  opacity: 0.56;
  cursor: not-allowed;
}

.chat-panel__stop {
  background: rgba(250, 244, 246, 0.98);
  color: #b6788d;
  border: 1px solid rgba(214, 191, 203, 0.3);
}

.chat-panel__stop:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(198, 154, 171, 0.12);
}

@keyframes thinking-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.84;
  }
  50% {
    transform: scale(1.18);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .chat-panel {
    width: min(90vw, 340px);
    max-height: min(72vh, 620px);
    padding: 14px;
    border-radius: 22px;
  }

  .chat-panel__actions {
    align-items: flex-end;
    flex-direction: column;
  }

  .chat-panel__hint {
    width: 100%;
  }
}
</style>
