<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="留言板"
        eyebrow="Guestbook"
        subtitle="路过这里时，留下一个想法、一句问候，或者一段你正在思考的东西。"
        :bg-image="heroBgImage"
        bg-position="center 40%"
        min-height="70vh"
        :overlay-opacity="0.5"
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

const DEFAULT_GUESTBOOK_HERO =
  'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1920&q=80'
const heroBgImage = ref(DEFAULT_GUESTBOOK_HERO)
const { loadSiteConfig } = useSiteConfig()

onMounted(() => {
  void loadSiteConfig(true).then((config) => {
    heroBgImage.value = config.heroImages?.guestbook || DEFAULT_GUESTBOOK_HERO
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
