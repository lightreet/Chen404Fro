/**
 * Chen404 动效系统
 *
 * 统一动效时长 / 缓动 / 常用进出场预设，供组件与 useMotionPreset 消费。
 * 数值与 tokens.scss 中的 --motion-* 对齐，这里给出 JS 可读的真实值，
 * 方便在 Web Animations / transition 内联场景里直接引用。
 */

export const duration = {
  fast: 160,
  base: 240,
  slow: 360,
} as const

export const easing = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  entrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

export type MotionPresetName =
  | 'fade'
  | 'raise'
  | 'press'
  | 'panel-enter'
  | 'list-reflow'
  | 'drawer-slide'

export interface MotionPreset {
  /** Vue <transition> 的 name，对应 motion.scss 中定义的类 */
  name: string
  /** 列表场景是否走 <transition-group> */
  group?: boolean
}

export const motionPresets: Record<MotionPresetName, MotionPreset> = {
  fade: { name: 'm-fade' },
  raise: { name: 'm-raise' },
  press: { name: 'm-press' },
  'panel-enter': { name: 'm-panel' },
  'list-reflow': { name: 'm-list', group: true },
  'drawer-slide': { name: 'm-drawer' },
}

/** 是否处于「降低动效」偏好下 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
