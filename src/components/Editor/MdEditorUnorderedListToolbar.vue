<template>
  <NormalToolbar
    :title="title"
    :disabled="disabled"
    @on-click="onClick"
  >
    <template #default>
      <span class="unordered-list-icon" aria-hidden="true">
        <span class="unordered-list-icon__dot"></span>
        <span class="unordered-list-icon__line"></span>
      </span>
      <div v-if="showToolbarName" class="md-editor-toolbar-item-name">{{ title }}</div>
    </template>
  </NormalToolbar>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import type { Insert } from 'md-editor-v3';

const NormalToolbar = defineAsyncComponent(() =>
  import('md-editor-v3').then((m) => m.NormalToolbar)
);

const props = withDefaults(
  defineProps<{
    /** 由 MdEditor defToolbars 克隆时注入；单独挂载时可能为空 */
    insert?: Insert;
    title?: string;
    disabled?: boolean;
    showToolbarName?: boolean;
  }>(),
  {
    title: '无序列表',
  }
);

function buildUnorderedList(selectedText: string) {
  const normalized = selectedText.replace(/\r\n/g, '\n');
  if (normalized.trim().length === 0) {
    return '- 列表项';
  }

  return normalized
    .split('\n')
    .map((line) => {
      if (line.trim().length === 0) {
        return line;
      }
      if (/^\s*[-*+]\s+/.test(line)) {
        return line;
      }
      return `- ${line}`;
    })
    .join('\n');
}

function onClick() {
  if (!props.insert) return;
  props.insert((selectedText = '') => ({
    targetValue: buildUnorderedList(selectedText),
  }));
}
</script>

<style scoped>
.unordered-list-icon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: 18px;
  height: 14px;
}

.unordered-list-icon__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  box-shadow:
    0 -5px 0 currentColor,
    0 5px 0 currentColor;
  flex: 0 0 auto;
}

.unordered-list-icon__line {
  flex: 1;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  box-shadow:
    0 -5px 0 currentColor,
    0 5px 0 currentColor;
}
</style>
