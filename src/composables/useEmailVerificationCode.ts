import { onScopeDispose, ref } from 'vue'
import { sendVerifyCode } from '@/api/auth'
import { notify } from '@/lib/feedback'
import { notifyAuthFailure } from '@/utils/authFeedback'
import { isValidEmail } from '@/utils/validation'

const RESEND_COOLDOWN_SECONDS = 60
const messages = {
  register: { empty: '请先输入邮箱', failure: '验证码发送失败，请稍后重试' },
  reset: { empty: '请先输入注册邮箱', failure: '重置验证码发送失败，请稍后重试' },
} as const

/** 注册与找回密码共用发送状态和冷却计时；页面离开后不再处理迟到的响应。 */
export function useEmailVerificationCode(type: keyof typeof messages, getEmail: () => string) {
  const sending = ref(false)
  const remaining = ref(0)
  let timer: number | undefined
  let deadline = 0
  let disposed = false

  function reset() {
    if (timer !== undefined) window.clearInterval(timer)
    timer = undefined
    remaining.value = 0
  }

  function updateRemaining() {
    remaining.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    if (remaining.value === 0) reset()
  }

  async function send() {
    if (disposed || sending.value || remaining.value > 0) return
    const email = getEmail().trim()
    if (!email) { notify.warning(messages[type].empty); return }
    if (!isValidEmail(email)) { notify.warning('邮箱格式不正确或长度超过 100 位'); return }

    sending.value = true
    try {
      const result = await sendVerifyCode({ email, type })
      if (disposed) return
      const seconds = Number.isFinite(result.expireSeconds)
        ? Math.max(1, Math.min(RESEND_COOLDOWN_SECONDS, result.expireSeconds))
        : RESEND_COOLDOWN_SECONDS
      reset()
      deadline = Date.now() + seconds * 1000
      updateRemaining()
      // 基于截止时间计算，浏览器后台节流后也不会把冷却时间拉长。
      timer = window.setInterval(updateRemaining, 1000)
      notify.success('验证码已发送到邮箱')
    } catch (error) {
      if (!disposed) notifyAuthFailure(error, messages[type].failure)
    } finally {
      sending.value = false
    }
  }

  onScopeDispose(() => { disposed = true; reset() })
  return { sending, remaining, send, reset }
}
