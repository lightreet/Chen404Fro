<template>
  <el-form-item class="ui-form-field" v-bind="$attrs">
    <template v-if="$slots.label" #label>
      <slot name="label" />
    </template>
    <slot />
  </el-form-item>
</template>

<script setup lang="ts">
import { ElFormItem } from 'element-plus'
</script>

<style scoped lang="scss">
.ui-form-field {
  width: 100%;
}
</style>
