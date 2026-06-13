<template>
  <section class="app-section">
    <header v-if="title || $slots.title || $slots.actions || description" class="app-section__head">
      <div class="app-section__heading">
        <span v-if="icon" class="app-section__icon">
          <UiIcon :name="icon" />
        </span>
        <div class="app-section__titles">
          <component :is="headingTag" class="app-section__title">
            <slot name="title">{{ title }}</slot>
          </component>
          <p v-if="description || $slots.description" class="app-section__desc">
            <slot name="description">{{ description }}</slot>
          </p>
        </div>
      </div>
      <div v-if="$slots.actions" class="app-section__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="app-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import UiIcon from '@/components/ui/icon/UiIcon.vue'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
    headingTag?: 'h2' | 'h3' | 'h4'
  }>(),
  {
    title: undefined,
    description: undefined,
    icon: undefined,
    headingTag: 'h2',
  },
)
</script>

<style scoped lang="scss">
.app-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.app-section__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.app-section__heading {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.app-section__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 13px;
  background: var(--color-accent-soft);
  color: var(--primary);
  font-size: 20px;
  flex-shrink: 0;
}

.app-section__title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.app-section__desc {
  margin: 4px 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.app-section__actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}
</style>
