<template>
  <DefaultLayout>
    <div class="about-page">
      <div class="about-card">
        <div class="about-header">
          <div class="avatar">
            <img src="/Chen404logo.svg" alt="avatar" />
          </div>
          <h1 class="name">Chen</h1>
          <p class="bio">热爱技术，热爱生活</p>
        </div>

        <div class="about-content">
          <section class="section">
            <h2 class="section-title">关于我</h2>
            <p class="section-text">
              你好，我是 Chen，一名热爱技术的开发者。
              这个博客是我的技术分享空间，记录我在前端、后端开发中的学习心得和实践经验。
            </p>
          </section>

          <section class="section">
            <h2 class="section-title">技术栈</h2>
            <div class="tech-tags">
              <span v-for="tech in techs" :key="tech" class="tech-tag">{{ tech }}</span>
            </div>
          </section>

          <section class="section">
            <h2 class="section-title">联系方式</h2>
            <div class="contact-list">
              <a href="#" class="contact-item">
                <el-icon><Message /></el-icon>
                <span>Email</span>
              </a>
              <a href="#" class="contact-item">
                <el-icon><Link /></el-icon>
                <span>GitHub</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Message, Link } from '@element-plus/icons-vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';

const techs = ref(['Vue 3', 'TypeScript', 'Spring Boot', 'Java', 'MySQL', 'Redis']);
</script>

<style scoped lang="scss">
.about-page {
  padding-top: 24px;
}

.about-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.about-header {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  padding: 48px;
  text-align: center;
  color: white;
}

.avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.name {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px;
}

.bio {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.about-content {
  padding: 40px;
}

.section {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary);
  display: inline-block;
}

.section-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-secondary);
  margin: 0;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tech-tag {
  padding: 8px 16px;
  background: var(--bg-primary);
  border-radius: 20px;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.3s;

  &:hover {
    background: var(--primary);
    color: white;
  }
}

.contact-list {
  display: flex;
  gap: 16px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s;

  &:hover {
    background: var(--primary);
    color: white;
  }
}

@media (max-width: 768px) {
  .about-header {
    padding: 32px 24px;
  }

  .about-content {
    padding: 24px;
  }

  .contact-list {
    flex-direction: column;
  }
}
</style>
