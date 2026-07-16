<template>
  <div class="focus-editor">
    <div
      ref="viewportRef"
      class="focus-editor__viewport"
      :class="{ 'is-draggable': hasImage, 'is-dragging': dragState.active }"
      :style="{ aspectRatio: String(aspectRatio) }"
      @pointerdown="handlePointerDown"
    >
      <img
        v-if="hasImage"
        class="focus-editor__image"
        :src="imageUrl"
        alt="Hero focus preview"
        draggable="false"
        :style="imageStyle"
        @load="handleImageLoad"
      />
      <div v-else class="focus-editor__empty">上传后这里会显示前台实际封面区域</div>

      <div class="focus-editor__chrome" aria-hidden="true">
        <span class="focus-editor__badge">前台实际展示预览</span>
        <span class="focus-editor__corner focus-editor__corner--tl"></span>
        <span class="focus-editor__corner focus-editor__corner--tr"></span>
        <span class="focus-editor__corner focus-editor__corner--bl"></span>
        <span class="focus-editor__corner focus-editor__corner--br"></span>
      </div>
    </div>

    <div class="focus-editor__meta">
      <p>{{ helperText }}</p>
      <div class="focus-editor__actions">
        <span class="focus-editor__position">{{ localPosition }}</span>
        <UiButton size="sm" variant="text" @click="resetPosition">重置居中</UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { UiButton } from '@/components/ui'

interface Props {
  imageUrl: string;
  position?: string;
  aspectRatio?: number;
}

const props = withDefaults(defineProps<Props>(), {
  position: '50% 50%',
  aspectRatio: 16 / 6.4,
});

const emit = defineEmits<{
  (e: 'update:position', value: string): void;
}>();

const viewportRef = ref<HTMLElement | null>(null);
const naturalSize = reactive({
  width: 0,
  height: 0,
});
const viewportSize = reactive({
  width: 0,
  height: 0,
});
const localPosition = ref(normalizePosition(props.position));
const resizeObserver = ref<ResizeObserver | null>(null);

const dragState = reactive({
  active: false,
  startX: 0,
  startY: 0,
  startOffsetX: 0,
  startOffsetY: 0,
});

const hasImage = computed(() => Boolean(props.imageUrl?.trim()));
const helperText = computed(() =>
  hasImage.value
    ? '拖动图片来调整焦点，后台预览会和前台 Hero 的实际裁切保持一致。'
    : '上传封面后，可以在这里拖动图片来决定前台最终显示的重点区域。'
);

const layout = computed(() => {
  const width = viewportSize.width;
  const height = viewportSize.height;
  const naturalWidth = naturalSize.width;
  const naturalHeight = naturalSize.height;
  const [xPercent, yPercent] = parsePosition(localPosition.value);

  if (!width || !height || !naturalWidth || !naturalHeight) {
    return {
      renderedWidth: 0,
      renderedHeight: 0,
      offsetX: 0,
      offsetY: 0,
      overflowX: 0,
      overflowY: 0,
      minOffsetX: 0,
      minOffsetY: 0,
    };
  }

  const scale = Math.max(width / naturalWidth, height / naturalHeight);
  const renderedWidth = naturalWidth * scale;
  const renderedHeight = naturalHeight * scale;
  const overflowX = Math.max(0, renderedWidth - width);
  const overflowY = Math.max(0, renderedHeight - height);
  const offsetX = overflowX > 0 ? -overflowX * (xPercent / 100) : 0;
  const offsetY = overflowY > 0 ? -overflowY * (yPercent / 100) : 0;

  return {
    renderedWidth,
    renderedHeight,
    offsetX,
    offsetY,
    overflowX,
    overflowY,
    minOffsetX: width - renderedWidth,
    minOffsetY: height - renderedHeight,
  };
});

const imageStyle = computed(() => ({
  width: `${layout.value.renderedWidth}px`,
  height: `${layout.value.renderedHeight}px`,
  transform: `translate3d(${layout.value.offsetX}px, ${layout.value.offsetY}px, 0)`,
}));

watch(
  () => props.position,
  (value) => {
    if (dragState.active) {
      return;
    }
    localPosition.value = normalizePosition(value);
  },
  { immediate: true }
);

watch(
  () => props.imageUrl,
  () => {
    if (!hasImage.value) {
      naturalSize.width = 0;
      naturalSize.height = 0;
    }
  }
);

onMounted(() => {
  updateViewportSize();
  if (viewportRef.value) {
    resizeObserver.value = new ResizeObserver(() => updateViewportSize());
    resizeObserver.value.observe(viewportRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver.value?.disconnect();
  teardownDragging();
});

function handleImageLoad(event: Event) {
  const target = event.target as HTMLImageElement | null;
  if (!target) {
    return;
  }
  naturalSize.width = target.naturalWidth;
  naturalSize.height = target.naturalHeight;
  updateViewportSize();
}

function updateViewportSize() {
  const rect = viewportRef.value?.getBoundingClientRect();
  if (!rect) {
    return;
  }
  viewportSize.width = rect.width;
  viewportSize.height = rect.height;
}

function handlePointerDown(event: PointerEvent) {
  if (!hasImage.value || !naturalSize.width || !naturalSize.height) {
    return;
  }
  event.preventDefault();
  dragState.active = true;
  dragState.startX = event.clientX;
  dragState.startY = event.clientY;
  dragState.startOffsetX = layout.value.offsetX;
  dragState.startOffsetY = layout.value.offsetY;

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerUp);
}

function handlePointerMove(event: PointerEvent) {
  if (!dragState.active) {
    return;
  }

  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  const nextOffsetX = clamp(dragState.startOffsetX + deltaX, layout.value.minOffsetX, 0);
  const nextOffsetY = clamp(dragState.startOffsetY + deltaY, layout.value.minOffsetY, 0);
  const nextPosition = formatPosition(
    toPercent(nextOffsetX, layout.value.overflowX),
    toPercent(nextOffsetY, layout.value.overflowY)
  );

  localPosition.value = nextPosition;
  emit('update:position', nextPosition);
}

function handlePointerUp() {
  if (!dragState.active) {
    return;
  }
  dragState.active = false;
  teardownDragging();
}

function teardownDragging() {
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
  window.removeEventListener('pointercancel', handlePointerUp);
}

function resetPosition() {
  const nextPosition = '50% 50%';
  localPosition.value = nextPosition;
  emit('update:position', nextPosition);
}

function normalizePosition(value?: string) {
  const [xPercent, yPercent] = parsePosition(value);
  return formatPosition(xPercent, yPercent);
}

function parsePosition(value?: string) {
  const source = value?.trim() ?? '';
  const match = source.match(/^(\d{1,3}(?:\.\d+)?)%\s+(\d{1,3}(?:\.\d+)?)%$/);
  if (!match) {
    return [50, 50] as const;
  }
  return [clamp(Number(match[1]), 0, 100), clamp(Number(match[2]), 0, 100)] as const;
}

function toPercent(offset: number, overflow: number) {
  if (overflow <= 0) {
    return 50;
  }
  return clamp((-offset / overflow) * 100, 0, 100);
}

function formatPosition(xPercent: number, yPercent: number) {
  return `${formatPercent(xPercent)} ${formatPercent(yPercent)}`;
}

function formatPercent(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
</script>

<style scoped lang="scss">
.focus-editor {
  display: grid;
  gap: 12px;
}

.focus-editor__viewport {
  position: relative;
  overflow: hidden;
  width: 100%;
  border-radius: 20px;
  background: color-mix(in oklch, var(--color-surface) 94%, var(--hero-tint, oklch(72% 0.06 295)));
  box-shadow:
    inset 0 0 0 1px color-mix(in oklch, var(--hero-tint, oklch(72% 0.06 295)) 18%, transparent),
    0 8px 16px color-mix(in oklch, var(--hero-tint, oklch(72% 0.04 295)) 10%, transparent);
  touch-action: none;
}

.focus-editor__viewport.is-draggable {
  cursor: grab;
}

.focus-editor__viewport.is-dragging {
  cursor: grabbing;
}

.focus-editor__image {
  position: absolute;
  top: 0;
  left: 0;
  max-width: none;
  user-select: none;
  pointer-events: none;
}

.focus-editor__empty,
.focus-editor__chrome {
  position: absolute;
  inset: 0;
}

.focus-editor__empty {
  display: grid;
  place-items: center;
  padding: 24px;
  color: color-mix(in oklch, var(--color-text-primary) 80%, var(--hero-tint, oklch(72% 0.06 295)));
  font-size: 13px;
  text-align: center;
}

.focus-editor__chrome {
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(17, 13, 21, 0.08), rgba(17, 13, 21, 0.18)),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0));
}

.focus-editor__badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-surface) 88%, transparent);
  border: 1px solid color-mix(in oklch, var(--hero-tint, oklch(72% 0.06 295)) 22%, transparent);
  color: color-mix(in oklch, var(--color-text-primary) 86%, var(--hero-tint, oklch(72% 0.06 295)));
  font-size: 12px;
  backdrop-filter: blur(8px);
}

.focus-editor__corner {
  position: absolute;
  width: 26px;
  height: 26px;
  border-color: rgba(255, 233, 241, 0.82);
  border-style: solid;
  filter: drop-shadow(0 0 12px rgba(255, 198, 219, 0.24));
}

.focus-editor__corner--tl {
  top: 14px;
  left: 14px;
  border-width: 2px 0 0 2px;
  border-top-left-radius: 12px;
}

.focus-editor__corner--tr {
  top: 14px;
  right: 14px;
  border-width: 2px 2px 0 0;
  border-top-right-radius: 12px;
}

.focus-editor__corner--bl {
  bottom: 14px;
  left: 14px;
  border-width: 0 0 2px 2px;
  border-bottom-left-radius: 12px;
}

.focus-editor__corner--br {
  right: 14px;
  bottom: 14px;
  border-width: 0 2px 2px 0;
  border-bottom-right-radius: 12px;
}

.focus-editor__meta {
  display: grid;
  gap: 8px;

  p {
    margin: 0;
    color: color-mix(in oklch, var(--color-text-primary) 72%, var(--hero-tint, oklch(72% 0.06 295)));
    font-size: 12px;
    line-height: 1.7;
  }
}

.focus-editor__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.focus-editor__position {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-surface) 96%, var(--hero-tint, oklch(72% 0.06 295)));
  border: 1px solid color-mix(in oklch, var(--hero-tint, oklch(72% 0.06 295)) 20%, transparent);
  color: color-mix(in oklch, var(--color-text-primary) 76%, var(--hero-tint, oklch(72% 0.06 295)));
  font-size: 12px;
}
</style>
