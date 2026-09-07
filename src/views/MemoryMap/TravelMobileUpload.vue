<template>
  <main class="travel-mobile-page">
    <div class="travel-mobile-page__brand">Chen404 · 旅行照片</div>
    <section class="travel-mobile-page__content">
      <h1>把照片传到电脑</h1>
      <p class="mobile-subtitle">无需登录，从相册直接选择</p>
      <UiLoadingState :loading="loading" message="正在连接电脑…">
        <div v-if="session" class="mobile-destination">
          <span>{{ session.travelTitle || '这趟旅行' }} · 上传至</span>
          <h2>{{ session.targetLabel }}</h2>
          <p>{{ isCover ? '仅选择一张，已有封面时请在电脑确认替换' : '照片只会添加到这个旅途片段' }}</p>
        </div>
        <div v-if="error" class="mobile-error" role="alert">
          <p>{{ error }}</p>
          <UiButton v-if="credentials && !terminal" size="sm" @click="refresh">重新连接</UiButton>
        </div>
        <div v-if="!active && !loading && session" class="mobile-ended">
          <UiIcon name="clock" />
          <h2>本次手机上传已结束</h2>
          <p>请在电脑重新生成二维码。已经传入的照片仍保留在电脑编辑页。</p>
        </div>
        <div v-if="session && !queue.length && active" class="mobile-empty">
          <UiIcon name="image" />
          <strong>{{ receivedCount ? `本次已传入 ${receivedCount} 张照片` : '选择手机里的旅行照片' }}</strong>
          <p>{{ isCover ? '选择一张作为旅行封面' : '可多选，也可以分批继续添加' }}</p>
        </div>
        <ul v-if="queue.length" class="mobile-photo-list" aria-label="待上传与已上传照片">
          <li v-for="item in queue" :key="item.id" class="mobile-photo">
            <img
              :src="item.preview"
              :alt="item.file.name"
              loading="lazy"
              decoding="async"
              @error="item.previewFailed = true"
              v-show="!item.previewFailed"
            />
            <div v-if="item.previewFailed" class="mobile-photo__fallback"><UiIcon name="image" /></div>
            <div class="mobile-photo__info">
              <strong>{{ item.file.name }}</strong>
              <span v-if="item.status === 'done'">上传成功</span>
              <span v-else-if="item.status === 'uploading'">{{
                item.progress === 99 ? '正在处理照片…' : `上传中 ${item.progress}%`
              }}</span>
              <span v-else-if="item.status === 'failed'" class="mobile-photo__error">{{ item.error }}</span>
              <span v-else>待上传 · {{ (item.file.size / 1024 / 1024).toFixed(1) }} MB</span>
              <progress
                v-if="item.status === 'uploading'"
                :value="item.progress"
                max="100"
                :aria-label="`${item.file.name} 上传进度`"
              />
            </div>
            <UiButton
              v-if="item.status === 'failed' && active"
              size="sm"
              :disabled="running"
              @click="upload([item])"
              >重试</UiButton
            >
            <UiButton
              v-else-if="item.status === 'queued' || item.status === 'failed'"
              size="sm"
              variant="text"
              :disabled="running"
              @click="remove(item)"
              >移除</UiButton
            >
            <UiIcon v-else-if="item.status === 'done'" name="check" aria-label="上传成功" />
          </li>
        </ul>
        <p v-if="session" class="mobile-status" role="status">
          {{
            running
              ? '上传中，请保持此页打开'
              : receivedCount
                ? `已上传 ${receivedCount} 张，请回电脑确认并保存`
                : active
                  ? '已连接电脑'
                  : ''
          }}
        </p>
      </UiLoadingState>
    </section>
    <footer v-if="session && active" class="travel-mobile-page__footer">
      <input
        ref="fileInput"
        type="file"
        :accept="acceptTypes"
        :multiple="!isCover"
        hidden
        @change="selectFiles"
      />
      <UiButton
        v-if="pending.length"
        variant="solid"
        size="lg"
        block
        :loading="running"
        @click="upload(pending)"
      >
        {{ running ? '正在上传…' : `上传 ${pending.length} 张照片` }}
      </UiButton>
      <UiButton
        v-if="remainingSlots > 0"
        :variant="pending.length ? 'secondary' : 'solid'"
        size="lg"
        block
        :disabled="running"
        @click="fileInput?.click()"
      >
        {{ queue.length ? '继续选择照片' : '从相册选择照片' }}
      </UiButton>
      <p>
        {{
          isCover && receivedCount
            ? '已收到封面，请回到电脑确认使用'
            : `单张不超过 ${maxMb} MB · 本次还可选择 ${remainingSlots} 张`
        }}
      </p>
      <p>支持 {{ session.allowedTypes.join('、').toUpperCase() }}；HEIC 照片请先导出为 JPG。</p>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { UiButton, UiIcon, UiLoadingState } from '@/components/ui'
import {
  beginMobileBatch,
  endMobileBatch,
  getMobileUploadStatus,
  isMobileUploadForbidden,
  isMobileUploadGone,
  mobileUploadError,
  mobileUploadRequestId,
  sendMobilePhoto,
  type MobileUploadSession,
} from '@/api/travel-mobile-upload'

interface PhotoItem {
  id: string
  file: File
  preview: string
  previewFailed?: boolean
  status: 'queued' | 'uploading' | 'failed' | 'done'
  progress: number
  error: string
}
const session = ref<MobileUploadSession>()
const queue = ref<PhotoItem[]>([])
const fileInput = ref<HTMLInputElement>()
const loading = ref(true)
const running = ref(false)
const terminal = ref(false)
const connectionError = ref('')
const selectionError = ref('')
const error = computed(() => selectionError.value || connectionError.value)
const now = ref(Date.now())
let disposed = false
let refreshPromise: Promise<void> | undefined
let timer: ReturnType<typeof setTimeout> | undefined
let uploadController: AbortController | undefined
let currentBatchId: string | undefined
const clock = setInterval(() => {
  now.value = Date.now()
}, 1000)

// fragment 不发送给服务器；首次读取后移除凭证，刷新仅在当前手机标签页恢复。
function readCredentials() {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const id = hash.get('session') || ''
  if (!/^[a-f0-9-]{36}$/.test(id)) return null
  const storageKey = `travel-mobile:${id}`
  let token = hash.get('token') || ''
  try {
    if (token) sessionStorage.setItem(storageKey, token)
    else token = sessionStorage.getItem(storageKey) || ''
  } catch {
    /* 禁用存储时仍可完成当前打开页面的上传。 */
  }
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  window.history.replaceState(window.history.state, '', `${window.location.pathname}#session=${id}`)
  return { id, token }
}
const credentials = readCredentials()
const active = computed(
  () => !terminal.value && session.value?.status === 'active' && session.value.expiresAt > now.value,
)
const isCover = computed(() => session.value?.targetKind === 'cover')
const pending = computed(() =>
  queue.value.filter((item) => item.status === 'queued' || item.status === 'failed'),
)
const receivedCount = computed(
  () =>
    new Set([
      ...(session.value?.receipts.filter((item) => item.status === 'done').map((item) => item.requestId) ||
        []),
      ...queue.value.filter((item) => item.status === 'done').map((item) => item.id),
    ]).size,
)
const remainingSlots = computed(() =>
  Math.max(
    0,
    (session.value?.maxCount || 0) -
      receivedCount.value -
      queue.value.filter((item) => item.status !== 'done').length,
  ),
)
const maxMb = computed(() => Math.floor((session.value?.maxFileBytes || 0) / 1024 / 1024))
const acceptTypes = computed(() => (session.value?.allowedTypes || []).map((type) => `.${type}`).join(','))

function refresh(): Promise<void> {
  if (refreshPromise) return refreshPromise
  refreshPromise = loadStatus().finally(() => {
    refreshPromise = undefined
  })
  return refreshPromise
}

async function loadStatus() {
  if (!credentials) {
    connectionError.value = '上传链接不完整，请重新扫描电脑上的二维码'
    loading.value = false
    terminal.value = true
    return
  }
  if (disposed) return
  try {
    if (!running.value && currentBatchId) await releaseBatch()
    const next = await getMobileUploadStatus(
      credentials.id,
      credentials.token,
      running.value ? currentBatchId : undefined,
    )
    if (disposed) return
    session.value = next
    connectionError.value = ''
    for (const item of queue.value) {
      if (next.receipts.some((receipt) => receipt.requestId === item.id && receipt.status === 'done')) {
        item.status = 'done'
        item.progress = 100
        item.error = ''
      }
    }
  } catch (cause) {
    if (disposed) return
    connectionError.value = mobileUploadError(cause)
    if (isMobileUploadForbidden(cause) || isMobileUploadGone(cause)) terminal.value = true
  } finally {
    loading.value = false
    clearTimeout(timer)
    if (!disposed && !terminal.value && (!session.value || active.value))
      timer = setTimeout(() => {
        void refresh()
      }, 4000)
  }
}

function selectFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = Array.from(input.files || [])
  input.value = ''
  selectionError.value = ''
  if (!active.value || !session.value) return
  if (selected.length > remainingSlots.value) {
    selectionError.value = `本次还可选择 ${remainingSlots.value} 张照片`
    return
  }
  const rejected: string[] = []
  for (const file of selected) {
    if (file.size > session.value.maxFileBytes || file.size === 0) {
      rejected.push(`${file.name}：照片为空或超过 ${maxMb.value} MB`)
      continue
    }
    if (/\.(heic|heif)$/i.test(file.name)) {
      rejected.push(`${file.name}：请从相册导出为 JPG 后再选`)
      continue
    }
    if (
      queue.value.some(
        (item) =>
          item.file.name === file.name &&
          item.file.size === file.size &&
          item.file.lastModified === file.lastModified,
      )
    )
      continue
    queue.value.push({
      id: mobileUploadRequestId(),
      file,
      preview: URL.createObjectURL(file),
      status: 'queued',
      progress: 0,
      error: '',
    })
  }
  if (rejected.length) selectionError.value = rejected.join('；')
}

async function upload(items: PhotoItem[]) {
  if (running.value || !active.value || !credentials) return
  running.value = true
  selectionError.value = ''
  const batch = [...items]
  try {
    if (currentBatchId) await releaseBatch()
    currentBatchId = mobileUploadRequestId()
    await beginMobileBatch(credentials.id, credentials.token, currentBatchId)
    for (const item of batch) {
      if (!active.value || disposed) break
      if (item.status === 'done') continue
      item.status = 'uploading'
      item.error = ''
      item.progress = 0
      uploadController = new AbortController()
      try {
        await sendMobilePhoto(
          credentials.id,
          credentials.token,
          item.id,
          item.file,
          (progress) => {
            item.progress = progress
          },
          uploadController.signal,
        )
        item.status = 'done'
        item.progress = 100
      } catch (cause) {
        // 回执可能已落库但响应在弱网中丢失，先拉取状态，再决定是否展示失败。
        await refresh()
        if ((item as PhotoItem).status !== 'done') {
          item.status = 'failed'
          item.error = mobileUploadError(cause)
        }
      }
    }
  } catch (cause) {
    if (!disposed) selectionError.value = mobileUploadError(cause)
  } finally {
    running.value = false
    try {
      await releaseBatch()
    } catch (cause) {
      if (!disposed) connectionError.value = mobileUploadError(cause)
    }
    await refresh()
  }
}

async function releaseBatch() {
  if (!credentials || !currentBatchId) return
  const id = currentBatchId
  await endMobileBatch(credentials.id, credentials.token, id)
  if (currentBatchId === id) currentBatchId = undefined
}
function remove(item: PhotoItem) {
  URL.revokeObjectURL(item.preview)
  queue.value = queue.value.filter((value) => value.id !== item.id)
}
function onVisible() {
  if (!document.hidden) void refresh()
}
function warnLeaving(event: BeforeUnloadEvent) {
  if (running.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onMounted(() => {
  void refresh()
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('beforeunload', warnLeaving)
})
onBeforeUnmount(() => {
  disposed = true
  clearTimeout(timer)
  clearInterval(clock)
  uploadController?.abort()
  queue.value.forEach((item) => URL.revokeObjectURL(item.preview))
  document.removeEventListener('visibilitychange', onVisible)
  window.removeEventListener('beforeunload', warnLeaving)
})
</script>

<style scoped lang="scss">
.travel-mobile-page {
  max-width: 520px;
  margin: 0 auto;
  min-height: 100dvh;
  background: var(--color-surface);
  color: var(--color-text-primary);
}
.travel-mobile-page__brand {
  padding: 20px 24px 16px;
  font-weight: 600;
  color: var(--color-accent-readable);
  border-bottom: 1px solid var(--color-border);
}
.travel-mobile-page__content {
  padding: 28px 24px 24px;
}
h1 {
  font-size: 26px;
  line-height: 1.35;
  font-weight: 650;
  margin: 0 0 8px;
  text-wrap: balance;
}
h2 {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.5;
  margin: 6px 0;
  overflow-wrap: anywhere;
}
p {
  margin: 0;
  line-height: 1.7;
}
.mobile-subtitle,
.mobile-destination p,
.mobile-destination span {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.mobile-destination {
  padding: 20px 0;
  margin-top: 20px;
  border-block: 1px solid var(--color-border);
}
.mobile-empty,
.mobile-ended {
  display: grid;
  gap: 12px;
  justify-items: center;
  text-align: center;
  padding: 42px 0;
}
.mobile-empty > .ui-icon,
.mobile-ended > .ui-icon {
  font-size: 32px;
  color: var(--color-text-link);
}
.mobile-empty p,
.mobile-ended p {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.mobile-error {
  padding: 12px 0;
  color: var(--color-danger);
  font-size: 13px;
  overflow-wrap: anywhere;
}
.mobile-status {
  font-size: 13px;
  font-weight: 600;
  margin-top: 18px;
}
.travel-mobile-page__footer {
  position: sticky;
  bottom: 0;
  padding: 16px 24px max(24px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  display: grid;
  gap: 10px;
}
.travel-mobile-page__footer p {
  font-size: 12px;
  text-align: center;
  color: var(--color-text-secondary);
}
.mobile-photo-list {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
}
.mobile-photo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border);
}
.mobile-photo img,
.mobile-photo__fallback {
  flex: 0 0 64px;
  width: 64px;
  height: 76px;
  object-fit: cover;
  border-radius: 6px;
  background: var(--color-surface-muted);
}
.mobile-photo__fallback {
  display: grid;
  place-items: center;
}
.mobile-photo__info {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 5px;
}
.mobile-photo__info strong {
  font-size: 13px;
  overflow-wrap: anywhere;
}
.mobile-photo__info span {
  font-size: 12px;
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
}
.mobile-photo__info .mobile-photo__error {
  color: var(--color-danger);
}
.mobile-photo progress {
  width: 100%;
  height: 5px;
  accent-color: var(--color-accent);
}
@media (min-width: 700px) {
  .travel-mobile-page {
    min-height: auto;
    margin-block: 32px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    overflow: hidden;
  }
}
@media (max-width: 360px) {
  .travel-mobile-page__content,
  .travel-mobile-page__footer {
    padding-inline: 16px;
  }
}
</style>
