<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="留言板"
        eyebrow="Guestbook"
        subtitle="留下一句话，也留下此刻的你"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="64vh"
        compact
      />
    </template>

    <div class="guestbook-page">
      <div class="guestbook-content">
        <CommentSection :can-comment="true" :comment-policy="3" />
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CommentSection from '@/components/Comment/CommentSection.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import { useSiteConfig } from '@/composables/useSiteConfig'
import { resolveHeroImagePosition } from '@/utils/siteConfig'

const DEFAULT_GUESTBOOK_HERO =
  'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1920&q=80'
const DEFAULT_GUESTBOOK_HERO_POSITION = '50% 40%'
const heroBgImage = ref(DEFAULT_GUESTBOOK_HERO)
const heroBgPosition = ref(DEFAULT_GUESTBOOK_HERO_POSITION)
const { loadSiteConfig } = useSiteConfig()

onMounted(() => {
  void loadSiteConfig(true).then((config) => {
    heroBgImage.value = config.heroImages?.guestbook || DEFAULT_GUESTBOOK_HERO
    heroBgPosition.value = resolveHeroImagePosition(config, 'guestbook', DEFAULT_GUESTBOOK_HERO_POSITION)
  })
})
</script>

<style scoped lang="scss">
.guestbook-page {
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  padding-top: 20px;
}

.guestbook-content {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}
</style>
