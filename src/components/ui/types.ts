/** UI Primitive 层共享类型（不放在 .vue 内，避免 <script setup> 不能 export 的限制） */

export type UiButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'text'
  | 'danger'
  | 'success'

export type UiSize = 'sm' | 'md' | 'lg'

export interface UiTabItem {
  label: string
  value: string
  icon?: string
  badge?: string | number
  disabled?: boolean
}

export interface UiSelectOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

export interface UiRadioOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

export type UiSegmentedOption =
  | string
  | number
  | {
      label: string
      value: string | number | boolean
      disabled?: boolean
    }
