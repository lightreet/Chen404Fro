<template>
  <el-divider class="ui-divider" v-bind="$attrs">
    <slot />
  </el-divider>
</template>

<script setup lang="ts">
import { ElDivider } from 'element-plus'
</script>
