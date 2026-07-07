<template>
  <div
    class="ui-input"
    :class="[
      `ui-input--${size}`,
      {
        'ui-input--textarea': type === 'textarea',
        'ui-input--borderless': borderless,
        'is-disabled': disabled,
        'is-focused': focused,
        'has-prefix': $slots.prefix || prefixIcon,
        'has-suffix': $slots.suffix || suffixIcon || clearable,
      },
    ]"
  >
    <span v-if="(type !== 'textarea') && ($slots.prefix || prefixIcon)" class="ui-input__affix ui-input__prefix">
      <slot name="prefix">
        <UiIcon v-if="prefixIcon" :name="prefixIcon" />
      </slot>
    </span>

    <textarea
      v-if="type === 'textarea'"
      ref="textareaRef"
      class="ui-input__inner ui-input__textarea"
      :value="String(modelValue ?? '')"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :name="name"
      :rows="rows"
      :autofocus="autofocus"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <input
      v-else
      ref="inputRef"
      class="ui-input__inner"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :name="name"
      :autocomplete="autocomplete"
      :autofocus="autofocus"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.enter="$emit('enter', $event)"
    />

    <span
      v-if="showWordLimit && maxlength"
      class="ui-input__count"
      :class="{ 'ui-input__count--textarea': type === 'textarea' }"
    >
      {{ String(modelValue ?? '').length }}/{{ maxlength }}
    </span>

    <button
      v-if="clearable && modelValue && !disabled && !readonly && type !== 'textarea'"
      type="button"
      class="ui-input__clear"
      tabindex="-1"
      @click="onClear"
    >
      <UiIcon name="close" />
    </button>

    <span v-if="(type !== 'textarea') && ($slots.suffix || suffixIcon)" class="ui-input__affix ui-input__suffix">
      <slot name="suffix">
        <UiIcon v-if="suffixIcon" :name="suffixIcon" />
      </slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UiIcon from '../icon/UiIcon.vue'

withDefaults(
  defineProps<{
    modelValue?: string | number
    type?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    borderless?: boolean
    clearable?: boolean
    size?: 'sm' | 'md' | 'lg'
    prefixIcon?: string
    suffixIcon?: string
    maxlength?: number | string
    name?: string
    autocomplete?: string
    rows?: number | string
    showWordLimit?: boolean
    autofocus?: boolean
  }>(),
  {
    modelValue: '',
    type: 'text',
    placeholder: '',
    disabled: false,
    readonly: false,
    borderless: false,
    clearable: false,
    size: 'md',
    prefixIcon: undefined,
    suffixIcon: undefined,
    maxlength: undefined,
    name: undefined,
    autocomplete: undefined,
    rows: 3,
    showWordLimit: false,
    autofocus: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'focus', ev: FocusEvent): void
  (e: 'blur', ev: FocusEvent): void
  (e: 'enter', ev: KeyboardEvent): void
  (e: 'input', ev: Event): void
  (e: 'clear'): void
}>()

const inputRef = ref<HTMLInputElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const focused = ref(false)

const onInput = (ev: Event) => {
  emit('update:modelValue', (ev.target as HTMLInputElement | HTMLTextAreaElement).value)
  emit('input', ev)
}
const onFocus = (ev: FocusEvent) => {
  focused.value = true
  emit('focus', ev)
}
const onBlur = (ev: FocusEvent) => {
  focused.value = false
  emit('blur', ev)
}
const onClear = () => {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

defineExpose({
  focus: () => (inputRef.value ?? textareaRef.value)?.focus(),
  blur: () => (inputRef.value ?? textareaRef.value)?.blur(),
})
</script>

<style scoped lang="scss">
.ui-input {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0 12px;
  background: var(--color-surface);
  border-radius: 10px;
  box-shadow: 0 0 0 1px var(--color-border) inset;
  transition: box-shadow var(--motion-duration-base) var(--motion-ease-standard);
  color: var(--color-text-primary);

  &:hover:not(.is-disabled) {
    box-shadow: 0 0 0 1px var(--primary-light) inset;
  }
  &.is-focused {
    box-shadow: 0 0 0 2px var(--primary) inset;
  }
  &.is-disabled {
    opacity: 0.6;
    background: var(--color-surface-muted);
    cursor: not-allowed;
  }
}

.ui-input--sm {
  height: var(--control-height-sm);
  font-size: var(--font-size-sm);
}
.ui-input--md {
  height: var(--control-height-md);
  font-size: var(--font-size-base);
}
.ui-input--lg {
  height: var(--control-height-lg);
  font-size: var(--font-size-md);
}

.ui-input--textarea {
  height: auto;
  align-items: stretch;
  padding: 8px 12px;
}

.ui-input--borderless {
  padding: 0;
  gap: 0;
  background: transparent;
  box-shadow: none;
  border-radius: 0;

  &:hover:not(.is-disabled),
  &.is-focused {
    box-shadow: none;
  }
}

.ui-input__inner {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font: inherit;

  &::placeholder {
    color: var(--color-text-tertiary);
  }
  &:disabled {
    cursor: not-allowed;
  }
}

.ui-input__textarea {
  height: auto;
  resize: vertical;
  line-height: 1.6;
  padding: 0;
}

.ui-input__count {
  align-self: flex-end;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  pointer-events: none;
}
.ui-input__count--textarea {
  position: absolute;
  right: 10px;
  bottom: 6px;
}
.ui-input--textarea {
  position: relative;
}

.ui-input__affix {
  display: inline-flex;
  align-items: center;
  color: var(--color-text-tertiary);
  font-size: 1.05em;
}

.ui-input__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 2px;
  border-radius: var(--radius-pill);
  transition: color var(--motion-duration-fast) var(--motion-ease-standard);

  &:hover {
    color: var(--color-text-secondary);
  }
}
</style>
