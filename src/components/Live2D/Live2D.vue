<template>
  <div class="live2d-container" v-if="isVisible">
    <div class="live2d-wrapper">
      <!-- 对话气泡 -->
      <div class="speech-bubble" v-if="speechText" @click="clearSpeech">
        {{ speechText }}
      </div>

      <!-- Live2D 画布区域 -->
      <div class="live2d-canvas">
        <div class="placeholder-character">
          <div class="character-body">
            <div class="character-face">
              <div class="eyes">
                <div class="eye left"></div>
                <div class="eye right"></div>
              </div>
              <div class="mouth"></div>
            </div>
          </div>
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
.placeholder-character {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 40px;
}

.character-body {
  width: 120px;
  height: 160px;
  background: linear-gradient(180deg, #ffe4e1 0%, #ffb6c1 100%);
  border-radius: 60px 60px 40px 40px;
  position: relative;
  animation: breathe 2s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.character-face {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
}

.eyes {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.eye {
  width: 20px;
  height: 24px;
  background: var(--text-primary);
  border-radius: 50%;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
  }
}

.mouth {
  width: 30px;
  height: 15px;
  background: var(--text-primary);
  border-radius: 0 0 30px 30px;
  margin: 0 auto;
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
