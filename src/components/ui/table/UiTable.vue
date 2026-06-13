<template>
  <el-table class="ui-table" v-bind="$attrs" v-loading="loading">
    <slot />
  </el-table>
</template>

<script setup lang="ts">
import { ElTable } from 'element-plus'

withDefaults(
  defineProps<{
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)
</script>

<style scoped lang="scss">
.ui-table {
  width: 100%;
}
</style>
