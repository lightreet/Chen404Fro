<template>
  <div class="comment-item">
    <div class="comment-avatar">
      <img
        :src="comment.authorAvatar || defaultAvatar"
        :alt="comment.authorName"
        class="avatar-img"
      />
    </div>
    <div class="comment-body">
      <div class="comment-header">
        <span class="comment-author">
          <RouterLink
            v-if="comment.authorId"
            class="comment-author-link"
            :to="`/user/${comment.authorId}`"
          >{{ comment.authorName }}</RouterLink>
          <a
            v-else-if="comment.authorWebsite"
            :href="comment.authorWebsite"
            target="_blank"
            rel="noopener noreferrer"
          >{{ comment.authorName }}</a>
          <span v-else>{{ comment.authorName }}</span>
          <span v-if="comment.isAdmin" class="admin-badge">博主</span>
        </span>
        <span v-if="comment.replyToAuthorName" class="reply-to">
          回复 <span class="reply-target">{{ comment.replyToAuthorName }}</span>
        </span>
        <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
      </div>
      <div class="comment-content">
        <span v-for="(token, idx) in contentTokens" :key="idx">
          <span v-if="token.type === 'text'">{{ token.value }}</span>
          <span v-else class="emoji-token" :title="token.emoji.label">
            <img
              v-if="token.emoji.type === 'image' && token.emoji.asset"
              :src="token.emoji.asset"
              :alt="token.emoji.label"
              class="emoji-token-image"
            />
            <span v-else>{{ token.emoji.unicode || '\u{1F642}' }}</span>
          </span>
        </span>
      </div>
      <div class="comment-actions">
        <button class="action-btn like-btn" :class="{ liked: isLiked }" @click="handleLike">
          <span class="icon">♥</span>
          <span v-if="localLikeCount > 0">{{ localLikeCount }}</span>
        </button>
        <button v-if="canComment" class="action-btn reply-btn" @click="$emit('reply', comment)">
          回复
        </button>
        <button v-if="canDelete" class="action-btn delete-btn" @click="handleDelete">
          删除
        </button>
      </div>

      <div v-if="showReplyForm" class="reply-form-wrapper">
        <slot name="replyForm" />
      </div>

      <div v-if="comment.children && comment.children.length > 0" class="comment-children">
        <CommentItem
          v-for="child in comment.children"
          :key="child.id"
          :comment="child"
          :current-user-id="currentUserId"
          :is-admin="isCurrentUserAdmin"
          :can-comment="canComment"
          :show-reply-form="replyingTo === child.id"
          @reply="$emit('reply', $event)"
          @delete="$emit('delete', $event)"
          @like="$emit('like', $event)"
          @guest-delete="(c, k) => emit('guestDelete', c, k)"
        >
          <template #replyForm>
            <slot name="childReplyForm" />
          </template>
        </CommentItem>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Comment } from '@/types'
import { likeComment } from '@/api/comment'
import { renderCommentTokens } from '@/emoji/renderers/commentRenderer'

// 本地存储游客评论删除 key 的 key
const GUEST_DELETE_KEYS_KEY = 'comment_guest_delete_keys';

// 获取本地存储的游客删除 keys
function getStoredGuestDeleteKeys(): Record<string, string> {
  try {
    const stored = localStorage.getItem(GUEST_DELETE_KEYS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// 获取游客删除 key
function getGuestDeleteKey(commentId: number | string): string | undefined {
  return getStoredGuestDeleteKeys()[String(commentId)];
}

const props = defineProps<{
  comment: Comment
  currentUserId?: number | string | null
  isAdmin?: boolean
  canComment?: boolean
  showReplyForm?: boolean
  replyingTo?: number | null
}>()

const emit = defineEmits<{
  (e: 'reply', comment: Comment): void
  (e: 'delete', comment: Comment): void
  (e: 'like', comment: Comment): void
  (e: 'guestDelete', comment: Comment, deleteKey: string): void
}>()

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const isLiked = ref(!!props.comment.likedByMe)
const localLikeCount = ref(props.comment.likeCount || 0)

watch(
  () => props.comment.likeCount,
  (v) => {
    localLikeCount.value = v ?? 0
  }
)
watch(
  () => props.comment.likedByMe,
  (v) => {
    if (v === true || v === false) isLiked.value = v
  }
)

const isCurrentUserAdmin = computed(() => props.isAdmin ?? false)

// 获取当前评论的删除 key（如果是游客评论）
const guestDeleteKey = computed(() => getGuestDeleteKey(props.comment.id));

const canDelete = computed(() => {
  // 登录用户：管理员或本人可删
  if (props.currentUserId) {
    if (isCurrentUserAdmin.value) return true
    return String(props.currentUserId) === String(props.comment.authorId)
  }
  // 游客：如果本地有存储的删除 key，且该评论无 authorId（游客评论），则可删
  if (guestDeleteKey.value && !props.comment.authorId) {
    return true
  }
  return false
})

const isGuestDeletable = computed(() => {
  return !props.currentUserId && !!guestDeleteKey.value && !props.comment.authorId
})

const contentTokens = computed(() => renderCommentTokens(props.comment.content))

async function handleLike() {
  if (isLiked.value) return
  try {
    const res = await likeComment(props.comment.id)
    localLikeCount.value = res.likes
    isLiked.value = res.liked !== false
  } catch {
    // ignore
  }
}

function handleDelete() {
  if (isGuestDeletable.value && guestDeleteKey.value) {
    emit('guestDelete', props.comment, guestDeleteKey.value)
  } else {
    emit('delete', props.comment)
  }
}

function formatTime(time: string): string {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
</script>

<style scoped lang="scss">
.comment-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md) 0;

  & + .comment-item {
    border-top: 1px solid var(--border-light);
  }
}

.comment-avatar {
  flex-shrink: 0;

  .avatar-img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--border-light);
  }
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.comment-author {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);

  a {
    color: var(--primary);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

.comment-author-link {
  color: var(--primary);
  font: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.admin-badge {
  display: inline-block;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  margin-left: 4px;
  font-weight: 500;
  vertical-align: middle;
}

.reply-to {
  font-size: 13px;
  color: var(--text-tertiary);

  .reply-target {
    color: var(--primary);
    font-weight: 500;
  }
}

.comment-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.comment-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary);
  word-break: break-word;
  white-space: pre-wrap;
}

.emoji-token {
  display: inline-block;
  font-size: 1.1em;
  vertical-align: baseline;
  margin: 0 1px;
}

.emoji-token-image {
  width: 1.5em;
  height: 1.5em;
  object-fit: contain;
  vertical-align: text-bottom;
}

.comment-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-tertiary);
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  transition: color 0.2s, background-color 0.2s;

  &:hover {
    color: var(--text-primary);
    background-color: var(--bg-hover);
  }
}

.like-btn {
  .icon {
    font-size: 14px;
    transition: color 0.2s, transform 0.2s;
  }
  &.liked {
    color: var(--primary);
    .icon {
      color: var(--primary);
      transform: scale(1.15);
    }
  }
}

.delete-btn:hover {
  color: var(--danger);
}

.reply-form-wrapper {
  margin-top: var(--spacing-md);
}

.comment-children {
  margin-top: var(--spacing-sm);
  padding-left: var(--spacing-md);
  border-left: 2px solid var(--border-light);

  .comment-item {
    padding: var(--spacing-sm) 0;
  }

  .avatar-img {
    width: 32px;
    height: 32px;
  }
}
</style>
