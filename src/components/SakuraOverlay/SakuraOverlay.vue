<template>
  <canvas
    ref="canvasRef"
    class="sakura-overlay"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

type SakuraDepth = 'background' | 'midground' | 'foreground';

interface SakuraPetal {
  depth: SakuraDepth;
  x: number;
  y: number;
  size: number;
  scaleX: number;
  scaleY: number;
  blur: number;
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

/** Draw order: back → front */
const DEPTH_DRAW_ORDER: readonly SakuraDepth[] = ['background', 'midground', 'foreground'];

/** Shared breeze strength per depth (background almost no global gust). */
const DEPTH_WIND_SCALE: Record<SakuraDepth, number> = {
  background: 0.22,
  midground: 0.55,
  foreground: 0.88,
};

type DepthRanges = {
  size: readonly [number, number];
  scaleX: readonly [number, number];
  scaleY: readonly [number, number];
  blur: readonly [number, number];
  speedY: readonly [number, number];
  speedX: readonly [number, number];
  sway: readonly [number, number];
  swaySpeed: readonly [number, number];
  rotationSpeed: readonly [number, number];
  opacity: readonly [number, number];
};

const DEPTH_RANGES: Record<SakuraDepth, DepthRanges> = {
  background: {
    size: [4.2, 8],
    scaleX: [0.66, 0.86],
    scaleY: [0.82, 1.02],
    blur: [1.45, 3.35],
    speedY: [46, 74],
    speedX: [-40, -16],
    sway: [6, 14],
    swaySpeed: [0.85, 1.7],
    rotationSpeed: [-0.5, 0.5],
    opacity: [0.18, 0.38],
  },
  midground: {
    size: [7.5, 15.5],
    scaleX: [0.76, 1.02],
    scaleY: [0.94, 1.18],
    blur: [0.2, 1.6],
    speedY: [92, 138],
    speedX: [-62, -32],
    sway: [6, 15],
    swaySpeed: [1.15, 2.35],
    rotationSpeed: [-0.85, 0.85],
    opacity: [0.5, 0.84],
  },
  foreground: {
    size: [9.8, 18],
    scaleX: [0.84, 1.08],
    scaleY: [1.02, 1.24],
    blur: [0.06, 0.52],
    speedY: [108, 162],
    speedX: [-78, -42],
    sway: [7, 16],
    swaySpeed: [1.4, 2.75],
    rotationSpeed: [-1.05, 1.05],
    opacity: [0.52, 0.86],
  },
};

/** Per-depth paint tuning: body mid-stops, shadow, glow (weaker overall; far layers especially soft). */
const DEPTH_PAINT: Record<
  SakuraDepth,
  {
    shadowColor: string;
    shadowBlurScale: number;
    bodyMid0: string;
    bodyMid1: string;
    glowInner: string;
    glowMid: string;
    /** Radial gradient mid-falloff (anime-leaning pink, still airy). */
    glowFalloff: string;
    /** Transparent outer stop (hue aligns with body for smooth edge). */
    glowTransparent: string;
    glowInnerR: number;
    glowOuterR: number;
  }
> = {
  background: {
    shadowColor: 'rgba(255, 192, 214, 0.055)',
    shadowBlurScale: 1.22,
    bodyMid0: 'rgba(255, 210, 226, 0.5)',
    bodyMid1: 'rgba(246, 168, 200, 0.34)',
    glowInner: 'rgba(255, 205, 222, 0.038)',
    glowMid: 'rgba(252, 185, 210, 0.022)',
    glowFalloff: 'rgba(250, 178, 206, 0.02)',
    glowTransparent: 'rgba(238, 145, 180, 0)',
    glowInnerR: 0.065,
    glowOuterR: 0.72,
  },
  midground: {
    shadowColor: 'rgba(255, 175, 205, 0.16)',
    shadowBlurScale: 1,
    bodyMid0: 'rgba(255, 202, 220, 0.82)',
    bodyMid1: 'rgba(244, 148, 188, 0.68)',
    glowInner: 'rgba(255, 198, 218, 0.11)',
    glowMid: 'rgba(255, 175, 205, 0.058)',
    glowFalloff: 'rgba(248, 152, 188, 0.042)',
    glowTransparent: 'rgba(232, 118, 162, 0)',
    glowInnerR: 0.075,
    glowOuterR: 0.8,
  },
  foreground: {
    shadowColor: 'rgba(255, 165, 198, 0.2)',
    shadowBlurScale: 0.9,
    bodyMid0: 'rgba(255, 192, 214, 0.9)',
    bodyMid1: 'rgba(242, 132, 176, 0.76)',
    glowInner: 'rgba(255, 188, 212, 0.125)',
    glowMid: 'rgba(255, 168, 200, 0.068)',
    glowFalloff: 'rgba(244, 138, 178, 0.052)',
    glowTransparent: 'rgba(226, 105, 152, 0)',
    glowInnerR: 0.082,
    glowOuterR: 0.84,
  },
};

const pickDepth = (): SakuraDepth => {
  const i = Math.floor(Math.random() * DEPTH_DRAW_ORDER.length);
  return DEPTH_DRAW_ORDER[i]!;
};

const canvasRef = ref<HTMLCanvasElement | null>(null);

const PETAL_COLORS = [
  ['rgba(255, 216, 232, 0.93)', 'rgba(242, 118, 168, 0.82)'],
  ['rgba(255, 208, 228, 0.91)', 'rgba(238, 112, 162, 0.8)'],
  ['rgba(255, 220, 234, 0.94)', 'rgba(234, 108, 158, 0.78)'],
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
  return Math.max(24, Math.min(56, Math.round(area / 28500)));
};

const createPetal = (startInViewport = false): SakuraPetal => {
  const depth = pickDepth();
  const r = DEPTH_RANGES[depth];
  const [colorStart, colorEnd] = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
  const size = random(r.size[0], r.size[1]);

  return {
    depth,
    // 顶部从左到右生成概率尽量接近一致，整体略向左下飘
    x: startInViewport
      ? random(-viewportWidth * 0.05, viewportWidth * 1.05)
      : random(-viewportWidth * 0.04, viewportWidth * 1.06),
    y: startInViewport
      ? random(-viewportHeight * 0.22, viewportHeight * 0.2)
      : random(-viewportHeight * 0.48, -size),
    size,
    scaleX: random(r.scaleX[0], r.scaleX[1]),
    scaleY: random(r.scaleY[0], r.scaleY[1]),
    blur: random(r.blur[0], r.blur[1]),
    speedY: random(r.speedY[0], r.speedY[1]),
    speedX: random(r.speedX[0], r.speedX[1]),
    sway: random(r.sway[0], r.sway[1]),
    swaySpeed: random(r.swaySpeed[0], r.swaySpeed[1]),
    swayOffset: random(0, Math.PI * 2),
    rotation: random(0, Math.PI * 2),
    rotationSpeed: random(r.rotationSpeed[0], r.rotationSpeed[1]),
    opacity: random(r.opacity[0], r.opacity[1]),
    colorStart,
    colorEnd,
  };
};

const resetPetal = (petal: SakuraPetal) => {
  const nextPetal = createPetal(false);
  Object.assign(petal, nextPetal);
  // 从顶部横向均匀回补，保证左到右出现概率接近一致
  petal.x = random(-viewportWidth * 0.05, viewportWidth * 1.05);
  petal.y = random(-viewportHeight * 0.3, -petal.size * 0.2);
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
  if (!ctx) {
    stopAnimation();
    lastFrameTime = 0;
    petals = [];
    return;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  petals = Array.from({ length: getPetalCount() }, () => createPetal(true));
};

const drawPetal = (petal: SakuraPetal) => {
  if (!ctx) return;

  const paint = DEPTH_PAINT[petal.depth];

  ctx.save();
  ctx.translate(petal.x, petal.y);
  ctx.rotate(petal.rotation);
  ctx.scale(petal.scaleX, petal.scaleY);
  ctx.globalAlpha = petal.opacity;
  ctx.shadowColor = paint.shadowColor;
  ctx.shadowBlur = petal.blur * paint.shadowBlurScale;

  // 更接近 boxmoe 的轻柔花瓣：轮廓简单、颜色通透、弱描边感；远近层用 mid-stop 与阴影区分层次
  const bodyGradient = ctx.createLinearGradient(0, -petal.size * 1.1, 0, petal.size * 1.15);
  bodyGradient.addColorStop(0, petal.colorStart);
  bodyGradient.addColorStop(0.36, paint.bodyMid0);
  bodyGradient.addColorStop(0.72, paint.bodyMid1);
  bodyGradient.addColorStop(1, petal.colorEnd);
  ctx.fillStyle = bodyGradient;

  const s = petal.size;
  // Same sakura silhouette at scale `mul` (1 = outer body, <1 = inner highlight) so highlight stays concentric with the contour.
  const traceSakuraContour = (mul: number) => {
    const m = s * mul;
    ctx.moveTo(0, -m * 0.96);
    ctx.bezierCurveTo(m * 0.3, -m * 0.93, m * 0.56, -m * 0.72, m * 0.72, -m * 0.44);
    ctx.bezierCurveTo(m * 0.9, -m * 0.1, m * 0.93, m * 0.3, m * 0.78, m * 0.52);
    ctx.bezierCurveTo(m * 0.66, m * 0.66, m * 0.38, m * 0.79, m * 0.14, m * 0.84);
    ctx.bezierCurveTo(m * 0.055, m * 0.868, m * 0.02, m * 0.895, 0, m * 0.912);
    ctx.bezierCurveTo(-m * 0.022, m * 0.892, -m * 0.06, m * 0.865, -m * 0.15, m * 0.835);
    ctx.bezierCurveTo(-m * 0.4, m * 0.78, -m * 0.68, m * 0.64, -m * 0.79, m * 0.5);
    ctx.bezierCurveTo(-m * 0.94, m * 0.26, -m * 0.9, -m * 0.12, -m * 0.69, -m * 0.46);
    ctx.bezierCurveTo(-m * 0.53, -m * 0.74, -m * 0.27, -m * 0.93, 0, -m * 0.96);
    ctx.closePath();
  };

  // Outer contour: sakura-like — domed top, fuller waist, shallow basal notch (not a droplet tip).
  ctx.beginPath();
  traceSakuraContour(1);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  // Inner glow: scaled copy of outer silhouette + clip + tighter pink radial (DEPTH_PAINT), avoids misaligned teardrop and white blob.
  const highlightScale = 0.52;
  ctx.save();
  ctx.beginPath();
  traceSakuraContour(1);
  ctx.clip();

  const gx0 = -s * 0.07;
  const gy0 = -s * 0.34;
  const gx1 = -s * 0.02;
  const gy1 = -s * 0.2;
  const centerGlow = ctx.createRadialGradient(
    gx0,
    gy0,
    s * paint.glowInnerR * 0.42,
    gx1,
    gy1,
    s * paint.glowOuterR * 0.46
  );
  centerGlow.addColorStop(0, paint.glowInner);
  centerGlow.addColorStop(0.28, paint.glowMid);
  centerGlow.addColorStop(0.62, paint.glowFalloff);
  centerGlow.addColorStop(1, paint.glowTransparent);

  ctx.fillStyle = centerGlow;
  ctx.beginPath();
  traceSakuraContour(highlightScale);
  ctx.fill();

  ctx.restore();

  ctx.restore();
};

const animate = (timestamp: number) => {
  if (!ctx) {
    stopAnimation();
    return;
  }

  if (!lastFrameTime) {
    lastFrameTime = timestamp;
  }

  const delta = Math.min((timestamp - lastFrameTime) / 1000, 0.033);
  lastFrameTime = timestamp;
  // Slow, low-amplitude breeze so motion reads as float, not a synchronized gust.
  const windSlow =
    Math.sin(timestamp / 1420) * 3.2 + Math.cos(timestamp / 2180) * 2.1;
  const windRipple = Math.sin(timestamp / 880) * 1.4;

  ctx.clearRect(0, 0, viewportWidth, viewportHeight);

  petals.forEach((petal) => {
    petal.y += petal.speedY * delta;
    const windForDepth = (windSlow + windRipple) * DEPTH_WIND_SCALE[petal.depth];
    petal.x += (
      petal.speedX
      + windForDepth
      + Math.sin(timestamp / 1000 * petal.swaySpeed + petal.swayOffset) * petal.sway
    ) * delta;
    petal.rotation += petal.rotationSpeed * delta;

    if (
      petal.y - petal.size > viewportHeight + 24
      || petal.x < -viewportWidth * 0.18
      || petal.x > viewportWidth * 1.18
    ) {
      resetPetal(petal);
    }
  });

  for (const depth of DEPTH_DRAW_ORDER) {
    for (const petal of petals) {
      if (petal.depth === depth) {
        drawPetal(petal);
      }
    }
  }

  animationFrameId = window.requestAnimationFrame(animate);
};

const stopAnimation = () => {
  window.cancelAnimationFrame(animationFrameId);
  animationFrameId = 0;
};

const startAnimation = () => {
  stopAnimation();
  if (prefersReducedMotion?.matches) {
    if (ctx) {
      ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    }
    return;
  }

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
