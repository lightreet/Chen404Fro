<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" :key="mobileUploadRouteKey" />
    </transition>
  </router-view>

  <Live2D v-if="showAssistant" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/stores';
import Live2D from '@/components/Live2D/Live2D.vue';
import { useLayoutMobile } from '@/composables/useLayoutMobile';

const appStore = useAppStore();
const route = useRoute();
const { isMobile } = useLayoutMobile();

// 扫描另一张二维码即进入新的上传会话，同一路径的 hash 导航也要重建手机页面。
const mobileUploadRouteKey = computed(() => route.name === 'TravelMobileUpload'
  ? new URLSearchParams(route.hash.slice(1)).get('session') || 'invalid-upload'
  : undefined);

const showAssistant = computed(() => {
  if (isMobile.value) return false;

  const path = route.path;
  return !(
    path.startsWith('/admin')
    || path.startsWith('/reader/')
    || path === '/bookshelf'
    || path === '/login'
    || path === '/register'
    || path === '/forgot-password'
    || path === '/memory-map/mobile-upload'
  );
});

// 在子页面挂载前恢复本地展示偏好，避免主题或樱花强度闪烁
appStore.initDisplayPreferences();
</script>

<style>
/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
