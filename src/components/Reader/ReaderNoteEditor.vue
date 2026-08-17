<template>
  <Teleport to="body">
    <div class="reader-note-editor-layer" @pointerdown.self="emit('cancel')">
      <section
        class="reader-note-editor"
        :class="`reader-note-editor--${theme}`"
        :style="panelStyle"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reader-note-editor-title"
        @keydown.esc.prevent="emit('cancel')"
      >
        <header class="reader-note-editor__header">
          <h2 id="reader-note-editor-title">{{ noteId ? '编辑笔记' : '记录笔记' }}</h2>
          <UiButton
            variant="text"
            size="sm"
            icon-only
            icon="close"
            aria-label="关闭笔记编辑器"
            @click="emit('cancel')"
          />
        </header>

        <blockquote class="reader-note-editor__excerpt">
          <span>摘录</span>
          <p>{{ excerpt }}</p>
        </blockquote>

        <fieldset class="reader-note-editor__colors">
          <legend>高亮颜色</legend>
          <button
            v-for="option in colorOptions"
            :key="option.value"
            type="button"
            :class="[`is-${option.value}`, { 'is-active': draftColor === option.value }]"
            :aria-label="option.label"
            :aria-pressed="draftColor === option.value"
            @click="draftColor = option.value"
          ><span aria-hidden="true" /></button>
        </fieldset>

        <label class="reader-note-editor__field" for="reader-note-reflection">
          <span>此刻的感受 <small>可不填</small></span>
          <UiTextarea
            id="reader-note-reflection"
            ref="textareaRef"
            v-model="draftReflection"
            :rows="5"
            :maxlength="2000"
            show-count
            resize="none"
            placeholder="写下此刻的感受（可不填）"
          />
        </label>

        <footer class="reader-note-editor__footer">
          <UiButton variant="secondary" @click="emit('cancel')">取消</UiButton>
          <UiButton
            variant="primary"
            icon="save"
            :loading="saving"
            @click="submit"
          >保存笔记</UiButton>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { UiButton, UiTextarea } from '@/components/ui'
import type { ReaderNoteColor, ReaderTheme } from '@/types/reader'

const props = withDefaults(defineProps<{
  noteId?: string | number
  excerpt: string
  reflection?: string
  highlightColor?: ReaderNoteColor
  theme?: ReaderTheme
  saving?: boolean
  left?: number
  top?: number
}>(), {
  noteId: undefined,
  reflection: '',
  highlightColor: 'rose',
  theme: 'light',
  saving: false,
  left: 16,
  top: 88,
})

const emit = defineEmits<{
  (event: 'cancel'): void
  (event: 'save', value: { reflection: string; highlightColor: ReaderNoteColor }): void
}>()

const textareaRef = ref<{ focus: () => void }>()
const draftReflection = ref('')
const draftColor = ref<ReaderNoteColor>('rose')

const colorOptions: Array<{ value: ReaderNoteColor; label: string }> = [
  { value: 'rose', label: '豆沙粉' },
  { value: 'sage', label: '鼠尾草绿' },
  { value: 'blue', label: '雾蓝' },
  { value: 'amber', label: '柔和琥珀' },
]

const panelStyle = computed(() => ({
  '--reader-note-editor-left': `${props.left}px`,
  '--reader-note-editor-top': `${props.top}px`,
}))

const syncDraft = () => {
  draftReflection.value = props.reflection || ''
  draftColor.value = props.highlightColor
  void nextTick(() => textareaRef.value?.focus())
}

const submit = () => {
  if (props.saving) return
  emit('save', {
    reflection: draftReflection.value,
    highlightColor: draftColor.value,
  })
}

watch(() => [props.noteId, props.reflection, props.highlightColor], syncDraft)
onMounted(syncDraft)
</script>

<style scoped lang="scss">
.reader-note-editor-layer {
  position: fixed;
  z-index: var(--z-popover);
  inset: 0;
}

.reader-note-editor {
  --note-editor-bg: #fffdf9;
  --note-editor-text: #332e30;
  --note-editor-muted: #756b6e;
  --note-editor-border: rgba(78, 60, 67, 0.16);
  position: fixed;
  top: var(--reader-note-editor-top);
  left: var(--reader-note-editor-left);
  display: grid;
  width: min(390px, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  overflow-y: auto;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--note-editor-border);
  border-radius: 12px;
  background: var(--note-editor-bg);
  color: var(--note-editor-text);
  box-shadow: 0 8px 18px rgba(48, 35, 41, 0.14);
}

.reader-note-editor--rose {
  --note-editor-bg: #fff9f7;
  --note-editor-text: #402f35;
  --note-editor-muted: #7e6870;
  --note-editor-border: rgba(113, 71, 84, 0.18);
}

.reader-note-editor--dark {
  --note-editor-bg: #211d21;
  --note-editor-text: #e5dde0;
  --note-editor-muted: #ada0a5;
  --note-editor-border: rgba(255, 255, 255, 0.13);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.32);
}

.reader-note-editor__header,
.reader-note-editor__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.reader-note-editor__header h2 {
  margin: 0;
  font-size: 1rem;
  line-height: 1.4;
}

.reader-note-editor__header :deep(.ui-button) {
  color: var(--note-editor-muted);
}

.reader-note-editor__excerpt {
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 12px 14px;
  border: 0;
  border-radius: 10px;
  background: color-mix(in srgb, var(--primary) 7%, var(--note-editor-bg));
}

.reader-note-editor__excerpt span,
.reader-note-editor__field > span,
.reader-note-editor__colors legend {
  color: var(--note-editor-muted);
  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.75rem;
  font-weight: 650;
}

.reader-note-editor__excerpt p {
  max-height: 6.6em;
  margin: 0;
  overflow: auto;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', serif;
  font-size: 0.875rem;
  line-height: 1.75;
  white-space: pre-wrap;
}

.reader-note-editor__colors {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}

.reader-note-editor__colors legend {
  float: left;
  margin-right: auto;
}

.reader-note-editor__colors button {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.reader-note-editor__colors button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.reader-note-editor__colors button span {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--note-editor-border) inset;
}

.reader-note-editor__colors button.is-active {
  box-shadow: 0 0 0 2px var(--primary) inset;
}

.reader-note-editor__colors .is-rose span { background: #dfa2ad; }
.reader-note-editor__colors .is-sage span { background: #aab694; }
.reader-note-editor__colors .is-blue span { background: #9eb5ce; }
.reader-note-editor__colors .is-amber span { background: #e7bf7d; }

.reader-note-editor__field {
  display: grid;
  gap: 8px;
}

.reader-note-editor__field small {
  font-size: inherit;
  font-weight: 400;
}

.reader-note-editor__field :deep(.ui-textarea) {
  background: var(--note-editor-bg);
}

.reader-note-editor__field :deep(.ui-textarea__inner) {
  min-height: 118px;
  color: var(--note-editor-text);
  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
}

.reader-note-editor__field :deep(.ui-textarea__inner::placeholder),
.reader-note-editor__field :deep(.ui-textarea__count) {
  color: var(--note-editor-muted);
}

.reader-note-editor__footer {
  justify-content: flex-end;
}

@media (max-width: 760px) {
  .reader-note-editor-layer {
    background: rgba(20, 16, 19, 0.24);
  }
  .reader-note-editor {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    max-height: min(82vh, 680px);
    padding: 18px max(18px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left));
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -6px 16px rgba(30, 22, 27, 0.16);
  }
  .reader-note-editor__colors button {
    width: 44px;
    height: 44px;
  }
  .reader-note-editor__footer :deep(.ui-button) {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reader-note-editor,
  .reader-note-editor__colors button {
    transition: none;
  }
}
</style>
