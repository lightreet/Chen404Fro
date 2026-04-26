<template>
  <section
    class="page-hero"
    :class="[
      `page-hero--${align}`,
      `page-hero--${variant}`,
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
          {{ highlightParts.before }}<span class="page-hero__accent">
            <template v-if="variant === 'sakura-diary' && highlightText === 'Chen404'">
              <span class="page-hero__accent-main">Chen</span><span class="page-hero__accent-tail">404</span>
            </template>
            <template v-else>
              {{ highlightText }}
            </template>
          </span><span
            v-if="variant === 'sakura-diary'"
            class="page-hero__flower"
            aria-hidden="true"
          >❀</span>{{ highlightParts.after }}
        </template>
        <template v-else>
          {{ title }}
        </template>
      </h1>
      <p v-if="subtitle" class="page-hero__subtitle">
        <span class="page-hero__subtitle-text">{{ subtitle }}</span>
      </p>
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
import '@fontsource/patrick-hand/400.css';
import heroBrushUnderline from '@/assets/hero-brush-underline.svg';

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
  variant?: 'default' | 'sakura-diary';
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
  waveHeight: 112,
  waveIntensity: 1.08,
  highlightText: '',
  variant: 'default',
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
  '--page-hero-brush-image': `url("${heroBrushUnderline}")`,
  '--page-hero-bg-position': props.bgPosition,
  '--page-hero-min-height': normalizeMinHeight(props.minHeight),
  '--page-hero-overlay-opacity': String(props.overlayOpacity),
  '--page-hero-wave-height': `${props.waveHeight}px`,
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

.page-hero--sakura-diary {
  .page-hero__bg {
    filter: saturate(0.82) brightness(1.08) blur(1.1px);
    transform: scale(1.015);
  }

  .page-hero__overlay {
    background: linear-gradient(
      to bottom,
      rgba(70, 58, 64, calc(var(--page-hero-overlay-opacity) * 0.06)) 0%,
      rgba(70, 58, 64, calc(var(--page-hero-overlay-opacity) * 0.13)) 52%,
      rgba(70, 58, 64, calc(var(--page-hero-overlay-opacity) * 0.2)) 100%
    );
  }

  .page-hero__content {
    max-width: 900px;
  }
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
  font-size: clamp(2.2rem, 5.4vw, 4rem);
  line-height: 1.08;
  font-weight: 760;
  margin: 0 0 1rem;
  letter-spacing: 0.015em;
  text-shadow:
    0 14px 34px rgba(24, 14, 31, 0.3),
    0 2px 10px rgba(0, 0, 0, 0.18);
}

.page-hero__accent {
  color: #ff9eb3;
}

.page-hero__subtitle {
  margin: 0;
  display: flex;
  justify-content: center;
}

.page-hero__subtitle-text {
  display: inline-block;
  max-width: min(100%, 42rem);
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
  font-family: inherit;
  font-size: clamp(1rem, 2.15vw, 1.18rem);
  line-height: 1.75;
  letter-spacing: 0.07em;
  color: rgba(255, 255, 255, 0.82);
  text-shadow: 0 1px 12px rgba(32, 16, 28, 0.16);
}

.page-hero__flower {
  display: none;
}

.page-hero--sakura-diary {
  .page-hero__title {
    font-size: clamp(2.9rem, 6.5vw, 5.15rem);
    line-height: 1.02;
    margin-bottom: 1.45rem;
    letter-spacing: 0.01em;
    font-weight: 400;
    text-shadow:
      0 12px 34px rgba(27, 35, 48, 0.28),
      0 2px 10px rgba(27, 35, 48, 0.18);
  }

  .page-hero__accent {
    position: relative;
    display: inline-block;
    padding-inline: 0.02em;
    font-family:
      'Patrick Hand',
      'Segoe Print',
      'Bradley Hand',
      cursive;
    font-size: 1em;
    font-weight: 400;
    font-style: normal;
    letter-spacing: 0.02em;
    color: #8f8792;
    text-shadow:
      0 1px 0 rgba(255, 255, 255, 0.26),
      0 8px 24px rgba(91, 74, 92, 0.18),
      0 2px 8px rgba(91, 74, 92, 0.12);
    transform: rotate(-0.45deg);
  }

  .page-hero__accent::after {
    content: none;
  }

  .page-hero__accent-main {
    color: #8f8792;
  }

  .page-hero__accent-tail {
    color: #f3bdd1;
  }

  .page-hero__flower {
    display: inline-block;
    margin-left: 0.16em;
    font-size: 0.25em;
    color: rgba(238, 164, 195, 0.82);
    text-shadow:
      0 0 10px rgba(238, 164, 195, 0.22),
      0 3px 10px rgba(91, 74, 92, 0.14);
    transform: translateY(-0.7em) rotate(6deg);
  }

  .page-hero__subtitle-text {
    position: relative;
    max-width: none;
    padding: 0.12rem 0.35rem 0.16rem;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
    font-family: inherit;
    font-size: clamp(1.08rem, 2.02vw, 1.34rem);
    line-height: 1.9;
    letter-spacing: 0.11em;
    color: rgba(109, 101, 112, 0.64);
    text-shadow:
      0 1px 0 rgba(255, 255, 255, 0.18),
      0 8px 20px rgba(91, 74, 92, 0.08);
  }

  .page-hero__subtitle-text::before {
    content: none;
  }

  .page-hero__subtitle-text::after {
    content: none;
  }

  .page-hero__scroll-hint {
    color: rgba(68, 48, 58, 0.72);
  }
}

.page-hero__meta {
  margin-top: 1.2rem;
}

.page-hero__wave {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--page-hero-wave-height);
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
    min-height: min(44vh, var(--page-hero-min-height));
    padding: calc(64px + 0.75rem) 1rem 2rem;
  }

  .page-hero--compact {
    min-height: min(40vh, var(--page-hero-min-height));
    padding-bottom: 1.8rem;
  }

  .page-hero--left .page-hero__content {
    padding-inline: 0;
  }

  .page-hero__eyebrow {
    margin-bottom: 0.6rem;
    font-size: 0.72rem;
    letter-spacing: 0.18em;
  }

  .page-hero__title {
    font-size: clamp(2rem, 8vw, 2.95rem);
    margin-bottom: 0.72rem;
  }

  .page-hero__subtitle-text {
    max-width: min(100%, 27rem);
    padding: 0;
    border-radius: 0;
    font-size: 0.96rem;
    line-height: 1.65;
    letter-spacing: 0.05em;
  }

  .page-hero__meta {
    margin-top: 0.9rem;
  }

  .page-hero__fade {
    height: 116px;
  }

  .page-hero__scroll-hint {
    bottom: 0.45rem;
  }

  .page-hero--sakura-diary {
    .page-hero__title {
      font-size: clamp(2.45rem, 12vw, 3.65rem);
      margin-bottom: 1rem;
    }

    .page-hero__flower {
      font-size: 0.22em;
      margin-left: 0.12em;
    }

    .page-hero__subtitle-text {
      max-width: min(100%, 24rem);
      padding-inline: 0.2rem;
      font-size: 0.95rem;
      letter-spacing: 0.06em;
      line-height: 1.72;
      border-radius: 0;
    }

    .page-hero__subtitle-text::before {
      inset-inline: -0.8rem;
    }

    .page-hero__subtitle-text::after {
      inset-inline: -0.35rem;
    }
  }
}
</style>
