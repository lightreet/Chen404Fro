<template>
  <div class="default-layout" :class="{ 'mobile-layout': isPhone, 'mobile-layout--with-nav': isPhone && mobilePrimary, 'mobile-layout--with-player': showMiniPlayer }" :style="{ '--mobile-player-height': `${miniPlayerHeight}px`, '--mobile-player-bottom': mobilePrimary ? 'var(--mobile-nav-height)' : 'env(safe-area-inset-bottom)' }">
    <SakuraOverlay v-if="!isPhone" :mode="sakuraSceneMode" />
    <!-- 顶部导航 -->
    <AppMobileHeader
      v-if="isPhone && showHeader"
      :brand="route.path === '/'"
      :title="mobileTitle || String(route.meta.title || '')"
      :back="!mobilePrimary"
      :back-to="mobileBackTo"
    ><template v-if="$slots['mobile-actions']" #default><slot name="mobile-actions" /></template></AppMobileHeader>
    <Header v-else-if="showHeader" />

    <!-- 主内容区 -->
    <main class="main-content" :class="{ 'has-no-site-header': !showHeader }">
      <!-- 可选：全宽 Hero 插槽（用于首页等） -->
      <slot v-if="!isPhone" name="hero" />
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
    <AppMobileNav v-if="isPhone && mobilePrimary" />
    <MobileMiniPlayer v-if="showMiniPlayer" @resize="miniPlayerHeight = $event" />
    <Footer v-if="!isPhone" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import Header from '@/components/Header/Header.vue';
import Footer from '@/components/Footer/Footer.vue';
import SakuraOverlay from '@/components/SakuraOverlay/SakuraOverlay.vue';
import { useLayoutMobile } from '@/composables/useLayoutMobile';
import { useMobileViewport } from '@/composables/useMobileViewport';
import { useMobileNavigationStore } from '@/stores/mobile-navigation';
import { isMobilePrimaryPage } from '@/modules/mobile/navigation';
import AppMobileHeader from '@/components/app/AppMobileHeader/AppMobileHeader.vue';
import AppMobileNav from '@/components/app/AppMobileNav/AppMobileNav.vue';
import MobileMiniPlayer from '@/components/Music/MobileMiniPlayer.vue';
import { useMusicPlayerStore } from '@/stores/music-player';

type SakuraSceneMode = 'hero' | 'ambient' | 'reading' | 'off';

const route = useRoute();

const sakuraSceneMode = computed<SakuraSceneMode>(() => {
  const path = route.path;

  if (path === '/') return 'hero';
  if (/^\/article\/[^/]+$/.test(path)) {
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
  mobileTitle?: string;
  mobileBackTo?: string;
}

withDefaults(defineProps<Props>(), {
  showRightSidebar: false,
  wideContent: false,
  showHeader: true,
  mobileTitle: '',
  mobileBackTo: '/discover',
});

const { isMobile } = useLayoutMobile();
const { isMobile: isPhone } = useMobileViewport();
const mobileNavigation = useMobileNavigationStore();
const musicPlayer = useMusicPlayerStore();
const miniPlayerHeight = ref(160);
const mobilePrimary = computed(() => isMobilePrimaryPage(route.path, mobileNavigation.selected,
  Boolean(route.query.focus || route.query.player || route.query.tab)));
const showMiniPlayer = computed(() => isPhone.value && route.path === '/music'
  && route.query.player !== '1' && musicPlayer.hasQueue);
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

@media (max-width: 767px) {
  .mobile-layout { background: var(--color-canvas); min-height: 100dvh; }
  .mobile-layout .main-content { padding: 0 0 24px; overflow: visible; background: none; }
  .mobile-layout--with-nav .main-content { padding-bottom: calc(var(--mobile-nav-height) + 24px); }
  .mobile-layout--with-player .main-content { padding-bottom: calc(var(--mobile-player-bottom) + var(--mobile-player-height) + 24px); }
  .mobile-layout .container { width: 100%; padding-inline: var(--mobile-gutter); }
  .mobile-layout .content-wrapper { gap: 0; }
}
</style>
