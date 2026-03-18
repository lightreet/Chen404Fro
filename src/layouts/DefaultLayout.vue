<template>
  <div class="default-layout">
    <!-- 顶部导航 -->
    <Header />

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="container">
        <div class="content-wrapper">
          <!-- 左侧 Live2D -->
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
import { ref, onMounted, onUnmounted } from 'vue';
import Header from '@/components/Header/Header.vue';
import Footer from '@/components/Footer/Footer.vue';
import Live2D from '@/components/Live2D/Live2D.vue';

interface Props {
  showRightSidebar?: boolean;
}

withDefaults(defineProps<Props>(), {
  showRightSidebar: false,
});

// 响应式断点
const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024;
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style scoped lang="scss">
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 为固定导航栏预留高度（64px）+ 适当留白，避免内容与导航贴得太紧 */
.main-content {
  flex: 1;
  padding-top: calc(64px + 24px);
  padding-bottom: 24px;
}

.content-wrapper {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.sidebar-left {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 88px;
}

.main-area {
  flex: 1;
  min-width: 0;
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
