<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="好友申请"
        eyebrow="Friend Request"
        subtitle="如果你想查看知友可见的内容，可以先在这里了解说明，再决定是否登录并提交好友申请。"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="66vh"
        compact
      />
    </template>

    <div class="trust-request-page">
      <FeatureAccessCover
        v-if="!authReady || !isLoggedIn"
        v-bind="trustRequestLoginCover"
        icon="Postcard"
      />

      <section v-else class="trust-request-shell">
        <ProfileTrustRequestPanel :user="user" />
      </section>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import FeatureAccessCover from '@/components/FeatureAccessCover.vue'
import { resolveFeatureHero, TRUST_REQUEST_LOGIN_COVER } from '@/modules/feature-access/constants'
import ProfileTrustRequestPanel from '@/views/Profile/ProfileTrustRequestPanel.vue'
import { useSiteConfig } from '@/composables/useSiteConfig'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
userStore.initUser()
const { isLoggedIn, user } = storeToRefs(userStore)
const { siteConfig, loadSiteConfig } = useSiteConfig()

const defaultHero = resolveFeatureHero(null, 'trust-request')
const heroBgImage = ref(defaultHero.bgImage)
const heroBgPosition = ref(defaultHero.bgPosition)
const authReady = ref(false)
const trustRequestLoginCover = TRUST_REQUEST_LOGIN_COVER

onMounted(async () => {
  await Promise.all([
    loadSiteConfig().catch(() => null),
    userStore.syncAuthState().catch(() => false),
  ])

  const hero = resolveFeatureHero(siteConfig.value, 'trust-request')
  heroBgImage.value = hero.bgImage
  heroBgPosition.value = hero.bgPosition
  authReady.value = true
})
</script>

<style scoped lang="scss">
.trust-request-page {
  padding-bottom: 44px;
}

.trust-request-shell {
  width: min(980px, calc(100vw - 120px));
  margin: 28px auto 0;
}

@media (max-width: 900px) {
  .trust-request-shell {
    width: min(100%, calc(100vw - 32px));
    margin-top: 22px;
  }
}
</style>
