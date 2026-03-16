<template>
  <DefaultLayout>
    <div class="friends-page">
      <div class="page-header">
        <h1 class="page-title">友人帐</h1>
        <p class="page-desc">友情链接，交换友链请留言</p>
      </div>

      <div class="friends-grid">
        <a
          v-for="friend in friends"
          :key="friend.id"
          :href="friend.site_url"
          target="_blank"
          rel="noopener noreferrer"
          class="friend-card"
        >
          <div class="friend-avatar">
            <img :src="friend.site_logo" :alt="friend.site_name" />
          </div>
          <h3 class="friend-name">{{ friend.site_name }}</h3>
          <p class="friend-desc">{{ friend.description }}</p>
        </a>
      </div>

      <div class="apply-section card">
        <h3 class="apply-title">申请友链</h3>
        <p class="apply-info">
          请按照以下格式留言：<br />
          站点名称：Chen404 Blog<br />
          站点链接：https://chen404.com<br />
          站点描述：一个热爱技术分享的博客<br />
          站点Logo：URL地址
        </p>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';

const friends = ref([
  {
    id: 1,
    site_name: '示例站点1',
    site_url: 'https://example.com',
    site_logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Ex1',
    description: '一个优秀的技术博客',
  },
  {
    id: 2,
    site_name: '示例站点2',
    site_url: 'https://example2.com',
    site_logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Ex2',
    description: '分享前端开发经验',
  },
  {
    id: 3,
    site_name: '示例站点3',
    site_url: 'https://example3.com',
    site_logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Ex3',
    description: 'Java 后端技术分享',
  },
]);
</script>

<style scoped lang="scss">
.friends-page {
  padding-top: 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.page-desc {
  font-size: 14px;
  color: var(--text-secondary);
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.friend-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 24px;
  text-align: center;
  text-decoration: none;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
}

.friend-avatar {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-hover);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.friend-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.friend-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.apply-section {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.apply-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--text-primary);
}

.apply-info {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
  margin: 0;
}
</style>
