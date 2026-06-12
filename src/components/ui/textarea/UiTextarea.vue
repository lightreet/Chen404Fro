<template>
  <div class="ui-textarea" :class="{ 'is-disabled': disabled, 'is-focused': focused }">
    <textarea
      ref="areaRef"
      class="ui-textarea__inner"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows"
      :maxlength="maxlength"
      :style="{ resize }"
      @input="onInput"
      @focus="focused = true; $emit('focus', $event)"
      @blur="focused = false; $emit('blur', $event)"
    />
    <span v-if="maxlength && showCount" class="ui-textarea__count">
      {{ String(modelValue ?? '').length }} / {{ maxlength }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    rows?: number | string
    maxlength?: number | string
    showCount?: boolean
    resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  }>(),
  {
    modelValue: '',
    placeholder: '',
    disabled: false,
    readonly: false,
    rows: 3,
    maxlength: undefined,
    showCount: false,
    resize: 'vertical',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'focus', ev: FocusEvent): void
  (e: 'blur', ev: FocusEvent): void
}>()

const areaRef = ref<HTMLTextAreaElement>()
const focused = ref(false)

const onInput = (ev: Event) => {
  emit('update:modelValue', (ev.target as HTMLTextAreaElement).value)
}

defineExpose({ focus: () => areaRef.value?.focus() })
</script>

<style scoped lang="scss">
.ui-textarea {
  position: relative;
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: var(--color-surface);
  border-radius: 10px;
  box-shadow: 0 0 0 1px var(--color-border) inset;
  transition: box-shadow var(--motion-duration-base) var(--motion-ease-standard);

  &:hover:not(.is-disabled) {
    box-shadow: 0 0 0 1px var(--primary-light) inset;
  }
  &.is-focused {
    box-shadow: 0 0 0 2px var(--primary) inset;
  }
  &.is-disabled {
    opacity: 0.6;
    background: var(--color-surface-muted);
  }
}

.ui-textarea__inner {
  display: block;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text-primary);
  font: inherit;
  line-height: var(--line-height-base);

  &::placeholder {
    color: var(--color-text-tertiary);
  }
}

.ui-textarea__count {
  position: absolute;
  right: 10px;
  bottom: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  pointer-events: none;
}
</style>
