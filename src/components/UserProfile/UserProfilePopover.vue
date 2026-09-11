<template>
  <Teleport to="body">
    <Transition name="user-profile-popover">
      <div v-if="modelValue" class="user-profile-popover" @click.self="close">
        <div ref="panelRef" class="user-profile-popover__panel" role="dialog" aria-label="成员卡片" aria-modal="true" tabindex="-1">
          <button type="button" class="user-profile-popover__close" aria-label="关闭" @click="close">×</button>
          <UserProfileCard
            v-if="user"
            :user="user"
            :owner-id="ownerId"
            compact
          />
          <div v-else class="user-profile-popover__empty">没有找到这个用户的信息。</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { SiteMember } from '@/api/home';
import { ref } from 'vue';
import UserProfileCard from './UserProfileCard.vue';
import { useDialogFocus } from '@/components/ui/dialog/useDialogFocus';

const props = defineProps<{
  modelValue: boolean;
  user: SiteMember | null;
  ownerId?: number | string | null;
}>();
const panelRef = ref<HTMLElement | null>(null);
useDialogFocus(() => props.modelValue, panelRef, close, () => true);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

function close() {
  emit('update:modelValue', false);
}
</script>

<style scoped lang="scss">
.user-profile-popover {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(56, 45, 56, 0.22);
  backdrop-filter: blur(8px);
}

.user-profile-popover__panel {
  position: relative;
  width: min(100%, 420px);
}

.user-profile-popover__close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.78);
  color: #8a6578;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.user-profile-popover__empty {
  padding: 28px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  color: #7a6272;
  text-align: center;
}

.user-profile-popover-enter-active,
.user-profile-popover-leave-active {
  transition: opacity 0.2s ease;

  .user-profile-popover__panel {
    transition: transform 0.2s ease;
  }
}

.user-profile-popover-enter-from,
.user-profile-popover-leave-to {
  opacity: 0;

  .user-profile-popover__panel {
    transform: translateY(10px) scale(0.98);
  }
}
</style>

<style scoped lang="scss">
@media (max-width: 767px) {
  .user-profile-popover { padding: 0; align-items: end; }
  .user-profile-popover__panel { width: 100%; max-height: 92dvh; overflow-y: auto; padding-bottom: env(safe-area-inset-bottom); border-radius: var(--mobile-sheet-radius) var(--mobile-sheet-radius) 0 0; background: var(--color-surface); }
  .user-profile-popover__close { width: 44px; height: 44px; background: var(--color-surface); color: var(--color-text-primary); }
}
</style>
