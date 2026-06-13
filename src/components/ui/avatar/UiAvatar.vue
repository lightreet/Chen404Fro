<template>
  <el-avatar class="ui-avatar" v-bind="$attrs">
    <slot />
  </el-avatar>
</template>

<script setup lang="ts">
import { ElAvatar } from 'element-plus'
</script>
