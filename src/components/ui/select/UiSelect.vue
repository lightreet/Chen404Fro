<template>
  <el-select
    v-model="proxyValue"
    class="ui-select"
    :class="`ui-select--${size}`"
    :placeholder="placeholder"
    :clearable="clearable"
    :filterable="filterable"
    :multiple="multiple"
    :disabled="disabled"
    :collapse-tags="collapseTags"
    @change="onChange"
  >
    <template v-if="options">
      <el-option
        v-for="opt in options"
        :key="String(opt.value)"
        :label="opt.label"
        :value="opt.value"
        :disabled="opt.disabled"
      />
    </template>
    <slot />
  </el-select>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElSelect, ElOption } from 'element-plus'
import type { UiSelectOption } from '../types'

type SelectValue = string | number | boolean | Array<string | number | boolean> | null | undefined

/**
 * UiSelect —— 选择器。
 * 短期内部复用 Element Plus 的 el-select（下拉定位 / filterable / 多选已成熟），
 * 对外暴露 options 数组 API；也支持继续用默认插槽传 el-option。
 */
const props = defineProps<{
  modelValue: SelectValue
  options?: UiSelectOption[]
  placeholder?: string
  clearable?: boolean
  filterable?: boolean
  multiple?: boolean
  disabled?: boolean
  collapseTags?: boolean
  size?: 'sm' | 'md' | 'lg'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: SelectValue): void
  (e: 'change', v: SelectValue): void
}>()

const proxyValue = computed<SelectValue>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const onChange = (v: SelectValue) => emit('change', v)
</script>

<style scoped lang="scss">
.ui-select {
  width: 100%;
}
</style>
