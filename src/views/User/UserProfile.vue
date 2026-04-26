<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        :title="heroTitle"
        eyebrow="Profile"
        subtitle="一张小小名片，也是一位成员在 Chen404 留下的坐标。"
        :bg-image="heroBgImage"
        bg-position="center 42%"
        min-height="58vh"
        :overlay-opacity="0.48"
        compact
      />
    </template>

    <main class="user-profile-page">
      <section v-if="loading" class="profile-state">正在加载用户资料...</section>
      <section v-else-if="!profile" class="profile-state">没有找到这个用户。</section>

      <template v-else>
        <section class="profile-overview">
          <UserProfileCard :user="profile" :owner-id="owner?.id" class="profile-main-card" />

          <aside class="profile-side-panel">
            <div class="profile-side-panel__header">
              <span class="profile-eyebrow">Member Note</span>
              <h2>{{ displayName }} 的小主页</h2>
              <p>{{ bioText }}</p>
            </div>

            <div class="profile-stats">
              <div class="profile-stat">
                <span>公开文章</span>
                <strong>{{ totalArticles }}</strong>
              </div>
              <div class="profile-stat">
                <span>成员身份</span>
                <strong>{{ identityLabel }}</strong>
              </div>
              <div class="profile-stat">
                <span>加入时间</span>
                <strong>{{ joinText }}</strong>
              </div>
            </div>

            <dl class="profile-details">
              <div>
                <dt>用户名</dt>
                <dd>@{{ profile.username }}</dd>
              </div>
              <div>
                <dt>邮箱</dt>
                <dd>
                  <a v-if="profile.email" :href="`mailto:${profile.email}`">{{ profile.email }}</a>
                  <span v-else>未公开</span>
                </dd>
              </div>
            </dl>
          </aside>
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
            这位成员暂时还没有公开文章。
          </div>
          <div v-else class="profile-article-list">
            <RouterLink
              v-for="article in articles"
              :key="article.id"
              class="profile-article"
              :to="`/article/${article.id}`"
            >
              <div>
                <h3>{{ article.title }}</h3>
                <p>{{ article.summary || '这篇文章还没有摘要。' }}</p>
              </div>
              <span>{{ formatDate(article.publishTime || article.createTime) }}</span>
            </RouterLink>
          </div>
        </section>
      </template>
    </main>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import PageHero from '@/components/PageHero/PageHero.vue';
import UserProfileCard from '@/components/UserProfile/UserProfileCard.vue';
import { getArticles } from '@/api/article';
import { getSiteOwner, getSiteUser, type SiteMember } from '@/api/home';
import type { Article, SiteOwner } from '@/types';
import { useSiteConfig } from '@/composables/useSiteConfig';

const DEFAULT_PROFILE_HERO =
  'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1920&q=80';

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
const heroTitle = computed(() => displayName.value || '成员主页');
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

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}
</script>

<style scoped lang="scss">
.user-profile-page {
  width: min(100%, 1120px);
  margin: 0 auto;
  padding: 24px 18px 0;
  display: grid;
  gap: 24px;
}

.profile-overview {
  display: grid;
  grid-template-columns: minmax(320px, 0.86fr) minmax(0, 1.14fr);
  gap: 22px;
  align-items: stretch;
}

.profile-main-card {
  width: 100%;
  min-height: 100%;
}

.profile-side-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 22px;
  min-width: 0;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 28px;
  background:
    radial-gradient(circle at 82% 18%, rgba(255, 211, 230, 0.36), transparent 34%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.86), rgba(248, 242, 250, 0.74));
  box-shadow:
    0 24px 48px rgba(214, 166, 189, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.profile-side-panel__header {
  h2 {
    margin: 8px 0 12px;
    color: #5e3a4a;
    font-size: 38px;
    line-height: 1.15;
  }

  p {
    margin: 0;
    color: rgba(92, 71, 86, 0.78);
    font-size: 15px;
    line-height: 1.85;
  }
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.profile-stat,
.profile-details > div {
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.64);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.58);
}

.profile-stat {
  padding: 16px;

  span {
    display: block;
    color: rgba(143, 93, 118, 0.78);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 8px;
    overflow: hidden;
    color: #5e3a4a;
    font-size: 20px;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.profile-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;

  > div {
    padding: 15px 16px;
  }

  dt {
    color: rgba(143, 93, 118, 0.78);
    font-size: 12px;
  }

  dd {
    margin: 8px 0 0;
    overflow: hidden;
    color: #604c5d;
    font-size: 14px;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
}

.profile-section,
.profile-state,
.profile-empty {
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.86), rgba(255, 246, 250, 0.72)),
    radial-gradient(circle at top right, rgba(255, 212, 230, 0.34), transparent 42%);
  box-shadow:
    0 24px 48px rgba(214, 166, 189, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.profile-section {
  padding: 26px;
}

.profile-section__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;

  h2 {
    margin: 6px 0 0;
    color: #5e3a4a;
    font-size: 26px;
  }
}

.profile-eyebrow {
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #ba7d97;
}

.profile-count {
  flex: 0 0 auto;
  color: #9a6079;
  font-size: 14px;
}

.profile-article-list {
  display: grid;
  gap: 12px;
}

.profile-article {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.66);
  color: inherit;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

  h3 {
    margin: 0;
    color: #594353;
    font-size: 17px;
  }

  p {
    margin: 8px 0 0;
    color: rgba(99, 75, 91, 0.74);
    font-size: 14px;
    line-height: 1.65;
  }

  > span {
    flex: 0 0 auto;
    color: rgba(145, 100, 122, 0.74);
    font-size: 13px;
  }
}

.profile-article:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 16px 28px rgba(198, 154, 178, 0.12);
}

.profile-state,
.profile-empty {
  padding: 30px;
  color: rgba(99, 75, 91, 0.76);
  text-align: center;
}

.profile-state--inline {
  border-radius: 20px;
  box-shadow: none;
}

@media (max-width: 640px) {
  .user-profile-page {
    padding-inline: 12px;
  }

  .profile-overview,
  .profile-stats,
  .profile-details {
    grid-template-columns: 1fr;
  }

  .profile-side-panel {
    padding: 24px;
  }

  .profile-side-panel__header h2 {
    font-size: 28px;
  }

  .profile-section {
    padding: 22px;
  }

  .profile-section__head,
  .profile-article {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
