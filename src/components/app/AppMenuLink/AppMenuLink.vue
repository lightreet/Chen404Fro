<template>
  <RouterLink :to="to" class="app-menu-link">
    <span class="app-menu-link__icon"><UiIcon :name="icon" :size="22" /></span>
    <span class="app-menu-link__copy"><strong>{{ label }}</strong><small v-if="description">{{ description }}</small></span>
    <UiIcon name="arrow-right" :size="20" />
  </RouterLink>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import { UiIcon } from '@/components/ui';
defineProps<{ to: RouteLocationRaw; icon: string; label: string; description?: string }>();
</script>

<style scoped lang="scss">
.app-menu-link { display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 12px 16px; color: var(--color-text-primary); border-radius: var(--mobile-card-radius); background: var(--color-surface); }
.app-menu-link__icon { width: 32px; display: grid; place-items: center; color: var(--color-text-secondary); }
.app-menu-link__copy { flex: 1; min-width: 0; }
.app-menu-link strong { display: block; font-size: 15px; font-weight: 500; }
.app-menu-link small { display: block; font-size: 13px; color: var(--color-text-secondary); margin-top: 3px; }
.app-menu-link > .ui-icon { color: var(--color-text-secondary); }
.app-menu-link { border: var(--content-card-border, none); }
</style>
