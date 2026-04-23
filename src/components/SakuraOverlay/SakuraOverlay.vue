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
  flipRotation: number;
  flipSpeed: number;
  flipTilt: number;
  opacity: number;
  colorStart: string;
  colorEnd: string;
}

interface AtmosphereMote {
  depth: SakuraDepth;
  x: number;
  y: number;
  radius: number;
  blur: number;
  speedY: number;
  speedX: number;
  sway: number;
  swaySpeed: number;
  swayOffset: number;
  pulseOffset: number;
  opacity: number;
  stretchX: number;
  stretchY: number;
  tintInner: string;
  tintMid: string;
  tintOuter: string;
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
  flipSpeed: readonly [number, number];
  flipTilt: readonly [number, number];
  opacity: readonly [number, number];
};

type AtmosphereRanges = {
  radius: readonly [number, number];
  blur: readonly [number, number];
  speedY: readonly [number, number];
  speedX: readonly [number, number];
  sway: readonly [number, number];
  swaySpeed: readonly [number, number];
  opacity: readonly [number, number];
  stretchX: readonly [number, number];
  stretchY: readonly [number, number];
};

const DEPTH_RANGES: Record<SakuraDepth, DepthRanges> = {
  background: {
    size: [4.2, 6.8],
    scaleX: [0.66, 0.86],
    scaleY: [0.82, 1.02],
    blur: [1.45, 3.35],
    speedY: [46, 74],
    speedX: [-40, -16],
    sway: [6, 14],
    swaySpeed: [0.85, 1.7],
    rotationSpeed: [-0.5, 0.5],
    flipSpeed: [0, 0],
    flipTilt: [0, 0],
    opacity: [0.18, 0.38],
  },
  midground: {
    size: [7.5, 13.2],
    scaleX: [0.76, 1.02],
    scaleY: [0.94, 1.18],
    blur: [0.2, 1.6],
    speedY: [92, 138],
    speedX: [-62, -32],
    sway: [6, 15],
    swaySpeed: [1.15, 2.35],
    rotationSpeed: [-0.85, 0.85],
    flipSpeed: [0, 0],
    flipTilt: [0, 0],
    opacity: [0.5, 0.84],
  },
  foreground: {
    size: [9.8, 15.3],
    scaleX: [0.84, 1.08],
    scaleY: [1.02, 1.24],
    blur: [0.06, 0.52],
    speedY: [108, 162],
    speedX: [-78, -42],
    sway: [7, 16],
    swaySpeed: [1.4, 2.75],
    rotationSpeed: [-1.05, 1.05],
    flipSpeed: [1.9, 3.15],
    flipTilt: [0.08, 0.2],
    opacity: [0.52, 0.86],
  },
};

const ATMOSPHERE_RANGES: Record<SakuraDepth, AtmosphereRanges> = {
  background: {
    radius: [18, 42],
    blur: [18, 34],
    speedY: [7, 13],
    speedX: [-8, -2],
    sway: [2, 7],
    swaySpeed: [0.35, 0.85],
    opacity: [0.06, 0.16],
    stretchX: [1.05, 1.42],
    stretchY: [0.82, 1.12],
  },
  midground: {
    radius: [11, 26],
    blur: [10, 22],
    speedY: [11, 20],
    speedX: [-10, -3],
    sway: [3, 8],
    swaySpeed: [0.48, 1.08],
    opacity: [0.08, 0.2],
    stretchX: [0.96, 1.32],
    stretchY: [0.84, 1.1],
  },
  foreground: {
    radius: [6, 16],
    blur: [4, 10],
    speedY: [16, 28],
    speedX: [-14, -4],
    sway: [3, 9],
    swaySpeed: [0.6, 1.25],
    opacity: [0.1, 0.24],
    stretchX: [0.92, 1.22],
    stretchY: [0.82, 1.08],
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

const FOREGROUND_BACKFACE_PAINT = {
  bodyTop: 'rgba(248, 202, 218, 0.84)',
  bodyMid: 'rgba(232, 154, 184, 0.78)',
  bodyBottom: 'rgba(210, 118, 150, 0.7)',
  glowInner: 'rgba(255, 214, 226, 0.08)',
  glowOuter: 'rgba(220, 132, 166, 0)',
};

const DEPTH_FINISH: Record<
  SakuraDepth,
  {
    bloomInner: string;
    bloomOuter: string;
    pearlLight: string;
    pearlPink: string;
    rimLight: string;
    veinColor: string;
    coreGlow: string;
  }
> = {
  background: {
    bloomInner: 'rgba(255, 224, 237, 0.09)',
    bloomOuter: 'rgba(255, 225, 242, 0)',
    pearlLight: 'rgba(255, 251, 255, 0.16)',
    pearlPink: 'rgba(255, 226, 238, 0.08)',
    rimLight: 'rgba(255, 245, 250, 0.18)',
    veinColor: 'rgba(244, 171, 201, 0.14)',
    coreGlow: 'rgba(255, 240, 245, 0.12)',
  },
  midground: {
    bloomInner: 'rgba(255, 218, 236, 0.14)',
    bloomOuter: 'rgba(255, 220, 244, 0)',
    pearlLight: 'rgba(255, 250, 255, 0.24)',
    pearlPink: 'rgba(255, 223, 238, 0.13)',
    rimLight: 'rgba(255, 245, 251, 0.28)',
    veinColor: 'rgba(242, 158, 194, 0.22)',
    coreGlow: 'rgba(255, 236, 244, 0.18)',
  },
  foreground: {
    bloomInner: 'rgba(255, 214, 236, 0.2)',
    bloomOuter: 'rgba(255, 216, 244, 0)',
    pearlLight: 'rgba(255, 252, 255, 0.32)',
    pearlPink: 'rgba(255, 224, 238, 0.16)',
    rimLight: 'rgba(255, 246, 252, 0.36)',
    veinColor: 'rgba(240, 148, 188, 0.3)',
    coreGlow: 'rgba(255, 238, 246, 0.24)',
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
let atmosphereMotes: AtmosphereMote[] = [];
let animationFrameId = 0;
let resizeTimer = 0;
let lastFrameTime = 0;
let viewportWidth = 0;
let viewportHeight = 0;
let dpr = 1;
let prefersReducedMotion: MediaQueryList | null = null;

const random = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Low-discrepancy sampling to avoid “bursty” size clusters.
const PHI = 0.61803398875;
const depthSeeds: Record<SakuraDepth, { size: number }> = {
  background: { size: Math.random() },
  midground: { size: Math.random() },
  foreground: { size: Math.random() },
};
const nextUniform01 = (depth: SakuraDepth) => {
  const s = depthSeeds[depth];
  s.size = (s.size + PHI) % 1;
  return s.size;
};

const spawnX = () => random(-viewportWidth * 0.05, viewportWidth * 1.05);

/**
 * Spawn Y with a wide distribution above the viewport.
 * This avoids many petals re-entering at the same time (wave/batch feeling).
 */
const spawnYAboveViewport = (size: number) => {
  // Most petals start within ~1 viewport height above, some start further.
  const u = Math.random();
  const maxAbove = viewportHeight * (0.9 + u * u * 0.9); // ~0.9h .. ~1.8h
  return -random(size, maxAbove + size);
};

const getPetalCount = () => {
  const area = viewportWidth * viewportHeight;
  return Math.max(24, Math.min(56, Math.round(area / 28500)));
};

const getAtmosphereMoteCount = () => {
  const area = viewportWidth * viewportHeight;
  return Math.max(18, Math.min(34, Math.round(area / 64000)));
};

const createPetal = (startInViewport = false): SakuraPetal => {
  const depth = pickDepth();
  const r = DEPTH_RANGES[depth];
  const [colorStart, colorEnd] = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
  const size = r.size[0] + (r.size[1] - r.size[0]) * nextUniform01(depth);

  return {
    depth,
    // 顶部从左到右生成概率尽量接近一致，整体略向左下飘
    x: spawnX(),
    // 初始化时尽量打散在更长的 y 区间，避免一开始就“成团成波”
    y: startInViewport ? random(-viewportHeight * 0.9, viewportHeight * 0.35) : spawnYAboveViewport(size),
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
    flipRotation: random(0, Math.PI * 2),
    flipSpeed: random(r.flipSpeed[0], r.flipSpeed[1]),
    flipTilt: random(r.flipTilt[0], r.flipTilt[1]),
    opacity: random(r.opacity[0], r.opacity[1]),
    colorStart,
    colorEnd,
  };
};

const createAtmosphereMote = (startInViewport = false): AtmosphereMote => {
  const depth = pickDepth();
  const r = ATMOSPHERE_RANGES[depth];
  const palette =
    depth === 'background'
      ? [
          'rgba(255, 244, 250, 0.94)',
          'rgba(244, 228, 248, 0.5)',
          'rgba(236, 220, 246, 0)',
        ]
      : depth === 'midground'
        ? [
            'rgba(255, 240, 248, 0.98)',
            'rgba(255, 222, 238, 0.56)',
            'rgba(240, 220, 246, 0)',
          ]
        : [
            'rgba(255, 246, 251, 1)',
            'rgba(255, 226, 239, 0.62)',
            'rgba(247, 223, 240, 0)',
          ];

  const radius = random(r.radius[0], r.radius[1]);

  return {
    depth,
    x: spawnX(),
    y: startInViewport ? random(-viewportHeight * 0.08, viewportHeight * 1.06) : spawnYAboveViewport(radius),
    radius,
    blur: random(r.blur[0], r.blur[1]),
    speedY: random(r.speedY[0], r.speedY[1]),
    speedX: random(r.speedX[0], r.speedX[1]),
    sway: random(r.sway[0], r.sway[1]),
    swaySpeed: random(r.swaySpeed[0], r.swaySpeed[1]),
    swayOffset: random(0, Math.PI * 2),
    pulseOffset: random(0, Math.PI * 2),
    opacity: random(r.opacity[0], r.opacity[1]),
    stretchX: random(r.stretchX[0], r.stretchX[1]),
    stretchY: random(r.stretchY[0], r.stretchY[1]),
    tintInner: palette[0],
    tintMid: palette[1],
    tintOuter: palette[2],
  };
};

const resetPetal = (petal: SakuraPetal) => {
  const nextPetal = createPetal(false);
  Object.assign(petal, nextPetal);

  // 从顶部横向均匀回补（与之前一致）
  petal.x = spawnX();

  // 关键：回补时把 y 分布拉宽到更远的上方，破除“批量重生”的波浪感
  petal.y = spawnYAboveViewport(petal.size);

  // 轻微扰动速度，进一步去同步
  const r = DEPTH_RANGES[petal.depth];
  petal.speedY = clamp(petal.speedY + random(-10, 10), r.speedY[0], r.speedY[1]);
  petal.speedX = clamp(petal.speedX + random(-10, 10), r.speedX[0], r.speedX[1]);
};

const resetAtmosphereMote = (mote: AtmosphereMote) => {
  const nextMote = createAtmosphereMote(false);
  Object.assign(mote, nextMote);
  mote.x = spawnX();
  mote.y = spawnYAboveViewport(mote.radius);
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
    atmosphereMotes = [];
    return;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  petals = Array.from({ length: getPetalCount() }, () => createPetal(true));
  atmosphereMotes = Array.from(
    { length: getAtmosphereMoteCount() },
    () => createAtmosphereMote(true)
  );
};

const drawPetal = (petal: SakuraPetal) => {
  const c = ctx;
  if (!c) return;

  const paint = DEPTH_PAINT[petal.depth];
  const finish = DEPTH_FINISH[petal.depth];
  const isForeground = petal.depth === 'foreground';
  const flipCos = isForeground ? Math.cos(petal.flipRotation) : 1;
  const flipSin = isForeground ? Math.sin(petal.flipRotation) : 0;
  const isBackFace = isForeground && flipCos < 0;
  const flipWidth = isForeground ? 0.18 + Math.abs(flipCos) * 0.82 : 1;
  const flipHeight = isForeground ? 0.96 + Math.abs(flipSin) * 0.1 : 1;
  const flipSkew = isForeground ? flipSin * petal.flipTilt : 0;
  const surfaceAlpha = isForeground ? 0.76 + flipWidth * 0.24 : 1;
  const s = petal.size;

  c.save();
  c.translate(petal.x, petal.y);
  c.rotate(petal.rotation);
  if (flipSkew !== 0) {
    c.transform(1, flipSkew, 0, 1, 0, 0);
  }
  c.scale(
    petal.scaleX * flipWidth * (isBackFace ? -1 : 1),
    petal.scaleY * flipHeight
  );
  c.globalAlpha = petal.opacity * surfaceAlpha;
  c.shadowColor = paint.shadowColor;
  c.shadowBlur = petal.blur * paint.shadowBlurScale;

  // 更接近 boxmoe 的轻柔花瓣：轮廓简单、颜色通透、弱描边感；远近层用 mid-stop 与阴影区分层次
  const bodyGradient = c.createLinearGradient(0, -petal.size * 1.1, 0, petal.size * 1.15);
  bodyGradient.addColorStop(0, isBackFace ? FOREGROUND_BACKFACE_PAINT.bodyTop : petal.colorStart);
  bodyGradient.addColorStop(0.36, isBackFace ? FOREGROUND_BACKFACE_PAINT.bodyMid : paint.bodyMid0);
  bodyGradient.addColorStop(0.72, isBackFace ? FOREGROUND_BACKFACE_PAINT.bodyBottom : paint.bodyMid1);
  bodyGradient.addColorStop(1, isBackFace ? FOREGROUND_BACKFACE_PAINT.bodyBottom : petal.colorEnd);
  c.fillStyle = bodyGradient;

  // Same sakura silhouette at scale `mul` (1 = outer body, <1 = inner highlight) so highlight stays concentric with the contour.
  const traceSakuraContour = (mul: number) => {
    const m = s * mul;
    c.moveTo(0, -m * 0.96);
    c.bezierCurveTo(m * 0.3, -m * 0.93, m * 0.56, -m * 0.72, m * 0.72, -m * 0.44);
    c.bezierCurveTo(m * 0.9, -m * 0.1, m * 0.93, m * 0.3, m * 0.78, m * 0.52);
    c.bezierCurveTo(m * 0.66, m * 0.66, m * 0.38, m * 0.79, m * 0.14, m * 0.84);
    c.bezierCurveTo(m * 0.055, m * 0.868, m * 0.02, m * 0.895, 0, m * 0.912);
    c.bezierCurveTo(-m * 0.022, m * 0.892, -m * 0.06, m * 0.865, -m * 0.15, m * 0.835);
    c.bezierCurveTo(-m * 0.4, m * 0.78, -m * 0.68, m * 0.64, -m * 0.79, m * 0.5);
    c.bezierCurveTo(-m * 0.94, m * 0.26, -m * 0.9, -m * 0.12, -m * 0.69, -m * 0.46);
    c.bezierCurveTo(-m * 0.53, -m * 0.74, -m * 0.27, -m * 0.93, 0, -m * 0.96);
    c.closePath();
  };

  c.save();
  c.shadowBlur = 0;
  c.shadowColor = 'transparent';
  const bloomGradient = c.createRadialGradient(-s * 0.08, -s * 0.18, s * 0.08, 0, 0, s * 1.34);
  bloomGradient.addColorStop(0, isBackFace ? FOREGROUND_BACKFACE_PAINT.glowInner : finish.bloomInner);
  bloomGradient.addColorStop(0.58, isBackFace ? FOREGROUND_BACKFACE_PAINT.glowOuter : finish.bloomOuter);
  bloomGradient.addColorStop(1, 'rgba(255, 220, 242, 0)');
  c.fillStyle = bloomGradient;
  c.beginPath();
  traceSakuraContour(1.22);
  c.fill();
  c.restore();

  // Outer contour: sakura-like — domed top, fuller waist, shallow basal notch (not a droplet tip).
  c.beginPath();
  traceSakuraContour(1);
  c.fillStyle = bodyGradient;
  c.fill();

  c.shadowBlur = 0;
  c.shadowColor = 'transparent';

  c.save();
  c.beginPath();
  traceSakuraContour(1);
  c.clip();

  const pearlGradient = c.createLinearGradient(-s * 0.56, -s * 0.94, s * 0.5, s * 0.88);
  pearlGradient.addColorStop(0, isBackFace ? 'rgba(255, 232, 240, 0.2)' : finish.pearlLight);
  pearlGradient.addColorStop(0.42, isBackFace ? 'rgba(255, 219, 232, 0.12)' : finish.pearlPink);
  pearlGradient.addColorStop(0.82, 'rgba(255, 208, 228, 0)');
  c.fillStyle = pearlGradient;
  c.beginPath();
  traceSakuraContour(0.96);
  c.fill();

  const subsurfaceGlow = c.createRadialGradient(-s * 0.16, -s * 0.26, s * 0.05, -s * 0.02, -s * 0.04, s * 0.72);
  subsurfaceGlow.addColorStop(0, isBackFace ? 'rgba(255, 230, 238, 0.18)' : finish.coreGlow);
  subsurfaceGlow.addColorStop(0.46, isBackFace ? 'rgba(255, 210, 226, 0.08)' : finish.pearlPink);
  subsurfaceGlow.addColorStop(1, 'rgba(255, 214, 232, 0)');
  c.fillStyle = subsurfaceGlow;
  c.beginPath();
  traceSakuraContour(0.84);
  c.fill();
  c.restore();

  const rimGradient = c.createLinearGradient(-s * 0.55, -s, s * 0.62, s * 0.92);
  rimGradient.addColorStop(0, isBackFace ? 'rgba(255, 235, 244, 0.22)' : finish.rimLight);
  rimGradient.addColorStop(0.45, isBackFace ? 'rgba(255, 225, 236, 0.08)' : finish.pearlPink);
  rimGradient.addColorStop(1, 'rgba(255, 215, 232, 0)');
  c.strokeStyle = rimGradient;
  c.lineWidth = Math.max(0.9, s * 0.085);
  c.beginPath();
  traceSakuraContour(0.985);
  c.stroke();

  c.save();
  c.beginPath();
  traceSakuraContour(1);
  c.clip();
  c.strokeStyle = isBackFace ? 'rgba(236, 170, 196, 0.14)' : finish.veinColor;
  c.lineCap = 'round';
  c.lineWidth = Math.max(0.55, s * 0.04);

  c.beginPath();
  c.moveTo(0, -s * 0.58);
  c.quadraticCurveTo(s * 0.06, -s * 0.08, 0, s * 0.52);
  c.stroke();

  c.beginPath();
  c.moveTo(-s * 0.18, -s * 0.3);
  c.quadraticCurveTo(-s * 0.06, s * 0.04, -s * 0.12, s * 0.42);
  c.stroke();

  c.beginPath();
  c.moveTo(s * 0.16, -s * 0.34);
  c.quadraticCurveTo(s * 0.04, s * 0.02, s * 0.1, s * 0.4);
  c.stroke();
  c.restore();

  // Inner glow: scaled copy of outer silhouette + clip + tighter pink radial (DEPTH_PAINT), avoids misaligned teardrop and white blob.
  const highlightScale = 0.52;
  c.save();
  c.beginPath();
  traceSakuraContour(1);
  c.clip();

  const gx0 = -s * 0.07;
  const gy0 = -s * 0.34;
  const gx1 = -s * 0.02;
  const gy1 = -s * 0.2;
  const centerGlow = c.createRadialGradient(
    gx0,
    gy0,
    s * paint.glowInnerR * 0.42,
    gx1,
    gy1,
    s * paint.glowOuterR * 0.46
  );
  centerGlow.addColorStop(0, isBackFace ? FOREGROUND_BACKFACE_PAINT.glowInner : paint.glowInner);
  centerGlow.addColorStop(0.28, isBackFace ? FOREGROUND_BACKFACE_PAINT.glowInner : paint.glowMid);
  centerGlow.addColorStop(0.62, isBackFace ? FOREGROUND_BACKFACE_PAINT.glowOuter : paint.glowFalloff);
  centerGlow.addColorStop(1, isBackFace ? FOREGROUND_BACKFACE_PAINT.glowOuter : paint.glowTransparent);

  c.fillStyle = centerGlow;
  c.beginPath();
  traceSakuraContour(highlightScale);
  c.fill();

  const heartGlow = c.createRadialGradient(0, s * 0.1, s * 0.02, 0, s * 0.12, s * 0.2);
  heartGlow.addColorStop(0, isBackFace ? 'rgba(255, 227, 236, 0.16)' : finish.coreGlow);
  heartGlow.addColorStop(1, 'rgba(255, 214, 230, 0)');
  c.fillStyle = heartGlow;
  c.beginPath();
  traceSakuraContour(0.26);
  c.fill();

  c.restore();

  c.restore();
};

const drawAtmosphereVeil = (timestamp: number) => {
  const c = ctx;
  if (!c) return;

  const driftA = Math.sin(timestamp / 6200) * viewportWidth * 0.025;
  const driftB = Math.cos(timestamp / 7100) * viewportWidth * 0.03;

  c.save();

  const veilA = c.createRadialGradient(
    viewportWidth * 0.24 + driftA,
    viewportHeight * 0.22,
    viewportWidth * 0.06,
    viewportWidth * 0.24 + driftA,
    viewportHeight * 0.22,
    viewportWidth * 0.62
  );
  veilA.addColorStop(0, 'rgba(255, 224, 240, 0.1)');
  veilA.addColorStop(0.44, 'rgba(246, 226, 248, 0.055)');
  veilA.addColorStop(1, 'rgba(246, 226, 248, 0)');
  c.fillStyle = veilA;
  c.fillRect(0, 0, viewportWidth, viewportHeight);

  const veilB = c.createRadialGradient(
    viewportWidth * 0.72 + driftB,
    viewportHeight * 0.58,
    viewportWidth * 0.05,
    viewportWidth * 0.72 + driftB,
    viewportHeight * 0.58,
    viewportWidth * 0.54
  );
  veilB.addColorStop(0, 'rgba(222, 232, 255, 0.095)');
  veilB.addColorStop(0.48, 'rgba(236, 229, 255, 0.05)');
  veilB.addColorStop(1, 'rgba(236, 229, 255, 0)');
  c.fillStyle = veilB;
  c.fillRect(0, 0, viewportWidth, viewportHeight);

  const veilC = c.createLinearGradient(0, 0, viewportWidth, viewportHeight);
  veilC.addColorStop(0, 'rgba(255, 232, 244, 0.022)');
  veilC.addColorStop(0.5, 'rgba(244, 234, 255, 0.035)');
  veilC.addColorStop(1, 'rgba(234, 238, 255, 0.025)');
  c.fillStyle = veilC;
  c.fillRect(0, 0, viewportWidth, viewportHeight);

  c.restore();
};

const drawAtmosphereMote = (mote: AtmosphereMote, timestamp: number) => {
  const c = ctx;
  if (!c) return;

  const pulse = 0.76 + (Math.sin(timestamp / 880 + mote.pulseOffset) + 1) * 0.12;

  c.save();
  c.translate(mote.x, mote.y);
  c.scale(mote.stretchX, mote.stretchY);
  c.globalAlpha = mote.opacity * pulse;
  c.shadowBlur = mote.blur;
  c.shadowColor = 'rgba(255, 232, 244, 0.2)';

  const halo = c.createRadialGradient(0, 0, mote.radius * 0.08, 0, 0, mote.radius);
  halo.addColorStop(0, mote.tintInner);
  halo.addColorStop(0.46, mote.tintMid);
  halo.addColorStop(1, mote.tintOuter);
  c.fillStyle = halo;
  c.beginPath();
  c.arc(0, 0, mote.radius, 0, Math.PI * 2);
  c.fill();

  c.shadowBlur = 0;
  c.shadowColor = 'transparent';
  const core = c.createRadialGradient(-mote.radius * 0.18, -mote.radius * 0.18, 0, 0, 0, mote.radius * 0.56);
  core.addColorStop(0, 'rgba(255, 252, 255, 0.34)');
  core.addColorStop(1, 'rgba(255, 244, 250, 0)');
  c.fillStyle = core;
  c.beginPath();
  c.arc(0, 0, mote.radius * 0.52, 0, Math.PI * 2);
  c.fill();
  c.restore();
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
  drawAtmosphereVeil(timestamp);

  atmosphereMotes.forEach((mote) => {
    mote.y += mote.speedY * delta;
    mote.x += (
      mote.speedX
      + Math.sin(timestamp / 1000 * mote.swaySpeed + mote.swayOffset) * mote.sway
    ) * delta;

    if (
      mote.y - mote.radius > viewportHeight + 36
      || mote.x < -viewportWidth * 0.2
      || mote.x > viewportWidth * 1.2
    ) {
      resetAtmosphereMote(mote);
    }
  });

  petals.forEach((petal) => {
    petal.y += petal.speedY * delta;
    const windForDepth = (windSlow + windRipple) * DEPTH_WIND_SCALE[petal.depth];
    petal.x += (
      petal.speedX
      + windForDepth
      + Math.sin(timestamp / 1000 * petal.swaySpeed + petal.swayOffset) * petal.sway
    ) * delta;
    petal.rotation += petal.rotationSpeed * delta;
    petal.flipRotation += petal.flipSpeed * delta;

    if (
      petal.y - petal.size > viewportHeight + 24
      || petal.x < -viewportWidth * 0.18
      || petal.x > viewportWidth * 1.18
    ) {
      resetPetal(petal);
    }
  });

  for (const depth of DEPTH_DRAW_ORDER) {
    for (const mote of atmosphereMotes) {
      if (mote.depth === depth) {
        drawAtmosphereMote(mote, timestamp);
      }
    }
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
