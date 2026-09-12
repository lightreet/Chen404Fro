<template>
  <el-radio-group
    v-model="proxyValue"
    class="ui-radio-group"
    :class="[`ui-radio-group--${variant}`, `ui-radio-group--${size}`]"
    :disabled="disabled"
    @change="onChange"
  >
    <template v-if="options?.length">
      <component
        :is="variant === 'plain' ? ElRadio : ElRadioButton"
        v-for="option in options"
        :key="String(option.value)"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </component>
    </template>
    <slot />
  </el-radio-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElRadio, ElRadioButton, ElRadioGroup } from 'element-plus'
import type { UiRadioOption } from '../types'

type RadioValue = string | number | boolean | undefined

const props = withDefaults(
  defineProps<{
    modelValue: RadioValue
    options?: UiRadioOption[]
    variant?: 'plain' | 'button' | 'line'
    size?: 'md' | 'lg'
    disabled?: boolean
  }>(),
  {
    modelValue: undefined,
    options: undefined,
    variant: 'plain',
    size: 'md',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: RadioValue): void
  (e: 'change', value: RadioValue): void
}>()

const proxyValue = computed({
  get: () => props.modelValue,
  set: (value: RadioValue) => emit('update:modelValue', value),
})

const onChange = (value: RadioValue) => emit('change', value)
</script>

<style scoped lang="scss">
.ui-radio-group {
  --ui-radio-height: var(--control-height-md);
  width: fit-content;
}
.ui-radio-group--lg { --ui-radio-height: var(--control-height-lg); }

.ui-radio-group--button :deep(.el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--ui-radio-height);
  padding-block: 0;
}

.ui-radio-group--line :deep(.el-radio-button .el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--ui-radio-height);
  padding: 0 14px;
  border: 0;
  border-bottom: 2px solid var(--color-border-light);
  border-radius: 0;
  outline: none;
  background: transparent;
  box-shadow: none;
  color: var(--color-text-secondary);
  transition: color var(--motion-duration-fast), border-color var(--motion-duration-fast);
}
.ui-radio-group--line :deep(.el-radio-button.is-active .el-radio-button__original-radio:not(:disabled) + .el-radio-button__inner) {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
  background: transparent;
  box-shadow: none;
}
.ui-radio-group--line :deep(.el-radio-button:not(.is-disabled):hover .el-radio-button__inner) {
  color: var(--color-accent);
}
.ui-radio-group--line :deep(.el-radio-button__original-radio:focus-visible + .el-radio-button__inner) {
  border-left: 0;
  border-radius: 0;
  outline: 2px solid var(--color-accent-readable);
  outline-offset: 2px;
}
.ui-radio-group--line :deep(.el-radio-button.is-disabled .el-radio-button__inner) {
  color: var(--color-text-tertiary);
  background: transparent;
  box-shadow: none;
  cursor: not-allowed;
}
@media (prefers-reduced-motion: reduce) {
  .ui-radio-group--line :deep(.el-radio-button .el-radio-button__inner) { transition: none; }
}
</style>
