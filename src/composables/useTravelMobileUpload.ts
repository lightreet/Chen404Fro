import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import QRCode from 'qrcode'
import {
  closeMobileUpload,
  createMobileUpload,
  isMobileUploadForbidden,
  isMobileUploadGone,
  mobileUploadError,
  pollMobileUpload,
  type MobileUploadSession,
  type MobileUploadTarget,
} from '@/api/travel-mobile-upload'
import type { UploadResult } from '@/api/upload'
import { readAccessToken } from '@/utils/authSession'

const POLL_INTERVAL_MS = 2500
const IMAGE_TICKET_REFRESH_MS = 120_000

/** 每个旅行编辑器最多保持一个活动目标；收起面板不停止轮询。 */
export function useTravelMobileUpload(
  receive: (image: UploadResult, target: MobileUploadTarget) => void,
  refreshImage?: (image: UploadResult) => void,
) {
  const session = ref<MobileUploadSession>()
  const target = ref<MobileUploadTarget>()
  const qr = ref('')
  const expanded = ref(true)
  const busy = ref(false)
  const error = ref('')
  const now = ref(Date.now())
  const delivered = new Set<string>()
  let lastImageRefresh = Date.now()
  let timer: ReturnType<typeof setTimeout> | undefined
  let polling: Promise<void> | undefined
  let disposed = false
  let revision = 0
  const ticker = setInterval(() => {
    now.value = Date.now()
  }, 1000)
  const active = computed(() => session.value?.status === 'active' && session.value.expiresAt > now.value)

  function isCurrent(version: number, id?: string) {
    return !disposed && version === revision && (!id || session.value?.sessionId === id)
  }

  function accept(next: MobileUploadSession) {
    session.value = next
    if (!target.value) return
    const renewImages = Date.now() - lastImageRefresh > IMAGE_TICKET_REFRESH_MS
    for (const image of next.images) {
      const key = String(image.id || image.url.split('?')[0])
      if (delivered.has(key)) {
        if (renewImages) refreshImage?.(image)
        continue
      }
      receive(image, target.value)
      delivered.add(key)
    }
    if (renewImages) lastImageRefresh = Date.now()
  }

  function schedule() {
    clearTimeout(timer)
    if (!disposed && active.value)
      timer = setTimeout(() => {
        void poll()
      }, POLL_INTERVAL_MS)
  }

  async function poll() {
    if (polling) return polling
    const id = session.value?.sessionId
    if (!id || disposed) return
    const version = revision
    polling = (async () => {
      try {
        const next = await pollMobileUpload(id)
        if (isCurrent(version, id)) {
          accept(next)
          error.value = ''
        }
      } catch (cause) {
        if (!isCurrent(version, id)) return
        error.value = mobileUploadError(cause)
        if (isMobileUploadForbidden(cause) && session.value) session.value.status = 'closed'
        if (isMobileUploadGone(cause) && session.value) session.value.status = 'expired'
      } finally {
        polling = undefined
        schedule()
      }
    })()
    return polling
  }

  async function finish(requireIdle = true) {
    const id = session.value?.sessionId
    const version = revision
    if (!id) return
    clearTimeout(timer)
    await polling
    if (!isCurrent(version, id)) return
    clearTimeout(timer)
    if (!session.value || session.value.status !== 'active') return
    try {
      const closed = await closeMobileUpload(id, requireIdle)
      if (isCurrent(version, id)) {
        accept(closed)
        error.value = ''
      }
    } catch (cause) {
      if (!isCurrent(version, id)) return
      error.value = mobileUploadError(cause)
      // 会话保留期已结束时只保留已回填内容，不能阻止保存本地编辑器中的照片。
      if (isMobileUploadGone(cause)) {
        session.value.status = 'expired'
        return
      }
      schedule()
      throw cause
    }
  }

  async function start(nextTarget: MobileUploadTarget) {
    if (busy.value || disposed) return
    const version = ++revision
    let createdId: string | undefined
    busy.value = true
    error.value = ''
    try {
      await finish(true)
      if (!isCurrent(version)) return
      qr.value = ''
      const created = await createMobileUpload(nextTarget)
      createdId = created.sessionId
      if (!isCurrent(version)) {
        void closeMobileUpload(createdId).catch(() => {})
        return
      }
      target.value = nextTarget
      delivered.clear()
      lastImageRefresh = Date.now()
      session.value = created.session
      expanded.value = true
      if (!created.uploadUrl) throw new Error('请重启更新后的后端服务，再生成二维码')
      const image = await QRCode.toDataURL(created.uploadUrl, {
        width: 240,
        margin: 4,
        errorCorrectionLevel: 'M',
      })
      if (!isCurrent(version, createdId)) return
      qr.value = image
      schedule()
    } catch (cause) {
      if (createdId) void closeMobileUpload(createdId).catch(() => {})
      if (isCurrent(version)) {
        // 原批次仍在上传而拒绝切换时，保留原目标的二维码；新目标不会显示它。
        if (createdId || session.value?.status !== 'active') qr.value = ''
        if (createdId && session.value?.sessionId === createdId) session.value.status = 'closed'
        error.value = mobileUploadError(cause)
      }
    } finally {
      if (isCurrent(version)) busy.value = false
    }
  }

  // 离开/关闭浏览器时尽力撤销；网络中断则由服务器的桌面在线租约自动失效。
  function revokeOnExit() {
    if (!session.value || session.value.status !== 'active') return
    const api = import.meta.env.VITE_API_BASE_URL || '/api'
    void fetch(`${api}/upload/travel-mobile/sessions/${session.value.sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${readAccessToken() || ''}` },
      keepalive: true,
    }).catch(() => {})
  }
  function detach() {
    revision += 1
    revokeOnExit()
    clearTimeout(timer)
    session.value = undefined
    target.value = undefined
    qr.value = ''
    busy.value = false
    error.value = ''
    delivered.clear()
  }
  window.addEventListener('pagehide', detach)
  onBeforeUnmount(() => {
    detach()
    disposed = true
    clearTimeout(timer)
    clearInterval(ticker)
    window.removeEventListener('pagehide', detach)
  })

  return reactive({ session, target, qr, expanded, busy, error, active, start, finish, poll, detach })
}
