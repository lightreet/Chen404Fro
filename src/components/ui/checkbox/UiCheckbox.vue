<template>
  <label class="ui-checkbox" :class="{ 'is-checked': isChecked, 'is-disabled': disabled }">
    <input
      type="checkbox"
      class="ui-checkbox__input"
      :checked="isChecked"
      :disabled="disabled"
      :value="value"
      @change="onChange"
    />
    <span class="ui-checkbox__box">
      <UiIcon v-if="isChecked" name="check" class="ui-checkbox__tick" />
    </span>
    <span v-if="$slots.default || label" class="ui-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UiIcon from '../icon/UiIcon.vue'

/**
 * UiCheckbox —— 复选框。
 * 单值模式：modelValue 为 boolean。
 * 数组模式：modelValue 为数组 + value，勾选则把 value 加入数组。
 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean | Array<string | number>
    /** 数组模式下本项的值 */
    value?: string | number
    label?: string
    disabled?: boolean
  }>(),
  {
    value: undefined,
    label: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean | Array<string | number>): void
  (e: 'change', v: boolean | Array<string | number>): void
}>()

const isArrayMode = computed(() => Array.isArray(props.modelValue))

const isChecked = computed(() => {
  if (isArrayMode.value && props.value !== undefined) {
    return (props.modelValue as Array<string | number>).includes(props.value)
  }
  return Boolean(props.modelValue)
})

const onChange = (ev: Event) => {
  if (props.disabled) return
  const checked = (ev.target as HTMLInputElement).checked

  if (isArrayMode.value && props.value !== undefined) {
    const list = [...(props.modelValue as Array<string | number>)]
    const idx = list.indexOf(props.value)
    if (checked && idx === -1) list.push(props.value)
    if (!checked && idx > -1) list.splice(idx, 1)
    emit('update:modelValue', list)
    emit('change', list)
    return
  }

  emit('update:modelValue', checked)
  emit('change', checked)
}
</script>

<style scoped lang="scss">
.ui-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;

  &.is-disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.ui-checkbox__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.ui-checkbox__box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: #fff;
  font-size: 13px;
  transition:
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    background-color var(--motion-duration-fast) var(--motion-ease-standard);
}

.ui-checkbox:hover:not(.is-disabled) .ui-checkbox__box {
  border-color: var(--primary-light);
}

.ui-checkbox.is-checked .ui-checkbox__box {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-color: transparent;
}

.ui-checkbox__label {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}
</style>
