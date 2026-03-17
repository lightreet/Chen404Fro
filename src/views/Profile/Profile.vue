<template>
  <DefaultLayout>
    <div class="profile-page">
      <!-- 顶部信息卡：二次元柔和渐变 + 装饰圆 -->
      <div class="profile-banner">
        <div class="banner-decoration">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
          <div class="circle circle-3"></div>
        </div>
        <div class="banner-content">
          <el-avatar :size="96" :src="user?.avatar" class="profile-avatar">
            {{ (user?.nickname || user?.username || 'U').charAt(0) }}
          </el-avatar>
          <h1 class="profile-nickname">{{ user?.nickname || user?.username || '—' }}</h1>
          <p class="profile-username">@{{ user?.username || '—' }}</p>
          <p class="profile-subtitle">欢迎回来 ~</p>
        </div>
      </div>

      <!-- 下方卡片区 -->
      <div class="profile-main">
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
            <el-menu-item index="categories">
              <el-icon><CollectionTag /></el-icon>
              <span>分类管理</span>
            </el-menu-item>
            <el-menu-item index="favorites">
              <el-icon><Star /></el-icon>
              <span>收藏</span>
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
          <div v-if="activeMenu === 'articles'">
            <el-card class="info-card" shadow="never">
              <template #header>
                <div class="content-header">
                  <span class="card-title">
                    <el-icon class="card-icon"><Document /></el-icon>
                    我的文章
                  </span>
                  <div class="content-actions">
                    <el-radio-group v-model="articleStatus" size="default" class="status-radio" @change="loadMyArticles(1)">
                      <el-radio-button :label="-1">全部</el-radio-button>
                      <el-radio-button :label="0">草稿</el-radio-button>
                      <el-radio-button :label="1">已发布</el-radio-button>
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

              <div v-else class="article-list">
                <div v-if="myArticles.length === 0" class="empty-state">
                  暂无文章
                </div>

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

          <!-- 个人信息：头像、昵称、修改密码等统一在此修改 -->
          <div v-else-if="activeMenu === 'settings'">
            <el-card ref="profileEditCardRef" class="info-card" shadow="never">
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
                  <el-descriptions-item label="用户名">{{ user.username }}</el-descriptions-item>
                  <el-descriptions-item label="邮箱">{{ user.email || '未绑定' }}</el-descriptions-item>
                  <el-descriptions-item label="状态">{{ user.status === 1 ? '启用' : '禁用' }}</el-descriptions-item>
                  <el-descriptions-item label="注册时间">{{ formatDate(user.createTime ?? '') || '—' }}</el-descriptions-item>
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { User, Lock, Link, EditPen, HomeFilled, Document, CollectionTag, Star, Upload, Search } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useUserStore } from '@/stores/user';
import { getUserInfo, changePassword, updateProfile } from '@/api/auth';
import { uploadAvatar } from '@/api/upload';
import { formatDate } from '@/utils/format';
import { getMyArticles, deleteArticle } from '@/api/article';
import ArticleCard from '@/components/ArticleCard/ArticleCard.vue';

const userStore = useUserStore();
const router = useRouter();
const user = ref(userStore.user);

const activeMenu = ref<'articles' | 'categories' | 'favorites' | 'settings'>('articles');

const profileEditCardRef = ref();
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

const validateConfirm = (_rule: unknown, value: string, callback: (err?: Error) => void) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的新密码不一致'));
  } else {
    callback();
  }
};

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
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
  activeMenu.value = index as any;
  if (activeMenu.value === 'articles') {
    loadMyArticles(1);
  }
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
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('请选择图片文件');
    return false;
  }
  const maxSizeMb = 2;
  if (file.size / 1024 / 1024 > maxSizeMb) {
    ElMessage.error(`头像大小不能超过 ${maxSizeMb}MB`);
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
const articlePageSize = 8;
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

onMounted(() => {
  if (userStore.user) {
    user.value = userStore.user;
    profileForm.nickname = userStore.user.nickname || userStore.user.username;
    profileForm.avatar = userStore.user.avatar || '';
  }
  loadUser();
  loadMyArticles(1);
});
</script>

<style scoped lang="scss">
.profile-page {
  padding-top: calc(64px + var(--spacing-lg));
  padding-bottom: var(--spacing-xl);
}

/* 顶部信息卡：与登录页一致的二次元渐变 + 装饰 */
.profile-banner {
  position: relative;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
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
  width: 160px;
  height: 160px;
  top: -40px;
  right: -40px;
}

.circle-2 {
  width: 100px;
  height: 100px;
  bottom: 60px;
  left: -30px;
}

.circle-3 {
  width: 60px;
  height: 60px;
  bottom: -10px;
  right: 80px;
  background: rgba(255, 255, 255, 0.15);
}

.banner-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.profile-avatar {
  border: 4px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.2);
  font-size: 36px;
  margin-bottom: var(--spacing-md);
}

.profile-nickname {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 var(--spacing-xs);
}

.profile-username {
  font-size: 14px;
  opacity: 0.9;
  margin: 0 0 var(--spacing-sm);
}

.profile-subtitle {
  font-size: 14px;
  opacity: 0.85;
  margin: 0;
}

/* 下方主体区：左侧菜单 + 右侧内容 */
.profile-main {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: var(--spacing-lg);
  align-items: start;
}

.profile-nav {
  position: sticky;
  top: calc(64px + var(--spacing-lg));
}

.nav-menu {
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  overflow: hidden;
}

.profile-content {
  min-width: 0;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.content-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.status-radio {
  display: inline-flex;
  gap: var(--spacing-sm);
}

.status-radio :deep(.el-radio-button__inner) {
  border-radius: var(--radius-md);
  padding-left: 14px;
  padding-right: 14px;
}

.search-row {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.keyword-input {
  width: 220px;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* 文章卡片与首页一致，由 ArticleCard compact 展示 */

.pager {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-md);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl) 0;
  color: var(--text-tertiary);
}

.placeholder {
  color: var(--text-secondary);
  padding: var(--spacing-lg) 0;
}

@media (max-width: 900px) {
  .profile-main {
    grid-template-columns: 1fr;
  }
  .profile-nav {
    position: static;
  }
  .keyword-input {
    width: 100%;
  }
}

.info-card {
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);

  :deep(.el-card__header) {
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--border-light);
    font-weight: 600;
  }

  :deep(.el-card__body) {
    padding: var(--spacing-lg);
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
