import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { confirmAction, notify } from '@/lib/feedback';
import { useSiteConfig } from '@/composables/useSiteConfig';
import { isAdminUser, isFriendUser } from '@/utils/permission';
import { applySiteMeta } from '@/utils/siteConfig';
import { useUserStore } from '@/stores/user';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home/Home.vue'),
    meta: {
      title: '首页',
    },
  },
  // 根路径重定向到首页（兼容 /home）
  {
    path: '/home',
    redirect: '/',
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: () => import('@/views/Article/ArticleDetail.vue'),
    meta: {
      title: '文章详情',
    },
  },
  {
    path: '/article/edit/:id?',
    name: 'ArticleEdit',
    component: () => import('@/views/Article/ArticleEdit.vue'),
    meta: {
      title: '编写文章',
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('@/views/Archive/Archive.vue'),
    meta: {
      title: '文章记录',
    },
  },
  {
    path: '/development-history',
    name: 'DevelopmentHistory',
    component: () => import('@/views/DevelopmentHistory/DevelopmentHistory.vue'),
    meta: {
      title: '开发历程',
    },
  },
  {
    path: '/memory-map',
    name: 'MemoryMap',
    component: () => import('@/views/MemoryMap/MemoryMap.vue'),
    meta: {
      title: '旅行地图',
    },
  },
  {
    path: '/memory-map/detail/:id',
    redirect: to => ({
      name: 'MemoryMap',
      query: {
        ...to.query,
        focus: String(to.params.id),
      },
    }),
  },
  {
    path: '/music',
    name: 'Music',
    component: () => import('@/views/Music/Music.vue'),
    meta: {
      title: '音乐馆',
    },
  },
  {
    path: '/music/tracks/new',
    name: 'MusicTrackCreate',
    component: () => import('@/views/Music/MusicTrackEdit.vue'),
    meta: {
      title: '新增歌曲',
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/music/tracks/:id/edit',
    name: 'MusicTrackEdit',
    component: () => import('@/views/Music/MusicTrackEdit.vue'),
    meta: {
      title: '编辑歌曲',
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/memory-map/create',
    name: 'TravelMemoryCreate',
    component: () => import('@/views/MemoryMap/TravelMemoryCreate.vue'),
    meta: {
      title: '新增旅游地点',
      requiresAuth: true,
      requiresFriend: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/memory-map/edit/:id',
    name: 'TravelMemoryEdit',
    component: () => import('@/views/MemoryMap/TravelMemoryCreate.vue'),
    meta: {
      title: '编辑旅游地点',
      requiresAuth: true,
      requiresFriend: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/category',
    name: 'Category',
    component: () => import('@/views/Category/Category.vue'),
    meta: {
      title: '分类',
    },
  },
  {
    path: '/category/:id',
    name: 'CategoryDetail',
    component: () => import('@/views/Category/CategoryDetail.vue'),
    meta: {
      title: '分类文章',
    },
  },
  {
    path: '/tag',
    name: 'Tag',
    component: () => import('@/views/Tag/Tag.vue'),
    meta: {
      title: '标签',
    },
  },
  {
    path: '/tag/:id',
    name: 'TagDetail',
    component: () => import('@/views/Tag/TagDetail.vue'),
    meta: {
      title: '标签文章',
    },
  },
  {
    path: '/guestbook',
    name: 'Guestbook',
    component: () => import('@/views/Guestbook/Guestbook.vue'),
    meta: {
      title: '留言板',
    },
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About/About.vue'),
    meta: {
      title: '关于',
    },
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: () => import('@/views/User/UserProfile.vue'),
    meta: {
      title: '成员主页',
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Auth/Login.vue'),
    meta: {
      title: '登录',
      guest: true, // 标记为游客可访问
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Auth/Register.vue'),
    meta: {
      title: '注册',
      guest: true,
    },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/Auth/ForgotPassword.vue'),
    meta: {
      title: '找回密码',
      guest: true,
    },
  },
  {
    path: '/trust-request',
    name: 'TrustRequest',
    component: () => import('@/views/TrustRequest/TrustRequest.vue'),
    meta: {
      title: '好友申请',
    },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile/Profile.vue'),
    meta: {
      title: '个人中心',
      requiresAuth: true,
    },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin/AdminLayout.vue'),
    meta: {
      title: '后台管理',
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound/NotFound.vue'),
    meta: {
      title: '页面不存在',
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// 发版后旧标签页仍引用已删除的 chunk 时会触发；提示并刷新以加载新入口（见 main.ts 挂载后清除标记）
export const CHUNK_RELOAD_KEY = 'chen404_chunk_reload';
const chunkLoadFailed =
  /Failed to fetch dynamically imported module|Loading chunk \d+ failed|Importing a module script failed/i;
router.onError((err) => {
  if (!chunkLoadFailed.test(String(err?.message ?? err))) return;
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    notify.error('静态资源加载失败，请强制刷新 (Ctrl+Shift+R) 或检查服务端是否已完整部署前端');
    return;
  }
  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  notify.warning('页面已更新，正在刷新…');
  window.location.reload();
});

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  if (to.path === '/archive' && to.query.view === 'development') {
    const { view: _legacyView, ...query } = to.query;
    next({ path: '/development-history', query, hash: to.hash, replace: true });
    return;
  }

  const userStore = useUserStore();
  const { loadSiteConfig } = useSiteConfig();
  const title = to.meta.title as string;
  const siteConfig = await loadSiteConfig().catch(() => null);
  applySiteMeta(siteConfig, title);

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const ok = await userStore.syncAuthState();
    if (!ok) {
      const confirmed = await confirmAction({
        title: '需要登录',
        message: '这个页面需要登录后才能继续查看，是否现在前往登录？',
        confirmText: '去登录',
        cancelText: '暂不登录',
        tone: 'info',
      });
      if (confirmed) {
        next({
          path: '/login',
          query: { redirect: to.fullPath },
        });
        return;
      }
      notify.info('你可以先继续浏览公开内容');
      next(false);
      return;
    }
  }

  if (to.meta.guest) {
    const ok = await userStore.syncAuthState();
    if (ok) {
      next({ path: '/' });
      return;
    }
  }

  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin) {
    const ok = await userStore.syncAuthState();
    if (!ok || !isAdminUser(userStore.user)) {
      notify.error('仅管理员可访问');
      next({ path: '/' });
      return;
    }
  }

  if (to.meta.requiresFriend) {
    const ok = await userStore.syncAuthState();
    if (!ok || !isFriendUser(userStore.user)) {
      notify.error('仅管理员与知友可访问');
      next({ path: '/' });
      return;
    }
  }

  next();
});

export default router;
