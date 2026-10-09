/** 旅行原图保留 EXIF，由服务端解析后压缩；弱网下为单张传输留足时间。 */
export const TRAVEL_UPLOAD_TIMEOUT_MS = 120_000
export const TRAVEL_IMAGE_ACCEPT = '.jpg,.jpeg,.png,.gif,.webp'
export const TRAVEL_MEDIA_ACCEPT = `${TRAVEL_IMAGE_ACCEPT},.mp4,.mov,.webm`
export const TRAVEL_VIDEO_MAX_BYTES = 60 * 1024 * 1024
export const TRAVEL_VIDEO_MAX_SECONDS = 30
export const TRAVEL_VIDEO_TIMEOUT_MS = 240_000

export function isTravelVideo(file: Pick<File, 'name' | 'type'>): boolean {
  return /\.(mp4|mov|webm)$/i.test(file.name) || file.type.startsWith('video/')
}

/** 选文件时提前反馈，最终格式与时长仍由服务端验证。 */
export async function validateTravelMedia(file: File, maxImageBytes: number): Promise<string | undefined> {
  if (!isTravelVideo(file)) return validateTravelPhoto(file, maxImageBytes)
  if (!/\.(mp4|mov|webm)$/i.test(file.name)) return '请选择 MP4、MOV 或 WebM 视频'
  if (!file.size) return '视频为空，请重新选择'
  if (file.size > TRAVEL_VIDEO_MAX_BYTES) return '视频不能超过 60 MB'
  const duration = await readVideoDuration(file)
  // 某些手机不能在转码前解码 MOV/HEVC，仍允许服务端探测与转码。
  if (duration != null && (!Number.isFinite(duration) || duration <= 0 || duration >= TRAVEL_VIDEO_MAX_SECONDS)) {
    return '视频时长须少于 30 秒，请裁剪后上传'
  }
}

function readVideoDuration(file: File): Promise<number | undefined> {
  return new Promise(resolve => {
    const element = document.createElement('video')
    const url = URL.createObjectURL(file)
    const finish = (duration?: number) => {
      clearTimeout(timer)
      element.onloadedmetadata = null
      element.onerror = null
      element.removeAttribute('src')
      element.load()
      URL.revokeObjectURL(url)
      resolve(duration)
    }
    const timer = setTimeout(() => finish(), 5000)
    element.preload = 'metadata'
    element.onloadedmetadata = () => finish(element.duration)
    element.onerror = () => finish()
    element.src = url
  })
}

export function travelUploadError(error: unknown): string {
  const e = error as { code?: string; businessCode?: number; response?: { status?: number; data?: { message?: string } }; message?: string }
  const status = e?.response?.status || e?.businessCode
  if (status === 413) return '文件超过服务器接收限制，请压缩后重新选择'
  if (status === 401) return '登录已过期，请重新登录后重试'
  if (status === 403) return '没有上传权限，请确认当前账号'
  if (status === 429) return '上传过于频繁，请稍后重试'
  if (e?.code === 'ECONNABORTED' || e?.code === 'ETIMEDOUT') return '上传超时，文件已保留，请检查网络后重试'
  if (e?.code === 'ERR_NETWORK') return '网络连接中断，文件已保留，可以重试'
  if (status && status >= 500) return '服务器暂时无法处理文件，请稍后重试'
  return e?.response?.data?.message || e?.message || '文件上传失败，请重试'
}

export function isRetryableUploadError(error: unknown): boolean {
  const e = error as { code?: string; response?: { status?: number } }
  return ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(e?.code || '')
    || [408, 502, 503, 504].includes(e?.response?.status || 0)
}

export function waitForUploadRetry(attempt: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Upload canceled', 'AbortError')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, 1500 * attempt)
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
  })
}

export async function retryTravelUpload<T>(
  send: () => Promise<T>, signal: AbortSignal, onRetry: (attempt: number) => void = () => {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    if (signal.aborted) throw new DOMException('Upload canceled', 'AbortError')
    try { return await send() } catch (error) {
      if (signal.aborted || attempt >= 2 || !isRetryableUploadError(error)) throw error
      onRetry(attempt + 1)
      await waitForUploadRetry(attempt + 1, signal)
    }
  }
}

export function validateTravelPhoto(file: File, maxBytes: number): string | undefined {
  if (/\.(heic|heif)$/i.test(file.name) || /image\/hei[cf]/i.test(file.type)) return '请从相册导出为 JPG 后再选择'
  if (!/\.(jpe?g|png|gif|webp)$/i.test(file.name)) return '请选择 JPG、PNG、GIF 或 WebP 图片'
  if (!file.size) return '照片为空，请重新选择'
  if (file.size > maxBytes) return `单张照片不能超过 ${Math.floor(maxBytes / 1024 / 1024)} MB`
}
