<template>
  <el-segmented
    v-model="proxyValue"
    class="ui-segmented"
    :options="options"
    :disabled="disabled"
    v-bind="$attrs"
    @change="onChange"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElSegmented } from 'element-plus'
import type { UiSegmentedOption } from '../types'

type SegmentedValue = string | number | boolean | undefined

const props = withDefaults(
  defineProps<{
    modelValue: SegmentedValue
    options: UiSegmentedOption[]
    disabled?: boolean
  }>(),
  {
    modelValue: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: SegmentedValue): void
  (e: 'change', value: SegmentedValue): void
}>()

const proxyValue = computed({
  get: () => props.modelValue,
  set: (value: SegmentedValue) => emit('update:modelValue', value),
})

const onChange = (value: SegmentedValue) => emit('change', value)
</script>

<style scoped lang="scss">
.ui-segmented {
  width: fit-content;
}
</style>
