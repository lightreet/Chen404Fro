<template>
  <el-input-number
    v-model="proxyValue"
    class="ui-number-field"
    :min="min"
    :max="max"
    :step="step"
    :step-strictly="stepStrictly"
    :precision="precision"
    :placeholder="placeholder"
    :disabled="disabled"
    :controls="controls"
    :controls-position="controlsPosition"
    @change="onChange"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElInputNumber } from 'element-plus'

type NumberValue = number | null | undefined

const props = withDefaults(
  defineProps<{
    modelValue: NumberValue
    min?: number
    max?: number
    step?: number
    stepStrictly?: boolean
    precision?: number
    placeholder?: string
    disabled?: boolean
    controls?: boolean
    controlsPosition?: '' | 'right'
  }>(),
  {
    modelValue: undefined,
    min: undefined,
    max: undefined,
    step: 1,
    stepStrictly: false,
    precision: undefined,
    placeholder: '',
    disabled: false,
    controls: true,
    controlsPosition: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: NumberValue): void
  (e: 'change', v: NumberValue): void
}>()

const proxyValue = computed<NumberValue>({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const onChange = (value: NumberValue) => emit('change', value)
</script>

<style scoped lang="scss">
.ui-number-field {
  width: 100%;
}
</style>
