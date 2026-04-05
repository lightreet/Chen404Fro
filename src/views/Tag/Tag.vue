<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="标签"
        eyebrow="Tags"
        subtitle="通过更细粒度的标签快速定位感兴趣的话题和关键词。"
        :bg-image="heroBgImage"
        bg-position="center 38%"
        min-height="320px"
        :overlay-opacity="0.5"
        compact
      >
        <template #meta>
          <div class="hero-meta">
            <span class="hero-stat">{{ tags.length }} 个标签</span>
          </div>
        </template>
      </PageHero>
    </template>

    <div class="tag-page">
      <div class="tags-cloud">
        <router-link
          v-for="tag in tags"
          :key="tag.id"
          :to="`/tag/${tag.id}`"
          class="tag-item"
          :style="{ backgroundColor: tag.color + '20', color: tag.color }"
        >
          {{ tag.name }}
          <span class="tag-count">{{ Math.floor(Math.random() * 15) + 1 }}</span>
        </router-link>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import PageHero from '@/components/PageHero/PageHero.vue';
import { useSiteConfig } from '@/composables/useSiteConfig';
import type { Tag } from '@/types';
import { mockTags } from '@/utils/mock';

const DEFAULT_TAG_HERO =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920&q=80';
const tags = ref<Tag[]>([]);
const heroBgImage = ref(DEFAULT_TAG_HERO);
const { loadSiteConfig } = useSiteConfig();

onMounted(() => {
  void loadSiteConfig(true).then((config) => {
    heroBgImage.value = config.heroImages?.tag || DEFAULT_TAG_HERO;
  });
  tags.value = mockTags;
});
</script>

<style scoped lang="scss">
.tag-page {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding-top: 20px;
}

.hero-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.hero-stat {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.94);
  font-size: 13px;
  backdrop-filter: blur(10px);
}

.tags-cloud {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.tag-item {
  padding: 10px 18px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

.tag-count {
  font-size: 12px;
  opacity: 0.8;
}
</style>
