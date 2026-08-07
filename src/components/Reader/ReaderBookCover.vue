<template>
  <div
    class="book-cover"
    :class="[{ 'has-image': resolvedUrl }, titleLengthClass]"
    :style="{ '--cover-hue': String(coverHue) }"
    :aria-label="`${title}封面`"
  >
    <img v-if="resolvedUrl" :src="resolvedUrl" :alt="`${title}封面`" />
    <template v-else>
      <span class="book-cover__ornament" aria-hidden="true">✦</span>
      <strong :title="title">{{ compactTitle }}</strong>
      <span>{{ format.toUpperCase() }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { getReaderAssetBlob } from '@/api/reader'

const props = withDefaults(defineProps<{
  title: string
  format?: string
  url?: string
}>(), {
  format: 'BOOK',
  url: undefined,
})

const resolvedUrl = ref('')
let currentObjectUrl = ''

const coverHue = computed(() => {
  let hash = 0
  for (const char of props.title) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return 328 + (hash % 24)
})
const titleCharacters = computed(() => Array.from(props.title.trim()))
const titleLengthClass = computed(() => {
  const length = titleCharacters.value.length
  if (length <= 6) return 'book-cover--title-short'
  if (length <= 12) return 'book-cover--title-medium'
  if (length <= 18) return 'book-cover--title-long'
  return 'book-cover--title-extra-long'
})
const compactTitle = computed(() => titleCharacters.value.length > 24
  ? `${titleCharacters.value.slice(0, 24).join('')}…`
  : titleCharacters.value.join(''))

const release = () => {
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
  currentObjectUrl = ''
  resolvedUrl.value = ''
}

watch(
  () => props.url,
  async (url) => {
    release()
    if (!url) return
    try {
      const blob = await getReaderAssetBlob(url)
      currentObjectUrl = URL.createObjectURL(blob)
      resolvedUrl.value = currentObjectUrl
    } catch {
      resolvedUrl.value = ''
    }
  },
  { immediate: true },
)

onBeforeUnmount(release)
</script>

<style scoped lang="scss">
.book-cover {
  position: relative;
  container-type: inline-size;
  display: grid;
  align-content: space-between;
  width: 100%;
  aspect-ratio: 3 / 4.25;
  overflow: hidden;
  padding: clamp(18px, 3vw, 28px);
  color: #fff;
  background:
    linear-gradient(145deg, hsl(var(--cover-hue) 48% 44%), hsl(calc(var(--cover-hue) + 26) 38% 28%));
  box-shadow:
    inset 9px 0 18px rgba(0, 0, 0, 0.12),
    0 14px 28px rgba(61, 38, 50, 0.16);
}

.book-cover::after {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  pointer-events: none;
}

.book-cover img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-cover strong {
  position: relative;
  z-index: 1;
  align-self: center;
  width: 100%;
  min-width: 0;
  display: -webkit-box;
  overflow: hidden;
  font-family: 'Noto Serif SC', 'Songti SC', SimSun, serif;
  font-size: clamp(17px, 16cqi, 22px);
  line-height: 1.35;
  letter-spacing: 0.08em;
  text-align: center;
  text-wrap: balance;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.book-cover--title-medium strong {
  font-size: clamp(15px, 14cqi, 19px);
  letter-spacing: 0.055em;
}

.book-cover--title-long strong {
  font-size: clamp(13px, 12.5cqi, 17px);
  line-height: 1.42;
  letter-spacing: 0.035em;
  -webkit-line-clamp: 5;
}

.book-cover--title-extra-long strong {
  font-size: clamp(12px, 11cqi, 15px);
  line-height: 1.42;
  letter-spacing: 0.02em;
  -webkit-line-clamp: 5;
}

.book-cover > span {
  position: relative;
  z-index: 1;
  font-size: 11px;
  letter-spacing: 0.18em;
  opacity: 0.76;
}

.book-cover__ornament {
  font-size: 20px !important;
  letter-spacing: 0 !important;
}
</style>
