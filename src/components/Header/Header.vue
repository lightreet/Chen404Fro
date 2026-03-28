<template>
  <header class="header" :class="{ 'is-scrolled': isScrolled, 'is-hidden': isHidden }">
    <div class="container">
      <div class="header-content">
        <!-- Logo -->
        <router-link to="/" class="logo">
          <img src="/Chen404logo.svg" alt="Chen404" class="logo-img" />
        </router-link>

        <!-- 导航菜单 -->
        <nav class="nav-menu" v-if="!isMobile">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ 'is-active': $route.path === item.path }"
          >
            <el-icon class="nav-icon">
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.name }}</span>
          </router-link>
        </nav>

        <!-- 右侧操作区 -->
        <div class="header-actions">
          <!-- 编写文章按钮（仅管理员和受信任用户显示） -->
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
          :key="item.path"
          :to="item.path"
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
          <div class="mobile-user-info">
            <el-avatar :src="user?.avatar" :size="48">
              {{ user?.nickname?.charAt(0) || user?.username?.charAt(0) || 'U' }}
            </el-avatar>
            <span class="mobile-nickname">{{ user?.nickname || user?.username }}</span>
          </div>
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
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
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { logout as logoutApi } from '@/api/auth';
import { getTrustLevelLabel, isAdminUser, isFriendUser } from '@/utils/permission';

const router = useRouter();
const userStore = useUserStore();
const { isLoggedIn, user } = storeToRefs(userStore);

// 角色文本
const roleText = computed(() => getTrustLevelLabel(user.value));

// 是否为管理员
const isAdmin = computed(() => isAdminUser(user.value));

// 是否可以创建文章（管理员或受信任用户）
const canCreateArticle = computed(() => {
  if (!user.value) return false;
  return isAdminUser(user.value) || isFriendUser(user.value);
});

// 导航项
const navItems = [
  { name: '首页', path: '/', icon: HomeFilled },
  { name: '归档', path: '/archive', icon: Folder },
  { name: '清单', path: '/category', icon: List },
  { name: '留言板', path: '/guestbook', icon: ChatDotRound },
  { name: '关于', path: '/about', icon: InfoFilled },
];

// 滚动相关
const isScrolled = ref(false);
const isHidden = ref(false);
let lastScrollY = 0;

const handleScroll = () => {
  const currentScrollY = window.scrollY;
  isScrolled.value = currentScrollY > 10;
  isHidden.value = currentScrollY > lastScrollY && currentScrollY > 100;
  lastScrollY = currentScrollY;
};

// 响应式
const isMobile = ref(false);
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  window.addEventListener('scroll', handleScroll);
  // 初始化用户状态
  userStore.initUser();
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
  window.removeEventListener('scroll', handleScroll);
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
  height: 64px;
  transition: all 0.3s ease;
  background: transparent;

  &.is-scrolled {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  &.is-hidden {
    transform: translateY(-100%);
  }
}

[data-theme="dark"] .header.is-scrolled {
  background: rgba(35, 36, 39, 0.9);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

// Logo
.logo {
  display: flex;
  align-items: center;
  text-decoration: none;

  .logo-img {
    height: 28px;
    width: auto;
    object-fit: contain;
    transition: transform 0.3s;

    &:hover {
      transform: scale(1.05);
    }
  }
}

// 导航菜单
.nav-menu {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s;

  .nav-icon {
    font-size: 16px;
  }

  &:hover {
    color: var(--primary);
    background: var(--bg-hover);
  }

  &.is-active {
    color: var(--primary);
    background: rgba(251, 114, 153, 0.1);
  }
}

// 操作按钮
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  font-size: 18px;

  &:hover {
    background: var(--bg-hover);
    color: var(--primary);
  }
}

// 编写按钮
.write-btn {
  text-decoration: none;
}

.write-link {
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border: none;
  padding: 0 14px;
  height: 32px;

  .el-icon {
    font-size: 14px;
  }

  span {
    font-size: 13px;
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
  gap: 4px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border: none;
  padding: 0 16px;
  height: 32px;

  .el-icon {
    font-size: 14px;
  }

  span {
    font-size: 13px;
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
  padding: 4px;
  border-radius: 50%;
  transition: background 0.3s;

  &:hover {
    background: var(--bg-hover);
  }
}

.user-avatar {
  border: 2px solid var(--border-color);
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
  width: 260px;
  height: 100%;
  background: var(--bg-secondary);
  padding: 80px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 8px 0;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
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

.mobile-user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;

  .mobile-nickname {
    font-weight: 500;
    color: var(--text-primary);
  }
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
</style>
