<template>
  <section
    class="page-hero"
    :class="[
      `page-hero--${align}`,
      { 'page-hero--compact': compact, 'page-hero--with-wave': showWave },
    ]"
    :style="heroVars"
    data-hero
  >
    <div class="page-hero__bg" />
    <div class="page-hero__overlay" />
    <div class="page-hero__fade" aria-hidden="true" />

    <div class="page-hero__content">
      <p v-if="eyebrow" class="page-hero__eyebrow">{{ eyebrow }}</p>
      <h1 class="page-hero__title">
        <template v-if="highlightParts">
          {{ highlightParts.before }}<span class="page-hero__accent">{{ highlightText }}</span>{{ highlightParts.after }}
        </template>
        <template v-else>
          {{ title }}
        </template>
      </h1>
      <p v-if="subtitle" class="page-hero__subtitle">{{ subtitle }}</p>
      <div v-if="$slots.meta" class="page-hero__meta">
        <slot name="meta" />
      </div>
    </div>

    <div v-if="showWave" class="page-hero__wave" aria-hidden="true">
      <HeroWave color="white" :height="waveHeight" :intensity="waveIntensity" />
    </div>

    <a v-if="scrollTarget" :href="scrollTarget" class="page-hero__scroll-hint" aria-label="向下滚动">
      <span class="page-hero__scroll-chevron">↓</span>
    </a>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import HeroWave from '@/components/HeroWave/HeroWave.vue';

interface Props {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  bgImage?: string;
  bgPosition?: string;
  minHeight?: string;
  overlayOpacity?: number;
  align?: 'left' | 'center';
  compact?: boolean;
  showWave?: boolean;
  scrollTarget?: string;
  waveHeight?: number;
  waveIntensity?: number;
  highlightText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  eyebrow: '',
  bgImage: '',
  bgPosition: 'center',
  minHeight: '70vh',
  overlayOpacity: 0.52,
  align: 'center',
  compact: false,
  showWave: true,
  scrollTarget: '',
  waveHeight: 92,
  waveIntensity: 1.08,
  highlightText: '',
});

const fallbackBg =
  'linear-gradient(135deg, #0f172a 0%, #1d3557 52%, #3a506b 100%)';
const HERO_HEIGHT_SCALE = 0.8;

const normalizedBgImage = computed(() => {
  const value = props.bgImage?.trim() ?? '';
  if (!value) return '';
  if (/[\"'()<>\\\r\n]/.test(value)) return '';
  if (!(value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://'))) {
    return '';
  }
  return value.replace(/"/g, '%22');
});

const heroVars = computed(() => ({
  '--page-hero-bg-image': normalizedBgImage.value ? `url("${normalizedBgImage.value}")` : fallbackBg,
  '--page-hero-bg-position': props.bgPosition,
  '--page-hero-min-height': normalizeMinHeight(props.minHeight),
  '--page-hero-overlay-opacity': String(props.overlayOpacity),
}));

const highlightParts = computed(() => {
  if (!props.highlightText) return null;
  const index = props.title.indexOf(props.highlightText);
  if (index < 0) return null;
  return {
    before: props.title.slice(0, index),
    after: props.title.slice(index + props.highlightText.length),
  };
});

function normalizeMinHeight(value: string) {
  const normalized = value.trim();
  const vhMatch = normalized.match(/^(\d+(?:\.\d+)?)vh$/i);
  if (!vhMatch) {
    return normalized;
  }

  const scaled = Number(vhMatch[1]) * HERO_HEIGHT_SCALE;
  return `${Math.round(scaled * 10) / 10}vh`;
}
</script>

<style scoped lang="scss">
.page-hero {
  position: relative;
  min-height: var(--page-hero-min-height);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: calc(64px + 2rem) 1.5rem 5rem;
  color: #fff;
}

.page-hero--compact {
  padding-bottom: 3.75rem;
}

.page-hero--left {
  text-align: left;

  .page-hero__content {
    width: min(100%, 1120px);
    max-width: 1120px;
    padding-inline: clamp(0.5rem, 2vw, 1.5rem);
    margin-inline: auto;
  }
}

.page-hero--center {
  text-align: center;

  .page-hero__content {
    max-width: 760px;
  }
}

.page-hero__bg,
.page-hero__overlay,
.page-hero__fade {
  position: absolute;
  inset: 0;
}

.page-hero__bg {
  background-image: var(--page-hero-bg-image), linear-gradient(135deg, #0f172a 0%, #1d3557 52%, #3a506b 100%);
  background-size: cover;
  background-position: var(--page-hero-bg-position);
  background-repeat: no-repeat;
}

.page-hero__bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.page-hero__overlay {
  background: linear-gradient(
    to bottom,
    rgba(8, 15, 31, calc(var(--page-hero-overlay-opacity) * 0.72)) 0%,
    rgba(8, 15, 31, var(--page-hero-overlay-opacity)) 60%,
    rgba(8, 15, 31, calc(var(--page-hero-overlay-opacity) + 0.12)) 100%
  );
}

.page-hero__fade {
  top: auto;
  height: 228px;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0) 20%,
    var(--bg-primary) 100%
  );
}

.page-hero__content {
  position: relative;
  z-index: 1;
}

.page-hero__eyebrow {
  margin: 0 0 0.9rem;
  font-size: 0.8rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.page-hero__title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.12;
  font-weight: 700;
  margin: 0 0 0.75rem;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
}

.page-hero__accent {
  color: #ff9eb3;
}

.page-hero__subtitle {
  margin: 0;
  font-size: clamp(0.95rem, 2.2vw, 1.12rem);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.92);
}

.page-hero__meta {
  margin-top: 1.2rem;
}

.page-hero__wave {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 92px;
  z-index: 1;
  line-height: 0;
}

.page-hero__scroll-hint {
  position: absolute;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
  font-size: 1.25rem;
  transition:
    transform 0.2s ease,
    color 0.2s ease;

  &:hover {
    color: #fff;
    transform: translateX(-50%) translateY(4px);
  }
}

.page-hero__scroll-chevron {
  display: block;
  animation: page-hero-bounce 2s ease-in-out infinite;
}

@keyframes page-hero-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

@media (max-width: 768px) {
  .page-hero {
    min-height: min(52vh, var(--page-hero-min-height));
    padding: calc(64px + 1rem) 1rem 3rem;
  }

  .page-hero--compact {
    min-height: min(48vh, var(--page-hero-min-height));
    padding-bottom: 2.5rem;
  }

  .page-hero--left .page-hero__content {
    padding-inline: 0;
  }

  .page-hero__fade {
    height: 152px;
  }

  .page-hero__scroll-hint {
    bottom: 0.85rem;
  }
}
</style>
