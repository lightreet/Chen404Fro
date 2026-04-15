<template>
  <div class="live2d-container" v-if="isVisible">
    <div class="live2d-wrapper">
      <!-- 对话气泡 -->
      <div class="speech-bubble" v-if="speechText" @click="clearSpeech">
        {{ speechText }}
      </div>

      <!-- Live2D 画布区域 -->
      <div class="live2d-canvas">
        <div class="anime-figure" @click="showRandomSpeech">
          <div class="anime-shadow" aria-hidden="true"></div>
          <svg class="anime-girl" viewBox="0 0 260 320" role="img" aria-label="动漫少女助手">
            <defs>
              <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#5b4bd1" />
                <stop offset="100%" stop-color="#2a235f" />
              </linearGradient>
              <linearGradient id="dressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#ffd8ea" />
                <stop offset="100%" stop-color="#ff95bf" />
              </linearGradient>
              <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffb4d2" />
                <stop offset="100%" stop-color="#fb7299" />
              </linearGradient>
            </defs>

            <ellipse cx="130" cy="294" rx="58" ry="14" fill="rgba(15,23,42,0.12)" />

            <g class="girl-bob">
              <path
                d="M86 114c-18-12-28-34-24-60 6-37 34-62 69-62 39 0 69 30 71 70 1 23-7 39-23 52l-10-18c7-7 11-16 10-30-1-28-21-46-48-46-25 0-45 18-49 43-3 17 2 32 13 44z"
                fill="url(#hairGradient)"
              />
              <path
                d="M72 118c-20 18-33 48-27 86 5 29 24 44 48 44l4-28c-14-1-22-8-25-23-4-21 0-38 12-57z"
                fill="url(#hairGradient)"
              />
              <path
                d="M190 118c20 18 33 48 27 86-5 29-24 44-48 44l-4-28c14-1 22-8 25-23 4-21 0-38-12-57z"
                fill="url(#hairGradient)"
              />

              <ellipse cx="130" cy="106" rx="52" ry="58" fill="#ffe8ee" />

              <path
                d="M82 93c9-30 33-49 65-49 24 0 43 10 57 31-14 1-24 3-36 12-7-7-17-11-31-11-17 0-31 6-43 17z"
                fill="url(#hairGradient)"
              />
              <path
                d="M84 92c9 18 30 24 49 23 20-1 40-8 56-24l4 14c-10 13-31 24-60 25-30 1-46-10-56-23z"
                fill="url(#hairGradient)"
              />

              <g class="girl-eyes">
                <ellipse cx="110" cy="110" rx="10" ry="13" fill="#ffffff" />
                <ellipse cx="151" cy="110" rx="10" ry="13" fill="#ffffff" />
                <ellipse cx="110" cy="112" rx="6" ry="9" fill="#6b7cff" />
                <ellipse cx="151" cy="112" rx="6" ry="9" fill="#6b7cff" />
                <circle cx="112" cy="109" r="2.6" fill="#ffffff" />
                <circle cx="153" cy="109" r="2.6" fill="#ffffff" />
              </g>

              <path d="M101 93c5-4 12-6 19-5" stroke="#43336f" stroke-width="3.5" stroke-linecap="round" fill="none" />
              <path d="M141 88c7-1 14 1 18 6" stroke="#43336f" stroke-width="3.5" stroke-linecap="round" fill="none" />
              <path d="M128 114c-3 4-3 8 0 12" stroke="#e8a2aa" stroke-width="2.4" stroke-linecap="round" fill="none" />
              <path d="M118 131c7 4 15 4 23 0" stroke="#c86b7d" stroke-width="3" stroke-linecap="round" fill="none" />
              <ellipse cx="95" cy="126" rx="9" ry="5" fill="#ffc6d5" opacity="0.75" />
              <ellipse cx="165" cy="126" rx="9" ry="5" fill="#ffc6d5" opacity="0.75" />

              <path
                d="M101 160c-8 14-14 29-16 44-4 25 5 44 45 46 38 2 53-11 49-42-2-16-8-32-17-48z"
                fill="url(#dressGradient)"
              />
              <path d="M106 162c11 7 31 7 48 0l-4-13h-41z" fill="#fff5fb" />
              <path d="M131 150l-14 10 14 12 14-12z" fill="url(#ribbonGradient)" />
              <circle cx="131" cy="162" r="5" fill="#fff5fb" />

              <path d="M102 167c-17 12-27 28-31 48" stroke="#ffe8ee" stroke-width="13" stroke-linecap="round" fill="none" />
              <path d="M158 167c17 12 27 28 31 48" stroke="#ffe8ee" stroke-width="13" stroke-linecap="round" fill="none" />
              <path d="M96 251c8 10 19 16 35 18 20 3 38-2 48-18" stroke="#fff5fb" stroke-width="14" stroke-linecap="round" fill="none" />

              <g class="girl-ribbon">
                <path d="M77 66l19-11 3 19-16 11z" fill="url(#ribbonGradient)" />
                <path d="M96 55l20 8-17 12-18-9z" fill="#ffd2e3" />
              </g>
            </g>
          </svg>

          <span class="sparkle sparkle--1" aria-hidden="true"></span>
          <span class="sparkle sparkle--2" aria-hidden="true"></span>
          <span class="sparkle sparkle--3" aria-hidden="true"></span>
        </div>
      </div>

      <!-- 工具按钮 -->
      <div class="live2d-tools">
        <button class="tool-btn" @click="handleChat" title="聊天">
          <el-icon><ChatDotRound /></el-icon>
        </button>
        <button class="tool-btn" @click="handleChange" title="切换">
          <el-icon><Refresh /></el-icon>
        </button>
        <button class="tool-btn" @click="handleScreenshot" title="截图">
          <el-icon><Camera /></el-icon>
        </button>
        <button class="tool-btn close-btn" @click="handleClose" title="关闭">
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ChatDotRound, Refresh, Camera, Close } from '@element-plus/icons-vue';

const isVisible = ref(true);
const speechText = ref('');

// 预设对话
const speeches = [
  '欢迎来到 Chen404 的博客! 🌸',
  '今天也要加油哦! 💪',
  '有什么可以帮你的吗? 🤔',
  '图片刷新失败，试试 Ctrl+F5 刷新哦！',
  '喜欢这篇文章的话记得点赞哦! 👍',
  '好好学习，天天向上! 📚',
  '代码写累了就休息一下吧 ☕',
];

// 随机显示对话
const showRandomSpeech = () => {
  const random = speeches[Math.floor(Math.random() * speeches.length)];
  speechText.value = random;
};

const clearSpeech = () => {
  speechText.value = '';
};

// 工具按钮处理
const handleChat = () => {
  showRandomSpeech();
};

const handleChange = () => {
  speechText.value = '切换角色功能开发中...';
  setTimeout(clearSpeech, 2000);
};

const handleScreenshot = () => {
  speechText.value = '截图功能开发中...';
  setTimeout(clearSpeech, 2000);
};

const handleClose = () => {
  isVisible.value = false;
};

// 定时显示对话
let speechTimer: number | null = null;

onMounted(() => {
  speechTimer = window.setInterval(() => {
    if (Math.random() > 0.7) {
      showRandomSpeech();
    }
  }, 30000);
});

onUnmounted(() => {
  if (speechTimer) {
    clearInterval(speechTimer);
  }
});
</script>

<style scoped lang="scss">
.live2d-container {
  position: relative;
}

.live2d-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

// 对话气泡
.speech-bubble {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  font-size: 14px;
  color: var(--text-primary);
  max-width: 240px;
  text-align: center;
  cursor: pointer;
  animation: float 3s ease-in-out infinite;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid white;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-5px);
  }
}

// 画布区域
.live2d-canvas {
  width: 260px;
  height: 320px;
  position: relative;
  overflow: hidden;
}

// 占位角色样式
.anime-figure {
  width: 100%;
  height: 100%;
  position: relative;
  display: grid;
  place-items: end center;
  padding-bottom: 18px;
}

.anime-shadow {
  position: absolute;
  bottom: 12px;
  left: 50%;
  width: 132px;
  height: 28px;
  border-radius: 999px;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(15, 23, 42, 0.22) 0%, rgba(15, 23, 42, 0.06) 62%, transparent 100%);
  filter: blur(8px);
}

.anime-girl {
  width: 232px;
  height: 292px;
  overflow: visible;
  filter: drop-shadow(0 18px 24px rgba(71, 48, 126, 0.18));
}

.girl-bob {
  transform-origin: 50% 80%;
  animation: idol-breathe 3.2s ease-in-out infinite;
}

.girl-eyes {
  transform-origin: center;
  animation: idol-blink 5.6s infinite;
}

.girl-ribbon {
  transform-origin: 96px 64px;
  animation: idol-sway 2.8s ease-in-out infinite;
}

.sparkle {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 182, 193, 0.88) 55%, transparent 70%);
  opacity: 0.86;
  animation: sparkle-float 3.2s ease-in-out infinite;
}

.sparkle--1 {
  top: 44px;
  left: 34px;
  animation-delay: 0s;
}

.sparkle--2 {
  top: 102px;
  right: 28px;
  width: 10px;
  height: 10px;
  animation-delay: 0.8s;
}

.sparkle--3 {
  top: 164px;
  left: 20px;
  width: 8px;
  height: 8px;
  animation-delay: 1.4s;
}

@keyframes idol-breathe {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-4px) scale(1.015);
  }
}

@keyframes idol-blink {
  0%,
  44%,
  48%,
  100% {
    transform: scaleY(1);
  }
  46% {
    transform: scaleY(0.12);
  }
}

@keyframes idol-sway {
  0%,
  100% {
    transform: rotate(-2deg);
  }
  50% {
    transform: rotate(3deg);
  }
}

@keyframes sparkle-float {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.72;
  }
  50% {
    transform: translateY(-9px) scale(1.18);
    opacity: 1;
  }
}

// 工具按钮
.live2d-tools {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.tool-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: white;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: var(--shadow-sm);

  &:hover {
    background: var(--primary);
    color: white;
    transform: translateY(-2px);
  }

  &.close-btn:hover {
    background: var(--danger);
  }
}

@media (max-width: 1024px) {
  .live2d-container {
    display: none;
  }
}
</style>
