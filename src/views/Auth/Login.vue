<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧装饰 -->
      <div class="auth-banner">
        <div class="banner-content">
          <img src="/Chen404logo.svg" alt="Chen404" class="banner-logo" />
          <h2 class="banner-title">欢迎回来</h2>
          <p class="banner-desc">登录以继续探索精彩内容</p>
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
          <h3 class="form-title">账号登录</h3>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            class="login-form"
            @keyup.enter="handleLogin"
          >
            <el-form-item prop="account">
              <el-input
                v-model="form.account"
                placeholder="请输入用户名或邮箱"
                size="large"
                :prefix-icon="User"
              />
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

            <div class="form-options">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              <a href="#" class="forgot-link">忘记密码？</a>
            </div>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="submit-btn"
                :loading="loading"
                @click="handleLogin"
              >
                立即登录
              </el-button>
            </el-form-item>
          </el-form>

          <div class="auth-footer">
            <p>
              还没有账号？
              <router-link to="/register" class="link">立即注册</router-link>
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
import { User, Lock, ArrowLeft } from '@element-plus/icons-vue';
import { login } from '@/api/auth';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref();
const loading = ref(false);
const rememberMe = ref(false);
const form = reactive({
  account: '',
  password: '',
});

const rules = {
  account: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (err?: Error) => void) => {
        if (!value) return callback();
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const isUsername = /^[a-zA-Z0-9_]{3,20}$/.test(value);
        if (isEmail || isUsername) return callback();
        callback(new Error('请输入正确的用户名（3-20位字母数字下划线）或邮箱'));
      },
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
};

const handleLogin = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    const res = await login({
      username: form.account,
      password: form.password,
    });

    // 更新全局用户状态（根据 rememberMe 决定是否持久化）
    userStore.login(res.user, res.token, rememberMe.value);
    if (rememberMe.value) {
      localStorage.setItem('refreshToken', res.refreshToken);
    }

    ElMessage.success('登录成功');
    router.push('/');
  } catch (error) {
    console.error('登录失败:', error);
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
  min-height: 560px;
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
.login-form {
  :deep(.el-input__wrapper) {
    border-radius: var(--radius-md);
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
