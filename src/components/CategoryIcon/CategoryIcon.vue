<template>
  <Icon
    :icon="displayIcon"
    :width="width"
    :height="height"
    :inline="inline"
    :class="iconClass"
    :aria-hidden="ariaHidden"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon, getIcon, loadIcon } from '@iconify/vue'
import { DEFAULT_CATEGORY_ICON, getCategoryIconOrFallback, normalizeCategoryIcon } from '@/utils/categoryIcon'

const props = withDefaults(defineProps<{
  icon?: string | null
  fallbackIcon?: string
  width?: string | number
  height?: string | number
  inline?: boolean
  iconClass?: string
  ariaHidden?: boolean | 'true' | 'false'
}>(), {
  icon: '',
  fallbackIcon: DEFAULT_CATEGORY_ICON,
  width: '1em',
  height: '1em',
  inline: false,
  iconClass: '',
  ariaHidden: true,
})

const emit = defineEmits<{
  (e: 'load-state', payload: { failed: boolean; requestedIcon: string; renderedIcon: string }): void
}>()

const displayIcon = ref(getCategoryIconOrFallback(props.icon, props.fallbackIcon))
const normalizedIcon = computed(() => normalizeCategoryIcon(props.icon))
const safeFallbackIcon = computed(() => normalizeCategoryIcon(props.fallbackIcon) || DEFAULT_CATEGORY_ICON)

let loadToken = 0

watch(
  [normalizedIcon, safeFallbackIcon],
  async ([requestedIcon, fallbackIcon]) => {
    const currentToken = ++loadToken
    const nextIcon = requestedIcon || fallbackIcon

    displayIcon.value = nextIcon

    if (!requestedIcon) {
      emit('load-state', {
        failed: false,
        requestedIcon,
        renderedIcon: fallbackIcon,
      })
      return
    }

    try {
      if (!getIcon(requestedIcon)) {
        await loadIcon(requestedIcon)
      }

      if (currentToken !== loadToken) return
      displayIcon.value = requestedIcon
      emit('load-state', {
        failed: false,
        requestedIcon,
        renderedIcon: requestedIcon,
      })
    } catch {
      if (currentToken !== loadToken) return
      displayIcon.value = fallbackIcon
      emit('load-state', {
        failed: true,
        requestedIcon,
        renderedIcon: fallbackIcon,
      })
    }
  },
  { immediate: true },
)
</script>
