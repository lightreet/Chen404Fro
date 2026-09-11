<template>
  <DefaultLayout mobile-title="发现">
    <div class="discover-page">
      <RouterLink :to="profileLink" class="discover-profile">
        <UiAvatar class="discover-profile__avatar" :src="userStore.user?.avatar" :size="56">{{ userStore.user?.nickname?.slice(0, 1) || '访' }}</UiAvatar>
        <span class="discover-profile__copy"><strong>{{ userStore.user?.nickname || userStore.user?.username || '欢迎来到 Chen404' }}</strong><small>{{ userStore.isLoggedIn ? '进入我的空间' : '登录，保存你的阅读与收藏' }}</small></span>
        <UiIcon name="arrow-right" :size="22" />
      </RouterLink>

      <section v-for="group in groups" :key="group.title" class="discover-group">
        <h2>{{ group.title }}</h2>
        <div class="discover-grid">
          <RouterLink v-for="item in group.items" :key="item.path" :to="item.path" class="discover-tile">
            <UiIcon :name="item.icon" :size="26" /><span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </section>

      <section v-if="userStore.isLoggedIn" class="discover-group">
        <h2>个人空间</h2>
        <div class="discover-links">
          <AppMenuLink to="/profile?tab=favorites" icon="star" label="我的收藏" />
          <AppMenuLink v-if="canCreate" to="/profile?tab=creations" icon="edit" label="我的创作" />
          <AppMenuLink to="/profile?tab=trust" icon="users" label="好友权限" />
        </div>
      </section>

      <section class="discover-group">
        <h2>偏好设置</h2>
        <div class="discover-links">
          <AppMenuLink to="/navigation" icon="grid" label="自定义底栏" />
          <AppMenuLink to="/appearance" icon="appearance" label="显示与主题" />
        </div>
      </section>
    </div>
    <NavigationSettings />
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import AppMenuLink from '@/components/app/AppMenuLink/AppMenuLink.vue';
import NavigationSettings from './NavigationSettings.vue';
import { UiAvatar, UiIcon } from '@/components/ui';
import { useUserStore } from '@/stores/user';
import { hasAnyCreatorCapability } from '@/utils/permission';
const userStore = useUserStore();
const profileLink = computed(() => userStore.isLoggedIn ? '/profile' : '/login?redirect=/profile');
const canCreate = computed(() => hasAnyCreatorCapability(userStore.user));
const groups = [
  { title: '阅读与生活', items: [
    { label: '文章分类', path: '/category', icon: 'grid' },
    { label: '标签', path: '/tag', icon: 'tag' },
    { label: '书架', path: '/bookshelf', icon: 'book' },
    { label: '音乐馆', path: '/music', icon: 'music' },
    { label: '旅行游记', path: '/memory-map', icon: 'map' },
    { label: '文章记录', path: '/archive', icon: 'archive' },
  ] },
  { title: '交流与了解', items: [
    { label: '与 Lyra 聊聊', path: '/lyra', icon: 'chat' },
    { label: '留言板', path: '/guestbook', icon: 'comment' },
    { label: '开发历程', path: '/development-history', icon: 'branch' },
    { label: '关于本站', path: '/about', icon: 'info' },
  ] },
];
</script>

<style scoped lang="scss">
.discover-page { max-width: 680px; margin: 0 auto; padding-top: 12px; }
.discover-profile { display: flex; align-items: center; gap: 12px; padding: 20px 16px; border-radius: var(--mobile-card-radius); background: var(--color-surface); color: var(--color-text-primary); }
.discover-profile__avatar { flex: none; aspect-ratio: 1; }
.discover-profile__copy { flex: 1; min-width: 0; }
.discover-profile strong { display: block; font-size: 18px; overflow-wrap: anywhere; }
.discover-profile small { display: block; margin-top: 4px; font-size: 13px; color: var(--color-text-secondary); }
.discover-group { margin-top: 28px; }
.discover-group h2 { font-size: 18px; margin-bottom: 12px; }
.discover-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.discover-tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 96px; border-radius: var(--mobile-card-radius); background: var(--color-surface); color: var(--color-text-primary); font-size: 13px; }
.discover-tile .ui-icon { color: var(--color-accent-readable); }
.discover-links { display: grid; gap: 8px; }
</style>
