<template>
  <aside ref="dock" class="mobile-mini-player" aria-label="迷你播放器">
    <button class="mobile-mini-player__queue" type="button" aria-label="展开播放队列" :aria-expanded="queueOpen" @click="queueOpen = true">
      <span class="mobile-mini-player__queue-heading">
        <span><UiIcon name="list" :size="16" />{{ player.mode === 'sequence' ? '接下来' : '播放队列' }} · {{ player.upcomingTracks.length }} 首</span>
        <span>展开<UiIcon name="arrow-up" :size="16" /></span>
      </span>
      <span v-if="player.mode !== 'sequence'" class="mobile-mini-player__hint">{{ player.mode === 'shuffle' ? '随机播放中，顺序由播放器选择' : '当前歌曲循环中' }}</span>
      <span v-for="(track, index) in previewTracks" :key="track.id" class="mobile-mini-player__upcoming">
        <span class="mobile-mini-player__index">{{ index + 1 }}</span>
        <strong>{{ track.title }}</strong><small>{{ track.artist }}</small>
      </span>
      <span v-if="!previewTracks.length" class="mobile-mini-player__hint">{{ player.currentTrack ? '本轮没有待播歌曲，回曲库继续添加' : '从曲库加入想听的歌' }}</span>
    </button>
    <div class="mobile-mini-player__playback">
      <RouterLink v-if="player.currentTrack" to="/music?player=1" class="mobile-mini-player__track" aria-label="展开播放器">
        <img v-if="player.currentTrack.coverUrl" :src="player.currentTrack.coverUrl" alt="" /><span v-else class="mobile-mini-player__placeholder"><UiIcon name="music" :size="24" /></span>
        <span class="mobile-mini-player__copy"><strong>{{ player.currentTrack.title }}</strong><small>{{ player.currentTrack.artist }}</small></span>
      </RouterLink>
      <button v-else class="mobile-mini-player__track mobile-mini-player__start" type="button" aria-label="开始播放队列" @click="player.toggle()">
        <span class="mobile-mini-player__placeholder"><UiIcon name="music" :size="24" /></span>
        <span class="mobile-mini-player__copy"><strong>准备好就开始听</strong><small>已加入 {{ player.queue.length }} 首歌曲</small></span>
      </button>
      <button type="button" class="app-mobile-icon" :aria-label="player.playing ? '暂停播放' : '继续播放'" @click="player.toggle()"><UiIcon :name="player.playing ? 'pause' : 'play'" :size="26" /></button>
      <button type="button" class="app-mobile-icon" aria-label="下一首" @click="player.next()"><UiIcon name="skip-next" :size="26" /></button>
    </div>
  </aside>
  <MusicQueueSheet v-model="queueOpen" />
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { UiIcon } from '@/components/ui'
import { useMusicPlayerStore } from '@/stores/music-player'
import MusicQueueSheet from './MusicQueueSheet.vue'

const emit = defineEmits<{ resize: [height: number] }>()
const player = useMusicPlayerStore()
const dock = ref<HTMLElement>()
const queueOpen = ref(false)
const previewTracks = computed(() => player.upcomingTracks.slice(0, 2))
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(() => emit('resize', dock.value?.getBoundingClientRect().height ?? 0))
  if (dock.value) observer.observe(dock.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>
<style scoped lang="scss">
.mobile-mini-player { position: fixed; bottom: calc(var(--mobile-player-bottom, var(--mobile-nav-height)) + 8px); left: 12px; right: 12px; z-index: var(--z-sticky); border: 1px solid var(--color-border-light); border-radius: 16px; background: var(--color-surface); box-shadow: var(--shadow-md); overflow: hidden; }
.mobile-mini-player__queue { display: block; width: 100%; padding: 8px 12px; border: 0; background: transparent; text-align: left; color: var(--color-text-primary); cursor: pointer; }
.mobile-mini-player__queue-heading, .mobile-mini-player__queue-heading > span { display: flex; align-items: center; gap: 6px; }
.mobile-mini-player__queue-heading { justify-content: space-between; min-height: 24px; color: var(--color-text-secondary); font-size: 12px; }
.mobile-mini-player__upcoming { display: flex; align-items: baseline; gap: 8px; min-width: 0; padding-top: 6px; }
.mobile-mini-player__index { width: 12px; flex: none; color: var(--color-text-secondary); font-size: 11px; }
.mobile-mini-player__upcoming strong { min-width: 0; font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mobile-mini-player__upcoming small { min-width: 0; max-width: 38%; font-size: 12px; color: var(--color-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mobile-mini-player__hint { display: block; padding-block: 4px; font-size: 12px; color: var(--color-text-secondary); }
.mobile-mini-player__playback { display: flex; align-items: center; padding: 8px; border-top: 1px solid var(--color-border-light); }
.mobile-mini-player__start { padding: 0; border: 0; background: transparent; text-align: left; cursor: pointer; }
.mobile-mini-player__queue:focus-visible, .mobile-mini-player__track:focus-visible { outline: 2px solid var(--color-accent-readable); outline-offset: -2px; }
.mobile-mini-player__track { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; color: inherit; }
.mobile-mini-player__track img, .mobile-mini-player__placeholder { width: 40px; height: 40px; flex: none; border-radius: 8px; object-fit: cover; }
.mobile-mini-player__placeholder { display: grid; place-items: center; background: var(--color-accent-soft); color: var(--color-accent-readable); }
.mobile-mini-player__copy { display: grid; min-width: 0; gap: 3px; }
.mobile-mini-player__copy strong, .mobile-mini-player__copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mobile-mini-player__copy strong { font-size: 14px; font-weight: 600; }
.mobile-mini-player__copy small { font-size: 12px; color: var(--color-text-secondary); }
</style>
