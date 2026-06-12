<template>
  <el-dropdown-item class="ui-dropdown-item" v-bind="$attrs">
    <slot />
  </el-dropdown-item>
</template>

<script setup lang="ts">
import { ElDropdownItem } from 'element-plus'
</script>
