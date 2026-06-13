<template>
  <div class="ui-search-bar" :class="{ 'is-focused': focused }">
    <span class="ui-search-bar__icon" aria-hidden="true">
      <UiIcon name="search" />
    </span>

    <input
      ref="inputRef"
      class="ui-search-bar__input"
      type="search"
      :value="modelValue"
      :placeholder="placeholder"
      autocomplete="off"
      enterkeyhint="search"
      @input="onInput"
      @focus="focused = true"
      @blur="focused = false"
      @keydown.enter.prevent="emit('search', modelValue)"
    />

    <button
      type="button"
      class="ui-search-bar__btn"
      :disabled="loading"
      @click="emit('search', modelValue)"
    >
      <UiIcon v-if="loading" name="loading" spin />
      <span v-else>{{ buttonText }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UiIcon from '../icon/UiIcon.vue'

withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    buttonText?: string
    loading?: boolean
  }>(),
  {
    modelValue: '',
    placeholder: '搜索…',
    buttonText: '搜索',
    loading: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [v: string]
  search: [keyword: string]
}>()

const focused = ref(false)
const inputRef = ref<HTMLInputElement>()

const onInput = (ev: Event) =>
  emit('update:modelValue', (ev.target as HTMLInputElement).value)

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<style scoped lang="scss">
.ui-search-bar {
  display: inline-flex;
  align-items: center;
  height: var(--control-height-md);
  background: var(--color-surface);
  border-radius: var(--radius-pill);
  box-shadow: 0 0 0 1px var(--color-border) inset;
  transition: box-shadow var(--motion-duration-base) var(--motion-ease-standard);
  overflow: hidden;
  width: 100%;

  &.is-focused {
    box-shadow: 0 0 0 2px var(--primary) inset;
  }
  &:not(.is-focused):hover {
    box-shadow: 0 0 0 1px var(--primary-light) inset;
  }
}

.ui-search-bar__icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  padding-left: 14px;
  color: var(--color-text-tertiary);
  font-size: 1.1em;
  pointer-events: none;
}

.ui-search-bar__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  padding: 0 10px 0 8px;

  &::placeholder {
    color: var(--color-text-tertiary);
  }
  /* 隐藏系统自带的清除按钮，样式自己控制 */
  &::-webkit-search-cancel-button {
    display: none;
  }
}

.ui-search-bar__btn {
  flex-shrink: 0;
  height: 100%;
  padding: 0 20px;
  border: none;
  border-radius: 0 var(--radius-pill) var(--radius-pill) 0;
  background: var(--primary);
  color: #fff;
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition:
    background var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);

  &:hover:not(:disabled) {
    background: var(--primary-dark);
  }
  &:active:not(:disabled) {
    transform: scale(0.97);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

[data-theme='dark'] .ui-search-bar {
  background: var(--bg-elevated);
}
</style>
