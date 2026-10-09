<template>
  <div ref="root" class="travel-video" @click.stop>
    <video ref="video" :src="src" :poster="poster" autoplay loop muted playsinline
      preload="metadata" :aria-label="label || '旅行视频'" @playing="blocked = false"
      @error="failed = true" />
    <button v-if="failed || blocked" type="button" class="travel-video__resume" @click="retry">
      {{ failed ? '视频加载失败，点击重试' : '播放视频' }}
    </button>
    <button type="button" class="travel-video__sound" :aria-label="muted ? '打开声音' : '关闭声音'"
      :aria-pressed="!muted" :title="muted ? '打开声音' : '关闭声音'" @click="toggleSound">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path v-if="muted" d="m16 9 6 6m0-6-6 6" />
        <path v-else d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
const props = defineProps<{ src: string; poster?: string; label?: string }>()
const root = ref<HTMLElement>()
const video = ref<HTMLVideoElement>()
const muted = ref(true)
const blocked = ref(false)
const failed = ref(false)
let visible = true
let observer: IntersectionObserver | undefined

async function play() {
  const element = video.value
  if (!element || !visible || document.hidden) return
  try { await element.play() } catch { if (element === video.value) blocked.value = true }
}
function toggleSound() {
  muted.value = !muted.value
  if (video.value) video.value.muted = muted.value
  void play()
}
function retry() {
  failed.value = false
  video.value?.load()
  void play()
}
function syncVisibility() {
  if (!visible || document.hidden) video.value?.pause()
  else void play()
}
watch(() => props.src, async () => {
  muted.value = true
  blocked.value = false
  failed.value = false
  await nextTick()
  if (video.value) video.value.muted = true
  void play()
})
onMounted(() => {
  if (video.value) video.value.muted = true
  observer = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); syncVisibility() })
  if (root.value) observer.observe(root.value)
  document.addEventListener('visibilitychange', syncVisibility)
  void play()
})
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('visibilitychange', syncVisibility)
  video.value?.pause()
})
</script>

<style scoped>
.travel-video { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: inherit; background: #181218; }
.travel-video video { display: block; width: 100%; height: 100%; object-fit: contain; }
.travel-video__sound { position: absolute; right: 10px; bottom: 10px; display: grid; place-items: center; width: 36px; height: 36px; padding: 8px; border: 1px solid #ffffff80; border-radius: 50%; color: #fff; background: #181218bf; cursor: pointer; z-index: 3; }
.travel-video__sound svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.travel-video__resume { position: absolute; inset: 35% 10%; margin: auto; height: fit-content; padding: 10px; border: 0; border-radius: 8px; color: #fff; background: #181218cc; cursor: pointer; }
.travel-video button:focus-visible { outline: 3px solid var(--color-accent-readable); outline-offset: -3px; }
</style>
