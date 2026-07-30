<template>
  <span class="ui-badge" :class="[`ui-badge--${tone}`, `ui-badge--${size}`, { 'ui-badge--dot': dot }]">
    <span v-if="dot" class="ui-badge__dot" />
    <UiIcon v-else-if="icon" :name="icon" class="ui-badge__icon" />
    <slot />
  </span>
</template>

<script setup lang="ts">
import UiIcon from '../icon/UiIcon.vue'
import type { AccentTone } from '@/design/tokens'

withDefaults(
  defineProps<{
    tone?: AccentTone
    size?: 'sm' | 'md'
    icon?: string
    /** 是否在文字前显示状态圆点 */
    dot?: boolean
  }>(),
  {
    tone: 'neutral',
    size: 'md',
    icon: undefined,
    dot: false,
  },
)
</script>

<style scoped lang="scss">
.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--radius-pill);
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.ui-badge--sm {
  padding: 3px 8px;
  font-size: var(--font-size-xs);
}
.ui-badge--md {
  padding: 5px 11px;
  font-size: var(--font-size-sm);
}

.ui-badge__icon {
  font-size: 1.05em;
}

.ui-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.ui-badge--accent {
  background: var(--color-accent-soft);
  color: var(--primary-dark);
}
.ui-badge--success {
  background: var(--color-success-soft);
  color: var(--color-success);
}
.ui-badge--warning {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}
.ui-badge--danger {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.ui-badge--info {
  background: var(--color-info-soft);
  color: var(--color-info);
}
.ui-badge--neutral {
  background: var(--color-neutral-soft);
  color: var(--color-text-secondary);
}
</style>
