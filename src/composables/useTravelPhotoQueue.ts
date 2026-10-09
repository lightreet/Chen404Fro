import { computed, markRaw, onBeforeUnmount, reactive } from 'vue'
import { uploadTravelMedia, type UploadResult } from '@/api/upload'
import { retryTravelUpload, travelUploadError } from '@/modules/travel-upload/policy'

export interface TravelPhotoTask {
  id: number
  target: string
  cover: boolean
  name: string
  file?: File
  status: 'queued' | 'uploading' | 'retrying' | 'failed' | 'done'
  progress: number
  retry: number
  error: string
}

/** 所有片段与封面共享一个串行队列，避免批量原图同时占满上行带宽和服务端解码内存。 */
export function useTravelPhotoQueue(receive: (image: UploadResult, task: TravelPhotoTask) => void) {
  const tasks = reactive<TravelPhotoTask[]>([])
  const busy = computed(() => tasks.some(t => ['queued', 'uploading', 'retrying'].includes(t.status)))
  const unresolved = computed(() => tasks.some(t => t.status !== 'done'))
  const failed = computed(() => tasks.some(t => t.status === 'failed'))
  let sequence = 0
  let version = 0
  let running = false
  let controller: AbortController | undefined
  let activeId: number | undefined

  async function pump() {
    if (running) return
    running = true
    const generation = version
    try {
      let task: TravelPhotoTask | undefined
      while (generation === version && (task = tasks.find(t => t.status === 'queued'))) {
        const current = task
        const abort = new AbortController()
        controller = abort
        activeId = current.id
        current.status = 'uploading'
        current.error = ''
        try {
          const image = await retryTravelUpload(() => {
            current.status = 'uploading'
            current.progress = 0
            return uploadTravelMedia(current.file!, {
              signal: abort.signal,
              onUploadProgress: event => {
                if (!abort.signal.aborted) current.progress = Math.min(99, Math.round(event.loaded / (event.total || current.file!.size) * 100))
              },
            })
          }, abort.signal, attempt => { current.status = 'retrying'; current.retry = attempt })
          if (generation !== version || abort.signal.aborted || !tasks.includes(current)) continue
          receive(image, current)
          current.status = 'done'
          current.progress = 100
          current.file = undefined
        } catch (error) {
          if (generation !== version || abort.signal.aborted) continue
          current.status = 'failed'
          current.error = travelUploadError(error)
        }
      }
    } finally {
      if (generation === version) { running = false; controller = undefined; activeId = undefined }
    }
  }

  function enqueue(file: File, target: string, cover = false) {
    tasks.push({ id: ++sequence, target, cover, name: file.name, file: markRaw(file), status: 'queued', progress: 0, retry: 0, error: '' })
    void pump()
  }
  function retry(id: number) {
    const task = tasks.find(t => t.id === id)
    if (!task || task.status !== 'failed') return
    task.status = 'queued'
    task.retry = 0
    void pump()
  }
  function remove(id: number) {
    const index = tasks.findIndex(t => t.id === id)
    if (index < 0) return
    if (activeId === id) controller?.abort()
    tasks.splice(index, 1)
  }
  function reset() {
    version++
    controller?.abort()
    controller = undefined
    activeId = undefined
    running = false
    tasks.splice(0)
  }
  onBeforeUnmount(reset)
  return { tasks, busy, unresolved, failed, enqueue, retry, remove, reset }
}
