<template>
  <Teleport to="body">
    <Transition name="user-profile-popover">
      <div v-if="modelValue" class="user-profile-popover" @click.self="close">
        <div class="user-profile-popover__panel" role="dialog" aria-modal="true">
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
import UserProfileCard from './UserProfileCard.vue';

defineProps<{
  modelValue: boolean;
  user: SiteMember | null;
  ownerId?: number | string | null;
}>();

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
