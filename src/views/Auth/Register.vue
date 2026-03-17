<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧装饰 -->
      <div class="auth-banner">
        <div class="banner-content">
          <img src="/Chen404logo.svg" alt="Chen404" class="banner-logo" />
          <h2 class="banner-title">加入我们</h2>
          <p class="banner-desc">创建账号开启精彩旅程</p>
        </div>
        <div class="banner-decoration">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
          <div class="circle circle-3"></div>
        </div>
      </div>

      <!-- 右侧表单 -->
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

            <!-- 昵称 -->
            <el-form-item prop="nickname">
              <el-input
                v-model="form.nickname"
                placeholder="请输入昵称（选填）"
                size="large"
                :prefix-icon="UserFilled"
                maxlength="20"
              />
            </el-form-item>

            <!-- 密码 -->
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

            <!-- 确认密码 -->
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

            <!-- 协议 -->
            <div class="form-agreement">
              <el-checkbox v-model="agreement">
                我已阅读并同意
                <a href="#" @click.prevent="showAgreement">《用户协议》</a>
                和
                <a href="#" @click.prevent="showPrivacy">《隐私政策》</a>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Message, Lock, Key, UserFilled, ArrowLeft } from '@element-plus/icons-vue';
import { register, sendVerifyCode as sendVerifyCodeApi, login } from '@/api/auth';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref();
const loading = ref(false);
const agreement = ref(false);
const codeSending = ref(false);
const codeCountdown = ref(0);

const form = reactive({
  username: '',
  email: '',
  code: '',
  nickname: '',
  password: '',
  confirmPassword: '',
});

// 确认密码验证
const validateConfirmPassword = (rule: any, value: string, callback: Function) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

// 邮箱注册规则
const emailRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度3-20位', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字、下划线', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码为4-6位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度6-20位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
};

const rules = emailRules;

// 发送验证码（邮箱）
const sendVerifyCode = async () => {
  if (!form.email?.trim()) {
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
    const timer = setInterval(() => {
      codeCountdown.value--;
      if (codeCountdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (err) {
    console.error('发送验证码失败', err);
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

    const registerData = {
      username: form.username,
      password: form.password,
      nickname: form.nickname || form.username,
      email: form.email,
      code: form.code,
      registerType: 'email' as const,
    };

    await register(registerData);
    const loginRes = await login({ username: form.username, password: form.password });
    userStore.login(loginRes.user, loginRes.token, true);
    if (loginRes.refreshToken) {
      localStorage.setItem('refreshToken', loginRes.refreshToken);
    }
    ElMessage.success('注册成功');
    router.push('/');
  } catch (error) {
    console.error('注册失败:', error);
  } finally {
    loading.value = false;
  }
};

const showAgreement = () => {
  ElMessage.info('用户协议功能开发中');
};

const showPrivacy = () => {
  ElMessage.info('隐私政策功能开发中');
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

/* 左侧装饰 */
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
  width: 80px;
  height: 80px;
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

/* 装饰圆圈 */
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

/* 右侧表单 */
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

/* 表单样式 */
.register-form {
  :deep(.el-input__wrapper) {
    border-radius: var(--radius-md);
  }
}

/* 验证码输入框：与上方表单项等宽，按钮略矮一丢丢 */
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

/* 协议 */
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

/* 底部链接 */
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

/* 响应式 */
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
    width: 60px;
    height: 60px;
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
