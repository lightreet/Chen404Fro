<template>
  <div
    class="ui-loading-state"
    :class="[
      `ui-loading-state--${variant}`,
      { 'is-loading': loading, 'is-fullscreen': fullscreen },
    ]"
    :aria-busy="loading ? 'true' : 'false'"
  >
    <div class="ui-loading-state__content" :class="{ 'is-dimmed': loading && dimContent }">
      <slot />
    </div>

    <Transition name="m-fade">
      <div v-if="loading" class="ui-loading-state__overlay" role="status" aria-live="polite">
        <div class="ui-loading-state__backdrop" />
        <div class="ui-loading-state__indicator">
          <UiIcon name="Loading" spin class="ui-loading-state__spinner" />
          <p v-if="message" class="ui-loading-state__message">{{ message }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import UiIcon from '../icon/UiIcon.vue'

withDefaults(
  defineProps<{
    loading?: boolean
    message?: string
    dimContent?: boolean
    fullscreen?: boolean
    variant?: 'soft' | 'glass' | 'plain'
  }>(),
  {
    loading: false,
    message: '',
    dimContent: true,
    fullscreen: false,
    variant: 'soft',
  },
)
</script>

<style scoped lang="scss">
.ui-loading-state {
  position: relative;
  min-width: 0;
}

.ui-loading-state.is-fullscreen {
  min-height: 100%;
}

.ui-loading-state__content {
  transition:
    opacity var(--motion-duration-base) var(--motion-ease-standard),
    filter var(--motion-duration-base) var(--motion-ease-standard);
}

.ui-loading-state__content.is-dimmed {
  opacity: 0.68;
  filter: saturate(0.92);
}

.ui-loading-state__overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  pointer-events: auto;
}

.ui-loading-state__backdrop {
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.ui-loading-state--soft .ui-loading-state__backdrop {
  background:
    linear-gradient(180deg, rgba(255, 251, 253, 0.86), rgba(255, 247, 250, 0.82)),
    radial-gradient(circle at top right, rgba(255, 214, 230, 0.22), transparent 38%);
  backdrop-filter: blur(4px);
}

.ui-loading-state--glass .ui-loading-state__backdrop {
  background: rgba(255, 255, 255, 0.52);
  backdrop-filter: blur(8px);
}

.ui-loading-state--plain .ui-loading-state__backdrop {
  background: rgba(255, 255, 255, 0.78);
}

.ui-loading-state__indicator {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(238, 221, 228, 0.92);
  box-shadow:
    0 16px 30px rgba(196, 167, 180, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.88);
}

.ui-loading-state__spinner {
  font-size: 24px;
  color: var(--primary);
}

.ui-loading-state__message {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  text-align: center;
}
</style>
