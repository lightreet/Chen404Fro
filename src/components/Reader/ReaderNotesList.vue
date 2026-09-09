<template>
  <div class="reader-notes-list" aria-live="polite">
    <div class="reader-notes-list__summary">
      <span>{{ notes.length ? `共 ${notes.length} 条` : '当前书籍' }}</span>
      <small>按章节与原文位置排列</small>
    </div>

    <UiLoadingState
      :loading="loading"
      variant="plain"
      message="正在整理你的笔记…"
    >
      <div v-if="error" class="reader-notes-list__error">
        <UiIcon name="warning" />
        <p>{{ error }}</p>
        <UiButton variant="secondary" size="sm" @click="emit('retry')">重新加载</UiButton>
      </div>

      <UiEmpty
        v-else-if="!notes.length"
        title="还没有阅读笔记"
        description="在正文中选择连续文字，就能保存摘录或写下感受。"
        icon="edit"
      />

      <div v-else class="reader-note-groups">
        <section
          v-for="group in noteGroups"
          :key="`${group.order}-${group.title}`"
          class="reader-note-group"
        >
          <header>
            <h3>{{ group.title }}</h3>
            <span>{{ group.notes.length }}</span>
          </header>

          <article
            v-for="note in group.notes"
            :key="String(note.id)"
            class="reader-note-item"
            :class="`is-${note.highlightColor}`"
          >
            <details class="reader-note-item__details">
              <summary
                class="reader-note-item__toggle"
                :aria-label="`${note.chapterTitle}第 ${note.startBlockIndex + 1} 段的笔记`"
              >
                <span class="reader-note-item__marker" aria-hidden="true" />
                <span class="reader-note-item__content">
                  <strong v-if="note.reflection?.trim()" class="reader-note-item__reflection">
                    {{ note.reflection }}
                  </strong>
                  <strong v-else class="reader-note-item__reflection is-empty">仅摘录</strong>
                  <span class="reader-note-item__excerpt">“{{ note.excerpt }}”</span>
                  <strong class="reader-note-item__expanded-title">笔记全文</strong>
                  <span class="reader-note-item__meta">
                    {{ note.chapterTitle }} · 第 {{ note.startBlockIndex + 1 }} 段
                    <UiIcon
                      v-if="note.contentChanged"
                      name="warning"
                      title="正文已变化，跳转时会重新定位原文"
                    />
                  </span>
                  <span class="reader-note-item__disclosure" aria-hidden="true">
                    <span class="reader-note-item__expand-label">展开全文</span>
                    <span class="reader-note-item__collapse-label">收起</span>
                    <UiIcon name="arrow-down" />
                  </span>
                </span>
              </summary>
              <div class="reader-note-item__full-content">
                <section v-if="note.reflection?.trim()">
                  <h4>感悟</h4>
                  <p class="reader-note-item__full-reflection">{{ note.reflection }}</p>
                </section>
                <section>
                  <h4>摘录</h4>
                  <blockquote class="reader-note-item__full-excerpt">{{ note.excerpt }}</blockquote>
                </section>
                <div class="reader-note-item__full-actions">
                  <UiButton
                    variant="text"
                    size="sm"
                    icon="location"
                    class="reader-note-item__jump"
                    :aria-label="`跳转到${note.chapterTitle}中的笔记原文`"
                    @click="emit('jump', note)"
                  >跳转原文</UiButton>
                  <UiButton variant="text" size="sm" icon="arrow-up" @click="collapseNote">
                    收起
                  </UiButton>
                </div>
              </div>
            </details>
            <div class="reader-note-item__actions" aria-label="笔记操作">
              <UiButton
                variant="text"
                size="sm"
                icon-only
                icon="edit"
                aria-label="编辑笔记"
                @click="emit('edit', note, $event)"
              />
              <UiButton
                variant="text"
                size="sm"
                icon-only
                icon="delete"
                aria-label="删除笔记"
                @click="emit('delete', note)"
              />
            </div>
          </article>
        </section>
      </div>
    </UiLoadingState>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UiButton, UiEmpty, UiIcon, UiLoadingState } from '@/components/ui'
import type { ReaderNote } from '@/types/reader'

const props = withDefaults(defineProps<{
  notes: ReaderNote[]
  loading?: boolean
  error?: string
}>(), {
  loading: false,
  error: '',
})

const emit = defineEmits<{
  (event: 'retry'): void
  (event: 'jump', note: ReaderNote): void
  (event: 'edit', note: ReaderNote, pointerEvent: MouseEvent): void
  (event: 'delete', note: ReaderNote): void
}>()

const collapseNote = (event: MouseEvent) => {
  const details = (event.currentTarget as HTMLElement | null)?.closest('details')
  if (!details) return
  details.open = false
  details.querySelector('summary')?.focus()
}

const noteGroups = computed(() => {
  const groups = new Map<string, { order: number; title: string; notes: ReaderNote[] }>()
  for (const note of props.notes) {
    const key = String(note.chapterOrder)
    const group = groups.get(key) || {
      order: note.chapterOrder,
      title: note.chapterTitle,
      notes: [],
    }
    group.notes.push(note)
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => a.order - b.order)
})
</script>

<style scoped lang="scss">
.reader-notes-list {
  display: grid;
  gap: 18px;
}

.reader-notes-list__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
}

.reader-notes-list__summary small {
  color: var(--color-text-tertiary);
  font-size: 0.75rem;
}

.reader-notes-list__error {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 36px 16px;
  color: var(--color-text-secondary);
  text-align: center;
}

.reader-notes-list__error > :deep(.ui-icon) {
  color: var(--color-warning);
  font-size: 1.5rem;
}

.reader-notes-list__error p {
  margin: 0;
  font-size: 0.875rem;
}

.reader-note-groups,
.reader-note-group {
  display: grid;
  gap: 8px;
}

.reader-note-group + .reader-note-group {
  margin-top: 16px;
}

.reader-note-group > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 2px;
  border-bottom: 1px solid var(--color-border-light);
}

.reader-note-group h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 0.875rem;
}

.reader-note-group > header span {
  display: grid;
  min-width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-surface-muted);
  color: var(--color-text-tertiary);
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
}

.reader-note-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  background: var(--color-surface);
}

.reader-note-item:focus-within {
  border-color: var(--primary-light);
}

.reader-note-item__details {
  min-width: 0;
}

.reader-note-item__toggle {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
  padding: 14px 8px 14px 14px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  list-style: none;
}

.reader-note-item__toggle::-webkit-details-marker {
  display: none;
}

.reader-note-item__toggle:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.reader-note-item__marker {
  width: 9px;
  height: 9px;
  margin-top: 5px;
  border-radius: 3px;
  background: var(--note-marker);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--note-marker) 16%, transparent);
}

.reader-note-item.is-rose { --note-marker: #d88f9d; }
.reader-note-item.is-sage { --note-marker: #9eac86; }
.reader-note-item.is-blue { --note-marker: #8fa9c4; }
.reader-note-item.is-amber { --note-marker: #d9ae69; }

.reader-note-item__content {
  display: grid;
  min-width: 0;
  gap: 7px;
  overflow-wrap: anywhere;
}

.reader-note-item__expanded-title,
.reader-note-item__collapse-label {
  display: none;
}

.reader-note-item__expanded-title {
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 650;
}

.reader-note-item__disclosure {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-accent-strong);
  font-size: 0.75rem;
}

.reader-note-item__details[open] .reader-note-item__reflection,
.reader-note-item__details[open] .reader-note-item__excerpt,
.reader-note-item__details[open] .reader-note-item__expand-label {
  display: none;
}

.reader-note-item__details[open] .reader-note-item__expanded-title,
.reader-note-item__details[open] .reader-note-item__collapse-label {
  display: block;
}

.reader-note-item__details[open] .reader-note-item__disclosure :deep(.ui-icon) {
  transform: rotate(180deg);
}

.reader-note-item__full-content {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 0 8px 14px 14px;
}

.reader-note-item__full-content h4 {
  margin: 0 0 6px;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
}

.reader-note-item__full-reflection,
.reader-note-item__full-excerpt {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.reader-note-item__full-excerpt {
  padding-left: 10px;
  border-left: 2px solid var(--note-marker);
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', serif;
}

.reader-note-item__full-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.reader-note-item__reflection {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 650;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.reader-note-item__reflection.is-empty {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.reader-note-item__excerpt {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-text-secondary);
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', serif;
  font-size: 0.8125rem;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.reader-note-item__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  color: var(--color-text-tertiary);
  font-size: 0.6875rem;
}

.reader-note-item__meta :deep(.ui-icon) {
  color: var(--color-warning);
}

.reader-note-item__actions {
  display: grid;
  gap: 2px;
  padding: 8px 7px 0 0;
}

.reader-note-item__actions :deep(.ui-button) {
  color: var(--color-text-tertiary);
}

.reader-note-item__actions :deep(.ui-button:last-child:hover) {
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
}

@media (max-width: 520px) {
  .reader-note-item__toggle,
  .reader-note-item__full-actions :deep(.ui-button) {
    min-height: 44px;
  }
  .reader-note-item__actions :deep(.ui-button) {
    width: 44px;
    min-height: 44px;
  }
}
</style>
