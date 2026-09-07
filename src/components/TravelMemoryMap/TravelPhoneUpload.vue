<template>
  <div class="travel-phone-upload">
    <UiButton
      ref="trigger"
      variant="secondary"
      icon="phone"
      :loading="transfer.busy"
      :disabled="disabled"
      @click="open"
    >
      {{ selected && transfer.active ? '手机上传中' : '手机上传' }}
    </UiButton>
    <UiDialog
      :model-value="visible"
      title="手机扫码上传"
      width="360px"
      panel-class="travel-phone-dialog"
      @update:model-value="close"
    >
      <div class="phone-qr-content">
        <strong class="phone-qr-target">{{ label }}</strong>
        <div class="phone-qr-image">
          <UiLoadingState :loading="transfer.busy" message="正在生成二维码…">
            <img
              v-if="selected && transfer.qr && transfer.active"
              :src="transfer.qr"
              alt="手机扫码上传照片的二维码"
              width="240"
              height="240"
            />
            <div v-else class="phone-qr-placeholder">
              <UiIcon :name="transfer.error ? 'warning' : 'clock'" />
            </div>
          </UiLoadingState>
        </div>
        <p v-if="transfer.error" class="phone-qr-error" role="alert">{{ transfer.error }}</p>
        <p v-else-if="!transfer.busy" class="phone-qr-status" role="status">{{ statusText }}</p>
        <UiButton v-if="!transfer.busy && (!selected || !transfer.active || !transfer.qr)" @click="create"
          >重新生成二维码</UiButton
        >
      </div>
      <template v-if="selected && transfer.active && !transfer.busy" #footer>
        <UiButton variant="text" @click="end">结束上传</UiButton>
        <UiButton @click="close">继续编辑</UiButton>
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { UiButton, UiDialog, UiIcon, UiLoadingState } from '@/components/ui'
import type { useTravelMobileUpload } from '@/composables/useTravelMobileUpload'
const props = defineProps<{
  transfer: ReturnType<typeof useTravelMobileUpload>
  targetKey: string
  kind: 'cover' | 'stop'
  label: string
  travelTitle: string
  disabled?: boolean
}>()
const trigger = ref<InstanceType<typeof UiButton>>()
const opened = ref(false)
const selected = computed(() => props.transfer.target?.key === props.targetKey)
const visible = computed(() => opened.value && (!selected.value || props.transfer.expanded))
const statusText = computed(() => {
  const session = props.transfer.session
  if (!selected.value) return '二维码暂不可用'
  if (!props.transfer.active) return session?.status === 'closed' ? '上传已结束' : '二维码已过期'
  if (session?.uploadingCount) return `正在接收 ${session.uploadingCount} 张照片…`
  if (session?.batchActive) return '手机正在上传这批照片…'
  const count = session?.receipts.filter((item) => item.status === 'done').length || 0
  if (count) return `已接收 ${count} 张照片`
  return session?.connected ? '手机已连接' : '等待手机扫码'
})
function open() {
  if (selected.value) props.transfer.expanded = true
  opened.value = true
  if (selected.value && props.transfer.active && props.transfer.qr) return
  void create()
}
function close() {
  opened.value = false
  if (selected.value) props.transfer.expanded = false
}
async function create() {
  props.transfer.expanded = true
  await props.transfer.start({
    key: props.targetKey,
    kind: props.kind,
    label: props.label,
    travelTitle: props.travelTitle,
  })
}
async function end() {
  try {
    await props.transfer.finish(false)
    close()
  } catch {
    /* 弹窗内保留可重试错误。 */
  }
}
function keyboard(event: KeyboardEvent) {
  if (!visible.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab') return
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.travel-phone-dialog button:not(:disabled)'),
  )
  const first = buttons[0],
    last = buttons[buttons.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
watch(visible, async (value) => {
  document.removeEventListener('keydown', keyboard)
  if (value) {
    document.addEventListener('keydown', keyboard)
    await nextTick()
    document.querySelector<HTMLButtonElement>('.travel-phone-dialog .ui-dialog__close')?.focus()
  } else {
    opened.value = false
    await nextTick()
    ;(trigger.value?.$el as HTMLButtonElement | undefined)?.focus()
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', keyboard)
  if (visible.value) document.body.style.overflow = ''
})
</script>

<style scoped lang="scss">
.travel-phone-upload {
  margin-top: 14px;
}
.phone-qr-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  color: var(--color-text-primary);
}
.phone-qr-target {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  overflow-wrap: anywhere;
}
.phone-qr-image {
  width: min(240px, 100%);
  min-height: 240px;
}
.phone-qr-image img {
  width: 100%;
  height: auto;
  display: block;
}
.phone-qr-placeholder {
  height: 240px;
  display: grid;
  place-items: center;
  background: var(--color-surface-muted);
  border-radius: 8px;
  font-size: 28px;
}
.phone-qr-status,
.phone-qr-error {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}
.phone-qr-error {
  overflow-wrap: anywhere;
}
</style>
