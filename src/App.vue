<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>

  <Live2D v-if="showAssistant" :compact-only="isMobile" />
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

const showAssistant = computed(() => {
  const path = route.path;
  return !(
    path.startsWith('/admin')
    || path === '/login'
    || path === '/register'
    || path === '/forgot-password'
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
