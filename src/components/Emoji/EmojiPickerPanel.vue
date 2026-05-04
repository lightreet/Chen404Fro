<template>
  <div class="emoji-picker-panel">
    <button
      v-for="emoji in sceneEmojis"
      :key="emoji.id"
      type="button"
      class="emoji-picker-item"
      :title="emoji.label"
      @click="emit('select', emoji)"
    >
      <img
        v-if="emoji.type === 'image' && emoji.asset"
        :src="emoji.asset"
        :alt="emoji.label"
        class="emoji-picker-image"
      />
      <span v-else>{{ emoji.unicode || '\u{1F642}' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { queryByScene } from '@/emoji/registry';
import type { EmojiItem, EmojiScene } from '@/emoji/types';

const props = defineProps<{
  scene: EmojiScene;
}>();

const emit = defineEmits<{
  select: [emoji: EmojiItem];
}>();

const sceneEmojis = computed(() => queryByScene(props.scene));
</script>

<style scoped>
.emoji-picker-panel {
  border: 1px solid var(--border-light, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-secondary, #f8fafc);
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(38px, 38px));
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  align-content: start;
  box-sizing: border-box;
}

.emoji-picker-item {
  width: 38px;
  height: 38px;
  border: 1px solid var(--border-light, #e2e8f0);
  border-radius: var(--radius-sm, 6px);
  background: var(--bg-primary, #fff);
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
  font-family:
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Noto Color Emoji',
    sans-serif;
  text-rendering: optimizeLegibility;
  transition: border-color 0.15s, background 0.15s;
}

.emoji-picker-item:hover {
  border-color: var(--primary, #6366f1);
  background: var(--bg-primary, #fff);
}

.emoji-picker-image {
  width: 26px;
  height: 26px;
  object-fit: contain;
}
</style>
