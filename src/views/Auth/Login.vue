<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-banner">
        <div class="banner-content">
          <img :src="siteLogo" :alt="siteName" class="banner-logo" />
          <h2 class="banner-title">欢迎回来</h2>
          <p class="banner-desc">登录以继续探索精彩内容</p>
        </div>
        <div class="banner-decoration">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
          <div class="circle circle-3"></div>
        </div>
      </div>

      <div class="auth-form-wrapper">
        <div class="auth-form">
          <h3 class="form-title">账号登录</h3>

          <UiForm
            ref="formRef"
            :model="form"
            :rules="rules"
            class="login-form"
            @keyup.enter="handleLogin"
          >
            <div class="login-mode-switch" role="tablist" aria-label="登录方式">
              <button
                type="button"
                class="login-mode-switch__item"
                :class="{ 'is-active': loginMode === 'username' }"
                @click="setLoginMode('username')"
              >
                用户名
              </button>
              <button
                type="button"
                class="login-mode-switch__item"
                :class="{ 'is-active': loginMode === 'email' }"
                @click="setLoginMode('email')"
              >
                邮箱
              </button>
            </div>

            <UiFormField prop="account">
              <UiInput
                v-if="loginMode === 'username'"
                v-model="form.account"
                placeholder="请输入用户名"
                size="lg"
                prefix-icon="user"
                maxlength="20"
              />
              <AuthEmailField
                v-else
                v-model="form.account"
                placeholder="请输入邮箱账号"
                size="lg"
              />
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

            <div class="form-options">
              <UiCheckbox v-model="rememberMe">记住我</UiCheckbox>
              <router-link to="/forgot-password" class="forgot-link">忘记密码？</router-link>
            </div>

            <UiFormField>
              <UiButton variant="primary" size="lg" class="submit-btn" :loading="loading" @click="handleLogin">
                立即登录
              </UiButton>
            </UiFormField>
          </UiForm>

          <div class="auth-footer">
            <p>
              还没有账号？
              <router-link to="/register" class="link">立即注册</router-link>
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
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { notify } from '@/lib/feedback';
import { AuthEmailField, UiButton, UiCheckbox, UiForm, UiFormField, UiIcon, UiInput } from '@/components/ui'
import { login } from '@/api/auth';
import { useSiteConfig } from '@/composables/useSiteConfig';
import { useUserStore } from '@/stores/user';
import { resolveSiteLogo, resolveSiteName } from '@/utils/siteConfig';
import { isValidUsername } from '@/utils/validation';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { siteConfig, loadSiteConfig } = useSiteConfig();
const formRef = ref();
const loading = ref(false);
const rememberMe = ref(false);
const loginMode = ref<'username' | 'email'>('username');
const form = reactive({
  account: '',
  password: '',
});
const siteName = computed(() => resolveSiteName(siteConfig.value));
const siteLogo = computed(() => resolveSiteLogo(siteConfig.value));

const rules = {
  account: [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (err?: Error) => void) => {
        if (!value) return callback();
        if (loginMode.value === 'email') {
          const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          if (isEmail) return callback();
          callback(new Error('请输入正确的邮箱'));
          return;
        }
        const isUsername = isValidUsername(value);
        if (isUsername) return callback();
        callback(new Error('请输入正确的用户名（3-20 位字母、数字、下划线）'));
      },
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
};

function setLoginMode(mode: 'username' | 'email') {
  if (loginMode.value === mode) {
    return;
  }
  loginMode.value = mode;
  form.account = '';
  formRef.value?.clearValidate?.('account');
}

const handleLogin = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    const res = await login({
      username: form.account,
      password: form.password,
    });

    userStore.login(res.user, res.token, {
      remember: rememberMe.value,
      refreshToken: res.refreshToken,
    });

    notify.success('登录成功');
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect.startsWith('/') ? redirect : '/');
  } catch (error) {
    console.error('登录失败:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void loadSiteConfig();
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
  min-height: 560px;
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

.login-form {
  :deep(.ui-input) {
    border-radius: var(--radius-md);
  }
}

.login-mode-switch {
  display: inline-flex;
  align-items: center;
  gap: 28px;
  margin: 0 0 18px;
  padding-bottom: 2px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 88%, white);
}

.login-mode-switch__item {
  position: relative;
  min-width: 0;
  height: 40px;
  padding: 0 2px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition:
    color var(--motion-duration-fast) var(--motion-ease-standard),
    opacity var(--motion-duration-fast) var(--motion-ease-standard);

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -3px;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary-light) 78%, white));
    transform: scaleX(0);
    transform-origin: center;
    transition: transform var(--motion-duration-fast) var(--motion-ease-standard);
  }

  &:hover {
    opacity: 0.88;
  }
}

.login-mode-switch__item.is-active {
  color: var(--primary);

  &::after {
    transform: scaleX(1);
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.forgot-link {
  font-size: 14px;
  color: var(--primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.submit-btn {
  width: 100%;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border: none;
  font-size: 16px;
  font-weight: 500;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
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
}
</style>
