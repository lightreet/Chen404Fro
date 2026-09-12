<template>
  <UiDialog v-model="open" title="播放队列" size="sm" panel-class="music-queue-dialog">
    <MusicQueueContent :active="open" @close="open = false" />
  </UiDialog>
</template>

<script setup lang="ts">
import { UiDialog } from '@/components/ui'
import MusicQueueContent from './MusicQueueContent.vue'

const open = defineModel<boolean>({ required: true })
</script>

<style lang="scss">
.music-queue-dialog .ui-dialog__body {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
