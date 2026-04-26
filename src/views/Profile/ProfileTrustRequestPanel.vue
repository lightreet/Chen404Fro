<template>
  <div class="trust-panel" v-loading="loading">
    <section class="trust-hero">
      <div>
        <h3>受信任用户申请</h3>
        <p>用于申请查看“知友可见”的内容，不包含文章发布权限。</p>
      </div>
      <el-tag :type="statusTagType">{{ statusLabel }}</el-tag>
    </section>

    <section v-if="isAdmin" class="trust-state trust-state--done">
      <h4>当前账号是管理员</h4>
      <p>管理员默认拥有全部访问权限，不需要再发起受信任用户申请。</p>
    </section>

    <section v-else-if="isFriend" class="trust-state trust-state--done">
      <h4>你已经是知友</h4>
      <p>现在可以查看设置为“知友可见”的文章和内容。</p>
    </section>

    <template v-else>
      <section v-if="latestRequest" class="trust-state">
        <div class="trust-state__head">
          <h4>最近一次申请</h4>
          <span>{{ formatDate(latestRequest.createTime) }}</span>
        </div>
        <p class="trust-state__reason">{{ latestRequest.reason }}</p>
        <div v-if="latestRequest.attachments?.length" class="attachment-list">
          <a
            v-for="item in latestRequest.attachments"
            :key="item.id"
            :href="item.fileUrl"
            target="_blank"
            rel="noreferrer"
            class="attachment-chip"
          >
            {{ item.fileName }}
          </a>
        </div>
        <p v-if="latestRequest.reviewNote" class="trust-review-note">
          审核说明：{{ latestRequest.reviewNote }}
        </p>
      </section>

      <section v-if="canSubmit" class="trust-form-shell">
        <el-form label-position="top">
          <el-form-item label="申请理由">
            <el-input
              v-model="reason"
              type="textarea"
              :rows="6"
              maxlength="1000"
              show-word-limit
              resize="none"
              placeholder="简单说明你为什么希望成为知友，以及希望管理员了解的背景信息。"
            />
          </el-form-item>

          <el-form-item label="相关附件">
            <div class="upload-block">
              <el-upload
                :show-file-list="false"
                :http-request="handleUploadAttachment"
                :before-upload="beforeAttachmentUpload"
              >
                <el-button plain :disabled="attachments.length >= 3">
                  <el-icon class="btn-icon"><Upload /></el-icon>上传附件
                </el-button>
              </el-upload>
              <span class="upload-hint">最多 3 个附件，支持图片、PDF、TXT、Word 和压缩包，单个不超过 15MB。</span>
            </div>

            <div v-if="attachments.length" class="attachment-list attachment-list--editable">
              <div v-for="item in attachments" :key="item.url" class="attachment-chip attachment-chip--editable">
                <a :href="item.url" target="_blank" rel="noreferrer">{{ item.name }}</a>
                <button type="button" class="attachment-remove" @click="removeAttachment(item.url)">移除</button>
              </div>
            </div>
          </el-form-item>

          <div class="trust-actions">
            <el-button type="primary" :loading="submitting" @click="handleSubmit">
              {{ latestRequest?.status === TrustRequestStatus.REJECTED ? '重新提交申请' : '提交申请' }}
            </el-button>
          </div>
        </el-form>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { UploadRequestOptions } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { createTrustRequest, getMyLatestTrustRequest } from '@/api/trust-request'
import { uploadTrustAttachment } from '@/api/upload'
import type { TrustRequest, User } from '@/types'
import { TrustRequestStatus } from '@/types'
import { isAdminUser, isFriendUser } from '@/utils/permission'

interface AttachmentItem {
  url: string
  name: string
  size?: string
}

const props = defineProps<{
  user: User | null
}>()

const loading = ref(false)
const submitting = ref(false)
const latestRequest = ref<TrustRequest | null>(null)
const reason = ref('')
const attachments = ref<AttachmentItem[]>([])

const isAdmin = computed(() => isAdminUser(props.user))
const isFriend = computed(() => isFriendUser(props.user))
const canSubmit = computed(() => !isAdmin.value && !isFriend.value && latestRequest.value?.status !== TrustRequestStatus.PENDING)

const statusLabel = computed(() => {
  if (isAdmin.value) return '管理员'
  if (isFriend.value) return '已成为知友'
  if (!latestRequest.value) return '未申请'
  if (latestRequest.value.status === TrustRequestStatus.PENDING) return '审核中'
  if (latestRequest.value.status === TrustRequestStatus.APPROVED) return '已通过'
  return '可重新申请'
})

const statusTagType = computed(() => {
  if (isAdmin.value || isFriend.value) return 'success'
  if (latestRequest.value?.status === TrustRequestStatus.PENDING) return 'warning'
  if (latestRequest.value?.status === TrustRequestStatus.REJECTED) return 'danger'
  return 'info'
})

const loadLatestRequest = async () => {
  loading.value = true
  try {
    latestRequest.value = await getMyLatestTrustRequest()
  } catch {
    latestRequest.value = null
  } finally {
    loading.value = false
  }
}

const beforeAttachmentUpload = (file: File) => {
  if (attachments.value.length >= 3) {
    ElMessage.warning('最多只能上传 3 个附件')
    return false
  }
  if (file.size > 15 * 1024 * 1024) {
    ElMessage.warning('附件大小不能超过 15MB')
    return false
  }
  return true
}

const handleUploadAttachment = async (options: UploadRequestOptions) => {
  try {
    const uploaded = await uploadTrustAttachment(options.file)
    attachments.value = [...attachments.value, uploaded]
    options.onSuccess?.(uploaded as never)
    ElMessage.success('附件上传成功')
  } catch (error) {
    options.onError?.(error as any)
  }
}

const removeAttachment = (url: string) => {
  attachments.value = attachments.value.filter((item) => item.url !== url)
}

const handleSubmit = async () => {
  const normalizedReason = reason.value.trim()
  if (!normalizedReason) {
    ElMessage.warning('申请理由不能为空')
    return
  }

  submitting.value = true
  try {
    const created = await createTrustRequest({
      reason: normalizedReason,
      attachmentUrls: attachments.value.map((item) => item.url),
    })
    latestRequest.value = created
    reason.value = ''
    attachments.value = []
    ElMessage.success('申请已提交，管理员会收到邮件提醒')
  } finally {
    submitting.value = false
  }
}

const formatDate = (value?: string) => {
  if (!value) return '--'
  return value.replace('T', ' ')
}

onMounted(() => {
  loadLatestRequest()
})
</script>

<style scoped lang="scss">
.trust-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.trust-hero,
.trust-state,
.trust-form-shell {
  border-radius: 24px;
  border: 1px solid rgba(245, 155, 188, 0.12);
  background: linear-gradient(135deg, rgba(255, 250, 252, 0.96), rgba(249, 248, 255, 0.95));
  padding: 22px;
}

.trust-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  h3 {
    margin: 0 0 6px;
    font-size: 22px;
    color: var(--text-primary);
  }

  p {
    margin: 0;
    line-height: 1.7;
    color: var(--text-secondary);
  }
}

.trust-state {
  h4 {
    margin: 0 0 8px;
    color: var(--text-primary);
  }

  p {
    margin: 0;
    line-height: 1.8;
    color: var(--text-secondary);
  }
}

.trust-state--done {
  background: linear-gradient(135deg, rgba(236, 253, 245, 0.96), rgba(240, 253, 250, 0.96));
  border-color: rgba(22, 163, 74, 0.15);
}

.trust-state__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.trust-state__reason {
  white-space: pre-wrap;
}

.trust-review-note {
  margin-top: 14px !important;
  color: var(--text-primary) !important;
}

.upload-block {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.upload-hint {
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.6;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.attachment-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  width: min(100%, 420px);
  padding: 12px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(245, 155, 188, 0.14);
  box-shadow: 0 10px 24px rgba(215, 156, 186, 0.08);
  color: var(--text-primary);
  text-decoration: none;
}

.attachment-chip a {
  color: inherit;
  text-decoration: none;
  word-break: break-all;
}

.attachment-chip--editable a {
  color: inherit;
  text-decoration: none;
}

.attachment-remove {
  border: none;
  background: transparent;
  color: #d14343;
  cursor: pointer;
  font-size: 12px;
}

.trust-actions {
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 640px) {
  .trust-hero,
  .trust-state__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .attachment-chip {
    width: 100%;
  }
}
</style>
