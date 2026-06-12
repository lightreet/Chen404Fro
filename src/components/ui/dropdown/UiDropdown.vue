<template>
  <el-dropdown class="ui-dropdown" v-bind="$attrs" @command="onCommand">
    <slot />
    <template v-if="$slots.dropdown" #dropdown>
      <slot name="dropdown" />
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ElDropdown } from 'element-plus'

const emit = defineEmits<{
  (e: 'command', command: string | number | object): void
}>()

const onCommand = (command: string | number | object) => emit('command', command)
</script>
