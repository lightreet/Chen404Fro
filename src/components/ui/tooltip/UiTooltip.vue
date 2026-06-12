<template>
  <el-tooltip
    :content="content"
    :placement="placement"
    :disabled="disabled"
    :show-after="showAfter"
    effect="customized"
    popper-class="ui-tooltip__popper"
  >
    <slot />
    <template v-if="$slots.content" #content>
      <slot name="content" />
    </template>
  </el-tooltip>
</template>

<script setup lang="ts">
import { ElTooltip } from 'element-plus'

withDefaults(
  defineProps<{
    content?: string
    placement?:
      | 'top'
      | 'top-start'
      | 'top-end'
      | 'bottom'
      | 'bottom-start'
      | 'bottom-end'
      | 'left'
      | 'right'
    disabled?: boolean
    showAfter?: number
  }>(),
  {
    content: '',
    placement: 'top',
    disabled: false,
    showAfter: 120,
  },
)
</script>

<style>
/* 非 scoped：作用于 teleport 出去的 popper */
.ui-tooltip__popper.el-popper {
  --el-text-color-primary: #fff;
  background: color-mix(in srgb, #2a2030 92%, transparent) !important;
  color: #fff !important;
  border: none !important;
  border-radius: 10px !important;
  padding: 7px 11px !important;
  font-size: var(--font-size-xs) !important;
  box-shadow: var(--shadow-md) !important;
}
.ui-tooltip__popper.el-popper .el-popper__arrow::before {
  background: color-mix(in srgb, #2a2030 92%, transparent) !important;
  border: none !important;
}
</style>
