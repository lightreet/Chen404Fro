<template>
  <DefaultLayout>
    <div class="profile-page">
      <div class="profile-center">
        <div class="profile-shell">
          <aside class="profile-sidebar">
            <section class="sidebar-user-card">
              <div class="sidebar-user-main">
                <div class="sidebar-avatar-shell">
                  <el-avatar :size="78" :src="bannerProfile.avatar" class="sidebar-avatar">
                    {{ String(bannerProfile.nickname || bannerProfile.username || 'U').charAt(0) }}
                  </el-avatar>
                </div>
                <div class="sidebar-user-copy">
                  <h1 class="sidebar-name">{{ bannerProfile.nickname || '未登录' }}</h1>
                  <div class="sidebar-identity-row">
                    <span class="sidebar-role">{{ roleText }}</span>
                    <span v-if="sidebarArchetype" class="sidebar-archetype">{{ sidebarArchetype }}</span>
                  </div>
                  <div class="sidebar-email">{{ user?.email || '暂未绑定邮箱' }}</div>
                </div>
              </div>
            </section>

            <section class="profile-nav-card">
              <el-menu :default-active="activeMenu" class="nav-menu" @select="handleMenuSelect">
                <el-menu-item index="settings"><el-icon><User /></el-icon><span>个人中心</span></el-menu-item>
                <el-menu-item index="articles"><el-icon><Document /></el-icon><span>我的文章</span></el-menu-item>
                <el-menu-item index="likes"><el-icon><Medal /></el-icon><span>我的点赞</span></el-menu-item>
                <el-menu-item index="favorites"><el-icon><Star /></el-icon><span>我的收藏</span></el-menu-item>
                <el-menu-item index="trust"><el-icon><Postcard /></el-icon><span>受信申请</span></el-menu-item>
              </el-menu>
            </section>
          </aside>

          <section class="profile-main">
            <el-card class="info-card content-panel" shadow="never">
              <template #header>
                <div class="panel-heading panel-heading--compact">
                  <div class="panel-title-group">
                    <div class="panel-title-inline">
                      <el-icon class="panel-title-inline-icon"><component :is="panelIcon" /></el-icon>
                      <h2 class="panel-title">{{ panelTitle }}</h2>
                      <span class="article-total article-total--inline">{{ panelBadge }}</span>
                    </div>
                  </div>
                </div>
              </template>

              <div v-if="activeMenu === 'articles'" class="article-panel">
                <div class="section-toolbar section-toolbar--controls">
                  <div class="content-actions content-actions--stacked">
                    <el-radio-group v-model="articleStatus" class="status-radio" @change="loadMyArticles(1)">
                      <el-radio-button :value="-1">全部</el-radio-button>
                      <el-radio-button :value="0">草稿</el-radio-button>
                      <el-radio-button :value="1">已发布</el-radio-button>
                    </el-radio-group>
                    <div class="search-shell">
                      <el-input
                        v-model="articleKeyword"
                        placeholder="搜索文章..."
                        clearable
                        class="keyword-input"
                        @keyup.enter="loadMyArticles(1)"
                      >
                        <template #prefix>
                          <el-icon><Search /></el-icon>
                        </template>
                      </el-input>
                      <el-button class="search-button" @click="loadMyArticles(1)">搜索</el-button>
                    </div>
                  </div>
                </div>

                <el-skeleton v-if="articleLoading" :rows="6" animated />
                <div v-else-if="myArticles.length === 0" class="empty-state">还没有文章，去写下第一篇吧。</div>
                <div v-else class="article-list-shell">
                  <div class="article-scroll-area">
                    <div class="article-list">
                      <ArticleCard
                        v-for="(article, idx) in myArticles"
                        :key="String(article.id)"
                        :article="article"
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
              </div>

              <div v-else-if="activeMenu === 'likes'" class="article-panel">
                <el-skeleton v-if="likedLoading" :rows="6" animated />
                <div v-else-if="myLikedArticles.length === 0" class="empty-state">还没有点赞过文章。</div>
                <div v-else class="article-list-shell">
                  <div class="article-scroll-area">
                    <div class="article-list">
                      <ArticleCard
                        v-for="(article, idx) in myLikedArticles"
                        :key="String(article.id)"
                        :article="article"
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
              </div>

              <div v-else-if="activeMenu === 'favorites'" class="article-panel">
                <el-skeleton v-if="favLoading" :rows="6" animated />
                <div v-else-if="myFavoriteArticles.length === 0" class="empty-state">还没有收藏的文章。</div>
                <div v-else class="article-list-shell">
                  <div class="article-scroll-area">
                    <div class="article-list">
                      <ArticleCard
                        v-for="(article, idx) in myFavoriteArticles"
                        :key="String(article.id)"
                        :article="article"
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
              </div>

              <div v-else-if="activeMenu === 'settings'" class="settings-panel">
                <div v-if="user" class="profile-edit">
                  <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-position="top" class="profile-form">
                    <el-form-item label="头像" prop="avatar">
                      <div class="avatar-edit-row">
                        <el-avatar :size="88" :src="profileForm.avatar" class="form-avatar">
                          {{ String(profileForm.nickname || user.username || 'U').charAt(0) }}
                        </el-avatar>
                        <div class="avatar-edit-copy">
                          <div class="avatar-edit-title">上传新的头像</div>
                          <div class="avatar-edit-hint">建议使用清晰的正方形图片，最大支持 10MB，上传后会自动压缩。</div>
                          <el-upload
                            :show-file-list="false"
                            :before-upload="beforeAvatarUpload"
                            :http-request="handleAvatarUpload"
                            class="avatar-upload-inline"
                          >
                            <el-button type="primary"><el-icon class="btn-icon"><Upload /></el-icon>更新头像</el-button>
                          </el-upload>
                        </div>
                      </div>
                    </el-form-item>

                    <div class="form-grid">
                      <el-form-item label="昵称" prop="nickname">
                        <el-input
                          v-model="profileForm.nickname"
                          maxlength="20"
                          show-word-limit
                          placeholder="给自己起一个更有辨识度的名字"
                        />
                      </el-form-item>
                      <el-form-item label="用户名">
                        <el-input :model-value="user.username || '--'" disabled />
                      </el-form-item>
                    </div>

                    <div class="form-grid">
                      <el-form-item label="邮箱">
                        <el-input :model-value="user.email || '未绑定'" disabled />
                      </el-form-item>
                      <el-form-item label="手机号">
                        <el-input :model-value="user.phone || '未绑定'" disabled />
                      </el-form-item>
                    </div>

                    <el-form-item label="个人介绍" prop="bio">
                      <el-input
                        v-model="profileForm.bio"
                        type="textarea"
                        :rows="5"
                        maxlength="160"
                        show-word-limit
                        resize="none"
                        placeholder="写一句能代表你的话，比如喜欢的方向、日常状态，或者一句有你味道的签名。"
                      />
                    </el-form-item>

                    <div class="profile-form-actions">
                      <el-button type="primary" :loading="profileSaving" @click="handleSaveProfile">保存资料</el-button>
                      <el-button @click="resetProfileForm">重置</el-button>
                      <el-button @click="openPasswordDialog"><el-icon><Lock /></el-icon>修改密码</el-button>
                    </div>
                  </el-form>
                </div>
                <el-skeleton v-else :rows="6" animated />
              </div>

              <div v-else-if="activeMenu === 'trust'" class="settings-panel">
                <ProfileTrustRequestPanel :user="user" />
              </div>
            </el-card>
          </section>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="420px"
      :close-on-click-modal="false"
      class="password-dialog"
    >
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-position="top" class="password-form">
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" show-password clearable />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码，至少 6 位"
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
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Document, Lock, Medal, Postcard, Search, Star, Upload, User } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useUserStore } from '@/stores/user'
import { changePassword, getUserInfo, updateProfile } from '@/api/auth'
import { uploadAvatar } from '@/api/upload'
import { getTrustLevelLabel, getUserSecondaryLabel } from '@/utils/permission'
import { AVATAR_MAX_MB, createConfirmPasswordRule, validateImageFile } from '@/utils/validation'
import { deleteArticle, getMyArticles, getMyFavoriteArticles, getMyLikedArticles } from '@/api/article'
import ArticleCard from '@/components/ArticleCard/ArticleCard.vue'
import ProfileTrustRequestPanel from './ProfileTrustRequestPanel.vue'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const user = ref(userStore.user)
const activeMenu = ref<'articles' | 'likes' | 'favorites' | 'settings' | 'trust'>('settings')
const roleText = computed(() => getTrustLevelLabel(user.value))
const trustLevelText = computed(() => (user.value ? getTrustLevelLabel(user.value) : '--'))

const panelTitle = computed(() => {
  if (activeMenu.value === 'articles') return '我的文章'
  if (activeMenu.value === 'likes') return '我的点赞'
  if (activeMenu.value === 'favorites') return '我的收藏'
  if (activeMenu.value === 'trust') return '受信申请'
  return '个人中心'
})

const panelSubtitle = computed(() => {
  if (activeMenu.value === 'articles') return '记录你的创作与成长轨迹，管理已发布与草稿内容。'
  if (activeMenu.value === 'likes') return '把喜欢过的内容安静收好，随时回来继续阅读。'
  if (activeMenu.value === 'favorites') return '整理值得反复回看的文章，保留你的专属灵感清单。'
  return '在这里更新头像、昵称与个人简介，让你的角色名片更完整。'
})

void panelSubtitle

const panelBadge = computed(() => {
  if (activeMenu.value === 'articles') return `共 ${articleTotal.value} 篇`
  if (activeMenu.value === 'likes') return `共 ${likedTotal.value} 篇`
  if (activeMenu.value === 'favorites') return `共 ${favTotal.value} 篇`
  if (activeMenu.value === 'trust') return '权限申请'
  return trustLevelText.value
})

const panelIcon = computed(() => {
  if (activeMenu.value === 'articles') return Document
  if (activeMenu.value === 'likes') return Medal
  if (activeMenu.value === 'favorites') return Star
  if (activeMenu.value === 'trust') return Postcard
  return User
})

const sidebarArchetype = computed(() => getUserSecondaryLabel(user.value))

const profileFormRef = ref<FormInstance>()
const profileSaving = ref(false)
const profileForm = reactive({ nickname: '', avatar: '', bio: '' })
const profileRules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度需在 2 到 20 个字符之间', trigger: 'blur' },
  ],
  avatar: [{ required: true, message: '请上传头像', trigger: 'change' }],
  bio: [{ max: 160, message: '个人介绍最多 160 个字符', trigger: 'blur' }],
}

const passwordFormRef = ref<FormInstance>()
const passwordLoading = ref(false)
const passwordDialogVisible = ref(false)
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    createConfirmPasswordRule(() => passwordForm.newPassword, '两次输入的新密码不一致'),
  ],
}

const articleStatus = ref(-1)
const articleKeyword = ref('')
const articleLoading = ref(false)
const myArticles = ref<any[]>([])
const articlePage = ref(1)
const articlePageSize = 2
const articleTotal = ref(0)

const likedLoading = ref(false)
const myLikedArticles = ref<any[]>([])
const likedPage = ref(1)
const likedPageSize = 2
const likedTotal = ref(0)

const favLoading = ref(false)
const myFavoriteArticles = ref<any[]>([])
const favPage = ref(1)
const favPageSize = 2
const favTotal = ref(0)

const bannerProfile = computed(() => ({
  nickname: user.value?.nickname || user.value?.username || '未登录',
  username: user.value?.username || '--',
  avatar: user.value?.avatar || '',
  bio: user.value?.bio || '',
}))

const syncProfileForm = (nextUser = user.value) => {
  if (!nextUser) return
  profileForm.nickname = nextUser.nickname || nextUser.username || ''
  profileForm.avatar = nextUser.avatar || ''
  profileForm.bio = nextUser.bio || ''
}

const loadUser = async () => {
  try {
    const data = await getUserInfo()
    userStore.setUser(data)
    user.value = data
    syncProfileForm(data)
  } catch {
    ElMessage.error('获取用户信息失败')
  }
}

const handleMenuSelect = (index: string) => {
  activeMenu.value = index as typeof activeMenu.value
  router.replace({ query: { ...route.query, tab: index } })
}

const syncActiveMenuFromRoute = () => {
  const tab = route.query.tab
  if (tab === 'articles' || tab === 'likes' || tab === 'favorites' || tab === 'settings' || tab === 'trust') {
    activeMenu.value = tab
  } else {
    activeMenu.value = 'settings'
  }
}

const resetProfileForm = () => {
  syncProfileForm()
  profileFormRef.value?.clearValidate()
}

const handleSaveProfile = async () => {
  if (!profileFormRef.value) return
  try {
    await profileFormRef.value.validate()
    profileSaving.value = true
    const updated = await updateProfile({
      nickname: profileForm.nickname.trim(),
      avatar: profileForm.avatar,
      bio: profileForm.bio.trim(),
    })
    userStore.setUser(updated)
    user.value = updated
    syncProfileForm(updated)
    ElMessage.success('个人资料已更新')
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      ElMessage.error((err as { message?: string }).message ?? '保存失败')
    }
  } finally {
    profileSaving.value = false
  }
}

const beforeAvatarUpload = (file: File) => {
  const result = validateImageFile(file, AVATAR_MAX_MB)
  if (!result.valid) {
    ElMessage.error(result.message)
    return false
  }
  return true
}

const handleAvatarUpload = async (options: { file: File }) => {
  try {
    const res = await uploadAvatar(options.file)
    profileForm.avatar = res.url
    ElMessage.success('头像上传成功，记得保存资料')
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      ElMessage.error((err as { message?: string }).message ?? '上传失败')
    }
  }
}

const openPasswordDialog = () => {
  passwordDialogVisible.value = true
  nextTick(() => passwordFormRef.value?.clearValidate())
}

const loadMyArticles = async (page = 1) => {
  articlePage.value = page
  articleLoading.value = true
  try {
    const res = await getMyArticles({
      page,
      size: articlePageSize,
      status: articleStatus.value === -1 ? undefined : articleStatus.value,
      keyword: articleKeyword.value || undefined,
    })
    myArticles.value = res?.list ?? []
    articleTotal.value = res?.total ?? 0
  } catch (err) {
    console.error('加载我的文章失败', err)
  } finally {
    articleLoading.value = false
  }
}

const loadMyLikedArticles = async (page = 1) => {
  likedPage.value = page
  likedLoading.value = true
  try {
    const res = await getMyLikedArticles({ page, size: likedPageSize })
    myLikedArticles.value = res?.list ?? []
    likedTotal.value = res?.total ?? 0
  } catch (err) {
    console.error('加载点赞文章失败', err)
  } finally {
    likedLoading.value = false
  }
}

const loadMyFavoriteArticles = async (page = 1) => {
  favPage.value = page
  favLoading.value = true
  try {
    const res = await getMyFavoriteArticles({ page, size: favPageSize })
    myFavoriteArticles.value = res?.list ?? []
    favTotal.value = res?.total ?? 0
  } catch (err) {
    console.error('加载收藏文章失败', err)
  } finally {
    favLoading.value = false
  }
}

const handleEditArticle = (id: number | string) => router.push(`/article/edit/${String(id)}`)

const handleDeleteArticle = async (id: number | string) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？删除后将无法恢复。', '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteArticle(String(id))
    ElMessage.success('删除成功')
    loadMyArticles(articlePage.value)
  } catch {
    // noop
  }
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  try {
    await passwordFormRef.value.validate()
    passwordLoading.value = true
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordFormRef.value.resetFields()
    passwordDialogVisible.value = false
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      ElMessage.error((err as { message?: string }).message ?? '修改失败')
    }
  } finally {
    passwordLoading.value = false
  }
}

watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'articles' || tab === 'likes' || tab === 'favorites' || tab === 'settings' || tab === 'trust') {
      activeMenu.value = tab
      if (tab === 'articles') loadMyArticles(1)
      if (tab === 'likes') loadMyLikedArticles(1)
      if (tab === 'favorites') loadMyFavoriteArticles(1)
    }
  },
)

onMounted(() => {
  if (userStore.user) {
    user.value = userStore.user
    syncProfileForm(userStore.user)
  }
  syncActiveMenuFromRoute()
  loadUser()
  if (activeMenu.value === 'articles') loadMyArticles(1)
  if (activeMenu.value === 'likes') loadMyLikedArticles(1)
  if (activeMenu.value === 'favorites') loadMyFavoriteArticles(1)
})
</script>

<style scoped lang="scss">
.profile-page {
  --profile-page-bg: #f7f8fc;
  --profile-sakura: #f59bbc;
  --profile-sakura-soft: #fff1f6;
  --profile-mist: #c7bdd9;
  --profile-title: #4e5065;
  --profile-text: #70738a;
  --profile-muted: #9ca0b3;
  margin-top: 0;
  padding: 0 0 var(--spacing-xl);
  background:
    radial-gradient(circle at top left, rgba(245, 155, 188, 0.08), transparent 26%),
    radial-gradient(circle at top right, rgba(199, 189, 217, 0.12), transparent 30%),
    var(--profile-page-bg);
}

.profile-center {
  width: min(1120px, calc(100vw - 72px));
  margin: 0 auto;
}

.profile-shell {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.profile-sidebar {
  position: sticky;
  top: calc(64px + 24px);
  align-self: start;
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sidebar-user-card,
.profile-nav-card,
.info-card {
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.07);
  backdrop-filter: blur(16px);
}

.sidebar-user-card {
  position: relative;
  overflow: hidden;
  padding: 26px 24px 22px;
  background:
    linear-gradient(135deg, rgba(255, 251, 253, 0.94), rgba(249, 246, 255, 0.9)),
    rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(245, 155, 188, 0.09);
  box-shadow:
    0 16px 34px rgba(15, 23, 42, 0.045),
    0 8px 20px rgba(255, 182, 201, 0.04);
  backdrop-filter: blur(20px);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.sidebar-user-card::before {
  content: '';
  position: absolute;
  inset: auto -24px -42px auto;
  width: 124px;
  height: 124px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(245, 155, 188, 0.22), rgba(245, 155, 188, 0));
  pointer-events: none;
}

.sidebar-user-card::after {
  content: '';
  position: absolute;
  top: -18px;
  right: -20px;
  width: 120px;
  height: 120px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(245, 155, 188, 0.16), rgba(245, 155, 188, 0) 72%);
  opacity: 0.24;
  pointer-events: none;
}

.sidebar-user-card:hover {
  transform: translateY(-4px);
  border-color: rgba(245, 155, 188, 0.12);
  box-shadow:
    0 20px 40px rgba(15, 23, 42, 0.055),
    0 12px 30px rgba(255, 182, 201, 0.07);
}

.sidebar-user-main {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.sidebar-avatar-shell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 90px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(245, 155, 188, 0.95), rgba(199, 189, 217, 0.9));
  box-shadow:
    0 0 0 6px rgba(245, 155, 188, 0.12),
    0 16px 28px rgba(245, 155, 188, 0.12);
  transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
}

.sidebar-avatar-shell::before {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: inherit;
  background: radial-gradient(circle, rgba(245, 155, 188, 0.16), rgba(245, 155, 188, 0));
  filter: blur(10px);
  z-index: 0;
}

.sidebar-user-card:hover .sidebar-avatar-shell {
  transform: translateY(-2px);
  box-shadow:
    0 0 0 7px rgba(245, 155, 188, 0.14),
    0 18px 34px rgba(245, 155, 188, 0.16);
  filter: saturate(1.05);
}

.sidebar-avatar {
  position: relative;
  z-index: 1;
  border: 3px solid rgba(245, 155, 188, 0.18);
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.95),
    0 0 18px rgba(245, 155, 188, 0.2),
    0 14px 30px rgba(245, 155, 188, 0.12);
}

.sidebar-user-copy {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 78px;
  min-width: 0;
}

.sidebar-name {
  margin: 0;
  font-size: 22px;
  line-height: 1.05;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--profile-title);
}

.sidebar-identity-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-height: 28px;
}

.sidebar-role {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(245, 155, 188, 0.64), rgba(248, 177, 204, 0.72));
  color: rgba(255, 248, 251, 0.96);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-shadow: 0 1px 1px rgba(190, 92, 136, 0.1);
}

.sidebar-archetype {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(199, 189, 217, 0.26);
  background: linear-gradient(135deg, rgba(199, 189, 217, 0.18), rgba(248, 245, 255, 0.96));
  color: rgba(114, 103, 143, 0.9);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.sidebar-email {
  color: var(--profile-muted);
  font-size: 13px;
  line-height: 1.25;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.94);
  color: var(--text-secondary);
  font-size: 13px;
}

.profile-nav-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(199, 189, 217, 0.16);
  box-shadow:
    0 16px 34px rgba(15, 23, 42, 0.04),
    0 8px 24px rgba(255, 182, 201, 0.08);
  backdrop-filter: blur(16px);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.profile-nav-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 20px 38px rgba(15, 23, 42, 0.05),
    0 10px 28px rgba(255, 182, 201, 0.1);
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-right: none;
  background: transparent;
}

.nav-menu :deep(.el-menu-item) {
  position: relative;
  height: 52px;
  line-height: 52px;
  margin-bottom: 0;
  padding: 0 20px 0 18px;
  border-radius: 16px;
  color: var(--profile-text);
  background: transparent;
  border: none;
  overflow: hidden;
  transition:
    transform 0.22s ease,
    background 0.22s ease,
    box-shadow 0.22s ease,
    color 0.22s ease;
}

.nav-menu :deep(.el-menu-item::after) {
  display: none;
}

.nav-menu :deep(.el-menu-item:hover) {
  transform: translateX(6px);
  background: rgba(245, 155, 188, 0.12);
  box-shadow: 0 8px 20px rgba(245, 184, 204, 0.08);
}

.nav-menu :deep(.el-menu-item .el-icon) {
  position: relative;
  z-index: 1;
  width: 18px;
  margin-right: 10px;
  color: var(--profile-text);
  font-size: 18px;
  transition: color 0.22s ease, transform 0.22s ease;
}

.nav-menu :deep(.el-menu-item span) {
  position: relative;
  z-index: 1;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--profile-text);
  transition: color 0.22s ease;
}

.nav-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #fff1f6, rgba(255, 255, 255, 0.98));
  color: var(--profile-sakura);
  box-shadow:
    0 6px 18px rgba(245, 155, 188, 0.15),
    inset 0 0 10px rgba(245, 155, 188, 0.08);
  transform: scale(1.02);
}

.nav-menu :deep(.el-menu-item.is-active .el-icon) {
  color: var(--profile-sakura);
  transform: translateX(1px);
}

.nav-menu :deep(.el-menu-item.is-active span) {
  color: var(--profile-sakura);
}

.nav-menu :deep(.el-menu-item:hover .el-icon),
.nav-menu :deep(.el-menu-item:hover span) {
  color: var(--profile-sakura);
}

.profile-main {
  min-width: 0;
}

.info-card :deep(.el-card__header) {
  padding: 22px 28px 18px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.info-card :deep(.el-card__body) {
  padding: 24px 28px 26px;
}

.article-panel {
  width: min(100%, 620px);
  margin: 0 auto;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.panel-title-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-title-inline {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-title-inline-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--profile-sakura);
  font-size: 17px;
}

.panel-title {
  margin: 0;
  font-size: clamp(22px, 2.7vw, 28px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: var(--profile-title);
}

.panel-subtitle {
  margin: 0;
  max-width: 560px;
  font-size: 14px;
  line-height: 1.75;
  color: var(--profile-muted);
}

.panel-heading--compact {
  align-items: flex-start;
  justify-content: flex-start;
}

.article-total {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 15px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255, 244, 248, 0.96), rgba(255, 250, 252, 0.98));
  border: 1px solid rgba(245, 155, 188, 0.1);
  color: var(--profile-text);
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 10px 22px rgba(245, 155, 188, 0.08);
}

.article-total--inline {
  margin-left: 2px;
}

.section-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.section-toolbar--controls {
  justify-content: space-between;
  margin-bottom: 18px;
}

.content-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: center;
  justify-content: flex-start;
}

.content-actions--stacked {
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  padding: 8px 10px;
  border-radius: 20px;
  border: 1px solid rgba(245, 155, 188, 0.1);
  background:
    linear-gradient(135deg, rgba(255, 248, 251, 0.96), rgba(250, 248, 255, 0.92)),
    rgba(255, 255, 255, 0.88);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 10px 24px rgba(245, 155, 188, 0.05);
}

.status-radio {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 3px;
  border-radius: 999px;
  background: rgba(255, 250, 252, 0.96);
  border: none;
  box-shadow: none;
}

.status-radio :deep(.el-radio-button__inner) {
  border: none;
  border-radius: 999px;
  box-shadow: none;
  min-width: 64px;
  height: 32px;
  padding: 0 15px;
  background: transparent;
  color: var(--profile-text);
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition:
    color 0.22s ease,
    background 0.22s ease,
    box-shadow 0.22s ease,
    transform 0.22s ease;
}

.status-radio :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, rgba(245, 155, 188, 0.96), rgba(255, 198, 220, 0.96));
  color: #fff;
  box-shadow:
    0 10px 22px rgba(245, 155, 188, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.status-radio :deep(.el-radio-button:not(.is-active):hover .el-radio-button__inner) {
  color: var(--profile-sakura);
  background: rgba(255, 241, 246, 0.72);
}

.search-shell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 0;
  width: min(100%, 248px);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(245, 155, 188, 0.12);
  box-shadow:
    0 8px 18px rgba(245, 155, 188, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.88);
}

.keyword-input {
  flex: 1;
  width: auto;
}

.keyword-input :deep(.el-input__wrapper) {
  min-height: 36px;
  padding-left: 12px;
  padding-right: 2px;
  border-radius: 999px;
  box-shadow: none;
  background: transparent;
  display: flex;
  align-items: center;
}

.keyword-input :deep(.el-input__prefix) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.keyword-input :deep(.el-input__prefix-inner) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--profile-muted);
}

.keyword-input :deep(.el-input__inner) {
  height: 100%;
  color: var(--profile-text);
  font-size: 13px;
  line-height: 36px;
}

.keyword-input :deep(.el-input__inner::placeholder) {
  color: #a3a6bb;
}

.search-button {
  min-width: 76px;
  height: 36px;
  padding: 0 12px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(245, 155, 188, 0.96), rgba(255, 198, 220, 0.96));
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 10px 22px rgba(245, 155, 188, 0.18);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    filter 0.22s ease;
}

.search-button :deep(span) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.search-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(245, 155, 188, 0.22);
  filter: saturate(1.04);
}

.article-list-shell,
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pager {
  display: flex;
  justify-content: center;
}

.empty-state {
  padding: 72px 24px;
  text-align: center;
  color: var(--text-tertiary);
  border-radius: 22px;
  border: 1px dashed var(--border-color);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(248, 250, 252, 0.95));
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-form :deep(.el-form-item__label) {
  font-weight: 600;
}

.profile-form :deep(.el-input__wrapper),
.profile-form :deep(.el-textarea__inner) {
  border-radius: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}

.avatar-edit-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background:
    linear-gradient(135deg, rgba(255, 244, 248, 0.96), rgba(244, 248, 255, 0.96)),
    #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.form-avatar {
  flex-shrink: 0;
  border: 2px solid rgba(255, 122, 168, 0.18);
}

.avatar-edit-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avatar-edit-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.avatar-edit-hint {
  color: var(--text-tertiary);
  line-height: 1.7;
}

.profile-form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
}

@media (max-width: 1180px) {
  .profile-center {
    width: min(100%, calc(100vw - 40px));
  }

  .profile-shell {
    grid-template-columns: 264px minmax(0, 1fr);
  }

}

@media (max-width: 900px) {
  .profile-shell {
    grid-template-columns: 1fr;
  }

  .profile-sidebar {
    position: static;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 640px) {
  .profile-page {
    margin-top: 0;
    padding-top: 0;
  }

  .profile-center {
    width: calc(100vw - 24px);
  }

  .sidebar-user-card,
  .profile-nav-card,
  .info-card {
    border-radius: 24px;
  }

  .sidebar-user-main,
  .avatar-edit-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-card :deep(.el-card__header),
  .info-card :deep(.el-card__body) {
    padding-left: 18px;
    padding-right: 18px;
  }

  .content-actions--stacked {
    flex-direction: column;
    align-items: stretch;
    padding: 0;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .status-radio,
  .search-shell {
    width: 100%;
  }

  .keyword-input {
    width: 100%;
  }

  .search-shell {
    flex-direction: column;
    align-items: stretch;
    border-radius: 24px;
  }

  .search-button {
    width: 100%;
  }
}
</style>
