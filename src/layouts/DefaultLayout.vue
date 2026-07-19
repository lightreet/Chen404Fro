<template>
  <div class="default-layout">
    <SakuraOverlay :mode="sakuraSceneMode" />
    <!-- 顶部导航 -->
    <Header v-if="showHeader" />

    <!-- 主内容区 -->
    <main class="main-content" :class="{ 'has-no-site-header': !showHeader }">
      <!-- 可选：全宽 Hero 插槽（用于首页等） -->
      <slot name="hero" />
      <div class="container" :class="{ 'container--wide': wideContent }">
        <div
          class="content-wrapper"
          :class="{
            'no-right-sidebar': isMobile || !showRightSidebar,
            'is-wide-content': wideContent,
          }"
        >

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
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Header from '@/components/Header/Header.vue';
import Footer from '@/components/Footer/Footer.vue';
import SakuraOverlay from '@/components/SakuraOverlay/SakuraOverlay.vue';
import { useLayoutMobile } from '@/composables/useLayoutMobile';

type SakuraSceneMode = 'hero' | 'ambient' | 'reading' | 'off';

const route = useRoute();

const sakuraSceneMode = computed<SakuraSceneMode>(() => {
  const path = route.path;

  if (path === '/') return 'hero';
  if (/^\/article\/[^/]+$/.test(path) || path.startsWith('/memory-map/detail/')) {
    return 'reading';
  }
  if (
    path.startsWith('/admin')
    || path.startsWith('/article/edit')
    || path.startsWith('/music/tracks')
    || path.startsWith('/memory-map/create')
    || path.startsWith('/memory-map/edit')
    || path.startsWith('/profile')
  ) {
    return 'off';
  }

  return 'ambient';
});

interface Props {
  showRightSidebar?: boolean;
  wideContent?: boolean;
  showHeader?: boolean;
}

withDefaults(defineProps<Props>(), {
  showRightSidebar: false,
  wideContent: false,
  showHeader: true,
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
  overflow: clip;
}

.main-content.has-no-site-header {
  padding-top: 0;
}

.main-content:has([data-hero]) {
  padding-top: 0;
}

.content-wrapper {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.container--wide {
  max-width: 100%;
  padding-inline: clamp(12px, 1.8vw, 28px);
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

.content-wrapper.no-right-sidebar.is-wide-content .main-area {
  max-width: 100%;
}

.sidebar-right {
  width: 300px;
  flex-shrink: 0;
}

[data-theme='dark'] .main-content {
  background:
    linear-gradient(
      180deg,
      rgba(33, 29, 38, 0) 0%,
      rgba(33, 29, 38, 0.1) 12%,
      rgba(33, 29, 38, 0.76) 42%,
      rgba(31, 27, 36, 0.98) 100%
    );
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
}
</style>
