<template>
  <div class="trust-admin">
    <UiPanel icon="postcard" title="好友申请" flush>
      <template #actions>
        <div class="header-actions">
          <UiSelect
            v-model="statusFilter"
            clearable
            placeholder="全部状态"
            style="width: 160px"
            :options="[
              { label: '待处理', value: TrustRequestStatus.PENDING },
              { label: '已通过', value: TrustRequestStatus.APPROVED },
              { label: '已拒绝', value: TrustRequestStatus.REJECTED },
            ]"
            @change="loadRequests(1)"
          />
          <UiInput
            v-model="keyword"
            placeholder="搜索用户名 / 昵称 / 邮箱"
            clearable
            prefix-icon="search"
            style="width: 260px"
            @enter="loadRequests(1)"
          />
          <UiButton @click="loadRequests(1)">筛选</UiButton>
        </div>
      </template>

      <div class="panel-inner">
        <UiTable :data="requests" :loading="loading" style="width: 100%">
          <UiTableColumn label="申请人" min-width="180">
            <template #default="{ row }">
              <div class="user-cell">
                <button
                  type="button"
                  class="user-name user-name--link"
                  @click="goToUserProfile(row)"
                >
                  {{ row.nickname || row.username || '--' }}
                </button>
                <div class="user-sub">{{ row.username || '--' }}</div>
              </div>
            </template>
          </UiTableColumn>
          <UiTableColumn label="邮箱" min-width="200">
            <template #default="{ row }">
              {{ row.userEmail || row.contactEmail || '--' }}
            </template>
          </UiTableColumn>
          <UiTableColumn label="申请理由" min-width="280" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.reason }}
            </template>
          </UiTableColumn>
          <UiTableColumn label="附件" width="90">
            <template #default="{ row }">
              {{ row.attachments?.length || 0 }}
            </template>
          </UiTableColumn>
          <UiTableColumn label="状态" width="110">
            <template #default="{ row }">
              <AppStatusPill :tone="getStatusTone(row.status)">
                {{ getStatusLabel(row.status) }}
              </AppStatusPill>
            </template>
          </UiTableColumn>
          <UiTableColumn label="提交时间" min-width="170">
            <template #default="{ row }">
              {{ formatDate(row.createTime) }}
            </template>
          </UiTableColumn>
          <UiTableColumn label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <UiButton variant="text" size="sm" @click="openDialog(row)">查看</UiButton>
            </template>
          </UiTableColumn>
        </UiTable>

        <div class="table-footer">
          <UiPagination
            :current="page"
            :page-size="pageSize"
            :total="total"
            @change="loadRequests"
          />
        </div>
      </div>
    </UiPanel>

    <UiDialog v-model="dialogVisible" title="好友申请详情" width="720px">
      <template v-if="activeRequest">
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">申请人</span>
            <div class="detail-user">
              <strong>{{ activeRequest.nickname || activeRequest.username || '--' }}</strong>
              <button
                type="button"
                class="detail-link-btn"
                @click="goToUserProfile(activeRequest)"
              >
                查看主页
              </button>
            </div>
          </div>
          <div class="detail-item">
            <span class="detail-label">用户名</span>
            <strong>{{ activeRequest.username || '--' }}</strong>
          </div>
          <div class="detail-item">
            <span class="detail-label">邮箱</span>
            <strong>{{ activeRequest.userEmail || activeRequest.contactEmail || '--' }}</strong>
          </div>
          <div class="detail-item">
            <span class="detail-label">状态</span>
            <AppStatusPill :tone="getStatusTone(activeRequest.status)">
              {{ getStatusLabel(activeRequest.status) }}
            </AppStatusPill>
          </div>
        </div>

        <div class="detail-block">
          <div class="detail-label">申请理由</div>
          <div class="detail-content">{{ activeRequest.reason }}</div>
        </div>

        <div class="detail-block">
          <div class="detail-label">附件</div>
          <div v-if="activeRequest.attachments?.length" class="attachment-list">
            <a
              v-for="item in activeRequest.attachments"
              :key="item.id"
              :href="item.fileUrl"
              target="_blank"
              rel="noreferrer"
              class="attachment-chip"
            >
              {{ item.fileName }}
            </a>
          </div>
          <div v-else class="detail-empty">未上传附件</div>
        </div>

        <div class="detail-block" v-if="activeRequest.reviewNote">
          <div class="detail-label">历史审核说明</div>
          <div class="detail-content">{{ activeRequest.reviewNote }}</div>
        </div>

        <UiForm v-if="activeRequest.status === TrustRequestStatus.PENDING" label-position="top">
          <UiFormField label="审核说明">
            <UiTextarea
              v-model="reviewNote"
              :rows="4"
              maxlength="500"
              show-count
              placeholder="通过时可选填；拒绝时建议说明原因。"
            />
          </UiFormField>
        </UiForm>
      </template>

      <template #footer>
        <UiButton variant="text" @click="dialogVisible = false">关闭</UiButton>
        <template v-if="activeRequest?.status === TrustRequestStatus.PENDING">
          <UiButton variant="danger" :loading="reviewLoading" @click="handleReject">拒绝</UiButton>
          <UiButton variant="primary" :loading="reviewLoading" @click="handleApprove">通过</UiButton>
        </template>
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { notify } from '@/lib/feedback'
import { UiPanel, UiButton, UiDialog, UiForm, UiFormField, UiInput, UiPagination, UiSelect, UiTable, UiTableColumn, UiTextarea } from '@/components/ui'
import { AppStatusPill } from '@/components/app'
import type { AccentTone } from '@/design/tokens'
import { approveTrustRequest, getAdminTrustRequests, rejectTrustRequest } from '@/api/trust-request'
import type { TrustRequest } from '@/types'
import { TrustRequestStatus } from '@/types'

const router = useRouter()
const loading = ref(false)
const reviewLoading = ref(false)
const dialogVisible = ref(false)
const requests = ref<TrustRequest[]>([])
const activeRequest = ref<TrustRequest | null>(null)
const reviewNote = ref('')
const page = ref(1)
const total = ref(0)
const pageSize = 10
const keyword = ref('')
const statusFilter = ref<TrustRequestStatus | undefined>()

const getStatusLabel = (status: TrustRequestStatus) => {
  if (status === TrustRequestStatus.PENDING) return '待处理'
  if (status === TrustRequestStatus.APPROVED) return '已通过'
  return '已拒绝'
}

const getStatusTone = (status: TrustRequestStatus): AccentTone => {
  if (status === TrustRequestStatus.PENDING) return 'warning'
  if (status === TrustRequestStatus.APPROVED) return 'success'
  return 'danger'
}

const formatDate = (value?: string) => {
  if (!value) return '--'
  return value.replace('T', ' ')
}

const loadRequests = async (nextPage = page.value) => {
  loading.value = true
  try {
    const res = await getAdminTrustRequests({
      page: nextPage,
      size: pageSize,
      status: statusFilter.value,
      keyword: keyword.value.trim() || undefined,
    })
    requests.value = res.list || []
    total.value = res.total || 0
    page.value = res.page || nextPage
  } catch {
    requests.value = []
    total.value = 0
    notify.error('好友申请列表加载失败')
  } finally {
    loading.value = false
  }
}

const openDialog = (row: TrustRequest) => {
  activeRequest.value = { ...row }
  reviewNote.value = row.reviewNote || ''
  dialogVisible.value = true
}

const goToUserProfile = (row: TrustRequest) => {
  if (!row.userId) {
    notify.warning('该申请缺少用户标识，暂时无法跳转主页')
    return
  }
  router.push(`/user/${String(row.userId)}`)
}

const handleApprove = async () => {
  if (!activeRequest.value) return
  reviewLoading.value = true
  try {
    await approveTrustRequest(activeRequest.value.id, { reviewNote: reviewNote.value.trim() || undefined })
    notify.success('申请已通过')
    dialogVisible.value = false
    await loadRequests(page.value)
  } finally {
    reviewLoading.value = false
  }
}

const handleReject = async () => {
  if (!activeRequest.value) return
  const note = reviewNote.value.trim()
  if (note.length < 2) {
    notify.warning('拒绝时请至少填写 2 个字的说明')
    return
  }
  reviewLoading.value = true
  try {
    await rejectTrustRequest(activeRequest.value.id, { reviewNote: note })
    notify.success('申请已拒绝')
    dialogVisible.value = false
    await loadRequests(page.value)
  } finally {
    reviewLoading.value = false
  }
}

onMounted(() => {
  loadRequests()
})
</script>

<style scoped lang="scss">
.panel-inner {
  padding: var(--space-lg);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 600;
  color: var(--text-primary);
}

.user-name--link {
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: var(--primary);
  }
}

.user-sub {
  color: var(--text-tertiary);
  font-size: 12px;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.detail-item,
.detail-block {
  border-radius: 18px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  padding: 16px;
}

.detail-block {
  margin-top: 16px;
}

.detail-label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.detail-content {
  white-space: pre-wrap;
  line-height: 1.8;
  color: var(--text-primary);
}

.detail-user {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  strong {
    min-width: 0;
  }
}

.detail-link-btn {
  flex: 0 0 auto;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.attachment-chip {
  display: inline-flex;
  align-items: center;
  padding: 9px 14px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  text-decoration: none;
}

.detail-empty {
  color: var(--text-tertiary);
}

@media (max-width: 720px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
