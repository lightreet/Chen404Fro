<template>
  <article class="user-profile-card" :class="{ 'user-profile-card--compact': compact }">
    <div class="user-profile-card__cover" aria-hidden="true"></div>
    <div class="user-profile-card__body">
      <div class="user-profile-card__header">
        <img class="user-profile-card__avatar" :src="avatarUrl" :alt="displayName" />
        <div class="user-profile-card__identity">
          <div class="user-profile-card__badges">
            <span class="user-profile-card__badge user-profile-card__badge--strong">
              {{ identityLabel }}
            </span>
            <span v-if="formattedJoinTime" class="user-profile-card__badge">
              加入于 {{ formattedJoinTime }}
            </span>
          </div>
          <h3>{{ displayName }}</h3>
          <p>@{{ user.username }}</p>
        </div>
      </div>

      <p class="user-profile-card__bio">
        {{ user.bio?.trim() || '这个人还没有留下介绍。' }}
      </p>

      <dl class="user-profile-card__facts">
        <div class="user-profile-card__fact">
          <dt>
            <el-icon><UserFilled /></el-icon>
            身份
          </dt>
          <dd>{{ identityDescription }}</dd>
        </div>
        <div class="user-profile-card__fact">
          <dt>
            <el-icon><Message /></el-icon>
            邮箱
          </dt>
          <dd>
            <a v-if="user.email" :href="`mailto:${user.email}`">{{ user.email }}</a>
            <span v-else>未公开</span>
          </dd>
        </div>
      </dl>

      <div v-if="showActions" class="user-profile-card__actions">
        <RouterLink class="user-profile-card__action user-profile-card__action--primary" :to="profilePath">
          查看主页
        </RouterLink>
        <a v-if="user.email" class="user-profile-card__action" :href="`mailto:${user.email}`">
          发邮件
        </a>
        <button
          v-if="user.email"
          type="button"
          class="user-profile-card__action"
          @click="copyEmail"
        >
          复制邮箱
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Message, UserFilled } from '@element-plus/icons-vue';
import type { SiteMember } from '@/api/home';

const DEFAULT_MEMBER_AVATAR = '/default-member-avatar.svg';
const LEGACY_DEFAULT_AVATAR = '/default-avatar.jpg';

const props = withDefaults(
  defineProps<{
    user: SiteMember;
    ownerId?: number | string | null;
    compact?: boolean;
    showActions?: boolean;
  }>(),
  {
    ownerId: null,
    compact: false,
    showActions: true,
  }
);

const displayName = computed(() => props.user.nickname?.trim() || props.user.username || 'Chen404 成员');
const avatarUrl = computed(() => {
  const avatar = props.user.avatar?.trim();
  if (!avatar || avatar === LEGACY_DEFAULT_AVATAR) return DEFAULT_MEMBER_AVATAR;
  return avatar;
});
const isOwner = computed(() => props.ownerId != null && String(props.user.id) === String(props.ownerId));
const identityLabel = computed(() => {
  if (isOwner.value) return '主理人';
  if (props.user.memberLabel?.trim()) return props.user.memberLabel.trim();
  return props.user.trustLevel === 1 ? '知友' : '读者';
});
const identityDescription = computed(() => {
  if (isOwner.value) return '站点创建者';
  return props.user.trustLevel === 1 ? '站点知友成员' : '站点注册成员';
});
const formattedJoinTime = computed(() => formatDate(props.user.createTime));
const profilePath = computed(() => `/user/${props.user.id}`);

async function copyEmail() {
  if (!props.user.email) return;
  try {
    await navigator.clipboard.writeText(props.user.email);
    ElMessage.success('邮箱已复制');
  } catch {
    ElMessage.warning('复制失败，可以手动选择邮箱');
  }
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}
</script>

<style scoped lang="scss">
.user-profile-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  background:
    linear-gradient(150deg, rgba(255, 252, 254, 0.92), rgba(250, 241, 248, 0.82)),
    radial-gradient(circle at top right, rgba(246, 187, 213, 0.34), transparent 44%);
  box-shadow:
    0 24px 52px rgba(184, 138, 164, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.84);
  color: #5e4b5b;
}

.user-profile-card__cover {
  height: 96px;
  background:
    radial-gradient(circle at 28% 18%, rgba(255, 255, 255, 0.82), transparent 30%),
    radial-gradient(circle at 76% 24%, rgba(242, 188, 212, 0.5), transparent 34%),
    linear-gradient(135deg, rgba(245, 225, 236, 0.72), rgba(238, 244, 255, 0.66));
}

.user-profile-card__body {
  position: relative;
  padding: 0 24px 24px;
}

.user-profile-card__header {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-top: -34px;
}

.user-profile-card__avatar {
  width: 86px;
  height: 86px;
  flex: 0 0 auto;
  object-fit: cover;
  border-radius: 26px;
  border: 4px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 30px rgba(158, 116, 143, 0.2);
}

.user-profile-card__identity {
  min-width: 0;

  h3 {
    margin: 12px 0 5px;
    color: #594353;
    font-size: 26px;
    line-height: 1.15;
    word-break: break-word;
  }

  p {
    margin: 0;
    color: rgba(108, 91, 105, 0.72);
    font-size: 14px;
  }
}

.user-profile-card__badges,
.user-profile-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-profile-card__badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #9a6b83;
  font-size: 12px;
  line-height: 1;
}

.user-profile-card__badge--strong {
  background: linear-gradient(135deg, rgba(255, 221, 236, 0.96), rgba(255, 255, 255, 0.82));
  color: #a95478;
}

.user-profile-card__bio {
  margin: 22px 0 0;
  color: rgba(88, 70, 84, 0.86);
  font-size: 15px;
  line-height: 1.85;
}

.user-profile-card__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0 0;
}

.user-profile-card__fact {
  min-width: 0;
  padding: 13px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.64);

  dt {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 7px;
    color: rgba(137, 93, 116, 0.8);
    font-size: 12px;
  }

  dd {
    margin: 0;
    overflow: hidden;
    color: #604c5d;
    font-size: 14px;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
}

.user-profile-card__actions {
  margin-top: 20px;
}

.user-profile-card__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 8px 14px;
  border: 1px solid rgba(218, 180, 199, 0.3);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #8f5d76;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.user-profile-card__action:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 24px rgba(184, 138, 164, 0.14);
}

.user-profile-card__action--primary {
  border-color: transparent;
  background: linear-gradient(135deg, #f2b7cf, #f6d3e1);
  color: #6f4057;
}

.user-profile-card--compact {
  .user-profile-card__cover {
    height: 82px;
  }

  .user-profile-card__body {
    padding: 0 20px 20px;
  }

  .user-profile-card__avatar {
    width: 76px;
    height: 76px;
    border-radius: 22px;
  }

  .user-profile-card__facts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .user-profile-card__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .user-profile-card__facts {
    grid-template-columns: 1fr;
  }
}
</style>
