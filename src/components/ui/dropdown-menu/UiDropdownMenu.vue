<template>
  <el-dropdown-menu class="ui-dropdown-menu" v-bind="$attrs">
    <slot />
  </el-dropdown-menu>
</template>

<script setup lang="ts">
import { ElDropdownMenu } from 'element-plus'
</script>
