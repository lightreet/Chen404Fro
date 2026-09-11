<template>
  <el-drawer
    v-model="proxyValue"
    class="ui-drawer"
    v-bind="$attrs"
    @close="emit('close')"
    @closed="emit('closed')"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElDrawer } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'close'): void
  (e: 'closed'): void
}>()

const proxyValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})
</script>
<style lang="scss">
@media (max-width: 767px) {
  .ui-drawer.el-drawer.btt { border-radius: var(--mobile-sheet-radius) var(--mobile-sheet-radius) 0 0; max-height: 92dvh; }
  .ui-drawer .el-drawer__header { color: var(--color-text-primary); font-size: 18px; font-weight: 600; padding: 16px 20px 0; margin-bottom: 16px; }
  .ui-drawer .el-drawer__body { padding: 0 20px calc(20px + env(safe-area-inset-bottom)); }
  .ui-drawer .el-drawer__close-btn { min-width: 44px; min-height: 44px; }
}
</style>
