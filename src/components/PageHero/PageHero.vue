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
      <p v-if="subtitleLines.length" class="page-hero__subtitle">
        <HeroSubtitlePulse :text="subtitleLines" />
      </p>
      <div v-if="$slots.meta" class="page-hero__meta">
        <slot name="meta" />
      </div>
    </div>

    <div v-if="showWave" class="page-hero__transition" aria-hidden="true">
      <div class="page-hero__fog"></div>
      <div class="page-hero__wave">
        <HeroWave color="white" :height="waveHeight" :intensity="waveIntensity" />
      </div>
      <div class="page-hero__mist"></div>
    </div>

    <a v-if="scrollTarget" :href="scrollTarget" class="page-hero__scroll-hint" aria-label="向下滚动">
      <span class="page-hero__scroll-copy">向下看看</span>
      <span class="page-hero__scroll-chevron">↓</span>
    </a>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import HeroWave from '@/components/HeroWave/HeroWave.vue';
import HeroSubtitlePulse from '@/components/PageHero/HeroSubtitlePulse.vue';
import '@fontsource/patrick-hand/400.css';
import '@fontsource/zcool-kuaile/400.css';

interface Props {
  title: string;
  subtitle?: string | string[];
  eyebrow?: string;
  bgImage?: string;
  bgPosition?: string;
  bgSize?: string;
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
  bgSize: 'cover',
  minHeight: '70vh',
  overlayOpacity: 0.52,
  align: 'center',
  compact: false,
  showWave: true,
  scrollTarget: '',
  waveHeight: 138,
  waveIntensity: 1.02,
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
  '--page-hero-bg-position': props.bgPosition,
  '--page-hero-bg-size': props.bgSize,
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

const subtitleLines = computed(() => {
  const source = Array.isArray(props.subtitle) ? props.subtitle : (props.subtitle ? props.subtitle.split('\n') : []);
  return source.map((line) => line.trim()).filter(Boolean);
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
  padding: calc(64px + 2.2rem) 1.5rem 4.1rem;
  color: #fff;
  --page-hero-fade-glow-main: rgba(255, 255, 255, 0.96);
  --page-hero-fade-glow-secondary: rgba(255, 255, 255, 0.84);
  --page-hero-fade-glow-soft: rgba(255, 255, 255, 0.38);
  --page-hero-fade-side-main: rgba(255, 255, 255, 0.56);
  --page-hero-fade-side-soft: rgba(255, 255, 255, 0.18);
  --page-hero-wave-back: #ffffff;
  --page-hero-wave-mid: #fff8fa;
  --page-hero-wave-front: #fdf3f6;
  --page-hero-wave-mist: rgba(255, 249, 252, 0.9);
  --page-hero-wave-shadow: rgba(255, 231, 239, 0.72);
}

.page-hero--sakura-diary {
  --sakura-hero-text-main: #ffffff;
  --sakura-hero-text-muted: rgba(255, 248, 252, 0.88);
  --sakura-hero-accent: #ff7faa;
  --sakura-hero-accent-soft: #f7b6ca;
  --sakura-hero-shadow: rgba(52, 33, 46, 0.34);
  --page-hero-wave-back: #fffafc;
  --page-hero-wave-mid: #fff3f7;
  --page-hero-wave-front: #fdf0f4;
  --page-hero-wave-mist: rgba(255, 246, 250, 0.9);
  --page-hero-wave-shadow: rgba(255, 226, 236, 0.68);

  .page-hero__bg {
    filter: saturate(0.94) brightness(1.02) blur(0.45px);
    transform: scale(1);
  }

  .page-hero__overlay {
    background: linear-gradient(
      to bottom,
      rgba(82, 61, 76, calc(var(--page-hero-overlay-opacity) * 0.05)) 0%,
      rgba(82, 61, 76, calc(var(--page-hero-overlay-opacity) * 0.09)) 38%,
      rgba(82, 61, 76, calc(var(--page-hero-overlay-opacity) * 0.15)) 100%
    );
  }

  .page-hero__content {
    max-width: 920px;
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
  background-size: var(--page-hero-bg-size);
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
  height: 208px;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(
      72% 128% at 50% 100%,
      var(--page-hero-wave-shadow) 0%,
      rgba(255, 255, 255, 0.22) 34%,
      rgba(255, 255, 255, 0) 68%
    ),
    linear-gradient(
      to bottom,
      rgba(255, 248, 250, 0) 0%,
      rgba(255, 248, 250, 0.18) 36%,
      rgba(255, 248, 250, 0.62) 74%,
      var(--hero-fade-base) 100%
    );
  backdrop-filter: blur(3px);
}

.page-hero__content {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  margin: 0 0 1.1rem;
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
  max-width: min(100%, 44rem);
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
  font-family:
    'Microsoft YaHei UI',
    'PingFang SC',
    'Hiragino Sans GB',
    'Noto Sans CJK SC',
    sans-serif;
  font-size: clamp(1rem, 1.45vw, 1.08rem);
  font-weight: 500;
  line-height: 1.72;
  letter-spacing: 0.08em;
  color: rgba(255, 247, 252, 0.9);
  text-align: center;
  text-shadow:
    0 2px 12px rgba(37, 24, 34, 0.28),
    0 0 10px rgba(255, 214, 226, 0.1);
}

.page-hero--default {
  .page-hero__content {
    max-width: 860px;
  }

  .page-hero__title {
    font-family:
      'Patrick Hand',
      'ZCOOL KuaiLe',
      'Segoe Print',
      'Bradley Hand',
      cursive;
    font-size: clamp(2.75rem, 6vw, 4.5rem);
    font-weight: 400;
    letter-spacing: 0.04em;
    text-shadow:
      0 4px 20px rgba(0, 0, 0, 0.5),
      0 0 8px rgba(255, 182, 193, 0.58),
      0 0 20px rgba(255, 127, 170, 0.2);
  }

}

.page-hero__flower {
  display: none;
}

.page-hero--sakura-diary {
  .page-hero__title {
    font-size: clamp(2.9rem, 6.5vw, 5.15rem);
    line-height: 1.02;
    margin-bottom: 1.2rem;
    letter-spacing: 0.01em;
    font-weight: 400;
    text-shadow:
      0 5px 24px var(--sakura-hero-shadow),
      0 0 10px rgba(255, 196, 210, 0.7),
      0 0 28px rgba(255, 145, 182, 0.24);
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
    font-size: 1.04em;
    font-weight: 400;
    font-style: normal;
    letter-spacing: 0.045em;
    color: var(--sakura-hero-text-main);
    -webkit-text-stroke: 0.35px rgba(255, 214, 226, 0.58);
    text-shadow:
      0 4px 20px rgba(48, 28, 40, 0.46),
      0 0 8px rgba(255, 223, 233, 0.84),
      0 0 22px rgba(255, 127, 170, 0.42);
    filter: drop-shadow(0 0 8px rgba(255, 156, 190, 0.28));
    transform: rotate(-0.35deg);
  }

  .page-hero__accent::after {
    content: none;
  }

  .page-hero__accent-main {
    color: var(--sakura-hero-text-main);
  }

  .page-hero__accent-tail {
    color: var(--sakura-hero-text-main);
    text-shadow:
      0 4px 20px rgba(0, 0, 0, 0.54),
      0 0 10px rgba(255, 214, 226, 0.78),
      0 0 26px rgba(255, 127, 170, 0.5);
  }

  .page-hero__flower {
    display: inline-block;
    margin-left: 0.16em;
    font-size: 0.25em;
    color: color-mix(in srgb, var(--sakura-hero-accent-soft) 82%, var(--sakura-hero-text-muted));
    text-shadow:
      0 0 10px rgba(247, 182, 202, 0.28),
      0 3px 10px rgba(111, 101, 115, 0.14);
    transform: translateY(-0.7em) rotate(6deg);
  }

  .page-hero__scroll-hint {
    color: rgba(118, 99, 114, 0.82);
  }
}

.page-hero__meta {
  margin-top: 1.2rem;
}

.page-hero__transition {
  position: absolute;
  inset-inline: 0;
  bottom: -1px;
  height: calc(var(--page-hero-wave-height) + 64px);
  z-index: 2;
  pointer-events: none;
}

.page-hero__fog,
.page-hero__wave {
  position: absolute;
  left: 0;
  right: 0;
}

.page-hero__fog {
  bottom: calc(var(--page-hero-wave-height) - 106px);
  height: 92px;
  background: linear-gradient(
    to bottom,
    rgba(255, 248, 250, 0) 0%,
    rgba(255, 248, 250, 0.3) 32%,
    rgba(255, 248, 250, 0.74) 72%,
    rgba(255, 248, 250, 0.98) 100%
  );
  filter: blur(12px);
  opacity: 0.96;
}

.page-hero__wave {
  bottom: 0;
  height: var(--page-hero-wave-height);
  line-height: 0;
  filter: drop-shadow(0 -8px 24px rgba(255, 231, 239, 0.38));
}

.page-hero__mist {
  position: absolute;
  left: -2%;
  right: -2%;
  bottom: calc(var(--page-hero-wave-height) - 14px);
  height: 78px;
  background:
    radial-gradient(
      66% 100% at 50% 100%,
      var(--page-hero-wave-mist) 0%,
      rgba(255, 255, 255, 0.56) 34%,
      rgba(255, 255, 255, 0) 74%
    );
  filter: blur(20px);
  opacity: 0.92;
}

.page-hero__scroll-hint {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
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

[data-theme='dark'] .page-hero--sakura-diary {
  --page-hero-wave-back: #413442;
  --page-hero-wave-mid: #342b38;
  --page-hero-wave-front: #241f2b;
  --page-hero-wave-mist: rgba(100, 80, 103, 0.64);
  --page-hero-wave-shadow: rgba(97, 74, 101, 0.32);

  .page-hero__overlay {
    background: linear-gradient(
      to bottom,
      rgba(24, 18, 30, calc(var(--page-hero-overlay-opacity) * 0.24)) 0%,
      rgba(28, 21, 34, calc(var(--page-hero-overlay-opacity) * 0.38)) 40%,
      rgba(34, 26, 40, calc(var(--page-hero-overlay-opacity) * 0.72)) 100%
    );
  }

  .page-hero__fade {
    background:
      radial-gradient(
        72% 128% at 50% 100%,
        rgba(108, 82, 111, 0.4) 0%,
        rgba(76, 59, 85, 0.18) 36%,
        rgba(255, 255, 255, 0) 68%
      ),
      linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0) 0%,
        rgba(48, 38, 58, 0.08) 42%,
        rgba(42, 33, 50, 0.54) 74%,
        var(--hero-fade-base) 100%
      );
  }

  .page-hero__fog {
    background: linear-gradient(
      to bottom,
      rgba(64, 52, 69, 0) 0%,
      rgba(64, 52, 69, 0.16) 34%,
      rgba(58, 47, 63, 0.56) 74%,
      rgba(45, 37, 51, 0.94) 100%
    );
  }

  .page-hero__wave {
    filter: drop-shadow(0 -8px 24px rgba(68, 50, 71, 0.28));
  }

  .page-hero__scroll-hint {
    color: rgba(222, 204, 215, 0.8);
  }
}

.page-hero__scroll-copy {
  font-size: 0.76rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.72;
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
    padding: calc(64px + 0.85rem) 1rem 2.1rem;
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
    line-height: 1.62;
    letter-spacing: 0.05em;
  }

  .page-hero__meta {
    margin-top: 0.9rem;
  }

  .page-hero__fade {
    height: 142px;
  }

  .page-hero__transition {
    height: calc(var(--page-hero-wave-height) + 42px);
  }

  .page-hero__fog {
    bottom: calc(var(--page-hero-wave-height) - 58px);
    height: 64px;
    filter: blur(10px);
  }

  .page-hero__mist {
    bottom: calc(var(--page-hero-wave-height) - 6px);
    height: 54px;
    filter: blur(16px);
  }

  .page-hero__scroll-hint {
    bottom: 0.4rem;
  }

  .page-hero__scroll-copy {
    font-size: 0.68rem;
    letter-spacing: 0.12em;
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
  }

  .page-hero--default {
    .page-hero__title {
      font-size: clamp(2.2rem, 10vw, 3.4rem);
      letter-spacing: 0.03em;
    }
  }
}
</style>
