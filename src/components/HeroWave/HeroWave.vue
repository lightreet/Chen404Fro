<template>
  <div class="hero-wave" :style="{ height: `${height}px` }" aria-hidden="true">
    <svg
      class="hero-wave-svg"
      viewBox="0 0 1440 180"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="ids.backGradient" x1="0" y1="34" x2="0" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" :stop-color="waveBack" stop-opacity="0.62" />
          <stop offset="100%" :stop-color="waveMid" stop-opacity="0.94" />
        </linearGradient>
        <linearGradient :id="ids.frontGradient" x1="0" y1="42" x2="0" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" :stop-color="waveMid" stop-opacity="0.95" />
          <stop offset="100%" :stop-color="waveFront" />
        </linearGradient>
        <linearGradient :id="ids.mistGradient" x1="0" y1="16" x2="0" y2="132" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="rgba(255,255,255,0)" />
          <stop offset="56%" :stop-color="waveMist" stop-opacity="0.14" />
          <stop offset="100%" :stop-color="waveMist" stop-opacity="0.58" />
        </linearGradient>
        <filter :id="ids.mistBlur" x="-8%" y="-54%" width="116%" height="224%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      <g class="hero-wave-track hero-wave-track--back">
        <g>
          <path class="hero-wave__back" :d="backWavePath" :fill="`url(#${ids.backGradient})`" />
          <path
            class="hero-wave__mist"
            :d="mistPath"
            :fill="`url(#${ids.mistGradient})`"
            :filter="`url(#${ids.mistBlur})`"
          />
        </g>
        <g :transform="`translate(${SVG_WIDTH} 0)`">
          <path class="hero-wave__back" :d="backWavePath" :fill="`url(#${ids.backGradient})`" />
          <path
            class="hero-wave__mist"
            :d="mistPath"
            :fill="`url(#${ids.mistGradient})`"
            :filter="`url(#${ids.mistBlur})`"
          />
        </g>
      </g>
      <path class="hero-wave__front" :d="frontWavePath" :fill="`url(#${ids.frontGradient})`" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type WaveColor = 'pink' | 'white';
type WavePoint = { x: number; y: number };

const SVG_WIDTH = 1440;
const SVG_HEIGHT = 180;
const SVG_FILL_BOTTOM = SVG_HEIGHT + 32;
const BASE_CYCLES = 4;

const props = withDefaults(
  defineProps<{
    color?: WaveColor;
    height?: number;
    intensity?: number;
  }>(),
  {
    color: 'pink',
    height: 150,
    intensity: 1,
  }
);

const height = computed(() => props.height);
const normalizedIntensity = computed(() => Math.min(1.12, Math.max(0.92, props.intensity)));

const ids = {
  backGradient: `hero-wave-back-${Math.random().toString(16).slice(2)}`,
  frontGradient: `hero-wave-front-${Math.random().toString(16).slice(2)}`,
  mistGradient: `hero-wave-mist-${Math.random().toString(16).slice(2)}`,
  mistBlur: `hero-wave-mist-blur-${Math.random().toString(16).slice(2)}`,
} as const;

const waveBack = computed(() =>
  props.color === 'white' ? 'var(--page-hero-wave-back)' : 'var(--page-hero-wave-back-pink, #ffe7ef)'
);
const waveMid = computed(() =>
  props.color === 'white' ? 'var(--page-hero-wave-mid)' : 'var(--page-hero-wave-mid-pink, #ffdbe8)'
);
const waveFront = computed(() =>
  props.color === 'white' ? 'var(--page-hero-wave-front)' : 'var(--page-hero-wave-front-pink, #ffd1e1)'
);
const waveMist = computed(() =>
  props.color === 'white' ? 'var(--page-hero-wave-mist)' : 'var(--page-hero-wave-mist-pink, rgba(255, 244, 248, 0.84))'
);

const backWavePath = computed(() =>
  buildWaveAreaPath({
    width: SVG_WIDTH,
    baseY: 121,
    amplitude: 11.5 * normalizedIntensity.value,
    phase: Math.PI * 0.2,
    cycles: BASE_CYCLES,
    samples: 144,
  })
);

const frontWavePath = computed(() =>
  buildWaveAreaPath({
    width: SVG_WIDTH,
    baseY: 108,
    amplitude: 17 * normalizedIntensity.value,
    phase: Math.PI * 0.56,
    cycles: BASE_CYCLES,
    samples: 176,
  })
);

const mistPath = computed(() =>
  buildWaveRibbonPath({
    width: SVG_WIDTH,
    baseY: 90,
    amplitude: 6.5 * normalizedIntensity.value,
    phase: Math.PI * 0.56,
    cycles: BASE_CYCLES,
    samples: 144,
    thickness: 22,
  })
);

function buildWaveAreaPath(config: {
  width: number;
  baseY: number;
  amplitude: number;
  phase: number;
  cycles: number;
  samples: number;
}) {
  const topLine = buildWavePoints(config);
  const first = topLine[0];
  const last = topLine[topLine.length - 1];
  const curve = pointsToBezierPath(topLine).replace(/^M[-\d.]+,[-\d.]+/, '').trim();
  return [
    `M-2,${SVG_FILL_BOTTOM}`,
    `L-2,${round(first.y)}`,
    `L0,${round(first.y)}`,
    curve,
    `L${config.width + 2},${round(last.y)}`,
    `L${config.width + 2},${SVG_FILL_BOTTOM}`,
    'Z',
  ].join(' ');
}

function buildWaveRibbonPath(config: {
  width: number;
  baseY: number;
  amplitude: number;
  phase: number;
  cycles: number;
  samples: number;
  thickness: number;
}) {
  const upper = buildWavePoints(config);
  const lower = upper.map((point) => ({ x: point.x, y: point.y + config.thickness })).reverse();
  return [`M${round(upper[0].x)},${round(upper[0].y)}`, pointsToBezierPath(upper), `L${round(lower[0].x)},${round(lower[0].y)}`, pointsToBezierPath(lower), 'Z'].join(' ');
}

function buildWavePoints(config: {
  width: number;
  baseY: number;
  amplitude: number;
  phase: number;
  cycles: number;
  samples: number;
}) {
  const points: WavePoint[] = [];
  for (let index = 0; index <= config.samples; index += 1) {
    const progress = index / config.samples;
    const angle = progress * Math.PI * 2 * config.cycles + config.phase;
    points.push({
      x: round(config.width * progress),
      y: round(config.baseY + Math.sin(angle) * config.amplitude),
    });
  }
  return points;
}

function pointsToBezierPath(points: WavePoint[]) {
  if (!points.length) return '';
  if (points.length === 1) return `M${round(points[0].x)},${round(points[0].y)}`;

  let path = `M${round(points[0].x)},${round(points[0].y)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    const cp1x = round(p1.x + (p2.x - p0.x) / 6);
    const cp1y = round(p1.y + (p2.y - p0.y) / 6);
    const cp2x = round(p2.x - (p3.x - p1.x) / 6);
    const cp2y = round(p2.y - (p3.y - p1.y) / 6);
    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${round(p2.x)},${round(p2.y)}`;
  }
  return path;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
</script>

<style scoped lang="scss">
.hero-wave {
  width: 100%;
  display: block;
  pointer-events: none;
  overflow: hidden;
}

.hero-wave-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: hidden;
  shape-rendering: geometricPrecision;
}

.hero-wave-track--back {
  transform-box: fill-box;
  transform-origin: 0 0;
  animation: hero-wave-horizontal-flow 38s linear infinite;
}

.hero-wave__mist {
  mix-blend-mode: screen;
  opacity: 0.88;
}

@keyframes hero-wave-horizontal-flow {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-wave-track--back {
    animation: none;
  }
}
</style>
