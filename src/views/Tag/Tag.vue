<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="标签"
        eyebrow="Tags"
        subtitle="通过更细粒度的标签快速定位感兴趣的话题和关键词。"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="64vh"
        compact
        scroll-target="#tag-content"
      >
        <template #meta>
          <div class="hero-meta">
            <span class="hero-stat">{{ tags.length }} 个标签</span>
          </div>
        </template>
      </PageHero>
    </template>

    <div id="tag-content" class="tag-page">
      <AppTopicNavigation v-if="isMobile" active="tag" heading="从一个关键词出发">
        <template #search>
          <UiInput v-model="keyword" placeholder="搜索标签" prefix-icon="search" clearable />
        </template>
      </AppTopicNavigation>

      <div v-if="loading" class="loading-state" role="status">
        <UiIcon class="loading-icon" name="Loading" spin />
        <p>加载中…</p>
      </div>

      <UiEmpty v-else-if="loadFailed" title="标签加载失败" description="请检查网络后重试。">
        <template #action>
          <UiButton @click="fetchTags">重新加载</UiButton>
        </template>
      </UiEmpty>

      <div v-else-if="filteredTags.length" class="tags-cloud">
        <router-link
          v-for="tag in filteredTags"
          :key="tag.id"
          :to="`/tag/${tag.id}`"
          class="tag-item"
          :style="isMobile ? undefined : { backgroundColor: tag.color + '20', color: tag.color }"
        >
          <span class="tag-name">{{ isMobile ? '# ' : '' }}{{ tag.name }}</span>
          <span class="tag-count">{{ tag.articleCount ?? 0 }}</span>
        </router-link>
      </div>

      <UiEmpty
        v-else
        :title="tags.length ? '没有找到相关标签' : '暂无标签'"
        :description="tags.length ? '换个关键词试试。' : '可以通过搜索查找感兴趣的文章。'"
      >
        <template v-if="tags.length" #action>
          <UiButton @click="keyword = ''">清空搜索</UiButton>
        </template>
      </UiEmpty>

      <aside v-if="isMobile && !loading && !loadFailed && tags.length" class="tag-guide">
        <h2>想看哪一个主题？</h2>
        <p>点击标签查看相关文章。<br />也可以通过<RouterLink to="/search">搜索</RouterLink>找到具体内容。</p>
      </aside>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { notify } from '@/lib/feedback';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import PageHero from '@/components/PageHero/PageHero.vue';
import AppTopicNavigation from '@/components/app/AppTopicNavigation/AppTopicNavigation.vue';
import { UiButton, UiEmpty, UiIcon, UiInput } from '@/components/ui'
import { useSiteConfig } from '@/composables/useSiteConfig';
import { useMobileViewport } from '@/composables/useMobileViewport';
import type { Tag } from '@/types';
import { resolveHeroImagePosition } from '@/utils/siteConfig';
import { getTags } from '@/api/article';

const DEFAULT_TAG_HERO =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920&q=80';
const DEFAULT_TAG_HERO_POSITION = '50% 38%';
const tags = ref<Tag[]>([]);
const loading = ref(true);
const loadFailed = ref(false);
const keyword = ref('');
const { isMobile } = useMobileViewport();
const filteredTags = computed(() => {
  const query = isMobile.value ? keyword.value.trim().toLocaleLowerCase() : '';
  return query ? tags.value.filter(tag => tag.name.toLocaleLowerCase().includes(query)) : tags.value;
});
const heroBgImage = ref(DEFAULT_TAG_HERO);
const heroBgPosition = ref(DEFAULT_TAG_HERO_POSITION);
const { loadSiteConfig } = useSiteConfig();

const fetchTags = async () => {
  loading.value = true;
  loadFailed.value = false;
  try {
    tags.value = (await getTags(true)) ?? [];
  } catch (err) {
    console.error('加载标签失败', err);
    notify.error('加载标签失败，请稍后重试');
    tags.value = [];
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void loadSiteConfig(true).then((config) => {
    heroBgImage.value = config.heroImages?.tag || DEFAULT_TAG_HERO;
    heroBgPosition.value = resolveHeroImagePosition(config, 'tag', DEFAULT_TAG_HERO_POSITION);
  });
  void fetchTags();
});
</script>

<style scoped lang="scss">
.tag-page {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding-top: 20px;
}

.loading-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-secondary);

  .loading-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
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

@media (max-width: 767px) {
  .tag-page { padding-top: 10px; }
  .tags-cloud { padding: 0; background: transparent; justify-content: flex-start; }
  .tag-item {
    max-width: 100%;
    min-height: 44px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    border-radius: var(--radius-pill);
    font-size: 15px;
    font-weight: 400;

    &:hover { transform: none; box-shadow: none; }
    &:focus-visible { outline: 2px solid var(--color-accent-readable); outline-offset: 3px; }
  }
  .tag-name { min-width: 0; overflow-wrap: anywhere; }
  .tag-count { display: none; }
  .tag-guide {
    margin-top: 32px;
    padding: 20px;
    border-radius: var(--mobile-card-radius);
    background: var(--color-accent-soft);

    h2 { margin: 0 0 12px; font-size: 17px; font-weight: 600; color: var(--color-text-primary); }
    p { margin: 0; font-size: 14px; line-height: 1.8; color: var(--color-text-secondary); }
    a { color: var(--color-accent-readable); text-decoration: underline; text-underline-offset: 3px; }
  }
}
</style>
