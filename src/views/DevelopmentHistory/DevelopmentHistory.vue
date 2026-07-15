<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="开发历程"
        eyebrow="Development"
        subtitle="从每一次提交里，回看 Chen404 的成长轨迹。"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="62vh"
        compact
        scroll-target="#development-history-content"
      >
        <template #meta>
          <div class="hero-meta">
            <UiIcon name="commit" />
            <span>{{ heroMetric }}</span>
          </div>
        </template>
      </PageHero>
    </template>

    <main id="development-history-content" class="development-history-page">
      <DevelopmentHistoryContent
        :history="developmentHistory"
        :loading="loading"
        :error="error"
        @retry="loadDevelopmentHistory(true)"
      />
    </main>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import { UiIcon } from '@/components/ui'
import { getDevelopmentHistory } from '@/api/development-history'
import { useSiteConfig } from '@/composables/useSiteConfig'
import type { DevelopmentHistory as DevelopmentHistoryData } from '@/types/development-history'
import { resolveHeroImagePosition } from '@/utils/siteConfig'
import DevelopmentHistoryContent from '@/views/Archive/components/DevelopmentHistory.vue'

const DEFAULT_HERO =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1920&q=80'
const DEFAULT_HERO_POSITION = '50% 44%'

const developmentHistory = ref<DevelopmentHistoryData | null>(null)
const loading = ref(false)
const error = ref('')
const heroBgImage = ref(DEFAULT_HERO)
const heroBgPosition = ref(DEFAULT_HERO_POSITION)
const { loadSiteConfig } = useSiteConfig()

const heroMetric = computed(() => {
  if (loading.value) return '正在同步提交'
  return `${developmentHistory.value?.totalCommits || 0} 次提交`
})

async function loadDevelopmentHistory(force = false) {
  if (developmentHistory.value && !force) return
  loading.value = true
  error.value = ''
  try {
    developmentHistory.value = await getDevelopmentHistory()
  } catch {
    developmentHistory.value = null
    error.value = 'GitHub 数据暂时不可用，请稍后重试。'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadDevelopmentHistory()
  void loadSiteConfig(true).then((config) => {
    heroBgImage.value = config.heroImages?.archive || DEFAULT_HERO
    heroBgPosition.value = resolveHeroImagePosition(config, 'archive', DEFAULT_HERO_POSITION)
  })
})
</script>

<style scoped lang="scss">
.development-history-page {
  width: min(100%, 1080px);
  margin: 0 auto;
  padding: 20px 0 48px;
}

.hero-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.95);
  font-size: 13px;
  backdrop-filter: blur(8px);
}

@media (max-width: 768px) {
  .development-history-page {
    padding-top: 14px;
    padding-bottom: 34px;
  }
}
</style>
