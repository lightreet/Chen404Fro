<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        class="about-hero"
        title="关于 Chen404"
        eyebrow="About"
        subtitle="一个写技术、听音乐，也珍藏旅途与朋友的小站"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="52vh"
        compact
      />
    </template>

    <div class="about-page">
      <section class="community-section" aria-labelledby="about-community-title">
        <header class="section-heading">
          <div>
            <h2 id="about-community-title">一起停留的人</h2>
            <p>{{ communitySummary }}</p>
          </div>
          <button
            v-if="canToggleMembers"
            type="button"
            class="member-toggle"
            :aria-expanded="membersExpanded"
            @click="membersExpanded = !membersExpanded"
          >
            {{ memberToggleLabel }}
          </button>
        </header>

        <div v-if="isMembersLoading" class="member-status" role="status">
          正在加载成员信息…
        </div>

        <div v-else-if="activeMember" class="community-layout">
          <article class="member-preview">
            <img
              :src="getMemberAvatar(activeMember)"
              :alt="getMemberDisplayName(activeMember)"
              @error="handleAvatarError"
            />
            <div class="member-preview__content">
              <span class="member-role">{{ getMemberRoleLabel(activeMember) }}</span>
              <h3>{{ getMemberDisplayName(activeMember) }}</h3>
              <p v-if="activeMember.username" class="member-handle">@{{ activeMember.username }}</p>
              <p class="member-bio">{{ getMemberBio(activeMember) }}</p>
              <button
                type="button"
                class="member-card-button"
                @click="openMemberCard(activeMember)"
              >
                查看成员卡片
              </button>
            </div>
          </article>

          <div class="member-picker">
            <p class="member-picker__label">选择头像预览成员，打开卡片查看详情</p>
            <div class="member-list">
              <button
                v-for="member in visibleMembers"
                :key="member.id"
                type="button"
                class="member-option"
                :class="{ 'is-active': String(activeMember.id) === String(member.id) }"
                :aria-label="`预览 ${getMemberDisplayName(member)}`"
                :aria-pressed="String(activeMember.id) === String(member.id)"
                :title="getMemberDisplayName(member)"
                @mouseenter="setActiveMember(member.id)"
                @focus="setActiveMember(member.id)"
                @click="setActiveMember(member.id)"
              >
                <img
                  :src="getMemberAvatar(member)"
                  alt=""
                  @error="handleAvatarError"
                />
                <span>
                  <strong>{{ getMemberDisplayName(member) }}</strong>
                  <small>{{ getMemberRoleLabel(member) }}</small>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="member-status">
          <p>{{ membersLoadFailed ? '成员信息暂时没有加载成功。' : '这里还没有成员信息。' }}</p>
          <button
            v-if="membersLoadFailed"
            type="button"
            class="member-card-button"
            @click="loadAboutPage"
          >
            重新加载成员
          </button>
        </div>
      </section>

      <UserProfilePopover
        v-model="profilePopoverVisible"
        :user="selectedMember"
        :owner-id="owner?.id"
      />

      <section class="site-notes" aria-labelledby="about-site-notes-title">
        <div class="site-notes__mark" aria-hidden="true">
          <span>Chen</span>
          <strong>404</strong>
        </div>

        <div class="site-notes__copy">
          <h2 id="about-site-notes-title">有想聊的文章、歌或旅途，欢迎来信。</h2>
          <p>这里的内容由 {{ ownerName }} 持续整理，代码与项目记录放在 GitHub。</p>
        </div>

        <nav v-if="contactEmail || githubLink" class="site-links" aria-label="联系站长">
          <a
            v-if="contactEmail"
            :href="`mailto:${contactEmail}`"
            :aria-label="`写邮件到 ${contactEmail}`"
            :title="contactEmail"
            class="site-link site-link--primary"
          >
            <UiIcon name="Message" />
            <span>写封邮件</span>
          </a>
          <a
            v-if="githubLink"
            :href="githubLink"
            target="_blank"
            rel="noreferrer"
            class="site-link site-link--secondary"
          >
            <UiIcon name="Link" />
            <span>查看 GitHub</span>
          </a>
        </nav>
        <p v-else class="contact-empty">联系方式将在站点配置完善后显示。</p>
      </section>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { SiteOwner } from '@/types';
import { getSiteMembers, getSiteOwner, type SiteMember } from '@/api/home';
import PageHero from '@/components/PageHero/PageHero.vue';
import UserProfilePopover from '@/components/UserProfile/UserProfilePopover.vue';
import { UiIcon } from '@/components/ui';
import { useSiteConfig } from '@/composables/useSiteConfig';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { resolveHeroImagePosition } from '@/utils/siteConfig';

const DEFAULT_ABOUT_HERO =
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&q=80';
const DEFAULT_ABOUT_HERO_POSITION = '50% 42%';
const DEFAULT_OWNER_NAME = 'Chen404';
const DEFAULT_MEMBER_AVATAR = '/default-member-avatar.svg';
const DEFAULT_GITHUB_LINK = 'https://github.com/lightreet';
const LEGACY_GITHUB_LINK = 'https://github.com/chen404';
const LEGACY_DEFAULT_AVATAR = '/default-avatar.jpg';
const INITIAL_MEMBER_LIMIT = 4;
const heroBgImage = ref(DEFAULT_ABOUT_HERO);
const heroBgPosition = ref(DEFAULT_ABOUT_HERO_POSITION);
const owner = ref<SiteOwner | null>(null);
const members = ref<SiteMember[]>([]);
const activeMemberId = ref<string | null>(null);
const selectedMember = ref<SiteMember | null>(null);
const profilePopoverVisible = ref(false);
const siteEmail = ref('');
const githubLink = ref('');
const membersExpanded = ref(false);
const isMembersLoading = ref(true);
const membersLoadFailed = ref(false);
const { loadSiteConfig } = useSiteConfig();

const ownerMember = computed<SiteMember | null>(() => {
  if (!owner.value) {
    return null;
  }

  return {
    id: owner.value.id,
    username: owner.value.username,
    nickname: owner.value.nickname,
    avatar: owner.value.avatar,
    bio: owner.value.bio,
    trustLevel: 1,
    memberLabel: owner.value.memberLabel,
  };
});

const displayMembers = computed<SiteMember[]>(() => {
  const ownerId = owner.value?.id ?? null;
  const memberMap = new Map<string, SiteMember>();

  if (ownerMember.value?.id != null) {
    memberMap.set(String(ownerMember.value.id), ownerMember.value);
  }

  members.value.forEach((member) => {
    if (member?.id != null) {
      memberMap.set(String(member.id), member);
    }
  });

  return Array.from(memberMap.values()).sort((left, right) => {
    if (ownerId != null && String(left.id) === String(ownerId) && String(right.id) !== String(ownerId)) {
      return -1;
    }
    if (ownerId != null && String(right.id) === String(ownerId) && String(left.id) !== String(ownerId)) {
      return 1;
    }

    const trustGap = (right.trustLevel ?? 0) - (left.trustLevel ?? 0);
    if (trustGap !== 0) {
      return trustGap;
    }

    const leftTime = left.createTime ? Date.parse(left.createTime) : 0;
    const rightTime = right.createTime ? Date.parse(right.createTime) : 0;
    return leftTime - rightTime;
  });
});

const activeMember = computed(() => {
  if (!displayMembers.value.length) {
    return null;
  }

  return (
    displayMembers.value.find((member) => String(member.id) === activeMemberId.value) ??
    displayMembers.value[0]
  );
});

const visibleMembers = computed(() =>
  membersExpanded.value
    ? displayMembers.value
    : displayMembers.value.slice(0, INITIAL_MEMBER_LIMIT)
);
const memberCount = computed(() => displayMembers.value.length);
const canToggleMembers = computed(() => memberCount.value > INITIAL_MEMBER_LIMIT);
const memberToggleLabel = computed(() =>
  membersExpanded.value ? '收起成员' : `查看全部 ${memberCount.value} 位成员`
);
const communitySummary = computed(() =>
  memberCount.value > 0
    ? `${memberCount.value} 位成员在这里留下了名字，选择一位认识他们。`
    : '成员们会在这里留下名字和一点介绍。'
);
const ownerName = computed(() =>
  owner.value?.nickname?.trim() || owner.value?.username || DEFAULT_OWNER_NAME
);
const contactEmail = computed(() => siteEmail.value || owner.value?.email?.trim() || '');

watch(
  displayMembers,
  (list) => {
    if (!list.length) {
      activeMemberId.value = null;
      return;
    }

    if (!list.some((member) => String(member.id) === activeMemberId.value)) {
      activeMemberId.value = String(owner.value?.id ?? list[0].id);
    }
  },
  { immediate: true }
);

function setActiveMember(id: number | string) {
  activeMemberId.value = String(id);
}

function openMemberCard(member: SiteMember) {
  setActiveMember(member.id);
  selectedMember.value = member;
  profilePopoverVisible.value = true;
}

function getMemberDisplayName(member: SiteMember) {
  return member.nickname?.trim() || member.username || DEFAULT_OWNER_NAME;
}

function getMemberAvatar(member: SiteMember) {
  return resolveMemberAvatar(member.avatar);
}

function getMemberBio(member: SiteMember) {
  return member.bio?.trim() || '在 Chen404 留下了一颗名字。';
}

function getMemberRoleLabel(member: SiteMember) {
  if (String(owner.value?.id) === String(member.id)) {
    return '站长';
  }
  if (member.memberLabel?.trim()) {
    return member.memberLabel.trim();
  }
  return member.trustLevel === 1 ? '知友' : '成员';
}

function resolveMemberAvatar(avatar?: string, fallback: string = DEFAULT_MEMBER_AVATAR) {
  const normalized = avatar?.trim();
  if (!normalized || normalized === LEGACY_DEFAULT_AVATAR) {
    return fallback;
  }
  return normalized;
}

function handleAvatarError(event: Event) {
  const image = event.currentTarget as HTMLImageElement | null;
  if (!image) return;
  image.onerror = null;
  image.src = DEFAULT_MEMBER_AVATAR;
}

function normalizeGithubLink(link?: string) {
  const normalized = link?.trim();
  if (!normalized || normalized === LEGACY_GITHUB_LINK) {
    return DEFAULT_GITHUB_LINK;
  }
  return normalized;
}

async function loadAboutPage() {
  isMembersLoading.value = true;
  membersLoadFailed.value = false;

  const [configResult, ownerResult, memberResult] = await Promise.allSettled([
    loadSiteConfig(true),
    getSiteOwner(),
    getSiteMembers(),
  ]);

  if (configResult.status === 'fulfilled') {
    heroBgImage.value = configResult.value.heroImages?.about || DEFAULT_ABOUT_HERO;
    heroBgPosition.value = resolveHeroImagePosition(
      configResult.value,
      'about',
      DEFAULT_ABOUT_HERO_POSITION
    );
    siteEmail.value = configResult.value.email || '';
    githubLink.value = normalizeGithubLink(configResult.value.github);
  }

  if (ownerResult.status === 'fulfilled' && ownerResult.value) {
    owner.value = ownerResult.value;
  }

  if (memberResult.status === 'fulfilled') {
    members.value = memberResult.value ?? [];
  } else {
    membersLoadFailed.value = true;
  }

  isMembersLoading.value = false;
}

onMounted(() => {
  void loadAboutPage();
});
</script>

<style scoped lang="scss">
.about-hero :deep(.page-hero__bg)::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at center, rgba(57, 37, 49, 0.34), rgba(57, 37, 49, 0.08) 58%),
    linear-gradient(to bottom, rgba(43, 27, 38, 0.08), rgba(43, 27, 38, 0.2));
  pointer-events: none;
}

.about-hero :deep(.page-hero__subtitle-text) {
  color: #fff;
  text-shadow: 0 2px 10px rgba(32, 20, 28, 0.7);
}

.about-page {
  width: min(100%, 1120px);
  margin: 0 auto;
  padding: clamp(36px, 5vw, 64px) 24px 80px;
  display: grid;
  gap: clamp(52px, 7vw, 80px);
}

.section-heading h2,
.site-notes h2 {
  margin: 0;
  color: var(--color-text-primary);
  text-wrap: balance;
}

.member-toggle:focus-visible,
.member-option:focus-visible,
.member-card-button:focus-visible,
.site-links a:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.community-section {
  display: grid;
  gap: 28px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border-light);
}

.section-heading h2 {
  font-size: clamp(26px, 3vw, 34px);
  line-height: 1.2;
}

.section-heading p {
  margin: 10px 0 0;
  color: var(--color-text-secondary);
  font-size: 15px;
  line-height: 1.65;
}

.member-toggle {
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-accent-strong);
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
}

.community-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(340px, 0.95fr);
  gap: clamp(28px, 5vw, 56px);
  align-items: center;
}

.member-preview {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 22px;
  align-items: center;
  padding: 28px;
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  background: var(--color-surface);
}

.member-preview > img {
  width: 104px;
  height: 104px;
  border-radius: 14px;
  object-fit: cover;
  background: var(--color-surface-muted);
}

.member-role {
  color: var(--color-accent-strong);
  font-size: 13px;
  font-weight: 650;
}

.member-preview h3 {
  margin: 6px 0 0;
  color: var(--color-text-primary);
  font-size: 24px;
  line-height: 1.25;
}

.member-handle {
  margin: 3px 0 0;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.member-bio {
  margin: 14px 0 0;
  color: var(--color-text-secondary);
  font-size: 15px;
  line-height: 1.7;
  text-wrap: pretty;
}

.member-card-button {
  min-height: 42px;
  margin-top: 18px;
  padding: 0 16px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
  transition: background var(--motion-duration-fast) var(--motion-ease-standard);
}

.member-card-button:hover {
  background: color-mix(in srgb, var(--color-accent) 20%, transparent);
}

.member-picker {
  min-width: 0;
}

.member-picker__label {
  margin: 0 0 14px;
  color: var(--color-text-tertiary);
  font-size: 13px;
  line-height: 1.6;
}

.member-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.member-option {
  min-width: 0;
  min-height: 76px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  background: transparent;
  color: var(--color-text-secondary);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    background var(--motion-duration-fast) var(--motion-ease-standard),
    color var(--motion-duration-fast) var(--motion-ease-standard);
}

.member-option:hover,
.member-option.is-active {
  border-color: color-mix(in srgb, var(--color-accent) 48%, var(--color-border));
  background: var(--color-accent-soft);
  color: var(--color-text-primary);
}

.member-option img {
  flex: 0 0 auto;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--color-surface-muted);
}

.member-option span {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.member-option strong,
.member-option small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-option strong {
  font-size: 14px;
  font-weight: 650;
}

.member-option small {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.member-status {
  min-height: 160px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 4px;
  padding: 28px;
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  text-align: center;
}

.member-status p {
  margin: 0;
}

.site-notes {
  position: relative;
  display: grid;
  grid-template-columns: minmax(148px, 190px) minmax(0, 1fr);
  align-items: center;
  column-gap: clamp(28px, 5vw, 64px);
  row-gap: 18px;
  overflow: hidden;
  padding: clamp(28px, 4vw, 48px);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  background: var(--color-surface);
}

.site-notes__mark {
  width: 100%;
  min-height: 156px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--color-accent-soft);
  line-height: 0.82;
  user-select: none;
}

.site-notes__mark span {
  margin-left: 0.1em;
  color: var(--color-accent-strong);
  font-size: clamp(15px, 1.7vw, 20px);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.site-notes__mark strong {
  color: var(--color-accent-strong);
  font-family: "Patrick Hand", "ZCOOL KuaiLe", "Segoe Print", cursive;
  font-size: clamp(68px, 7vw, 88px);
  font-weight: 400;
  letter-spacing: -0.03em;
}

.site-notes__copy {
  align-self: end;
  max-width: 620px;
}

.site-notes h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: clamp(24px, 2.8vw, 34px);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.site-notes__copy p {
  max-width: 42ch;
  margin: 14px 0 0;
  color: var(--color-text-secondary);
  font-size: 15px;
  line-height: 1.75;
  text-wrap: pretty;
}

.site-links {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: -12px;
}

.site-links a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 11px;
  justify-content: center;
  padding: 0 18px;
  border-radius: var(--radius-pill);
  font-size: 14px;
  font-weight: 650;
  text-decoration: none;
  transition:
    background var(--motion-duration-fast) var(--motion-ease-standard),
    color var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);
}

.site-link--primary {
  background: var(--color-accent);
  color: #fff;
}

.site-link--secondary {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
}

.site-links a:hover {
  transform: translateY(-1px);
}

.site-link--primary:hover {
  background: var(--primary-hover);
  color: #fff;
}

.site-link--secondary:hover {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.site-links a:focus-visible {
  outline: 2px solid var(--color-accent-strong);
  outline-offset: 3px;
}

.contact-empty {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 14px;
}

@media (max-width: 900px) {
  .community-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .about-page {
    padding: 32px 18px 56px;
    gap: 44px;
  }

  .section-heading {
    align-items: start;
    flex-direction: column;
    gap: 8px;
  }

  .member-preview {
    grid-template-columns: 76px minmax(0, 1fr);
    align-items: start;
    gap: 16px;
    padding: 20px;
  }

  .member-preview > img {
    width: 76px;
    height: 76px;
    border-radius: 12px;
  }

  .member-preview h3 {
    font-size: 20px;
  }

  .member-bio,
  .member-card-button {
    grid-column: 1 / -1;
  }

  .member-list {
    gap: 10px;
  }

  .member-option {
    min-height: 68px;
    gap: 9px;
    padding: 8px;
  }

  .member-option img {
    width: 44px;
    height: 44px;
  }

  .site-notes {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 24px;
    padding: 28px 24px;
  }

  .site-notes__mark {
    width: 124px;
    min-height: 112px;
  }

  .site-notes__mark strong {
    font-size: 68px;
  }

  .site-links {
    grid-column: 1;
    margin-top: 0;
  }

  .site-links a {
    flex: 1 1 150px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .member-card-button,
  .member-option,
  .site-links a {
    transition: none;
  }

  .site-links a:hover {
    transform: none;
  }
}
</style>
