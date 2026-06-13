<template>
  <el-date-picker
    :model-value="proxyValue"
    class="ui-date-field"
    :type="type"
    :value-format="valueFormat"
    :format="format"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :disabled-date="disabledDate"
    :range-separator="rangeSeparator"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    @update:model-value="onUpdateModelValue"
    @change="onChange"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElDatePicker } from 'element-plus'

type DatePrimitive = string | number | Date
type DateValue = DatePrimitive | DatePrimitive[] | null | undefined
type PickerValue = string | number | Date | string[] | number[] | Date[] | null | undefined

const props = withDefaults(
  defineProps<{
    modelValue: DateValue
    type?: 'date' | 'dates' | 'datetime' | 'week' | 'month' | 'months' | 'year' | 'years' | 'daterange' | 'monthrange' | 'datetimerange'
    valueFormat?: string
    format?: string
    placeholder?: string
    clearable?: boolean
    disabled?: boolean
    disabledDate?: (date: Date) => boolean
    rangeSeparator?: string
    startPlaceholder?: string
    endPlaceholder?: string
  }>(),
  {
    modelValue: undefined,
    type: 'date',
    valueFormat: undefined,
    format: undefined,
    placeholder: '',
    clearable: true,
    disabled: false,
    disabledDate: undefined,
    rangeSeparator: '-',
    startPlaceholder: '',
    endPlaceholder: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: DateValue): void
  (e: 'change', v: DateValue): void
}>()

const proxyValue = computed<PickerValue>(() => props.modelValue as PickerValue)

const onUpdateModelValue = (value: unknown) => {
  emit('update:modelValue', value as DateValue)
}

const onChange = (value: DatePrimitive | DatePrimitive[] | null | undefined) => emit('change', value)
</script>

<style scoped lang="scss">
.ui-date-field {
  width: 100%;
}
</style>
