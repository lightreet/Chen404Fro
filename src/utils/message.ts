import {
  ElMessage,
  messageDefaults,
  type MessageOptionsWithType,
  type MessageParamsWithType,
  type MessageType,
} from 'element-plus'
import { isVNode, type AppContext } from 'vue'

const DEFAULT_MESSAGE_DURATION = 1800
const DEFAULT_MESSAGE_OFFSET = 88
const AUTO_CLOSE_THRESHOLD = 1500

export const MESSAGE_DURATION_BY_TYPE = {
  primary: DEFAULT_MESSAGE_DURATION,
  success: 1000,
  info: DEFAULT_MESSAGE_DURATION,
  warning: 2000,
  error: 2400,
} satisfies Record<MessageType, number>

let isInstalled = false

function isMessageOptions(value: MessageParamsWithType): value is MessageOptionsWithType {
  return Boolean(value) && typeof value === 'object' && !isVNode(value)
}

function withDefaultDuration(
  type: MessageType,
  options?: MessageParamsWithType,
): MessageParamsWithType {
  const duration = MESSAGE_DURATION_BY_TYPE[type]
  const showClose = duration > AUTO_CLOSE_THRESHOLD

  if (options == null) {
    return { duration, showClose }
  }

  if (!isMessageOptions(options)) {
    return { message: options, duration, showClose }
  }
  const resolvedDuration = options.duration ?? duration

  return {
    ...options,
    duration: resolvedDuration,
    showClose: options.showClose ?? resolvedDuration > AUTO_CLOSE_THRESHOLD,
  }
}

function wrapTypedMessage(type: MessageType, raw: typeof ElMessage.success) {
  return ((options?: MessageParamsWithType, appContext?: null | AppContext) =>
    raw(withDefaultDuration(type, options), appContext)) as typeof ElMessage.success
}

export function installMessageDefaults() {
  if (isInstalled) {
    return
  }

  isInstalled = true
  ;(messageDefaults as { duration: number }).duration = DEFAULT_MESSAGE_DURATION
  ;(messageDefaults as { offset: number }).offset = DEFAULT_MESSAGE_OFFSET

  // Patch typed helpers once so existing ElMessage.success/error/... calls
  // across the app inherit consistent durations without touching every page.
  ElMessage.primary = wrapTypedMessage('primary', ElMessage.primary)
  ElMessage.success = wrapTypedMessage('success', ElMessage.success)
  ElMessage.info = wrapTypedMessage('info', ElMessage.info)
  ElMessage.warning = wrapTypedMessage('warning', ElMessage.warning)
  ElMessage.error = wrapTypedMessage('error', ElMessage.error)
}
