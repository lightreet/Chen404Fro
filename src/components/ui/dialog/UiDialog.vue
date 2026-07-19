<template>
  <Teleport to="body">
    <Transition name="m-fade">
      <div
        v-if="modelValue"
        class="ui-dialog__mask"
        @click.self="onMaskClick"
      >
        <Transition name="m-panel" appear>
          <div
            v-if="modelValue"
            class="ui-dialog"
            :class="[`ui-dialog--${size}`, panelClass]"
            role="dialog"
            aria-modal="true"
            :style="widthStyle"
          >
            <header v-if="title || $slots.header || showClose" class="ui-dialog__header">
              <div class="ui-dialog__title">
                <slot name="header">{{ title }}</slot>
              </div>
              <button
                v-if="showClose"
                type="button"
                class="ui-dialog__close"
                aria-label="关闭"
                @click="close"
              >
                <UiIcon name="close" />
              </button>
            </header>

            <div class="ui-dialog__body">
              <slot />
            </div>

            <footer v-if="$slots.footer" class="ui-dialog__footer">
              <slot name="footer" />
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import UiIcon from '../icon/UiIcon.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    /** 预设宽度档位；width 优先 */
    size?: 'sm' | 'md' | 'lg' | 'xl'
    /** 自定义宽度，如 '720px' */
    width?: string
    /** 业务弹窗面板类名 */
    panelClass?: string
    showClose?: boolean
    /** 点遮罩关闭 */
    closeOnClickModal?: boolean
    /** 锁定 body 滚动 */
    lockScroll?: boolean
  }>(),
  {
    title: undefined,
    size: 'md',
    width: undefined,
    showClose: true,
    closeOnClickModal: true,
    lockScroll: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'close'): void
}>()

const widthStyle = computed(() => (props.width ? { width: props.width, maxWidth: '92vw' } : undefined))

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}
const onMaskClick = () => {
  if (props.closeOnClickModal) close()
}

watch(
  () => props.modelValue,
  (open) => {
    if (!props.lockScroll || typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
  },
)
</script>

<style scoped lang="scss">
.ui-dialog__mask {
  position: fixed;
  inset: 0;
  z-index: var(--z-dialog);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(24px, 8vh, 96px) 16px 48px;
  overflow-y: auto;
  background: color-mix(in srgb, #1a1320 48%, transparent);
  backdrop-filter: blur(3px);
}

.ui-dialog {
  width: 100%;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 96px);
}

.ui-dialog--sm {
  max-width: 420px;
}
.ui-dialog--md {
  max-width: 560px;
}
.ui-dialog--lg {
  max-width: 760px;
}
.ui-dialog--xl {
  max-width: 1040px;
}

.ui-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-lg) var(--space-md);
}

.ui-dialog__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.ui-dialog__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-size: 18px;
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    color var(--motion-duration-fast) var(--motion-ease-standard);

  &:hover {
    background: var(--color-surface-muted);
    color: var(--color-text-primary);
  }
}

.ui-dialog__body {
  padding: 0 var(--space-lg) var(--space-lg);
  overflow-y: auto;
  color: var(--color-text-primary);
}

.ui-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg) var(--space-lg);
  border-top: 1px solid var(--color-border-light);
}
</style>
