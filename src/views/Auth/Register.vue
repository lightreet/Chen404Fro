<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-banner">
        <div class="banner-content">
          <img src="/logo.png" alt="Chen404" class="banner-logo" />
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

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            class="register-form"
            @keyup.enter="handleRegister"
          >
            <el-form-item prop="username">
              <el-input
                v-model="form.username"
                placeholder="请输入用户名"
                size="large"
                :prefix-icon="User"
                maxlength="20"
              />
            </el-form-item>

            <el-form-item prop="email">
              <el-input
                v-model="form.email"
                placeholder="请输入邮箱"
                size="large"
                :prefix-icon="Message"
              />
            </el-form-item>

            <el-form-item prop="code">
              <div class="verify-code-wrapper">
                <el-input
                  v-model="form.code"
                  placeholder="请输入邮箱验证码"
                  size="large"
                  :prefix-icon="Key"
                  maxlength="6"
                />
                <el-button
                  type="primary"
                  :disabled="codeSending || codeCountdown > 0"
                  @click="sendVerifyCode"
                >
                  {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="请确认密码"
                size="large"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <div class="username-hint">
              用户名会作为默认昵称使用，注册后可在个人中心再改成更喜欢的名字。
            </div>

            <div class="form-agreement">
              <el-checkbox v-model="agreement">
                我已阅读并同意
                <a href="#" @click.prevent="agreementDialogVisible = true">《用户协议》</a>
                和
                <a href="#" @click.prevent="privacyDialogVisible = true">《隐私政策》</a>
              </el-checkbox>
            </div>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="submit-btn"
                :loading="loading"
                :disabled="!agreement"
                @click="handleRegister"
              >
                立即注册
              </el-button>
            </el-form-item>
          </el-form>

          <div class="auth-footer">
            <p>
              已有账号？
              <router-link to="/login" class="link">立即登录</router-link>
            </p>
            <router-link to="/" class="back-link">
              <el-icon><ArrowLeft /></el-icon>
              返回首页
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="agreementDialogVisible"
      title="用户协议"
      width="720px"
      class="legal-modal legal-modal--agreement"
      align-center
    >
      <div class="legal-dialog">
        <div class="legal-hero">
          <span class="legal-badge">Chen404 约定</span>
          <h3>欢迎来到我们的小宇宙</h3>
          <p class="legal-lead">
            欢迎来到 Chen404。下面这份协议是我们的核心原则，希望你能认真阅读并遵守。
          </p>
        </div>
        <section v-for="section in agreementSections" :key="section.title" class="legal-section">
          <h4>{{ section.title }}</h4>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
        </section>
      </div>
      <template #footer>
        <el-button @click="agreementDialogVisible = false">我知道了</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="privacyDialogVisible"
      title="隐私政策"
      width="720px"
      class="legal-modal legal-modal--privacy"
      align-center
    >
      <div class="legal-dialog">
        <div class="legal-hero">
          <span class="legal-badge">Chen404 隐私说明</span>
          <h3>你的信息会被温柔对待</h3>
          <p class="legal-lead">
            我们尊重你的隐私，也不打算把你的信息变成全网漂流瓶。下面会说明我们收集什么、为什么收集，以及怎么保护这些信息。
          </p>
        </div>
        <section v-for="section in privacySections" :key="section.title" class="legal-section">
          <h4>{{ section.title }}</h4>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
        </section>
      </div>
      <template #footer>
        <el-button @click="privacyDialogVisible = false">明白了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Key, Lock, Message, User } from '@element-plus/icons-vue';
import { login, register, sendVerifyCode as sendVerifyCodeApi } from '@/api/auth';
import { useUserStore } from '@/stores/user';
import { createConfirmPasswordRule, createUsernameRules } from '@/utils/validation';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref();
const loading = ref(false);
const agreement = ref(false);
const codeSending = ref(false);
const codeCountdown = ref(0);
const agreementDialogVisible = ref(false);
const privacyDialogVisible = ref(false);

const form = reactive({
  username: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
});

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

const sendVerifyCode = async () => {
  if (!form.email.trim()) {
    ElMessage.warning('请先输入邮箱');
    return;
  }

  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailReg.test(form.email)) {
    ElMessage.warning('邮箱格式不正确');
    return;
  }

  codeSending.value = true;
  try {
    await sendVerifyCodeApi({ email: form.email, type: 'register' });
    ElMessage.success('验证码已发送到邮箱');

    codeCountdown.value = 60;
    const timer = window.setInterval(() => {
      codeCountdown.value -= 1;
      if (codeCountdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (error) {
    console.error('发送验证码失败:', error);
    ElMessage.error('发送验证码失败，请稍后重试');
  } finally {
    codeSending.value = false;
  }
};

const handleRegister = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    await register({
      username: form.username,
      password: form.password,
      nickname: form.username,
      email: form.email,
      code: form.code,
      registerType: 'email',
    });

    const loginRes = await login({ username: form.username, password: form.password });
    userStore.login(loginRes.user, loginRes.token, {
      remember: true,
      refreshToken: loginRes.refreshToken,
    });

    ElMessage.success('注册成功');
    router.push('/');
  } catch (error) {
    console.error('注册失败:', error);
  } finally {
    loading.value = false;
  }
};
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
  :deep(.el-input__wrapper) {
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

  :deep(.el-input) {
    flex: 1;
    min-width: 0;
    height: var(--code-input-height);
  }

  :deep(.el-input__wrapper) {
    height: var(--code-input-height);
    min-height: var(--code-input-height);
    box-sizing: border-box;
  }

  :deep(.el-button) {
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

.legal-dialog {
  position: relative;
  max-height: 62vh;
  overflow-y: auto;
  padding: 4px 8px 4px 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(251, 114, 153, 0.45) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(251, 114, 153, 0.4);
    border-radius: 999px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.legal-hero {
  position: relative;
  margin-bottom: 20px;
  padding: 22px 22px 18px;
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.9), transparent 34%),
    linear-gradient(135deg, rgba(251, 114, 153, 0.18), rgba(255, 133, 167, 0.1));
  border: 1px solid rgba(251, 114, 153, 0.16);
  box-shadow: 0 14px 32px rgba(251, 114, 153, 0.12);
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    right: -28px;
    bottom: -28px;
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: rgba(251, 114, 153, 0.1);
  }

  h3 {
    position: relative;
    z-index: 1;
    margin: 0 0 10px;
    font-size: 24px;
    color: var(--text-primary);
    line-height: 1.3;
  }
}

.legal-badge {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(251, 114, 153, 0.18);
  color: var(--primary-dark);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.legal-lead {
  position: relative;
  z-index: 1;
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.85;
  font-size: 14px;
}

.legal-section + .legal-section {
  margin-top: 14px;
}

.legal-section {
  padding: 18px 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(251, 114, 153, 0.1);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);

  h4 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 12px;
    font-size: 16px;
    color: var(--text-primary);
    line-height: 1.4;

    &::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      box-shadow: 0 0 0 5px rgba(251, 114, 153, 0.12);
      flex-shrink: 0;
    }
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.9;
    font-size: 14px;
  }

  p + p {
    margin-top: 10px;
  }
}

.legal-modal {
  :deep(.el-overlay-dialog) {
    backdrop-filter: blur(10px);
  }

  :deep(.el-dialog) {
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(251, 114, 153, 0.14);
    box-shadow: 0 24px 64px rgba(34, 34, 34, 0.16);
    background:
      linear-gradient(180deg, rgba(255, 249, 251, 0.98), rgba(255, 255, 255, 0.98));
  }

  :deep(.el-dialog__header) {
    margin-right: 0;
    padding: 22px 24px 14px;
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 42%),
      linear-gradient(135deg, rgba(251, 114, 153, 0.18), rgba(255, 133, 167, 0.08));
    border-bottom: 1px solid rgba(251, 114, 153, 0.12);
  }

  :deep(.el-dialog__title) {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 0.01em;
  }

  :deep(.el-dialog__headerbtn) {
    top: 18px;
    right: 18px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.75);
    transition: all 0.25s ease;
  }

  :deep(.el-dialog__headerbtn:hover) {
    background: rgba(251, 114, 153, 0.12);
  }

  :deep(.el-dialog__body) {
    padding: 22px 24px 18px;
  }

  :deep(.el-dialog__footer) {
    padding: 0 24px 24px;
  }

  :deep(.el-button) {
    min-width: 116px;
    border-radius: 999px;
    border-color: rgba(251, 114, 153, 0.18);
  }
}

.legal-modal--agreement {
  :deep(.el-dialog__header) {
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 42%),
      linear-gradient(135deg, rgba(251, 114, 153, 0.2), rgba(255, 176, 201, 0.1));
  }
}

.legal-modal--privacy {
  :deep(.el-dialog__header) {
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 42%),
      linear-gradient(135deg, rgba(255, 168, 204, 0.18), rgba(255, 220, 228, 0.16));
  }
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

  .legal-dialog {
    max-height: 52vh;
    padding-right: 2px;
  }

  .legal-hero {
    padding: 18px 16px 16px;

    h3 {
      font-size: 20px;
    }
  }

  .legal-section {
    padding: 16px;
  }

  .legal-modal {
    :deep(.el-dialog) {
      width: calc(100vw - 24px) !important;
    }

    :deep(.el-dialog__header) {
      padding: 18px 18px 12px;
    }

    :deep(.el-dialog__body) {
      padding: 18px;
    }

    :deep(.el-dialog__footer) {
      padding: 0 18px 18px;
    }
  }
}
</style>
