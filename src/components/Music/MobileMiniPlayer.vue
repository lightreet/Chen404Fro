<template>
  <aside ref="dock" class="mobile-mini-player" :class="{ 'is-expanded': queueOpen }" aria-label="迷你播放器">
    <Transition name="mini-queue">
      <section v-if="queueOpen" id="mini-player-queue" class="mobile-mini-player__queue-panel" aria-label="播放队列">
        <header class="mobile-mini-player__queue-header">
          <h2>接下来 <span>{{ player.upcomingTracks.length }} 首</span></h2>
          <div class="mobile-mini-player__queue-actions">
            <button type="button" class="app-mobile-icon" aria-label="清空待播歌曲" title="清空待播歌曲" :disabled="!player.upcomingTracks.length" @click="clearUpcoming"><UiIcon name="delete" :size="20" /></button>
            <button type="button" class="app-mobile-icon" aria-label="收起播放队列" @click="closeQueue(true)"><UiIcon name="arrow-down" :size="20" /></button>
          </div>
        </header>
        <MusicQueueContent compact @close="closeQueue(true)" />
      </section>
    </Transition>
    <div class="mobile-mini-player__playback">
      <RouterLink v-if="player.currentTrack" to="/music?player=1" class="mobile-mini-player__track" aria-label="展开播放器">
        <img v-if="player.currentTrack.coverUrl" :src="player.currentTrack.coverUrl" alt="" /><span v-else class="mobile-mini-player__placeholder"><UiIcon name="music" :size="24" /></span>
        <span class="mobile-mini-player__copy"><strong>{{ player.currentTrack.title }}</strong><small>{{ player.currentTrack.artist }}</small></span>
      </RouterLink>
      <button v-else class="mobile-mini-player__track mobile-mini-player__start" type="button" aria-label="开始播放队列" @click="player.toggle()">
        <span class="mobile-mini-player__placeholder"><UiIcon name="music" :size="24" /></span>
        <span class="mobile-mini-player__copy"><strong>准备好就开始听</strong><small>已加入 {{ player.queue.length }} 首歌曲</small></span>
      </button>
      <button ref="queueButton" type="button" class="app-mobile-icon mobile-mini-player__queue" :aria-label="queueOpen ? '收起播放队列' : '展开播放队列'" aria-controls="mini-player-queue" :aria-expanded="queueOpen" @click="toggleQueue"><UiIcon name="list" :size="24" /></button>
      <button type="button" class="app-mobile-icon" :aria-label="player.playing ? '暂停播放' : '继续播放'" @click="player.toggle()"><UiIcon :name="player.playing ? 'pause' : 'play'" :size="26" /></button>
      <button type="button" class="app-mobile-icon" aria-label="下一首" @click="player.next()"><UiIcon name="skip-next" :size="26" /></button>
    </div>
    <span class="mobile-mini-player__status" role="status">{{ queueNotice }}</span>
  </aside>
</template>
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { UiIcon } from '@/components/ui'
import { useMusicPlayerStore } from '@/stores/music-player'
import MusicQueueContent from './MusicQueueContent.vue'

const emit = defineEmits<{ resize: [height: number] }>()
const player = useMusicPlayerStore()
const dock = ref<HTMLElement>()
const queueOpen = ref(false)
const queueButton = ref<HTMLButtonElement>()
const queueNotice = ref('')
let observer: ResizeObserver | undefined
function closeQueue(restoreFocus = false) {
  queueOpen.value = false
  if (restoreFocus) void nextTick(() => queueButton.value?.focus({ preventScroll: true }))
}
function toggleQueue(event: MouseEvent) {
  queueNotice.value = ''
  queueOpen.value = !queueOpen.value
  if (queueOpen.value && event.detail === 0) {
    void nextTick(() => dock.value?.querySelector<HTMLButtonElement>('.mobile-mini-player__queue-panel [aria-label="收起播放队列"]')?.focus({ preventScroll: true }))
  }
}
function clearUpcoming() {
  const count = player.upcomingTracks.length
  if (!count) return
  player.clearUpcoming()
  queueNotice.value = `已清空 ${count} 首待播歌曲`
}
function dismissOutside(event: Event) {
  if (queueOpen.value && dock.value && !event.composedPath().includes(dock.value)) closeQueue()
}
function measureDock() {
  if (!dock.value) return
  emit('resize', dock.value.getBoundingClientRect().height)
}
onMounted(() => {
  measureDock()
  observer = new ResizeObserver(measureDock)
  if (dock.value) observer.observe(dock.value)
  document.addEventListener('pointerdown', dismissOutside, true)
  document.addEventListener('focusin', dismissOutside)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('pointerdown', dismissOutside, true)
  document.removeEventListener('focusin', dismissOutside)
})
</script>
<style scoped lang="scss">
.mobile-mini-player { position: fixed; bottom: calc(var(--mobile-player-bottom, var(--mobile-nav-height)) + 8px); left: 20px; right: 20px; z-index: var(--z-sticky); border: 1px solid var(--color-border-light); border-radius: 28px; background: var(--color-surface); box-shadow: var(--shadow-md); }
.mobile-mini-player.is-expanded { border-top-left-radius: 0; border-top-right-radius: 0; }
.mobile-mini-player__playback { display: flex; align-items: center; padding: 6px 8px; }
.mobile-mini-player__playback > .app-mobile-icon { flex: 0 0 44px; width: 44px; height: 44px; }
.mobile-mini-player__queue { color: var(--color-text-secondary); }
.mobile-mini-player__queue[aria-expanded='true'] { color: var(--color-accent-readable); }
.mobile-mini-player__queue-panel { position: absolute; left: -1px; right: -1px; bottom: 100%; display: flex; flex-direction: column; max-height: min(52dvh, calc(100dvh - var(--mobile-player-bottom, var(--mobile-nav-height)) - var(--mobile-player-height, 58px) - 36px)); overflow: hidden; border: 1px solid var(--color-border-light); border-bottom: 0; border-radius: 20px 20px 0 0; background: var(--color-surface); transform-origin: bottom center; }
.mobile-mini-player__queue-header { display: flex; flex: none; align-items: center; justify-content: space-between; padding: 4px 8px 0 16px; }
.mobile-mini-player__queue-header h2 { display: flex; align-items: baseline; gap: 8px; margin: 0; font-size: 14px; font-weight: 600; }
.mobile-mini-player__queue-header h2 span { color: var(--color-text-secondary); font-size: 12px; font-weight: 400; }
.mobile-mini-player__queue-actions { display: flex; flex: none; align-items: center; }
.mobile-mini-player__queue-actions button:disabled { opacity: .35; cursor: default; }
.mobile-mini-player__status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.mini-queue-enter-active, .mini-queue-leave-active { transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), opacity 160ms ease; }
.mini-queue-enter-from, .mini-queue-leave-to { transform: translateY(8px); opacity: 0; }
.mobile-mini-player__start { padding: 0; border: 0; background: transparent; text-align: left; cursor: pointer; }
.mobile-mini-player__queue:focus-visible, .mobile-mini-player__track:focus-visible { outline: 2px solid var(--color-accent-readable); outline-offset: -2px; }
.mobile-mini-player__track { display: flex; align-items: center; gap: 8px; min-width: 0; min-height: 44px; flex: 1; color: inherit; }
.mobile-mini-player__track img, .mobile-mini-player__placeholder { width: 36px; height: 36px; flex: none; border-radius: 10px; object-fit: cover; }
.mobile-mini-player__placeholder { display: grid; place-items: center; background: var(--color-accent-soft); color: var(--color-accent-readable); }
.mobile-mini-player__copy { display: grid; min-width: 0; gap: 3px; }
.mobile-mini-player__copy strong, .mobile-mini-player__copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mobile-mini-player__copy strong { font-size: 14px; font-weight: 600; }
.mobile-mini-player__copy small { font-size: 12px; color: var(--color-text-secondary); }
@media (prefers-reduced-motion: reduce) {
  .mini-queue-enter-active, .mini-queue-leave-active { transition: none; }
}
</style>
