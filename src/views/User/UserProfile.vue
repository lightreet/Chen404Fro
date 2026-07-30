<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="成员主页"
        eyebrow="Member Profile"
        subtitle="在柔和的樱色光影里，翻开一位成员留下的小小名片。"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="64vh"
        compact
        scroll-target="#user-profile-content"
      />
    </template>

    <main id="user-profile-content" class="user-profile-page">
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
            <span>旅行地点</span>
            <strong>{{ travelMemories.length }}</strong>
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
              <span class="profile-eyebrow">Recent Activity</span>
              <div class="profile-activity-title-tabs" role="tablist" aria-label="成员动态">
                <button
                  id="profile-activity-tab-articles"
                  type="button"
                  class="profile-activity-title-tab"
                  :class="{ 'is-active': activeActivity === 'articles' }"
                  role="tab"
                  :aria-selected="activeActivity === 'articles'"
                  aria-controls="profile-activity-panel"
                  @click="switchActivity('articles')"
                >
                  公开文章
                </button>
                <button
                  id="profile-activity-tab-travel"
                  type="button"
                  class="profile-activity-title-tab"
                  :class="{ 'is-active': activeActivity === 'travel' }"
                  role="tab"
                  :aria-selected="activeActivity === 'travel'"
                  aria-controls="profile-activity-panel"
                  @click="switchActivity('travel')"
                >
                  旅行足迹
                </button>
              </div>
            </div>
            <span class="profile-count profile-count--activity">
              {{ activeActivity === 'articles' ? `${totalArticles} 篇` : `${travelMemories.length} 处` }}
            </span>
          </div>

          <div
            id="profile-activity-panel"
            class="profile-activity-panel"
            role="tabpanel"
            :aria-labelledby="`profile-activity-tab-${activeActivity}`"
          >
            <template v-if="activeActivity === 'articles'">
              <div v-if="articlesLoading" class="profile-state profile-state--inline">正在加载文章...</div>
              <div v-else-if="!articles.length" class="profile-empty">
                <p>这位成员暂时还没有公开文章。</p>
                <span>等下一篇心情或灵感落下来的时候，这里会先亮起来。</span>
              </div>
              <div v-else class="profile-article-list profile-article-list--cards">
                <ArticleCard
                  v-for="(article, index) in articles"
                  :key="String(article.id)"
                  :article="article"
                  :index="index"
                  mode="home"
                  compact
                  profile-feed
                />
              </div>
              <UiPagination
                v-if="totalArticles > ACTIVITY_PAGE_SIZE"
                :current="articlePage"
                :page-size="ACTIVITY_PAGE_SIZE"
                :total="totalArticles"
                :show-total="false"
                class="profile-activity-pager"
                @change="changeArticlePage"
              />
            </template>

            <template v-else>
              <div v-if="travelLoading" class="profile-state profile-state--inline">正在加载旅行足迹...</div>
              <div v-else-if="!travelMemories.length" class="profile-empty">
                <p>这位成员暂时还没有公开旅行地点。</p>
                <span>以后落下的城市、照片和旅途故事，会在这里连成一张地图。</span>
              </div>
              <div v-else class="profile-article-list">
                <RouterLink
                  v-for="memory in paginatedTravelMemories"
                  :key="memory.id"
                  class="profile-article"
                  :to="{ path: '/memory-map', query: { creatorId: userId, focus: String(memory.id) } }"
                >
                  <div class="profile-article__cover">
                    <img
                      v-if="hasTravelCover(memory)"
                      :src="memory.coverImage"
                      :alt="`${memory.title}封面`"
                      loading="lazy"
                      decoding="async"
                      @error="markTravelCoverFailed(memory.id)"
                    />
                    <span v-else class="profile-article__cover-fallback" aria-hidden="true">
                      <UiIcon name="location" :size="24" />
                    </span>
                  </div>
                  <div class="profile-article__content">
                    <div class="profile-article__meta">
                      <span class="profile-article__date">{{ formatDate(memory.visitedAt) || '旅行记录' }}</span>
                      <span v-if="memory.entryCount" class="profile-article__entry-count">
                        {{ memory.entryCount }} 个片段
                      </span>
                    </div>
                    <h3>{{ memory.title }}</h3>
                    <p class="profile-article__location">{{ formatLocation(memory) }}</p>
                    <p v-if="memory.summaryNote" class="profile-article__summary">{{ memory.summaryNote }}</p>
                  </div>
                  <span class="profile-article__arrow">→</span>
                </RouterLink>
              </div>
              <UiPagination
                v-if="travelMemories.length > ACTIVITY_PAGE_SIZE"
                :current="travelPage"
                :page-size="ACTIVITY_PAGE_SIZE"
                :total="travelMemories.length"
                :show-total="false"
                class="profile-activity-pager"
                @change="changeTravelPage"
              />
            </template>
          </div>
        </section>
      </template>
    </main>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { notify } from '@/lib/feedback';
import { useRoute } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import PageHero from '@/components/PageHero/PageHero.vue';
import ArticleCard from '@/components/ArticleCard/ArticleCard.vue';
import { UiIcon, UiPagination } from '@/components/ui';
import { getArticles } from '@/api/article';
import { getTravelMemories } from '@/api/travel-memory';
import { getSiteOwner, getSiteUser, type SiteMember } from '@/api/home';
import type { Article, SiteOwner, TravelMemoryLocationListItem } from '@/types';
import { useSiteConfig } from '@/composables/useSiteConfig';
import { resolveHeroImage, resolveHeroImagePosition } from '@/utils/siteConfig';

const DEFAULT_PROFILE_HERO =
  'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1920&q=80';
const DEFAULT_PROFILE_HERO_POSITION = '50% 42%';
const DEFAULT_MEMBER_AVATAR = '/default-member-avatar.svg';
const LEGACY_DEFAULT_AVATAR = '/default-avatar.jpg';
const ACTIVITY_PAGE_SIZE = 5;

type ProfileActivity = 'articles' | 'travel';

const route = useRoute();
const { loadSiteConfig } = useSiteConfig();

const loading = ref(true);
const articlesLoading = ref(false);
const travelLoading = ref(false);
const profile = ref<SiteMember | null>(null);
const owner = ref<SiteOwner | null>(null);
const articles = ref<Article[]>([]);
const totalArticles = ref(0);
const travelMemories = ref<TravelMemoryLocationListItem[]>([]);
const activeActivity = ref<ProfileActivity>('articles');
const articlePage = ref(1);
const travelPage = ref(1);
const failedTravelCoverIds = ref<Set<number>>(new Set());
const heroBgImage = ref(DEFAULT_PROFILE_HERO);
const heroBgPosition = ref(DEFAULT_PROFILE_HERO_POSITION);

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
const avatarUrl = computed(() => {
  const avatar = profile.value?.avatar?.trim();
  if (!avatar || avatar === LEGACY_DEFAULT_AVATAR) return DEFAULT_MEMBER_AVATAR;
  return avatar;
});
const bannerVars = computed(() => ({
  '--profile-banner-image': `url("${heroBgImage.value}")`,
  '--profile-banner-position': heroBgPosition.value,
}));
const paginatedTravelMemories = computed(() => {
  const start = (travelPage.value - 1) * ACTIVITY_PAGE_SIZE;
  return travelMemories.value.slice(start, start + ACTIVITY_PAGE_SIZE);
});

onMounted(() => {
  void loadSharedData();
});

watch(userId, () => {
  void loadProfile();
});

async function loadSharedData() {
  const [configResult, ownerResult] = await Promise.allSettled([loadSiteConfig(true), getSiteOwner()]);

  if (configResult.status === 'fulfilled') {
    heroBgImage.value = resolveHeroImage(configResult.value, 'about', DEFAULT_PROFILE_HERO);
    heroBgPosition.value = resolveHeroImagePosition(configResult.value, 'about', DEFAULT_PROFILE_HERO_POSITION);
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
  travelMemories.value = [];
  failedTravelCoverIds.value = new Set();
  activeActivity.value = 'articles';
  articlePage.value = 1;
  travelPage.value = 1;
  try {
    profile.value = await getSiteUser(userId.value);
    await Promise.all([loadArticles(), loadTravelMemories()]);
  } catch {
    profile.value = null;
  } finally {
    loading.value = false;
  }
}

async function loadTravelMemories() {
  if (!profile.value) return;
  travelLoading.value = true;
  try {
    travelMemories.value = await getTravelMemories(profile.value.id);
  } catch {
    travelMemories.value = [];
  } finally {
    travelLoading.value = false;
  }
}

async function loadArticles(page = 1) {
  if (!profile.value) return;
  articlePage.value = page;
  articlesLoading.value = true;
  try {
    const result = await getArticles({ page, size: ACTIVITY_PAGE_SIZE, authorId: profile.value.id });
    articles.value = result.list ?? [];
    totalArticles.value = result.total ?? 0;
  } catch {
    articles.value = [];
    totalArticles.value = 0;
  } finally {
    articlesLoading.value = false;
  }
}

function switchActivity(activity: ProfileActivity) {
  activeActivity.value = activity;
}

function changeArticlePage(page: number) {
  void loadArticles(page);
}

function changeTravelPage(page: number) {
  travelPage.value = page;
}

function hasTravelCover(memory: TravelMemoryLocationListItem) {
  return Boolean(memory.coverImage && !failedTravelCoverIds.value.has(memory.id));
}

function markTravelCoverFailed(id: number) {
  failedTravelCoverIds.value = new Set([...failedTravelCoverIds.value, id]);
}

async function copyEmail() {
  if (!profile.value?.email) return;
  try {
    await navigator.clipboard.writeText(profile.value.email);
    notify.success('邮箱已复制');
  } catch {
    notify.warning('复制失败，可以手动选择邮箱');
  }
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function formatLocation(memory: TravelMemoryLocationListItem) {
  return [memory.province, memory.city].filter(Boolean).join(' · ') || '未标注地点';
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
    var(--profile-banner-image) var(--profile-banner-position) / cover no-repeat;
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
  padding: 32px 28px 28px;
}

.profile-section__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  padding-inline: 2px;
}

.profile-eyebrow {
  display: block;
  margin-bottom: 13px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #c0819c;
}

.profile-count {
  flex: 0 0 auto;
  padding-bottom: 10px;
  color: #9f6a83;
  font-size: 14px;
}

.profile-activity-title-tabs {
  display: inline-flex;
  align-items: flex-end;
  gap: 24px;
}

.profile-activity-title-tab {
  position: relative;
  padding: 0 0 10px;
  border: 0;
  background: transparent;
  color: rgba(117, 88, 104, 0.5);
  font: inherit;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  text-wrap: balance;
  cursor: pointer;
  transition:
    color 0.2s ease,
    opacity 0.2s ease;

  &:hover {
    color: rgba(95, 70, 84, 0.78);
  }

  &:focus-visible {
    outline: 2px solid rgba(229, 104, 151, 0.52);
    outline-offset: 4px;
  }

  &.is-active {
    color: #5f4654;
  }

  &.is-active::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 2px;
    border-radius: 999px;
    background: rgba(229, 104, 151, 0.58);
  }
}

.profile-activity-panel {
  min-width: 0;
}

.profile-activity-pager {
  margin-top: 22px;

  :deep(.ui-pagination) {
    justify-content: center;
  }
}

.profile-article-list {
  display: grid;
  gap: 14px;
}

.profile-article-list--cards {
  gap: 16px;

  :deep(.article-card.compact.profile-feed) {
    width: 100%;
    margin-right: 0;
    margin-left: 0;
  }
}

.profile-article {
  display: grid;
  grid-template-columns: 184px minmax(0, 1fr) auto;
  align-items: center;
  gap: 22px;
  min-height: 152px;
  padding: 16px 20px 16px 16px;
  border-radius: 20px;
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

.profile-article__cover {
  position: relative;
  width: 184px;
  height: 120px;
  overflow: hidden;
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(249, 222, 233, 0.78), rgba(229, 224, 242, 0.72));

  img,
  .profile-article__cover-fallback {
    width: 100%;
    height: 100%;
  }

  img {
    display: block;
    object-fit: cover;
    transition: transform 0.28s ease;
  }
}

.profile-article:hover .profile-article__cover img {
  transform: scale(1.035);
}

.profile-article__cover-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(134, 92, 112, 0.72);
}

.profile-article__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 9px;
}

.profile-article__date {
  color: #c28aa2;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.profile-article__entry-count {
  flex: 0 0 auto;
  color: rgba(120, 96, 111, 0.66);
  font-size: 11px;
}

.profile-article h3 {
  margin: 0;
  color: #5a4250;
  font-size: 18px;
  line-height: 1.4;
}

.profile-article__location {
  margin: 8px 0 0;
  color: rgba(101, 79, 93, 0.74);
  font-size: 14px;
  line-height: 1.72;
}

.profile-article__summary {
  display: -webkit-box;
  margin: 5px 0 0;
  overflow: hidden;
  color: rgba(109, 90, 102, 0.62);
  font-size: 12px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
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

@media (prefers-reduced-motion: reduce) {
  .profile-activity-title-tab,
  .profile-article__cover img {
    transition: none;
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

  .profile-section__head {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 26px;
  }

  .profile-activity-title-tabs {
    gap: 18px;
  }

  .profile-activity-title-tab {
    font-size: 22px;
  }

  .profile-count {
    padding-bottom: 0;
  }

  .profile-article {
    grid-template-columns: 96px minmax(0, 1fr);
    gap: 14px;
    min-height: 128px;
    padding: 14px;
  }

  .profile-article__cover {
    width: 96px;
    height: 100px;
    border-radius: 12px;
  }

  .profile-article__arrow {
    display: none;
  }

  .profile-article__meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
    margin-bottom: 6px;
  }

  .profile-article h3 {
    font-size: 16px;
  }

  .profile-article__location {
    margin-top: 5px;
    font-size: 12px;
  }

  .profile-article__summary {
    -webkit-line-clamp: 1;
  }
}
</style>
