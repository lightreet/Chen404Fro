<template>
  <div class="files-admin">
    <el-card class="files-card" shadow="never">
      <template #header>
        <div class="files-header">
          <div class="files-title">
            <el-icon class="files-title__icon"><Files /></el-icon>
            <div>
              <h2>文件管理</h2>
            </div>
          </div>
          <div class="files-actions">
            <el-button :icon="Refresh" :loading="loading || statsLoading" @click="handleRefresh">
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <div class="files-body">
        <section v-loading="statsLoading" class="stats-hero">
          <button
            v-for="item in summaryCards"
            :key="item.key"
            type="button"
            class="stats-card"
            :class="[`stats-card--${item.tone}`, { 'is-active': isSummaryCardActive(item.key) }]"
            @click="applySummaryFilter(item.key)"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <small>{{ item.hint }}</small>
            <em class="stats-card__action">{{ item.key === 'total' ? '查看全部文件' : '点击筛选列表' }}</em>
          </button>
        </section>

        <section class="files-section stats-panel">
          <div class="section-head section-head--panel">
            <div>
              <h3>上传归属类型</h3>
              <p>点击图表联动下方文件列表，快速定位对应来源的文件</p>
            </div>
            <div class="insight-toolbar">
              <span class="section-meta">总容量 {{ totalSizeLabel }}</span>
              <el-button v-if="hasQuickFilters" text @click="clearQuickFilters">清除快捷筛选</el-button>
            </div>
          </div>

          <div v-if="hasQuickFilters" class="quick-filter-bar">
            <span class="quick-filter-bar__label">当前快捷筛选</span>
            <el-tag
              v-for="item in quickFilterTags"
              :key="item.key"
              effect="plain"
              round
              closable
              @close="clearQuickFilter(item.key)"
            >
              {{ item.label }}
            </el-tag>
          </div>

          <div ref="refTypeChartRef" class="chart-shell chart-shell--bar"></div>
        </section>

        <section class="files-section">
          <div class="section-head">
            <div>
              <h3>筛选与搜索</h3>
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

            <el-select v-model="query.referenceStatus" clearable placeholder="引用状态">
              <el-option
                v-for="option in referenceStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>

            <div class="filter-actions">
              <el-button type="primary" @click="loadFiles(1)">查询</el-button>
            </div>
          </div>
        </section>

        <section class="files-section files-section--table">
          <div class="section-head section-head--table">
            <div>
              <h3>文件列表</h3>
            </div>
            <span class="section-meta">共 {{ total }} 条</span>
          </div>

          <div class="files-table-panel">
            <div class="files-table-shell">
              <el-table :data="files" v-loading="loading" style="width: 100%" table-layout="fixed">
                <el-table-column label="预览" width="108">
                  <template #default="{ row }">
                    <button class="asset-thumb" type="button" @click="openDetail(row)">
                      <img v-if="isImage(row)" :src="row.fileUrl" :alt="displayName(row)" />
                      <span v-else>{{ fileKindLabel(row) }}</span>
                    </button>
                  </template>
                </el-table-column>

                <el-table-column label="文件" min-width="320" show-overflow-tooltip>
                  <template #default="{ row }">
                    <div class="file-main">
                      <strong>{{ displayName(row) }}</strong>
                      <span>{{ row.fileOriginalName || row.fileName || row.objectName || '-' }}</span>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="归属类型" min-width="128">
                  <template #default="{ row }">
                    <el-tag effect="plain">{{ refTypeLabel(row.refType) }}</el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="引用状态" min-width="128">
                  <template #default="{ row }">
                    <el-tag :type="referenceStatusType(row.referenceStatus)">
                      {{ referenceStatusLabel(row.referenceStatus) }}
                    </el-tag>
                    <span class="reference-count">{{ row.referenceCount }} 次</span>
                  </template>
                </el-table-column>

                <el-table-column label="上传者" min-width="112" show-overflow-tooltip>
                  <template #default="{ row }">
                    <span>{{ row.username || '-' }}</span>
                  </template>
                </el-table-column>

                <el-table-column label="大小" min-width="104">
                  <template #default="{ row }">
                    <span>{{ formatFileSize(row.fileSize) }}</span>
                  </template>
                </el-table-column>

                <el-table-column label="上传时间" min-width="156">
                  <template #default="{ row }">
                    <span>{{ formatDateTime(row.createTime) }}</span>
                  </template>
                </el-table-column>

                <el-table-column label="操作" width="92" align="center">
                  <template #default="{ row }">
                    <div class="table-actions">
                      <el-button
                        type="primary"
                        link
                        :icon="View"
                        title="详情"
                        aria-label="查看详情"
                        @click="openDetail(row)"
                      />
                      <el-button
                        link
                        :icon="Download"
                        title="下载"
                        aria-label="下载文件"
                        @click="downloadFile(row)"
                      />
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>

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
          </div>
        </section>
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" size="560px" destroy-on-close>
      <template #header>
        <div class="drawer-title">
          <h3>{{ detail ? displayName(detail) : '文件详情' }}</h3>
        </div>
      </template>

      <div v-if="detail" v-loading="detailLoading" class="drawer-body">
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
              <span>上传者</span>
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

          <el-input :model-value="detail.fileUrl" readonly type="textarea" :rows="3" />
          <div class="drawer-inline-actions">
            <el-button @click="copyUrl(detail.fileUrl)">复制链接</el-button>
            <el-button v-if="isImage(detail)" plain @click="windowOpen(detail.fileUrl)">新标签预览</el-button>
          </div>
        </div>

        <div class="drawer-section">
          <div class="section-head section-head--compact">
            <div>
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
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Files, Refresh, Search, View } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  getAdminFileDetail,
  getAdminFiles,
  getAdminFileStats,
  type AdminFile,
  type AdminFileDetail,
  type AdminFileReference,
  type AdminFileStats,
} from '@/api/admin-file'

type ReferenceStatusFilter = '' | 'REFERENCED' | 'PENDING' | 'UNREFERENCED' | 'DELETED'
type SummaryCardKey = 'total' | Exclude<ReferenceStatusFilter, ''>

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
  { label: '好友申请附件', value: 'TRUST_REQUEST_ATTACHMENT' },
  { label: '旅行记忆图片', value: 'TRAVEL_MEMORY_IMAGE' },
  { label: '音乐音频', value: 'MUSIC_AUDIO' },
  { label: '音乐封面', value: 'MUSIC_COVER' },
  { label: '其他', value: 'OTHER' },
]

const referenceStatusOptions = [
  { label: '已引用', value: 'REFERENCED' },
  { label: '待绑定', value: 'PENDING' },
  { label: '未引用', value: 'UNREFERENCED' },
  { label: '已删除', value: 'DELETED' },
]

const chartPalette = ['#e58fb2', '#7fb6f1', '#f0bc6d', '#7dc6a1', '#ab94ea', '#93d3c8', '#f49ea6', '#5f8fe8']

const query = reactive<{
  keyword: string
  status: string
  refType: string
  referenceStatus: ReferenceStatusFilter
}>({
  keyword: '',
  status: '',
  refType: '',
  referenceStatus: '',
})

const files = ref<AdminFile[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const loading = ref(false)

const stats = ref<AdminFileStats | null>(null)
const statsLoading = ref(false)

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<AdminFileDetail | null>(null)

const refTypeChartRef = ref<HTMLDivElement | null>(null)
let refTypeChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const refTypeBuckets = computed(() =>
  (stats.value?.refTypeBuckets || []).map((item) => ({
    ...item,
    label: refTypeLabel(item.key),
  })),
)
const totalSizeLabel = computed(() => formatFileSize(stats.value?.totalSize))
const hasQuickFilters = computed(() => Boolean(query.referenceStatus || query.refType))
const quickFilterTags = computed(() => {
  const tags: Array<{ key: 'referenceStatus' | 'refType'; label: string }> = []
  if (query.referenceStatus) {
    tags.push({ key: 'referenceStatus', label: `引用状态：${referenceStatusLabel(query.referenceStatus)}` })
  }
  if (query.refType) {
    tags.push({ key: 'refType', label: `归属类型：${refTypeLabel(query.refType)}` })
  }
  return tags
})

const summaryCards = computed(() => {
  const data = stats.value
  return [
    { key: 'total' as const, label: '文件总数', value: data?.totalFiles ?? 0, hint: `总容量 ${formatFileSize(data?.totalSize)}`, tone: 'rose' },
    { key: 'REFERENCED' as const, label: '已引用', value: data?.referencedCount ?? 0, hint: `引用记录 ${data?.referenceRecordCount ?? 0}`, tone: 'blue' },
    { key: 'PENDING' as const, label: '待绑定', value: data?.pendingCount ?? 0, hint: '临时上传待归档', tone: 'amber' },
    { key: 'UNREFERENCED' as const, label: '未引用', value: data?.unreferencedCount ?? 0, hint: `已删除 ${data?.deletedCount ?? 0}`, tone: 'green' },
  ]
})

async function loadFiles(nextPage = page.value) {
  loading.value = true
  try {
    const result = await getAdminFiles({
      page: nextPage,
      size: pageSize,
      keyword: query.keyword.trim() || undefined,
      status: query.status || undefined,
      refType: query.refType || undefined,
      referenceStatus: query.referenceStatus || undefined,
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

async function loadStats() {
  statsLoading.value = true
  try {
    stats.value = await getAdminFileStats()
    await nextTick()
    renderCharts()
  } catch {
    stats.value = null
    ElMessage.error('文件统计加载失败')
  } finally {
    statsLoading.value = false
  }
}

function resetFilters() {
  query.keyword = ''
  query.status = ''
  query.refType = ''
  query.referenceStatus = ''
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

function handleRefresh() {
  void Promise.all([loadFiles(1), loadStats()])
}

function isSummaryCardActive(key: SummaryCardKey) {
  if (key === 'total') {
    return !query.referenceStatus
  }
  return query.referenceStatus === key
}

function applySummaryFilter(key: SummaryCardKey) {
  query.referenceStatus = key === 'total' || query.referenceStatus === key ? '' : key
  void loadFiles(1)
}

function clearQuickFilter(key: 'referenceStatus' | 'refType') {
  query[key] = ''
  void loadFiles(1)
}

function clearQuickFilters() {
  query.referenceStatus = ''
  query.refType = ''
  void loadFiles(1)
}

function toggleRefTypeFilter(refType?: string) {
  if (!refType) return
  query.refType = query.refType === refType ? '' : refType
  void loadFiles(1)
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
      return '好友申请'
    case 'MUSIC_TRACK':
      return '音乐曲目'
    default:
      return value || '未知模块'
  }
}

function formatFileSize(size?: number | null) {
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

function downloadFile(row: Pick<AdminFile, 'fileUrl' | 'fileOriginalName' | 'fileName' | 'objectName'>) {
  if (!row.fileUrl) {
    ElMessage.warning('当前文件没有可下载的地址')
    return
  }
  const link = document.createElement('a')
  link.href = row.fileUrl
  link.download = displayName(row)
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function windowOpen(url?: string) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

function referenceKey(item: AdminFileReference) {
  return `${item.fileId}-${item.moduleCode}-${item.bizType}-${item.bizId}-${item.fieldKey}`
}

function ensureChart(refEl: HTMLDivElement | null, current: echarts.ECharts | null) {
  if (!refEl) return null
  return current ?? echarts.init(refEl)
}

function renderCharts() {
  renderRefTypeChart()
}

function renderRefTypeChart() {
  refTypeChart = ensureChart(refTypeChartRef.value, refTypeChart)
  if (!refTypeChart) return

  const buckets = refTypeBuckets.value
  const currentRefType = query.refType

  refTypeChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: number) => `${value} 个文件`,
    },
    grid: {
      top: 12,
      left: 12,
      right: 22,
      bottom: 8,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: 'rgba(229, 214, 223, 0.55)',
        },
      },
      axisLabel: {
        color: '#8a7280',
      },
    },
    yAxis: {
      type: 'category',
      data: buckets.map((item) => item.label),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        color: '#6b4f5d',
      },
    },
    series: [
      {
        type: 'bar',
        data: buckets.map((item, index) => ({
          value: item.count,
          rawKey: item.key,
          itemStyle: {
            borderRadius: [0, 999, 999, 0],
            color: chartPalette[index % chartPalette.length],
            opacity: !currentRefType || currentRefType === item.key ? 1 : 0.42,
            shadowBlur: currentRefType === item.key ? 18 : 0,
            shadowColor: currentRefType === item.key ? 'rgba(110, 74, 92, 0.18)' : 'transparent',
          },
        })),
        barWidth: 14,
      },
    ],
  })

  refTypeChart.off('click')
  refTypeChart.on('click', (params) => {
    const rawKey = typeof params.data === 'object' && params.data ? (params.data as { rawKey?: string }).rawKey : ''
    toggleRefTypeFilter(rawKey)
  })
}

function resizeCharts() {
  refTypeChart?.resize()
}

function setupResizeObserver() {
  if (typeof ResizeObserver === 'undefined') return
  resizeObserver = new ResizeObserver(() => {
    resizeCharts()
  })
  if (refTypeChartRef.value) {
    resizeObserver.observe(refTypeChartRef.value)
  }
}

function teardownCharts() {
  resizeObserver?.disconnect()
  resizeObserver = null
  refTypeChart?.dispose()
  refTypeChart = null
}

watch(refTypeBuckets, async () => {
  if (!stats.value) return
  await nextTick()
  renderCharts()
})

watch(() => query.refType, async () => {
  if (!stats.value) return
  await nextTick()
  renderCharts()
})

onMounted(async () => {
  await Promise.all([loadFiles(), loadStats()])
  await nextTick()
  setupResizeObserver()
})

onBeforeUnmount(() => {
  teardownCharts()
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

.files-section {
  border: 1px solid rgba(235, 219, 228, 0.86);
  border-radius: 18px;
  padding: 18px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(255, 249, 252, 0.76)),
    radial-gradient(circle at right top, rgba(255, 214, 230, 0.18), transparent 38%);
}

.section-head {
  margin-bottom: 18px;

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 18px;
  }

  p {
    margin: 6px 0 0;
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.section-head--compact {
  margin-bottom: 14px;
}

.section-head--table {
  margin-bottom: 14px;
  align-items: end;
}

.section-head--panel {
  align-items: flex-start;
}

.section-meta {
  color: var(--text-tertiary);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(235, 219, 228, 0.76);
}

.filter-grid {
  display: grid;
  grid-template-columns: 2.2fr 1fr 1.2fr 1fr auto;
  gap: 12px;
  align-items: center;
}

.files-table-shell {
  width: 100%;
  overflow-x: auto;
}

.files-table-panel {
  max-width: 1260px;
  margin: 0 auto;
  padding: 10px 12px 8px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(255, 250, 252, 0.34));
  border: 1px solid rgba(238, 225, 232, 0.74);
}

.files-table-shell :deep(.el-table) {
  min-width: 1080px;
  border-radius: 16px;
  overflow: hidden;
}

.files-table-shell :deep(.el-table__inner-wrapper) {
  min-width: 1080px;
}

.files-table-shell :deep(.el-table th.el-table__cell) {
  height: 52px;
  background: rgba(255, 249, 252, 0.9);
}

.files-table-shell :deep(.el-table td.el-table__cell) {
  padding: 10px 0;
}

.files-table-shell :deep(.el-table .cell) {
  padding-left: 12px;
  padding-right: 12px;
}

.files-table-shell :deep(.el-table__row) {
  transition: background-color 0.2s ease;
}

.files-table-shell :deep(.el-table__row:hover > td.el-table__cell) {
  background: rgba(255, 247, 251, 0.76);
}

.table-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
}

.table-actions :deep(.el-button) {
  min-height: 28px;
  min-width: 28px;
  margin-left: 0;
  padding: 4px;
  border-radius: 999px;
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
  justify-content: center;
  margin-top: 18px;
}

.stats-hero {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stats-card {
  padding: 18px 18px 16px;
  border-radius: 20px;
  border: 1px solid rgba(235, 219, 228, 0.76);
  background:
    linear-gradient(150deg, rgba(255, 255, 255, 0.96), rgba(255, 247, 251, 0.82)),
    radial-gradient(circle at right top, rgba(255, 216, 231, 0.18), transparent 44%);
  box-shadow: 0 14px 34px rgba(211, 183, 194, 0.12);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  appearance: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 38px rgba(211, 183, 194, 0.18);
  }

  span,
  small,
  em {
    display: block;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 10px;
    color: #573848;
    font-size: 28px;
    line-height: 1;
  }

  small {
    margin-top: 10px;
    color: #a18593;
    font-size: 12px;
  }
}

.stats-card.is-active {
  border-color: rgba(214, 128, 171, 0.62);
  box-shadow: 0 20px 40px rgba(198, 125, 158, 0.18);
}

.stats-card__action {
  margin-top: 14px;
  color: #c47d9e;
  font-size: 12px;
  font-style: normal;
}

.stats-card--rose strong {
  color: #c46f94;
}

.stats-card--blue strong {
  color: #678fc9;
}

.stats-card--amber strong {
  color: #c08b3e;
}

.stats-card--green strong {
  color: #5d9e81;
}

.stats-panel {
  min-width: 0;
}

.insight-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.quick-filter-bar__label {
  color: var(--text-tertiary);
  font-size: 12px;
}

.chart-shell {
  width: 100%;
  height: 320px;
}

.chart-shell--bar {
  height: 340px;
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

@media (max-width: 1180px) {
  .stats-hero {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 1080px) {
  .drawer-meta {
    grid-template-columns: 1fr 1fr;
  }

  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}

@media (max-width: 1280px) {
  .files-card :deep(.el-card__body) {
    padding: 16px;
  }

  .filter-grid {
    grid-template-columns: minmax(0, 1.4fr) repeat(3, minmax(0, 1fr));
  }

  .files-table-panel {
    max-width: none;
    padding-left: 8px;
    padding-right: 8px;
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

  .stats-hero,
  .filter-grid,
  .drawer-meta {
    grid-template-columns: 1fr;
  }

  .filter-actions,
  .table-footer {
    justify-content: stretch;
  }

  .filter-actions :deep(.el-button),
  .table-footer :deep(.el-pagination) {
    width: 100%;
  }

  .chart-shell,
  .chart-shell--bar {
    height: 320px;
  }

  .files-table-panel {
    padding: 8px 0 0;
    border: 0;
    background: transparent;
  }
}
</style>
