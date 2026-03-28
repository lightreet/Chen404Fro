<template>
  <div class="comment-section">
    <h3 class="section-title">
      <span class="title-icon">💬</span>
      {{ isGuestbook ? '留言板' : '评论' }}
      <span v-if="total > 0" class="comment-count">({{ total }})</span>
    </h3>

    <!-- 评论表单 -->
    <div v-if="canComment" class="comment-form-card">
      <div class="form-row">
        <div v-if="userStore.isLoggedIn" class="form-user-info">
          <img
            :src="userStore.user?.avatar || defaultAvatar"
            class="form-avatar"
          />
          <span class="form-nickname">{{ userStore.user?.nickname }}</span>
        </div>
        <template v-else>
          <div class="guest-fields">
            <input
              v-model="form.authorName"
              class="input-field"
              placeholder="昵称 *"
              maxlength="30"
            />
            <input
              v-model="form.authorEmail"
              class="input-field"
              placeholder="邮箱"
              maxlength="100"
            />
            <input
              v-model="form.authorWebsite"
              class="input-field"
              placeholder="网站 (https://...)"
              maxlength="200"
            />
          </div>
        </template>
      </div>
      <div class="form-textarea-row">
        <textarea
          v-model="form.content"
          class="textarea-field"
          :placeholder="replyTarget ? `回复 @${replyTarget.authorName}` : '说点什么吧...'"
          rows="3"
          maxlength="1000"
        />
        <div class="emoji-toolbar">
          <button class="emoji-toggle-btn" type="button" @click="showEmojiPanel = !showEmojiPanel">
            😊 表情
          </button>
        </div>
        <div v-if="showEmojiPanel" class="emoji-panel">
          <button
            v-for="emoji in sceneEmojis"
            :key="emoji.id"
            class="emoji-item-btn"
            type="button"
            :title="emoji.label"
            @click="insertEmoji(emoji.shortcode)"
          >
            {{ emoji.unicode || '🙂' }}
          </button>
        </div>
      </div>
      <div class="form-footer">
        <span v-if="replyTarget" class="replying-hint">
          回复 @{{ replyTarget.authorName }}
          <button class="cancel-reply-btn" @click="cancelReply">✕</button>
        </span>
        <span class="char-count">{{ form.content.length }} / 1000</span>
        <button
          class="submit-btn"
          :disabled="submitting || !canSubmit"
          @click="submitComment"
        >
          {{ submitting ? '提交中...' : '发表评论' }}
        </button>
      </div>
    </div>

    <div v-else-if="commentPolicy === 0" class="comment-closed">
      评论已关闭
    </div>
    <div v-else class="comment-login-hint">
      请 <router-link to="/login">登录</router-link> 后评论
    </div>

    <!-- 评论列表 -->
    <div v-if="loading && comments.length === 0" class="comment-loading">
      加载评论中...
    </div>

    <div v-else-if="comments.length === 0 && !loading" class="comment-empty">
      暂无评论，快来抢沙发吧~
    </div>

    <div v-else class="comment-list">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :current-user-id="currentUserId"
        :is-admin="isCurrentUserAdmin"
        :can-comment="canComment"
        :show-reply-form="replyTarget?.id === comment.id"
        :replying-to="replyTarget?.id ?? null"
        @reply="handleReply"
        @delete="handleDelete"
        @like="handleLike"
        @guest-delete="handleGuestDelete"
      />
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="comment-pagination">
      <button
        class="page-btn"
        :disabled="currentPage <= 1"
        @click="changePage(currentPage - 1)"
      >
        上一页
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button
        class="page-btn"
        :disabled="currentPage >= totalPages"
        @click="changePage(currentPage + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Comment, CreateCommentParams } from '@/types'
import { getComments, getGuestbookComments, createComment, deleteComment, deleteCommentAsGuest } from '@/api/comment'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import CommentItem from './CommentItem.vue'
import { queryByScene, getEmojiByShortcode } from '@/emoji/registry'
import { countEmojiTokens, renderShortcodesToText } from '@/emoji/parser'
import { scenePolicies } from '@/emoji/scenePolicy'

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

// 保存游客删除 key
function storeGuestDeleteKey(commentId: number | string, deleteKey: string): void {
  const keys = getStoredGuestDeleteKeys();
  keys[String(commentId)] = deleteKey;
  localStorage.setItem(GUEST_DELETE_KEYS_KEY, JSON.stringify(keys));
}

// 获取游客删除 key
function getGuestDeleteKey(commentId: number | string): string | undefined {
  return getStoredGuestDeleteKeys()[String(commentId)];
}

// 移除已使用的游客删除 key
function removeGuestDeleteKey(commentId: number | string): void {
  const keys = getStoredGuestDeleteKeys();
  delete keys[String(commentId)];
  localStorage.setItem(GUEST_DELETE_KEYS_KEY, JSON.stringify(keys));
}

const props = withDefaults(defineProps<{
  articleId?: number | string
  canComment?: boolean
  commentPolicy?: number
}>(), {
  canComment: true,
  commentPolicy: 3,
})

const userStore = useUserStore()
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const isGuestbook = computed(() => !props.articleId)

const comments = ref<Comment[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10
const loading = ref(false)
const submitting = ref(false)
const replyTarget = ref<Comment | null>(null)
const showEmojiPanel = ref(false)
const sceneEmojis = queryByScene('comment')

const totalPages = computed(() => Math.ceil(total.value / pageSize))
const currentUserId = computed(() => userStore.user?.id ?? null)
const isCurrentUserAdmin = computed(() => userStore.user?.role === 1)

const form = ref({
  content: '',
  authorName: '',
  authorEmail: '',
  authorWebsite: '',
})

const canSubmit = computed(() => {
  if (!form.value.content.trim()) return false
  if (!userStore.isLoggedIn && !form.value.authorName.trim()) return false
  return true
})

async function fetchComments() {
  loading.value = true
  try {
    let result
    if (isGuestbook.value) {
      result = await getGuestbookComments({ page: currentPage.value, size: pageSize })
    } else {
      result = await getComments(props.articleId!, { page: currentPage.value, size: pageSize })
    }
    comments.value = result.list
    total.value = result.total
  } catch {
    ElMessage.error('加载评论失败')
  } finally {
    loading.value = false
  }
}

async function submitComment() {
  if (!canSubmit.value || submitting.value) return
  const emojiCount = countEmojiTokens(form.value.content)
  if (emojiCount > scenePolicies.comment.maxEmoji) {
    ElMessage.warning(`单条评论最多 ${scenePolicies.comment.maxEmoji} 个表情`)
    return
  }
  submitting.value = true

  try {
    const params: CreateCommentParams = {
      content: form.value.content.trim(),
      authorName: userStore.isLoggedIn
        ? (userStore.user!.nickname || userStore.user!.username)
        : form.value.authorName.trim(),
      authorEmail: form.value.authorEmail.trim() || undefined,
      authorWebsite: form.value.authorWebsite.trim() || undefined,
    }

    if (!isGuestbook.value) {
      params.articleId = props.articleId
    }

    if (replyTarget.value) {
      params.parentId = replyTarget.value.id
    }

    const result = await createComment(params)

    // 保存游客评论的删除 key（仅在创建时返回一次）
    if (!userStore.isLoggedIn && result.guestDeleteKey) {
      storeGuestDeleteKey(result.id, result.guestDeleteKey);
    }

    form.value.content = ''
    replyTarget.value = null

    ElMessage.success('评论发表成功')
    await fetchComments()
  } catch {
    ElMessage.error('评论发表失败')
  } finally {
    submitting.value = false
  }
}

function handleReply(comment: Comment) {
  replyTarget.value = comment
  const textarea = document.querySelector('.comment-section .textarea-field') as HTMLTextAreaElement | null
  textarea?.focus()
  textarea?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function cancelReply() {
  replyTarget.value = null
}

function insertEmoji(shortcode: string) {
  const emoji = getEmojiByShortcode(shortcode)
  // 目前一期/种子主要是 unicode：点击面板直接插入表情本体，避免用户看到 :shortcode:
  if (emoji?.type === 'unicode' && emoji.unicode) {
    form.value.content += emoji.unicode
    return
  }
  form.value.content += `:${shortcode}:`
}

// 用户手动输入 :shortcode: 时自动替换成表情（仅替换已存在的 unicode 表情）
watch(
  () => form.value.content,
  (val) => {
    if (!val || val.indexOf(':') === -1) return
    const replaced = renderShortcodesToText(val)
    if (replaced !== val) {
      form.value.content = replaced
    }
  }
)

async function handleDelete(comment: Comment) {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteComment(comment.id)
    ElMessage.success('评论已删除')
    await fetchComments()
  } catch {
    // cancelled or error
  }
}

async function handleGuestDelete(comment: Comment, deleteKey: string) {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteCommentAsGuest(comment.id, deleteKey)
    // 删除成功后移除本地存储的 key
    removeGuestDeleteKey(comment.id)
    ElMessage.success('评论已删除')
    await fetchComments()
  } catch {
    // cancelled or error
  }
}

function handleLike(_comment: Comment) {
  // like is handled inside CommentItem
}

function changePage(page: number) {
  currentPage.value = page
  fetchComments()
  const section = document.querySelector('.comment-section') as HTMLElement | null
  section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(() => props.articleId, () => {
  currentPage.value = 1
  fetchComments()
})

onMounted(fetchComments)
</script>

<style scoped lang="scss">
.comment-section {
  margin-top: var(--spacing-xl);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--primary);

  .title-icon {
    font-size: 22px;
  }

  .comment-count {
    font-size: 14px;
    font-weight: 400;
    color: var(--text-tertiary);
  }
}

/* ---- Form ---- */
.comment-form-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.form-row {
  margin-bottom: var(--spacing-md);
}

.form-user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  .form-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
  }

  .form-nickname {
    font-weight: 600;
    color: var(--text-primary);
  }
}

.guest-fields {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.input-field {
  flex: 1;
  min-width: 140px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-primary);
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--primary);
  }

  &::placeholder {
    color: var(--text-tertiary);
  }
}

.textarea-field {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-primary);
  resize: vertical;
  min-height: 80px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: var(--primary);
  }

  &::placeholder {
    color: var(--text-tertiary);
  }
}

.emoji-toolbar {
  margin-top: var(--spacing-sm);
  display: flex;
  justify-content: flex-start;
}

.emoji-toggle-btn {
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  padding: 4px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
}

.emoji-panel {
  margin-top: var(--spacing-sm);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
}

.emoji-item-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.replying-hint {
  flex: 1;
  font-size: 13px;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.cancel-reply-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  font-size: 14px;
  padding: 0 4px;

  &:hover {
    color: var(--danger);
  }
}

.char-count {
  font-size: 12px;
  color: var(--text-tertiary);
}

.submit-btn {
  padding: 8px 24px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, opacity 0.2s;

  &:hover:not(:disabled) {
    background: var(--primary-dark);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* ---- States ---- */
.comment-closed,
.comment-login-hint,
.comment-loading,
.comment-empty {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-tertiary);
  font-size: 14px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-xl);
}

.comment-login-hint a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  &:hover {
    text-decoration: underline;
  }
}

/* ---- List ---- */
.comment-list {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 0 var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

/* ---- Pagination ---- */
.comment-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.page-btn {
  padding: 6px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: var(--primary);
    color: var(--primary);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.page-info {
  font-size: 13px;
  color: var(--text-tertiary);
}
</style>
