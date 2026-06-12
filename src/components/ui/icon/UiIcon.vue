<template>
  <span
    class="ui-icon"
    :class="{ 'ui-icon--spin': spin }"
    :style="iconStyle"
    role="img"
    :aria-label="ariaLabel"
    :aria-hidden="ariaLabel ? undefined : 'true'"
  >
    <Icon :icon="resolved" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { resolveIcon } from '@/design/icon-map'

/**
 * UiIcon —— 统一图标入口。
 *
 * name 可以是：
 *  - 语义名（icon-map 中的 key，推荐）：如 "edit" / "delete" / "search"
 *  - Element Plus 旧组件名：如 "Plus" / "Setting"（迁移期自动映射）
 *  - 直接的 Iconify 名：如 "mdi:music-note"（业务特殊图标兜底）
 */
const props = withDefaults(
  defineProps<{
    name: string
    /** 尺寸，数字按 px，字符串原样（如 '1.2em'） */
    size?: number | string
    /** 颜色，默认 currentColor */
    color?: string
    /** 是否旋转（loading 场景） */
    spin?: boolean
    /** 无障碍标签；不传则视为装饰性图标 */
    label?: string
  }>(),
  {
    size: undefined,
    color: undefined,
    spin: false,
    label: undefined,
  },
)

const resolved = computed(() => resolveIcon(props.name))
const ariaLabel = computed(() => props.label)

const iconStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.size != null) {
    style.fontSize = typeof props.size === 'number' ? `${props.size}px` : props.size
  }
  if (props.color) {
    style.color = props.color
  }
  return style
})
</script>

<style scoped lang="scss">
.ui-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  vertical-align: -0.125em;

  :deep(svg) {
    width: 1em;
    height: 1em;
  }
}

.ui-icon--spin :deep(svg) {
  animation: ui-icon-spin 0.9s linear infinite;
}

@keyframes ui-icon-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-icon--spin :deep(svg) {
    animation-duration: 1.6s;
  }
}
</style>
