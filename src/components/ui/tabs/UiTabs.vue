<template>
  <div class="ui-tabs" :class="[`ui-tabs--${variant}`]">
    <div class="ui-tabs__nav" role="tablist">
      <button
        v-for="item in items"
        :key="item.value"
        type="button"
        role="tab"
        class="ui-tabs__tab"
        :class="{ 'is-active': item.value === modelValue, 'is-disabled': item.disabled }"
        :aria-selected="item.value === modelValue"
        :disabled="item.disabled"
        @click="select(item)"
      >
        <UiIcon v-if="item.icon" :name="item.icon" class="ui-tabs__tab-icon" />
        <span>{{ item.label }}</span>
        <span v-if="item.badge != null" class="ui-tabs__tab-badge">{{ item.badge }}</span>
      </button>
    </div>
    <div class="ui-tabs__panel">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import UiIcon from '../icon/UiIcon.vue'
import type { UiTabItem } from '../types'

defineProps<{
  modelValue: string
  items: UiTabItem[]
  /** line：下划线（内容站）；pill：分段胶囊（工作台筛选） */
  variant?: 'line' | 'pill'
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void; (e: 'change', v: string): void }>()

const select = (item: UiTabItem) => {
  if (item.disabled) return
  emit('update:modelValue', item.value)
  emit('change', item.value)
}
</script>

<style scoped lang="scss">
.ui-tabs__nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ui-tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  transition:
    color var(--motion-duration-fast) var(--motion-ease-standard),
    background-color var(--motion-duration-fast) var(--motion-ease-standard);

  &:hover:not(.is-disabled):not(.is-active) {
    color: var(--color-text-primary);
  }
  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ui-tabs__tab-icon {
  font-size: 1.05em;
}

.ui-tabs__tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  color: var(--primary-dark);
  font-size: var(--font-size-xs);
}

// ---- line 变体 ----
.ui-tabs--line {
  .ui-tabs__nav {
    border-bottom: 1px solid var(--color-border-light);
    gap: 18px;
  }
  .ui-tabs__tab {
    position: relative;
    padding: 10px 2px;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: -1px;
      height: 2px;
      border-radius: var(--radius-pill);
      background: linear-gradient(90deg, var(--primary), var(--primary-light));
      transform: scaleX(0);
      transition: transform var(--motion-duration-base) var(--motion-ease-entrance);
    }
    &.is-active {
      color: var(--primary);
      &::after {
        transform: scaleX(1);
      }
    }
  }
}

// ---- pill 变体 ----
.ui-tabs--pill {
  .ui-tabs__nav {
    padding: 4px;
    background: var(--color-surface-muted);
    border-radius: var(--radius-pill);
    gap: 2px;
    display: inline-flex;
  }
  .ui-tabs__tab {
    padding: 7px 16px;
    border-radius: var(--radius-pill);

    &.is-active {
      background: var(--color-surface);
      color: var(--primary);
      box-shadow: var(--shadow-sm);
    }
  }
}

.ui-tabs__panel {
  margin-top: var(--space-md);
}
</style>
