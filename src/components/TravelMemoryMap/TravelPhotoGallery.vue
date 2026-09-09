<template>
  <div
    class="travel-photos"
    @keydown.left.prevent="move(-1)"
    @keydown.right.prevent="move(1)"
  >
    <div
      v-if="currentPhoto"
      class="travel-photos__grid"
      :class="{ 'is-single': photos.length === 1 }"
    >
      <div class="travel-photos__main">
        <button
          type="button"
          class="travel-photos__image"
          :aria-label="`查看大图：${photoTitle(currentPhoto, currentIndex)}`"
          @click="emit('open', currentPhoto.imageUrl)"
        >
          <img
            :src="currentPhoto.imageUrl"
            :alt="photoTitle(currentPhoto, currentIndex)"
          />
          <span class="travel-photos__caption">
            <span>{{ photoTitle(currentPhoto, currentIndex) }}</span>
            <UiIcon name="external" />
          </span>
        </button>
        <template v-if="photos.length > 1">
          <button
            type="button"
            class="travel-photos__arrow is-previous"
            aria-label="上一张照片"
            @click="move(-1)"
          >
            <UiIcon name="arrow-left" />
          </button>
          <button
            type="button"
            class="travel-photos__arrow is-next"
            aria-label="下一张照片"
            @click="move(1)"
          >
            <UiIcon name="arrow-right" />
          </button>
        </template>
        <span
          class="travel-photos__position"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span class="sr-only">当前照片：</span>{{ currentIndex + 1 }} /
          {{ photos.length }}
        </span>
      </div>
      <div v-if="previews.length" class="travel-photos__previews">
        <button
          v-for="preview in previews"
          :key="preview.index"
          type="button"
          class="travel-photos__image travel-photos__preview"
          :aria-label="`切换到第 ${preview.index + 1} 张：${photoTitle(preview.photo, preview.index)}`"
          @click="currentIndex = preview.index"
        >
          <img
            :src="preview.photo.imageUrl"
            :alt="photoTitle(preview.photo, preview.index)"
            loading="lazy"
          />
          <span class="travel-photos__caption">{{
            photoTitle(preview.photo, preview.index)
          }}</span>
        </button>
      </div>
    </div>
    <div v-else class="travel-photos__empty">
      <UiIcon name="image" />
      <p>这个片段还没有照片</p>
    </div>
    <p v-if="currentPhoto?.thanksNote?.trim()" class="travel-photos__note">
      {{ currentPhoto.thanksNote }}
    </p>
    <p v-if="photos.length > 1" class="travel-photos__hint">
      左右切换照片 · 点击大图放大查看
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { UiIcon } from '@/components/ui'
import type { TravelMemoryEntry } from '@/types'

const props = defineProps<{ entries: TravelMemoryEntry[]; title: string }>()
const emit = defineEmits<{ (event: 'open', imageUrl: string): void }>()
const currentIndex = ref(0)
const photos = computed(() =>
  props.entries.filter((entry) => Boolean(entry.imageUrl)),
)
const currentPhoto = computed(() => photos.value[currentIndex.value])
const previews = computed(() =>
  Array.from(
    { length: Math.min(2, Math.max(0, photos.value.length - 1)) },
    (_, offset) => {
      const index = (currentIndex.value + offset + 1) % photos.value.length
      return { index, photo: photos.value[index]! }
    },
  ),
)

function move(offset: number) {
  if (photos.value.length < 2) return
  currentIndex.value =
    (currentIndex.value + offset + photos.value.length) % photos.value.length
}

function photoTitle(photo: TravelMemoryEntry, index: number) {
  return photo.remark?.trim() || `${props.title} · ${index + 1}`
}

// 片段由父层 key 隔离；接口刷新照片列表时也回到第一张，避免旧下标越界。
watch(
  () => props.entries,
  () => {
    currentIndex.value = 0
  },
)
</script>

<style scoped lang="scss">
.travel-photos__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 10px;
  height: clamp(320px, 28vw, 400px);
  &.is-single {
    grid-template-columns: minmax(0, 1fr);
  }
}
.travel-photos__main {
  position: relative;
  min-width: 0;
  min-height: 0;
}
.travel-photos__image {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 12px;
  background: var(--color-surface-muted);
  cursor: zoom-in;
  text-align: left;
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  &::after {
    content: '';
    position: absolute;
    inset: 55% 0 0;
    background: linear-gradient(transparent, rgb(18 12 17 / 75%));
    pointer-events: none;
  }
}
.travel-photos__caption {
  position: absolute;
  z-index: 1;
  inset: auto 16px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #fff;
  font-size: var(--font-size-sm);
  line-height: 1.5;
  overflow-wrap: anywhere;
  span {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
.travel-photos__previews {
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
}
.travel-photos__preview {
  cursor: pointer;
  .travel-photos__caption {
    inset: auto 14px 14px;
    font-size: var(--font-size-sm);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
.travel-photos__arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 45%);
  border-radius: 50%;
  color: #fff;
  background: rgb(24 18 24 / 62%);
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 22px;
  &.is-previous {
    left: 12px;
  }
  &.is-next {
    right: 12px;
  }
  &:hover {
    background: rgb(24 18 24 / 85%);
  }
}
.travel-photos__position {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  background: rgb(24 18 24 / 65%);
  color: #fff;
  font-size: var(--font-size-xs);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}
.travel-photos__note {
  margin: 8px 0 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: var(--font-size-base);
  line-height: 1.6;
  color: var(--color-text-secondary);
}
.travel-photos__hint {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  text-align: right;
}
.travel-photos__empty {
  display: grid;
  place-content: center;
  justify-items: center;
  min-height: 260px;
  border-radius: 14px;
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  gap: 12px;
  p {
    margin: 0;
  }
  .ui-icon {
    font-size: 28px;
  }
}
.travel-photos button:focus-visible {
  outline: 3px solid var(--color-accent-readable);
  outline-offset: 3px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
@media (max-width: 1100px) and (min-width: 761px) {
  .travel-photos__grid {
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  }
}
@media (max-width: 760px) {
  .travel-photos__grid {
    height: auto;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
  .travel-photos__main {
    height: clamp(280px, 80vw, 440px);
  }
  .travel-photos__previews {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    height: clamp(130px, 37vw, 200px);
    gap: 10px;
  }
  .travel-photos__caption {
    inset-inline: 15px;
  }
}
</style>
