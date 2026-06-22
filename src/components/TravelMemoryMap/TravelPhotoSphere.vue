<template>
  <section class="travel-photo-board" :class="`is-${viewMode}`">
    <div class="travel-photo-board__switch" aria-label="照片视图切换">
      <button type="button" :class="{ 'is-active': viewMode === 'sphere' }" @click="viewMode = 'sphere'">
        3D 记忆球
      </button>
      <button type="button" :class="{ 'is-active': viewMode === 'grid' }" @click="viewMode = 'grid'">
        网格视图
      </button>
    </div>

    <div
      v-if="viewMode === 'sphere'"
      ref="stageRef"
      class="travel-photo-sphere"
      :class="{ 'is-interacting': isInteracting }"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @pointerleave="handlePointerUp"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <div class="travel-photo-sphere__field"></div>

      <button
        v-for="item in projectedEntries"
        :key="item.key"
        type="button"
        class="travel-photo-sphere__photo"
        :class="{
          'is-selected': item.isSelected,
          'is-active-stop': item.isActiveStop,
          'is-dimmed': item.isDimmed,
        }"
        :style="item.style"
        :aria-label="item.ariaLabel"
        @click="handlePhotoClick(item.key, $event)"
      >
        <img :src="item.imageUrl" :alt="item.title" loading="lazy" />
      </button>
    </div>

    <div v-else class="travel-photo-grid" aria-label="平面照片网格">
      <button
        v-for="item in gridEntries"
        :key="item.key"
        type="button"
        class="travel-photo-grid__item"
        :class="{
          'is-selected': item.isSelected,
          'is-active-stop': item.isActiveStop,
          'is-dimmed': item.isDimmed,
        }"
        :aria-label="item.ariaLabel"
        @click="emit('select-entry', item.key)"
      >
        <img :src="item.imageUrl" :alt="item.title" loading="lazy" />
        <span>{{ item.title }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'
import type { TravelMemoryEntry } from '@/types'

type EntryProjection = {
  key: string
  imageUrl: string
  title: string
  ariaLabel: string
  isSelected: boolean
  isActiveStop: boolean
  isDimmed: boolean
  style: CSSProperties
}

const props = defineProps<{
  entries: TravelMemoryEntry[]
  title: string
  activeStopIndex: number
  selectedEntryKey: string
  stopIndexByKey: Record<string, number>
}>()

const emit = defineEmits<{
  (e: 'select-entry', key: string): void
}>()

const stageRef = ref<HTMLElement | null>(null)
const rotationX = ref(-0.08)
const rotationY = ref(0.34)
const viewMode = ref<'sphere' | 'grid'>('sphere')
const isInteracting = ref(false)
const isHovered = ref(false)
const suppressClick = ref(false)

let pointerId: number | null = null
let lastPointerX = 0
let lastPointerY = 0
let dragDistance = 0
let animationFrameId = 0
let previousTimestamp = 0

function entryKey(entry: TravelMemoryEntry) {
  return String(entry.id ?? entry.imageUrl)
}

function entryTitle(entry: TravelMemoryEntry) {
  return entry.remark?.trim() || entry.thanksNote?.trim() || '旅行照片'
}

function projectedBase(entry: TravelMemoryEntry) {
  const key = entryKey(entry)
  const stopIndex = props.stopIndexByKey[key] ?? -1
  const isSelected = props.selectedEntryKey === key
  const isActiveStop = stopIndex >= 0 && stopIndex === props.activeStopIndex
  const isDimmed = !isSelected && !isActiveStop && props.activeStopIndex >= 0
  return {
    key,
    imageUrl: entry.imageUrl,
    title: entryTitle(entry),
    ariaLabel: `${entryTitle(entry)}，${isActiveStop ? '当前片段已高亮' : '点击查看所属片段'}`,
    isSelected,
    isActiveStop,
    isDimmed,
  }
}

const projectedEntries = computed<EntryProjection[]>(() => {
  if (!props.entries.length) return []

  const yaw = rotationY.value
  const pitch = rotationX.value
  const cosYaw = Math.cos(yaw)
  const sinYaw = Math.sin(yaw)
  const cosPitch = Math.cos(pitch)
  const sinPitch = Math.sin(pitch)
  const total = props.entries.length
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const centerBias = total <= 7 ? 0.82 : 1

  return props.entries.map((entry, index) => {
    const base = projectedBase(entry)

    const t = total === 1 ? 0.5 : index / (total - 1)
    const y = 1 - t * 2
    const radius = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = goldenAngle * index + index * 0.13
    const baseX = Math.cos(theta) * radius
    const baseZ = Math.sin(theta) * radius

    const rotatedX = baseX * cosYaw + baseZ * sinYaw
    const rotatedZ = baseZ * cosYaw - baseX * sinYaw
    const projectedY = y * cosPitch - rotatedZ * sinPitch
    const depth = rotatedZ * cosPitch + y * sinPitch

    const depthRatio = (depth + 1) / 2
    const left = 50 + rotatedX * 18 * centerBias
    const top = 45 + projectedY * 17 * centerBias
    const scale = 0.48 + depthRatio * 0.62
    const opacity = 0.2 + depthRatio * 0.78
    const rotate = rotatedX * 12 + projectedY * 8 + (index % 2 ? 4 : -5)
    const activeScale = base.isSelected ? scale * 1.22 : base.isActiveStop ? scale * 1.08 : scale

    return {
      ...base,
      style: {
        left: `${left}%`,
        top: `${top}%`,
        opacity: base.isDimmed ? opacity * 0.3 : opacity,
        zIndex: String(Math.round((depth + 1) * 100)),
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${activeScale})`,
      },
    }
  })
})

const gridEntries = computed(() => props.entries.map(projectedBase))

function clampPitch(value: number) {
  return Math.max(-0.4, Math.min(0.4, value))
}

function handlePointerDown(event: PointerEvent) {
  if (pointerId !== null) return
  pointerId = event.pointerId
  lastPointerX = event.clientX
  lastPointerY = event.clientY
  dragDistance = 0
  suppressClick.value = false
  isInteracting.value = true
  stageRef.value?.setPointerCapture?.(event.pointerId)
}

function handlePointerMove(event: PointerEvent) {
  if (pointerId !== event.pointerId || !isInteracting.value) return
  const deltaX = event.clientX - lastPointerX
  const deltaY = event.clientY - lastPointerY
  dragDistance += Math.abs(deltaX) + Math.abs(deltaY)

  if (dragDistance > 5) suppressClick.value = true

  rotationY.value += deltaX * 0.0052
  rotationX.value = clampPitch(rotationX.value - deltaY * 0.0032)
  lastPointerX = event.clientX
  lastPointerY = event.clientY
}

function handlePointerUp(event: PointerEvent) {
  if (pointerId !== event.pointerId) return
  stageRef.value?.releasePointerCapture?.(event.pointerId)
  pointerId = null
  isInteracting.value = false
  window.setTimeout(() => {
    suppressClick.value = false
  }, 0)
}

function handlePhotoClick(key: string, event: MouseEvent) {
  if (suppressClick.value) {
    event.preventDefault()
    return
  }
  emit('select-entry', key)
}

function tick(timestamp: number) {
  if (previousTimestamp === 0) previousTimestamp = timestamp
  const delta = timestamp - previousTimestamp
  previousTimestamp = timestamp

  if (!isInteracting.value && !isHovered.value) {
    rotationY.value += delta * 0.00012
  }

  animationFrameId = window.requestAnimationFrame(tick)
}

onMounted(() => {
  animationFrameId = window.requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style scoped lang="scss">
.travel-photo-board {
  position: relative;
  display: grid;
  min-height: 650px;
  padding-top: 4px;
}

.travel-photo-board__switch {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 220;
  display: inline-flex;
  justify-content: center;
  gap: 6px;
  pointer-events: none;
}

.travel-photo-board__switch button {
  min-height: 34px;
  padding: 0 15px;
  border: 1px solid rgba(155, 59, 82, 0.28);
  border-radius: 999px;
  color: #9b3b52;
  background: rgba(255, 253, 254, 0.94);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  pointer-events: auto;
  transition:
    color var(--motion-duration-fast) var(--motion-ease-standard),
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);
}

.travel-photo-board__switch button:hover,
.travel-photo-board__switch button.is-active {
  color: #fff;
  border-color: rgba(155, 59, 82, 0.72);
  background: #9b3b52;
  transform: translateY(-1px);
}

.travel-photo-sphere {
  position: relative;
  min-height: 610px;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  user-select: none;
  perspective: 900px;
}

.travel-photo-sphere.is-interacting {
  cursor: grabbing;
}

.travel-photo-sphere__field {
  position: absolute;
  inset: 0 0 62px;
  background:
    radial-gradient(ellipse at 50% 45%, rgba(255, 255, 255, 0.92), rgba(254, 244, 248, 0.52) 30%, rgba(251, 235, 240, 0.14) 58%, transparent 76%);
  pointer-events: none;
}

.travel-photo-sphere__photo {
  position: absolute;
  width: clamp(58px, 6.6vw, 96px);
  aspect-ratio: 3 / 5;
  padding: 0;
  border: 0;
  background: transparent;
  filter: saturate(0.96) contrast(1.02);
  box-shadow: 0 14px 26px rgba(105, 70, 86, 0.13);
  transition:
    transform var(--motion-duration-base) var(--motion-ease-standard),
    opacity var(--motion-duration-fast) var(--motion-ease-standard),
    filter var(--motion-duration-fast) var(--motion-ease-standard),
    box-shadow var(--motion-duration-base) var(--motion-ease-standard);
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 3px;
  }

  &:focus-visible {
    outline: 1px solid rgba(210, 132, 151, 0.9);
    outline-offset: 2px;
  }
}

.travel-photo-sphere__photo.is-active-stop {
  filter: saturate(1.05) contrast(1.04);
  box-shadow:
    0 18px 34px rgba(116, 70, 88, 0.18),
    0 0 0 1px rgba(233, 176, 193, 0.95);
}

.travel-photo-sphere__photo.is-selected {
  filter: saturate(1.12) contrast(1.08);
  box-shadow:
    0 22px 42px rgba(106, 60, 80, 0.22),
    0 0 0 2px rgba(155, 59, 82, 0.8),
    0 0 0 7px rgba(248, 234, 242, 0.72);
}

.travel-photo-sphere__photo.is-dimmed {
  filter: saturate(0.72) contrast(0.95);
  box-shadow: 0 7px 14px rgba(130, 96, 111, 0.04);
}

.travel-photo-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
  align-content: start;
  min-height: 610px;
  max-height: 610px;
  padding: 18px 28px 96px;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(155, 59, 82, 0.34) transparent;
}

.travel-photo-grid__item {
  display: grid;
  gap: 9px;
  padding: 0;
  border: 0;
  color: #6f5963;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.travel-photo-grid__item img {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 12px 24px rgba(120, 78, 96, 0.1);
  transition:
    transform var(--motion-duration-fast) var(--motion-ease-standard),
    box-shadow var(--motion-duration-fast) var(--motion-ease-standard),
    opacity var(--motion-duration-fast) var(--motion-ease-standard);
}

.travel-photo-grid__item span {
  overflow: hidden;
  color: #78646f;
  font-size: 12px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.travel-photo-grid__item:hover img,
.travel-photo-grid__item.is-selected img {
  transform: translateY(-2px);
  box-shadow:
    0 16px 30px rgba(120, 78, 96, 0.14),
    0 0 0 2px rgba(155, 59, 82, 0.45);
}

.travel-photo-grid__item.is-dimmed img {
  opacity: 0.42;
}

@media (max-width: 720px) {
  .travel-photo-board {
    min-height: 500px;
  }

  .travel-photo-sphere {
    min-height: 460px;
  }

  .travel-photo-sphere__photo {
    width: clamp(48px, 14vw, 78px);
  }

  .travel-photo-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    min-height: 460px;
    max-height: 460px;
    padding: 34px 0 72px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .travel-photo-sphere {
    cursor: default;
  }

  .travel-photo-sphere__photo {
    transition: none;
  }
}
</style>
