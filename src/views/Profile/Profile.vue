<template>
  <DefaultLayout>
    <div class="profile-page">
      <div class="profile-center">
        <div class="profile-shell">
          <aside class="profile-sidebar">
            <section class="sidebar-user-card">
              <div class="sidebar-user-main">
                <div class="sidebar-avatar-shell">
                  <UiAvatar :size="78" :src="bannerProfile.avatar" class="sidebar-avatar">
                    {{ String(bannerProfile.nickname || bannerProfile.username || 'U').charAt(0) }}
                  </UiAvatar>
                </div>
                <div class="sidebar-user-copy">
                  <h1 class="sidebar-name">{{ bannerProfile.nickname || '未登录' }}</h1>
                  <div class="sidebar-identity-row">
                    <span class="sidebar-role">{{ roleText }}</span>
                  </div>
                  <div class="sidebar-email">{{ user?.email || '暂未绑定邮箱' }}</div>
                </div>
              </div>
            </section>

            <section class="profile-nav-card">
              <nav class="nav-menu" role="tablist">
                <button
                  v-for="item in navItems"
                  :key="item.index"
                  type="button"
                  class="nav-menu-item"
                  :class="{ 'is-active': activeMenu === item.index }"
                  role="tab"
                  :aria-selected="activeMenu === item.index"
                  @click="handleMenuSelect(item.index)"
                >
                  <UiIcon :name="item.icon" />
                  <span>{{ item.label }}</span>
                </button>
              </nav>
            </section>
          </aside>

          <section class="profile-main">
            <UiPanel class="info-card content-panel">
              <template #title>
                <div class="panel-title-inline">
                  <UiIcon class="panel-title-inline-icon" :name="panelIcon" />
                  <h2 class="panel-title">{{ panelTitle }}</h2>
                  <span class="article-total article-total--inline">{{ panelBadge }}</span>
                </div>
              </template>

              <ProfileCreationPanel v-if="activeMenu === 'creations'" />

              <div v-else-if="activeMenu === 'likes'" class="article-panel">
                <UiSkeleton v-if="likedLoading" :rows="6" />
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
                    <UiPagination
                      :current="likedPage"
                      :page-size="likedPageSize"
                      :total="likedTotal"
                      @change="loadMyLikedArticles"
                    />
                  </div>
                </div>
              </div>

              <div v-else-if="activeMenu === 'favorites'" class="article-panel">
                <UiSkeleton v-if="favLoading" :rows="6" />
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
                    <UiPagination
                      :current="favPage"
                      :page-size="favPageSize"
                      :total="favTotal"
                      @change="loadMyFavoriteArticles"
                    />
                  </div>
                </div>
              </div>

              <div v-else-if="activeMenu === 'settings'" class="settings-panel">
                <div v-if="user" class="profile-edit">
                  <UiForm ref="profileFormRef" :model="profileForm" :rules="profileRules" label-position="top" class="profile-form">
                    <UiFormField label="头像" prop="avatar">
                      <div class="avatar-edit-row">
                        <UiAvatar :size="88" :src="profileForm.avatar" class="form-avatar">
                          {{ String(profileForm.nickname || user.username || 'U').charAt(0) }}
                        </UiAvatar>
                        <div class="avatar-edit-copy">
                          <div class="avatar-edit-title-row">
                            <div class="avatar-edit-title">上传新的头像</div>
                            <UiHintTooltip
                              content="建议使用清晰的正方形图片，最大支持 10MB，上传后会自动压缩。"
                              aria-label="查看头像上传说明"
                            />
                          </div>
                          <UiUpload
                            :show-file-list="false"
                            :before-upload="beforeAvatarUpload"
                            :http-request="handleAvatarUpload"
                            class="avatar-upload-inline"
                          >
                            <UiButton variant="primary" icon="upload">更新头像</UiButton>
                          </UiUpload>
                        </div>
                      </div>
                    </UiFormField>

                    <div class="form-grid">
                      <UiFormField label="昵称" prop="nickname">
                        <UiInput
                          v-model="profileForm.nickname"
                          maxlength="20"
                          show-word-limit
                          placeholder="给自己起一个更有辨识度的名字"
                        />
                      </UiFormField>
                      <UiFormField label="用户名">
                        <UiInput :model-value="user.username || '--'" disabled />
                      </UiFormField>
                    </div>

                    <div class="form-grid">
                      <UiFormField label="邮箱">
                        <UiInput :model-value="user.email || '未绑定'" disabled />
                      </UiFormField>
                      <UiFormField label="手机号">
                        <UiInput :model-value="user.phone || '未绑定'" disabled />
                      </UiFormField>
                    </div>

                    <UiFormField label="个人介绍" prop="bio">
                      <UiTextarea
                        v-model="profileForm.bio"
                        :rows="5"
                        maxlength="160"
                        show-count
                        resize="none"
                        placeholder="写一句能代表你的话，比如喜欢的方向、日常状态，或者一句有你味道的签名。"
                      />
                    </UiFormField>

                    <div class="form-grid privacy-grid">
                      <div class="privacy-field">
                        <div class="privacy-field__label">
                          <span id="profile-visibility-label">公开成员资料</span>
                          <UiHintTooltip
                            content="开启后，其他访客可以在成员列表和个人主页找到你。"
                            aria-label="查看成员资料公开说明"
                          />
                        </div>
                        <UiSwitch
                          v-model="profileForm.profileVisible"
                          aria-labelledby="profile-visibility-label"
                        />
                      </div>
                      <div class="privacy-field">
                        <div class="privacy-field__label">
                          <span id="email-visibility-label">公开邮箱</span>
                          <UiHintTooltip
                            content="仅在资料公开时生效；关闭后邮箱只在你自己的个人中心可见。"
                            aria-label="查看邮箱公开说明"
                          />
                        </div>
                        <UiSwitch
                          v-model="profileForm.emailPublic"
                          :disabled="!profileForm.profileVisible"
                          aria-labelledby="email-visibility-label"
                        />
                      </div>
                    </div>

                    <div class="profile-form-actions">
                      <UiButton variant="primary" :loading="profileSaving" @click="handleSaveProfile">保存资料</UiButton>
                      <UiButton variant="secondary" @click="resetProfileForm">重置</UiButton>
                      <UiButton variant="secondary" icon="lock" @click="openPasswordDialog">修改密码</UiButton>
                    </div>
                  </UiForm>
                </div>
                <UiSkeleton v-else :rows="6" />
              </div>

              <div v-else-if="activeMenu === 'trust'" class="settings-panel">
                <ProfileTrustRequestPanel :user="user" />
              </div>
            </UiPanel>
          </section>
        </div>
      </div>
    </div>

    <UiDialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="420px"
      :close-on-click-modal="false"
      class="password-dialog"
    >
      <UiForm ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-position="top" class="password-form">
        <UiFormField label="当前密码" prop="oldPassword">
          <UiInput v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" clearable />
        </UiFormField>
        <UiFormField label="新密码" prop="newPassword">
          <UiInput
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码，至少 6 位"
            clearable
          />
        </UiFormField>
        <UiFormField label="确认新密码" prop="confirmPassword">
          <UiInput
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            clearable
          />
        </UiFormField>
      </UiForm>
      <template #footer>
        <UiButton variant="text" @click="passwordDialogVisible = false">取消</UiButton>
        <UiButton variant="primary" :loading="passwordLoading" @click="handleChangePassword">确认修改</UiButton>
      </template>
    </UiDialog>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { notify } from '@/lib/feedback'
import { UiPanel, UiAvatar, UiButton, UiDialog, UiForm, UiFormField, UiHintTooltip, UiIcon, UiInput, UiPagination, UiSkeleton, UiSwitch, UiTextarea, UiUpload } from '@/components/ui'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useUserStore } from '@/stores/user'
import { changePassword, getUserInfo, updateProfile } from '@/api/auth'
import { uploadAvatar } from '@/api/upload'
import { getTrustLevelLabel } from '@/utils/permission'
import { AVATAR_MAX_MB, createConfirmPasswordRule, validateImageFile } from '@/utils/validation'
import type { FormItemRule } from '@/utils/validation'
import { notifyAuthFailure } from '@/utils/authFeedback'
import { getMyFavoriteArticles, getMyLikedArticles } from '@/api/article'
import ArticleCard from '@/components/ArticleCard/ArticleCard.vue'
import ProfileCreationPanel from './ProfileCreationPanel.vue'
import ProfileTrustRequestPanel from './ProfileTrustRequestPanel.vue'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const user = ref(userStore.user)
type ProfileMenu = 'creations' | 'likes' | 'favorites' | 'settings' | 'trust'

const activeMenu = ref<ProfileMenu>('settings')
const roleText = computed(() => getTrustLevelLabel(user.value))
const trustLevelText = computed(() => (user.value ? getTrustLevelLabel(user.value) : '--'))

const panelTitle = computed(() => {
  if (activeMenu.value === 'creations') return '我的创作'
  if (activeMenu.value === 'likes') return '我的点赞'
  if (activeMenu.value === 'favorites') return '我的收藏'
  if (activeMenu.value === 'trust') return '好友申请'
  return '个人中心'
})

const panelBadge = computed(() => {
  if (activeMenu.value === 'creations') return '内容管理'
  if (activeMenu.value === 'likes') return `共 ${likedTotal.value} 篇`
  if (activeMenu.value === 'favorites') return `共 ${favTotal.value} 篇`
  if (activeMenu.value === 'trust') return '好友申请'
  return trustLevelText.value
})

const panelIcon = computed(() => {
  if (activeMenu.value === 'creations') return 'edit'
  if (activeMenu.value === 'likes') return 'Medal'
  if (activeMenu.value === 'favorites') return 'Star'
  if (activeMenu.value === 'trust') return 'Postcard'
  return 'User'
})

const navItems: Array<{ index: string; icon: string; label: string }> = [
  { index: 'settings', icon: 'User', label: '个人中心' },
  { index: 'creations', icon: 'edit', label: '我的创作' },
  { index: 'likes', icon: 'Medal', label: '我的点赞' },
  { index: 'favorites', icon: 'Star', label: '我的收藏' },
]

type SimpleFormInstance = {
  validate: () => Promise<boolean>
  clearValidate: (props?: string | string[]) => void
}

const profileFormRef = ref<SimpleFormInstance>()
const profileSaving = ref(false)
const profileForm = reactive({
  nickname: '',
  avatar: '',
  bio: '',
  profileVisible: false,
  emailPublic: false,
})
const profileRules: Record<string, FormItemRule[]> = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度需在 2 到 20 个字符之间', trigger: 'blur' },
  ],
  avatar: [{ required: true, message: '请上传头像', trigger: 'change' }],
  bio: [{ max: 160, message: '个人介绍最多 160 个字符', trigger: 'blur' }],
}

const passwordFormRef = ref<SimpleFormInstance & { resetFields: () => void }>()
const passwordLoading = ref(false)
const passwordDialogVisible = ref(false)
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const passwordRules: Record<string, FormItemRule[]> = {
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
  profileForm.profileVisible = Boolean(nextUser.profileVisible)
  profileForm.emailPublic = Boolean(nextUser.emailPublic)
}

const loadUser = async () => {
  try {
    const data = await getUserInfo()
    userStore.setUser(data)
    user.value = data
    syncProfileForm(data)
  } catch {
    notify.error('获取用户信息失败')
  }
}

const handleMenuSelect = (index: string) => {
  const menu = index as ProfileMenu
  activeMenu.value = menu
  const { content: currentContent, ...query } = route.query
  router.replace({
    query: menu === 'creations'
      ? { ...query, tab: menu, content: currentContent ?? 'articles' }
      : { ...query, tab: menu },
  })
}

const resolveProfileMenu = (tab: unknown): ProfileMenu => {
  if (tab === 'articles' || tab === 'creations') return 'creations'
  if (tab === 'likes' || tab === 'favorites' || tab === 'settings' || tab === 'trust') return tab
  return 'settings'
}

const syncActiveMenuFromRoute = () => {
  activeMenu.value = resolveProfileMenu(route.query.tab)
  if (route.query.tab === 'articles') {
    void router.replace({
      query: {
        ...route.query,
        tab: 'creations',
        content: route.query.content ?? 'articles',
      },
    })
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
      profileVisible: profileForm.profileVisible,
      emailPublic: profileForm.profileVisible && profileForm.emailPublic,
    })
    userStore.setUser(updated)
    user.value = updated
    syncProfileForm(updated)
    notify.success('个人资料已更新')
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      notify.error((err as { message?: string }).message ?? '保存失败')
    }
  } finally {
    profileSaving.value = false
  }
}

const beforeAvatarUpload = (file: File) => {
  const result = validateImageFile(file, AVATAR_MAX_MB)
  if (!result.valid) {
    notify.error(result.message)
    return false
  }
  return true
}

const handleAvatarUpload = async (options: { file: File }) => {
  try {
    const res = await uploadAvatar(options.file)
    profileForm.avatar = res.url
    notify.success('头像上传成功，记得保存资料')
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      notify.error((err as { message?: string }).message ?? '上传失败')
    }
  }
}

const openPasswordDialog = () => {
  passwordDialogVisible.value = true
  nextTick(() => passwordFormRef.value?.clearValidate())
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

const handleChangePassword = async () => {
  if (!passwordFormRef.value || passwordLoading.value) return

  try {
    await passwordFormRef.value.validate()
  } catch {
    return
  }

  passwordLoading.value = true
  try {
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    notify.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordFormRef.value.resetFields()
    passwordDialogVisible.value = false
  } catch (err: unknown) {
    notifyAuthFailure(err, '密码修改失败，请检查原密码后重试')
  } finally {
    passwordLoading.value = false
  }
}

watch(
  () => route.query.tab,
  (tab) => {
    syncActiveMenuFromRoute()
    if (tab === 'likes') loadMyLikedArticles(1)
    if (tab === 'favorites') loadMyFavoriteArticles(1)
  },
)

onMounted(() => {
  if (userStore.user) {
    user.value = userStore.user
    syncProfileForm(userStore.user)
  }
  syncActiveMenuFromRoute()
  loadUser()
  if (activeMenu.value === 'likes') loadMyLikedArticles(1)
  if (activeMenu.value === 'favorites') loadMyFavoriteArticles(1)
})
</script>

<style scoped lang="scss">
.profile-page {
  --profile-sakura: #f59bbc;
  --profile-sakura-soft: #fff1f6;
  --profile-mist: #c7bdd9;
  --profile-title: #4e5065;
  --profile-text: #70738a;
  --profile-muted: #9ca0b3;
  margin-top: 0;
  padding: clamp(72px, 7vh, 88px) 0 var(--spacing-xl);
  background: transparent;
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
  top: calc(64px + clamp(72px, 7vh, 88px));
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
  background: transparent;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 20px 0 18px;
  border-radius: 16px;
  color: var(--profile-text);
  background: transparent;
  border: none;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  width: 100%;
  overflow: hidden;
  transition:
    transform 0.22s ease,
    background 0.22s ease,
    box-shadow 0.22s ease,
    color 0.22s ease;

  &:hover {
    transform: translateX(6px);
    background: rgba(245, 155, 188, 0.12);
    box-shadow: 0 8px 20px rgba(245, 184, 204, 0.08);
    color: var(--profile-sakura);
  }

  &.is-active {
    background: linear-gradient(135deg, #fff1f6, rgba(255, 255, 255, 0.98));
    color: var(--profile-sakura);
    box-shadow:
      0 6px 18px rgba(245, 155, 188, 0.15),
      inset 0 0 10px rgba(245, 155, 188, 0.08);
    transform: scale(1.02);
  }
}

.profile-main {
  min-width: 0;
}

.info-card {
  :deep(.ui-panel__header) {
    padding: 22px 28px 18px;
    border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  }
  :deep(.ui-panel__body) {
    padding: 24px 28px 26px;
  }
}

.article-panel {
  width: min(100%, 620px);
  margin: 0 auto;
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

.privacy-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  margin-bottom: 18px;
}

.privacy-field__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 28px;
  color: var(--color-text-primary);
  font-weight: 600;
  line-height: 1.4;
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

.avatar-edit-title-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.avatar-edit-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
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
    padding-top: 36px;
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

  .info-card :deep(.ui-panel__header),
  .info-card :deep(.ui-panel__body) {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>
