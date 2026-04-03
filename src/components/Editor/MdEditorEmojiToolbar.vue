<template>
  <DropdownToolbar
    :title="title"
    :visible="state.visible"
    :disabled="disabled"
    @on-change="onVisibleChange"
  >
    <template #default>
      <span class="article-editor-emoji-icon" aria-hidden="true">😊</span>
      <div v-if="showToolbarName" class="md-editor-toolbar-item-name">{{ title }}</div>
    </template>
    <template #overlay>
      <div class="article-editor-emoji-panel">
        <button
          v-for="emoji in sceneEmojis"
          :key="emoji.id"
          type="button"
          class="article-editor-emoji-btn"
          :title="emoji.label"
          @click="onPick(emoji)"
        >
          {{ emoji.unicode || '🙂' }}
        </button>
      </div>
    </template>
  </DropdownToolbar>
</template>

<script setup lang="ts">
import { computed, reactive, defineAsyncComponent } from 'vue';
import type { Insert } from 'md-editor-v3';

/** 动态从 md-editor 包加载，避免文章编辑路由的初始 chunk 静态依赖 vendor-md-editor */
const DropdownToolbar = defineAsyncComponent(() =>
  import('md-editor-v3').then((m) => m.DropdownToolbar)
);
import { queryByScene } from '@/emoji/registry';
import type { EmojiItem } from '@/emoji/types';
import { emojiInsertPayload } from '@/emoji/insertPayload';

const props = withDefaults(
  defineProps<{
    /** 由 MdEditor defToolbars 克隆时注入；单独挂载时可能为空 */
    insert?: Insert;
    title?: string;
    disabled?: boolean;
    showToolbarName?: boolean;
    /** false：插入后光标在表情之后，与评论区体验一致 */
    selectAfterInsert?: boolean;
  }>(),
  {
    title: '表情',
    selectAfterInsert: false,
  }
);

const state = reactive({ visible: false });

const sceneEmojis = computed(() => queryByScene('article'));

function onVisibleChange(visible: boolean) {
  state.visible = visible;
}

function onPick(item: EmojiItem) {
  if (!props.insert) return;
  const text = emojiInsertPayload(item);
  props.insert(() => ({
    targetValue: text,
    select: props.selectAfterInsert,
    deviationStart: 0,
    deviationEnd: 0,
  }));
  state.visible = false;
}
</script>

<style scoped>
.article-editor-emoji-icon {
  font-size: 16px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.article-editor-emoji-panel {
  width: 320px;
  max-height: 220px;
  overflow-y: auto;
  padding: 8px;
  margin: 0;
  border: 1px solid var(--border-light, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-secondary, #f8fafc);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  box-sizing: border-box;
}

.article-editor-emoji-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-light, #e2e8f0);
  border-radius: var(--radius-sm, 6px);
  background: var(--bg-primary, #fff);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, background 0.15s;
}

.article-editor-emoji-btn:hover {
  border-color: var(--primary, #6366f1);
  background: var(--bg-secondary, #f1f5f9);
}
</style>
