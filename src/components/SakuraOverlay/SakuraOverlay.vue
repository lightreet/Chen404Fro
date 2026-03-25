<template>
  <canvas
    ref="canvasRef"
    class="sakura-overlay"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

interface SakuraPetal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  sway: number;
  swaySpeed: number;
  swayOffset: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  colorStart: string;
  colorEnd: string;
}

const canvasRef = ref<HTMLCanvasElement | null>(null);

const PETAL_COLORS = [
  ['rgba(255, 205, 221, 0.82)', 'rgba(255, 170, 196, 0.82)'],
  ['rgba(255, 214, 228, 0.78)', 'rgba(255, 186, 205, 0.78)'],
  ['rgba(255, 192, 203, 0.75)', 'rgba(246, 156, 184, 0.75)'],
];

let ctx: CanvasRenderingContext2D | null = null;
let petals: SakuraPetal[] = [];
let animationFrameId = 0;
let resizeTimer = 0;
let lastFrameTime = 0;
let viewportWidth = 0;
let viewportHeight = 0;
let dpr = 1;
let prefersReducedMotion: MediaQueryList | null = null;

const random = (min: number, max: number) => min + Math.random() * (max - min);

const getPetalCount = () => {
  const area = viewportWidth * viewportHeight;
  return Math.max(18, Math.min(40, Math.round(area / 42000)));
};

const createPetal = (startInViewport = false): SakuraPetal => {
  const [colorStart, colorEnd] = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
  const size = random(10, 22);

  return {
    x: random(-viewportWidth * 0.08, viewportWidth * 1.08),
    y: startInViewport ? random(-viewportHeight * 0.15, viewportHeight * 1.05) : random(-viewportHeight, -size),
    size,
    speedY: random(18, 34),
    speedX: random(-10, 10),
    sway: random(12, 34),
    swaySpeed: random(0.8, 1.8),
    swayOffset: random(0, Math.PI * 2),
    rotation: random(0, Math.PI * 2),
    rotationSpeed: random(-0.8, 0.8),
    opacity: random(0.65, 0.95),
    colorStart,
    colorEnd,
  };
};

const resetPetal = (petal: SakuraPetal) => {
  const nextPetal = createPetal(false);
  Object.assign(petal, nextPetal);
  petal.x = random(-viewportWidth * 0.1, viewportWidth * 1.1);
  petal.y = random(-viewportHeight * 0.35, -petal.size);
};

const syncCanvasSize = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(viewportWidth * dpr);
  canvas.height = Math.floor(viewportHeight * dpr);
  canvas.style.width = `${viewportWidth}px`;
  canvas.style.height = `${viewportHeight}px`;

  ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  petals = Array.from({ length: getPetalCount() }, () => createPetal(true));
};

const drawPetal = (petal: SakuraPetal) => {
  if (!ctx) return;

  ctx.save();
  ctx.translate(petal.x, petal.y);
  ctx.rotate(petal.rotation);
  ctx.scale(1, 0.72);
  ctx.globalAlpha = petal.opacity;

  const gradient = ctx.createLinearGradient(-petal.size, -petal.size, petal.size, petal.size);
  gradient.addColorStop(0, petal.colorStart);
  gradient.addColorStop(1, petal.colorEnd);
  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.moveTo(0, -petal.size);
  ctx.bezierCurveTo(petal.size * 0.9, -petal.size * 0.85, petal.size * 1.05, petal.size * 0.2, 0, petal.size);
  ctx.bezierCurveTo(-petal.size * 1.05, petal.size * 0.2, -petal.size * 0.9, -petal.size * 0.85, 0, -petal.size);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
};

const animate = (timestamp: number) => {
  if (!ctx) return;

  if (!lastFrameTime) {
    lastFrameTime = timestamp;
  }

  const delta = Math.min((timestamp - lastFrameTime) / 1000, 0.033);
  lastFrameTime = timestamp;

  ctx.clearRect(0, 0, viewportWidth, viewportHeight);

  petals.forEach((petal) => {
    petal.y += petal.speedY * delta;
    petal.x += (petal.speedX + Math.sin(timestamp / 1000 * petal.swaySpeed + petal.swayOffset) * petal.sway) * delta;
    petal.rotation += petal.rotationSpeed * delta;

    if (
      petal.y - petal.size > viewportHeight + 24
      || petal.x < -viewportWidth * 0.18
      || petal.x > viewportWidth * 1.18
    ) {
      resetPetal(petal);
    }

    drawPetal(petal);
  });

  animationFrameId = window.requestAnimationFrame(animate);
};

const stopAnimation = () => {
  window.cancelAnimationFrame(animationFrameId);
  animationFrameId = 0;
};

const startAnimation = () => {
  stopAnimation();
  if (prefersReducedMotion?.matches) return;

  lastFrameTime = 0;
  animationFrameId = window.requestAnimationFrame(animate);
};

const handleResize = () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    syncCanvasSize();
    startAnimation();
  }, 120);
};

const handleVisibilityChange = () => {
  if (document.hidden) {
    stopAnimation();
    return;
  }

  if (window.innerWidth !== viewportWidth || window.innerHeight !== viewportHeight) {
    syncCanvasSize();
  }
  startAnimation();
};

onMounted(() => {
  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  syncCanvasSize();
  startAnimation();

  window.addEventListener('resize', handleResize);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  prefersReducedMotion.addEventListener('change', startAnimation);
});

onUnmounted(() => {
  stopAnimation();
  window.clearTimeout(resizeTimer);
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  prefersReducedMotion?.removeEventListener('change', startAnimation);
});
</script>

<style scoped lang="scss">
.sakura-overlay {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 6;
}
</style>
