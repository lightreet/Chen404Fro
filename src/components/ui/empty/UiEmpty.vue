<template>
  <div class="ui-empty" :class="`ui-empty--${size}`">
    <div class="ui-empty__icon">
      <slot name="icon">
        <UiIcon :name="icon" />
      </slot>
    </div>
    <p class="ui-empty__title">{{ title }}</p>
    <p v-if="description || $slots.description" class="ui-empty__desc">
      <slot name="description">{{ description }}</slot>
    </p>
    <div v-if="$slots.action" class="ui-empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import UiIcon from '../icon/UiIcon.vue'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    title: '暂无内容',
    description: undefined,
    icon: 'empty',
    size: 'md',
  },
)
</script>

<style scoped lang="scss">
.ui-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  color: var(--color-text-secondary);
}

.ui-empty--sm {
  padding: var(--space-lg);
}
.ui-empty--md {
  padding: var(--space-2xl) var(--space-lg);
}
.ui-empty--lg {
  padding: calc(var(--space-2xl) * 1.5) var(--space-lg);
}

.ui-empty__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-pill);
  background: var(--color-surface-muted);
  color: var(--color-text-tertiary);
  font-size: 30px;
  margin-bottom: 4px;
}

.ui-empty--sm .ui-empty__icon {
  width: 48px;
  height: 48px;
  font-size: 24px;
}

.ui-empty__title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.ui-empty__desc {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  max-width: 360px;
}

.ui-empty__action {
  margin-top: 8px;
}
</style>
