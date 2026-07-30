<template>
  <button
    type="button"
    role="switch"
    class="ui-switch"
    :class="[`ui-switch--${size}`, { 'is-checked': isChecked, 'is-disabled': disabled }]"
    :aria-checked="isChecked"
    :disabled="disabled"
    @click="toggle"
  >
    <span v-if="activeText || inactiveText" class="ui-switch__text">
      {{ isChecked ? activeText : inactiveText }}
    </span>
    <span class="ui-switch__track">
      <span class="ui-switch__thumb" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * UiSwitch —— 开关。支持任意 active/inactive 值（默认 true/false），
 * 兼容历史 el-switch 的 :active-value="1" :inactive-value="0" 用法。
 */
const props = withDefaults(
  defineProps<{
    modelValue?: boolean | string | number | null
    activeValue?: boolean | string | number
    inactiveValue?: boolean | string | number
    activeText?: string
    inactiveText?: string
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    activeValue: true,
    inactiveValue: false,
    activeText: '',
    inactiveText: '',
    disabled: false,
    size: 'md',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean | string | number | null | undefined): void
  (e: 'change', v: boolean | string | number | null | undefined): void
}>()

const isChecked = computed(() => props.modelValue === props.activeValue)

const toggle = () => {
  if (props.disabled) return
  const next = isChecked.value ? props.inactiveValue : props.activeValue
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<style scoped lang="scss">
.ui-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font: inherit;

  &.is-disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.ui-switch__text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.ui-switch__track {
  position: relative;
  display: inline-block;
  background: var(--color-border);
  border-radius: var(--radius-pill);
  transition: background-color var(--motion-duration-base) var(--motion-ease-standard);
}

.ui-switch--md .ui-switch__track {
  width: 44px;
  height: 24px;
}
.ui-switch--sm .ui-switch__track {
  width: 36px;
  height: 20px;
}

.ui-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform var(--motion-duration-base) var(--motion-ease-spring);
}
.ui-switch--sm .ui-switch__thumb {
  width: 16px;
  height: 16px;
}

.ui-switch.is-checked .ui-switch__track {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
}
.ui-switch.is-checked .ui-switch__thumb {
  transform: translateX(20px);
}
.ui-switch--sm.is-checked .ui-switch__thumb {
  transform: translateX(16px);
}
</style>
