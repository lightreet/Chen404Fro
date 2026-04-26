<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="成员主页"
        eyebrow="Member Profile"
        subtitle="在柔和的樱色光影里，翻开一位成员留下的小小名片。"
        :bg-image="heroBgImage"
        bg-position="center 42%"
        min-height="56vh"
        :overlay-opacity="0.42"
        compact
      />
    </template>

    <main class="user-profile-page">
      <section v-if="loading" class="profile-state">正在加载用户资料...</section>
      <section v-else-if="!profile" class="profile-state">没有找到这个用户。</section>

      <template v-else>
        <section class="profile-banner" :style="bannerVars">
          <div class="profile-banner__backdrop" aria-hidden="true"></div>
          <div class="profile-banner__mist profile-banner__mist--left" aria-hidden="true"></div>
          <div class="profile-banner__mist profile-banner__mist--right" aria-hidden="true"></div>

          <div class="profile-banner__content">
            <div class="profile-banner__avatar-shell">
              <img class="profile-banner__avatar" :src="avatarUrl" :alt="displayName" />
            </div>

            <div class="profile-banner__main">
              <div class="profile-banner__meta">
                <span class="profile-pill profile-pill--soft">@{{ profile.username }}</span>
                <span class="profile-pill profile-pill--strong">{{ identityLabel }}</span>
                <span class="profile-pill profile-pill--soft">加入于 {{ joinText }}</span>
              </div>

              <h2>{{ displayName }}</h2>
              <p class="profile-banner__bio">{{ bioText }}</p>

              <div class="profile-banner__actions">
                <a v-if="profile.email" class="profile-action profile-action--primary" :href="`mailto:${profile.email}`">
                  发邮件
                </a>
                <button
                  v-if="profile.email"
                  type="button"
                  class="profile-action"
                  @click="copyEmail"
                >
                  复制邮箱
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="profile-metrics">
          <article class="profile-metric">
            <span>公开文章</span>
            <strong>{{ totalArticles }}</strong>
          </article>
          <article class="profile-metric">
            <span>邮箱状态</span>
            <strong>{{ emailLabel }}</strong>
          </article>
          <article class="profile-metric">
            <span>成员身份</span>
            <strong>{{ identityLabel }}</strong>
          </article>
          <article class="profile-metric">
            <span>加入时间</span>
            <strong>{{ joinText }}</strong>
          </article>
        </section>

        <section class="profile-section">
          <div class="profile-section__head">
            <div>
              <span class="profile-eyebrow">Recent Writing</span>
              <h2>公开文章</h2>
            </div>
            <span class="profile-count">{{ totalArticles }} 篇</span>
          </div>

          <div v-if="articlesLoading" class="profile-state profile-state--inline">正在加载文章...</div>
          <div v-else-if="!articles.length" class="profile-empty">
            <p>这位成员暂时还没有公开文章。</p>
            <span>等下一篇心情或灵感落下来的时候，这里会先亮起来。</span>
          </div>
          <div v-else class="profile-article-list">
            <RouterLink
              v-for="article in articles"
              :key="article.id"
              class="profile-article"
              :to="`/article/${article.id}`"
            >
              <div class="profile-article__content">
                <span class="profile-article__date">{{ formatDate(article.publishTime || article.createTime) }}</span>
                <h3>{{ article.title }}</h3>
                <p>{{ article.summary || '这篇文章还没有摘要。' }}</p>
              </div>
              <span class="profile-article__arrow">→</span>
            </RouterLink>
          </div>
        </section>
      </template>
    </main>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import PageHero from '@/components/PageHero/PageHero.vue';
import { getArticles } from '@/api/article';
import { getSiteOwner, getSiteUser, type SiteMember } from '@/api/home';
import type { Article, SiteOwner } from '@/types';
import { useSiteConfig } from '@/composables/useSiteConfig';

const DEFAULT_PROFILE_HERO =
  'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1920&q=80';
const DEFAULT_MEMBER_AVATAR = '/default-member-avatar.svg';
const LEGACY_DEFAULT_AVATAR = '/default-avatar.jpg';

const route = useRoute();
const { loadSiteConfig } = useSiteConfig();

const loading = ref(true);
const articlesLoading = ref(false);
const profile = ref<SiteMember | null>(null);
const owner = ref<SiteOwner | null>(null);
const articles = ref<Article[]>([]);
const totalArticles = ref(0);
const heroBgImage = ref(DEFAULT_PROFILE_HERO);

const userId = computed(() => String(route.params.id || ''));
const displayName = computed(() => profile.value?.nickname?.trim() || profile.value?.username || 'Chen404 成员');
const isOwner = computed(
  () => profile.value?.id != null && owner.value?.id != null && String(profile.value.id) === String(owner.value.id)
);
const identityLabel = computed(() => {
  if (isOwner.value) return '主理人';
  if (profile.value?.memberLabel?.trim()) return profile.value.memberLabel.trim();
  return profile.value?.trustLevel === 1 ? '知友' : '读者';
});
const bioText = computed(() => profile.value?.bio?.trim() || '这个人还没有留下介绍。');
const joinText = computed(() => formatDate(profile.value?.createTime) || '未知');
const emailLabel = computed(() => (profile.value?.email ? '已公开' : '未公开'));
const avatarUrl = computed(() => {
  const avatar = profile.value?.avatar?.trim();
  if (!avatar || avatar === LEGACY_DEFAULT_AVATAR) return DEFAULT_MEMBER_AVATAR;
  return avatar;
});
const bannerVars = computed(() => ({
  '--profile-banner-image': `url("${heroBgImage.value}")`,
}));

onMounted(() => {
  void loadSharedData();
});

watch(userId, () => {
  void loadProfile();
});

async function loadSharedData() {
  const [configResult, ownerResult] = await Promise.allSettled([loadSiteConfig(true), getSiteOwner()]);

  if (configResult.status === 'fulfilled') {
    heroBgImage.value = configResult.value.heroImages?.about || DEFAULT_PROFILE_HERO;
  }
  if (ownerResult.status === 'fulfilled') {
    owner.value = ownerResult.value;
  }

  await loadProfile();
}

async function loadProfile() {
  if (!userId.value) return;
  loading.value = true;
  articles.value = [];
  totalArticles.value = 0;
  try {
    profile.value = await getSiteUser(userId.value);
    await loadArticles();
  } catch {
    profile.value = null;
  } finally {
    loading.value = false;
  }
}

async function loadArticles() {
  if (!profile.value) return;
  articlesLoading.value = true;
  try {
    const result = await getArticles({ page: 1, size: 6, authorId: profile.value.id });
    articles.value = result.list ?? [];
    totalArticles.value = result.total ?? 0;
  } catch {
    articles.value = [];
    totalArticles.value = 0;
  } finally {
    articlesLoading.value = false;
  }
}

async function copyEmail() {
  if (!profile.value?.email) return;
  try {
    await navigator.clipboard.writeText(profile.value.email);
    ElMessage.success('邮箱已复制');
  } catch {
    ElMessage.warning('复制失败，可以手动选择邮箱');
  }
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}
</script>

<style scoped lang="scss">
.user-profile-page {
  width: min(100%, 1080px);
  margin: 0 auto;
  padding: 26px 18px 0;
  display: grid;
  gap: 22px;
}

.profile-banner,
.profile-metric,
.profile-section,
.profile-state,
.profile-empty {
  border: 1px solid rgba(255, 255, 255, 0.78);
  box-shadow:
    0 24px 52px rgba(201, 164, 183, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.profile-banner {
  position: relative;
  overflow: hidden;
  border-radius: 36px;
  background:
    linear-gradient(140deg, rgba(255, 251, 253, 0.94), rgba(246, 241, 249, 0.82)),
    radial-gradient(circle at top right, rgba(247, 205, 223, 0.34), transparent 42%);
}

.profile-banner__backdrop,
.profile-banner__mist {
  position: absolute;
  pointer-events: none;
}

.profile-banner__backdrop {
  inset: 0;
  background:
    linear-gradient(110deg, rgba(255, 250, 252, 0.9), rgba(252, 247, 251, 0.62)),
    var(--profile-banner-image) center 42% / cover no-repeat;
  filter: saturate(0.84) blur(1.2px) brightness(1.05);
  transform: scale(1.04);
  opacity: 0.35;
}

.profile-banner__mist {
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(248, 214, 226, 0.5), rgba(248, 214, 226, 0));
}

.profile-banner__mist--left {
  left: -52px;
  bottom: -110px;
}

.profile-banner__mist--right {
  top: -84px;
  right: -46px;
  background: radial-gradient(circle, rgba(225, 232, 252, 0.44), rgba(225, 232, 252, 0));
}

.profile-banner__content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 154px minmax(0, 1fr);
  gap: 26px;
  align-items: center;
  padding: 34px;
}

.profile-banner__avatar-shell {
  position: relative;
  width: 154px;
  height: 154px;
  padding: 10px;
  border-radius: 40px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(252, 229, 239, 0.76));
  box-shadow:
    0 20px 42px rgba(183, 143, 164, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

.profile-banner__avatar {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: 32px;
}

.profile-banner__main {
  min-width: 0;
}

.profile-banner__meta,
.profile-banner__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.profile-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.04em;
}

.profile-pill--soft {
  background: rgba(255, 255, 255, 0.7);
  color: #8c6679;
}

.profile-pill--strong {
  background: linear-gradient(135deg, rgba(245, 189, 210, 0.92), rgba(255, 232, 240, 0.92));
  color: #8f4965;
}

.profile-banner__main h2 {
  margin: 16px 0 10px;
  color: #5f4654;
  font-size: 40px;
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.profile-banner__bio {
  margin: 0;
  max-width: 42rem;
  color: rgba(97, 78, 92, 0.82);
  font-size: 15px;
  line-height: 1.95;
}

.profile-banner__actions {
  margin-top: 22px;
}

.profile-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 9px 16px;
  border: 1px solid rgba(220, 190, 202, 0.38);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #8c5d73;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.profile-action:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 24px rgba(190, 149, 170, 0.14);
}

.profile-action--primary {
  border-color: transparent;
  background: linear-gradient(135deg, #efb6ca, #f8dde7);
  color: #764b5d;
}

.profile-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.profile-metric {
  min-width: 0;
  padding: 18px 20px;
  border-radius: 24px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(251, 243, 248, 0.76)),
    radial-gradient(circle at top right, rgba(247, 206, 225, 0.22), transparent 40%);

  span {
    display: block;
    color: #a2768b;
    font-size: 12px;
    letter-spacing: 0.08em;
  }

  strong {
    display: block;
    margin-top: 10px;
    overflow: hidden;
    color: #5f4654;
    font-size: 22px;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.profile-section,
.profile-state,
.profile-empty {
  border-radius: 32px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(253, 246, 250, 0.74)),
    radial-gradient(circle at top right, rgba(247, 205, 223, 0.28), transparent 42%);
}

.profile-section {
  padding: 28px;
}

.profile-section__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;

  h2 {
    margin: 6px 0 0;
    color: #5f4654;
    font-size: 28px;
  }
}

.profile-eyebrow {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #c0819c;
}

.profile-count {
  flex: 0 0 auto;
  color: #9f6a83;
  font-size: 14px;
}

.profile-article-list {
  display: grid;
  gap: 14px;
}

.profile-article {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  border-radius: 24px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(255, 248, 251, 0.68)),
    radial-gradient(circle at right center, rgba(245, 214, 228, 0.2), transparent 38%);
  color: inherit;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.profile-article:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 30px rgba(196, 152, 174, 0.12);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(255, 250, 252, 0.76));
}

.profile-article__content {
  min-width: 0;
}

.profile-article__date {
  display: inline-block;
  margin-bottom: 10px;
  color: #c28aa2;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.profile-article h3 {
  margin: 0;
  color: #5a4250;
  font-size: 18px;
  line-height: 1.4;
}

.profile-article p {
  margin: 8px 0 0;
  color: rgba(101, 79, 93, 0.74);
  font-size: 14px;
  line-height: 1.72;
}

.profile-article__arrow {
  flex: 0 0 auto;
  color: #ca91aa;
  font-size: 22px;
  line-height: 1;
}

.profile-state,
.profile-empty {
  padding: 34px;
  color: rgba(99, 75, 91, 0.78);
  text-align: center;
}

.profile-state--inline {
  border-radius: 22px;
  box-shadow: none;
}

.profile-empty {
  p {
    margin: 0;
    color: #6d5564;
    font-size: 16px;
  }

  span {
    display: block;
    margin-top: 10px;
    color: rgba(109, 85, 100, 0.66);
    font-size: 13px;
    line-height: 1.7;
  }
}

@media (max-width: 900px) {
  .profile-banner__content,
  .profile-metrics {
    grid-template-columns: 1fr 1fr;
  }

  .profile-banner__content {
    align-items: start;
  }

  .profile-banner__avatar-shell {
    width: 132px;
    height: 132px;
  }
}

@media (max-width: 640px) {
  .user-profile-page {
    padding-inline: 12px;
  }

  .profile-banner {
    border-radius: 28px;
  }

  .profile-banner__content,
  .profile-metrics {
    grid-template-columns: 1fr;
  }

  .profile-banner__content {
    gap: 20px;
    padding: 24px 20px;
  }

  .profile-banner__avatar-shell {
    width: 112px;
    height: 112px;
    padding: 8px;
    border-radius: 28px;
  }

  .profile-banner__avatar {
    border-radius: 22px;
  }

  .profile-banner__main h2 {
    font-size: 30px;
  }

  .profile-section {
    padding: 22px 18px;
  }

  .profile-section__head,
  .profile-article {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
