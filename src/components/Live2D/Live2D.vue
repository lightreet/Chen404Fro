<template>
  <div
    v-if="isVisible"
    class="live2d-container"
    :class="{ dragging: isDragging }"
    :style="containerStyle"
  >
    <div class="live2d-wrapper">
      <div v-if="speechText" class="speech-bubble" @click="clearSpeech">
        {{ speechText }}
      </div>

      <div
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

      <div class="live2d-tools">
        <button class="tool-btn" type="button" aria-label="对话" @click="handleChat">
          <el-icon><ChatDotRound /></el-icon>
        </button>
        <button class="tool-btn" type="button" aria-label="换装" @click="handleChange">
          <el-icon><Refresh /></el-icon>
        </button>
        <button class="tool-btn" type="button" aria-label="截图" @click="handleScreenshot">
          <el-icon><Camera /></el-icon>
        </button>
        <button class="tool-btn close-btn" type="button" aria-label="关闭" @click="handleClose">
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Camera, ChatDotRound, Close, Refresh } from '@element-plus/icons-vue';
import maidImage from '@/assets/live2d/maid-witch.webp';

const STORAGE_KEY = 'chen404.live2d.position';
const VIEWPORT_PADDING = 52;
const WIDGET_WIDTH = 252;
const WIDGET_HEIGHT = 456;

const isVisible = ref(true);
const isDragging = ref(false);
const speechText = ref('');
const tiltX = ref(0);
const tiltY = ref(0);
const positionX = ref(92);
const positionY = ref(120);
const suppressClick = ref(false);

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
}));

const stageStyle = computed(() => ({
  '--tilt-x': `${tiltX.value}deg`,
  '--tilt-y': `${tiltY.value}deg`,
}));

const showRandomSpeech = () => {
  if (suppressClick.value) {
    suppressClick.value = false;
    return;
  }
  speechText.value = speeches[Math.floor(Math.random() * speeches.length)];
};

const clearSpeech = () => {
  speechText.value = '';
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
  const maxX = Math.max(VIEWPORT_PADDING, window.innerWidth - WIDGET_WIDTH - VIEWPORT_PADDING);
  const maxY = Math.max(VIEWPORT_PADDING, window.innerHeight - WIDGET_HEIGHT - VIEWPORT_PADDING);
  return {
    x: Math.min(Math.max(VIEWPORT_PADDING, x), maxX),
    y: Math.min(Math.max(VIEWPORT_PADDING, y), maxY),
  };
};

const persistPosition = () => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ x: positionX.value, y: positionY.value })
  );
};

const applyDefaultPosition = () => {
  const defaultX = 92;
  const defaultY = Math.max(96, window.innerHeight - WIDGET_HEIGHT - 36);
  const next = clampPosition(defaultX, defaultY);
  positionX.value = next.x;
  positionY.value = next.y;
};

const restorePosition = () => {
  const saved = window.localStorage.getItem(STORAGE_KEY);
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
  showRandomSpeech();
};

const handleChange = () => {
  speechText.value = '换装魔法还在准备中，先让我披着这件斗篷陪你。';
  setTimeout(clearSpeech, 2200);
};

const handleScreenshot = () => {
  speechText.value = '截图功能还在制作中，我先帮你把灵感记下来。';
  setTimeout(clearSpeech, 2200);
};

const handleClose = () => {
  isVisible.value = false;
};

let speechTimer: number | null = null;

onMounted(() => {
  restorePosition();
  window.addEventListener('resize', handleResize);
  speechTimer = window.setInterval(() => {
    if (Math.random() > 0.72) {
      showRandomSpeech();
    }
  }, 30000);
});

onUnmounted(() => {
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
  width: 252px;
  height: 456px;
  pointer-events: auto;
  touch-action: none;
}

.live2d-container.dragging {
  user-select: none;
}

.live2d-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 252px;
}

.speech-bubble {
  position: absolute;
  top: -54px;
  left: 50%;
  z-index: 8;
  transform: translateX(-50%);
  max-width: 212px;
  padding: 10px 14px;
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 255, 0.98));
  box-shadow: 0 16px 34px rgba(33, 41, 74, 0.18);
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
  cursor: pointer;
  animation: bubble-float 3.6s ease-in-out infinite;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    width: 16px;
    height: 16px;
    background: inherit;
    transform: translateX(-50%) rotate(45deg);
    border-radius: 2px;
  }
}

.live2d-canvas {
  position: relative;
  width: 252px;
  height: 420px;
  overflow: visible;
  cursor: grab;
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
  width: max-content;
  margin-top: 8px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.tool-btn {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-secondary);
  box-shadow: 0 10px 22px rgba(37, 44, 78, 0.12);
  cursor: pointer;
  transition: transform 0.24s ease, background 0.24s ease, color 0.24s ease;

  &:hover {
    transform: translateY(-2px);
    background: #6b89d6;
    color: #fff;
  }
}

.close-btn:hover {
  background: #ef6c88;
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
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-3px);
  }
}
</style>
