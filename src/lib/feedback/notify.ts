/**
 * Chen404 统一通知服务
 *
 * 收敛全站对 ElMessage 的直调，提供稳定、与库无关的通知 API。
 * 业务层应使用 `notify.success(...)` 而不是 `ElMessage.success(...)`，
 * 以便未来替换底层实现（自研 toast）时无需改动调用点。
 *
 * 内部仍复用 Element Plus 的消息能力，并继承 utils/message.ts 中的时长策略。
 */

import { ElMessage, type MessageParamsWithType } from 'element-plus'

export interface NotifyOptions {
  /** 自动关闭时长（ms）；不传则走全局类型默认值 */
  duration?: number
  /** 是否显示关闭按钮 */
  showClose?: boolean
  /** 是否支持 HTML（谨慎使用，注意 XSS） */
  dangerouslyUseHTMLString?: boolean
  /** 分组：相同 grouping 的相同内容会合并计数 */
  grouping?: boolean
}

type NotifyInput = string | NotifyOptions & { message: string }

function normalize(input: NotifyInput, extra?: NotifyOptions): MessageParamsWithType {
  if (typeof input === 'string') {
    return { message: input, ...extra }
  }
  return { ...input, ...extra }
}

export const notify = {
  success(input: NotifyInput, options?: NotifyOptions) {
    return ElMessage.success(normalize(input, options))
  },
  error(input: NotifyInput, options?: NotifyOptions) {
    return ElMessage.error(normalize(input, options))
  },
  warning(input: NotifyInput, options?: NotifyOptions) {
    return ElMessage.warning(normalize(input, options))
  },
  info(input: NotifyInput, options?: NotifyOptions) {
    return ElMessage.info(normalize(input, options))
  },
  /** 中性提示（主色调） */
  message(input: NotifyInput, options?: NotifyOptions) {
    return ElMessage(normalize(input, options))
  },
  /** 关闭所有当前通知 */
  closeAll() {
    ElMessage.closeAll()
  },
}

export type Notify = typeof notify
