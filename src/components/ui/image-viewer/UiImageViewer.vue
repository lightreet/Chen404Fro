<template>
  <ElImageViewer
    v-if="modelValue && urls.length"
    :url-list="urls"
    :initial-index="boundedInitialIndex"
    :hide-on-click-modal="hideOnClickModal"
    teleported
    @close="close"
    @switch="(index: number) => emit('switch', index)"
  />
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
  }>(),
  {
    initialIndex: 0,
    hideOnClickModal: true,
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
