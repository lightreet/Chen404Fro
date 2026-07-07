<template>
  <div class="auth-page auth-page--forgot">
    <div class="auth-container">
      <div class="auth-banner">
        <div class="banner-content">
          <img :src="siteLogo" :alt="siteName" class="banner-logo" />
          <h2 class="banner-title">找回密码</h2>
          <p class="banner-desc">通过邮箱验证码重设密码。</p>
        </div>
        <div class="banner-decoration">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
          <div class="circle circle-3"></div>
        </div>
      </div>

        <div class="auth-form-wrapper">
        <div class="auth-form">
          <div class="form-heading">
            <h3 class="form-title">重置登录密码</h3>
          </div>

          <UiForm
            ref="formRef"
            :model="form"
            :rules="rules"
            class="forgot-form"
            @keyup.enter="handleResetPassword"
          >
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
                <UiButton
                  variant="primary"
                  size="lg"
                  :disabled="codeSending || codeCountdown > 0"
                  @click="handleSendCode"
                >
                  {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
                </UiButton>
              </div>
            </UiFormField>

            <UiFormField prop="newPassword">
              <UiInput
                v-model="form.newPassword"
                type="password"
                placeholder="请输入新密码"
                size="lg"
                prefix-icon="lock"
              />
            </UiFormField>

            <UiFormField prop="confirmPassword">
              <UiInput
                v-model="form.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                size="lg"
                prefix-icon="lock"
              />
            </UiFormField>

            <div class="security-tip">
              新密码建议同时包含字母与数字，避免与旧密码重复。
            </div>

            <UiFormField>
              <UiButton
                variant="primary"
                size="lg"
                class="submit-btn"
                :loading="loading"
                @click="handleResetPassword"
              >
                重置密码
              </UiButton>
            </UiFormField>
          </UiForm>

          <div class="auth-footer">
            <p>
              想起来了？
              <router-link to="/login" class="link">返回登录</router-link>
            </p>
            <router-link to="/" class="back-link">
              <UiIcon name="arrow-left" />
              返回首页
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { notify } from '@/lib/feedback';
import { AuthEmailField, UiButton, UiForm, UiFormField, UiIcon, UiInput } from '@/components/ui';
import { forgotPassword, sendVerifyCode } from '@/api/auth';
import { useSiteConfig } from '@/composables/useSiteConfig';
import { resolveSiteLogo, resolveSiteName } from '@/utils/siteConfig';
import { createConfirmPasswordRule } from '@/utils/validation';

const router = useRouter();
const { siteConfig, loadSiteConfig } = useSiteConfig();
const formRef = ref();
const loading = ref(false);
const codeSending = ref(false);
const codeCountdown = ref(0);
const countdownTimer = ref<number | null>(null);
const form = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
});
const siteName = computed(() => resolveSiteName(siteConfig.value));
const siteLogo = computed(() => resolveSiteLogo(siteConfig.value));

const rules = {
  email: [
    { required: true, message: '请输入注册邮箱', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (err?: Error) => void) => {
        if (!value) {
          callback(new Error('请输入注册邮箱'));
          return;
        }
        const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailReg.test(value)) {
          callback(new Error('邮箱格式不正确'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码长度需为 4-6 位', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '新密码长度需为 6-20 位', trigger: 'blur' },
  ],
  confirmPassword: [createConfirmPasswordRule(() => form.newPassword, '确认密码')],
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

async function handleSendCode() {
  if (!form.email.trim()) {
    notify.warning('请先输入注册邮箱');
    return;
  }

  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailReg.test(form.email)) {
    notify.warning('邮箱格式不正确');
    return;
  }

  codeSending.value = true;
  try {
    const result = await sendVerifyCode({ email: form.email.trim(), type: 'reset' });
    notify.success('验证码已发送到邮箱');
    startCountdown(Math.max(1, result.expireSeconds > 60 ? 60 : result.expireSeconds));
  } catch (error) {
    console.error('发送重置验证码失败:', error);
  } finally {
    codeSending.value = false;
  }
}

async function handleResetPassword() {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    await forgotPassword({
      email: form.email.trim(),
      code: form.code.trim(),
      newPassword: form.newPassword,
    });

    notify.success('密码已重置，请使用新密码登录');
    resetCountdown();
    await router.push('/login');
  } catch (error) {
    console.error('重置密码失败:', error);
  } finally {
    loading.value = false;
  }
}

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
  padding: 20px;
  background:
    radial-gradient(circle at top left, rgba(251, 114, 153, 0.12), transparent 32%),
    radial-gradient(circle at right center, rgba(255, 188, 210, 0.18), transparent 28%),
    linear-gradient(180deg, var(--bg-primary), color-mix(in srgb, var(--bg-primary) 84%, white));
}

.auth-container {
  display: flex;
  width: min(960px, 100%);
  min-height: 600px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--primary) 14%, white);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 22px 54px rgba(88, 67, 84, 0.12);
}

.auth-banner {
  position: relative;
  width: 392px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 44px;
  overflow: hidden;
  color: white;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.28), transparent 28%),
    linear-gradient(160deg, color-mix(in srgb, var(--primary) 84%, white), var(--primary-light));
}

.banner-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.banner-logo {
  width: 176px;
  height: 120px;
  margin-bottom: 26px;
  object-fit: contain;
  filter: drop-shadow(0 10px 24px rgba(82, 42, 60, 0.22));
}

.banner-title {
  margin: 0 0 12px;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 700;
  text-wrap: balance;
}

.banner-desc {
  max-width: 24ch;
  margin: 0;
  font-size: 14px;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.92);
}

.banner-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}

.circle-1 {
  top: -58px;
  right: -42px;
  width: 208px;
  height: 208px;
}

.circle-2 {
  bottom: 86px;
  left: -46px;
  width: 126px;
  height: 126px;
}

.circle-3 {
  right: 56px;
  bottom: -18px;
  width: 88px;
  height: 88px;
  background: rgba(255, 255, 255, 0.16);
}

.auth-form-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 44px 40px;
}

.auth-form {
  width: 100%;
  max-width: 388px;
}

.form-heading {
  margin-bottom: 20px;
}

.form-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 28px;
  line-height: 1.2;
  font-weight: 700;
}

.forgot-form {
  :deep(.ui-input) {
    border-radius: 12px;
  }
}

.verify-code-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;

  :deep(.ui-input) {
    flex: 1;
    min-width: 0;
  }

  :deep(.ui-button) {
    flex-shrink: 0;
    min-width: 120px;
    height: var(--control-height-lg);
    margin: 0;
    padding-inline: 20px;
    border-radius: 12px;
  }
}

.security-tip {
  margin: -4px 0 18px;
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.7;
}

.submit-btn {
  width: 100%;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 14px 28px rgba(251, 114, 153, 0.22);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    opacity: 0.96;
  }
}

.auth-footer {
  margin-top: 24px;
  text-align: center;

  p {
    margin: 0 0 12px;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .link {
    color: var(--primary);
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-tertiary);
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: var(--primary);
  }
}

@media (prefers-reduced-motion: reduce) {
  .submit-btn {
    transition: none;
  }
}

@media (max-width: 768px) {
  .auth-page {
    padding: 16px;
  }

  .auth-container {
    flex-direction: column;
    min-height: auto;
  }

  .auth-banner {
    width: 100%;
    min-height: 196px;
    padding: 34px 28px;
  }

  .banner-logo {
    width: 132px;
    height: 92px;
    margin-bottom: 18px;
  }

  .banner-title {
    font-size: 24px;
  }

  .auth-form-wrapper {
    padding: 32px 24px;
  }

  .auth-form {
    max-width: 100%;
  }
}

@media (max-width: 520px) {
  .verify-code-wrapper {
    flex-direction: column;
    align-items: stretch;

    :deep(.ui-button) {
      width: 100%;
      min-width: 0;
    }
  }
}
</style>
