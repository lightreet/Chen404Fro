<template>
  <DefaultLayout :wide-content="true" :show-live2-d="false">
    <div class="travel-memory-create-page">
      <section v-loading="loading" class="travel-memory-create-sheet">
        <div class="travel-memory-create__toolbar">
          <el-button text class="travel-memory-create__back" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>

          <div class="travel-memory-create__meta">
            <span>{{ list.length }} 个地点</span>
            <span>{{ form.entries.length }} 张照片</span>
          </div>
        </div>

        <div class="travel-memory-create__hero">
          <div class="travel-memory-create__copy">
            <span class="eyebrow">Travel Editor</span>
            <h1>{{ pageTitle }}</h1>
            <p>{{ pageDescription }}</p>
          </div>

          <el-button text class="travel-memory-create__map-link" @click="router.push('/memory-map')">
            回到旅行地图
          </el-button>
        </div>

        <div class="travel-memory-create__content">
          <section class="editor-card editor-card--coordinate">
            <div class="section-head">
              <span class="section-mark">1</span>
              <div class="section-copy">
                <h4>先在地图上选点</h4>
                <p>先确定旅行发生的位置，我们会尝试根据高德地图坐标自动匹配省份和城市。</p>
              </div>
            </div>

            <div class="coordinate-layout">
              <div class="editor-map-card">
                <TravelMemoryMap
                  :locations="list"
                  picker-mode
                  :picker-latitude="form.latitude ?? null"
                  :picker-longitude="form.longitude ?? null"
                  @pick="handlePickCoordinate"
                />
              </div>

              <div class="coordinate-fields">
                <div
                  class="coordinate-status"
                  :class="{
                    'is-loading': resolvingLocationMeta,
                    'is-warning': locationMetaNeedsManualConfirm,
                  }"
                >
                  <strong>{{ locationMetaStatusTitle }}</strong>
                  <span>{{ locationMetaStatusText }}</span>
                </div>

                <div class="form-grid form-grid--coordinate-meta">
                <el-form-item label="省份">
                  <el-input v-model="form.province" placeholder="例如：福建省" />
                </el-form-item>
                <el-form-item label="城市">
                  <el-input v-model="form.city" placeholder="例如：厦门市" />
                </el-form-item>
                <el-form-item label="纬度（WGS84）">
                  <el-input-number v-model="form.latitude" :precision="6" :step="0.0001" class="w-full" />
                </el-form-item>
                <el-form-item label="经度（WGS84）">
                  <el-input-number v-model="form.longitude" :precision="6" :step="0.0001" class="w-full" />
                </el-form-item>
                </div>

                <button type="button" class="coordinate-adjust-hint" @click="focusCoordinateHint">
                  重新在地图上调整
                </button>
              </div>
            </div>
          </section>

          <section class="editor-card editor-card--intro">
            <div class="section-head">
              <span class="section-mark">2</span>
              <div class="section-copy">
                <h4>补充地点内容</h4>
                <p>位置确认后，再写下这次旅行的标语、简介和到访时间。</p>
              </div>
            </div>

            <el-form label-position="top" class="editor-form">
              <div class="form-grid form-grid--intro">
                <el-form-item label="地点标语" class="form-item--wide">
                  <el-input
                    v-model="form.title"
                    placeholder="例如：海风把这一站轻轻吹亮"
                  />
                </el-form-item>
                <el-form-item label="到访时间" class="form-item--wide">
                  <el-date-picker
                    v-model="form.visitedAt"
                    type="datetime"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    placeholder="可选"
                    class="w-full"
                  />
                </el-form-item>
                <el-form-item label="地点简介" class="form-item--wide">
                  <el-input
                    v-model="form.summaryNote"
                    type="textarea"
                    :rows="4"
                    maxlength="1000"
                    show-word-limit
                    placeholder="写下这次旅行最想留住的一段气味、光线、风景或心情。"
                  />
                </el-form-item>
              </div>

              <div class="form-grid form-grid--meta">
                <el-form-item label="是否展示" class="form-item--toggle">
                  <div class="display-toggle">
                    <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
                    <span>{{ form.status === 1 ? '会在地图中展示' : '暂不展示' }}</span>
                  </div>
                </el-form-item>
              </div>
            </el-form>
          </section>

          <section class="editor-card editor-card--cover">
            <div class="section-head section-head--split">
              <div class="section-head__main">
                <span class="section-mark">3</span>
                <div class="section-copy">
                  <h4>封面图片</h4>
                  <p>先挑一张最能代表这段旅途的照片，详情页会优先展示它。</p>
                </div>
              </div>
              <el-button
                v-if="selectedEntry"
                plain
                type="primary"
                class="cover-action"
                @click="setCover(selectedEntryIndex)"
              >
                {{ selectedEntry.cover ? '当前封面' : '设为封面' }}
              </el-button>
            </div>

            <div v-if="coverEntry" class="cover-preview-row">
              <div class="cover-preview-card">
                <img :src="coverEntry.imageUrl" :alt="coverEntry.remark || form.title || '封面照片'" />
              </div>
            </div>
            <div v-else class="entry-empty entry-empty--compact">先上传一张照片，封面区就会出现。</div>

            <div v-if="form.entries.length" class="thumbnail-strip">
              <button
                v-for="(entry, index) in form.entries"
                :key="entry.id || entry.imageUrl || index"
                type="button"
                class="thumbnail-chip"
                :class="{ 'is-active': selectedEntryIndex === index, 'is-cover': entry.cover }"
                @click="selectedEntryIndex = index"
              >
                <img :src="entry.imageUrl" :alt="entry.remark || `旅行照片 ${index + 1}`" />
              </button>
            </div>
          </section>

          <section class="entry-section editor-card">
            <div class="section-head section-head--split">
              <div class="section-head__main">
                <span class="section-mark">4</span>
                <div class="section-copy">
                  <h4>照片记忆</h4>
                  <p>给每张照片写一句标题和一点感想，这会组成详情页下方的小卡片。</p>
                </div>
              </div>
              <el-upload
                class="entry-upload-trigger"
                :show-file-list="false"
                :before-upload="beforeImageUpload"
                :http-request="handleUploadEntryImage"
                accept="image/*"
                multiple
              >
                <el-button class="section-upload-btn" type="primary" plain :loading="uploading">
                  上传照片
                </el-button>
              </el-upload>
            </div>

            <div v-if="!form.entries.length" class="entry-empty entry-empty--upload">
              <span>至少需要上传一张照片。</span>
              <el-upload
                :show-file-list="false"
                :before-upload="beforeImageUpload"
                :http-request="handleUploadEntryImage"
                accept="image/*"
                multiple
              >
                <el-button class="entry-empty__button" type="primary" plain :loading="uploading">
                  上传第一张照片
                </el-button>
              </el-upload>
            </div>

            <div v-else class="entry-board">
              <article
                v-for="(entry, index) in form.entries"
                :key="entry.id || entry.imageUrl || index"
                class="memory-entry-card"
                :class="{ 'is-cover': entry.cover, 'is-active': selectedEntryIndex === index }"
              >
                <button type="button" class="memory-entry-card__preview" @click="selectedEntryIndex = index">
                  <img :src="entry.imageUrl" :alt="entry.remark || form.title || `旅行照片 ${index + 1}`" />
                  <span v-if="entry.cover" class="memory-entry-card__cover-badge">好封面</span>
                </button>

                <div class="memory-entry-card__fields">
                  <div class="memory-entry-card__meta">
                    <span>备注标题</span>
                    <button type="button" class="entry-inline-action" @click="selectedEntryIndex = index">
                      聚焦编辑
                    </button>
                  </div>
                  <el-input v-model="entry.remark" placeholder="照片标题" />

                  <div class="memory-entry-card__meta">
                    <span>感想</span>
                    <span>{{ entry.thanksNote?.length || 0 }}/2000</span>
                  </div>
                  <el-input
                    v-model="entry.thanksNote"
                    type="textarea"
                    :rows="3"
                    maxlength="2000"
                    show-word-limit
                    placeholder="为这张照片写一点感想"
                  />

                  <div class="memory-entry-card__inline">
                    <div class="memory-entry-card__field">
                      <span>拍摄时间</span>
                      <el-date-picker
                        v-model="entry.shotAt"
                        type="datetime"
                        value-format="YYYY-MM-DDTHH:mm:ss"
                        placeholder="拍摄时间"
                        class="w-full"
                      />
                    </div>
                    <div class="memory-entry-card__field">
                      <span>排序</span>
                      <el-input-number v-model="entry.displayOrder" :min="0" :max="9999" class="w-full" />
                    </div>
                  </div>

                  <div class="memory-entry-card__actions">
                    <el-button text type="primary" @click="setCover(index)">设为封面</el-button>
                    <el-button text type="danger" @click="removeEntry(index)">删除</el-button>
                  </div>
                </div>
              </article>

              <el-upload
                class="entry-upload-tile"
                :show-file-list="false"
                :before-upload="beforeImageUpload"
                :http-request="handleUploadEntryImage"
                accept="image/*"
                multiple
              >
                <div class="entry-upload-tile__inner">
                  <span class="entry-upload-tile__plus">+</span>
                  <strong>继续上传</strong>
                  <span>支持 JPG / PNG / GIF</span>
                </div>
              </el-upload>
            </div>
          </section>
        </div>

        <div class="travel-memory-create__footer">
          <div class="travel-memory-create__footer-inner">
            <el-button class="footer-button footer-button--neutral" @click="router.push('/memory-map')">
              返回地图
            </el-button>
            <el-button class="footer-button footer-button--save" type="primary" :loading="saving" @click="handleSave">
              {{ saveButtonLabel }}
            </el-button>
          </div>
        </div>
      </section>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { UploadRequestOptions } from 'element-plus'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import TravelMemoryMap from '@/components/TravelMemoryMap/TravelMemoryMap.vue'
import {
  createTravelMemory,
  getAdminTravelMemoryDetail,
  getAdminTravelMemories,
  updateTravelMemory,
} from '@/api/travel-memory'
import { uploadTravelMemoryImage } from '@/api/upload'
import { useSiteConfig } from '@/composables/useSiteConfig'
import type {
  CreateTravelMemoryCommand,
  TravelMemoryEntryUpsertCommand,
  TravelMemoryLocationDetail,
} from '@/types'
import { reverseGeocodeLocation } from '@/utils/amap'
import { normalizeCoordinate } from '@/utils/coordinate'
import { DEFAULT_IMAGE_MAX_MB, validateImageFile } from '@/utils/validation'
import { applySiteMeta } from '@/utils/siteConfig'

const route = useRoute()
const router = useRouter()
const { siteConfig, loadSiteConfig } = useSiteConfig()

const list = ref<TravelMemoryLocationDetail[]>([])
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const resolvingLocationMeta = ref(false)
const locationMetaNeedsManualConfirm = ref(false)
const lastResolvedAddress = ref('')
let locationResolveRequestId = 0
const selectedEntryIndex = ref(0)
const editingDetail = ref<TravelMemoryLocationDetail | null>(null)

const editingId = computed(() => {
  const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  const numericId = Number(rawId)
  return Number.isFinite(numericId) ? numericId : null
})
const isEditMode = computed(() => editingId.value != null)
const pageTitle = computed(() => (isEditMode.value ? '编辑旅游地点' : '新增旅游地点'))
const pageDescription = computed(() =>
  isEditMode.value
    ? '把这段旅途继续整理好，让地图和详情页一起保持统一。'
    : '把新的旅途整理成一张独立页面，再把它轻轻放回地图里。',
)
const saveButtonLabel = computed(() => (isEditMode.value ? '保存修改' : '保存地点'))
const selectedEntry = computed(() => form.entries[selectedEntryIndex.value] || null)
const coverEntry = computed(() => form.entries.find((entry) => entry.cover) || form.entries[0] || null)
const locationMetaStatusTitle = computed(() => {
  if (resolvingLocationMeta.value) return '正在识别地点'
  if (form.province || form.city) return '已自动匹配省市'
  if (form.latitude != null && form.longitude != null) return '未识别到完整省市'
  return '先在地图上选一个位置'
})
const locationMetaStatusText = computed(() => {
  if (resolvingLocationMeta.value) {
    return '正在根据当前坐标反查省份和城市，请稍等片刻。'
  }

  if (form.province || form.city) {
    const summary = [form.province, form.city].filter(Boolean).join(' / ')
    if (locationMetaNeedsManualConfirm.value) {
      return `${summary || '已识别部分地点信息'}，如有偏差可继续手动修改。`
    }
    return lastResolvedAddress.value || `${summary}，你也可以继续补充标语和简介。`
  }

  if (form.latitude != null && form.longitude != null) {
    return '坐标已选中，但还没有匹配出完整省市，可以手动补充。'
  }

  return '点击地图后会自动尝试补全省份和城市。'
})

const createEmptyForm = (): CreateTravelMemoryCommand => ({
  title: '',
  province: '',
  city: '',
  latitude: undefined,
  longitude: undefined,
  summaryNote: '',
  visitedAt: '',
  status: 1,
  sortOrder: 0,
  entries: [],
})

const form = reactive<CreateTravelMemoryCommand>(createEmptyForm())

function resetForm() {
  Object.assign(form, createEmptyForm())
  selectedEntryIndex.value = 0
  resolvingLocationMeta.value = false
  locationMetaNeedsManualConfirm.value = false
  lastResolvedAddress.value = ''
  locationResolveRequestId = 0
}

function fillFormFromDetail(detail: TravelMemoryLocationDetail) {
  Object.assign(form, {
    title: detail.title || '',
    province: detail.province || '',
    city: detail.city || '',
    latitude: detail.latitude,
    longitude: detail.longitude,
    summaryNote: detail.summaryNote || '',
    visitedAt: detail.visitedAt || '',
    status: detail.status ?? 1,
    sortOrder: detail.sortOrder ?? 0,
    entries: (detail.entries || []).map((entry) => ({
      id: entry.id,
      imageUrl: entry.imageUrl,
      remark: entry.remark || '',
      thanksNote: entry.thanksNote || '',
      shotAt: entry.shotAt || '',
      displayOrder: entry.displayOrder ?? 0,
      cover: !!entry.cover,
      sourceLatitude: entry.sourceLatitude,
      sourceLongitude: entry.sourceLongitude,
      geoSource: entry.geoSource || 'NONE',
    })),
  })
  selectedEntryIndex.value = 0
  resolvingLocationMeta.value = false
  locationMetaNeedsManualConfirm.value = false
  lastResolvedAddress.value = [detail.province, detail.city].filter(Boolean).join(' / ')
}

function applyEditorMeta() {
  applySiteMeta(
    siteConfig.value,
    isEditMode.value && editingDetail.value?.title
      ? `编辑 ${editingDetail.value.title}`
      : pageTitle.value,
    pageDescription.value,
  )
}

async function loadList() {
  try {
    list.value = await getAdminTravelMemories()
  } catch {
    ElMessage.error('旅行地点列表加载失败')
  }
}

async function loadEditingDetail() {
  if (!isEditMode.value || editingId.value == null) {
    editingDetail.value = null
    resetForm()
    applyEditorMeta()
    return
  }

  try {
    const detail = await getAdminTravelMemoryDetail(editingId.value)
    editingDetail.value = detail
    fillFormFromDetail(detail)
    if ((!detail.province || !detail.city) && detail.latitude != null && detail.longitude != null) {
      await resolveLocationMetaFromCoordinate(Number(detail.latitude), Number(detail.longitude), { silent: true })
    }
    applyEditorMeta()
  } catch {
    editingDetail.value = null
    resetForm()
    ElMessage.error('地点详情加载失败')
    router.push('/memory-map')
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/memory-map')
}

function beforeImageUpload(file: File) {
  const result = validateImageFile(file, DEFAULT_IMAGE_MAX_MB)
  if (!result.valid) {
    ElMessage.error(result.message)
    return false
  }
  return true
}

async function handleUploadEntryImage(options: UploadRequestOptions) {
  uploading.value = true
  try {
    const result = await uploadTravelMemoryImage(options.file as File)
    const nextEntry: TravelMemoryEntryUpsertCommand = {
      imageUrl: result.url,
      remark: '',
      thanksNote: '',
      shotAt: result.shotAt,
      displayOrder: form.entries.length,
      cover: form.entries.length === 0,
      sourceLatitude: result.latitude,
      sourceLongitude: result.longitude,
      geoSource: result.latitude != null && result.longitude != null ? 'EXIF' : 'NONE',
    }
    form.entries.push(nextEntry)
    selectedEntryIndex.value = form.entries.length - 1
    if ((form.latitude == null || form.longitude == null) && result.latitude != null && result.longitude != null) {
      await applyCoordinateSelection(result.latitude, result.longitude, { silent: true })
    }
    options.onSuccess?.(result as never)
    ElMessage.success('旅行照片上传成功')
  } catch (error) {
    options.onError?.(error as never)
    ElMessage.error('照片上传失败')
  } finally {
    uploading.value = false
  }
}

function updateCoordinateFields(latitude: number, longitude: number) {
  const coordinate = normalizeCoordinate(latitude, longitude)
  form.latitude = coordinate.latitude
  form.longitude = coordinate.longitude
}

async function resolveLocationMetaFromCoordinate(
  latitude: number,
  longitude: number,
  options: { silent?: boolean } = {},
) {
  const requestId = ++locationResolveRequestId
  resolvingLocationMeta.value = true
  locationMetaNeedsManualConfirm.value = false

  try {
    const result = await reverseGeocodeLocation(latitude, longitude)
    if (requestId !== locationResolveRequestId) return

    form.province = result.province || form.province
    form.city = result.city || form.city
    lastResolvedAddress.value =
      result.formattedAddress || [result.province, result.city, result.district].filter(Boolean).join(' / ')
    locationMetaNeedsManualConfirm.value = !result.province || !result.city

    if (!options.silent && (result.province || result.city)) {
      ElMessage.success('已自动匹配省份和城市')
    }
  } catch {
    if (requestId !== locationResolveRequestId) return
    lastResolvedAddress.value = ''
    locationMetaNeedsManualConfirm.value = true
  } finally {
    if (requestId === locationResolveRequestId) {
      resolvingLocationMeta.value = false
    }
  }
}

async function applyCoordinateSelection(
  latitude: number,
  longitude: number,
  options: { silent?: boolean } = {},
) {
  updateCoordinateFields(latitude, longitude)
  form.province = ''
  form.city = ''
  lastResolvedAddress.value = ''
  await resolveLocationMetaFromCoordinate(latitude, longitude, options)
}

async function handlePickCoordinate(payload: { latitude: number; longitude: number }) {
  await applyCoordinateSelection(payload.latitude, payload.longitude)
}

function focusCoordinateHint() {
  ElMessage.info('先在地图上点一下位置，我们会尝试自动补全省份和城市。')
}

function setCover(index: number) {
  form.entries.forEach((entry, currentIndex) => {
    entry.cover = currentIndex === index
  })
}

function removeEntry(index: number) {
  form.entries.splice(index, 1)
  if (form.entries.length > 0 && !form.entries.some((entry) => entry.cover)) {
    form.entries[0].cover = true
  }
  if (selectedEntryIndex.value >= form.entries.length) {
    selectedEntryIndex.value = Math.max(0, form.entries.length - 1)
  }
}

async function handleSave() {
  if (!form.title.trim()) {
    ElMessage.warning('请输入地点标题')
    return
  }
  if (!form.entries.length) {
    ElMessage.warning('至少需要上传一张照片')
    return
  }

  if (form.latitude == null || form.longitude == null) {
    ElMessage.warning('请先在地图上选择地点坐标')
    return
  }

  saving.value = true
  try {
    const payload: CreateTravelMemoryCommand = {
      ...form,
      title: form.title.trim(),
      province: form.province?.trim() || '',
      city: form.city?.trim() || '',
      summaryNote: form.summaryNote?.trim() || '',
      visitedAt: form.visitedAt || undefined,
      entries: form.entries.map((entry, index) => ({
        imageUrl: entry.imageUrl,
        remark: entry.remark?.trim() || '',
        thanksNote: entry.thanksNote?.trim() || '',
        shotAt: entry.shotAt,
        displayOrder: entry.displayOrder ?? index,
        cover: !!entry.cover,
        sourceLatitude: entry.sourceLatitude,
        sourceLongitude: entry.sourceLongitude,
        geoSource: entry.geoSource || 'NONE',
      })),
    }

    const saved = isEditMode.value && editingId.value != null
      ? await updateTravelMemory(editingId.value, payload)
      : await createTravelMemory(payload)
    ElMessage.success(isEditMode.value ? '旅行地点更新成功' : '旅行地点创建成功')
    await loadList()
    router.push({ name: 'TravelMemoryDetail', params: { id: saved.id } })
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  await loadSiteConfig().catch(() => null)
  try {
    await loadList()
    await loadEditingDetail()
  } finally {
    loading.value = false
  }
})

watch(
  () => route.params.id,
  async () => {
    if (!siteConfig.value?.siteName) {
      await loadSiteConfig().catch(() => null)
    }
    loading.value = true
    try {
      await loadList()
      await loadEditingDetail()
    } finally {
      loading.value = false
    }
  },
)
</script>

<style scoped lang="scss">
.travel-memory-create-page {
  --memory-page-surface: rgba(255, 251, 253, 0.97);
  --memory-page-surface-soft: rgba(252, 246, 250, 0.92);
  --memory-page-surface-muted: rgba(248, 240, 246, 0.9);
  --memory-page-surface-strong: rgba(245, 235, 242, 0.94);
  --memory-page-border: rgba(232, 219, 228, 0.94);
  --memory-page-border-strong: rgba(223, 196, 213, 0.96);
  --memory-page-divider: rgba(232, 222, 229, 0.9);
  --memory-page-accent: #d583a3;
  --memory-page-accent-strong: #c76890;
  --memory-page-accent-soft: rgba(213, 131, 163, 0.16);
  --memory-page-text: #5f4654;
  --memory-page-text-soft: #8f7282;
  --memory-page-text-muted: #a78998;
  --memory-page-shadow: rgba(220, 191, 205, 0.14);
  width: min(1180px, calc(100vw - 56px));
  margin: clamp(20px, 2.5vw, 34px) auto 56px;
  padding-bottom: calc(110px + env(safe-area-inset-bottom, 0));
}

.eyebrow {
  display: inline-block;
  color: #d18ca5;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.travel-memory-create-sheet {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 2.2vw, 32px);
  border-radius: 34px;
  background:
    linear-gradient(180deg, var(--memory-page-surface), var(--memory-page-surface-soft)),
    radial-gradient(circle at top right, rgba(219, 166, 193, 0.14), transparent 32%);
  border: 1px solid var(--memory-page-border);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 24px 48px var(--memory-page-shadow);
}

.travel-memory-create__toolbar,
.travel-memory-create__hero,
.section-head,
.section-head__main {
  display: flex;
  align-items: center;
}

.travel-memory-create__toolbar {
  justify-content: space-between;
  gap: 16px;
}

.travel-memory-create__back,
.travel-memory-create__map-link {
  color: var(--memory-page-text-soft);
  font-size: 14px;
}

.travel-memory-create__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.travel-memory-create__meta span {
  min-height: 36px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--memory-page-surface-muted);
  border: 1px solid var(--memory-page-border);
  color: var(--memory-page-text-soft);
  font-size: 13px;
  line-height: 1;
}

.travel-memory-create__hero {
  justify-content: space-between;
  gap: 20px;
  padding: 0 4px;
}

.travel-memory-create__copy {
  display: grid;
  gap: 10px;
}

.travel-memory-create__copy h1 {
  margin: 0;
  color: var(--memory-page-text);
  font-size: clamp(34px, 4vw, 46px);
  font-weight: 700;
  line-height: 1.05;
}

.travel-memory-create__copy p {
  margin: 0;
  color: var(--memory-page-text-soft);
  font-size: 15px;
  line-height: 1.8;
}

.travel-memory-create__content,
.editor-form,
.editor-sheet,
.entry-section {
  display: grid;
  gap: 16px;
}

.travel-memory-create__content {
  gap: 0;
}

.section-head {
  align-items: flex-start;
  gap: 12px;
}

.section-head--split {
  justify-content: space-between;
  gap: 16px;
}

.section-head__main {
  align-items: flex-start;
  gap: 12px;
}

.section-mark {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(221, 162, 189, 0.96), rgba(244, 225, 235, 0.98));
  color: var(--memory-page-accent-strong);
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 10px 20px rgba(214, 178, 195, 0.24);
}

.section-copy {
  min-width: 0;
}

.section-copy h4 {
  margin: 0;
  color: var(--memory-page-text);
  font-size: 16px;
  font-weight: 700;
}

.section-copy p {
  margin: 6px 0 0;
  color: var(--memory-page-text-soft);
  font-size: 13px;
  line-height: 1.65;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-grid--intro {
  gap: 14px 12px;
}

.form-grid--coordinate-meta {
  gap: 12px;
}

.form-grid--meta {
  align-items: end;
}

.display-toggle {
  min-height: 42px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border-radius: 14px;
  background: var(--memory-page-surface-muted);
  border: 1px solid var(--memory-page-border);
  color: var(--memory-page-text-soft);
  font-size: 12px;
}

.form-item--wide {
  grid-column: 1 / -1;
}

.form-item--toggle :deep(.el-form-item__content) {
  justify-content: flex-start;
}

.editor-card {
  display: grid;
  gap: 14px;
  padding: 24px 4px 0;
  border: 0;
  border-top: 1px solid var(--memory-page-divider);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.travel-memory-create__content > .editor-card:first-child {
  padding-top: 0;
  border-top: 0;
}

.coordinate-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(220px, 0.88fr);
  gap: 16px;
  align-items: start;
}

.editor-map-card {
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid var(--memory-page-border);
  background: rgba(255, 250, 253, 0.88);
}

.editor-map-card :deep(.travel-map-shell.is-picker-mode) {
  min-height: 260px;
  border-radius: 20px;
  box-shadow: none;
}

.editor-map-card :deep(.travel-map-canvas) {
  min-height: 260px;
}

.coordinate-fields {
  display: grid;
  gap: 12px;
}

.coordinate-fields :deep(.el-form-item) {
  margin-bottom: 0;
}

.coordinate-status {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid var(--memory-page-border);
  background: rgba(251, 245, 249, 0.96);
}

.coordinate-status strong {
  color: var(--memory-page-text);
  font-size: 13px;
  font-weight: 700;
}

.coordinate-status span {
  color: var(--memory-page-text-soft);
  font-size: 12px;
  line-height: 1.6;
}

.coordinate-status.is-loading {
  border-color: rgba(209, 177, 194, 0.98);
  background: rgba(249, 240, 246, 0.98);
}

.coordinate-status.is-warning {
  border-color: rgba(219, 188, 205, 0.96);
  background: rgba(255, 247, 251, 0.98);
}

.coordinate-adjust-hint {
  min-height: 42px;
  border-radius: 999px;
  border: 1px solid var(--memory-page-border-strong);
  background: var(--memory-page-surface-muted);
  color: var(--memory-page-accent-strong);
  font-size: 13px;
  cursor: pointer;
}

.cover-preview-row {
  display: grid;
  gap: 10px;
}

.cover-preview-card {
  height: 220px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid var(--memory-page-border);
  background: rgba(255, 250, 253, 0.88);
}

.cover-preview-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-action {
  min-width: 104px;
}

:deep(.cover-action),
:deep(.section-upload-btn),
:deep(.entry-empty__button) {
  --el-button-bg-color: rgba(250, 244, 248, 0.96);
  --el-button-border-color: var(--memory-page-border-strong);
  --el-button-hover-bg-color: rgba(247, 238, 244, 0.98);
  --el-button-hover-border-color: rgba(210, 172, 192, 0.98);
  --el-button-active-bg-color: rgba(242, 231, 238, 1);
  --el-button-active-border-color: rgba(204, 164, 184, 1);
  --el-button-text-color: var(--memory-page-accent-strong);
  border-color: var(--memory-page-border-strong) !important;
  background: rgba(250, 244, 248, 0.96) !important;
  color: var(--memory-page-accent-strong) !important;
  box-shadow: none !important;
}

.thumbnail-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 10px;
}

.thumbnail-chip {
  position: relative;
  height: 72px;
  padding: 0;
  border: 1px solid var(--memory-page-border);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 250, 253, 0.9);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.thumbnail-chip img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-chip:hover,
.thumbnail-chip.is-active {
  transform: translateY(-1px);
  border-color: rgba(206, 170, 190, 0.96);
  box-shadow: 0 10px 20px rgba(214, 185, 201, 0.18);
}

.thumbnail-chip.is-cover::after {
  content: '封面';
  position: absolute;
  top: 6px;
  left: 6px;
  min-height: 18px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(247, 236, 242, 0.98);
  color: var(--memory-page-accent-strong);
  font-size: 10px;
}

.entry-empty {
  min-height: 120px;
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 18px;
  border-radius: 18px;
  border: 1px dashed var(--memory-page-border-strong);
  color: var(--memory-page-text-muted);
  text-align: center;
}

.entry-empty--compact {
  min-height: 88px;
}

.entry-empty--upload {
  min-height: 160px;
}

.entry-board {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding-bottom: 8px;
}

.memory-entry-card {
  display: grid;
  gap: 12px;
  padding: 13px;
  border-radius: 18px;
  border: 1px solid var(--memory-page-border);
  background: rgba(255, 250, 253, 0.94);
  transition: background-color 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.memory-entry-card:hover,
.memory-entry-card.is-active {
  border-color: rgba(208, 173, 192, 0.96);
  background: rgba(252, 246, 250, 0.98);
  box-shadow: 0 10px 22px rgba(217, 190, 203, 0.12);
}

.memory-entry-card.is-cover {
  background:
    linear-gradient(180deg, rgba(255, 250, 253, 0.98), rgba(250, 243, 248, 0.94)),
    radial-gradient(circle at top right, rgba(225, 191, 210, 0.18), transparent 40%);
}

.memory-entry-card__preview {
  position: relative;
  height: 144px;
  padding: 0;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--memory-page-border);
  background: rgba(248, 242, 247, 0.92);
  cursor: pointer;
}

.memory-entry-card__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.memory-entry-card__cover-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  min-height: 22px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(205, 111, 148, 0.96);
  color: #fff;
  font-size: 11px;
  box-shadow: 0 8px 16px rgba(200, 117, 151, 0.24);
}

.memory-entry-card__fields {
  display: grid;
  gap: 10px;
}

.memory-entry-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  color: var(--memory-page-text-soft);
  font-size: 12px;
}

.entry-inline-action {
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--memory-page-border-strong);
  background: var(--memory-page-surface-muted);
  color: var(--memory-page-accent-strong);
  font-size: 12px;
  cursor: pointer;
}

.memory-entry-card__inline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(88px, 104px);
  gap: 10px;
}

.memory-entry-card__field {
  display: grid;
  gap: 6px;
}

.memory-entry-card__field span {
  color: var(--memory-page-text-soft);
  font-size: 12px;
}

.memory-entry-card__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2px;
  border-top: 1px dashed var(--memory-page-divider);
}

.memory-entry-card__actions :deep(.el-button) {
  min-height: 28px;
  padding: 0 6px;
  border-radius: 999px;
}

.memory-entry-card__actions :deep(.el-button + .el-button) {
  margin-left: 8px;
}

.entry-upload-tile {
  min-height: 100%;
  cursor: pointer;
}

.entry-upload-tile__inner {
  min-height: 100%;
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-radius: 18px;
  border: 1px dashed var(--memory-page-border-strong);
  background:
    linear-gradient(180deg, rgba(255, 250, 253, 0.98), rgba(250, 243, 248, 0.94)),
    radial-gradient(circle at bottom right, rgba(220, 185, 204, 0.2), transparent 40%);
  text-align: center;
}

.entry-upload-tile__inner strong {
  color: var(--memory-page-accent-strong);
  font-size: 15px;
}

.entry-upload-tile__inner span {
  color: var(--memory-page-text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.entry-upload-tile__plus {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(244, 229, 238, 0.98);
  color: var(--memory-page-accent);
  font-size: 28px;
  line-height: 1;
}

.travel-memory-create__footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 290;
  padding:
    12px calc(24px + env(safe-area-inset-right, 0))
    calc(12px + env(safe-area-inset-bottom, 0))
    calc(24px + env(safe-area-inset-left, 0));
  background: rgba(255, 250, 253, 0.94);
  border-top: 1px solid var(--memory-page-border);
  box-shadow: 0 -8px 30px rgba(219, 192, 206, 0.1);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.travel-memory-create__footer-inner {
  width: min(1180px, calc(100vw - 56px));
  margin: 0 auto;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

:deep(.footer-button) {
  min-width: 138px;
  min-height: 44px;
  padding: 0 20px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease,
    border-color 0.22s ease,
    color 0.22s ease;
}

:deep(.footer-button:hover),
:deep(.footer-button:focus-visible) {
  transform: translateY(-1px);
}

:deep(.footer-button > span) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.footer-button--neutral) {
  border-color: rgba(227, 211, 223, 0.98) !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 244, 249, 0.94)) !important;
  color: #7f6473 !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.98),
    0 10px 22px rgba(215, 188, 201, 0.14) !important;
}

:deep(.footer-button--neutral:hover),
:deep(.footer-button--neutral:focus-visible) {
  border-color: rgba(209, 181, 196, 0.98) !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(248, 239, 246, 0.98)) !important;
  color: #6f5262 !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 1),
    0 14px 26px rgba(214, 185, 199, 0.18) !important;
}

:deep(.footer-button--save) {
  color: #fff !important;
  border-color: rgba(205, 107, 149, 0.98) !important;
  background:
    linear-gradient(135deg, rgba(208, 100, 147, 0.98), rgba(231, 145, 182, 0.98)) !important;
  box-shadow:
    0 14px 28px rgba(207, 118, 160, 0.28),
    inset 0 1px 0 rgba(255, 238, 246, 0.34) !important;
}

:deep(.footer-button--save:hover),
:deep(.footer-button--save:focus-visible) {
  border-color: rgba(196, 92, 138, 1) !important;
  background:
    linear-gradient(135deg, rgba(201, 89, 139, 1), rgba(225, 129, 170, 1)) !important;
  box-shadow:
    0 18px 32px rgba(205, 111, 155, 0.32),
    inset 0 1px 0 rgba(255, 239, 246, 0.38) !important;
}

:deep(.footer-button--save:active),
:deep(.footer-button--neutral:active) {
  transform: translateY(0);
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-form-item__label) {
  padding-bottom: 7px;
  color: var(--memory-page-text);
  font-size: 12px;
  font-weight: 600;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-input-number),
:deep(.el-date-editor.el-input__wrapper),
:deep(.el-date-editor .el-input__wrapper) {
  width: 100%;
  border-radius: 14px;
}

:deep(.el-input__wrapper),
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase),
:deep(.el-textarea__inner) {
  background: rgba(255, 251, 253, 0.98);
  box-shadow: 0 0 0 1px var(--memory-page-border) inset;
}

:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus),
:deep(.el-input-number.is-controls-right .el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px rgba(199, 110, 144, 0.98) inset,
    0 0 0 4px rgba(230, 198, 214, 0.52);
}

@media (max-width: 960px) {
  .travel-memory-create-page {
    width: min(100vw - 28px, 100%);
    margin-top: 14px;
  }

  .travel-memory-create__hero,
  .travel-memory-create__toolbar,
  .section-head--split,
  .section-head__main,
  .travel-memory-create__footer-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .travel-memory-create__meta,
  .travel-memory-create__footer-inner {
    width: 100%;
  }

  .travel-memory-create__footer-inner {
    justify-content: stretch;
  }

  .coordinate-layout,
  .entry-board {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .travel-memory-create-page {
    width: min(100vw - 18px, 100%);
  }

  .travel-memory-create__footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .travel-memory-create__footer-inner {
    width: min(100vw - 18px, 100%);
  }

  .travel-memory-create-sheet {
    padding: 18px;
    border-radius: 24px;
  }

  .form-grid,
  .memory-entry-card__inline {
    grid-template-columns: 1fr;
  }

  .cover-preview-card {
    height: 180px;
  }

  .editor-map-card :deep(.travel-map-shell.is-picker-mode),
  .editor-map-card :deep(.travel-map-canvas) {
    min-height: 220px;
  }

  :deep(.footer-button) {
    width: 100%;
  }
}
</style>
