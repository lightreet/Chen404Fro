<template>
  <section
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

  return props.entries.map((entry, index) => {
    const key = entryKey(entry)
    const stopIndex = props.stopIndexByKey[key] ?? -1

    const t = total === 1 ? 0.5 : index / (total - 1)
    const y = 1 - t * 2
    const radius = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = goldenAngle * index
    const baseX = Math.cos(theta) * radius
    const baseZ = Math.sin(theta) * radius

    const rotatedX = baseX * cosYaw + baseZ * sinYaw
    const rotatedZ = baseZ * cosYaw - baseX * sinYaw
    const projectedY = y * cosPitch - rotatedZ * sinPitch
    const depth = rotatedZ * cosPitch + y * sinPitch

    const left = 50 + rotatedX * 23
    const top = 50 + projectedY * 19
    const scale = 0.52 + ((depth + 1) / 2) * 0.5
    const opacity = 0.28 + ((depth + 1) / 2) * 0.62
    const rotate = rotatedX * 11 + projectedY * 13

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
      style: {
        left: `${left}%`,
        top: `${top}%`,
        opacity: isDimmed ? opacity * 0.34 : opacity,
        zIndex: String(Math.round((depth + 1) * 100)),
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${isSelected ? scale * 1.08 : scale})`,
      },
    }
  })
})

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
.travel-photo-sphere {
  position: relative;
  min-height: 372px;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.travel-photo-sphere.is-interacting {
  cursor: grabbing;
}

.travel-photo-sphere__field {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.98), rgba(251, 246, 248, 0.82) 30%, rgba(246, 234, 239, 0.18) 56%, transparent 80%);
  pointer-events: none;
}

.travel-photo-sphere__photo {
  position: absolute;
  width: clamp(54px, 7vw, 88px);
  aspect-ratio: 3 / 5;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: 0 8px 18px rgba(130, 96, 111, 0.08);
  transition:
    transform var(--motion-duration-base) var(--motion-ease-standard),
    opacity var(--motion-duration-fast) var(--motion-ease-standard),
    box-shadow var(--motion-duration-base) var(--motion-ease-standard);
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 2px;
  }

  &:focus-visible {
    outline: 1px solid rgba(210, 132, 151, 0.9);
    outline-offset: 2px;
  }
}

.travel-photo-sphere__photo.is-active-stop {
  box-shadow:
    0 10px 22px rgba(147, 102, 121, 0.11),
    0 0 0 1px rgba(233, 176, 193, 0.85);
}

.travel-photo-sphere__photo.is-selected {
  box-shadow:
    0 12px 24px rgba(147, 102, 121, 0.14),
    0 0 0 1px rgba(202, 120, 140, 0.88);
}

.travel-photo-sphere__photo.is-dimmed {
  box-shadow: 0 5px 12px rgba(130, 96, 111, 0.04);
}

@media (max-width: 720px) {
  .travel-photo-sphere {
    min-height: 320px;
  }

  .travel-photo-sphere__photo {
    width: clamp(48px, 14vw, 78px);
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
