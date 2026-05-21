<template>
  <div class="files-admin">
    <el-card class="files-card" shadow="never">
      <template #header>
        <div class="files-header">
          <div class="files-title">
            <el-icon class="files-title__icon"><Files /></el-icon>
            <div>
              <h2>文件管理</h2>
              <p>统一查看上传文件、业务归属和当前引用情况，便于排查资源遗漏与历史脏数据。</p>
            </div>
          </div>
          <div class="files-actions">
            <el-button :icon="Refresh" :loading="loading" @click="loadFiles()">刷新</el-button>
            <el-button type="primary" plain :loading="rebuilding" @click="handleRebuildReferences">
              重建引用
            </el-button>
          </div>
        </div>
      </template>

      <div class="files-body">
        <section class="files-overview">
          <div class="overview-grid">
            <div class="overview-item">
              <span>当前页文件</span>
              <strong>{{ files.length }}</strong>
            </div>
            <div class="overview-item">
              <span>已引用</span>
              <strong>{{ referencedCount }}</strong>
            </div>
            <div class="overview-item">
              <span>待绑定</span>
              <strong>{{ pendingCount }}</strong>
            </div>
            <div class="overview-item">
              <span>未引用</span>
              <strong>{{ unreferencedCount }}</strong>
            </div>
          </div>
          <p class="overview-note">
            当前后台以统一引用表为准；对于历史资源，建议在完成数据检查后再执行“重建引用”。
          </p>
        </section>

        <section class="files-section">
          <div class="section-head">
            <div>
              <span class="section-kicker">Filters</span>
              <h3>筛选与检索</h3>
            </div>
            <el-button text @click="resetFilters">清空筛选</el-button>
          </div>

          <div class="filter-grid">
            <el-input
              v-model="query.keyword"
              clearable
              placeholder="搜索文件名、原始文件名或 URL"
              @keyup.enter="loadFiles(1)"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <el-select v-model="query.status" clearable placeholder="文件状态">
              <el-option v-for="option in statusOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>

            <el-select v-model="query.refType" clearable filterable placeholder="上传归属类型">
              <el-option v-for="option in refTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>

            <el-select v-model="referencedFilter" clearable placeholder="引用状态">
              <el-option label="仅已引用" value="true" />
              <el-option label="仅未引用" value="false" />
            </el-select>

            <div class="filter-actions">
              <el-button type="primary" @click="loadFiles(1)">查询</el-button>
            </div>
          </div>
        </section>

        <section class="files-section">
          <div class="section-head">
            <div>
              <span class="section-kicker">Assets</span>
              <h3>文件列表</h3>
            </div>
            <span class="section-meta">共 {{ total }} 条</span>
          </div>

          <el-table :data="files" v-loading="loading" style="width: 100%">
            <el-table-column label="预览" width="96">
              <template #default="{ row }">
                <button class="asset-thumb" type="button" @click="openDetail(row)">
                  <img v-if="isImage(row)" :src="row.fileUrl" :alt="displayName(row)" />
                  <span v-else>{{ fileKindLabel(row) }}</span>
                </button>
              </template>
            </el-table-column>

            <el-table-column label="文件" min-width="260">
              <template #default="{ row }">
                <div class="file-main">
                  <strong>{{ displayName(row) }}</strong>
                  <span>{{ row.fileOriginalName || row.fileName || row.objectName || '-' }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="归属类型" min-width="160">
              <template #default="{ row }">
                <el-tag effect="plain">{{ refTypeLabel(row.refType) }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="引用状态" min-width="140">
              <template #default="{ row }">
                <el-tag :type="referenceStatusType(row.referenceStatus)">
                  {{ referenceStatusLabel(row.referenceStatus) }}
                </el-tag>
                <span class="reference-count">{{ row.referenceCount }} 处</span>
              </template>
            </el-table-column>

            <el-table-column label="上传人" min-width="120">
              <template #default="{ row }">
                <span>{{ row.username || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column label="大小" min-width="120">
              <template #default="{ row }">
                <span>{{ formatFileSize(row.fileSize) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="上传时间" min-width="170">
              <template #default="{ row }">
                <span>{{ formatDateTime(row.createTime) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="openDetail(row)">详情</el-button>
                <el-button link @click="copyUrl(row.fileUrl)">复制链接</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-footer">
            <el-pagination
              background
              layout="total, prev, pager, next"
              :current-page="page"
              :page-size="pageSize"
              :total="total"
              @current-change="loadFiles"
            />
          </div>
        </section>
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" size="560px" destroy-on-close>
      <template #header>
        <div class="drawer-title">
          <span class="section-kicker">File Detail</span>
          <h3>{{ detail ? displayName(detail) : '文件详情' }}</h3>
        </div>
      </template>

      <div v-loading="detailLoading" class="drawer-body" v-if="detail">
        <div class="drawer-preview">
          <img v-if="isImage(detail)" :src="detail.fileUrl" :alt="displayName(detail)" />
          <div v-else class="drawer-fallback">
            <strong>{{ fileKindLabel(detail) }}</strong>
            <span>{{ detail.contentType || '未知类型' }}</span>
          </div>
        </div>

        <div class="drawer-section">
          <div class="drawer-meta">
            <div>
              <span>文件名</span>
              <strong>{{ displayName(detail) }}</strong>
            </div>
            <div>
              <span>原始文件名</span>
              <strong>{{ detail.fileOriginalName || '-' }}</strong>
            </div>
            <div>
              <span>对象路径</span>
              <strong>{{ detail.objectName || '-' }}</strong>
            </div>
            <div>
              <span>上传人</span>
              <strong>{{ detail.username || '-' }}</strong>
            </div>
            <div>
              <span>引用状态</span>
              <strong>{{ referenceStatusLabel(detail.referenceStatus) }}</strong>
            </div>
            <div>
              <span>文件大小</span>
              <strong>{{ formatFileSize(detail.fileSize) }}</strong>
            </div>
          </div>

          <el-input
            :model-value="detail.fileUrl"
            readonly
            type="textarea"
            :rows="3"
          />
          <div class="drawer-inline-actions">
            <el-button @click="copyUrl(detail.fileUrl)">复制链接</el-button>
            <el-button v-if="isImage(detail)" plain @click="windowOpen(detail.fileUrl)">新标签预览</el-button>
          </div>
        </div>

        <div class="drawer-section">
          <div class="section-head section-head--compact">
            <div>
              <span class="section-kicker">References</span>
              <h3>引用详情</h3>
            </div>
            <span class="section-meta">{{ detail.references.length }} 条</span>
          </div>

          <div v-if="!detail.references.length" class="empty-state">
            当前没有识别到引用记录。
          </div>

          <div v-else class="reference-list">
            <article v-for="item in detail.references" :key="referenceKey(item)" class="reference-item">
              <div class="reference-item__head">
                <el-tag effect="plain">{{ moduleLabel(item.moduleCode) }}</el-tag>
                <span>{{ item.bizLabel || `${item.bizType} #${item.bizId}` }}</span>
              </div>
              <div class="reference-item__meta">
                <span>字段：{{ item.fieldKey }}</span>
                <span>来源：{{ item.sourceType }}</span>
              </div>
            </article>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Files, Refresh, Search } from '@element-plus/icons-vue'
import {
  getAdminFileDetail,
  getAdminFiles,
  rebuildFileReferences,
  type AdminFile,
  type AdminFileDetail,
  type AdminFileReference,
} from '@/api/admin-file'

const statusOptions = [
  { label: '临时文件', value: 'TEMP' },
  { label: '永久文件', value: 'PERMANENT' },
  { label: '已删除', value: 'DELETED' },
]

const refTypeOptions = [
  { label: '文章正文', value: 'ARTICLE_CONTENT' },
  { label: '文章封面', value: 'ARTICLE_COVER' },
  { label: '站点资源', value: 'SITE_ASSET' },
  { label: '站点 Hero', value: 'SITE_HERO' },
  { label: '用户头像', value: 'AVATAR' },
  { label: '受信申请附件', value: 'TRUST_REQUEST_ATTACHMENT' },
  { label: '旅行记忆图片', value: 'TRAVEL_MEMORY_IMAGE' },
  { label: '其他', value: 'OTHER' },
]

const query = reactive({
  keyword: '',
  status: '',
  refType: '',
})
const referencedFilter = ref<'true' | 'false' | ''>('')

const files = ref<AdminFile[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const loading = ref(false)
const rebuilding = ref(false)

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<AdminFileDetail | null>(null)

const referencedCount = computed(() => files.value.filter((item) => item.referenceStatus === 'REFERENCED').length)
const pendingCount = computed(() => files.value.filter((item) => item.referenceStatus === 'PENDING').length)
const unreferencedCount = computed(() => files.value.filter((item) => item.referenceStatus === 'UNREFERENCED').length)

async function loadFiles(nextPage = page.value) {
  loading.value = true
  try {
    const result = await getAdminFiles({
      page: nextPage,
      size: pageSize,
      keyword: query.keyword.trim() || undefined,
      status: query.status || undefined,
      refType: query.refType || undefined,
      referenced: referencedFilter.value ? referencedFilter.value === 'true' : undefined,
    })
    files.value = result.list || []
    total.value = result.total || 0
    page.value = result.page || nextPage
  } catch {
    files.value = []
    total.value = 0
    ElMessage.error('文件列表加载失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  query.keyword = ''
  query.status = ''
  query.refType = ''
  referencedFilter.value = ''
  void loadFiles(1)
}

async function openDetail(row: AdminFile) {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await getAdminFileDetail(row.id)
  } catch {
    ElMessage.error('文件详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

async function handleRebuildReferences() {
  rebuilding.value = true
  try {
    const result = await rebuildFileReferences()
    ElMessage.success(`重建完成：文章 ${result.articles}，用户 ${result.users}，引用 ${result.references}`)
    await loadFiles(page.value)
    if (detail.value?.id != null) {
      detail.value = await getAdminFileDetail(detail.value.id)
    }
  } catch {
    ElMessage.error('引用重建失败')
  } finally {
    rebuilding.value = false
  }
}

function displayName(row: Pick<AdminFile, 'fileOriginalName' | 'fileName' | 'objectName'>) {
  return row.fileOriginalName || row.fileName || row.objectName || '未命名文件'
}

function isImage(row: Pick<AdminFile, 'contentType' | 'fileUrl'>) {
  return Boolean(row.contentType?.startsWith('image/')) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(row.fileUrl || '')
}

function fileKindLabel(row: Pick<AdminFile, 'contentType' | 'fileUrl'>) {
  if (isImage(row)) return '图片'
  if (row.contentType?.includes('pdf')) return 'PDF'
  if (row.contentType?.includes('zip') || row.contentType?.includes('rar')) return '压缩包'
  if (row.contentType?.includes('word')) return 'Word'
  return '文件'
}

function refTypeLabel(value?: string) {
  return refTypeOptions.find((option) => option.value === value)?.label || value || '未分类'
}

function referenceStatusLabel(value?: string) {
  switch (value) {
    case 'REFERENCED':
      return '已引用'
    case 'PENDING':
      return '待绑定'
    case 'UNREFERENCED':
      return '未引用'
    case 'DELETED':
      return '已删除'
    default:
      return '未知'
  }
}

function referenceStatusType(value?: string) {
  switch (value) {
    case 'REFERENCED':
      return 'success'
    case 'PENDING':
      return 'warning'
    case 'UNREFERENCED':
      return 'info'
    case 'DELETED':
      return 'danger'
    default:
      return undefined
  }
}

function moduleLabel(value?: string) {
  switch (value) {
    case 'ARTICLE':
      return '文章'
    case 'USER':
      return '用户'
    case 'SITE_CONFIG':
      return '站点配置'
    case 'TRAVEL_MEMORY':
      return '旅行记忆'
    case 'TRAVEL_MEMORY_ENTRY':
      return '旅行记忆条目'
    case 'TRUST_REQUEST':
      return '受信申请'
    default:
      return value || '未知模块'
  }
}

function formatFileSize(size?: number) {
  if (!size || size <= 0) return '-'
  if (size < 1024) return `${size} B`
  const kb = size / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}

function formatDateTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

async function copyUrl(url?: string) {
  if (!url) {
    ElMessage.warning('当前文件没有可复制的链接')
    return
  }
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('文件链接已复制')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

function windowOpen(url?: string) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

function referenceKey(item: AdminFileReference) {
  return `${item.fileId}-${item.moduleCode}-${item.bizType}-${item.bizId}-${item.fieldKey}`
}

onMounted(() => {
  void loadFiles()
})
</script>

<style scoped lang="scss">
.files-card {
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);

  :deep(.el-card__header) {
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--border-light);
  }

  :deep(.el-card__body) {
    padding: var(--spacing-lg);
  }
}

.files-header,
.files-actions,
.section-head,
.filter-actions,
.drawer-inline-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.files-header,
.section-head {
  justify-content: space-between;
}

.files-title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 18px;
  }

  p {
    margin: 4px 0 0;
    color: var(--text-tertiary);
    font-size: 13px;
    line-height: 1.7;
  }
}

.files-title__icon {
  width: 38px;
  height: 38px;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 229, 239, 0.72);
  color: var(--primary);
  font-size: 18px;
}

.files-body {
  display: grid;
  gap: 18px;
}

.files-overview,
.files-section {
  border: 1px solid rgba(235, 219, 228, 0.86);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(255, 249, 252, 0.76)),
    radial-gradient(circle at right top, rgba(255, 214, 230, 0.18), transparent 38%);
}

.files-overview,
.files-section {
  padding: 18px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.overview-item {
  padding: 14px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(235, 219, 228, 0.72);

  span {
    display: block;
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 6px;
    color: #5f4050;
    font-size: 20px;
  }
}

.overview-note {
  margin: 12px 0 0;
  color: rgba(101, 79, 92, 0.72);
  font-size: 13px;
  line-height: 1.7;
}

.section-kicker {
  color: #b97a94;
  font-size: 12px;
}

.section-head {
  margin-bottom: 18px;

  h3 {
    margin: 4px 0 0;
    color: var(--text-primary);
    font-size: 18px;
  }
}

.section-head--compact {
  margin-bottom: 14px;
}

.section-meta {
  color: var(--text-tertiary);
  font-size: 12px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 2.2fr 1fr 1.2fr 1fr auto;
  gap: 12px;
  align-items: center;
}

.asset-thumb {
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(235, 219, 228, 0.8);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 247, 250, 0.92), rgba(244, 248, 255, 0.86));
  cursor: pointer;
  padding: 0;

  img {
    width: 100%;
    height: 100%;
    border-radius: 12px;
    object-fit: cover;
  }

  span {
    color: #ad7188;
    font-size: 12px;
    font-weight: 600;
  }
}

.file-main {
  display: grid;
  gap: 4px;

  strong {
    color: var(--text-primary);
    font-size: 14px;
    line-height: 1.5;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
    word-break: break-all;
  }
}

.reference-count {
  display: inline-block;
  margin-left: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.drawer-title {
  display: grid;
  gap: 4px;

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 18px;
  }
}

.drawer-body {
  display: grid;
  gap: 20px;
}

.drawer-preview,
.drawer-section {
  border: 1px solid rgba(235, 219, 228, 0.82);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.82);
}

.drawer-preview {
  overflow: hidden;
  min-height: 220px;
  display: grid;
  place-items: center;
  background:
    linear-gradient(135deg, rgba(255, 245, 249, 0.92), rgba(240, 246, 255, 0.86));

  img {
    width: 100%;
    max-height: 320px;
    object-fit: contain;
  }
}

.drawer-fallback {
  display: grid;
  gap: 8px;
  text-align: center;
  color: #8f6177;
}

.drawer-section {
  padding: 16px;
}

.drawer-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;

  span {
    display: block;
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 6px;
    color: var(--text-primary);
    font-size: 14px;
    line-height: 1.6;
    word-break: break-all;
  }
}

.drawer-inline-actions {
  margin-top: 12px;
}

.empty-state {
  padding: 14px 0 4px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.reference-list {
  display: grid;
  gap: 10px;
}

.reference-item {
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 249, 252, 0.88);
  border: 1px solid rgba(235, 219, 228, 0.7);
}

.reference-item__head,
.reference-item__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.reference-item__head {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
}

.reference-item__meta {
  margin-top: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
}

@media (max-width: 1080px) {
  .overview-grid,
  .filter-grid,
  .drawer-meta {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 760px) {
  .files-header,
  .section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .files-actions {
    width: 100%;

    :deep(.el-button) {
      flex: 1;
    }
  }

  .overview-grid,
  .filter-grid,
  .drawer-meta {
    grid-template-columns: 1fr;
  }
}
</style>
