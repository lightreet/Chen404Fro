<template>
  <div class="app-action-bar" :class="{ 'is-sticky': sticky }">
    <div class="app-action-bar__start">
      <slot name="start" />
    </div>
    <div class="app-action-bar__end">
      <slot name="end" />
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 是否吸顶（用于编辑页底部/顶部操作条） */
    sticky?: boolean
  }>(),
  { sticky: false },
)
</script>

<style scoped lang="scss">
.app-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;

  &.is-sticky {
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
    padding: var(--space-sm) var(--space-md);
    background: var(--color-surface-glass);
    backdrop-filter: blur(10px);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-light);
  }
}

.app-action-bar__start,
.app-action-bar__end {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  min-width: 0;
}

.app-action-bar__end {
  justify-content: flex-end;
}
</style>
