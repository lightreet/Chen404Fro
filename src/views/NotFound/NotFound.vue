<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <div class="error-logo">
        <img src="/logo.png" alt="404" />
      </div>
      <h1 class="error-title">页面不存在</h1>
      <p class="error-desc">抱歉，您访问的页面找不到了</p>
      <router-link to="/" class="back-home">
        <el-button type="primary" size="large">返回首页</el-button>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404 页面
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
}

.not-found-content {
  text-align: center;
  padding: 40px;
}

.error-logo {
  margin-bottom: 24px;

  img {
    width: 240px;
    height: 160px;
    object-fit: contain;
    filter: drop-shadow(0 8px 32px rgba(251, 114, 153, 0.3));
    animation: float 3s ease-in-out infinite;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.error-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.error-desc {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 24px;
}
</style>
