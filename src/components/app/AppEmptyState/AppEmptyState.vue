<template>
  <UiEmpty :title="title" :description="description" :icon="icon" :size="size">
    <template v-if="$slots.icon" #icon><slot name="icon" /></template>
    <template v-if="$slots.action" #action><slot name="action" /></template>
    <template v-if="$slots.description" #description><slot name="description" /></template>
  </UiEmpty>
</template>

<script setup lang="ts">
import UiEmpty from '@/components/ui/empty/UiEmpty.vue'

/**
 * AppEmptyState —— 业务空态。
 * 当前直接复用 UiEmpty，预留位置承接「带插画/带引导」的品牌化空态。
 */
withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    title: '暂无内容',
    description: undefined,
    icon: 'empty',
    size: 'md',
  },
)
</script>
