<template>
  <UiTooltip
    :content="content"
    :placement="placement"
    :show-after="showAfter"
  >
    <button
      type="button"
      class="ui-hint-tooltip"
      :aria-label="ariaLabel"
    >
      <UiIcon name="info" />
    </button>
  </UiTooltip>
</template>

<script setup lang="ts">
import UiIcon from '../icon/UiIcon.vue'
import UiTooltip from '../tooltip/UiTooltip.vue'

withDefaults(
  defineProps<{
    content: string
    ariaLabel?: string
    placement?:
      | 'top'
      | 'top-start'
      | 'top-end'
      | 'bottom'
      | 'bottom-start'
      | 'bottom-end'
      | 'left'
      | 'right'
    showAfter?: number
  }>(),
  {
    ariaLabel: '查看说明',
    placement: 'top',
    showAfter: 120,
  },
)
</script>

<style scoped lang="scss">
.ui-hint-tooltip {
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-pill);
  color: var(--color-text-tertiary);
  background: transparent;
  font: inherit;
  font-size: 15px;
  line-height: 1;
  cursor: help;
  transition:
    color var(--motion-duration-fast) var(--motion-ease-standard),
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    box-shadow var(--motion-duration-fast) var(--motion-ease-standard);
}

.ui-hint-tooltip:hover,
.ui-hint-tooltip:focus-visible {
  color: var(--color-accent-strong);
  background: var(--color-accent-soft);
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 16%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .ui-hint-tooltip {
    transition: none;
  }
}
</style>
