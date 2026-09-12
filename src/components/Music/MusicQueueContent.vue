<template>
  <div class="music-queue-content" :class="{ 'is-compact': compact }">
    <div ref="scrollBody" class="music-queue-content__body">
      <p v-if="!compact" class="queue-summary">{{ player.queue.length }} 首 · {{ modeLabel }}</p>
      <section v-if="!compact && player.currentTrack" aria-label="当前歌曲">
        <h3>{{ player.playing ? '正在播放' : '已暂停' }}</h3>
        <div class="queue-current">
          <UiIcon name="music" :size="20" />
          <span class="queue-current__copy"><strong>{{ player.currentTrack.title }}</strong><small>{{ player.currentTrack.artist }}</small></span>
          <button class="app-mobile-icon" type="button" :aria-label="player.playing ? '暂停播放' : '继续播放'" @click="player.toggle()">
            <UiIcon :name="player.playing ? 'pause' : 'play'" :size="22" />
          </button>
        </div>
      </section>
      <section aria-label="待播歌曲">
        <h3 v-if="!compact" class="queue-heading">待播 {{ player.upcomingTracks.length }} 首<span v-if="player.upcomingTracks.length > 1">拖动右侧排序</span></h3>
        <p v-if="player.mode === 'shuffle'" class="queue-hint">随机模式下，实际播放顺序由播放器选择。</p>
        <p v-else-if="player.mode === 'single'" class="queue-hint">当前歌曲循环中，切换播放模式后按队列播放。</p>
        <p :id="sortHelpId" class="queue-status">拖动排序手柄调整顺序，或点击手柄选择移动方向；键盘可用上下方向键调整。</p>
        <ol v-if="player.upcomingTracks.length" ref="queueRows" class="queue-tracks"
          @pointermove="dragOver" @pointerup="endDrag" @pointercancel="cancelDrag" @lostpointercapture="cancelDrag">
          <li v-for="(track, index) in visibleUpcomingTracks" :key="track.id" :data-track-id="track.id"
            :class="{ 'is-dragging': draggedTrackId === track.id && didDrag }">
            <button class="queue-track" type="button" :aria-label="`立即播放 ${track.title}`" @click="player.playTrack(track)">
              <span class="queue-index">{{ index + 1 }}</span>
              <span class="queue-copy"><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span>
            </button>
            <div class="queue-actions">
              <button class="app-mobile-icon" type="button" :aria-label="`移除 ${track.title}`" @click="removeTrack(track)"><UiIcon name="close" :size="20" /></button>
              <button class="app-mobile-icon queue-sort-handle" type="button" :disabled="player.upcomingTracks.length < 2"
                :aria-label="`排序 ${track.title}`" :aria-describedby="sortHelpId" :aria-expanded="sortMenu === track.id"
                @pointerdown="startDrag($event, track)" @click="handleSortClick($event, track.id)" @contextmenu.prevent
                @keydown.up.prevent="moveTrack(track, -1)" @keydown.down.prevent="moveTrack(track, 1)">
                <UiIcon name="drag" :size="20" />
              </button>
            </div>
            <div v-if="sortMenu === track.id" class="queue-sort-menu">
              <button type="button" :disabled="index === 0" @click="moveTrack(track, -1)">向前移动</button>
              <button type="button" :disabled="index === player.upcomingTracks.length - 1" @click="moveTrack(track, 1)">向后移动</button>
            </div>
          </li>
        </ol>
        <p v-else-if="player.currentTrack" class="queue-hint">本轮没有待播歌曲了，可以回曲库继续添加。</p>
        <UiEmpty v-else title="队列还是空的" description="点击歌曲旁的加号，安排接下来想听的歌。" icon="music" size="sm" />
      </section>
      <details v-if="playedTracks.length" class="queue-history">
        <summary>本轮已播 {{ playedTracks.length }} 首</summary>
        <ol class="queue-tracks">
          <li v-for="track in playedTracks" :key="track.id">
            <button class="queue-track" type="button" :aria-label="`重新播放 ${track.title}`" @click="player.playTrack(track)">
              <span class="queue-copy"><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span>
            </button>
            <button class="app-mobile-icon" type="button" :aria-label="`移除 ${track.title}`" @click="removeTrack(track)"><UiIcon name="close" :size="20" /></button>
          </li>
        </ol>
      </details>
      <span class="queue-status" role="status">{{ status }}</span>
    </div>
    <div v-if="!compact" class="queue-footer">
      <template v-if="confirmClear && player.upcomingTracks.length">
        <p>清空 {{ player.upcomingTracks.length }} 首待播歌曲？当前歌曲会保留。</p>
        <UiButton variant="text" @click="confirmClear = false">取消</UiButton>
        <UiButton @click="clearQueue">确认清空</UiButton>
      </template>
      <template v-else>
        <UiButton variant="text" :disabled="!player.upcomingTracks.length" @click="confirmClear = true">清空待播</UiButton>
        <UiButton @click="emit('close')">完成</UiButton>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { UiButton, UiEmpty, UiIcon } from '@/components/ui'
import { useMusicPlayerStore } from '@/stores/music-player'
import { PLAY_MODES } from '@/modules/music/presentation'
import type { MusicTrack } from '@/types'

const props = withDefaults(defineProps<{ active?: boolean; compact?: boolean }>(), { active: true, compact: false })
const emit = defineEmits<{ close: [] }>()
const sortHelpId = `music-queue-sort-help-${useId()}`
const scrollBody = ref<HTMLElement>()
const player = useMusicPlayerStore()
const status = ref('')
const confirmClear = ref(false)
const queueRows = ref<HTMLOListElement>()
const draftTracks = ref<MusicTrack[] | null>(null)
const draggedTrackId = ref<number | null>(null)
const didDrag = ref(false)
const sortMenu = ref<number | null>(null)
const visibleUpcomingTracks = computed(() => draftTracks.value ?? player.upcomingTracks)
const DRAG_THRESHOLD = 6
const SCROLL_EDGE = 48
const SCROLL_STEP = 12
let activePointerId: number | null = null
let dragStartY = 0
let pointerY = 0
let scrollFrame: number | null = null
const playedTracks = computed(() => player.queue.slice(0, Math.max(0, player.currentIndex)))
const modeLabel = computed(() => PLAY_MODES[player.mode].label)
watch(() => props.active, () => { cancelDrag(); confirmClear.value = false; sortMenu.value = null; status.value = '' })
// 播放结束或其他入口更改队列时，丢弃拖动预览，避免覆盖新的播放状态。
watch(() => player.upcomingTracks.map(track => track.id), () => { cancelDrag(); sortMenu.value = null })
onMounted(() => {
  window.addEventListener('blur', cancelDrag)
  window.addEventListener('keydown', handleSortEscape, true)
})
onBeforeUnmount(() => {
  cancelDrag()
  window.removeEventListener('blur', cancelDrag)
  window.removeEventListener('keydown', handleSortEscape, true)
})

function handleSortEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !props.active) return
  if (activePointerId === null && sortMenu.value === null) {
    if (props.compact) {
      event.preventDefault()
      event.stopImmediatePropagation()
      emit('close')
    }
    return
  }
  // 在弹窗自身的 Escape 关闭逻辑之前取消当前排序操作。
  event.preventDefault()
  event.stopImmediatePropagation()
  cancelDrag()
  sortMenu.value = null
}

function moveTrack(track: MusicTrack, offset: number) {
  cancelDrag()
  sortMenu.value = null
  if (player.moveUpcoming(track.id, offset)) {
    const index = player.upcomingTracks.findIndex(item => item.id === track.id)
    status.value = `《${track.title}》已移到待播第 ${index + 1} 位`
    void nextTick(() => queueRows.value?.querySelector<HTMLButtonElement>(`[data-track-id="${track.id}"] .queue-sort-handle`)?.focus({ preventScroll: true }))
  }
}

function startDrag(event: PointerEvent, track: MusicTrack) {
  if (!event.isPrimary || event.button !== 0 || activePointerId !== null || !queueRows.value) return
  activePointerId = event.pointerId
  draggedTrackId.value = track.id
  dragStartY = pointerY = event.clientY
  draftTracks.value = [...player.upcomingTracks]
  didDrag.value = false
  // 捕获到不参与重排的列表上，避免手柄随歌曲移动后丢失触摸事件。
  queueRows.value.setPointerCapture(event.pointerId)
}

function dragOver(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return
  pointerY = event.clientY
  if (!didDrag.value && Math.abs(pointerY - dragStartY) < DRAG_THRESHOLD) return
  event.preventDefault()
  didDrag.value = true
  sortMenu.value = null
  updateDragPosition()
  if (scrollFrame === null) scrollFrame = requestAnimationFrame(scrollWhileDragging)
}

function updateDragPosition() {
  if (!draftTracks.value || !queueRows.value) return
  const from = draftTracks.value.findIndex(track => track.id === draggedTrackId.value)
  if (from < 0) return
  let target = from
  Array.from(queueRows.value.children).forEach((row, index) => {
    const rect = row.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    if (index < from && pointerY < midpoint && target === from) target = index
    if (index > from && pointerY > midpoint) target = index
  })
  if (target === from) return
  const [track] = draftTracks.value.splice(from, 1)
  if (track) draftTracks.value.splice(target, 0, track)
}

function scrollWhileDragging() {
  scrollFrame = null
  if (!didDrag.value || activePointerId === null) return
  const viewport = scrollBody.value
  if (viewport) {
    const rect = viewport.getBoundingClientRect()
    const edgeDistance = pointerY < rect.top + SCROLL_EDGE
      ? pointerY - rect.top - SCROLL_EDGE
      : pointerY > rect.bottom - SCROLL_EDGE ? pointerY - rect.bottom + SCROLL_EDGE : 0
    const step = Math.max(-SCROLL_STEP, Math.min(SCROLL_STEP, edgeDistance / SCROLL_EDGE * SCROLL_STEP))
    const previousTop = viewport.scrollTop
    viewport.scrollTop += step
    if (viewport.scrollTop !== previousTop) updateDragPosition()
  }
  scrollFrame = requestAnimationFrame(scrollWhileDragging)
}

function endDrag(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return
  const trackId = draggedTrackId.value
  const track = player.upcomingTracks.find(item => item.id === trackId)
  const from = player.upcomingTracks.findIndex(item => item.id === trackId)
  const target = draftTracks.value?.findIndex(item => item.id === trackId) ?? -1
  const moved = didDrag.value
  cancelDrag()
  if (moved && track && target >= 0 && from !== target) moveTrack(track, target - from)
  else if (!moved && track) toggleSortMenu(track.id)
}

function cancelDrag() {
  const pointer = activePointerId
  activePointerId = null
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame)
  scrollFrame = null
  draggedTrackId.value = null
  draftTracks.value = null
  didDrag.value = false
  if (pointer !== null && queueRows.value?.hasPointerCapture(pointer)) queueRows.value.releasePointerCapture(pointer)
}

function toggleSortMenu(trackId: number) {
  sortMenu.value = sortMenu.value === trackId ? null : trackId
}

function handleSortClick(event: MouseEvent, trackId: number) {
  // 指针点击在 pointerup 处理；detail=0 保留键盘和辅助技术的点击入口。
  if (event.detail === 0) toggleSortMenu(trackId)
}

function removeTrack(track: MusicTrack) {
  if (player.removeFromQueue(track.id)) status.value = `已移除《${track.title}》`
}

function clearQueue() {
  player.clearUpcoming()
  status.value = '已清空待播歌曲'
  confirmClear.value = false
}
</script>

<style scoped lang="scss">
.music-queue-content { display: flex; flex: 1; flex-direction: column; min-height: 0; }
.music-queue-content__body { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0 4px; }
.music-queue-content.is-compact .music-queue-content__body { padding-inline: 12px; }
.is-compact .queue-track { min-height: 56px; padding-block: 6px; }
.is-compact .queue-copy strong { font-size: 14px; }
.queue-summary, .queue-hint { color: var(--color-text-secondary); font-size: 13px; line-height: 1.6; margin: 0 0 12px; }
.music-queue-content h3 { margin: 20px 0 8px; font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
.queue-heading { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; }
.queue-heading > span { font-size: 12px; font-weight: 400; }
.queue-current { display: flex; align-items: center; gap: 10px; color: var(--color-accent-readable); }
.queue-current__copy { min-width: 0; flex: 1; }
.queue-current strong, .queue-copy strong { display: block; font-size: 15px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.queue-current small, .queue-copy small { display: block; color: var(--color-text-secondary); font-size: 12px; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.queue-tracks { list-style: none; padding: 0; margin: 0; }
.queue-tracks li { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; border-bottom: 1px solid var(--color-border-light); }
.queue-tracks li.is-dragging { background: var(--color-accent-soft); outline: 1px solid var(--color-accent-readable); outline-offset: -1px; border-radius: var(--radius-md); }
.queue-track { display: flex; gap: 10px; align-items: center; flex: 1; min-width: 0; min-height: 64px; padding: 10px 0; border: 0; background: transparent; text-align: left; color: var(--color-text-primary); cursor: pointer; }
.queue-index { width: 18px; flex: none; color: var(--color-text-secondary); font-size: 12px; font-variant-numeric: tabular-nums; }
.queue-copy { min-width: 0; }
.queue-actions { display: flex; flex: none; }
.queue-actions button:disabled { opacity: .3; cursor: default; }
.queue-sort-handle { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0; background: transparent; color: var(--color-text-secondary); touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; }
.is-dragging .queue-sort-handle { cursor: grabbing; color: var(--color-accent-readable); }
.queue-sort-handle:focus-visible, .queue-sort-menu button:focus-visible { outline: 2px solid var(--color-accent-readable); outline-offset: -2px; }
.queue-sort-menu { display: flex; justify-content: flex-end; flex-basis: 100%; gap: 8px; padding-bottom: 8px; }
.queue-sort-menu button { min-height: 44px; padding: 0 12px; border: 0; border-radius: var(--radius-md); background: var(--color-canvas); color: var(--color-text-primary); font: inherit; font-size: 13px; cursor: pointer; }
.queue-sort-menu button:disabled { opacity: .4; cursor: default; }
.queue-track:focus-visible, .queue-history summary:focus-visible { outline: 2px solid var(--color-accent-readable); outline-offset: -2px; }
.queue-history { margin-top: 20px; }
.queue-history summary { padding-block: 12px; font-size: 13px; color: var(--color-text-secondary); cursor: pointer; }
.queue-status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.queue-footer { flex-shrink: 0; padding-top: 12px; display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; width: 100%; gap: 8px; }
.queue-footer p { flex-basis: 100%; font-size: 13px; line-height: 1.6; color: var(--color-text-secondary); margin: 0 0 8px; }
@media (max-width: 360px) {
  .queue-track { gap: 4px; }
  .queue-index { width: 12px; }
}
</style>
