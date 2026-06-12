<template>
  <el-radio-group
    v-model="proxyValue"
    class="ui-radio-group"
    :class="`ui-radio-group--${variant}`"
    :disabled="disabled"
    @change="onChange"
  >
    <template v-if="options?.length">
      <component
        :is="variant === 'button' ? ElRadioButton : ElRadio"
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
    variant?: 'plain' | 'button'
    disabled?: boolean
  }>(),
  {
    modelValue: undefined,
    options: undefined,
    variant: 'plain',
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
  width: fit-content;
}
</style>
