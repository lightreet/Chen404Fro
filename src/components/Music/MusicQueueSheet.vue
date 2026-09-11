<template>
  <UiDialog v-model="open" title="播放队列" size="sm">
    <div class="music-queue-sheet">
      <p class="queue-summary">{{ player.queue.length }} 首 · {{ modeLabel }}</p>
      <section v-if="player.currentTrack" aria-label="当前歌曲">
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
        <h3>待播 {{ player.upcomingTracks.length }} 首</h3>
        <p v-if="player.mode === 'shuffle'" class="queue-hint">随机模式下，实际播放顺序由播放器选择。</p>
        <p v-else-if="player.mode === 'single'" class="queue-hint">当前歌曲循环中，切换播放模式后按队列播放。</p>
        <ol v-if="player.upcomingTracks.length" class="queue-tracks">
          <li v-for="(track, index) in player.upcomingTracks" :key="track.id">
            <button class="queue-track" type="button" :aria-label="`立即播放 ${track.title}`" @click="player.playTrack(track)">
              <span class="queue-index">{{ index + 1 }}</span>
              <span class="queue-copy"><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span>
            </button>
            <div class="queue-actions">
              <button class="app-mobile-icon" type="button" :disabled="index === 0" :aria-label="`上移 ${track.title}`" @click="moveTrack(track, -1)"><UiIcon name="arrow-up" :size="20" /></button>
              <button class="app-mobile-icon" type="button" :disabled="index === player.upcomingTracks.length - 1" :aria-label="`下移 ${track.title}`" @click="moveTrack(track, 1)"><UiIcon name="arrow-down" :size="20" /></button>
              <button class="app-mobile-icon" type="button" :aria-label="`移除 ${track.title}`" @click="removeTrack(track)"><UiIcon name="close" :size="20" /></button>
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
    <template #footer>
      <div class="queue-footer">
        <template v-if="confirmClear && player.upcomingTracks.length">
          <p>清空 {{ player.upcomingTracks.length }} 首待播歌曲？当前歌曲会保留。</p>
          <UiButton variant="text" @click="confirmClear = false">取消</UiButton>
          <UiButton @click="clearQueue">确认清空</UiButton>
        </template>
        <template v-else>
          <UiButton variant="text" :disabled="!player.upcomingTracks.length" @click="confirmClear = true">清空待播</UiButton>
          <UiButton @click="open = false">完成</UiButton>
        </template>
      </div>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { UiButton, UiDialog, UiEmpty, UiIcon } from '@/components/ui'
import { useMusicPlayerStore } from '@/stores/music-player'
import type { MusicTrack } from '@/types'

const open = defineModel<boolean>({ required: true })
const player = useMusicPlayerStore()
const status = ref('')
const confirmClear = ref(false)
const playedTracks = computed(() => player.queue.slice(0, Math.max(0, player.currentIndex)))
const modeLabel = computed(() => ({ sequence: '顺序播放', shuffle: '随机播放', single: '单曲循环' }[player.mode]))
watch(open, () => { confirmClear.value = false; status.value = '' })

function moveTrack(track: MusicTrack, direction: -1 | 1) {
  if (player.moveUpcoming(track.id, direction)) status.value = `已${direction < 0 ? '上移' : '下移'}《${track.title}》`
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
.music-queue-sheet { min-height: 120px; }
.queue-summary, .queue-hint { color: var(--color-text-secondary); font-size: 13px; line-height: 1.6; margin: 0 0 12px; }
.music-queue-sheet h3 { margin: 20px 0 8px; font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
.queue-current { display: flex; align-items: center; gap: 10px; color: var(--color-accent-readable); }
.queue-current__copy { min-width: 0; flex: 1; }
.queue-current strong, .queue-copy strong { display: block; font-size: 15px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.queue-current small, .queue-copy small { display: block; color: var(--color-text-secondary); font-size: 12px; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.queue-tracks { list-style: none; padding: 0; margin: 0; }
.queue-tracks li { display: flex; align-items: center; gap: 4px; border-bottom: 1px solid var(--color-border-light); }
.queue-track { display: flex; gap: 10px; align-items: center; flex: 1; min-width: 0; min-height: 64px; padding: 10px 0; border: 0; background: transparent; text-align: left; color: var(--color-text-primary); cursor: pointer; }
.queue-index { width: 18px; flex: none; color: var(--color-text-secondary); font-size: 12px; font-variant-numeric: tabular-nums; }
.queue-copy { min-width: 0; }
.queue-actions { display: flex; flex: none; }
.queue-actions button:disabled { opacity: .3; cursor: default; }
.queue-track:focus-visible, .queue-history summary:focus-visible { outline: 2px solid var(--color-accent-readable); outline-offset: -2px; }
.queue-history { margin-top: 20px; }
.queue-history summary { padding-block: 12px; font-size: 13px; color: var(--color-text-secondary); cursor: pointer; }
.queue-status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.queue-footer { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; width: 100%; gap: 8px; }
.queue-footer p { flex-basis: 100%; font-size: 13px; line-height: 1.6; color: var(--color-text-secondary); margin: 0 0 8px; }
@media (max-width: 360px) {
  .queue-track { gap: 4px; }
  .queue-index { width: 12px; }
}
</style>
