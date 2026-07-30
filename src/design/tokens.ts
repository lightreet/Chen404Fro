/**
 * Chen404 设计 Token（TS 侧入口）
 *
 * 真正的视觉值以 CSS 变量为准，定义在：
 *  - src/assets/styles/variables.scss（历史变量，仍在用）
 *  - src/assets/styles/tokens.scss（新增语义 token 层）
 *
 * 这里只提供「在 TS / JS 里安全引用 CSS 变量」的常量与帮助函数，
 * 避免业务代码里散落手写 `var(--xxx)` 字符串。
 */

/** 把一个 token 名解析为 `var(--token, fallback?)` 字符串 */
export function token(name: string, fallback?: string): string {
  return fallback ? `var(${name}, ${fallback})` : `var(${name})`
}

export const colorTokens = {
  accent: '--color-accent',
  accentSoft: '--color-accent-soft',
  accentStrong: '--color-accent-strong',
  surface: '--color-surface',
  surfaceMuted: '--color-surface-muted',
  surfaceElevated: '--color-surface-elevated',
  border: '--color-border',
  borderStrong: '--color-border-strong',
  textPrimary: '--color-text-primary',
  textSecondary: '--color-text-secondary',
  textTertiary: '--color-text-tertiary',
  success: '--color-success',
  warning: '--color-warning',
  danger: '--color-danger',
  info: '--color-info',
} as const

export const radiusTokens = {
  sm: '--radius-sm',
  md: '--radius-md',
  lg: '--radius-lg',
  xl: '--radius-xl',
  pill: '--radius-pill',
} as const

export const spaceTokens = {
  xs: '--space-xs',
  sm: '--space-sm',
  md: '--space-md',
  lg: '--space-lg',
  xl: '--space-xl',
  '2xl': '--space-2xl',
} as const

export const shadowTokens = {
  sm: '--shadow-sm',
  md: '--shadow-md',
  lg: '--shadow-lg',
} as const

export const motionTokens = {
  durationFast: '--motion-duration-fast',
  durationBase: '--motion-duration-base',
  durationSlow: '--motion-duration-slow',
  easeStandard: '--motion-ease-standard',
  easeEntrance: '--motion-ease-entrance',
  easeExit: '--motion-ease-exit',
} as const

export const zIndexTokens = {
  base: '--z-base',
  sticky: '--z-sticky',
  dropdown: '--z-dropdown',
  overlay: '--z-overlay',
  dialog: '--z-dialog',
  popover: '--z-popover',
  toast: '--z-toast',
} as const

/** 语义颜色，业务里需要 inline style 时使用 */
export const color = Object.fromEntries(
  Object.entries(colorTokens).map(([key, name]) => [key, token(name)]),
) as Record<keyof typeof colorTokens, string>

export type AccentTone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
