<template>
  <div class="ui-skeleton" :class="[`ui-skeleton--${size}`, { 'ui-skeleton--animated': animated }]">
    <div
      v-for="index in rows"
      :key="index"
      class="ui-skeleton__line"
      :class="{
        'is-title': index === 1 && highlightFirst,
        'is-last': index === rows,
      }"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
    animated?: boolean
    size?: 'sm' | 'md' | 'lg'
    highlightFirst?: boolean
  }>(),
  {
    rows: 3,
    animated: true,
    size: 'md',
    highlightFirst: true,
  },
)
</script>

<style scoped lang="scss">
.ui-skeleton {
  display: grid;
  gap: 12px;
}

.ui-skeleton__line {
  position: relative;
  overflow: hidden;
  width: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(233, 226, 232, 0.92), rgba(247, 242, 246, 0.98), rgba(233, 226, 232, 0.92));
}

.ui-skeleton--sm .ui-skeleton__line {
  height: 11px;
}

.ui-skeleton--md .ui-skeleton__line {
  height: 13px;
}

.ui-skeleton--lg .ui-skeleton__line {
  height: 15px;
}

.ui-skeleton__line.is-title {
  width: 62%;
  height: 20px;
  border-radius: 12px;
}

.ui-skeleton--sm .ui-skeleton__line.is-title {
  height: 16px;
}

.ui-skeleton--lg .ui-skeleton__line.is-title {
  height: 24px;
}

.ui-skeleton__line.is-last {
  width: 78%;
}

.ui-skeleton--animated .ui-skeleton__line::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
  animation: skeleton-shimmer 1.45s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  to {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-skeleton--animated .ui-skeleton__line::after {
    animation: none;
  }
}
</style>
