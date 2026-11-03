<template>
  <div class="category-icon-picker">
    <div class="picker-selection">
      <span class="picker-preview">
        <CategoryIcon :icon="selectedValue" width="28" height="28" @load-state="onPreviewLoad" />
      </span>
      <span class="picker-selection__label" aria-live="polite">{{ selectedLabel }}</span>
      <UiButton size="sm" variant="text" @click="selectIcon(DEFAULT_CATEGORY_ICON)">恢复默认</UiButton>
    </div>
    <p v-if="previewFailed" class="picker-status" role="status">此图标暂时无法加载，请重新选择或检查图标代码。</p>

    <UiInput v-model="keyword" prefix-icon="search" clearable placeholder="搜索图标，如 音乐、旅行、code" aria-label="搜索分类图标" />

    <div class="picker-caption">
      <span>{{ keyword.trim() ? '匹配图标' : '常用图标' }}</span>
      <span>{{ localOptions.length }} 个</span>
    </div>
    <div v-if="localOptions.length" class="picker-grid" role="group" aria-label="常用分类图标">
      <button
        v-for="item in localOptions"
        :key="item.value"
        type="button"
        class="picker-option"
        :class="{ 'is-selected': selectedValue === item.value }"
        :aria-pressed="selectedValue === item.value"
        :title="item.label"
        @click="selectIcon(item.value)"
      >
        <CategoryIcon :icon="item.value" width="26" height="26" />
        <span>{{ item.label }}</span>
        <UiIcon v-if="selectedValue === item.value" name="check" class="picker-option__check" />
      </button>
    </div>
    <p v-else class="picker-status" role="status">没有匹配的常用图标，试试其他关键词或搜索更多图标。</p>

    <template v-if="keyword.trim()">
      <UiButton size="sm" variant="text" :loading="searchLoading" @click="searchMore">{{ searchError ? '重试搜索更多图标' : '搜索更多图标' }}</UiButton>
      <p v-if="searchError" class="picker-status" role="status">在线搜索暂不可用，常用图标仍可选择。</p>
      <p v-else-if="searched && !searchLoading && !remoteOptions.length" class="picker-status" role="status">没有更多结果，可以尝试英文关键词。</p>
      <div v-if="remoteOptions.length" class="picker-grid" role="group" aria-label="在线分类图标">
        <button
          v-for="item in remoteOptions"
          :key="item.value"
          type="button"
          class="picker-option"
          :class="{ 'is-selected': selectedValue === item.value }"
          :aria-pressed="selectedValue === item.value"
          :disabled="failedIcons.has(item.value)"
          :title="item.value"
          @click="selectIcon(item.value)"
        >
          <CategoryIcon :icon="item.value" width="26" height="26" @load-state="onCandidateLoad" />
          <span>{{ failedIcons.has(item.value) ? '加载失败' : item.name }}</span>
          <UiIcon v-if="selectedValue === item.value" name="check" class="picker-option__check" />
        </button>
      </div>
    </template>

    <details class="picker-custom">
      <summary>自定义图标</summary>
      <UiInput :model-value="modelValue || ''" clearable placeholder="输入 Iconify 代码，如 mdi:folder-open" aria-label="自定义图标代码" @update:model-value="emit('update:modelValue', String($event))" />
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { UiButton, UiIcon, UiInput } from '@/components/ui'
import CategoryIcon from './CategoryIcon.vue'
import { CATEGORY_ICON_OPTIONS, filterCategoryIcons } from '@/modules/category-icons/catalog'
import { searchCategoryIcons, type CategoryIconSearchResult } from '@/modules/category-icons/service'
import { DEFAULT_CATEGORY_ICON, getCategoryIconOrFallback } from '@/utils/categoryIcon'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()
const keyword = ref('')
const previewFailed = ref(false)
const remoteOptions = ref<CategoryIconSearchResult[]>([])
const failedIcons = ref(new Set<string>())
const searchLoading = ref(false)
const searchError = ref(false)
const searched = ref(false)
const selectedValue = computed(() => getCategoryIconOrFallback(props.modelValue))
const localOptions = computed(() => filterCategoryIcons(keyword.value))
const selectedLabel = computed(() => {
  const label = CATEGORY_ICON_OPTIONS.find((item) => item.value === selectedValue.value)?.label
  return selectedValue.value === DEFAULT_CATEGORY_ICON ? '默认 · 文件夹' : `已选 · ${label || '自定义图标'}`
})

function selectIcon(value: string) {
  emit('update:modelValue', value)
}

function onPreviewLoad(payload: { failed: boolean; requestedIcon: string }) {
  if (payload.requestedIcon === selectedValue.value) previewFailed.value = payload.failed
}

function onCandidateLoad(payload: { failed: boolean; requestedIcon: string }) {
  if (payload.failed) failedIcons.value.add(payload.requestedIcon)
}

let controller: AbortController | null = null
let searchTimeout: ReturnType<typeof setTimeout> | undefined
function cancelSearch() {
  controller?.abort()
  controller = null
  clearTimeout(searchTimeout)
}

async function searchMore() {
  cancelSearch()
  const query = keyword.value.trim()
  if (!query) return
  const request = new AbortController()
  controller = request
  searchLoading.value = true
  searchError.value = false
  searched.value = true
  remoteOptions.value = []
  failedIcons.value.clear()
  searchTimeout = setTimeout(() => request.abort(), 10000)
  try {
    const results = await searchCategoryIcons(query, request.signal)
    if (controller !== request) return
    remoteOptions.value = results.filter((item) => !CATEGORY_ICON_OPTIONS.some((local) => local.value === item.value))
  } catch {
    if (controller === request) searchError.value = true
  } finally {
    if (controller === request) {
      clearTimeout(searchTimeout)
      controller = null
      searchLoading.value = false
    }
  }
}

watch(keyword, () => {
  cancelSearch()
  remoteOptions.value = []
  searchLoading.value = false
  searchError.value = false
  searched.value = false
})
onUnmounted(cancelSearch)
</script>

<style scoped lang="scss">
.category-icon-picker {
  display: grid;
  gap: var(--space-sm);
  width: 100%;
  min-width: 0;
  line-height: 1.5;
}

.picker-selection {
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  &__label {
    flex: 1;
    min-width: 0;
    color: var(--color-text-primary);
    font-weight: 500;
  }
}

.picker-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--primary);
}

.picker-caption {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 6px;
  max-height: 224px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 3px;
}

.picker-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  min-height: 68px;
  padding: 8px 4px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  font: inherit;
  font-size: var(--font-size-xs);
  cursor: pointer;

  > span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover, &.is-selected {
    border-color: var(--primary);
    color: var(--color-text-primary);
    background: color-mix(in srgb, var(--primary) 10%, var(--color-surface));
  }

  &.is-selected > svg { color: var(--primary); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }

  .picker-option__check {
    position: absolute;
    top: 3px;
    right: 3px;
    color: var(--primary);
    font-size: 12px;
  }
}

.picker-status {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.picker-custom {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);

  summary {
    width: fit-content;
    padding: 6px 0;
    cursor: pointer;
    &:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  }

  &[open] summary { margin-bottom: 4px; }
}

@media (max-width: 767px) {
  .picker-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .picker-custom summary { min-height: 44px; display: list-item; align-content: center; }
}
</style>
