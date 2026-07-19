<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-banner">
        <div class="banner-content">
          <img :src="siteLogo" :alt="siteName" class="banner-logo" />
          <h2 class="banner-title">加入我们</h2>
          <p class="banner-desc">创建账号，开启你的 Chen404 小宇宙</p>
        </div>
        <div class="banner-decoration">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
          <div class="circle circle-3"></div>
        </div>
      </div>

      <div class="auth-form-wrapper">
        <div class="auth-form">
          <h3 class="form-title">创建账号</h3>

          <UiForm
            ref="formRef"
            :model="form"
            :rules="rules"
            class="register-form"
            @keyup.enter="handleRegister"
          >
            <UiFormField prop="username">
              <UiInput
                v-model="form.username"
                placeholder="请输入用户名"
                size="lg"
                prefix-icon="user"
                maxlength="20"
              />
            </UiFormField>

            <UiFormField prop="email">
              <AuthEmailField
                v-model="form.email"
                placeholder="请输入邮箱账号"
                size="lg"
              />
            </UiFormField>

            <UiFormField prop="code">
              <div class="verify-code-wrapper">
                <UiInput
                  v-model="form.code"
                  placeholder="请输入邮箱验证码"
                  size="lg"
                  prefix-icon="key"
                  maxlength="6"
                />
                <UiButton variant="primary" :disabled="codeSending || codeCountdown > 0" @click="sendVerifyCode">
                  {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
                </UiButton>
              </div>
            </UiFormField>

            <UiFormField prop="password">
              <UiInput
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                size="lg"
                prefix-icon="lock"
              />
            </UiFormField>

            <UiFormField prop="confirmPassword">
              <UiInput
                v-model="form.confirmPassword"
                type="password"
                placeholder="请确认密码"
                size="lg"
                prefix-icon="lock"
              />
            </UiFormField>

            <div class="username-hint">
              用户名会作为默认昵称使用，注册后可在个人中心再改成更喜欢的名字。
            </div>

            <div class="form-agreement">
              <UiCheckbox v-model="agreement">
                我已阅读并同意
                <a href="#" @click.prevent="openLegalDocument('agreement')">《用户协议》</a>
                和
                <a href="#" @click.prevent="openLegalDocument('privacy')">《隐私政策》</a>
              </UiCheckbox>
            </div>

            <UiFormField>
              <UiButton
                variant="primary"
                size="lg"
                class="submit-btn"
                :loading="loading"
                :disabled="!agreement"
                @click="handleRegister"
              >
                立即注册
              </UiButton>
            </UiFormField>
          </UiForm>

          <div class="auth-footer">
            <p>
              已有账号？
              <router-link to="/login" class="link">立即登录</router-link>
            </p>
            <router-link to="/" class="back-link">
              <UiIcon name="arrow-left" />
              返回首页
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <UiDialog
      v-model="legalDialogVisible"
      :title="activeLegalDocument.title"
      width="760px"
      panel-class="legal-modal"
    >
      <div class="legal-document">
        <p class="legal-summary">{{ activeLegalDocument.summary }}</p>

        <div class="legal-sections">
          <section v-for="section in activeLegalDocument.sections" :key="section.title" class="legal-section">
            <h3>{{ section.title }}</h3>
            <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
          </section>
        </div>
      </div>
      <template #footer>
        <UiButton variant="secondary" @click="legalDialogVisible = false">关闭</UiButton>
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { notify } from '@/lib/feedback';
import { AuthEmailField, UiButton, UiCheckbox, UiDialog, UiForm, UiFormField, UiIcon, UiInput } from '@/components/ui'
import { login, register, sendVerifyCode as sendVerifyCodeApi } from '@/api/auth';
import { useSiteConfig } from '@/composables/useSiteConfig';
import { useUserStore } from '@/stores/user';
import { resolveSiteLogo, resolveSiteName } from '@/utils/siteConfig';
import { notifyAuthFailure } from '@/utils/authFeedback';
import { createConfirmPasswordRule, createUsernameRules } from '@/utils/validation';

const router = useRouter();
const userStore = useUserStore();
const { siteConfig, loadSiteConfig } = useSiteConfig();
const formRef = ref();
const loading = ref(false);
const agreement = ref(false);
const codeSending = ref(false);
const codeCountdown = ref(0);
const countdownTimer = ref<number | null>(null);
const legalDialogVisible = ref(false);
const activeLegalType = ref<'agreement' | 'privacy'>('agreement');

const form = reactive({
  username: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
});
const siteName = computed(() => resolveSiteName(siteConfig.value));
const siteLogo = computed(() => resolveSiteLogo(siteConfig.value));

const agreementSections = [
  {
    title: '1. 这是个什么地方',
    paragraphs: [
      'Chen404 是一个内容社区与个人博客站点，适合写文章、记想法、聊技术，也欢迎认真分享生活碎片。',
      '注册账号后，你可以登录、互动、评论、管理自己的内容。我们希望这里像一个安静但有趣的小角落。',
    ],
  },
  {
    title: '2. 关于账号',
    paragraphs: [
      '用户名需要符合站点规则并保持唯一。注册成功后，系统会默认把用户名作为你的昵称，后续你可以在个人中心再修改。',
      '请妥善保管你的账号和密码。如果你把密码写在便签上贴到显示器边框，那这部分安全风险多半要你自己承担。',
    ],
  },
  {
    title: '3. 允许做的事与不允许做的事',
    paragraphs: [
      '你可以正常浏览、发文、互动、收藏、点赞，也欢迎把这里当成一个长期经营的小站。',
      '你不可以发布违法违规、辱骂骚扰、恶意刷量、冒充他人、传播恶意程序，或者任何会让站点和其他用户头大的内容。',
    ],
  },
  {
    title: '4. 内容与责任',
    paragraphs: [
      '你发布的内容通常仍归你自己所有，但你需要授权站点在展示、存储、备份、推荐和运营范围内合理使用这些内容。',
      '如果你发布的内容侵犯他人权益，或者引发投诉、争议、风险，请你配合处理；必要时站点有权删除内容或限制账号功能。',
    ],
  },
  {
    title: '5. 平台保留的权利',
    paragraphs: [
      '为了维护社区秩序和服务体验，我们可以根据实际情况对违规内容进行删除、屏蔽、限流、封禁，或调整产品功能。',
      '我们会尽量让站点稳定运行，但不能保证它永远不会更新、维护、偶尔抽风，或者因为现实世界过于复杂而作出调整。',
    ],
  },
  {
    title: '6. 协议更新',
    paragraphs: [
      '如果协议发生重要变化，我们会通过合适方式提醒你。你继续使用站点，一般视为接受更新后的协议内容。',
      '如果你不同意新的规则，也可以停止使用相关服务。',
    ],
  },
];

const privacySections = [
  {
    title: '1. 我们会收集哪些信息',
    paragraphs: [
      '当你注册或登录时，我们会处理你提供的用户名、邮箱、密码摘要、头像、昵称等与账号有关的信息。',
      '在你使用站点的过程中，我们也可能记录必要的日志信息，例如登录时间、登录 IP、部分操作记录，用于安全审计和问题排查。',
    ],
  },
  {
    title: '2. 为什么要收集这些信息',
    paragraphs: [
      '最直接的原因是让账号系统正常工作，例如完成注册、登录、验证码发送、资料展示、密码修改以及账号安全保护。',
      '此外，我们也会基于这些信息维护站点稳定性，比如识别异常登录、排查错误、处理滥用行为和改进产品体验。',
    ],
  },
  {
    title: '3. 我们如何使用这些信息',
    paragraphs: [
      '这些信息主要用于账号服务、内容互动、安全风控、站点运营以及功能优化。',
      '我们不会因为你注册了一个账号，就把你的资料打包卖给什么神秘广告联盟或者流量黑市。',
    ],
  },
  {
    title: '4. 信息共享与披露',
    paragraphs: [
      '除法律法规要求、保护站点和用户安全、或经你明确同意外，我们不会随意向无关第三方披露你的个人信息。',
      '如果站点使用第三方能力，例如邮件发送、对象存储或基础云服务，这些服务商只会在必要范围内接触相关数据。',
    ],
  },
  {
    title: '5. 数据存储与保护',
    paragraphs: [
      '我们会尽量采取合理的安全措施保护你的信息，例如访问控制、最小化存储、日志留痕以及必要的数据备份。',
      '不过互联网世界不存在绝对 100% 安全。如果发生安全事件，我们会按实际情况采取补救措施，并在必要时进行通知。',
    ],
  },
  {
    title: '6. 你的权利',
    paragraphs: [
      '你可以在站点允许的范围内查看、修改你的资料信息，例如昵称、头像等。',
      '如果后续你希望注销账号、删除部分信息，或对隐私处理方式有疑问，可以通过站点提供的联系渠道进行反馈。',
    ],
  },
];

const legalDocuments = {
  agreement: {
    title: '用户协议',
    summary: '使用 Chen404 前，请了解账号、内容发布与社区互动的基本规则。',
    sections: agreementSections,
  },
  privacy: {
    title: '隐私政策',
    summary: '了解我们会收集哪些信息、为什么使用，以及你拥有的相关权利。',
    sections: privacySections,
  },
};
const activeLegalDocument = computed(() => legalDocuments[activeLegalType.value]);

function openLegalDocument(type: 'agreement' | 'privacy') {
  activeLegalType.value = type;
  legalDialogVisible.value = true;
}

const rules = {
  username: createUsernameRules(),
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码长度需为 4-6 位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度需为 6-20 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    createConfirmPasswordRule(() => form.password),
  ],
};

function resetCountdown() {
  if (countdownTimer.value !== null) {
    window.clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
  codeCountdown.value = 0;
}

function startCountdown(seconds: number) {
  resetCountdown();
  codeCountdown.value = seconds;
  countdownTimer.value = window.setInterval(() => {
    codeCountdown.value -= 1;
    if (codeCountdown.value <= 0) {
      resetCountdown();
    }
  }, 1000);
}

const sendVerifyCode = async () => {
  if (codeSending.value || codeCountdown.value > 0) return;

  if (!form.email.trim()) {
    notify.warning('请先输入邮箱');
    return;
  }

  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailReg.test(form.email)) {
    notify.warning('邮箱格式不正确');
    return;
  }

  codeSending.value = true;
  try {
    const result = await sendVerifyCodeApi({ email: form.email.trim(), type: 'register' });
    notify.success('验证码已发送到邮箱');
    startCountdown(Math.max(1, result.expireSeconds > 60 ? 60 : result.expireSeconds));
  } catch (error) {
    console.error('发送验证码失败:', error);
    notifyAuthFailure(error, '验证码发送失败，请稍后重试');
  } finally {
    codeSending.value = false;
  }
};

const handleRegister = async () => {
  if (!formRef.value || loading.value) return;
  if (!agreement.value) {
    notify.warning('请先阅读并同意用户协议与隐私政策');
    return;
  }

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    await register({
      username: form.username.trim(),
      password: form.password,
      nickname: form.username.trim(),
      email: form.email.trim(),
      code: form.code.trim(),
      registerType: 'email',
    });
  } catch (error) {
    console.error('注册失败:', error);
    notifyAuthFailure(error, '注册失败，请检查填写内容后重试');
    loading.value = false;
    return;
  }

  try {
    const loginRes = await login({ username: form.username.trim(), password: form.password });
    userStore.login(loginRes.user, loginRes.token, {
      remember: true,
      refreshToken: loginRes.refreshToken,
    });

    notify.success('注册成功');
    await router.push('/');
  } catch (error) {
    console.error('注册后自动登录失败:', error);
    notify.warning({
      message: '账号已创建，但自动登录失败，请使用刚才的账号手动登录',
      duration: 5000,
      showClose: true,
    });
    await router.push('/login');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void loadSiteConfig();
});

onBeforeUnmount(() => {
  resetCountdown();
});
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 20px;
}

.auth-container {
  display: flex;
  width: 900px;
  min-height: 600px;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.auth-banner {
  width: 380px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: white;
  overflow: hidden;
}

.banner-content {
  text-align: center;
  z-index: 1;
}

.banner-logo {
  width: 180px;
  height: 120px;
  object-fit: contain;
  margin-bottom: 24px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
}

.banner-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 12px;
}

.banner-desc {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.banner-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: -50px;
  right: -50px;
}

.circle-2 {
  width: 120px;
  height: 120px;
  bottom: 80px;
  left: -40px;
}

.circle-3 {
  width: 80px;
  height: 80px;
  bottom: -20px;
  right: 60px;
  background: rgba(255, 255, 255, 0.15);
}

.auth-form-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.auth-form {
  width: 100%;
  max-width: 360px;
}

.form-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 24px;
  text-align: center;
}

.register-form {
  :deep(.ui-input) {
    border-radius: var(--radius-md);
  }
}

.verify-code-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  --code-input-height: 40px;
  --code-btn-height: 36px;

  :deep(.ui-input) {
    flex: 1;
    min-width: 0;
    height: var(--code-input-height);
    box-sizing: border-box;
  }

  :deep(.ui-button) {
    flex-shrink: 0;
    min-width: 120px;
    height: var(--code-btn-height);
    margin: 0;
  }
}

.username-hint {
  margin: -4px 0 16px;
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.6;
}

.form-agreement {
  margin-bottom: 20px;

  a {
    color: var(--primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.submit-btn {
  width: 100%;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border: none;
  font-size: 16px;
  font-weight: 500;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
  }
}

.auth-footer {
  margin-top: 24px;
  text-align: center;

  p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 12px;
  }

  .link {
    color: var(--primary);
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--text-tertiary);
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: var(--primary);
  }
}

.legal-document {
  max-height: min(62vh, 640px);
  overflow-y: auto;
  padding-right: 16px;
  scrollbar-gutter: stable;
}

.legal-summary {
  margin: 0 0 4px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--primary) 7%, var(--color-surface));
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.7;
  text-wrap: pretty;
}

.legal-sections {
  max-width: 70ch;
}

.legal-section {
  padding: 22px 2px;
  border-bottom: 1px solid var(--color-border-light);

  &:last-child {
    border-bottom: 0;
  }

  h3 {
    margin: 0 0 12px;
    color: var(--color-text-primary);
    font-size: 16px;
    font-weight: 650;
    line-height: 1.45;
    text-wrap: balance;
  }

  p {
    margin: 0;
    padding-left: 24px;
    color: var(--color-text-secondary);
    font-size: 15px;
    line-height: 1.8;
    text-wrap: pretty;
  }

  p + p {
    margin-top: 10px;
  }
}

:global(.legal-modal.ui-dialog) {
  overflow: hidden;
  border: 0;
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 40px rgba(34, 24, 30, 0.2);
}

:global(.legal-modal .ui-dialog__header) {
  flex-shrink: 0;
  padding: 22px 28px 18px;
  border-bottom: 1px solid var(--color-border-light);
}

:global(.legal-modal .ui-dialog__title) {
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 650;
}

:global(.legal-modal .ui-dialog__body) {
  padding: 20px 28px 0;
  overflow: hidden;
}

:global(.legal-modal .ui-dialog__footer) {
  flex-shrink: 0;
  padding: 16px 28px 20px;
}

:global(.legal-modal .ui-dialog__footer .ui-button) {
  min-width: 88px;
}

@media (max-width: 768px) {
  .auth-container {
    flex-direction: column;
    width: 100%;
    max-width: 420px;
  }

  .auth-banner {
    width: 100%;
    min-height: 180px;
    padding: 32px;
  }

  .banner-logo {
    width: 132px;
    height: 88px;
    margin-bottom: 16px;
  }

  .banner-title {
    font-size: 22px;
  }

  .auth-form-wrapper {
    padding: 32px 24px;
  }

  .legal-document {
    max-height: 56vh;
    padding-right: 8px;
  }

  .legal-summary {
    padding: 12px 14px;
  }

  .legal-section {
    padding: 18px 0;

    p {
      padding-left: 18px;
      font-size: 14px;
    }
  }

  :global(.legal-modal.ui-dialog) {
    width: calc(100vw - 24px) !important;
  }

  :global(.legal-modal .ui-dialog__header) {
    padding: 18px 18px 14px;
  }

  :global(.legal-modal .ui-dialog__body) {
    padding: 16px 18px 0;
  }

  :global(.legal-modal .ui-dialog__footer) {
    padding: 14px 18px 18px;
  }
}
</style>
