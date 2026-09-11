<template>
  <aside v-if="player.currentTrack" class="mobile-mini-player" aria-label="迷你播放器">
    <RouterLink to="/music?player=1" class="mobile-mini-player__track" aria-label="展开播放器">
      <img v-if="player.currentTrack.coverUrl" :src="player.currentTrack.coverUrl" alt="" /><span v-else class="mobile-mini-player__placeholder"><UiIcon name="music" :size="24" /></span>
      <span class="mobile-mini-player__copy"><strong>{{ player.currentTrack.title }}</strong><small>{{ player.currentTrack.artist }}</small></span>
    </RouterLink>
    <button type="button" class="app-mobile-icon" :aria-label="player.playing ? '暂停播放' : '继续播放'" @click="player.toggle()"><UiIcon :name="player.playing ? 'pause' : 'play'" :size="26" /></button>
    <button type="button" class="app-mobile-icon" aria-label="下一首" @click="player.next()"><UiIcon name="arrow-right" :size="26" /></button>
  </aside>
</template>
<script setup lang="ts">
import { UiIcon } from '@/components/ui'
import { useMusicPlayerStore } from '@/stores/music-player'
const player = useMusicPlayerStore()
</script>
<style scoped lang="scss">
.mobile-mini-player { position: fixed; bottom: calc(var(--mobile-nav-height) + 8px); left: 12px; right: 12px; z-index: var(--z-sticky); display: flex; align-items: center; padding: 8px; border: 1px solid var(--color-border-light); border-radius: 16px; background: var(--color-surface); box-shadow: 0 4px 20px rgb(20 10 30 / 8%); }
.mobile-mini-player__track { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; color: inherit; }
.mobile-mini-player__track img, .mobile-mini-player__placeholder { width: 40px; height: 40px; flex: none; border-radius: 8px; object-fit: cover; }
.mobile-mini-player__placeholder { display: grid; place-items: center; background: var(--color-accent-soft); color: var(--color-accent-readable); }
.mobile-mini-player__copy { display: grid; min-width: 0; gap: 3px; }
.mobile-mini-player__copy strong, .mobile-mini-player__copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mobile-mini-player__copy strong { font-size: 14px; font-weight: 600; }
.mobile-mini-player__copy small { font-size: 12px; color: var(--color-text-secondary); }
</style>
