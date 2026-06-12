<template>
  <el-slider
    v-model="proxyValue"
    class="ui-slider"
    :min="min"
    :max="max"
    :step="step"
    :show-input="showInput"
    :show-tooltip="showTooltip"
    :disabled="disabled"
    @change="onChange"
    @input="onInput"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElSlider } from 'element-plus'

const props = withDefaults(
  defineProps<{
    modelValue?: number
    min?: number
    max?: number
    step?: number
    showInput?: boolean
    showTooltip?: boolean
    disabled?: boolean
  }>(),
  {
    modelValue: 0,
    min: 0,
    max: 100,
    step: 1,
    showInput: false,
    showTooltip: true,
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: number): void
  (e: 'change', v: number): void
  (e: 'input', v: number): void
}>()

const proxyValue = computed<number>({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const onChange = (value: number | number[]) => {
  if (typeof value === 'number') emit('change', value)
}

const onInput = (value: number | number[]) => {
  if (typeof value === 'number') emit('input', value)
}
</script>

<style scoped lang="scss">
.ui-slider {
  width: 100%;
}
</style>
