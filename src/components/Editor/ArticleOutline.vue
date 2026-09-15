<template>
  <aside class="article-outline" :class="{ 'is-collapsed': collapsed }" aria-label="文章目录">
    <header class="outline-header">
      <h2 v-if="!collapsed">文章目录 <span>{{ headings.length }}</span></h2>
      <UiButton variant="text" icon-only :icon="collapsed ? 'Menu' : 'ArrowLeft'"
        :aria-label="collapsed ? '展开文章目录' : '收起文章目录'" :title="collapsed ? '展开文章目录' : '收起文章目录'"
        :aria-expanded="!collapsed" aria-controls="article-outline-nav" @click="$emit('update:collapsed', !collapsed)" />
    </header>
    <nav v-show="!collapsed" id="article-outline-nav" class="outline-nav" aria-label="正文标题">
      <p v-if="!headings.length" class="outline-empty">添加正文标题后，<br />目录会显示在这里。</p>
      <ol v-else>
        <li v-for="heading in headings" :key="heading.line">
          <button type="button" class="outline-link" :class="{ 'is-active': activeLine === heading.line }"
            :aria-current="activeLine === heading.line ? 'location' : undefined" :title="heading.text"
            :style="{ '--outline-level': Math.max(0, heading.level - baseLevel) }" @click="$emit('navigate', heading)">
            {{ heading.text }}
          </button>
        </li>
      </ol>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HeadList } from 'md-editor-v3';
import { UiButton } from '@/components/ui';

const props = defineProps<{ headings: HeadList[]; activeLine: number | null; collapsed: boolean }>();
defineEmits<{ 'update:collapsed': [value: boolean]; navigate: [heading: HeadList] }>();
const baseLevel = computed(() => Math.min(...props.headings.map(heading => heading.level), 6));
</script>

<style scoped lang="scss">
.article-outline {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border-light);
}

.outline-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 8px 12px 8px 20px;
  gap: 8px;
}

.outline-header h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.outline-header h2 span {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-tertiary);
}

.outline-header :deep(button) {
  min-width: 36px;
  min-height: 36px;
}

.is-collapsed .outline-header {
  padding-inline: 10px;
  justify-content: center;
}

.outline-nav {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 12px 24px;
  scrollbar-width: thin;
}

.outline-empty {
  margin: 16px 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.8;
}

.outline-nav ol {
  list-style: none;
  padding: 0;
  margin: 0;
}

.outline-link {
  display: block;
  width: 100%;
  border: 0;
  border-left: 2px solid transparent;
  border-radius: 0 8px 8px 0;
  padding: 9px 10px 9px calc(10px + var(--outline-level) * 12px);
  background: transparent;
  color: var(--color-text-secondary);
  text-align: left;
  font: inherit;
  font-size: 13px;
  line-height: 1.65;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.outline-link:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-muted);
}

.outline-link.is-active {
  border-left-color: var(--color-accent);
  color: var(--color-text-primary);
  font-weight: 600;
  background: var(--control-selected-background);
}

.outline-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

</style>
