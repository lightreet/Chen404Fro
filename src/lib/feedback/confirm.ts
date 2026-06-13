/**
 * Chen404 统一确认服务
 *
 * 收敛全站对 ElMessageBox 的直调。业务层使用 `confirmAction({...})`，
 * 返回布尔值（确认 / 取消），不再各自 try/catch ElMessageBox 的 reject。
 *
 * 内部仍复用 Element Plus，但对外暴露项目自己的语义化 API。
 */

import { ElMessageBox, type Action } from 'element-plus'

export type ConfirmTone = 'default' | 'danger' | 'warning' | 'info' | 'success'

export interface ConfirmActionOptions {
  /** 正文内容 */
  message: string
  /** 标题，默认「提示」 */
  title?: string
  /** 确认按钮文案，默认「确定」 */
  confirmText?: string
  /** 取消按钮文案，默认「取消」 */
  cancelText?: string
  /** 语气：danger 时确认按钮走危险色，常用于删除 */
  tone?: ConfirmTone
  /** 是否允许 HTML 内容 */
  dangerouslyUseHTMLString?: boolean
  /** 是否显示取消按钮（false 时退化为 alert 式确认） */
  showCancel?: boolean
}

const toneToType: Record<ConfirmTone, '' | 'warning' | 'info' | 'success' | 'error'> = {
  default: '',
  danger: 'warning',
  warning: 'warning',
  info: 'info',
  success: 'success',
}

/**
 * 弹出确认框。
 * @returns 用户确认返回 true，取消 / 关闭返回 false（不会抛错）。
 */
export async function confirmAction(options: ConfirmActionOptions): Promise<boolean> {
  const {
    message,
    title = '提示',
    confirmText = '确定',
    cancelText = '取消',
    tone = 'default',
    dangerouslyUseHTMLString = false,
    showCancel = true,
  } = options

  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      type: toneToType[tone] || undefined,
      dangerouslyUseHTMLString,
      showCancelButton: showCancel,
      confirmButtonClass: tone === 'danger' ? 'el-button--danger' : undefined,
      autofocus: false,
    })
    return true
  } catch (error) {
    // ElMessageBox 在取消/关闭时 reject；统一收敛为 false
    void (error as Action)
    return false
  }
}

/**
 * 删除确认的便捷封装，固定危险语气。
 */
export function confirmDelete(
  message: string,
  options?: Partial<ConfirmActionOptions>,
): Promise<boolean> {
  return confirmAction({
    message,
    title: options?.title ?? '删除确认',
    confirmText: options?.confirmText ?? '删除',
    cancelText: options?.cancelText ?? '取消',
    tone: 'danger',
    ...options,
  })
}

export interface ConfirmInputOptions {
  message: string
  title?: string
  confirmText?: string
  cancelText?: string
  inputValue?: string
  placeholder?: string
  /** 校验：返回 true 通过，返回字符串作为错误文案 */
  validator?: (value: string) => boolean | string
}

/**
 * 文本输入确认框（替代 ElMessageBox.prompt）。
 * @returns 确认返回输入的字符串；取消 / 关闭返回 null。
 */
export async function confirmInput(options: ConfirmInputOptions): Promise<string | null> {
  const {
    message,
    title = '请输入',
    confirmText = '确定',
    cancelText = '取消',
    inputValue = '',
    placeholder,
    validator,
  } = options

  try {
    const result = await ElMessageBox.prompt(message, title, {
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      inputValue,
      inputPlaceholder: placeholder,
      autofocus: true,
      inputValidator: validator
        ? (value: string) => {
            const r = validator(value ?? '')
            return r === true ? true : typeof r === 'string' ? r : false
          }
        : undefined,
    })
    return result.value ?? ''
  } catch {
    return null
  }
}
