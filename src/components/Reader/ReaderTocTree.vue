<template>
  <ul ref="treeRef" class="toc-tree" :class="{ 'is-root': root }">
    <li v-for="item in items" :key="String(item.id)">
      <button
        type="button"
        :data-chapter-id="item.chapterId == null ? undefined : String(item.chapterId)"
        :class="{ 'is-active': String(item.chapterId || '') === String(activeChapterId || '') }"
        :disabled="!item.chapterId"
        @click="item.chapterId && emit('select', item.chapterId)"
      >
        <span>{{ item.label }}</span>
        <span class="toc-tree__meta">
          <small v-if="String(item.chapterId || '') === String(activeChapterId || '')">当前</small>
          <small v-else-if="item.children?.length">{{ item.children.length }}</small>
        </span>
      </button>
      <ReaderTocTree
        v-if="item.children?.length"
        :items="item.children"
        :active-chapter-id="activeChapterId"
        @select="emit('select', $event)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { ReaderId, ReaderTocItem } from '@/types/reader'

withDefaults(defineProps<{
  items: ReaderTocItem[]
  activeChapterId?: ReaderId
  root?: boolean
}>(), {
  activeChapterId: undefined,
  root: false,
})
const emit = defineEmits<{ (event: 'select', chapterId: ReaderId): void }>()
const treeRef = ref<HTMLElement>()

const locateChapter = async (chapterId?: ReaderId) => {
  if (chapterId == null) return false
  await nextTick()
  const target = [...(treeRef.value?.querySelectorAll<HTMLElement>('[data-chapter-id]') || [])]
    .find(item => item.dataset.chapterId === String(chapterId))
  if (!target) return false
  target.scrollIntoView({
    block: 'center',
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
  target.focus({ preventScroll: true })
  return true
}

defineExpose({ locateChapter })
</script>

<style scoped lang="scss">
.toc-tree {
  display: grid;
  min-width: 0;
  gap: 2px;
  margin: 2px 0 2px 14px;
  padding: 0 0 0 12px;
  border-left: 1px solid var(--color-border-light);
  list-style: none;
}

.toc-tree li {
  min-width: 0;
}

.toc-tree.is-root {
  margin-left: 0;
  padding-left: 0;
  border-left: 0;
}

.toc-tree button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  text-align: left;
  cursor: pointer;
}

.toc-tree button:not(:disabled):hover,
.toc-tree button.is-active {
  background: var(--color-accent-soft);
  color: var(--primary);
}

.toc-tree button:disabled {
  color: var(--color-text-tertiary);
  cursor: default;
  font-weight: 600;
}

.toc-tree button span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toc-tree button > span:first-child {
  flex: 1;
  min-width: 0;
}

.toc-tree small {
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.toc-tree__meta {
  flex: none;
}

.toc-tree button.is-active .toc-tree__meta small {
  font-weight: 700;
}
</style>
