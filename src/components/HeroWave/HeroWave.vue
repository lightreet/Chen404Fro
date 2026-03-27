<template>
  <svg
    class="hero-wave-svg"
    :style="{ height: `${height}px` }"
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <!-- 顶部更淡、底部更实：增强景深与层次 -->
      <linearGradient :id="ids.strokeGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="strokeTop" stop-opacity="0.06" />
        <stop offset="55%" :stop-color="strokeMid" stop-opacity="0.18" />
        <stop offset="100%" :stop-color="strokeBottom" stop-opacity="0.30" />
      </linearGradient>

      <!-- Back layer filter -->
      <filter :id="ids.fBack" x="-10%" y="-35%" width="120%" height="170%">
        <feTurbulence
          type="fractalNoise"
          :baseFrequency="reducedMotion ? '0.010 0.028' : '0.010 0.028'"
          numOctaves="2"
          :seed="seedBack"
          :result="ids.tBack"
        >
          <animate
            v-if="!reducedMotion"
            attributeName="baseFrequency"
            dur="15s"
            values="0.010 0.028; 0.014 0.040; 0.010 0.028"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          :in2="ids.tBack"
          scale="5"
          xChannelSelector="R"
          yChannelSelector="G"
        >
          <animate
            v-if="!reducedMotion"
            attributeName="scale"
            dur="13s"
            values="4; 7; 4"
            repeatCount="indefinite"
          />
        </feDisplacementMap>
      </filter>

      <!-- Mid layer filter -->
      <filter :id="ids.fMid" x="-10%" y="-35%" width="120%" height="170%">
        <feTurbulence
          type="fractalNoise"
          :baseFrequency="reducedMotion ? '0.014 0.040' : '0.014 0.040'"
          numOctaves="2"
          :seed="seedMid"
          :result="ids.tMid"
        >
          <animate
            v-if="!reducedMotion"
            attributeName="baseFrequency"
            dur="10.5s"
            values="0.014 0.040; 0.020 0.060; 0.014 0.040"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          :in2="ids.tMid"
          scale="8"
          xChannelSelector="R"
          yChannelSelector="G"
        >
          <animate
            v-if="!reducedMotion"
            attributeName="scale"
            dur="8.8s"
            values="6; 10; 6"
            repeatCount="indefinite"
          />
        </feDisplacementMap>
      </filter>

      <!-- Front layer filter -->
      <filter :id="ids.fFront" x="-10%" y="-35%" width="120%" height="170%">
        <feTurbulence
          type="fractalNoise"
          :baseFrequency="reducedMotion ? '0.020 0.066' : '0.020 0.066'"
          numOctaves="2"
          :seed="seedFront"
          :result="ids.tFront"
        >
          <animate
            v-if="!reducedMotion"
            attributeName="baseFrequency"
            dur="6.8s"
            values="0.020 0.066; 0.030 0.090; 0.020 0.066"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          :in2="ids.tFront"
          scale="11"
          xChannelSelector="R"
          yChannelSelector="G"
        >
          <animate
            v-if="!reducedMotion"
            attributeName="scale"
            dur="5.2s"
            values="8; 13; 8"
            repeatCount="indefinite"
          />
        </feDisplacementMap>
      </filter>
    </defs>

    <!-- back -->
    <g class="layer layer-back" :filter="`url(#${ids.fBack})`">
      <path
        v-for="line in backLines"
        :key="line.id"
        class="wave-line"
        :d="line.d"
        :style="line.style"
      />
    </g>

    <!-- mid -->
    <g class="layer layer-mid" :filter="`url(#${ids.fMid})`">
      <path
        v-for="line in midLines"
        :key="line.id"
        class="wave-line"
        :d="line.d"
        :style="line.style"
      />
    </g>

    <!-- front -->
    <g class="layer layer-front" :filter="`url(#${ids.fFront})`">
      <path
        v-for="line in frontLines"
        :key="line.id"
        class="wave-line"
        :d="line.d"
        :style="line.style"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

type WaveColor = 'pink' | 'white';
type WaveDepth = 'back' | 'mid' | 'front';
type WavePoint = { x: number; y: number };
type WaveLine = { id: string; d: string; style: Record<string, string> };

const props = withDefaults(
  defineProps<{
    color?: WaveColor;
    height?: number;
    intensity?: number;
  }>(),
  {
    color: 'pink',
    height: 64,
    intensity: 1,
  }
);

const height = computed(() => props.height);
const reducedMotion = ref(false);
let media: MediaQueryList | null = null;

const seedBack = Math.floor(Math.random() * 1000) + 1;
const seedMid = Math.floor(Math.random() * 1000) + 1001;
const seedFront = Math.floor(Math.random() * 1000) + 2001;

const ids = {
  strokeGradient: `hero-wave-stroke-${Math.random().toString(16).slice(2)}`,
  fBack: `hero-wave-f-back-${Math.random().toString(16).slice(2)}`,
  fMid: `hero-wave-f-mid-${Math.random().toString(16).slice(2)}`,
  fFront: `hero-wave-f-front-${Math.random().toString(16).slice(2)}`,
  tBack: `tBack`,
  tMid: `tMid`,
  tFront: `tFront`,
} as const;

const strokeBase = computed(() => {
  if (props.color === 'white') return '255, 255, 255';
  // 淡粉：偏樱花但更“海雾”一点
  return '255, 205, 228';
});

const strokeTop = computed(() => {
  // white 模式下直接跟随页面主题：卡片背景 -> 页面背景
  if (props.color === 'white') return 'var(--bg-secondary)';
  return 'rgb(255, 235, 244)';
});

const strokeMid = computed(() => {
  if (props.color === 'white') return 'var(--bg-secondary)';
  return 'rgb(255, 220, 236)';
});

const strokeBottom = computed(() => {
  // 底部与正文背景衔接，轻微借用主题底色
  if (props.color === 'white') return 'var(--bg-primary)';
  return `rgb(${strokeBase.value})`;
});

const layerSpecs: Record<
  WaveDepth,
  {
    lines: number;
    strokeWidth: number;
    opacity: number;
    yStart: number;
    yStep: number;
    amplitude: number;
    wavelength: number;
    phaseOffset: number;
  }
> = {
  back: {
    lines: 9,
    strokeWidth: 0.95,
    opacity: 0.18,
    yStart: 44,
    yStep: 2.7,
    amplitude: 6.5,
    wavelength: 320,
    phaseOffset: 0,
  },
  mid: {
    lines: 11,
    strokeWidth: 1.25,
    opacity: 0.26,
    yStart: 50,
    yStep: 2.45,
    amplitude: 10,
    wavelength: 250,
    phaseOffset: 38,
  },
  front: {
    lines: 13,
    strokeWidth: 1.7,
    opacity: 0.34,
    yStart: 57,
    yStep: 2.25,
    amplitude: 14,
    wavelength: 208,
    phaseOffset: 76,
  },
};

const round = (value: number) => Number(value.toFixed(2));

const buildWavePoints = (depth: WaveDepth, index: number): WavePoint[] => {
  const layer = layerSpecs[depth];
  const intensity = Math.max(0.6, props.intensity);
  const baseY = layer.yStart + index * layer.yStep;
  const amplitude =
    layer.amplitude * intensity * (1 + Math.sin(index * 1.17 + layer.phaseOffset * 0.01) * 0.16);
  const wavelength = layer.wavelength * (1 + Math.cos(index * 0.87) * 0.06);
  const phase = layer.phaseOffset + index * 18;
  const step = wavelength / 4;

  const points: WavePoint[] = [];
  for (let x = -step * 2; x <= 1200 + step * 2; x += step) {
    const angle = ((x + phase) / wavelength) * Math.PI * 2;
    const secondaryAngle = angle * 0.5 + index * 0.65;
    const y =
      baseY +
      Math.sin(angle) * amplitude +
      Math.sin(secondaryAngle) * amplitude * (depth === 'back' ? 0.08 : depth === 'mid' ? 0.12 : 0.16);

    points.push({ x: round(x), y: round(y) });
  }

  return points;
};

const catmullRomToBezier = (points: WavePoint[]) => {
  if (points.length < 2) return '';

  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = round(p1.x + (p2.x - p0.x) / 6);
    const cp1y = round(p1.y + (p2.y - p0.y) / 6);
    const cp2x = round(p2.x - (p3.x - p1.x) / 6);
    const cp2y = round(p2.y - (p3.y - p1.y) / 6);

    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return path;
};

const buildLineStyle = (depth: WaveDepth, index: number) => {
  const layer = layerSpecs[depth];
  const fade = 1 - index / Math.max(1, layer.lines - 1);
  const variance = 0.94 + Math.sin(index * 1.91 + layer.phaseOffset) * 0.06;

  return {
    stroke: `url(#${ids.strokeGradient})`,
    strokeOpacity: (layer.opacity * (0.46 + fade * 0.54) * variance).toFixed(3),
    strokeWidth: `${(layer.strokeWidth * (0.76 + fade * 0.24)).toFixed(2)}px`,
  } as Record<string, string>;
};

const buildWaveLines = (depth: WaveDepth): WaveLine[] => {
  const layer = layerSpecs[depth];
  return Array.from({ length: layer.lines }, (_, index) => ({
    id: `${depth}-${index}`,
    d: catmullRomToBezier(buildWavePoints(depth, index)),
    style: buildLineStyle(depth, index),
  }));
};

const backLines = computed(() => buildWaveLines('back'));
const midLines = computed(() => buildWaveLines('mid'));
const frontLines = computed(() => buildWaveLines('front'));

onMounted(() => {
  media = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.value = media.matches;
  const handler = () => (reducedMotion.value = !!media?.matches);
  if ('addEventListener' in media) {
    media.addEventListener('change', handler);
  } else {
    // legacy Safari
    (media as any).addListener(handler);
  }

  onUnmounted(() => {
    if (!media) return;
    if ('removeEventListener' in media) {
      media.removeEventListener('change', handler);
    } else {
      (media as any).removeListener(handler);
    }
  });
});
</script>

<style scoped lang="scss">
.hero-wave-svg {
  width: 100%;
  display: block;
  pointer-events: none;
  shape-rendering: geometricPrecision;
}

.wave-line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  /* keep stroke stable on scaling */
  transform-box: fill-box;
}

.layer {
  transform-origin: center;
  will-change: filter, transform;
}

.layer-back {
  animation: layer-drift-back 17s ease-in-out infinite;
}

.layer-mid {
  animation: layer-drift-mid 11s ease-in-out infinite;
}

.layer-front {
  animation: layer-drift-front 7.4s ease-in-out infinite;
}

@keyframes layer-drift-back {
  0%, 100% {
    transform: translateX(0) translateY(0);
  }
  50% {
    transform: translateX(-12px) translateY(0.8px);
  }
}

@keyframes layer-drift-mid {
  0%, 100% {
    transform: translateX(0) translateY(0);
  }
  50% {
    transform: translateX(18px) translateY(1.2px);
  }
}

@keyframes layer-drift-front {
  0%, 100% {
    transform: translateX(0) translateY(0);
  }
  50% {
    transform: translateX(-26px) translateY(1.8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .layer {
    filter: none !important;
    animation: none !important;
  }

  /* SVG animate tags are conditionally removed already; this is an extra safety net */
  :deep(animate) {
    display: none !important;
  }
}
</style>

