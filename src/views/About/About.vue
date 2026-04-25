<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="关于 Chen404"
        eyebrow="About"
        subtitle="这里不只是文章集合，也慢慢长成了一片有人停留、有人共鸣、有人一起留下痕迹的小小星群。"
        :bg-image="heroBgImage"
        bg-position="center 42%"
        min-height="70vh"
        :overlay-opacity="0.48"
        compact
      />
    </template>

    <div class="about-page">
      <section class="glass-panel community-panel">
        <div class="community-layout">
          <div class="community-main">
            <div class="community-copy">
              <span class="eyebrow">Member Constellation</span>
              <h2 class="panel-title">从一个人，到一片星群</h2>
            </div>
            <article v-if="activeMember" class="member-preview" :class="memberIdentityClass(activeMember)">
              <div class="member-preview__halo"></div>
              <div class="member-preview__header">
                <div class="member-preview__avatar">
                  <img :src="getMemberAvatar(activeMember)" :alt="getMemberDisplayName(activeMember)" />
                </div>
                <div class="member-preview__title">
                  <div class="member-preview__badges">
                    <span class="member-chip member-chip--strong">{{ memberIdentityLabel(activeMember) }}</span>
                    <span class="member-chip">加入于 {{ formatJoinTime(activeMember.createTime) }}</span>
                  </div>
                  <h3>{{ getMemberDisplayName(activeMember) }}</h3>
                  <p>@{{ activeMember.username }}</p>
                </div>
              </div>
              <p class="member-preview__bio">
                {{ activeMember.bio?.trim() || '正在这里安静留下自己的头像与名字，也让这片小站变得更完整一点。' }}
              </p>
              <div class="member-preview__meta">
                <span class="member-preview__meta-item">
                  <el-icon><UserFilled /></el-icon>
                  <span>{{ owner?.id === activeMember.id ? '站点创建者' : '站点注册成员' }}</span>
                </span>
                <span v-if="activeMember.trustLevel === 1 && owner?.id !== activeMember.id" class="member-preview__meta-item">
                  <el-icon><StarFilled /></el-icon>
                  <span>{{ activeMember.memberLabel || '知友' }}</span>
                </span>
              </div>
            </article>
          </div>

          <div class="community-side">
            <div class="community-aside">
              <p class="community-hint">鼠标悬浮头像即可切换预览，移动端也可以直接点击头像查看。</p>
              <div class="community-stats">
                <span class="community-stat">已注册 {{ memberCount }} 位成员</span>
                <span class="community-stat">知友 {{ trustedCount }} 位</span>
                <span class="community-stat">悬浮头像可预览成员卡片</span>
              </div>
            </div>

            <div class="member-cloud">
              <button
                v-for="(member, index) in displayMembers"
                :key="member.id"
                type="button"
                class="member-orb"
                :class="[memberIdentityClass(member), { 'is-active': activeMember?.id === member.id }]"
                :style="getMemberOrbStyle(index)"
                :aria-label="`查看 ${getMemberDisplayName(member)} 的信息卡片`"
                @mouseenter="setActiveMember(member.id)"
                @focus="setActiveMember(member.id)"
                @click="setActiveMember(member.id)"
              >
                <span class="member-orb__glow"></span>
                <span class="member-orb__ring"></span>
                <img :src="getMemberAvatar(member)" :alt="getMemberDisplayName(member)" />
                <span class="member-orb__label">{{ getMemberDisplayName(member) }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div class="about-grid">
        <section class="glass-panel story-panel">
          <span class="eyebrow">Why We Gather</span>
          <h2 class="panel-title">让“关于”不再只是一个人的独白</h2>
          <p class="panel-text">
            这里会认真展示每一位已经注册的成员。头像、名字和一点点介绍放在一起，
            让这个小站从个人记录，慢慢变成一片有人停留的共同角落。
          </p>
          <div class="tech-tags">
            <span v-for="tech in techs" :key="tech" class="tech-tag">{{ tech }}</span>
          </div>
        </section>

        <section class="glass-panel contact-panel">
          <span class="eyebrow">Contact & Signals</span>
          <h2 class="panel-title">如果你也想留下痕迹，我们总会在这里相遇</h2>
          <div class="contact-list">
            <a v-if="siteEmail" :href="`mailto:${siteEmail}`" class="contact-item">
              <el-icon><Message /></el-icon>
              <span>{{ siteEmail }}</span>
            </a>
            <a v-if="githubLink" :href="githubLink" class="contact-item" target="_blank" rel="noreferrer">
              <el-icon><Link /></el-icon>
              <span>GitHub</span>
            </a>
            <div class="contact-item contact-item--muted">
              <span class="contact-item__label">成员数</span>
              <strong>{{ memberCount }}</strong>
            </div>
            <div class="contact-item contact-item--muted">
              <span class="contact-item__label">知友</span>
              <strong>{{ trustedCount }}</strong>
            </div>
            <div v-if="!siteEmail && !githubLink" class="contact-empty">
              联系方式会在站点配置完善后展示在这里。
            </div>
          </div>
        </section>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, onMounted, ref, watch } from 'vue';
import { Link, Message, StarFilled, UserFilled } from '@element-plus/icons-vue';
import type { SiteOwner } from '@/types';
import { getSiteMembers, getSiteOwner, type SiteMember } from '@/api/home';
import PageHero from '@/components/PageHero/PageHero.vue';
import { useSiteConfig } from '@/composables/useSiteConfig';
import DefaultLayout from '@/layouts/DefaultLayout.vue';

const techs = ref(['Vue 3', 'TypeScript', 'Spring Boot', 'Java', 'MySQL', 'Redis']);
const DEFAULT_ABOUT_HERO =
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&q=80';
const DEFAULT_OWNER_NAME = 'Chen404';
const DEFAULT_MEMBER_AVATAR = '/default-member-avatar.svg';
const DEFAULT_GITHUB_LINK = 'https://github.com/lightreet';
const LEGACY_GITHUB_LINK = 'https://github.com/chen404';
const LEGACY_DEFAULT_AVATAR = '/default-avatar.jpg';

const heroBgImage = ref(DEFAULT_ABOUT_HERO);
const owner = ref<SiteOwner | null>(null);
const members = ref<SiteMember[]>([]);
const activeMemberId = ref<number | null>(null);
const siteEmail = ref('');
const githubLink = ref('');
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
  };
});
const displayMembers = computed<SiteMember[]>(() => {
  const ownerId = owner.value?.id ?? null;
  const memberMap = new Map<number, SiteMember>();

  if (ownerMember.value?.id != null) {
    memberMap.set(ownerMember.value.id, ownerMember.value);
  }

  members.value.forEach((member) => {
    if (member?.id != null) {
      memberMap.set(member.id, member);
    }
  });

  return Array.from(memberMap.values()).sort((left, right) => {
    if (ownerId != null && left.id === ownerId && right.id !== ownerId) {
      return -1;
    }
    if (ownerId != null && right.id === ownerId && left.id !== ownerId) {
      return 1;
    }

    const trustGap = (right.trustLevel ?? 0) - (left.trustLevel ?? 0);
    if (trustGap !== 0) {
      return trustGap;
    }

    return dayjs(left.createTime).valueOf() - dayjs(right.createTime).valueOf();
  });
});
const activeMember = computed(() => {
  if (!displayMembers.value.length) {
    return null;
  }

  return (
    displayMembers.value.find((member) => member.id === activeMemberId.value) ??
    displayMembers.value[0]
  );
});
const memberCount = computed(() => displayMembers.value.length);
const trustedCount = computed(() =>
  displayMembers.value.filter((member) => member.trustLevel === 1 && member.id !== owner.value?.id).length
);

watch(
  displayMembers,
  (list) => {
    if (!list.length) {
      activeMemberId.value = null;
      return;
    }

    if (!list.some((member) => member.id === activeMemberId.value)) {
      activeMemberId.value = owner.value?.id ?? list[0].id;
    }
  },
  { immediate: true }
);

function setActiveMember(id: number) {
  activeMemberId.value = id;
}

function getMemberDisplayName(member: SiteMember) {
  return member.nickname?.trim() || member.username || DEFAULT_OWNER_NAME;
}

function getMemberAvatar(member: SiteMember) {
  return resolveMemberAvatar(member.avatar, DEFAULT_MEMBER_AVATAR);
}

function resolveMemberAvatar(avatar?: string, fallback: string = DEFAULT_MEMBER_AVATAR) {
  const normalized = avatar?.trim();
  if (!normalized || normalized === LEGACY_DEFAULT_AVATAR) {
    return fallback;
  }
  return normalized;
}

function normalizeGithubLink(link?: string) {
  const normalized = link?.trim();
  if (!normalized || normalized === LEGACY_GITHUB_LINK) {
    return DEFAULT_GITHUB_LINK;
  }
  return normalized;
}

function memberIdentityLabel(member: SiteMember) {
  if (owner.value?.id === member.id) {
    return '主理人';
  }
  if (member.memberLabel?.trim()) {
    return member.memberLabel.trim();
  }
  return member.trustLevel === 1 ? '知友' : '读者';
}

function memberIdentityClass(member: SiteMember) {
  if (owner.value?.id === member.id) {
    return 'is-owner';
  }
  if (member.trustLevel === 1) {
    return 'is-trusted';
  }
  return 'is-member';
}

function formatJoinTime(value?: string) {
  if (!value) {
    return '最近加入';
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY.MM.DD') : '最近加入';
}

function getMemberOrbStyle(index: number) {
  const sizes = [74, 58, 86, 66, 92, 62, 78, 70, 84, 60];
  const shiftX = [-10, 14, -16, 20, 6, -20, 12, -24, 18, -8];
  const shiftY = [-16, 18, -6, 24, -22, 10, -26, 14, -12, 22];
  const delays = [0, 0.45, 1.1, 0.75, 1.5, 0.25, 1.9, 0.95, 1.35, 0.6];

  return {
    '--orb-size': `${sizes[index % sizes.length]}px`,
    '--orb-shift-x': `${shiftX[index % shiftX.length]}px`,
    '--orb-shift-y': `${shiftY[index % shiftY.length]}px`,
    '--orb-delay': `${delays[index % delays.length]}s`,
  };
}

onMounted(() => {
  void Promise.allSettled([loadSiteConfig(true), getSiteOwner(), getSiteMembers()]).then(
    ([configResult, ownerResult, memberResult]) => {
      if (configResult.status === 'fulfilled') {
        heroBgImage.value = configResult.value.heroImages?.about || DEFAULT_ABOUT_HERO;
        siteEmail.value = configResult.value.email || '';
        githubLink.value = normalizeGithubLink(configResult.value.github);
      }

      if (ownerResult.status === 'fulfilled' && ownerResult.value) {
        owner.value = ownerResult.value;
      }

      if (memberResult.status === 'fulfilled') {
        members.value = memberResult.value ?? [];
      }
    }
  );
});
</script>

<style scoped lang="scss">
.about-page {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding-top: 24px;
  display: grid;
  gap: 24px;
}

.glass-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 32px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.86), rgba(255, 246, 250, 0.72)),
    radial-gradient(circle at top right, rgba(255, 212, 230, 0.4), transparent 42%);
  box-shadow:
    0 30px 60px rgba(214, 166, 189, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(20px);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #ba7d97;
}

.panel-title {
  margin: 0;
  font-size: clamp(28px, 3vw, 38px);
  line-height: 1.18;
  color: #5e3a4a;
}

.panel-text {
  margin: 18px 0 0;
  font-size: 15px;
  line-height: 1.9;
  color: rgba(96, 69, 82, 0.86);
}

.community-panel {
  padding: 30px;
}

.community-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.86fr) minmax(0, 1.14fr);
  gap: 26px;
  align-items: stretch;
}

.community-main,
.community-side {
  display: grid;
  align-content: start;
  gap: 22px;
  min-width: 0;
}

.community-copy {
  max-width: 560px;
}

.community-copy .panel-title {
  max-width: 460px;
  font-size: clamp(30px, 3.2vw, 42px);
  line-height: 1.22;
  letter-spacing: -0.03em;
  color: #5f3a4d;
  background: linear-gradient(135deg, #5f3a4d 0%, #9d6680 54%, #d99ab2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.community-hint {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(116, 82, 96, 0.78);
}

.community-aside {
  display: grid;
  justify-items: start;
  gap: 12px;
  max-width: 520px;
}

.community-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 10px;
}

.community-stat {
  display: inline-flex;
  align-items: center;
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: #9a6079;
  font-size: 13px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.member-preview {
  position: relative;
  min-height: 320px;
  padding: 28px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.82);
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.8), transparent 44%),
    linear-gradient(160deg, rgba(255, 250, 252, 0.88), rgba(240, 244, 255, 0.84));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.member-preview__halo {
  position: absolute;
  top: -18%;
  right: -10%;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 211, 227, 0.42), transparent 70%);
  pointer-events: none;
}

.member-preview__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 18px;
}

.member-preview__avatar {
  width: 92px;
  height: 92px;
  border-radius: 28px;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.84);
  box-shadow: 0 18px 32px rgba(180, 128, 152, 0.18);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.member-preview__title {
  min-width: 0;

  h3 {
    margin: 12px 0 6px;
    font-size: 28px;
    color: #5b3344;
    word-break: break-word;
  }

  p {
    margin: 0;
    color: rgba(113, 80, 94, 0.76);
    font-size: 14px;
  }
}

.member-preview__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.member-chip {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 72px;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #9d6580;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

.member-chip--strong {
  background: linear-gradient(135deg, rgba(255, 222, 236, 0.94), rgba(255, 255, 255, 0.84));
  color: #a34d73;
}

.member-preview__bio {
  position: relative;
  z-index: 1;
  margin: 20px 0 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  font-size: 15px;
  line-height: 1.9;
  color: rgba(89, 59, 72, 0.84);
}

.member-preview__meta {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.member-preview__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.64);
  color: #8b5a72;
  font-size: 13px;
}

.member-cloud {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: center;
  gap: 24px 22px;
  min-height: 320px;
  padding: 22px 18px 18px;
  border-radius: 30px;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 211, 227, 0.32), transparent 36%),
    radial-gradient(circle at 80% 12%, rgba(225, 233, 255, 0.5), transparent 32%),
    linear-gradient(160deg, rgba(255, 255, 255, 0.68), rgba(251, 239, 246, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.76);
  overflow: hidden;
}

.member-cloud::before,
.member-cloud::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.member-cloud::before {
  inset: 12% auto auto 8%;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.5), transparent 72%);
}

.member-cloud::after {
  inset: auto 10% 6% auto;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(244, 224, 255, 0.35), transparent 72%);
}

.member-orb {
  position: relative;
  z-index: 1;
  width: var(--orb-size);
  height: calc(var(--orb-size) + 30px);
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  transform: translate(var(--orb-shift-x), var(--orb-shift-y));
  animation: orb-float 7s ease-in-out infinite;
  animation-delay: var(--orb-delay);
}

.member-orb__glow,
.member-orb__ring {
  position: absolute;
  inset: 0 auto auto 50%;
  transform: translateX(-50%);
  border-radius: 50%;
}

.member-orb__glow {
  top: 4px;
  width: var(--orb-size);
  height: var(--orb-size);
  background: radial-gradient(circle, rgba(255, 214, 233, 0.5), transparent 72%);
  filter: blur(4px);
  opacity: 0.85;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.member-orb__ring {
  top: 4px;
  width: calc(var(--orb-size) + 10px);
  height: calc(var(--orb-size) + 10px);
  border: 1px solid rgba(255, 255, 255, 0.72);
  opacity: 0;
  transition: opacity 0.32s ease, transform 0.32s ease;
}

.member-orb img {
  position: absolute;
  top: 4px;
  left: 50%;
  width: var(--orb-size);
  height: var(--orb-size);
  transform: translateX(-50%);
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.84);
  box-shadow: 0 18px 28px rgba(186, 130, 157, 0.2);
  transition: transform 0.32s ease, box-shadow 0.32s ease, border-color 0.32s ease;
}

.member-orb__label {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: rgba(98, 67, 80, 0.76);
}

.member-orb:hover,
.member-orb:focus-visible,
.member-orb.is-active {
  outline: none;

  .member-orb__glow {
    opacity: 1;
    transform: translateX(-50%) scale(1.08);
  }

  .member-orb__ring {
    opacity: 1;
    transform: translateX(-50%) scale(1.03);
  }

  img {
    transform: translateX(-50%) translateY(-4px) scale(1.06);
    box-shadow: 0 24px 34px rgba(190, 128, 156, 0.28);
    border-color: rgba(255, 255, 255, 0.94);
  }
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.story-panel,
.contact-panel {
  padding: 28px;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.tech-tag {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  font-size: 13px;
  color: #8f5d75;
  transition: transform 0.28s ease, box-shadow 0.28s ease;
  box-shadow: 0 10px 18px rgba(198, 154, 178, 0.08);
}

.tech-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(198, 154, 178, 0.14);
}

.contact-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 62px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  color: #7c5366;
  text-decoration: none;
  transition: transform 0.28s ease, box-shadow 0.28s ease, background 0.28s ease;
}

.contact-item:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 16px 28px rgba(198, 154, 178, 0.12);
}

.contact-item--muted {
  cursor: default;
}

.contact-item__label {
  font-size: 13px;
  color: rgba(119, 85, 99, 0.72);
}

.contact-empty {
  grid-column: 1 / -1;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.6);
  color: rgba(109, 78, 91, 0.72);
  font-size: 14px;
}

@keyframes orb-float {
  0%,
  100% {
    transform: translate(var(--orb-shift-x), var(--orb-shift-y));
  }
  50% {
    transform: translate(var(--orb-shift-x), calc(var(--orb-shift-y) - 10px));
  }
}

@media (max-width: 1024px) {
  .community-layout,
  .about-grid {
    grid-template-columns: 1fr;
  }

  .community-aside,
  .community-hint {
    max-width: none;
  }

  .community-aside {
    justify-items: start;
  }

  .community-stats {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .about-page {
    gap: 18px;
  }

  .community-panel,
  .story-panel,
  .contact-panel {
    padding: 24px;
  }

  .panel-title {
    font-size: 26px;
  }

  .community-copy .panel-title {
    font-size: clamp(30px, 9vw, 38px);
  }

  .member-preview__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .member-cloud {
    gap: 18px 12px;
    min-height: 0;
    padding-inline: 12px;
  }

  .member-orb {
    transform: none;
    animation: none;
  }

  .contact-list {
    grid-template-columns: 1fr;
  }
}
</style>
