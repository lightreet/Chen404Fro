<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="关于 Chen404"
        eyebrow="About"
        subtitle="这里不只是文章集合，更像一份持续更新的个人技术与生活切片。"
        :bg-image="heroBgImage"
        bg-position="center 42%"
        min-height="70vh"
        :overlay-opacity="0.48"
        compact
      />
    </template>

    <div class="about-page">
      <div class="about-card">
        <div class="about-header">
          <div class="avatar">
            <img :src="ownerAvatar" :alt="ownerDisplayName" />
          </div>
          <h1 class="name">{{ ownerDisplayName }}</h1>
          <p class="bio">{{ ownerBio }}</p>
        </div>

        <div class="about-content">
          <section class="section">
            <h2 class="section-title">关于我</h2>
            <p class="section-text">
              你好，我是 {{ ownerDisplayName }}。这个博客用来记录技术学习、开发实践和一些认真生活时冒出来的小想法。
              它不会只停留在“写过几篇文章”的状态，而是希望慢慢长成一个有温度、有记忆点的个人站点。
            </p>
          </section>

          <section class="section">
            <h2 class="section-title">技术栈</h2>
            <div class="tech-tags">
              <span v-for="tech in techs" :key="tech" class="tech-tag">{{ tech }}</span>
            </div>
          </section>

          <section class="section">
            <h2 class="section-title">联系我</h2>
            <div class="contact-list">
              <a v-if="siteEmail" :href="`mailto:${siteEmail}`" class="contact-item">
                <el-icon><Message /></el-icon>
                <span>{{ siteEmail }}</span>
              </a>
              <a v-if="githubLink" :href="githubLink" class="contact-item" target="_blank" rel="noreferrer">
                <el-icon><Link /></el-icon>
                <span>GitHub</span>
              </a>
              <div v-if="!siteEmail && !githubLink" class="contact-empty">
                联系方式会在站点配置完善后展示在这里。
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Link, Message } from '@element-plus/icons-vue';
import type { SiteOwner } from '@/types';
import { getSiteOwner } from '@/api/home';
import PageHero from '@/components/PageHero/PageHero.vue';
import { useSiteConfig } from '@/composables/useSiteConfig';
import DefaultLayout from '@/layouts/DefaultLayout.vue';

const techs = ref(['Vue 3', 'TypeScript', 'Spring Boot', 'Java', 'MySQL', 'Redis']);
const DEFAULT_ABOUT_HERO =
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&q=80';
const DEFAULT_OWNER_BIO = '热爱技术，也认真生活。';
const DEFAULT_OWNER_NAME = 'Chen404';
const DEFAULT_OWNER_AVATAR = '/Chen404logo.svg';

const heroBgImage = ref(DEFAULT_ABOUT_HERO);
const owner = ref<SiteOwner | null>(null);
const siteEmail = ref('');
const githubLink = ref('');
const { loadSiteConfig } = useSiteConfig();

const ownerDisplayName = computed(() => owner.value?.nickname || owner.value?.username || DEFAULT_OWNER_NAME);
const ownerAvatar = computed(() => owner.value?.avatar || DEFAULT_OWNER_AVATAR);
const ownerBio = computed(() => owner.value?.bio?.trim() || DEFAULT_OWNER_BIO);

onMounted(() => {
  void Promise.allSettled([loadSiteConfig(true), getSiteOwner()]).then(([configResult, ownerResult]) => {
    if (configResult.status === 'fulfilled') {
      heroBgImage.value = configResult.value.heroImages?.about || DEFAULT_ABOUT_HERO;
      siteEmail.value = configResult.value.email || '';
      githubLink.value = configResult.value.github || '';
    }

    if (ownerResult.status === 'fulfilled' && ownerResult.value) {
      owner.value = ownerResult.value;
    }
  });
});
</script>

<style scoped lang="scss">
.about-page {
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  padding-top: 20px;
}

.about-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
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
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.14);

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
  opacity: 0.92;
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
  flex-wrap: wrap;
  gap: 16px;
}

.contact-item,
.contact-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s;
}

.contact-item:hover {
  background: var(--primary);
  color: white;
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
