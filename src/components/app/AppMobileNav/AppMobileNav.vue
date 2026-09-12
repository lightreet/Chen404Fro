<template>
  <nav class="app-mobile-nav" aria-label="底部导航">
    <RouterLink
      v-for="item in navigation.items"
      :key="item.key"
      :to="item.key === 'profile' && !userStore.isLoggedIn ? '/login?redirect=/profile' : item.path"
      class="app-mobile-nav__item"
      :class="{ 'is-active': route.path === item.path }"
      :aria-current="route.path === item.path ? 'page' : undefined"
    >
      <span class="app-mobile-nav__icon"><UiIcon :name="item.icon" :size="24" /></span>
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { UiIcon } from '@/components/ui';
import { useMobileNavigationStore } from '@/stores/mobile-navigation';
import { useUserStore } from '@/stores/user';
const route = useRoute();
const navigation = useMobileNavigationStore();
const userStore = useUserStore();
</script>

<style scoped lang="scss">
.app-mobile-nav {
  position: fixed;
  inset: auto 0 0;
  z-index: var(--z-sticky);
  display: flex;
  min-height: var(--mobile-nav-height);
  padding: 6px 4px calc(8px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--color-border-light);
  background: var(--color-surface);
}
.app-mobile-nav__item { min-width: 0; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; color: var(--color-text-secondary); font-size: 12px; line-height: 18px; }
.app-mobile-nav__icon { display: grid; place-items: center; width: 46px; height: 30px; border-radius: var(--radius-pill); }
.app-mobile-nav__item.is-active { color: var(--color-accent); font-weight: 600; }
.is-active .app-mobile-nav__icon { background: var(--control-selected-background); color: var(--control-selected-text); }
</style>
