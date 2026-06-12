<template>
  <section class="feature-cover">
    <div class="feature-cover__badge">
      <UiIcon :name="icon" />
      <span>{{ eyebrow }}</span>
    </div>

    <div class="feature-cover__body">
      <div class="feature-cover__copy">
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>

      <div class="feature-cover__notice">
        <strong>{{ noticeTitle }}</strong>
        <p>{{ noticeText }}</p>
      </div>
    </div>

    <div class="feature-cover__actions">
      <router-link v-if="primaryTo" :to="primaryTo" class="feature-cover__link">
        <UiButton variant="primary" class="feature-cover__button">{{ primaryText }}</UiButton>
      </router-link>
      <router-link v-if="secondaryTo" :to="secondaryTo" class="feature-cover__link feature-cover__link--secondary">
        <UiButton variant="secondary" class="feature-cover__button feature-cover__button--ghost">{{ secondaryText }}</UiButton>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import { UiButton, UiIcon } from '@/components/ui'
import type { FeatureAccessCoverConfig } from '@/modules/feature-access/constants'

defineProps<FeatureAccessCoverConfig & {
  icon: string
}>()
</script>

<style scoped lang="scss">
.feature-cover {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 24px;
  width: min(960px, calc(100vw - 120px));
  margin: 28px auto 48px;
  padding: clamp(28px, 3vw, 40px);
  border-radius: 34px;
  background:
    linear-gradient(145deg, rgba(255, 252, 253, 0.96), rgba(249, 246, 255, 0.94)),
    radial-gradient(circle at top right, rgba(247, 176, 205, 0.18), transparent 34%),
    radial-gradient(circle at bottom left, rgba(189, 212, 255, 0.16), transparent 32%);
  border: 1px solid rgba(242, 221, 229, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 28px 56px rgba(211, 181, 194, 0.18);
}

.feature-cover::before,
.feature-cover::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.feature-cover::before {
  top: -68px;
  right: -28px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(255, 210, 228, 0.36), transparent 68%);
}

.feature-cover::after {
  bottom: -88px;
  left: -42px;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(210, 225, 255, 0.28), transparent 70%);
}

.feature-cover__badge {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(255, 244, 248, 0.92);
  border: 1px solid rgba(240, 213, 224, 0.88);
  color: #c96f95;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.feature-cover__body {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.9fr);
  gap: 24px;
  align-items: stretch;
}

.feature-cover__copy {
  h2 {
    margin: 0 0 12px;
    color: #4f3a44;
    font-size: clamp(28px, 3vw, 40px);
    font-weight: 700;
    line-height: 1.08;
  }

  p {
    margin: 0;
    max-width: 34rem;
    color: #76636b;
    font-size: 15px;
    line-height: 1.9;
  }
}

.feature-cover__notice {
  display: grid;
  align-content: center;
  gap: 10px;
  padding: 24px 26px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 249, 251, 0.96), rgba(255, 255, 255, 0.9));
  border: 1px solid rgba(238, 220, 227, 0.88);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 16px 32px rgba(219, 192, 201, 0.1);

  strong {
    color: #5c424d;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.4;
  }

  p {
    margin: 0;
    color: #8a707b;
    font-size: 14px;
    line-height: 1.9;
  }
}

.feature-cover__actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.feature-cover__link {
  text-decoration: none;
}

.feature-cover__button {
  min-width: 132px;
  min-height: 44px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.feature-cover__button--ghost {
  background: rgba(255, 251, 252, 0.86);
  border-color: rgba(234, 209, 219, 0.86);
  color: #7f6170;
}

@media (max-width: 900px) {
  .feature-cover {
    width: min(100%, calc(100vw - 32px));
    margin: 22px auto 36px;
    padding: 24px 20px;
    border-radius: 28px;
  }

  .feature-cover__body {
    grid-template-columns: 1fr;
  }

  .feature-cover__copy p {
    max-width: none;
  }
}
</style>
