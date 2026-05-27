<template>
  <header class="header" :class="{ 'is-scrolled': isScrolled, 'is-hidden': isHidden }">
    <div class="container">
      <div class="header-content">
        <!-- Logo -->
        <router-link to="/" class="logo">
          <img :src="siteLogo" :alt="siteName" class="logo-img" />
        </router-link>

        <!-- 导航菜单 -->
        <nav class="nav-menu" v-if="!isMobile">
          <router-link
            v-for="item in navItems"
            :key="item.key"
            :to="item.to"
            class="nav-item"
            :class="{ 'is-active': isNavItemActive(item) }"
          >
            <el-icon class="nav-icon">
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.name }}</span>
          </router-link>
        </nav>

        <!-- 右侧操作区 -->
        <div class="header-actions">
          <!-- 编写文章按钮（仅管理员显示） -->
          <router-link
            v-if="isLoggedIn && canCreateArticle && !isMobile"
            to="/article/edit"
            class="write-btn"
          >
            <el-button type="primary" size="small" class="write-link rounded-full">
              <el-icon><EditPen /></el-icon>
              <span>编写</span>
            </el-button>
          </router-link>

          <button class="action-btn" @click="toggleTheme">
            <el-icon v-if="isDark"><Sunny /></el-icon>
            <el-icon v-else><Moon /></el-icon>
          </button>

          <!-- 未登录显示登录按钮 -->
          <router-link v-if="!isLoggedIn && !isMobile" to="/login" class="login-link">
            <el-button type="primary" size="small" class="login-btn rounded-full">
              <el-icon><User /></el-icon>
              <span>登录</span>
            </el-button>
          </router-link>

          <!-- 已登录显示用户菜单 -->
          <el-dropdown v-if="isLoggedIn && !isMobile" @command="handleUserCommand" class="user-menu">
            <div class="user-avatar-wrapper">
              <el-avatar
                :src="user?.avatar"
                :size="32"
                class="user-avatar"
              >
                {{ user?.nickname?.charAt(0) || user?.username?.charAt(0) || 'U' }}
              </el-avatar>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <div class="dropdown-user-info">
                  <span class="dropdown-nickname">{{ user?.nickname || user?.username }}</span>
                  <span class="dropdown-role">{{ roleText }}</span>
                </div>
                <el-dropdown-item divided command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item v-if="isAdmin" command="admin">
                  <el-icon><Setting /></el-icon>
                  后台管理
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 移动端菜单按钮 -->
          <button class="action-btn menu-btn" v-if="isMobile" @click="toggleMobileMenu">
            <el-icon><Menu /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- 移动端菜单 -->
    <div class="mobile-menu" v-show="isMobileMenuOpen" v-if="isMobile">
      <div class="mobile-menu-overlay" @click="closeMobileMenu"></div>
      <div class="mobile-menu-content">
        <router-link
          v-for="item in navItems"
          :key="item.key"
          :to="item.to"
          class="mobile-nav-item"
          @click="closeMobileMenu"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.name }}</span>
        </router-link>

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
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </router-link>
          <router-link
            v-if="isAdmin"
            to="/admin?tab=categories"
            class="mobile-nav-item"
            @click="closeMobileMenu"
          >
            <el-icon><Setting /></el-icon>
            <span>后台管理</span>
          </router-link>
          <router-link
            v-if="canCreateArticle"
            to="/article/edit"
            class="mobile-nav-item"
            @click="closeMobileMenu"
          >
            <el-icon><EditPen /></el-icon>
            <span>编写文章</span>
          </router-link>
          <div class="mobile-menu-divider"></div>
          <div class="mobile-nav-item" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
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
            <el-icon><User /></el-icon>
            <span>登录</span>
          </router-link>

          <router-link
            to="/register"
            class="mobile-nav-item"
            @click="closeMobileMenu"
          >
            <el-icon><UserFilled /></el-icon>
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
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  HomeFilled,
  Folder,
  List,
  ChatDotRound,
  InfoFilled,
  Sunny,
  Moon,
  User,
  UserFilled,
  Menu,
  EditPen,
  SwitchButton,
  Setting,
  Place,
  Postcard,
  Headset,
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { logout as logoutApi } from '@/api/auth';
import { useSiteConfig } from '@/composables/useSiteConfig';
import { getTrustLevelLabel, isAdminUser } from '@/utils/permission';
import { resolveSiteLogo, resolveSiteName } from '@/utils/siteConfig';
import { useLayoutMobile } from '@/composables/useLayoutMobile';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
userStore.initUser();
const { isLoggedIn, user } = storeToRefs(userStore);
const { siteConfig, loadSiteConfig } = useSiteConfig();
const siteName = computed(() => resolveSiteName(siteConfig.value));
const siteLogo = computed(() => resolveSiteLogo(siteConfig.value));

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
  icon: object;
  activeWhen?: (currentPath: string, currentTab?: string | null) => boolean;
}

// 导航项
const navItems = computed<NavItem[]>(() => [
  { key: 'home', name: '首页', path: '/', to: '/', icon: HomeFilled },
  { key: 'category', name: '分类', path: '/category', to: '/category', icon: List },
  { key: 'archive', name: '时光轴', path: '/archive', to: '/archive', icon: Folder },
  { key: 'memory-map', name: '旅行地图', path: '/memory-map', to: '/memory-map', icon: Place },
  { key: 'music', name: '音乐馆', path: '/music', to: '/music', icon: Headset },
  {
    key: 'trust-request',
    name: '受信申请',
    path: '/trust-request',
    to: '/trust-request',
    icon: Postcard,
    activeWhen: (currentPath: string, currentTab?: string | null) =>
      currentPath === '/trust-request' || (currentPath === '/profile' && currentTab === 'trust'),
  },
  { key: 'guestbook', name: '留言板', path: '/guestbook', to: '/guestbook', icon: ChatDotRound },
  { key: 'about', name: '关于', path: '/about', to: '/about', icon: InfoFilled },
]);

const currentRouteTab = computed(() => {
  const value = route.query.tab;
  return typeof value === 'string' ? value : null;
});

function isNavItemActive(item: {
  path: string;
  activeWhen?: (currentPath: string, currentTab?: string | null) => boolean;
}) {
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

// 主题切换
const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

// 初始化主题
onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    isDark.value = true;
    document.documentElement.setAttribute('data-theme', 'dark');
  }
});

// 移动端菜单
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

watch(isMobileMenuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    isHidden.value = false;
  }
});

// 用户菜单命令
const handleUserCommand = (command: string) => {
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
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    // 调用退出登录 API
    await logoutApi();
    // 清除本地用户状态
    userStore.logout();
    ElMessage.success('已退出登录');
    closeMobileMenu();
    router.push('/');
  } catch {
    // 用户取消或请求失败
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
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  min-width: 0;
}

// Logo
.logo {
  flex: 0 0 auto;
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
.nav-menu {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: max-content;
  overflow-x: auto;
  overflow-y: hidden;
  min-height: 54px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 251, 253, 0.22);
  border: 1px solid rgba(255, 235, 242, 0.42);
  box-shadow:
    0 14px 30px rgba(120, 88, 104, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.54);
  backdrop-filter: blur(20px) saturate(1.12);
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

// 操作按钮
.header-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 54px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 251, 253, 0.22);
  border: 1px solid rgba(255, 235, 242, 0.42);
  box-shadow:
    0 14px 30px rgba(120, 88, 104, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.54);
  backdrop-filter: blur(20px) saturate(1.1);
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
}

// 编写按钮
.write-btn {
  text-decoration: none;
}

.write-link {
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

  &:hover {
    background: var(--bg-hover);
    color: var(--primary);
  }
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

[data-theme="dark"] .nav-menu,
[data-theme="dark"] .header-actions {
  background: rgba(32, 28, 34, 0.34);
  border-color: rgba(100, 89, 100, 0.38);
  box-shadow:
    0 18px 34px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
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

  .nav-menu {
    gap: 4px;
    padding-inline: 10px;
  }

  .nav-item {
    gap: 5px;
    padding-inline: 11px;
  }
}

@media (max-width: 768px) {
  .header {
    padding-top: 8px;
  }

  .header-content {
    min-height: 56px;
  }

  .header-actions {
    padding: 6px 8px;
  }

  .action-btn {
    width: 34px;
    height: 34px;
  }
}
</style>
