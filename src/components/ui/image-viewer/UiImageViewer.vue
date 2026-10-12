<template>
  <Teleport to="body">
    <div v-if="modelValue && urls.length" class="ui-image-viewer" :class="{ 'ui-image-viewer--minimal': minimal, 'ui-image-viewer--spacious': spacious }">
      <ElImageViewer
        :url-list="urls"
        :initial-index="boundedInitialIndex"
        :hide-on-click-modal="hideOnClickModal"
        @close="close"
        @switch="(index: number) => emit('switch', index)"
      >
        <template v-if="minimal" #toolbar="{ prev, next }">
          <button v-if="urls.length > 1" type="button" class="ui-image-viewer__arrow is-previous" aria-label="上一张照片" @click.stop="prev">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path class="ui-image-viewer__arrow-outline" d="m15 5-7 7 7 7" /><path d="m15 5-7 7 7 7" /></svg>
          </button>
          <button v-if="urls.length > 1" type="button" class="ui-image-viewer__arrow is-next" aria-label="下一张照片" @click.stop="next">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path class="ui-image-viewer__arrow-outline" d="m9 5 7 7-7 7" /><path d="m9 5 7 7-7 7" /></svg>
          </button>
        </template>
      </ElImageViewer>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElImageViewer } from 'element-plus'

/**
 * UiImageViewer —— 全屏图片大图查看器。
 *
 * 内部封装 Element Plus ImageViewer（缩放/旋转/键盘与滚轮切换开箱可用），
 * 业务层统一使用本组件，不要直接引入 el-image-viewer。
 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** 图片地址列表 */
    urls: string[]
    /** 初始展示的图片下标（越界时自动收敛到有效范围） */
    initialIndex?: number
    /** 点击遮罩关闭 */
    hideOnClickModal?: boolean
    /** 简洁预览：边缘箭头，点击图片外空白或按 Escape 关闭。 */
    minimal?: boolean
    /** 桌面预览保留四周留白，仍可手动缩放或查看原尺寸。 */
    spacious?: boolean
  }>(),
  {
    initialIndex: 0,
    hideOnClickModal: true,
    minimal: false,
    spacious: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'close'): void
  (e: 'switch', index: number): void
}>()

const boundedInitialIndex = computed(() => (
  Math.min(Math.max(props.initialIndex, 0), Math.max(props.urls.length - 1, 0))
))

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped>
.ui-image-viewer--minimal :deep(.el-image-viewer__close),
.ui-image-viewer--minimal :deep(.el-image-viewer__prev),
.ui-image-viewer--minimal :deep(.el-image-viewer__next) { display: none; }
/* 画布不拦截空白区域，让点击到达遮罩；图片本身保留拖动和缩放。 */
.ui-image-viewer--minimal :deep(.el-image-viewer__canvas) { pointer-events: none; }
.ui-image-viewer--minimal :deep(.el-image-viewer__img) { pointer-events: auto; }
.ui-image-viewer--minimal :deep(.el-image-viewer__actions) {
  position: static; transform: none; padding: 0; height: 0;
  background: transparent; border: 0; border-radius: 0; opacity: 1;
}
.ui-image-viewer__arrow {
  position: fixed; top: 50%; transform: translateY(-50%); z-index: 2;
  display: grid; place-items: center; width: 44px; height: 44px;
  padding: 8px; border: 0; border-radius: 0; background: transparent;
  color: #34303a; box-shadow: none; cursor: pointer;
}
.ui-image-viewer__arrow.is-previous { left: max(2px, env(safe-area-inset-left)); }
.ui-image-viewer__arrow.is-next { right: max(2px, env(safe-area-inset-right)); }
.ui-image-viewer__arrow svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.ui-image-viewer__arrow-outline { stroke: rgb(255 255 255 / 75%); stroke-width: 4.5; }
.ui-image-viewer__arrow:focus-visible { outline: 2px solid var(--color-accent-readable); outline-offset: -2px; }
@media (min-width: 768px) {
  .ui-image-viewer--spacious :deep(.el-image-viewer__canvas) {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(82vw, 1200px);
    height: min(76dvh, 900px);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .ui-image-viewer--spacious :deep(.el-image-viewer__img) { pointer-events: auto; }
}
</style>
