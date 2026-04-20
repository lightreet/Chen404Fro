<template>
  <div
    class="home-discovery-search"
    :class="{ 'is-open': showPanel }"
    @mouseenter="hoverOpen = true"
    @mouseleave="hoverOpen = false"
  >
    <div class="home-discovery-search__row">
      <div class="home-discovery-search__grow" :class="{ 'is-open': showPanel }">
        <input
          ref="inputRef"
          v-model="draft"
          type="search"
          class="home-discovery-search__input"
          :placeholder="placeholder"
          autocomplete="off"
          enterkeyhint="search"
          aria-label="搜索文章标题"
          :tabindex="showPanel ? 0 : -1"
          @keydown.enter.prevent="submit"
        />
      </div>
      <button
        type="button"
        class="home-discovery-search__btn"
        :aria-expanded="showPanel"
        aria-label="展开或收起搜索"
        @click="onToggle"
      >
        <el-icon><Search /></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Search } from '@element-plus/icons-vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    expanded: boolean;
    placeholder?: string;
  }>(),
  {
    placeholder: '搜索文章标题…',
  }
);

const emit = defineEmits<{
  'update:modelValue': [v: string];
  'update:expanded': [v: boolean];
  search: [keyword: string];
}>();

const draft = ref(props.modelValue);
const inputRef = ref<HTMLInputElement | null>(null);
/** 悬停在整个搜索区域（含展开后的输入框）时保持展开 */
const hoverOpen = ref(false);
const showPanel = computed(() => props.expanded || hoverOpen.value);

watch(
  () => props.modelValue,
  (v) => {
    if (v !== draft.value) draft.value = v;
  }
);

watch(draft, (v) => emit('update:modelValue', v));

function onToggle() {
  const next = !props.expanded;
  emit('update:expanded', next);
  if (next) {
    requestAnimationFrame(() => {
      inputRef.value?.focus();
    });
  } else {
    inputRef.value?.blur();
  }
}

function submit() {
  emit('search', draft.value.trim());
}
</script>

<style scoped lang="scss">
.home-discovery-search {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0;
  border-radius: 999px;
  background: transparent;
  box-shadow: none;
}

.home-discovery-search__row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

/* 输入区从图标左侧向右展开（宽度增加方向朝右） */
.home-discovery-search__grow {
  max-width: 0;
  overflow: hidden;
  transition: max-width 0.28s ease;

  &.is-open {
    max-width: min(320px, calc(100vw - 120px));
  }
}

.home-discovery-search__input {
  width: min(320px, calc(100vw - 120px));
  min-width: 200px;
  height: 44px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: #f7f8fb;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: #a7afbb;
  }

  &:focus {
    border-color: rgba(251, 114, 153, 0.2);
    box-shadow: 0 0 0 2px rgba(251, 114, 153, 0.08);
  }
}

/* 仅放大镜图标，无圆形描边/底 */
.home-discovery-search__btn {
  width: 44px;
  height: 44px;
  padding: 0;
  margin: 0;
  border: 1px solid rgba(251, 114, 153, 0.18);
  border-radius: 999px;
  background: transparent;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: none;
  transition: color 0.2s, background 0.2s, border-color 0.2s, transform 0.2s;
  -webkit-tap-highlight-color: transparent;

  :deep(.el-icon) {
    margin: 0;
    font-size: 23px;
  }

  &:hover {
    color: var(--primary);
    border-color: rgba(251, 114, 153, 0.28);
    background: transparent;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--primary) 55%, transparent);
    outline-offset: 2px;
  }
}

[data-theme='dark'] .home-discovery-search__input {
  background: rgba(30, 41, 59, 0.82);
  color: #e5e7eb;
}

[data-theme='dark'] .home-discovery-search {
  background: transparent;
}

[data-theme='dark'] .home-discovery-search__btn {
  &:hover {
    background: transparent;
  }
}
</style>
