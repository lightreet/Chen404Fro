<template>
  <div :id="id" :class="className" ref="rootRef" v-html="html" />
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { mdImageResizeEmitter } from '@/utils/mdImageResizeEmitter';

const props = defineProps<{
  html: string;
  id?: string;
  className?: string;
}>();

const rootRef = ref<HTMLElement | null>(null);

type ActiveResize = {
  wrapper: HTMLSpanElement;
  img: HTMLImageElement;
  startX: number;
  startWidthPx: number;
  containerWidthPx: number;
};

let active: ActiveResize | null = null;

const cleanup = () => {
  if (!rootRef.value) return;
  rootRef.value.querySelectorAll('[data-resize-wrapper="1"]').forEach((el) => {
    const wrapper = el as HTMLElement;
    const img = wrapper.querySelector('img');
    if (img) {
      wrapper.replaceWith(img);
    }
  });
  rootRef.value.querySelectorAll('[data-resize-handle="1"]').forEach((el) => el.remove());
};

const ensureWrapped = () => {
  const root = rootRef.value;
  if (!root) return;

  // 把预览区所有 img 包装成可缩放容器（避免直接操作 v-html 字符串）
  const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
  for (const img of imgs) {
    if ((img.parentElement as HTMLElement | null)?.dataset?.resizeWrapper === '1') {
      continue;
    }

    const wrapper = document.createElement('span');
    wrapper.dataset.resizeWrapper = '1';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.maxWidth = '100%';
    wrapper.style.borderRadius = '12px';
    wrapper.style.outline = '1px dashed rgba(236, 72, 153, 0.0)';
    wrapper.style.transition = 'outline-color 0.15s ease';
    wrapper.style.touchAction = 'none';

    // 让图片保持块级居中展示（和文章页保持一致）
    img.style.display = 'block';
    img.style.margin = '24px auto';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '12px';

    // 默认如果没有显式宽度，限制到更合理的宽度（防止手机图撑满）
    const hasWidth = /width\s*:\s*[^;]+/i.test(img.getAttribute('style') ?? '');
    if (!hasWidth) {
      img.style.width = 'min(100%, 720px)';
    }

    img.replaceWith(wrapper);
    wrapper.appendChild(img);

    wrapper.addEventListener('mouseenter', () => {
      wrapper.style.outlineColor = 'rgba(236, 72, 153, 0.45)';
    });
    wrapper.addEventListener('mouseleave', () => {
      if (!active) wrapper.style.outlineColor = 'rgba(236, 72, 153, 0.0)';
    });

    wrapper.addEventListener('pointerdown', (e) => {
      // 仅在右下角区域触发（相当于“隐形手柄”）
      const rect = wrapper.getBoundingClientRect();
      const hotSize = 44; // px
      const inHotCorner = e.clientX >= rect.right - hotSize && e.clientY >= rect.bottom - hotSize;
      if (!inHotCorner) return;

      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const container = wrapper.parentElement as HTMLElement | null;
      const containerWidthPx = container?.getBoundingClientRect().width ?? 1;
      const currentWidthPx = img.getBoundingClientRect().width;

      active = {
        wrapper,
        img,
        startX: e.clientX,
        startWidthPx: currentWidthPx,
        containerWidthPx,
      };
    });
  }
};

const onPointerMove = (e: PointerEvent) => {
  if (!active) return;
  const deltaX = e.clientX - active.startX;
  const nextWidthPx = Math.max(80, Math.min(active.containerWidthPx, active.startWidthPx + deltaX));
  const percent = Math.round((nextWidthPx / active.containerWidthPx) * 100);
  const clamped = Math.max(10, Math.min(100, percent));

  active.img.style.width = `${clamped}%`;
};

const onPointerUp = () => {
  if (!active) return;

  const img = active.img;
  const src = img.getAttribute('src') ?? '';
  const styleWidth = img.style.width;

  if (src && styleWidth) {
    mdImageResizeEmitter.emit({ src, width: styleWidth });
  }

  active = null;
};

onMounted(() => {
  // 预览区 HTML 往往异步渲染，挂载后补一拍再包裹
  void nextTick(() => ensureWrapped());
  setTimeout(() => ensureWrapped(), 0);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
});

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  cleanup();
});

watch(
  () => props.html,
  async () => {
    // v-html 内容更新后，重新包裹图片
    await nextTick();
    cleanup();
    ensureWrapped();
  }
);
</script>

