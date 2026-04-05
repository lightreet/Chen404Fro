<template>
  <DefaultLayout>
    <div class="profile-page">
      <div class="profile-center">
        <!-- 顶部用户信息区（参考 boxmoe.com/user 的「个人中心头部」样式） -->
        <div class="profile-banner">
          <div class="banner-decoration">
            <div class="circle circle-1" />
            <div class="circle circle-2" />
            <div class="circle circle-3" />
          </div>
          <div class="banner-content">
            <div class="banner-inline">
              <el-avatar :size="74" :src="user?.avatar || ''" class="profile-avatar">
                {{ String(user?.nickname || user?.username || 'U').charAt(0) }}
              </el-avatar>
              <div class="banner-text">
                <div class="profile-nickname">
                  {{ user?.nickname || user?.username || '未登录' }}
                </div>
                <div class="profile-username">账号：@{{ user?.username || '--' }}</div>
                <div class="profile-subtitle">{{ roleText }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 下方卡片区 -->
        <div class="profile-main">
          <div class="profile-split-scroll-box">
          <!-- 左侧菜单 -->
          <aside class="profile-nav">
            <el-menu
              :default-active="activeMenu"
              class="nav-menu"
              @select="handleMenuSelect"
            >
              <el-menu-item index="articles">
                <el-icon><Document /></el-icon>
                <span>我的文章</span>
              </el-menu-item>
              <el-menu-item index="likes">
                <el-icon><Medal /></el-icon>
                <span>我的点赞</span>
              </el-menu-item>
              <el-menu-item index="favorites">
                <el-icon><Star /></el-icon>
                <span>我的收藏</span>
              </el-menu-item>
              <el-menu-item index="settings">
                <el-icon><User /></el-icon>
                <span>个人信息</span>
              </el-menu-item>
            </el-menu>
          </aside>

          <!-- 右侧内容区 -->
          <section class="profile-content">
            <!-- 我的文章 -->
            <div v-if="activeMenu === 'articles'" class="article-panel">
              <el-card class="info-card article-list-card" shadow="never">
                <template #header>
                  <div class="content-header">
                    <div class="header-main">
                      <div class="header-heading">
                        <span class="card-title">
                          <el-icon class="card-icon"><Document /></el-icon>
                          我的文章
                        </span>
                        <span class="article-total">共 {{ articleTotal }} 篇</span>
                      </div>
                    </div>
                    <div class="content-actions">
                      <el-radio-group v-model="articleStatus" size="default" class="status-radio" @change="loadMyArticles(1)">
                        <el-radio-button :value="-1">全部</el-radio-button>
                        <el-radio-button :value="0">草稿</el-radio-button>
                        <el-radio-button :value="1">已发布</el-radio-button>
                      </el-radio-group>
                      <div class="search-row">
                        <el-input
                          v-model="articleKeyword"
                          placeholder="搜索标题/摘要"
                          clearable
                          class="keyword-input"
                          @keyup.enter="loadMyArticles(1)"
                        />
                        <el-button type="primary" @click="loadMyArticles(1)">
                          <el-icon><Search /></el-icon>
                          搜索
                        </el-button>
                      </div>
                    </div>
                  </div>
                </template>

                <el-skeleton v-if="articleLoading" :rows="6" animated />

                <div v-else-if="myArticles.length === 0" class="empty-state">
                  暂无文章
                </div>

                <div v-else class="article-list-shell">
                  <div class="article-scroll-area">
                    <div class="article-list">
                      <ArticleCard
                        v-for="(a, idx) in myArticles"
                        :key="String(a.id)"
                        :article="a"
                        :index="idx"
                        mode="manage"
                        compact
                        @edit="handleEditArticle"
                        @delete="handleDeleteArticle"
                      />
                    </div>
                  </div>

                  <div class="pager">
                    <el-pagination
                      background
                      layout="prev, pager, next"
                      :current-page="articlePage"
                      :page-size="articlePageSize"
                      :total="articleTotal"
                      @current-change="loadMyArticles"
                    />
                  </div>
                </div>
              </el-card>
            </div>

            <!-- 我的点赞 -->
            <div v-else-if="activeMenu === 'likes'" class="article-panel">
              <el-card class="info-card article-list-card" shadow="never">
                <template #header>
                  <div class="content-header">
                    <span class="card-title">
                      <el-icon class="card-icon"><Medal /></el-icon>
                      我的点赞
                    </span>
                    <span class="article-total">共 {{ likedTotal }} 篇</span>
                  </div>
                </template>
                <el-skeleton v-if="likedLoading" :rows="6" animated />
                <div v-else-if="myLikedArticles.length === 0" class="empty-state">暂无点赞文章</div>
                <div v-else class="article-list-shell">
                  <div class="article-scroll-area">
                    <div class="article-list">
                      <ArticleCard
                        v-for="(a, idx) in myLikedArticles"
                        :key="String(a.id)"
                        :article="a"
                        :index="idx"
                        mode="home"
                        compact
                        profile-feed
                      />
                    </div>
                  </div>
                  <div class="pager">
                    <el-pagination
                      background
                      layout="prev, pager, next"
                      :current-page="likedPage"
                      :page-size="likedPageSize"
                      :total="likedTotal"
                      @current-change="loadMyLikedArticles"
                    />
                  </div>
                </div>
              </el-card>
            </div>

            <!-- 我的收藏 -->
            <div v-else-if="activeMenu === 'favorites'" class="article-panel">
              <el-card class="info-card article-list-card" shadow="never">
                <template #header>
                  <div class="content-header">
                    <span class="card-title">
                      <el-icon class="card-icon"><Star /></el-icon>
                      我的收藏
                    </span>
                    <span class="article-total">共 {{ favTotal }} 篇</span>
                  </div>
                </template>
                <el-skeleton v-if="favLoading" :rows="6" animated />
                <div v-else-if="myFavoriteArticles.length === 0" class="empty-state">暂无收藏</div>
                <div v-else class="article-list-shell">
                  <div class="article-scroll-area">
                    <div class="article-list">
                      <ArticleCard
                        v-for="(a, idx) in myFavoriteArticles"
                        :key="String(a.id)"
                        :article="a"
                        :index="idx"
                        mode="home"
                        compact
                        profile-feed
                      />
                    </div>
                  </div>
                  <div class="pager">
                    <el-pagination
                      background
                      layout="prev, pager, next"
                      :current-page="favPage"
                      :page-size="favPageSize"
                      :total="favTotal"
                      @current-change="loadMyFavoriteArticles"
                    />
                  </div>
                </div>
              </el-card>
            </div>

            <!-- 个人信息：头像、昵称、修改密码等统一在此维护 -->
            <div v-else-if="activeMenu === 'settings'">
              <el-card class="info-card" shadow="never">
                <template #header>
                  <span class="card-title">
                    <el-icon class="card-icon"><User /></el-icon>
                    个人信息
                  </span>
                </template>
                <div v-if="user" class="profile-edit">
                  <el-form
                    ref="profileFormRef"
                    :model="profileForm"
                    :rules="profileRules"
                    label-position="top"
                    class="profile-form"
                  >
                    <el-form-item label="头像" prop="avatar">
                      <div class="avatar-edit-row">
                        <el-avatar :size="80" :src="profileForm.avatar" class="form-avatar">
                          {{ (user?.nickname || user?.username || 'U').charAt(0) }}
                        </el-avatar>
                        <el-upload
                          :show-file-list="false"
                          :before-upload="beforeAvatarUpload"
                          :http-request="handleAvatarUpload"
                          class="avatar-upload-inline"
                        >
                          <el-button type="primary" size="default">
                            <el-icon class="btn-icon"><Upload /></el-icon>
                            更新头像
                          </el-button>
                        </el-upload>
                      </div>
                    </el-form-item>

                    <el-form-item label="昵称" prop="nickname">
                      <el-input v-model="profileForm.nickname" maxlength="20" show-word-limit placeholder="请输入昵称" />
                    </el-form-item>

                    <div class="profile-form-actions">
                      <el-button
                        type="primary"
                        :loading="profileSaving"
                        @click="handleSaveProfile"
                      >
                        保存资料
                      </el-button>
                      <el-button @click="resetProfileForm">重置</el-button>
                      <el-button @click="openPasswordDialog">
                        <el-icon><Lock /></el-icon>
                        修改密码
                      </el-button>
                    </div>
                  </el-form>

                  <el-divider />

                  <el-descriptions :column="2" border class="profile-desc">
                    <el-descriptions-item label="昵称">{{ user?.nickname || user?.username || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="用户名">{{ user?.username || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="简介">
                      <template v-if="signatureTokens.length > 0">
                        <span v-for="(token, idx) in signatureTokens" :key="idx">
                          <span v-if="token.type === 'text'">{{ token.value }}</span>
                          <span v-else class="emoji-token" :title="token.emoji.label">{{ token.emoji.unicode || '🙂' }}</span>
                        </span>
                      </template>
                      <template v-else>--</template>
                    </el-descriptions-item>
                    <el-descriptions-item label="邮箱">{{ user?.email || '未绑定' }}</el-descriptions-item>
                    <el-descriptions-item label="手机">{{ user?.phone || '未绑定' }}</el-descriptions-item>
                    <el-descriptions-item label="状态">{{ user?.status === 1 ? '启用' : '禁用' }}</el-descriptions-item>
                    <el-descriptions-item label="角色">{{ roleText }}</el-descriptions-item>
                    <el-descriptions-item label="信任级别">{{ trustLevelText }}</el-descriptions-item>
                    <el-descriptions-item label="注册时间">{{ formatDate(user?.createTime ?? '') || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="最后登录">{{ user?.lastLoginTime || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="最后登录 IP">{{ user?.lastLoginIp || '--' }}</el-descriptions-item>
                  </el-descriptions>
                </div>
                <el-skeleton v-else :rows="6" animated />
              </el-card>
            </div>

            <!-- 其他菜单占位 -->
            <el-card v-else class="info-card" shadow="never">
              <template #header>
                <span class="card-title">
                  <el-icon class="card-icon"><Link /></el-icon>
                  功能开发中
                </span>
              </template>
              <div class="placeholder">
                该功能正在建设中，敬请期待。
              </div>
            </el-card>
          </section>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="420px"
      :close-on-click-modal="false"
      class="password-dialog"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-position="top"
        class="password-form"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少 6 位）"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handleChangePassword">确认修改</el-button>
      </template>
    </el-dialog>

  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { User, Lock, Link, Document, Star, Upload, Search, Medal } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useUserStore } from '@/stores/user';
import { getUserInfo, changePassword, updateProfile } from '@/api/auth';
import { uploadAvatar } from '@/api/upload';
import { formatDate } from '@/utils/format';
import { getTrustLevelLabel, isAdminUser, isFriendUser } from '@/utils/permission';
import { createConfirmPasswordRule, validateImageFile, AVATAR_MAX_MB } from '@/utils/validation';
import { getMyArticles, deleteArticle, getMyLikedArticles, getMyFavoriteArticles } from '@/api/article';
import ArticleCard from '@/components/ArticleCard/ArticleCard.vue';
import { renderSignatureTokens } from '@/emoji/renderers/signatureRenderer';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const user = ref(userStore.user);

const activeMenu = ref<'articles' | 'likes' | 'favorites' | 'settings'>('articles');

const roleText = computed(() => getTrustLevelLabel(user.value));
const trustLevelText = computed(() => {
  if (!user.value) return '--';
  if (isAdminUser(user.value)) return '管理员';
  return isFriendUser(user.value) ? '好友 / 受信用户' : '普通用户';
});

const signatureTokens = computed(() => renderSignatureTokens(user.value?.bio || ''));

const profileFormRef = ref<FormInstance>();
const profileSaving = ref(false);
const profileForm = reactive({
  nickname: '',
  avatar: '',
});
const profileRules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度需为 2-20 个字符', trigger: 'blur' },
  ],
  avatar: [{ required: true, message: '请上传头像或填写头像链接', trigger: 'blur' }],
};

const passwordFormRef = ref<FormInstance>();
const passwordLoading = ref(false);
const passwordDialogVisible = ref(false);
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    createConfirmPasswordRule(() => passwordForm.newPassword, '确认新密码'),
  ],
};

const loadUser = async () => {
  try {
    const data = await getUserInfo();
    userStore.setUser(data);
    user.value = data;
    profileForm.nickname = data.nickname || data.username;
    profileForm.avatar = data.avatar || '';
  } catch {
    ElMessage.error('获取用户信息失败');
  }
};

const handleMenuSelect = (index: string) => {
  activeMenu.value = index as typeof activeMenu.value;
  router.replace({ query: { ...route.query, tab: index } });
};

const syncActiveMenuFromRoute = () => {
  const tab = route.query.tab;
  const nextTab =
    tab === 'articles' || tab === 'likes' || tab === 'favorites' || tab === 'settings'
      ? tab
      : undefined;
  if (nextTab) activeMenu.value = nextTab;
};

const resetProfileForm = () => {
  const u = user.value;
  if (!u) return;
  profileForm.nickname = u.nickname || u.username;
  profileForm.avatar = u.avatar || '';
  profileFormRef.value?.clearValidate();
};

const handleSaveProfile = async () => {
  if (!profileFormRef.value) return;
  try {
    await profileFormRef.value.validate();
    profileSaving.value = true;
    const updated = await updateProfile({
      nickname: profileForm.nickname,
      avatar: profileForm.avatar,
    });
    userStore.setUser(updated);
    user.value = updated;
    ElMessage.success('资料已保存');
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      ElMessage.error((err as { message?: string }).message ?? '保存失败');
    }
  } finally {
    profileSaving.value = false;
  }
};

const beforeAvatarUpload = (file: File) => {
  const result = validateImageFile(file, AVATAR_MAX_MB);
  if (!result.valid) {
    ElMessage.error(result.message);
    return false;
  }
  return true;
};

const handleAvatarUpload = async (options: { file: File }) => {
  try {
    const res = await uploadAvatar(options.file);
    profileForm.avatar = res.url;
    if (user.value) {
      user.value = { ...user.value, avatar: res.url };
      userStore.updateUserInfo({ avatar: res.url });
    }
    ElMessage.success('头像上传成功，请记得点击保存资料');
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      ElMessage.error((err as { message?: string }).message ?? '上传失败');
    }
  }
};

const openPasswordDialog = () => {
  passwordDialogVisible.value = true;
  nextTick(() => passwordFormRef.value?.clearValidate());
};

const articleStatus = ref(-1);
const articleKeyword = ref('');
const articleLoading = ref(false);
const myArticles = ref<any[]>([]);
const articlePage = ref(1);
const articlePageSize = 3;
const articleTotal = ref(0);

const loadMyArticles = async (page: number = 1) => {
  articlePage.value = page;
  articleLoading.value = true;
  try {
    const res = await getMyArticles({
      page,
      size: articlePageSize,
      status: articleStatus.value === -1 ? undefined : articleStatus.value,
      keyword: articleKeyword.value || undefined,
    });
    myArticles.value = res?.list ?? [];
    articleTotal.value = res?.total ?? 0;
  } catch (err) {
    console.error('加载我的文章失败', err);
  } finally {
    articleLoading.value = false;
  }
};

const likedLoading = ref(false);
const myLikedArticles = ref<any[]>([]);
const likedPage = ref(1);
const likedPageSize = 8;
const likedTotal = ref(0);

const loadMyLikedArticles = async (page: number = 1) => {
  likedPage.value = page;
  likedLoading.value = true;
  try {
    const res = await getMyLikedArticles({ page, size: likedPageSize });
    myLikedArticles.value = res?.list ?? [];
    likedTotal.value = res?.total ?? 0;
  } catch (err) {
    console.error('加载点赞文章失败', err);
  } finally {
    likedLoading.value = false;
  }
};

const favLoading = ref(false);
const myFavoriteArticles = ref<any[]>([]);
const favPage = ref(1);
const favPageSize = 8;
const favTotal = ref(0);

const loadMyFavoriteArticles = async (page: number = 1) => {
  favPage.value = page;
  favLoading.value = true;
  try {
    const res = await getMyFavoriteArticles({ page, size: favPageSize });
    myFavoriteArticles.value = res?.list ?? [];
    favTotal.value = res?.total ?? 0;
  } catch (err) {
    console.error('加载收藏失败', err);
  } finally {
    favLoading.value = false;
  }
};

const handleEditArticle = (id: number | string) => {
  router.push(`/article/edit/${String(id)}`);
};

const handleDeleteArticle = async (id: number | string) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？此操作不可恢复。', '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
    await deleteArticle(String(id));
    ElMessage.success('删除成功');
    loadMyArticles(articlePage.value);
  } catch {
    // cancel or error already handled
  }
};

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return;
  try {
    await passwordFormRef.value.validate();
    passwordLoading.value = true;
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    ElMessage.success('密码修改成功，我们已向你的邮箱发送提醒邮件');
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    passwordFormRef.value.resetFields();
    passwordDialogVisible.value = false;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      ElMessage.error((err as { message?: string }).message ?? '修改失败');
    }
  } finally {
    passwordLoading.value = false;
  }
};

watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'articles' || tab === 'likes' || tab === 'favorites' || tab === 'settings') {
      activeMenu.value = tab;
      if (tab === 'articles') loadMyArticles(1);
      else if (tab === 'likes') loadMyLikedArticles(1);
      else if (tab === 'favorites') loadMyFavoriteArticles(1);
    }
  }
);

onMounted(() => {
  if (userStore.user) {
    user.value = userStore.user;
    profileForm.nickname = userStore.user.nickname || userStore.user.username;
    profileForm.avatar = userStore.user.avatar || '';
  }
  syncActiveMenuFromRoute();
  loadUser();
  if (activeMenu.value === 'articles') loadMyArticles(1);
  else if (activeMenu.value === 'likes') loadMyLikedArticles(1);
  else if (activeMenu.value === 'favorites') loadMyFavoriteArticles(1);
});
</script>

<style scoped lang="scss">
.profile-page {
  padding-top: calc(64px + var(--spacing-lg));
  padding-bottom: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-center {
  /* Large-desktop content width; right column grows via flex; nav stays 240px */
  width: clamp(920px, 88vw, 1440px);
  max-width: 100%;
  min-width: 0;
}

/* 顶部信息区：与登录页一致的二次渐变 + 装饰 */
.profile-banner {
  position: relative;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  overflow: hidden;
  color: white;
  box-shadow: var(--shadow-md);
}

.banner-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 120px;
  height: 120px;
  top: -30px;
  right: -30px;
}

.circle-2 {
  width: 80px;
  height: 80px;
  bottom: 52px;
  left: -20px;
}

.circle-3 {
  width: 42px;
  height: 42px;
  bottom: -8px;
  right: 64px;
  background: rgba(255, 255, 255, 0.15);
}

.banner-content {
  position: relative;
  z-index: 1;
  width: 100%;
}

.banner-inline {
  display: flex;
  align-items: center;
  gap: 16px;
}

.banner-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.profile-avatar {
  border: 4px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.2);
  font-size: 28px;
  margin: 0;
}

.profile-nickname {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 var(--spacing-xs);
}

.profile-username {
  font-size: 13px;
  opacity: 0.9;
  margin: 0 0 var(--spacing-sm);
}

.profile-subtitle {
  font-size: 13px;
  opacity: 0.85;
  margin: 0;
}


/* 下方主体区：左侧菜单 + 右侧内容 */
.profile-main {
  min-width: 0;
}

.profile-split-scroll-box {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
}

.profile-nav {
  position: static;
  display: block;
  flex: 0 0 240px;
  width: 240px;
  min-width: 240px;
  align-self: flex-start;
}

.nav-menu {
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  border-right: none;
  background: rgba(255, 255, 255, 0.92);
  overflow: hidden;
  padding: 14px 10px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.nav-menu :deep(.el-menu) {
  border-right: none;
  background: transparent;
}

.nav-menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  border-radius: 14px;
  margin-bottom: 8px;
}

.nav-menu :deep(.el-menu-item:last-child) {
  margin-bottom: 0;
}

.nav-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.14), rgba(244, 114, 182, 0.12));
}

.profile-content {
  min-width: 0;
  flex: 1;
}

.article-panel {
  min-width: 0;
  padding: 0 16px;
}

@media (min-width: 901px) {
  .article-panel {
    padding-left: 6px;
    padding-right: 4px;
  }
}

.content-header {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.header-main {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.header-heading {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.header-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-tertiary);
  max-width: 560px;
}

.content-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px 18px;
  flex-wrap: wrap;
}

.status-radio {
  display: inline-flex;
  gap: var(--spacing-sm);
  padding: 4px;
  border-radius: 999px;
  background: var(--bg-hover);
}

.status-radio :deep(.el-radio-button__inner) {
  border-radius: 999px;
  padding-left: 14px;
  padding-right: 14px;
  border: none;
  box-shadow: none;
}

.search-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  justify-content: flex-start;
  min-width: 0;
}

.keyword-input {
  width: min(340px, 100%);
}

.article-total {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--bg-hover);
  color: var(--text-secondary);
  font-size: 13px;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 6px;
}

.article-list-shell {
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 14px;
}

.article-scroll-area {
  min-height: 0;
  max-height: none;
  overflow: visible;
  padding-right: 0;
}

/* 文章卡片与首页一致，用 ArticleCard compact 展示 */

.pager {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.empty-state {
  text-align: center;
  padding: 72px 24px;
  color: var(--text-tertiary);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.75), rgba(248, 250, 252, 0.92));
  border: 1px dashed var(--border-color);
  border-radius: 20px;
}

.placeholder {
  color: var(--text-secondary);
  padding: var(--spacing-lg) 0;
}

@media (max-width: 900px) {
  .profile-center {
    width: 100%;
  }

  .profile-split-scroll-box {
    flex-direction: column;
  }

  .profile-nav {
    position: static;
    display: block;
    flex: none;
    width: auto;
    min-width: 0;
  }

  .content-actions {
    justify-content: flex-start;
  }

  .header-heading {
    align-items: flex-start;
  }

  .search-row {
    width: 100%;
    min-width: 0;
    justify-content: flex-start;
  }

  .keyword-input {
    width: 100%;
  }

  .article-scroll-area {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}

.info-card {
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.06);

  :deep(.el-card__header) {
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--border-light);
    font-weight: 600;
  }

  :deep(.el-card__body) {
    padding: var(--spacing-lg);
  }
}

.article-list-card {
  overflow: hidden;

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
}

/* After .info-card so horizontal padding wins on desktop only */
@media (min-width: 901px) {
  .profile-content :deep(.info-card .el-card__body) {
    padding-left: var(--spacing-md);
    padding-right: var(--spacing-md);
  }

  .profile-content :deep(.info-card .el-card__header) {
    padding-left: var(--spacing-md);
    padding-right: var(--spacing-md);
  }
}

.card-title {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-primary);
}

.card-icon {
  color: var(--primary);
  font-size: 18px;
}

/* 基本信息列表 */
.profile-form {
  max-width: 520px;

  :deep(.el-input__wrapper) {
    border-radius: var(--radius-md);
  }

}

.avatar-edit-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.form-avatar {
  flex-shrink: 0;
  border: 2px solid var(--border-light);
}

.avatar-upload-inline {
  display: inline-block;

  :deep(.el-upload) {
    display: inline-block;
  }
}

.avatar-upload-inline .btn-icon {
  margin-right: 4px;
  vertical-align: middle;
}

.profile-form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
}

.profile-desc {
  :deep(.el-descriptions__label) {
    color: var(--text-secondary);
  }
}

.emoji-token {
  display: inline-block;
  margin: 0 1px;
  font-size: 1.1em;
}

/* 修改密码表单 */
.password-form {
  :deep(.el-input__wrapper) {
    border-radius: var(--radius-md);
  }
}

/*（保留快捷入口样式，后续可复用）*/
.shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.shortcut-item {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-decoration: none;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: var(--primary);
    color: white;
  }
}

.shortcut-icon {
  font-size: 20px;
}
</style>


