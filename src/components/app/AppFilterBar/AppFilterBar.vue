<template>
  <div class="app-filter-bar">
    <div v-if="$slots.search" class="app-filter-bar__search">
      <slot name="search" />
    </div>
    <div v-if="$slots.filters" class="app-filter-bar__filters">
      <slot name="filters" />
    </div>
    <div v-if="$slots.actions" class="app-filter-bar__actions">
      <slot name="actions" />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * AppFilterBar —— 列表/产品页统一的搜索 + 筛选 + 操作条。
 * 通过 search / filters / actions 三个具名插槽组织布局，移动端自动堆叠。
 */
</script>

<style scoped lang="scss">
.app-filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
  padding: var(--space-sm) 0;
}

.app-filter-bar__search {
  flex: 1 1 240px;
  min-width: 0;
  max-width: 420px;
}

.app-filter-bar__filters {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.app-filter-bar__actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-left: auto;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .app-filter-bar__search {
    flex-basis: 100%;
    max-width: none;
  }
  .app-filter-bar__actions {
    margin-left: 0;
  }
}
</style>
