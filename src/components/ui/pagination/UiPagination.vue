<template>
  <nav v-if="totalPages > 1 || showTotal" class="ui-pagination" aria-label="分页">
    <span v-if="showTotal" class="ui-pagination__total">共 {{ total }} 条</span>

    <div class="ui-pagination__pages">
      <button
        type="button"
        class="ui-pagination__btn"
        :disabled="current <= 1"
        aria-label="上一页"
        @click="go(current - 1)"
      >
        <UiIcon name="arrow-left" />
      </button>

      <button
        v-for="page in visiblePages"
        :key="page.key"
        type="button"
        class="ui-pagination__btn"
        :class="{ 'is-active': page.value === current, 'is-ellipsis': page.ellipsis }"
        :disabled="page.ellipsis"
        @click="!page.ellipsis && go(page.value)"
      >
        {{ page.ellipsis ? '…' : page.value }}
      </button>

      <button
        type="button"
        class="ui-pagination__btn"
        :disabled="current >= totalPages"
        aria-label="下一页"
        @click="go(current + 1)"
      >
        <UiIcon name="arrow-right" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UiIcon from '../icon/UiIcon.vue'

const props = withDefaults(
  defineProps<{
    /** 当前页（1 起） */
    current: number
    pageSize: number
    total: number
    showTotal?: boolean
  }>(),
  {
    showTotal: true,
  },
)

const emit = defineEmits<{ (e: 'update:current', v: number): void; (e: 'change', v: number): void }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

interface PageCell {
  key: string
  value: number
  ellipsis?: boolean
}

const visiblePages = computed<PageCell[]>(() => {
  const pages: PageCell[] = []
  const last = totalPages.value
  const cur = props.current
  const push = (v: number) => pages.push({ key: `p${v}`, value: v })
  const pushGap = (id: string) => pages.push({ key: id, value: -1, ellipsis: true })

  if (last <= 7) {
    for (let i = 1; i <= last; i++) push(i)
    return pages
  }

  push(1)
  if (cur > 4) pushGap('gap-start')
  const start = Math.max(2, cur - 1)
  const end = Math.min(last - 1, cur + 1)
  for (let i = start; i <= end; i++) push(i)
  if (cur < last - 3) pushGap('gap-end')
  push(last)
  return pages
})

const go = (page: number) => {
  const target = Math.min(Math.max(1, page), totalPages.value)
  if (target === props.current) return
  emit('update:current', target)
  emit('change', target)
}
</script>

<style scoped lang="scss">
.ui-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.ui-pagination__total {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.ui-pagination__pages {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.ui-pagination__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  font: inherit;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    color var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);

  &:hover:not(:disabled):not(.is-active) {
    color: var(--primary);
    background: var(--color-accent-soft);
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  &.is-ellipsis {
    background: transparent;
    cursor: default;
    opacity: 1;
  }
  &.is-active {
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    color: #fff;
    cursor: default;
  }
}
</style>
