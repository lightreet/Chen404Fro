<template>
  <div class="default-layout">
    <SakuraOverlay />
    <!-- 顶部导航 -->
    <Header />

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 可选：全宽 Hero 插槽（用于首页等） -->
      <slot name="hero" />
      <div class="container">
        <div
          class="content-wrapper"
          :class="{ 'has-live2d': !isMobile, 'no-right-sidebar': isMobile || !showRightSidebar }"
        >
          <!-- 左侧 Live2D：固定到视口左侧，处于屏幕左与文章卡片之间的位置 -->
          <aside class="sidebar-left" v-if="!isMobile">
            <Live2D />
          </aside>

          <!-- 中间内容 -->
          <div class="main-area">
            <slot />
          </div>

          <!-- 右侧边栏 -->
          <aside class="sidebar-right" v-if="!isMobile && showRightSidebar">
            <slot name="sidebar" />
          </aside>
        </div>
      </div>
    </main>

    <!-- 底部 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/Header/Header.vue';
import Footer from '@/components/Footer/Footer.vue';
import Live2D from '@/components/Live2D/Live2D.vue';
import SakuraOverlay from '@/components/SakuraOverlay/SakuraOverlay.vue';
import { useLayoutMobile } from '@/composables/useLayoutMobile';

interface Props {
  showRightSidebar?: boolean;
}

withDefaults(defineProps<Props>(), {
  showRightSidebar: false,
});

const { isMobile } = useLayoutMobile();
</script>

<style scoped lang="scss">
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 有 hero 插槽时由 hero 占位，无 hero 时保持原有顶部留白 */
.main-content {
  flex: 1;
  padding-top: calc(64px + 24px);
  padding-bottom: 24px;
}

.main-content:has([data-hero]) {
  padding-top: 0;
}

.content-wrapper {
  --live2d-reserved-space: 328px;
  display: flex;
  gap: 24px;
  align-items: flex-start;

  /* 有 Live2D 时为主内容预留左侧空间，避免与固定侧栏重叠 */
  &.has-live2d {
    padding-left: var(--live2d-reserved-space); /* 280 侧栏 + 48 与卡片的间距 */
  }
}

.sidebar-left {
  width: 280px;
  flex-shrink: 0;
  position: fixed;
  left: 24px;
  bottom: 24px;
  top: auto;
  z-index: 10;
}

.main-area {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.content-wrapper.no-right-sidebar .main-area {
  max-width: 980px;
  margin: 0 auto;
}

.sidebar-right {
  width: 300px;
  flex-shrink: 0;
}

// 响应式
@media (max-width: 1280px) {
  .sidebar-right {
    display: none;
  }
}

@media (max-width: 1024px) {
  .content-wrapper {
    flex-direction: column;
  }

  .sidebar-left {
    width: 100%;
    position: static;
  }
}
</style>
