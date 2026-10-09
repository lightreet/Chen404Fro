<template>
  <div class="travel-upload-queue">
    <p class="queue-hint">图片支持 JPG、PNG、GIF、WebP，不超过 {{ DEFAULT_IMAGE_MAX_MB }} MB；视频支持 MP4、MOV、WebM，少于 30 秒且不超过 60 MB。文件依次上传，可继续编辑文字。</p>
    <p v-if="tasks.length" role="status">已上传 {{ completed }} / {{ tasks.length }} 项<span v-if="pending.length">，请保持页面打开</span></p>
    <ul v-if="pending.length" aria-label="影像上传队列">
      <li v-for="task in pending" :key="task.id">
        <div class="queue-details">
          <strong>{{ task.name }}</strong>
          <span v-if="task.status === 'queued'">等待上传</span>
          <span v-else-if="task.status === 'retrying'">连接中断，正在第 {{ task.retry }} 次重试…</span>
          <span v-else-if="task.status === 'uploading'">{{ task.progress >= 99 ? '正在处理文件…' : `上传中 ${task.progress}%` }}</span>
          <span v-else role="alert">{{ task.error }}</span>
          <progress v-if="task.status === 'uploading'" :value="task.progress" max="100" :aria-label="`${task.name} 上传进度`" />
        </div>
        <UiButton v-if="task.status === 'failed'" size="sm" :disabled="disabled" @click="$emit('retry', task.id)">重试</UiButton>
        <UiButton size="sm" :disabled="disabled" @click="$emit('remove', task.id)">{{ task.status === 'failed' ? '移除' : '取消' }}</UiButton>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UiButton } from '@/components/ui'
import { DEFAULT_IMAGE_MAX_MB } from '@/utils/validation'
import type { TravelPhotoTask } from '@/composables/useTravelPhotoQueue'
const props = defineProps<{ tasks: TravelPhotoTask[]; disabled?: boolean }>()
defineEmits<{ retry: [id: number]; remove: [id: number] }>()
const pending = computed(() => props.tasks.filter(t => t.status !== 'done'))
const completed = computed(() => props.tasks.length - pending.value.length)
</script>

<style scoped lang="scss">
.travel-upload-queue { margin-block: 12px; padding: 8px 12px; background: var(--color-surface); color: var(--color-text-secondary); font-size: 14px; line-height: 1.6; }
p { margin-block: 6px; }
ul { list-style: none; padding: 0; margin: 0; max-height: 280px; overflow: auto; }
li { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding-block: 8px; border-bottom: 1px solid var(--color-border); }
.queue-details { display: flex; flex: 1 1 140px; min-width: 0; flex-direction: column; overflow-wrap: anywhere; }
strong { color: var(--color-text-primary); font-weight: 500; }
progress { width: 100%; height: 6px; accent-color: var(--color-accent); }
</style>
