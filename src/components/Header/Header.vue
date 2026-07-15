<template>
  <header class="header" :class="{ 'is-scrolled': isScrolled, 'is-hidden': isHidden }">
    <div class="container">
      <div class="header-content">
        <!-- Logo -->
        <router-link to="/" class="logo">
          <img :src="siteLogo" :alt="siteName" class="logo-img" />
        </router-link>

        <div class="desktop-toolbar" v-if="!isMobile">
          <!-- 导航菜单 -->
          <nav class="nav-menu">
            <template
              v-for="item in navItems"
              :key="item.key"
            >
              <UiDropdown
                v-if="item.children?.length"
                trigger="click"
                placement="bottom-start"
                popper-class="timeline-nav-popper"
                class="nav-dropdown"
                @command="handleNavCommand"
              >
                <button
                  type="button"
                  class="nav-item nav-dropdown-trigger"
                  :class="{ 'is-active': isNavItemActive(item) }"
                  :aria-label="`${item.name}菜单`"
                >
                  <UiIcon class="nav-icon" :name="item.icon" />
                  <span>{{ item.name }}</span>
                  <UiIcon class="nav-chevron" name="arrow-down" />
                </button>
                <template #dropdown>
                  <UiDropdownMenu>
                    <UiDropdownItem
                      v-for="child in item.children"
                      :key="child.key"
                      :command="child.to"
                      :class="{ 'is-active': route.path === child.path }"
                    >
                      <UiIcon :name="child.icon" />
                      <span>{{ child.name }}</span>
                    </UiDropdownItem>
                  </UiDropdownMenu>
                </template>
              </UiDropdown>

              <router-link
                v-else
                :to="item.to"
                class="nav-item"
                :class="{ 'is-active': isNavItemActive(item) }"
              >
                <UiIcon class="nav-icon" :name="item.icon" />
                <span>{{ item.name }}</span>
              </router-link>
            </template>
          </nav>

          <!-- 右侧操作区 -->
          <div class="header-actions">
            <!-- 编写文章按钮（仅管理员显示） -->
            <router-link
              v-if="isLoggedIn && canCreateArticle"
              to="/article/edit"
              class="write-btn"
            >
              <UiButton size="sm" variant="ghost" icon="edit" class="write-link rounded-full">
                <span>编写</span>
              </UiButton>
            </router-link>

            <UiDropdown
              trigger="click"
              placement="bottom"
              :hide-on-click="false"
              popper-class="site-display-popper"
              @command="handleDisplayCommand"
            >
              <button
                type="button"
                class="action-btn site-display-trigger"
                :aria-label="displayTriggerLabel"
                :title="displayTriggerLabel"
              >
                <UiIcon name="appearance" />
                <span
                  class="site-display-trigger__petal"
                  :class="`is-${sakuraEffect}`"
                  aria-hidden="true"
                />
              </button>
              <template #dropdown>
                <UiDropdownMenu class="site-display-menu">
                  <div class="site-display-menu__title">
                    <UiIcon name="appearance" />
                    <span>站点展示</span>
                  </div>
                  <div class="site-display-menu__section-label">主题</div>
                  <UiDropdownItem
                    command="theme:light"
                    :class="{ 'is-selected': !isDark }"
                  >
                    <UiIcon name="sun" />
                    <span class="site-display-menu__option">浅色模式</span>
                    <UiIcon v-if="!isDark" class="site-display-menu__check" name="check" />
                  </UiDropdownItem>
                  <UiDropdownItem
                    command="theme:dark"
                    :class="{ 'is-selected': isDark }"
                  >
                    <UiIcon name="moon" />
                    <span class="site-display-menu__option">暗色模式</span>
                    <UiIcon v-if="isDark" class="site-display-menu__check" name="check" />
                  </UiDropdownItem>

                  <div class="site-display-menu__divider" />
                  <div class="site-display-menu__section-label">樱花效果</div>
                  <UiDropdownItem
                    v-for="option in sakuraEffectOptions"
                    :key="option.value"
                    :command="`sakura:${option.value}`"
                    :class="{ 'is-selected': sakuraEffect === option.value }"
                  >
                    <UiIcon :name="option.icon" />
                    <span class="site-display-menu__option">{{ option.label }}</span>
                    <UiIcon
                      v-if="sakuraEffect === option.value"
                      class="site-display-menu__check"
                      name="check"
                    />
                  </UiDropdownItem>
                </UiDropdownMenu>
              </template>
            </UiDropdown>

            <!-- 未登录显示登录按钮 -->
            <router-link v-if="!isLoggedIn" to="/login" class="login-link">
              <UiButton variant="primary" size="sm" icon="user" class="login-btn rounded-full">
                <span>登录</span>
              </UiButton>
            </router-link>

            <!-- 已登录显示用户菜单 -->
            <UiDropdown v-if="isLoggedIn" @command="handleUserCommand" class="user-menu">
              <div class="user-avatar-wrapper">
                <UiAvatar
                  :src="user?.avatar"
                  :size="32"
                  class="user-avatar"
                >
                  {{ user?.nickname?.charAt(0) || user?.username?.charAt(0) || 'U' }}
                </UiAvatar>
              </div>
              <template #dropdown>
                <UiDropdownMenu>
                  <div class="dropdown-user-info">
                    <span class="dropdown-nickname">{{ user?.nickname || user?.username }}</span>
                    <span class="dropdown-role">{{ roleText }}</span>
                  </div>
                  <UiDropdownItem divided command="profile">
                    <UiIcon name="User" />
                    个人中心
                  </UiDropdownItem>
                  <UiDropdownItem v-if="isAdmin" command="admin">
                    <UiIcon name="Setting" />
                    后台管理
                  </UiDropdownItem>
                  <UiDropdownItem divided command="logout">
                    <UiIcon name="SwitchButton" />
                    退出登录
                  </UiDropdownItem>
                </UiDropdownMenu>
              </template>
            </UiDropdown>
          </div>
        </div>

        <div class="header-actions mobile-actions" v-if="isMobile">
          <UiDropdown
            trigger="click"
            placement="bottom"
            :hide-on-click="false"
            popper-class="site-display-popper"
            @command="handleDisplayCommand"
          >
            <button
              type="button"
              class="action-btn site-display-trigger"
              :aria-label="displayTriggerLabel"
              :title="displayTriggerLabel"
            >
              <UiIcon name="appearance" />
              <span
                class="site-display-trigger__petal"
                :class="`is-${sakuraEffect}`"
                aria-hidden="true"
              />
            </button>
            <template #dropdown>
              <UiDropdownMenu class="site-display-menu">
                <div class="site-display-menu__title">
                  <UiIcon name="appearance" />
                  <span>站点展示</span>
                </div>
                <div class="site-display-menu__section-label">主题</div>
                <UiDropdownItem command="theme:light" :class="{ 'is-selected': !isDark }">
                  <UiIcon name="sun" />
                  <span class="site-display-menu__option">浅色模式</span>
                  <UiIcon v-if="!isDark" class="site-display-menu__check" name="check" />
                </UiDropdownItem>
                <UiDropdownItem command="theme:dark" :class="{ 'is-selected': isDark }">
                  <UiIcon name="moon" />
                  <span class="site-display-menu__option">暗色模式</span>
                  <UiIcon v-if="isDark" class="site-display-menu__check" name="check" />
                </UiDropdownItem>
                <div class="site-display-menu__divider" />
                <div class="site-display-menu__section-label">樱花效果</div>
                <UiDropdownItem
                  v-for="option in sakuraEffectOptions"
                  :key="option.value"
                  :command="`sakura:${option.value}`"
                  :class="{ 'is-selected': sakuraEffect === option.value }"
                >
                  <UiIcon :name="option.icon" />
                  <span class="site-display-menu__option">{{ option.label }}</span>
                  <UiIcon
                    v-if="sakuraEffect === option.value"
                    class="site-display-menu__check"
                    name="check"
                  />
                </UiDropdownItem>
              </UiDropdownMenu>
            </template>
          </UiDropdown>

          <button class="action-btn menu-btn" @click="toggleMobileMenu">
            <UiIcon name="Menu" />
          </button>
        </div>
      </div>
    </div>

    <!-- 移动端菜单 -->
    <div class="mobile-menu" v-show="isMobileMenuOpen" v-if="isMobile">
      <div class="mobile-menu-overlay" @click="closeMobileMenu"></div>
      <div class="mobile-menu-content">
        <template
          v-for="item in navItems"
          :key="item.key"
        >
          <div v-if="item.children?.length" class="mobile-nav-group">
            <button
              type="button"
              class="mobile-nav-item mobile-nav-group-trigger"
              :class="{ 'is-active': isNavItemActive(item) }"
              :aria-expanded="mobileTimelineOpen"
              @click="mobileTimelineOpen = !mobileTimelineOpen"
            >
              <UiIcon :name="item.icon" />
              <span>{{ item.name }}</span>
              <UiIcon
                name="arrow-down"
                class="mobile-nav-chevron"
                :class="{ 'is-open': mobileTimelineOpen }"
              />
            </button>
            <div v-show="mobileTimelineOpen" class="mobile-nav-children">
              <router-link
                v-for="child in item.children"
                :key="child.key"
                :to="child.to"
                class="mobile-nav-item mobile-nav-child"
                :class="{ 'is-active': route.path === child.path }"
                @click="closeMobileMenu"
              >
                <UiIcon :name="child.icon" />
                <span>{{ child.name }}</span>
              </router-link>
            </div>
          </div>

          <router-link
            v-else
            :to="item.to"
            class="mobile-nav-item"
            :class="{ 'is-active': isNavItemActive(item) }"
            @click="closeMobileMenu"
          >
            <UiIcon :name="item.icon" />
            <span>{{ item.name }}</span>
          </router-link>
        </template>

        <div class="mobile-menu-divider"></div>

        <!-- 已登录显示用户菜单 -->
        <template v-if="isLoggedIn">
          <div class="mobile-account-summary">
            <span class="mobile-account-summary__name">{{ user?.nickname || user?.username }}</span>
            <span class="mobile-account-summary__role">{{ roleText }}</span>
          </div>
          <router-link
            to="/profile"
            class="mobile-nav-item"
            @click="closeMobileMenu"
          >
            <UiIcon name="User" />
            <span>个人中心</span>
          </router-link>
          <router-link
            v-if="isAdmin"
            to="/admin?tab=categories"
            class="mobile-nav-item"
            @click="closeMobileMenu"
          >
            <UiIcon name="Setting" />
            <span>后台管理</span>
          </router-link>
          <router-link
            v-if="canCreateArticle"
            to="/article/edit"
            class="mobile-nav-item"
            @click="closeMobileMenu"
          >
            <UiIcon name="EditPen" />
            <span>编写文章</span>
          </router-link>
          <div class="mobile-menu-divider"></div>
          <div class="mobile-nav-item" @click="handleLogout">
            <UiIcon name="SwitchButton" />
            <span>退出登录</span>
          </div>
        </template>

        <!-- 未登录显示登录/注册 -->
        <template v-else>
          <router-link
            to="/login"
            class="mobile-nav-item"
            @click="closeMobileMenu"
          >
            <UiIcon name="User" />
            <span>登录</span>
          </router-link>

          <router-link
            to="/register"
            class="mobile-nav-item"
            @click="closeMobileMenu"
          >
            <UiIcon name="UserFilled" />
            <span>注册</span>
          </router-link>
        </template>
      </div>
    </div>

  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';
import { notify, confirmAction } from '@/lib/feedback';
import { UiAvatar, UiButton, UiDropdown, UiDropdownItem, UiDropdownMenu, UiIcon } from '@/components/ui'
import { useAppStore } from '@/stores/app';
import type { SakuraEffectPreference } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { logout as logoutApi } from '@/api/auth';
import { useSiteConfig } from '@/composables/useSiteConfig';
import { getTrustLevelLabel, isAdminUser } from '@/utils/permission';
import { resolveSiteLogo, resolveSiteName } from '@/utils/siteConfig';
import { useLayoutMobile } from '@/composables/useLayoutMobile';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const userStore = useUserStore();
userStore.initUser();
const { theme, sakuraEffect } = storeToRefs(appStore);
const { isLoggedIn, user } = storeToRefs(userStore);
const { siteConfig, loadSiteConfig } = useSiteConfig();
const siteName = computed(() => resolveSiteName(siteConfig.value));
const siteLogo = computed(() => resolveSiteLogo(siteConfig.value));

const isDark = computed(() => theme.value === 'dark');

const sakuraEffectOptions: ReadonlyArray<{
  value: SakuraEffectPreference;
  label: string;
  icon: string;
}> = [
  { value: 'full', label: '完整', icon: 'star-filled' },
  { value: 'light', label: '轻量', icon: 'star' },
  { value: 'off', label: '关闭', icon: 'close' },
];

const displayTriggerLabel = computed(() => {
  const themeLabel = isDark.value ? '暗色模式' : '浅色模式';
  const effectLabel = sakuraEffectOptions.find((option) => option.value === sakuraEffect.value)?.label;
  return `站点展示：${themeLabel}，樱花${effectLabel ?? '完整'}`;
});

const handleDisplayCommand = (command: string | number | object) => {
  if (typeof command !== 'string') return;

  switch (command) {
    case 'theme:light':
      appStore.setTheme('light');
      break;
    case 'theme:dark':
      appStore.setTheme('dark');
      break;
    case 'sakura:full':
      appStore.setSakuraEffect('full');
      break;
    case 'sakura:light':
      appStore.setSakuraEffect('light');
      break;
    case 'sakura:off':
      appStore.setSakuraEffect('off');
      break;
    default:
      break;
  }
};

// 角色文本
const roleText = computed(() => getTrustLevelLabel(user.value));

// 是否为管理员
const isAdmin = computed(() => isAdminUser(user.value));


// 是否可以创建文章（仅管理员）
const canCreateArticle = computed(() => {
  if (!user.value) return false;
  return isAdminUser(user.value);
});

interface NavItem {
  key: string;
  name: string;
  path: string;
  to: RouteLocationRaw;
  icon: string;
  children?: NavItem[];
  activeWhen?: (currentPath: string, currentTab?: string | null) => boolean;
}

// 导航项
const navItems = computed<NavItem[]>(() => [
  { key: 'home', name: '首页', path: '/', to: '/', icon: 'HomeFilled' },
  { key: 'category', name: '分类', path: '/category', to: '/category', icon: 'List' },
  {
    key: 'timeline',
    name: '时光轴',
    path: '/archive',
    to: '/archive',
    icon: 'Folder',
    children: [
      { key: 'archive', name: '文章记录', path: '/archive', to: '/archive', icon: 'article' },
      {
        key: 'development-history',
        name: '开发历程',
        path: '/development-history',
        to: '/development-history',
        icon: 'branch',
      },
    ],
  },
  { key: 'memory-map', name: '旅行地图', path: '/memory-map', to: '/memory-map', icon: 'Place' },
  { key: 'music', name: '音乐馆', path: '/music', to: '/music', icon: 'Headset' },
  {
    key: 'trust-request',
    name: '好友申请',
    path: '/trust-request',
    to: '/trust-request',
    icon: 'Postcard',
    activeWhen: (currentPath: string, currentTab?: string | null) =>
      currentPath === '/trust-request' || (currentPath === '/profile' && currentTab === 'trust'),
  },
  { key: 'guestbook', name: '留言板', path: '/guestbook', to: '/guestbook', icon: 'ChatDotRound' },
  { key: 'about', name: '关于', path: '/about', to: '/about', icon: 'InfoFilled' },
]);

const currentRouteTab = computed(() => {
  const value = route.query.tab;
  return typeof value === 'string' ? value : null;
});

function isNavItemActive(item: {
  path: string;
  children?: NavItem[];
  activeWhen?: (currentPath: string, currentTab?: string | null) => boolean;
}) {
  if (item.children?.some((child) => child.path === route.path)) {
    return true;
  }
  if (item.activeWhen) {
    return item.activeWhen(route.path, currentRouteTab.value);
  }
  return route.path === item.path;
}

// 滚动相关
const isScrolled = ref(false);
const isHidden = ref(false);
let lastScrollY = 0;

const handleScroll = () => {
  const currentScrollY = window.scrollY;
  isScrolled.value = currentScrollY > 10;
  isHidden.value = !isMobileMenuOpen.value && currentScrollY > lastScrollY && currentScrollY > 100;
  lastScrollY = currentScrollY;
};

const { isMobile } = useLayoutMobile();

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  void loadSiteConfig();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  document.body.style.overflow = '';
});

// 移动端菜单
const isMobileMenuOpen = ref(false);
const mobileTimelineOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  if (isMobileMenuOpen.value) {
    mobileTimelineOpen.value = route.path === '/archive' || route.path === '/development-history';
  }
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const handleNavCommand = (command: string | number | object) => {
  if (typeof command === 'string') {
    void router.push(command);
  }
};

watch(isMobileMenuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    isHidden.value = false;
  }
});

// 用户菜单命令
const handleUserCommand = (command: string | number | object) => {
  if (typeof command !== 'string') return;
  switch (command) {
    case 'profile':
      router.push('/profile');
      break;
    case 'admin':
      router.push({ path: '/admin', query: { tab: 'categories' } });
      break;
    case 'logout':
      handleLogout();
      break;
  }
};

// 退出登录
const handleLogout = async () => {
  const confirmed = await confirmAction({
    message: '确定要退出登录吗？',
    title: '提示',
    confirmText: '确定',
    cancelText: '取消',
  });
  if (!confirmed) return;
  try {
    // 调用退出登录 API
    await logoutApi();
    // 清除本地用户状态
    userStore.logout();
    notify.success('已退出登录');
    closeMobileMenu();
    router.push('/');
  } catch {
    // 请求失败
  }
};
</script>

<style scoped lang="scss">
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding-top: 12px;
  transition: all 0.3s ease;
  background: transparent;

  &.is-scrolled {
    background: transparent;
  }

  &.is-hidden {
    transform: translateY(calc(-100% - 18px));
  }

  > .container {
    max-width: min(1480px, calc(100% - 24px));
  }
}

.header-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 64px;
  min-width: 0;
}

// Logo
.logo {
  flex: 0 0 auto;
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  text-decoration: none;

  .logo-img {
    width: 92px;
    height: 42px;
    object-fit: contain;
    transition: transform 0.3s;

    &:hover {
      transform: scale(1.05);
    }
  }
}

// 导航菜单
.desktop-toolbar {
  flex: 0 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  width: max-content;
  max-width: calc(100% - 120px);
  min-height: 54px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 251, 253, 0.22);
  border: 1px solid rgba(255, 235, 242, 0.42);
  box-shadow:
    0 14px 30px rgba(120, 88, 104, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.54);
  backdrop-filter: blur(20px) saturate(1.12);
}

.nav-menu {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: max-content;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-item {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 999px;
  color: #564f57;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  transition: all 0.28s ease;

  .nav-icon {
    flex: 0 0 auto;
    font-size: 16px;
  }

  span {
    white-space: nowrap;
    word-break: keep-all;
  }

  &:hover {
    color: #ff7faa;
    background: rgba(255, 255, 255, 0.38);
    box-shadow: inset 0 0 0 1px rgba(255, 224, 235, 0.34);
  }

  &.is-active {
    color: #ff7faa;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.68), rgba(255, 243, 248, 0.48));
    box-shadow:
      0 8px 16px rgba(255, 142, 181, 0.12),
      inset 0 0 0 1px rgba(255, 196, 216, 0.4);
  }
}

.nav-dropdown {
  flex: 0 0 auto;
}

.nav-dropdown-trigger {
  border: 0;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
}

.nav-chevron {
  flex: 0 0 auto;
  margin-left: -1px;
  font-size: 12px;
  opacity: 0.68;
}

// 操作按钮
.header-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding-left: 10px;
  margin-left: 4px;
  border-left: 1px solid rgba(114, 88, 101, 0.14);
}

.mobile-actions {
  min-height: 50px;
  padding: 6px 8px;
  margin-left: 0;
  border-left: 0;
  border-radius: 999px;
  background: rgba(255, 251, 253, 0.22);
  border: 1px solid rgba(255, 235, 242, 0.42);
  box-shadow:
    0 14px 30px rgba(120, 88, 104, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.54);
  backdrop-filter: blur(20px) saturate(1.12);
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.28);
  color: #746777;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.28s ease;
  font-size: 18px;
  box-shadow: inset 0 0 0 1px rgba(255, 232, 240, 0.34);

  &:hover {
    background: rgba(255, 255, 255, 0.48);
    color: var(--primary);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent-strong);
    outline-offset: 2px;
  }
}

.site-display-trigger {
  position: relative;
}

.site-display-trigger__petal {
  position: absolute;
  right: 5px;
  bottom: 5px;
  width: 7px;
  height: 7px;
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 70% 30% 68% 32%;
  background: var(--color-accent);
  transform: rotate(-28deg);
  transition:
    opacity var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);
}

.site-display-trigger__petal.is-light {
  opacity: 0.56;
  transform: rotate(-28deg) scale(0.78);
}

.site-display-trigger__petal.is-off {
  opacity: 0;
  transform: rotate(-28deg) scale(0.4);
}

// 编写按钮
.write-btn {
  text-decoration: none;
}

.write-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: 999px;
  color: #564f57;
  background: transparent;
  border: none;
  padding: 0 16px;
  height: 36px;
  line-height: 1;
  box-shadow: none;
  transition: all 0.28s ease;

  :deep(span) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    height: 100%;
    line-height: 1;
  }

  .el-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  :deep(span > span) {
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
  }

  &:hover {
    color: #ff7faa;
    background: rgba(255, 255, 255, 0.38);
    box-shadow: inset 0 0 0 1px rgba(255, 224, 235, 0.34);
    transform: translateY(-1px);
  }
}

.write-link:hover,
.write-link:focus {
  border: none;
  color: #ff7faa;
  background: rgba(255, 255, 255, 0.38);
}

// 登录按钮
.login-link {
  text-decoration: none;
}

.login-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff7faa, #ff98b7);
  border: none;
  padding: 0 16px;
  height: 36px;
  box-shadow: 0 12px 20px rgba(255, 136, 177, 0.22);

  .el-icon {
    font-size: 14px;
  }

  span {
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
  }

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
}

// 用户菜单
.user-menu {
  cursor: pointer;
}

.user-avatar-wrapper {
  padding: 2px;
  border-radius: 50%;
  transition: all 0.28s ease;
  background: rgba(255, 255, 255, 0.28);
  box-shadow: inset 0 0 0 1px rgba(255, 232, 240, 0.34);

  &:hover {
    background: rgba(255, 255, 255, 0.48);
    transform: translateY(-1px);
  }
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.7);
}

.dropdown-user-info {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1.2;

  .dropdown-nickname {
    font-weight: 500;
    color: var(--text-primary);
    max-width: 180px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-role {
    font-size: 12px;
    color: var(--primary);
    background: rgba(251, 114, 153, 0.12);
    border: 1px solid rgba(251, 114, 153, 0.18);
    padding: 2px 8px;
    border-radius: 999px;
    white-space: nowrap;
  }
}

// 移动端菜单
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1001;
}

.mobile-menu-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.mobile-menu-content {
  position: absolute;
  top: 0;
  right: 0;
  width: min(84vw, 320px);
  height: 100%;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(18px);
  border-left: 1px solid rgba(244, 194, 213, 0.45);
  box-shadow: -18px 0 40px rgba(112, 86, 102, 0.12);
  padding: 84px 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.mobile-menu-divider {
  height: 1px;
  background: rgba(227, 229, 231, 0.8);
  margin: 8px 0;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 16px;
  transition: all 0.3s;
  cursor: pointer;

  &.is-active {
    background: var(--color-accent-soft);
    color: var(--color-accent-strong);
  }

  &:hover {
    background: var(--bg-hover);
    color: var(--primary);
  }
}

.mobile-nav-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mobile-nav-group-trigger {
  width: 100%;
  border: 0;
  background: transparent;
  font-family: inherit;
  text-align: left;
}

.mobile-nav-chevron {
  margin-left: auto;
  font-size: 14px;
  transition: transform var(--motion-duration-fast) var(--motion-ease-standard);
}

.mobile-nav-chevron.is-open {
  transform: rotate(180deg);
}

.mobile-nav-children {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 20px;
}

.mobile-nav-child {
  min-height: 44px;
  padding-top: 10px;
  padding-bottom: 10px;
  font-size: 15px;
}

.mobile-account-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px 6px;
  color: var(--text-primary);
}

.mobile-account-summary__name {
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-account-summary__role {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--primary);
  background: rgba(251, 114, 153, 0.12);
  border: 1px solid rgba(251, 114, 153, 0.18);
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

// 搜索对话框
// 下拉菜单样式
:deep(.el-dropdown-menu) {
  min-width: 160px;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}

[data-theme="dark"] .mobile-menu-content {
  background: rgba(35, 36, 39, 0.98);
  border-left-color: rgba(78, 82, 90, 0.7);
  box-shadow: -18px 0 40px rgba(0, 0, 0, 0.28);
}

[data-theme="dark"] .mobile-menu-divider {
  background: rgba(78, 82, 90, 0.78);
}

[data-theme="dark"] .desktop-toolbar,
[data-theme="dark"] .mobile-actions {
  background: rgba(32, 28, 34, 0.34);
  border-color: rgba(100, 89, 100, 0.38);
  box-shadow:
    0 18px 34px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

[data-theme="dark"] .header-actions {
  border-left-color: rgba(255, 255, 255, 0.08);
}

[data-theme="dark"] .nav-item {
  color: rgba(248, 239, 244, 0.82);
}

[data-theme="dark"] .nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

[data-theme="dark"] .nav-item.is-active {
  background: rgba(255, 127, 170, 0.18);
  box-shadow:
    0 10px 18px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px rgba(255, 162, 194, 0.28);
}

[data-theme="dark"] .action-btn,
[data-theme="dark"] .user-avatar-wrapper {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(248, 239, 244, 0.84);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

@media (max-width: 1280px) {
  .header-content {
    gap: 10px;
  }

  .desktop-toolbar {
    padding-inline: 10px;
    max-width: calc(100% - 110px);
  }

  .nav-menu {
    gap: 4px;
  }

  .nav-item {
    gap: 5px;
    padding-inline: 11px;
  }
}

/* 中等宽度：导航项较多时隐藏文字旁图标、进一步压缩间距，保证一行排开不被截断 */
@media (max-width: 1180px) {
  .desktop-toolbar {
    gap: 4px;
    padding-inline: 8px;
  }

  .nav-item {
    gap: 0;
    padding-inline: 9px;
    font-size: 13px;
  }

  .nav-item .nav-icon {
    display: none;
  }
}

@media (max-width: 768px) {
  .header {
    padding-top: 8px;
  }

  .header-content {
    justify-content: space-between;
    min-height: 56px;
  }

  .logo {
    position: static;
    transform: none;
  }

  .action-btn {
    width: 34px;
    height: 34px;
  }
}
</style>

<style lang="scss">
.timeline-nav-popper.el-popper {
  overflow: hidden;
  min-width: 176px;
  border: 1px solid rgba(243, 199, 215, 0.72);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 36px rgba(96, 68, 82, 0.16);
  backdrop-filter: blur(18px) saturate(1.08);
}

.timeline-nav-popper .el-dropdown-menu {
  padding: 6px;
  background: transparent;
}

.timeline-nav-popper .el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.timeline-nav-popper .el-dropdown-menu__item:hover,
.timeline-nav-popper .el-dropdown-menu__item:focus,
.timeline-nav-popper .el-dropdown-menu__item.is-active {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.site-display-popper.el-popper {
  overflow: hidden;
  width: 220px;
  border: 0;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 6px 8px rgba(96, 68, 82, 0.14);
}

.site-display-popper .el-dropdown-menu {
  padding: 8px;
  background: transparent;
}

.site-display-popper .site-display-menu__title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 10px;
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: 650;
}

.site-display-popper .site-display-menu__section-label {
  padding: 6px 10px 5px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 650;
}

.site-display-popper .site-display-menu__divider {
  height: 1px;
  margin: 7px 6px;
  background: var(--color-border-light);
}

.site-display-popper .el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 7px 10px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  line-height: 1.3;
}

.site-display-popper .el-dropdown-menu__item:hover,
.site-display-popper .el-dropdown-menu__item:focus,
.site-display-popper .el-dropdown-menu__item.is-selected {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.site-display-popper .site-display-menu__option {
  min-width: 0;
  flex: 1;
  font-size: 14px;
}

.site-display-popper .site-display-menu__check {
  flex: 0 0 auto;
  color: var(--color-accent-strong);
}

[data-theme='dark'] .timeline-nav-popper.el-popper {
  border-color: rgba(255, 162, 194, 0.24);
  background: rgba(43, 36, 49, 0.97);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
}

[data-theme='dark'] .site-display-popper.el-popper {
  background: rgba(43, 36, 49, 0.98);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.28);
}

[data-theme='dark'] .site-display-popper .site-display-menu__divider {
  background: rgba(255, 255, 255, 0.08);
}

@media (prefers-reduced-motion: reduce) {
  .mobile-nav-chevron {
    transition: none;
  }
}
</style>
