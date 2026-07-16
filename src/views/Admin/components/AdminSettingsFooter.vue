<template>
  <footer class="admin-settings-footer" aria-label="配置操作">
    <div v-if="$slots.start" class="admin-settings-footer__start">
      <slot name="start" />
    </div>
    <div class="admin-settings-footer__actions">
      <slot />
    </div>
  </footer>
</template>

<style scoped lang="scss">
.admin-settings-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  min-height: 56px;
  margin-top: 2px;
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border-light);
}

.admin-settings-footer__start,
.admin-settings-footer__actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.admin-settings-footer__actions {
  justify-content: flex-end;
  margin-left: auto;
}

@media (max-width: 760px) {
  .admin-settings-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-settings-footer__actions {
    width: 100%;
  }

  .admin-settings-footer__actions :deep(.ui-button) {
    flex: 1 1 auto;
  }
}
</style>
