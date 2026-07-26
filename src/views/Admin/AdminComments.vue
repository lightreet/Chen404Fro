<template>
  <div class="comments-admin">
    <UiPanel
      icon="comment"
      title="评论审核"
      subtitle="处理文章评论和留言板留言"
      flush
    >
      <template #actions>
        <UiButton
          icon="refresh"
          :loading="loading || statsLoading"
          @click="refreshAll"
        >
          刷新
        </UiButton>
      </template>

      <div class="comments-body">
        <nav class="status-switcher" aria-label="审核状态筛选">
          <button
            v-for="item in statusItems"
            :key="item.key"
            type="button"
            class="status-switcher__item"
            :class="{ 'is-active': selectedStatus === item.value }"
            :aria-pressed="selectedStatus === item.value"
            @click="selectStatus(item.value)"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.count }}</strong>
          </button>
        </nav>

        <AppFilterBar class="comment-filters">
          <template #search>
            <UiInput
              v-model="keyword"
              clearable
              prefix-icon="search"
              placeholder="搜索评论内容、昵称或邮箱"
              @enter="applyFilters"
            />
          </template>
          <template #filters>
            <UiSelect
              v-model="scene"
              :options="sceneOptions"
              aria-label="评论来源"
              style="width: 164px"
              @change="applyFilters"
            />
          </template>
          <template #actions>
            <UiButton variant="text" @click="resetFilters">重置筛选</UiButton>
            <UiButton icon="filter" @click="applyFilters">应用筛选</UiButton>
          </template>
        </AppFilterBar>

        <div v-if="loading || comments.length" class="desktop-table">
          <UiTable :data="comments" :loading="loading" table-layout="fixed">
            <UiTableColumn label="评论内容" min-width="300">
              <template #default="{ row }">
                <button
                  type="button"
                  class="content-cell"
                  @click="openDetail(row)"
                >
                  <span class="content-cell__text">{{ row.content }}</span>
                  <small v-if="row.replyToAuthorName">
                    回复 {{ row.replyToAuthorName }}
                  </small>
                </button>
              </template>
            </UiTableColumn>

            <UiTableColumn label="作者" min-width="170">
              <template #default="{ row }">
                <div class="author-cell">
                  <UiAvatar :size="36" :src="row.authorAvatar">
                    {{ row.authorName?.slice(0, 1) }}
                  </UiAvatar>
                  <div>
                    <strong>{{ row.authorName || '匿名访客' }}</strong>
                    <small>{{ row.authorId ? '注册用户' : '游客' }}</small>
                  </div>
                </div>
              </template>
            </UiTableColumn>

            <UiTableColumn label="来源" min-width="180">
              <template #default="{ row }">
                <button
                  type="button"
                  class="source-link"
                  @click="openSource(row)"
                >
                  <UiIcon :name="row.scene === 'GUESTBOOK' ? 'message' : 'article'" />
                  <span>{{ sourceLabel(row) }}</span>
                </button>
              </template>
            </UiTableColumn>

            <UiTableColumn label="状态" width="108">
              <template #default="{ row }">
                <AppStatusPill :tone="statusTone(row.status)">
                  {{ statusLabel(row.status) }}
                </AppStatusPill>
              </template>
            </UiTableColumn>

            <UiTableColumn label="提交时间" min-width="158">
              <template #default="{ row }">
                <time class="time-cell">{{ formatDate(row.createTime) }}</time>
              </template>
            </UiTableColumn>

            <UiTableColumn label="操作" width="176" fixed="right">
              <template #default="{ row }">
                <div class="row-actions">
                  <template v-if="row.status === 0">
                    <UiButton
                      variant="text"
                      size="sm"
                      :loading="isReviewing(row.id, 2)"
                      :disabled="isRowReviewing(row.id)"
                      @click="reviewComment(row, 2)"
                    >
                      拒绝
                    </UiButton>
                    <UiButton
                      variant="success"
                      size="sm"
                      :loading="isReviewing(row.id, 1)"
                      :disabled="isRowReviewing(row.id)"
                      @click="reviewComment(row, 1)"
                    >
                      通过
                    </UiButton>
                  </template>
                  <UiButton
                    v-else
                    variant="text"
                    size="sm"
                    @click="openDetail(row)"
                  >
                    查看详情
                  </UiButton>
                </div>
              </template>
            </UiTableColumn>
          </UiTable>
        </div>

        <div v-if="!loading && comments.length" class="mobile-list">
          <article
            v-for="row in comments"
            :key="String(row.id)"
            class="mobile-comment"
          >
            <button type="button" class="mobile-comment__main" @click="openDetail(row)">
              <span class="mobile-comment__meta">
                <strong>{{ row.authorName || '匿名访客' }}</strong>
                <AppStatusPill :tone="statusTone(row.status)" size="sm">
                  {{ statusLabel(row.status) }}
                </AppStatusPill>
              </span>
              <span class="mobile-comment__content">{{ row.content }}</span>
              <small>{{ sourceLabel(row) }} · {{ formatDate(row.createTime) }}</small>
            </button>
            <div v-if="row.status === 0" class="mobile-comment__actions">
              <UiButton
                variant="secondary"
                size="sm"
                :loading="isReviewing(row.id, 2)"
                :disabled="isRowReviewing(row.id)"
                @click="reviewComment(row, 2)"
              >
                拒绝留言
              </UiButton>
              <UiButton
                variant="success"
                size="sm"
                :loading="isReviewing(row.id, 1)"
                :disabled="isRowReviewing(row.id)"
                @click="reviewComment(row, 1)"
              >
                通过留言
              </UiButton>
            </div>
          </article>
        </div>

        <AppEmptyState
          v-if="!loading && !comments.length"
          icon="comment"
          :title="emptyTitle"
          :description="emptyDescription"
        >
          <template #action>
            <UiButton v-if="hasActiveFilters" variant="secondary" @click="resetFilters">
              清除筛选
            </UiButton>
          </template>
        </AppEmptyState>

        <div v-if="total > 0" class="table-footer">
          <span class="table-footer__summary">
            第 {{ visibleRangeStart }}–{{ visibleRangeEnd }} 条，共 {{ total }} 条，每页 {{ pageSize }} 条
          </span>
          <UiPagination
            :current="page"
            :page-size="pageSize"
            :total="total"
            :show-total="false"
            @change="loadComments"
          />
        </div>
      </div>
    </UiPanel>

    <UiDrawer
      v-model="detailVisible"
      title="评论详情"
      size="min(520px, 92vw)"
    >
      <template v-if="activeComment">
        <div class="detail-head">
          <div class="detail-author">
            <UiAvatar :size="44" :src="activeComment.authorAvatar">
              {{ activeComment.authorName?.slice(0, 1) }}
            </UiAvatar>
            <div>
              <strong>{{ activeComment.authorName || '匿名访客' }}</strong>
              <span>{{ activeComment.authorId ? '注册用户' : '游客' }}</span>
            </div>
          </div>
          <AppStatusPill :tone="statusTone(activeComment.status)">
            {{ statusLabel(activeComment.status) }}
          </AppStatusPill>
        </div>

        <section class="detail-content">
          <p>{{ activeComment.content }}</p>
          <span v-if="activeComment.replyToAuthorName">
            回复对象：{{ activeComment.replyToAuthorName }}
          </span>
        </section>

        <dl class="detail-list">
          <div>
            <dt>来源</dt>
            <dd>
              <button type="button" class="detail-source" @click="openSource(activeComment)">
                {{ sourceLabel(activeComment) }}
              </button>
            </dd>
          </div>
          <div>
            <dt>提交时间</dt>
            <dd>{{ formatDate(activeComment.createTime) }}</dd>
          </div>
          <div>
            <dt>邮箱</dt>
            <dd>{{ activeComment.authorEmail || '未填写' }}</dd>
          </div>
          <div>
            <dt>位置</dt>
            <dd>{{ activeComment.location || '未知' }}</dd>
          </div>
          <div>
            <dt>IP</dt>
            <dd>{{ activeComment.ip || '未知' }}</dd>
          </div>
          <div>
            <dt>个人网站</dt>
            <dd>
              <a
                v-if="activeComment.authorWebsite"
                :href="activeComment.authorWebsite"
                target="_blank"
                rel="noopener noreferrer"
              >
                打开作者网站
              </a>
              <span v-else>未填写</span>
            </dd>
          </div>
        </dl>

        <section v-if="activeComment.userAgent" class="detail-device">
          <h4>客户端信息</h4>
          <p>{{ activeComment.userAgent }}</p>
        </section>
      </template>

      <template #footer>
        <div class="drawer-actions">
          <UiButton variant="text" @click="detailVisible = false">关闭详情</UiButton>
          <template v-if="activeComment">
            <UiButton
              v-if="activeComment.status !== 2"
              variant="danger"
              :loading="isReviewing(activeComment.id, 2)"
              :disabled="isRowReviewing(activeComment.id)"
              @click="reviewComment(activeComment, 2)"
            >
              拒绝评论
            </UiButton>
            <UiButton
              v-if="activeComment.status !== 1"
              variant="success"
              :loading="isReviewing(activeComment.id, 1)"
              :disabled="isRowReviewing(activeComment.id)"
              @click="reviewComment(activeComment, 1)"
            >
              通过评论
            </UiButton>
          </template>
        </div>
      </template>
    </UiDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getAdminComments,
  getAdminCommentStats,
  reviewAdminComment,
} from '@/api/admin-comment'
import type {
  AdminComment,
  AdminCommentScene,
  AdminCommentStats,
  AdminCommentStatus,
} from '@/api/admin-comment'
import { AppEmptyState, AppFilterBar, AppStatusPill } from '@/components/app'
import {
  UiAvatar,
  UiButton,
  UiDrawer,
  UiIcon,
  UiInput,
  UiPagination,
  UiPanel,
  UiSelect,
  UiTable,
  UiTableColumn,
} from '@/components/ui'
import type { UiSelectOption } from '@/components/ui'
import type { AccentTone } from '@/design/tokens'
import { confirmAction, notify } from '@/lib/feedback'

type StatusFilter = AdminCommentStatus | 'ALL'
type ReviewTarget = 1 | 2

const emit = defineEmits<{
  (event: 'stats-change', stats: AdminCommentStats): void
}>()

const route = useRoute()
const router = useRouter()
const pageSize = 20
const comments = ref<AdminComment[]>([])
const stats = ref<AdminCommentStats>({
  totalCount: 0,
  pendingCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
})
const loading = ref(false)
const statsLoading = ref(false)
const page = ref(1)
const total = ref(0)
const keyword = ref('')
const scene = ref<AdminCommentScene>('ALL')
const selectedStatus = ref<StatusFilter>(resolveInitialStatus())
const reviewingId = ref<string | null>(null)
const reviewingTarget = ref<ReviewTarget | null>(null)
const detailVisible = ref(false)
const activeComment = ref<AdminComment | null>(null)

const sceneOptions: UiSelectOption[] = [
  { label: '全部来源', value: 'ALL' },
  { label: '文章评论', value: 'ARTICLE' },
  { label: '留言板', value: 'GUESTBOOK' },
]

const statusItems = computed(() => [
  { key: 'pending', label: '待审核', value: 0 as StatusFilter, count: stats.value.pendingCount },
  { key: 'approved', label: '已通过', value: 1 as StatusFilter, count: stats.value.approvedCount },
  { key: 'rejected', label: '已拒绝', value: 2 as StatusFilter, count: stats.value.rejectedCount },
  { key: 'all', label: '全部', value: 'ALL' as StatusFilter, count: stats.value.totalCount },
])

const hasActiveFilters = computed(
  () => Boolean(keyword.value.trim()) || scene.value !== 'ALL',
)

const visibleRangeStart = computed(
  () => (page.value - 1) * pageSize + 1,
)

const visibleRangeEnd = computed(
  () => Math.min(page.value * pageSize, total.value),
)

const emptyTitle = computed(() => {
  if (hasActiveFilters.value) return '没有符合筛选条件的评论'
  if (selectedStatus.value === 0) return '暂无待审核评论'
  if (selectedStatus.value === 1) return '暂无已通过评论'
  if (selectedStatus.value === 2) return '暂无已拒绝评论'
  return '暂无评论'
})

const emptyDescription = computed(() => {
  if (hasActiveFilters.value) return '可以调整来源或搜索关键词后重新查看。'
  if (selectedStatus.value === 0) return '新的评论和留言会在这里等待处理。'
  return '切换其他审核状态可以查看对应记录。'
})

function resolveInitialStatus(): StatusFilter {
  const value = String(route.query.status ?? '0')
  if (value === '1') return 1
  if (value === '2') return 2
  if (value.toUpperCase() === 'ALL') return 'ALL'
  return 0
}

function statusLabel(status: AdminCommentStatus) {
  if (status === 0) return '待审核'
  if (status === 1) return '已通过'
  return '已拒绝'
}

function statusTone(status: AdminCommentStatus): AccentTone {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  return 'danger'
}

function sourceLabel(comment: AdminComment) {
  if (comment.scene === 'GUESTBOOK') return '留言板'
  return comment.articleTitle || `文章 #${comment.articleId ?? ''}`
}

function formatDate(value?: string) {
  if (!value) return '--'
  return value.replace('T', ' ').slice(0, 16)
}

function isRowReviewing(id: number | string) {
  return reviewingId.value === String(id)
}

function isReviewing(id: number | string, target: ReviewTarget) {
  return isRowReviewing(id) && reviewingTarget.value === target
}

async function loadComments(nextPage = page.value) {
  loading.value = true
  try {
    const result = await getAdminComments({
      page: nextPage,
      size: pageSize,
      status: selectedStatus.value === 'ALL' ? undefined : selectedStatus.value,
      scene: scene.value,
      keyword: keyword.value.trim() || undefined,
    })
    comments.value = result.list ?? []
    total.value = Number(result.total ?? 0)
    page.value = Number(result.page ?? nextPage)
  } catch {
    comments.value = []
    total.value = 0
    notify.error('评论列表加载失败')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  statsLoading.value = true
  try {
    const result = await getAdminCommentStats()
    stats.value = result
    emit('stats-change', result)
  } catch {
    notify.error('评论统计加载失败')
  } finally {
    statsLoading.value = false
  }
}

async function refreshAll() {
  await Promise.all([loadComments(page.value), loadStats()])
}

function applyFilters() {
  void loadComments(1)
}

function resetFilters() {
  keyword.value = ''
  scene.value = 'ALL'
  void loadComments(1)
}

function selectStatus(value: StatusFilter) {
  if (selectedStatus.value === value) return
  selectedStatus.value = value
  void router.replace({
    path: '/admin',
    query: {
      ...route.query,
      tab: 'comments',
      status: value === 'ALL' ? 'ALL' : String(value),
    },
  })
  void loadComments(1)
}

function openDetail(comment: AdminComment) {
  activeComment.value = comment
  detailVisible.value = true
}

function openSource(comment: AdminComment) {
  if (comment.scene === 'GUESTBOOK') {
    void router.push('/guestbook')
    return
  }
  if (comment.articleId) {
    void router.push(`/article/${comment.articleId}`)
  }
}

async function reviewComment(comment: AdminComment, target: ReviewTarget) {
  if (comment.status === target || isRowReviewing(comment.id)) return

  const needsConfirmation = target === 2 || comment.status !== 0
  if (needsConfirmation) {
    const confirmed = await confirmAction({
      title: target === 1 ? '通过这条评论' : '拒绝这条评论',
      message: target === 1
        ? '评论通过后会显示在公开页面，是否继续？'
        : '拒绝后评论不会显示在公开页面，是否继续？',
      confirmText: target === 1 ? '通过评论' : '拒绝评论',
      cancelText: '暂不处理',
      tone: target === 1 ? 'success' : 'danger',
    })
    if (!confirmed) return
  }

  reviewingId.value = String(comment.id)
  reviewingTarget.value = target
  try {
    const reviewed = await reviewAdminComment(comment.id, target)
    if (activeComment.value?.id === comment.id) {
      activeComment.value = reviewed
    }
    notify.success(target === 1 ? '评论已通过' : '评论已拒绝')
    const nextPage = comments.value.length === 1 && page.value > 1
      ? page.value - 1
      : page.value
    await Promise.all([loadComments(nextPage), loadStats()])
  } finally {
    reviewingId.value = null
    reviewingTarget.value = null
  }
}

onMounted(() => {
  void Promise.all([loadComments(1), loadStats()])
})
</script>

<style scoped lang="scss">
.comments-body {
  display: grid;
  gap: var(--space-lg);
  padding: var(--space-lg);
}

.status-switcher {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  padding: 4px;
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.status-switcher__item {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  padding: 0 14px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    color var(--motion-duration-fast) var(--motion-ease-standard);

  strong {
    min-width: 24px;
    padding: 2px 7px;
    border-radius: var(--radius-pill);
    background: color-mix(in oklch, var(--color-text-tertiary) 12%, transparent);
    font-size: 12px;
    line-height: 1.35;
    text-align: center;
  }

  &:hover:not(.is-active) {
    color: var(--color-text-primary);
  }

  &.is-active {
    background: var(--color-surface);
    color: var(--primary-dark);
    box-shadow: var(--shadow-sm);

    strong {
      background: var(--color-accent-soft);
      color: var(--primary-dark);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }
}

.comment-filters {
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border-light);
}

.content-cell {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover .content-cell__text {
    color: var(--primary-dark);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
    border-radius: var(--radius-sm);
  }

  small {
    color: var(--color-text-tertiary);
    font-size: 12px;
  }
}

.content-cell__text {
  display: -webkit-box;
  overflow: hidden;
  line-height: 1.6;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  transition: color var(--motion-duration-fast) var(--motion-ease-standard);
}

.author-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  > div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--color-text-primary);
    font-size: 14px;
  }

  small {
    color: var(--color-text-tertiary);
    font-size: 12px;
  }
}

.source-link,
.detail-source {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  cursor: pointer;
}

.source-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    color: var(--primary-dark);
  }
}

.time-cell {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.row-actions,
.drawer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-xs);
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.table-footer__summary {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.table-footer :deep(.ui-pagination) {
  justify-content: flex-end;
}

.mobile-list {
  display: none;
}

.detail-head,
.detail-author {
  display: flex;
  align-items: center;
}

.detail-head {
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.detail-author {
  gap: 12px;

  > div {
    display: grid;
    gap: 2px;
  }

  strong {
    color: var(--color-text-primary);
  }

  span {
    color: var(--color-text-tertiary);
    font-size: 12px;
  }
}

.detail-content {
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  background: color-mix(in oklch, var(--color-surface) 92%, var(--primary));

  p {
    margin: 0;
    color: var(--color-text-primary);
    line-height: 1.8;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  span {
    display: block;
    margin-top: var(--space-sm);
    color: var(--color-text-secondary);
    font-size: 12px;
  }
}

.detail-list {
  display: grid;
  gap: 0;
  margin: var(--space-lg) 0 0;

  > div {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    gap: var(--space-md);
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border-light);
  }

  dt {
    color: var(--color-text-tertiary);
    font-size: 13px;
  }

  dd {
    min-width: 0;
    margin: 0;
    color: var(--color-text-primary);
    overflow-wrap: anywhere;
  }

  a,
  .detail-source {
    color: var(--primary-dark);
    text-decoration: none;
  }
}

.detail-device {
  margin-top: var(--space-lg);

  h4 {
    margin: 0 0 var(--space-sm);
    color: var(--color-text-primary);
    font-size: 14px;
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 12px;
    line-height: 1.7;
    overflow-wrap: anywhere;
  }
}

@media (max-width: 760px) {
  .comments-body {
    padding: var(--space-md);
  }

  .status-switcher {
    width: 100%;
  }

  .status-switcher__item {
    flex: 1 0 auto;
  }

  .desktop-table {
    display: none;
  }

  .mobile-list {
    display: grid;
    border-top: 1px solid var(--color-border-light);
  }

  .mobile-comment {
    display: grid;
    gap: 12px;
    padding: var(--space-md) 0;
    border-bottom: 1px solid var(--color-border-light);
  }

  .mobile-comment__main {
    display: grid;
    gap: 8px;
    width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-text-primary);
    font: inherit;
    text-align: left;
  }

  .mobile-comment__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .mobile-comment__content {
    display: -webkit-box;
    overflow: hidden;
    line-height: 1.65;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .mobile-comment__main small {
    color: var(--color-text-tertiary);
  }

  .mobile-comment__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm);

    :deep(.ui-button) {
      width: 100%;
    }
  }

  .table-footer {
    align-items: flex-start;
  }

  .drawer-actions {
    flex-wrap: wrap;

    :deep(.ui-button) {
      flex: 1 1 auto;
    }
  }
}
</style>
