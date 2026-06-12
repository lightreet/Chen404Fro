<template>
  <UiBadge :tone="tone" :size="size" dot>
    <slot>{{ label }}</slot>
  </UiBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UiBadge from '@/components/ui/badge/UiBadge.vue'
import type { AccentTone } from '@/design/tokens'

/**
 * AppStatusPill —— 业务状态件。
 * 在 UiBadge 之上做了一层「状态语义 -> tone」的映射，
 * 让业务直接传 status 字符串，而不必关心颜色。
 */
const props = withDefaults(
  defineProps<{
    /** 业务状态：enabled/disabled/pending/approved/rejected/... */
    status?: string
    /** 直接指定 tone 时优先于 status 推断 */
    tone?: AccentTone
    label?: string
    size?: 'sm' | 'md'
  }>(),
  {
    status: undefined,
    tone: undefined,
    label: undefined,
    size: 'md',
  },
)

const statusToneMap: Record<string, AccentTone> = {
  enabled: 'success',
  active: 'success',
  online: 'success',
  approved: 'success',
  published: 'success',
  success: 'success',
  pending: 'warning',
  processing: 'warning',
  draft: 'warning',
  warning: 'warning',
  disabled: 'neutral',
  inactive: 'neutral',
  offline: 'neutral',
  closed: 'neutral',
  rejected: 'danger',
  failed: 'danger',
  error: 'danger',
  danger: 'danger',
  info: 'info',
}

const tone = computed<AccentTone>(() => {
  if (props.tone) return props.tone
  if (props.status && statusToneMap[props.status.toLowerCase()]) {
    return statusToneMap[props.status.toLowerCase()]
  }
  return 'neutral'
})
</script>
