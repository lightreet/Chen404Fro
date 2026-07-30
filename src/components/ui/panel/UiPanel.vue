<template>
  <section class="ui-panel" :class="[`ui-panel--${variant}`, { 'is-hoverable': hoverable }]">
    <header v-if="hasHeader" class="ui-panel__header">
      <div class="ui-panel__heading">
        <span v-if="icon" class="ui-panel__icon">
          <UiIcon :name="icon" />
        </span>
        <div class="ui-panel__titles">
          <h3 v-if="title || $slots.title" class="ui-panel__title">
            <slot name="title">{{ title }}</slot>
          </h3>
          <p v-if="subtitle || $slots.subtitle" class="ui-panel__subtitle">
            <slot name="subtitle">{{ subtitle }}</slot>
          </p>
        </div>
      </div>
      <div v-if="$slots.actions" class="ui-panel__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="ui-panel__body" :class="{ 'is-flush': flush }">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="ui-panel__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import UiIcon from '../icon/UiIcon.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    icon?: string
    /** plain：纯白面板；muted：弱化底色；outline：仅描边 */
    variant?: 'plain' | 'muted' | 'outline'
    /** body 去内边距，用于表格等贴边内容 */
    flush?: boolean
    hoverable?: boolean
  }>(),
  {
    title: undefined,
    subtitle: undefined,
    icon: undefined,
    variant: 'plain',
    flush: false,
    hoverable: false,
  },
)

const slots = useSlots()
const hasHeader = computed(
  () => Boolean(props.title || props.subtitle || props.icon || slots.title || slots.subtitle || slots.actions),
)
</script>

<style scoped lang="scss">
.ui-panel {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition:
    box-shadow var(--motion-duration-base) var(--motion-ease-standard),
    transform var(--motion-duration-base) var(--motion-ease-standard);
}

.ui-panel--muted {
  background: var(--color-surface-muted);
  box-shadow: none;
}
.ui-panel--outline {
  background: transparent;
  box-shadow: none;
  border-color: var(--color-border);
}

.ui-panel.is-hoverable:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.ui-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border-light);
  flex-wrap: wrap;
}

.ui-panel__heading {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ui-panel__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: var(--color-accent-soft);
  color: var(--primary);
  font-size: 18px;
  flex-shrink: 0;
}

.ui-panel__titles {
  min-width: 0;
}

.ui-panel__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.ui-panel__subtitle {
  margin: 2px 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.ui-panel__actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.ui-panel__body {
  padding: var(--space-lg);
  flex: 1;
  min-width: 0;

  &.is-flush {
    padding: 0;
  }
}

.ui-panel__footer {
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--color-border-light);
}
</style>
