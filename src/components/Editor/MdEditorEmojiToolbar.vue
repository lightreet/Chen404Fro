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
      <EmojiPickerPanel scene="article" class="article-editor-emoji-panel" @select="onPick" />
    </template>
  </DropdownToolbar>
</template>

<script setup lang="ts">
import { reactive, defineAsyncComponent } from 'vue';
import type { Insert } from 'md-editor-v3';

/** 动态从 md-editor 包加载，避免文章编辑路由的初始 chunk 静态依赖 vendor-md-editor */
const DropdownToolbar = defineAsyncComponent(() =>
  import('md-editor-v3').then((m) => m.DropdownToolbar)
);
import EmojiPickerPanel from '@/components/Emoji/EmojiPickerPanel.vue';
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
  margin: 0;
}
</style>
