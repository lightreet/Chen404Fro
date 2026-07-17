<template>
  <div
    class="live2d-container"
    :class="{ dragging: isDragging, 'is-compact': compactView }"
    :style="containerStyle"
  >
    <Live2DChatPanel
      v-if="panelVisible"
      class="chat-panel-shell"
      :class="panelVerticalPlacementClass"
      :style="panelHorizontalStyle"
      :messages="chatMessages"
      :suggestions="panelSuggestions"
      :is-loading="isChatLoading"
      @close="panelVisible = false"
      @send="handleSendMessage"
      @quick-action="handleSendMessage"
      @stop="handleStopStreaming"
    />

    <Live2DMusicPanel
      v-if="musicPanelVisible"
      ref="musicPanelRef"
      class="music-panel-shell"
      :class="panelVerticalPlacementClass"
      :style="panelHorizontalStyle"
      @close="closeMusicPanel"
    />

    <div class="live2d-wrapper" :class="{ 'is-compact': compactView }">
      <div
        v-if="!compactView && visibleSpeechText"
        class="speech-bubble"
        :class="speechBubblePlacementClass"
        @click="clearSpeech"
      >
        {{ visibleSpeechText }}
      </div>

      <div
        v-if="!compactView"
        class="live2d-canvas"
        @pointerdown="startDrag"
        @mousemove="handlePointerMove"
        @mouseleave="resetPointerTilt"
      >
        <span class="magic-orb magic-orb--cyan" aria-hidden="true"></span>
        <span class="magic-orb magic-orb--gold" aria-hidden="true"></span>
        <span class="magic-orb magic-orb--violet" aria-hidden="true"></span>

        <div class="maid-stage">
          <div class="figure-shadow" aria-hidden="true"></div>
          <div class="figure-aura" aria-hidden="true"></div>

          <div class="maid-motion" :style="stageStyle">
            <img
              class="maid-figure"
              :src="maidImage"
              alt="蓝发魔女女仆看板娘"
              @click="showRandomSpeech"
            />
          </div>

          <span class="sparkle sparkle--1" aria-hidden="true"></span>
          <span class="sparkle sparkle--2" aria-hidden="true"></span>
          <span class="sparkle sparkle--3" aria-hidden="true"></span>
          <span class="sparkle sparkle--4" aria-hidden="true"></span>
        </div>
      </div>

      <div
        class="live2d-tools"
        :class="{ 'is-compact': compactView }"
        role="toolbar"
        aria-label="Chen404 看板娘工具栏"
      >
        <div
          v-if="compactView"
          class="assistant-identity"
          aria-label="拖动 Chen404 看板娘工具栏"
          title="拖动 Chen404 看板娘工具栏"
          @pointerdown="startDrag"
        >
          <span class="assistant-identity__mark" aria-hidden="true">404</span>
          <span
            v-if="musicPlayer.playing"
            class="assistant-identity__playing"
            aria-label="音乐正在播放"
          >
            <i></i>
            <i></i>
            <i></i>
          </span>
        </div>

        <UiTooltip content="和 Lyra 对话">
          <button class="tool-btn" type="button" aria-label="和 Lyra 对话" @click="handleChat">
            <UiIcon name="ChatDotRound" />
          </button>
        </UiTooltip>
        <UiTooltip :content="musicPlayer.playing ? '打开播放器，音乐正在播放' : '打开音乐播放器'">
          <button
            ref="musicTriggerRef"
            class="tool-btn"
            :class="{ 'is-active': musicPanelVisible || musicPlayer.playing }"
            type="button"
            aria-label="打开音乐播放器"
            aria-controls="live2d-music-panel"
            :aria-expanded="musicPanelVisible"
            :aria-pressed="musicPanelVisible"
            @click="handleMusic"
          >
            <UiIcon name="Headset" />
          </button>
        </UiTooltip>
        <UiTooltip content="切换看板娘装扮">
          <button class="tool-btn" type="button" aria-label="切换看板娘装扮" @click="handleChange">
            <UiIcon name="Refresh" />
          </button>
        </UiTooltip>
        <UiTooltip content="截取当前页面">
          <button class="tool-btn" type="button" aria-label="截取当前页面" @click="handleScreenshot">
            <UiIcon name="Camera" />
          </button>
        </UiTooltip>
        <UiTooltip v-if="!compactOnly" :content="compactView ? '展开看板娘' : '收起看板娘'">
          <button
            class="tool-btn display-toggle-btn"
            type="button"
            :aria-label="compactView ? '展开看板娘' : '收起看板娘'"
            :aria-expanded="!compactView"
            @click="handleDisplayToggle"
          >
            <UiIcon :name="compactView ? 'ArrowUp' : 'ArrowDown'" />
          </button>
        </UiTooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { UiIcon, UiTooltip } from '@/components/ui';
import { notify } from '@/lib/feedback';
import Live2DChatPanel from './Live2DChatPanel.vue';
import Live2DMusicPanel from './Live2DMusicPanel.vue';
import maidImage from '@/assets/live2d/maid-witch.webp';
import { getMaidChatSessionDetail, sendMaidChat, streamMaidChat, type AiChatStreamEvent } from '@/api/ai';
import { useMusicPlayerStore } from '@/stores/music-player';
import type {
  AiChatCitation,
  AiChatMessage,
  AiChatRelatedArticle,
  AiChatResponse,
  AiChatSessionDetailResponse,
} from '@/types';

const STORAGE_KEY = 'chen404.live2d.position';
const COMPACT_POSITION_STORAGE_KEY = 'chen404.live2d.position.compact.v1';
const DISPLAY_MODE_STORAGE_KEY = 'chen404.live2d.display-mode';
const CHAT_SESSION_STORAGE_KEY = 'chen404.live2d.chat.session';
const CHAT_VISITOR_STORAGE_KEY = 'chen404.live2d.chat.visitor';
const LIVE2D_SCALE = 2 / 3;
const VIEWPORT_PADDING = 52;
const BASE_WIDGET_WIDTH = 252;
const BASE_WIDGET_HEIGHT = 456;
const WIDGET_WIDTH = Math.round(BASE_WIDGET_WIDTH * LIVE2D_SCALE);
const WIDGET_HEIGHT = Math.round(BASE_WIDGET_HEIGHT * LIVE2D_SCALE);
const COMPACT_WIDGET_WIDTH = 278;
const COMPACT_WIDGET_HEIGHT = 52;
const PANEL_ESTIMATED_WIDTH = 420;
const PANEL_VIEWPORT_MARGIN = 12;
const PANEL_WIDGET_GAP = 14;
const BUBBLE_MAX_CHARS = 36;
const LONG_REPLY_BUBBLE_TEXT = '我整理好了，打开聊天框看详细内容吧。';
const STREAMING_BUBBLE_TEXT = '我在整理，详细内容会放进聊天框。';
const WELCOME_MESSAGE = '你好呀，我是 Lyra。想聊聊，还是让我帮你看看这页内容呀？';

interface ChatPanelMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: AiChatCitation[];
  relatedArticles?: AiChatRelatedArticle[];
  suggestions?: string[];
}

const props = withDefaults(defineProps<{
  compactOnly?: boolean;
}>(), {
  compactOnly: false,
});

const isCompact = ref(window.localStorage.getItem(DISPLAY_MODE_STORAGE_KEY) === 'compact');
const isDragging = ref(false);
const speechText = ref('');
const panelVisible = ref(false);
const musicPanelVisible = ref(false);
const isChatLoading = ref(false);
const tiltX = ref(0);
const tiltY = ref(0);
const positionX = ref(92);
const positionY = ref(120);
const viewportWidth = ref(window.innerWidth);
const viewportHeight = ref(window.innerHeight);
const suppressClick = ref(false);
const activeSessionId = ref('');
const visitorId = ref('');
const chatMessages = ref<ChatPanelMessage[]>([]);
const activeStreamMessageId = ref('');
const activeAbortController = ref<AbortController | null>(null);
const sessionRestoreLoaded = ref(false);
const musicPanelRef = ref<InstanceType<typeof Live2DMusicPanel> | null>(null);
const musicTriggerRef = ref<HTMLButtonElement | null>(null);
const route = useRoute();
const musicPlayer = useMusicPlayerStore();
const compactOnly = computed(() => props.compactOnly);
const compactView = computed(() => compactOnly.value || isCompact.value);
const currentWidgetWidth = computed(() => compactView.value ? COMPACT_WIDGET_WIDTH : WIDGET_WIDTH);
const currentWidgetHeight = computed(() => compactView.value ? COMPACT_WIDGET_HEIGHT : WIDGET_HEIGHT);

const speeches = [
  '欢迎来到 Chen404 的博客魔法屋。',
  '想找文章重点的话，可以直接来问我。',
  '这顶帽子里藏着一点灵感，也藏着一点点小魔法。',
  '如果页面没刷新出来，可以试试 Ctrl+F5 哦。',
  '今天也一起把灵感整理成作品吧。',
  '写累了就先休息一下，恢复魔力也很重要。',
  '等智能对话接好之后，我就能更认真地陪你看文章啦。',
];

const containerStyle = computed(() => ({
  left: `${positionX.value}px`,
  top: `${positionY.value}px`,
  '--live2d-scale': String(LIVE2D_SCALE),
  '--live2d-width': `${currentWidgetWidth.value}px`,
  '--live2d-height': `${currentWidgetHeight.value}px`,
  '--live2d-panel-space-above': `${Math.max(180, positionY.value - 24)}px`,
  '--live2d-panel-space-below': `${Math.max(
    180,
    viewportHeight.value - positionY.value - currentWidgetHeight.value - 24,
  )}px`,
  '--live2d-panel-space-to-widget-bottom': `${Math.max(
    180,
    positionY.value + currentWidgetHeight.value - 24,
  )}px`,
  '--live2d-panel-space-from-widget-top': `${Math.max(
    180,
    viewportHeight.value - positionY.value - 24,
  )}px`,
}));

const currentPageContext = computed(() => {
  const name = String(route.name ?? '').toLowerCase();
  if (name.includes('article')) {
    return 'article';
  }
  if (name.includes('archive')) {
    return 'archive';
  }
  if (name.includes('about')) {
    return 'about';
  }
  if (name.includes('category')) {
    return 'category';
  }
  if (name.includes('tag')) {
    return 'tag';
  }
  if (name.includes('guestbook')) {
    return 'guestbook';
  }
  return name || 'home';
});

const currentArticleId = computed(() => {
  if (currentPageContext.value !== 'article') {
    return undefined;
  }
  const raw = route.params.id;
  return Array.isArray(raw) ? raw[0] : raw;
});

const panelSuggestions = computed(() => {
  for (let i = chatMessages.value.length - 1; i >= 0; i--) {
    const message = chatMessages.value[i];
    if (message.role === 'assistant' && message.suggestions?.length) {
      return message.suggestions;
    }
  }
  if (currentPageContext.value === 'article') {
    return ['帮我总结这篇', '这篇的重点是什么', '推荐两篇相关的'];
  }
  return ['随便陪我聊聊', '今天适合看什么', '给我一句打气的话'];
});

const panelHorizontalStyle = computed(() => {
  const spaceLeft = positionX.value - PANEL_WIDGET_GAP;
  const spaceRight = viewportWidth.value
    - positionX.value
    - currentWidgetWidth.value
    - PANEL_WIDGET_GAP;
  const preferredLeft = spaceRight >= PANEL_ESTIMATED_WIDTH || spaceRight >= spaceLeft
    ? positionX.value + currentWidgetWidth.value + PANEL_WIDGET_GAP
    : positionX.value - PANEL_ESTIMATED_WIDTH - PANEL_WIDGET_GAP;
  const maxLeft = Math.max(
    PANEL_VIEWPORT_MARGIN,
    viewportWidth.value - PANEL_ESTIMATED_WIDTH - PANEL_VIEWPORT_MARGIN,
  );
  const clampedLeft = Math.min(Math.max(PANEL_VIEWPORT_MARGIN, preferredLeft), maxLeft);
  return {
    right: 'auto',
    left: `${clampedLeft - positionX.value}px`,
  };
});

const panelVerticalPlacementClass = computed(() => {
  const spaceAbove = positionY.value;
  const spaceBelow = viewportHeight.value - positionY.value - currentWidgetHeight.value;
  return spaceAbove >= spaceBelow ? 'panel-above' : 'panel-below';
});

const speechBubblePlacementClass = computed(() => {
  return positionX.value > 360 ? 'bubble-left' : 'bubble-right';
});

const visibleSpeechText = computed(() => {
  const text = speechText.value.trim();
  if (!text || panelVisible.value) {
    return '';
  }
  return toBubbleText(text);
});

const stageStyle = computed(() => ({
  '--tilt-x': `${tiltX.value}deg`,
  '--tilt-y': `${tiltY.value}deg`,
}));

const showRandomSpeech = () => {
  if (suppressClick.value) {
    suppressClick.value = false;
    return;
  }
  speechText.value = toBubbleText(speeches[Math.floor(Math.random() * speeches.length)]);
};

const clearSpeech = () => {
  speechText.value = '';
};

const toBubbleText = (text?: string) => {
  const normalized = (text ?? '').trim();
  if (!normalized) {
    return '';
  }
  if (normalized.length > BUBBLE_MAX_CHARS || normalized.includes('\n')) {
    return LONG_REPLY_BUBBLE_TEXT;
  }
  return normalized;
};

const pushAssistantMessage = (payload: Pick<ChatPanelMessage, 'content'> & Partial<ChatPanelMessage>) => {
  chatMessages.value.push({
    id: payload.id ?? `assistant-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    role: 'assistant',
    content: payload.content,
    citations: payload.citations ?? [],
    relatedArticles: payload.relatedArticles ?? [],
    suggestions: payload.suggestions ?? [],
  });
};

const removeEmptyAssistantMessage = (messageId: string) => {
  if (!messageId) {
    return;
  }
  const index = chatMessages.value.findIndex(
    (message) => message.id === messageId && message.role === 'assistant' && !message.content.trim(),
  );
  if (index >= 0) {
    chatMessages.value.splice(index, 1);
  }
};

const getOrCreateVisitorId = () => {
  const saved = window.localStorage.getItem(CHAT_VISITOR_STORAGE_KEY);
  if (saved) {
    return saved;
  }
  const next = `visitor-${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2, 10)}`;
  window.localStorage.setItem(CHAT_VISITOR_STORAGE_KEY, next);
  return next;
};

const ensureGreetingMessage = () => {
  if (chatMessages.value.length > 0) {
    return;
  }
  pushAssistantMessage({
    content: WELCOME_MESSAGE,
    suggestions: panelSuggestions.value,
  });
  speechText.value = toBubbleText(WELCOME_MESSAGE);
};

const openChatPanel = () => {
  panelVisible.value = true;
  void restoreChatSessionIfNeeded();
};

const buildChatRequestMessages = (): AiChatMessage[] => {
  return chatMessages.value
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }))
    .filter((message) => message.content);
};

const buildChatRequest = (): AiChatMessage[] => {
  return buildChatRequestMessages();
};

const getLastAssistantMessage = () => {
  for (let i = chatMessages.value.length - 1; i >= 0; i--) {
    if (chatMessages.value[i].role === 'assistant') {
      return chatMessages.value[i];
    }
  }
  return undefined;
};

const applySessionDetail = (detail: AiChatSessionDetailResponse) => {
  activeSessionId.value = detail.sessionId;
  chatMessages.value = detail.messages.map((message) => ({
    id: message.messageId,
    role: message.role,
    content: message.content,
    citations: message.citations ?? [],
    relatedArticles: message.relatedArticles ?? [],
    suggestions: message.suggestions ?? [],
  }));
  if (chatMessages.value.length === 0) {
    ensureGreetingMessage();
  }
};

const restoreChatSessionIfNeeded = async () => {
  if (sessionRestoreLoaded.value) {
    ensureGreetingMessage();
    return;
  }
  sessionRestoreLoaded.value = true;
  if (!activeSessionId.value) {
    ensureGreetingMessage();
    return;
  }
  try {
    const detail = await getMaidChatSessionDetail(activeSessionId.value, visitorId.value);
    applySessionDetail(detail);
  } catch {
    activeSessionId.value = '';
    window.localStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
    ensureGreetingMessage();
  }
};

const updateAssistantMessage = (messageId: string, updater: (message: ChatPanelMessage) => void) => {
  const target = chatMessages.value.find((message) => message.id === messageId);
  if (!target) {
    return;
  }
  updater(target);
};

const applyStreamEvent = (event: AiChatStreamEvent) => {
  switch (event.event) {
    case 'session':
      activeSessionId.value = event.data.sessionId;
      window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, event.data.sessionId);
      break;
    case 'message_start':
      activeStreamMessageId.value = event.data.messageId;
      speechText.value = STREAMING_BUBBLE_TEXT;
      chatMessages.value.push({
        id: event.data.messageId,
        role: 'assistant',
        content: '',
        citations: [],
        relatedArticles: [],
        suggestions: [],
      });
      break;
    case 'delta':
      updateAssistantMessage(event.data.messageId, (message) => {
        message.content += event.data.text;
      });
      break;
    case 'citation':
      updateAssistantMessage(activeStreamMessageId.value, (message) => {
        message.citations = [...(message.citations ?? []), event.data];
      });
      break;
    case 'related_articles':
      updateAssistantMessage(event.data.messageId, (message) => {
        message.relatedArticles = event.data.items;
      });
      break;
    case 'suggestions':
      updateAssistantMessage(event.data.messageId, (message) => {
        message.suggestions = event.data.items;
      });
      break;
    case 'done': {
      const lastAssistant = getLastAssistantMessage();
      speechText.value = toBubbleText(event.data.bubbleText || lastAssistant?.content || '');
      activeStreamMessageId.value = '';
      break;
    }
    case 'error':
      notify.warning(event.data.message || '这次我没接稳，再试一次呀。');
      break;
  }
};

const handleSendMessage = async (content: string) => {
  const trimmed = content.trim();
  if (!trimmed || isChatLoading.value) {
    return;
  }

  panelVisible.value = true;
  chatMessages.value.push({
    id: `user-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    role: 'user',
    content: trimmed,
  });

  isChatLoading.value = true;
  try {
    activeAbortController.value = new AbortController();
    await streamMaidChat(
      {
        sessionId: activeSessionId.value || undefined,
        visitorId: visitorId.value,
        messages: buildChatRequest(),
        pageContext: currentPageContext.value,
        currentArticleId: currentArticleId.value,
        stream: true,
      },
      {
        signal: activeAbortController.value.signal,
        onEvent: applyStreamEvent,
      },
    );
  } catch {
    if (activeAbortController.value?.signal.aborted) {
      return;
    }
    removeEmptyAssistantMessage(activeStreamMessageId.value);
    activeStreamMessageId.value = '';
    try {
      const response = await sendMaidChat({
        sessionId: activeSessionId.value || undefined,
        visitorId: visitorId.value,
        messages: buildChatRequest(),
        pageContext: currentPageContext.value,
        currentArticleId: currentArticleId.value,
        stream: false,
      });
      applyChatResponse(response);
    } catch {
      pushAssistantMessage({
        content: '这次我没接稳，再试一次呀。',
        suggestions: panelSuggestions.value,
      });
      speechText.value = '这次我没接稳，再试一次呀。';
    }
  } finally {
    activeAbortController.value = null;
    isChatLoading.value = false;
  }
};

const applyChatResponse = (response: AiChatResponse) => {
  activeSessionId.value = response.sessionId;
  window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, response.sessionId);
  pushAssistantMessage({
    id: response.messageId,
    content: response.panelAnswer || response.replyText,
    citations: response.citations,
    relatedArticles: response.relatedArticles,
    suggestions: response.suggestions,
  });
  speechText.value = toBubbleText(response.bubbleText || response.replyText);
};

const handleStopStreaming = () => {
  activeAbortController.value?.abort();
  activeAbortController.value = null;
  activeStreamMessageId.value = '';
  isChatLoading.value = false;
  const lastAssistant = getLastAssistantMessage();
  if (lastAssistant?.content) {
    speechText.value = toBubbleText(lastAssistant.content);
  }
};

const handlePointerMove = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLDivElement | null;
  if (!target) {
    return;
  }
  const rect = target.getBoundingClientRect();
  const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
  const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
  tiltX.value = Number((relativeX * 2.8).toFixed(2));
  tiltY.value = Number((relativeY * -2.4).toFixed(2));
};

const resetPointerTilt = () => {
  tiltX.value = 0;
  tiltY.value = 0;
};

const clampPosition = (x: number, y: number) => {
  const maxX = Math.max(VIEWPORT_PADDING, window.innerWidth - currentWidgetWidth.value - VIEWPORT_PADDING);
  const maxY = Math.max(VIEWPORT_PADDING, window.innerHeight - currentWidgetHeight.value - VIEWPORT_PADDING);
  return {
    x: Math.min(Math.max(VIEWPORT_PADDING, x), maxX),
    y: Math.min(Math.max(VIEWPORT_PADDING, y), maxY),
  };
};

const positionStorageKey = computed(() => compactView.value ? COMPACT_POSITION_STORAGE_KEY : STORAGE_KEY);

const persistPosition = () => {
  window.localStorage.setItem(
    positionStorageKey.value,
    JSON.stringify({ x: positionX.value, y: positionY.value })
  );
};

const applyDefaultPosition = () => {
  const defaultX = compactView.value
    ? Math.max(VIEWPORT_PADDING, window.innerWidth - currentWidgetWidth.value - VIEWPORT_PADDING)
    : 92;
  const defaultY = Math.max(96, window.innerHeight - currentWidgetHeight.value - 36);
  const next = clampPosition(defaultX, defaultY);
  positionX.value = next.x;
  positionY.value = next.y;
};

const restorePosition = () => {
  const saved = window.localStorage.getItem(positionStorageKey.value);
  if (!saved) {
    applyDefaultPosition();
    return;
  }
  try {
    const parsed = JSON.parse(saved) as { x?: number; y?: number };
    const next = clampPosition(parsed.x ?? 92, parsed.y ?? 120);
    positionX.value = next.x;
    positionY.value = next.y;
  } catch {
    applyDefaultPosition();
  }
};

const handleResize = () => {
  viewportWidth.value = window.innerWidth;
  viewportHeight.value = window.innerHeight;
  const next = clampPosition(positionX.value, positionY.value);
  positionX.value = next.x;
  positionY.value = next.y;
  persistPosition();
};

let dragStartX = 0;
let dragStartY = 0;
let originX = 0;
let originY = 0;
let movedDuringDrag = false;

const handleDragMove = (event: PointerEvent) => {
  const deltaX = event.clientX - dragStartX;
  const deltaY = event.clientY - dragStartY;
  movedDuringDrag = movedDuringDrag || Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4;
  const next = clampPosition(originX + deltaX, originY + deltaY);
  positionX.value = next.x;
  positionY.value = next.y;
};

const stopDrag = () => {
  if (!isDragging.value) {
    return;
  }
  isDragging.value = false;
  window.removeEventListener('pointermove', handleDragMove);
  window.removeEventListener('pointerup', stopDrag);
  window.removeEventListener('pointercancel', stopDrag);
  if (movedDuringDrag) {
    suppressClick.value = true;
    persistPosition();
  }
};

const startDrag = (event: PointerEvent) => {
  if (event.button !== 0) {
    return;
  }
  isDragging.value = true;
  movedDuringDrag = false;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  originX = positionX.value;
  originY = positionY.value;
  window.addEventListener('pointermove', handleDragMove);
  window.addEventListener('pointerup', stopDrag);
  window.addEventListener('pointercancel', stopDrag);
};

const handleChat = () => {
  if (panelVisible.value) {
    panelVisible.value = false;
    return;
  }
  musicPanelVisible.value = false;
  openChatPanel();
};

const closeMusicPanel = async () => {
  musicPanelVisible.value = false;
  await nextTick();
  musicTriggerRef.value?.focus();
};

const handleMusic = async () => {
  if (musicPanelVisible.value) {
    await closeMusicPanel();
    return;
  }
  panelVisible.value = false;
  musicPanelVisible.value = true;
  speechText.value = musicPlayer.playing ? '播放器已经打开啦。' : '想听什么，可以直接在播放器里点歌。';
  setTimeout(clearSpeech, 2200);
  await nextTick();
  const panelElement = musicPanelRef.value?.$el as HTMLElement | undefined;
  panelElement?.querySelector<HTMLElement>('input:not([disabled])')?.focus();
};

const handleChange = () => {
  speechText.value = '换装魔法还在准备中，先让我披着这件斗篷陪你。';
  if (compactView.value) {
    notify.info('换装功能正在准备中');
  }
  setTimeout(clearSpeech, 2200);
};

const handleScreenshot = () => {
  speechText.value = '截图功能还在制作中，我先帮你把灵感记下来。';
  if (compactView.value) {
    notify.info('截图功能正在制作中');
  }
  setTimeout(clearSpeech, 2200);
};

const handleDisplayToggle = async () => {
  if (compactOnly.value) {
    return;
  }
  if (suppressClick.value) {
    suppressClick.value = false;
    return;
  }

  persistPosition();
  isCompact.value = !isCompact.value;
  window.localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, isCompact.value ? 'compact' : 'expanded');
  panelVisible.value = false;
  musicPanelVisible.value = false;
  clearSpeech();

  await nextTick();
  restorePosition();
};

let speechTimer: number | null = null;

watch(
  () => props.compactOnly,
  async () => {
    await nextTick();
    restorePosition();
  },
);

onMounted(() => {
  restorePosition();
  activeSessionId.value = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY) ?? '';
  visitorId.value = getOrCreateVisitorId();
  window.addEventListener('resize', handleResize);
  speechTimer = window.setInterval(() => {
    if (!panelVisible.value && Math.random() > 0.72) {
      showRandomSpeech();
    }
  }, 30000);
});

onUnmounted(() => {
  handleStopStreaming();
  stopDrag();
  window.removeEventListener('resize', handleResize);
  if (speechTimer) {
    clearInterval(speechTimer);
  }
});
</script>

<style scoped lang="scss">
.live2d-container {
  position: fixed;
  z-index: 40;
  width: var(--live2d-width);
  height: var(--live2d-height);
  pointer-events: auto;
  touch-action: auto;
}

.live2d-container.dragging {
  user-select: none;
}

.chat-panel-shell {
  position: absolute;
  top: -6px;
  z-index: 18;
  animation: panel-fade-in 260ms ease;
}

.music-panel-shell {
  position: absolute;
  top: 52px;
  z-index: 18;
  animation: panel-fade-in 260ms ease;
}

.live2d-container.is-compact .chat-panel-shell.panel-above,
.live2d-container.is-compact .music-panel-shell.panel-above {
  top: auto;
  bottom: calc(100% + 12px);
  max-height: var(--live2d-panel-space-above) !important;
}

.live2d-container.is-compact .chat-panel-shell.panel-below,
.live2d-container.is-compact .music-panel-shell.panel-below {
  top: calc(100% + 12px);
  bottom: auto;
  max-height: var(--live2d-panel-space-below) !important;
}

.live2d-container:not(.is-compact) .chat-panel-shell.panel-above,
.live2d-container:not(.is-compact) .music-panel-shell.panel-above {
  top: auto;
  bottom: 0;
  max-height: var(--live2d-panel-space-to-widget-bottom) !important;
}

.live2d-container:not(.is-compact) .chat-panel-shell.panel-below,
.live2d-container:not(.is-compact) .music-panel-shell.panel-below {
  top: 0;
  bottom: auto;
  max-height: var(--live2d-panel-space-from-widget-top) !important;
}

.live2d-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 252px;
  transform: scale(var(--live2d-scale));
  transform-origin: top left;
}

.live2d-wrapper.is-compact {
  width: 100%;
  transform: none;
}

.speech-bubble {
  position: absolute;
  top: 128px;
  z-index: 8;
  width: min(168px, calc(100vw - 32px));
  max-width: 168px;
  padding: 10px 14px;
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 247, 251, 0.98));
  box-shadow:
    0 16px 34px rgba(84, 60, 73, 0.16),
    0 6px 18px rgba(247, 126, 162, 0.12);
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  animation: bubble-float 3.6s ease-in-out infinite;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;

  &::after {
    content: '';
    position: absolute;
    top: 34px;
    width: 16px;
    height: 16px;
    background: inherit;
    transform: rotate(45deg);
    border-radius: 2px;
  }
}

.speech-bubble.bubble-right {
  left: calc(100% - 24px);

  &::after {
    left: -7px;
  }
}

.speech-bubble.bubble-left {
  right: calc(100% - 24px);

  &::after {
    right: -7px;
  }
}

.live2d-canvas {
  position: relative;
  width: 252px;
  height: 420px;
  overflow: visible;
  cursor: grab;
  touch-action: none;
}

.live2d-container.dragging .live2d-canvas {
  cursor: grabbing;
}

.maid-stage {
  position: relative;
  width: 100%;
  height: 100%;
}

.figure-shadow {
  position: absolute;
  bottom: 14px;
  left: 50%;
  z-index: 0;
  width: 132px;
  height: 22px;
  border-radius: 999px;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(21, 26, 43, 0.26) 0%, rgba(21, 26, 43, 0.08) 62%, transparent 100%);
  filter: blur(8px);
  will-change: transform, opacity;
  animation: shadow-breathe 3.8s ease-in-out infinite;
}

.figure-aura {
  position: absolute;
  inset: 34px 26px 38px;
  z-index: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 28% 38%, rgba(92, 193, 255, 0.18), transparent 34%),
    radial-gradient(circle at 72% 32%, rgba(255, 225, 188, 0.16), transparent 32%),
    radial-gradient(circle at 48% 78%, rgba(204, 184, 255, 0.14), transparent 36%);
  filter: blur(12px);
  will-change: transform, opacity;
  animation: aura-breathe 5.2s ease-in-out infinite;
}

.maid-motion {
  position: absolute;
  left: 50%;
  bottom: 18px;
  z-index: 2;
  width: 238px;
  transform: translateX(-50%);
  transform-style: preserve-3d;
  will-change: transform;
  animation: body-float 4.2s ease-in-out infinite;
}

.maid-figure {
  display: block;
  width: 100%;
  user-select: none;
  -webkit-user-drag: none;
  will-change: transform;
  transform:
    perspective(900px)
    rotateY(var(--tilt-x))
    rotateX(var(--tilt-y));
  transform-origin: 50% 72%;
  transition: transform 180ms ease-out;
  filter: drop-shadow(0 18px 28px rgba(27, 33, 63, 0.18));
}

.magic-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(12px);
  opacity: 0.72;
  will-change: transform, opacity;
  animation: orb-float 5.2s ease-in-out infinite;
}

.magic-orb--cyan {
  top: 182px;
  left: 18px;
  width: 42px;
  height: 42px;
  background: radial-gradient(circle, rgba(119, 225, 255, 0.58) 0%, rgba(119, 225, 255, 0.08) 68%, transparent 100%);
}

.magic-orb--gold {
  top: 76px;
  right: 24px;
  width: 36px;
  height: 36px;
  background: radial-gradient(circle, rgba(255, 224, 183, 0.58) 0%, rgba(255, 224, 183, 0.08) 70%, transparent 100%);
  animation-delay: 1.1s;
}

.magic-orb--violet {
  bottom: 96px;
  right: 28px;
  width: 32px;
  height: 32px;
  background: radial-gradient(circle, rgba(200, 183, 255, 0.58) 0%, rgba(200, 183, 255, 0.08) 70%, transparent 100%);
  animation-delay: 1.8s;
}

.sparkle {
  position: absolute;
  z-index: 3;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.96) 0%, rgba(166, 221, 255, 0.92) 58%, transparent 76%);
  opacity: 0.82;
  will-change: transform, opacity;
  animation: sparkle-float 4s ease-in-out infinite;
}

.sparkle--1 {
  top: 50px;
  left: 38px;
  width: 8px;
  height: 8px;
}

.sparkle--2 {
  top: 114px;
  right: 30px;
  width: 6px;
  height: 6px;
  animation-delay: 0.8s;
}

.sparkle--3 {
  top: 208px;
  left: 8px;
  width: 5px;
  height: 5px;
  animation-delay: 1.4s;
}

.sparkle--4 {
  top: 182px;
  right: 44px;
  width: 5px;
  height: 5px;
  animation-delay: 2s;
}

.live2d-tools {
  display: flex;
  width: max-content;
  margin-top: 8px;
  justify-content: center;
  gap: 8px;
}

.live2d-tools.is-compact {
  align-items: center;
  width: 100%;
  min-height: 52px;
  margin-top: 0;
  padding: 6px;
  gap: 4px;
  border: 1px solid rgba(236, 219, 226, 0.94);
  border-radius: 14px;
  background: rgba(255, 253, 254, 0.98);
  box-shadow: 0 4px 8px rgba(84, 60, 73, 0.1);
}

.assistant-identity {
  display: inline-flex;
  flex: 0 0 auto;
  min-width: 0;
  height: 40px;
  align-items: center;
  gap: 7px;
  padding: 0 5px;
  color: #6b505d;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.live2d-container.dragging .assistant-identity {
  cursor: grabbing;
}

.assistant-identity__mark {
  display: inline-grid;
  flex: 0 0 40px;
  width: 40px;
  height: 28px;
  place-items: center;
  border-radius: 9px;
  background: #bd3569;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.assistant-identity__playing {
  display: inline-flex;
  height: 14px;
  align-items: flex-end;
  gap: 2px;
  color: #e45c8c;
}

.assistant-identity__playing i {
  width: 2px;
  height: 6px;
  border-radius: 2px;
  background: currentColor;
  animation: playing-bar 720ms ease-in-out infinite alternate;
}

.assistant-identity__playing i:nth-child(2) {
  height: 11px;
  animation-delay: 160ms;
}

.assistant-identity__playing i:nth-child(3) {
  height: 8px;
  animation-delay: 320ms;
}

.tool-btn {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  background: rgba(255, 251, 253, 0.96);
  color: #8e7280;
  box-shadow: 0 4px 8px rgba(84, 60, 73, 0.1);
  cursor: pointer;
  transition: transform 180ms ease-out, background 180ms ease-out, color 180ms ease-out;

  &:hover {
    transform: translateY(-2px);
    background: #fb7299;
    color: #fff;
  }

  &.is-active {
    background: #fb7299;
    color: #fff;
  }

  &:focus-visible {
    outline: 2px solid #d94378;
    outline-offset: 2px;
  }
}

.live2d-tools.is-compact .tool-btn {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  background: transparent;
  box-shadow: none;
}

.live2d-tools.is-compact .tool-btn:hover,
.live2d-tools.is-compact .tool-btn.is-active {
  background: #fb7299;
  color: #fff;
}

@keyframes panel-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes body-float {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-5px);
  }
}

@keyframes shadow-breathe {
  0%,
  100% {
    transform: translateX(-50%) scaleX(1);
    opacity: 0.76;
  }
  50% {
    transform: translateX(-50%) scaleX(0.94);
    opacity: 0.6;
  }
}

@keyframes aura-breathe {
  0%,
  100% {
    transform: scale(0.98);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.02);
    opacity: 0.92;
  }
}

@keyframes orb-float {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-10px);
    opacity: 0.78;
  }
}

@keyframes sparkle-float {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-8px) scale(1.1);
    opacity: 1;
  }
}

@keyframes bubble-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes playing-bar {
  from {
    transform: scaleY(0.55);
  }
  to {
    transform: scaleY(1);
  }
}

@media (max-width: 1023px) {
  .live2d-container.is-compact {
    right: 12px;
    bottom: max(12px, env(safe-area-inset-bottom));
    left: 12px !important;
    top: auto !important;
    width: auto !important;
    height: 58px !important;
  }

  .live2d-tools.is-compact {
    min-height: 58px;
    padding: 7px;
    border-radius: 16px;
  }

  .live2d-tools.is-compact .tool-btn {
    flex-basis: 44px;
    width: 44px;
    height: 44px;
    font-size: 17px;
  }

  .chat-panel-shell,
  .music-panel-shell {
    position: fixed;
    right: 12px !important;
    left: 12px !important;
    top: auto !important;
    bottom: calc(82px + env(safe-area-inset-bottom)) !important;
    width: auto !important;
    max-width: none;
    max-height: calc(100dvh - 112px) !important;
    transform: none;
  }
}

@media (max-width: 420px) {
  .assistant-identity {
    flex: 0 0 40px;
    padding-inline: 0;
  }

  .assistant-identity__playing {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-panel-shell,
  .music-panel-shell,
  .speech-bubble,
  .figure-shadow,
  .figure-aura,
  .maid-motion,
  .magic-orb,
  .sparkle,
  .assistant-identity__playing i {
    animation: none;
  }

  .maid-figure,
  .tool-btn {
    transition-duration: 0.01ms;
  }
}
</style>
