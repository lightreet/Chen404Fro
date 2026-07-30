<template>
  <component
    :is="tag"
    class="ui-button"
    :class="[
      `ui-button--${variant}`,
      `ui-button--${size}`,
      {
        'ui-button--block': block,
        'ui-button--round': round,
        'ui-button--icon-only': iconOnly,
        'is-loading': loading,
        'is-disabled': disabled,
      },
    ]"
    :type="tag === 'button' ? nativeType : undefined"
    :disabled="tag === 'button' ? disabled || loading : undefined"
    :aria-disabled="disabled || loading ? 'true' : undefined"
    @click="handleClick"
  >
    <UiIcon v-if="loading" name="loading" spin class="ui-button__spinner" />
    <UiIcon v-else-if="icon" :name="icon" class="ui-button__icon" />
    <span v-if="$slots.default" class="ui-button__label"><slot /></span>
  </component>
</template>

<script setup lang="ts">
import UiIcon from '../icon/UiIcon.vue'
import type { UiButtonVariant } from '../types'

const props = withDefaults(
  defineProps<{
    variant?: UiButtonVariant
    size?: 'sm' | 'md' | 'lg'
    /** 语义图标名，渲染在文字前 */
    icon?: string
    /** 仅图标按钮（正方形） */
    iconOnly?: boolean
    loading?: boolean
    disabled?: boolean
    block?: boolean
    round?: boolean
    nativeType?: 'button' | 'submit' | 'reset'
    /** 渲染为链接时传入；否则为 <button> */
    tag?: 'button' | 'a'
  }>(),
  {
    variant: 'secondary',
    size: 'md',
    icon: undefined,
    iconOnly: false,
    loading: false,
    disabled: false,
    block: false,
    round: false,
    nativeType: 'button',
    tag: 'button',
  },
)

const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()

const handleClick = (ev: MouseEvent) => {
  if (props.disabled || props.loading) {
    ev.preventDefault()
    ev.stopPropagation()
    return
  }
  emit('click', ev)
}
</script>

<style scoped lang="scss">
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  text-decoration: none;
  transition:
    transform var(--motion-duration-fast) var(--motion-ease-standard),
    box-shadow var(--motion-duration-base) var(--motion-ease-standard),
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    color var(--motion-duration-fast) var(--motion-ease-standard);

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  &.is-disabled {
    opacity: 0.55;
    cursor: not-allowed;
    pointer-events: none;
  }
  &.is-loading {
    cursor: progress;
  }
}

// ---- 尺寸 ----
.ui-button--sm {
  height: var(--control-height-sm);
  padding: 0 12px;
  font-size: var(--font-size-sm);
}
.ui-button--md {
  height: var(--control-height-md);
  padding: 0 16px;
  font-size: var(--font-size-base);
}
.ui-button--lg {
  height: var(--control-height-lg);
  padding: 0 22px;
  font-size: var(--font-size-md);
}

.ui-button--block {
  display: flex;
  width: 100%;
}
.ui-button--round {
  border-radius: var(--radius-pill);
}
.ui-button--icon-only {
  padding: 0;
  aspect-ratio: 1;
  &.ui-button--sm {
    width: var(--control-height-sm);
  }
  &.ui-button--md {
    width: var(--control-height-md);
  }
  &.ui-button--lg {
    width: var(--control-height-lg);
  }
}

.ui-button__icon,
.ui-button__spinner {
  font-size: 1.1em;
}

// ---- 变体 ----
.ui-button--primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: #fff;
  &:not(.is-disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px color-mix(in srgb, var(--primary) 32%, transparent);
  }
  &:not(.is-disabled):active {
    transform: translateY(0);
  }
}

.ui-button--secondary {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-primary);
  &:not(.is-disabled):hover {
    border-color: var(--primary-light);
    color: var(--primary);
    transform: translateY(-1px);
  }
  &:not(.is-disabled):active {
    transform: translateY(0);
  }
}

.ui-button--ghost {
  background: var(--color-accent-soft);
  color: var(--primary);
  &:not(.is-disabled):hover {
    background: color-mix(in srgb, var(--primary) 20%, transparent);
  }
}

.ui-button--text {
  background: transparent;
  color: var(--color-text-secondary);
  padding-left: 8px;
  padding-right: 8px;
  &:not(.is-disabled):hover {
    color: var(--primary);
    background: var(--color-accent-soft);
  }
}

.ui-button--danger {
  background: var(--color-danger);
  color: #fff;
  &:not(.is-disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px color-mix(in srgb, var(--color-danger) 32%, transparent);
  }
}

.ui-button--success {
  background: var(--color-success);
  color: #fff;
  &:not(.is-disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px color-mix(in srgb, var(--color-success) 32%, transparent);
  }
}
</style>
