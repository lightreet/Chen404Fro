<template>
  <header class="app-mobile-header" :class="{ 'app-mobile-header--brand': brand, 'app-mobile-header--primary': !back }">
    <RouterLink v-if="brand" to="/" class="app-mobile-header__brand" aria-label="返回首页">
      <img :src="siteConfig?.siteFavicon || '/favicon.png'" alt="" />
      <span>{{ siteName }}</span>
    </RouterLink>
    <template v-else>
      <button v-if="back" type="button" class="app-mobile-icon" aria-label="返回上一页" @click="goBack">
        <UiIcon name="back" :size="24" />
      </button>
      <span v-else class="app-mobile-header__spacer" />
      <span class="app-mobile-header__title">{{ title }}</span>
    </template>
    <div class="app-mobile-header__actions">
      <slot>
        <RouterLink v-if="brand" to="/search" class="app-mobile-icon" aria-label="搜索文章">
          <UiIcon name="search" :size="24" />
        </RouterLink>
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { UiIcon } from '@/components/ui';
import { useSiteConfig } from '@/composables/useSiteConfig';
import { resolveSiteName } from '@/utils/siteConfig';

const props = withDefaults(defineProps<{
  title?: string;
  brand?: boolean;
  back?: boolean;
  backTo?: string;
}>(), { title: '', brand: false, back: true, backTo: '/discover' });
const router = useRouter();
const { siteConfig } = useSiteConfig();
const siteName = computed(() => resolveSiteName(siteConfig.value));

function goBack() {
  if (typeof window.history.state?.back === 'string') router.back();
  else void router.replace(props.backTo);
}
</script>

<style scoped lang="scss">
.app-mobile-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  min-height: calc(var(--mobile-header-height) + env(safe-area-inset-top));
  padding: env(safe-area-inset-top) 12px 0;
  background: var(--color-canvas);
  color: var(--color-text-primary);
}
.app-mobile-header__brand { display: flex; align-items: center; gap: 10px; min-width: 0; color: inherit; font-size: 22px; font-weight: 700; }
.app-mobile-header__brand img { width: 34px; height: 34px; object-fit: contain; border-radius: 10px; }
.app-mobile-header__brand span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.app-mobile-header--brand { padding-inline: var(--mobile-gutter); }
.app-mobile-header__title { min-width: 0; flex: 1; text-align: center; font-size: 18px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.app-mobile-header__actions { min-width: 44px; flex-shrink: 0; margin-left: auto; display: flex; justify-content: flex-end; }
.app-mobile-header__spacer { width: 44px; }
.app-mobile-header--primary { padding-inline: var(--mobile-gutter); }
.app-mobile-header--primary .app-mobile-header__spacer { display: none; }
.app-mobile-header--primary .app-mobile-header__title { text-align: left; font-size: 24px; font-weight: 700; }
</style>
