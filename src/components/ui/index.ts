/**
 * Chen404 UI Primitive 层统一出口
 *
 * 业务/页面层通过 `import { UiButton, UiPanel } from '@/components/ui'` 使用，
 * 不直接依赖 Element Plus 的 el-* 组件。
 */

export { default as UiIcon } from './icon/UiIcon.vue'
export { default as UiButton } from './button/UiButton.vue'
export { default as UiInput } from './input/UiInput.vue'
export { default as UiTextarea } from './textarea/UiTextarea.vue'
export { default as UiPanel } from './panel/UiPanel.vue'
export { default as UiTabs } from './tabs/UiTabs.vue'
export { default as UiDialog } from './dialog/UiDialog.vue'
export { default as UiBadge } from './badge/UiBadge.vue'
export { default as UiSwitch } from './switch/UiSwitch.vue'
export { default as UiCheckbox } from './checkbox/UiCheckbox.vue'
export { default as UiSelect } from './select/UiSelect.vue'
export { default as UiTooltip } from './tooltip/UiTooltip.vue'
export { default as UiPagination } from './pagination/UiPagination.vue'
export { default as UiEmpty } from './empty/UiEmpty.vue'

export type { UiButtonVariant, UiTabItem, UiSize, UiSelectOption } from './types'
