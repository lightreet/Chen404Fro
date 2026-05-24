<template>
  <div class="travel-memory-create-page">
      <section v-loading="loading" class="travel-memory-editor">
        <div class="travel-memory-create__topbar">
          <div class="travel-memory-create__topbar-inner">
            <el-button text class="travel-memory-create__back" @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <div class="travel-memory-create__meta">
              <span>{{ pageTitle }}</span>
              <span>{{ form.entries.length }} 张照片</span>
            </div>
          </div>
        </div>

        <aside class="travel-memory-map-panel">
          <div class="map-panel__head">
            <div class="panel-title">
              <span class="panel-title__dot panel-title__dot--pin">
                <el-icon><Location /></el-icon>
              </span>
              <strong>选择地点</strong>
            </div>
            <span class="panel-title__hint">在地图上选择你去过的地点</span>
          </div>

          <div class="map-search">
            <el-input
              v-model="locationSearchKeyword"
              placeholder="搜索城市、景点或国家"
              clearable
              @keyup.enter="handleLocationSearch"
            >
              <template #suffix>
                <button type="button" class="map-search__button" title="搜索地点" @click="handleLocationSearch">
                  <el-icon><Search /></el-icon>
                </button>
              </template>
            </el-input>
          </div>

          <div class="map-panel__canvas">
            <TravelMemoryMap
              :locations="list"
              picker-mode
              :picker-latitude="form.latitude ?? null"
              :picker-longitude="form.longitude ?? null"
              :search-keyword="locationSearchKeyword"
              :search-request="locationSearchRequest"
              @pick="handlePickCoordinate"
              @select="handleExistingLocationSelect"
              @search-error="handleLocationSearchError"
            />
          </div>

          <div class="map-panel__tools" aria-label="地图操作">
            <button type="button" title="放大地图">
              <el-icon><Plus /></el-icon>
            </button>
            <button type="button" title="缩小地图">
              <span>−</span>
            </button>
            <button type="button" title="重新选择" @click="focusCoordinateHint">
              <el-icon><Location /></el-icon>
            </button>
          </div>

          <button type="button" class="map-panel__locate" @click="focusCoordinateHint">
            <el-icon><Location /></el-icon>
            <span>自动定位</span>
          </button>

          <div v-if="hasPickedLocation" class="map-picked-card">
            <span class="map-picked-card__pin">
              <el-icon><Location /></el-icon>
            </span>
            <div>
              <strong>当前选择：{{ currentLocationTitle }}</strong>
              <span>{{ currentLocationSubTitle }}</span>
            </div>
            <button type="button" @click="clearCoordinateSelection">清除选择</button>
          </div>
        </aside>

        <main class="travel-memory-form-panel">
          <div class="travel-memory-form-top">
            <section class="editor-card editor-card--main-info">
              <div class="section-title">
                <span></span>
                <strong>旅行主信息</strong>
              </div>

              <el-form label-position="top" class="editor-form">
                <el-form-item label="旅行标题">
                  <el-input
                    v-model="form.title"
                    maxlength="50"
                    placeholder="给这段旅程起个标题吧（如：厦门的海风与日落）"
                  >
                    <template #suffix>{{ titleLength }}/50</template>
                  </el-input>
                </el-form-item>

                <el-form-item label="旅行时间">
                  <div class="date-range-row">
                    <el-date-picker
                      v-model="form.visitedAt"
                      type="date"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      placeholder="开始日期"
                      class="w-full"
                    />
                    <span class="date-range-row__divider">-</span>
                    <el-date-picker
                      v-model="form.visitedEndAt"
                      type="date"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      placeholder="结束日期"
                      class="w-full"
                    />
                  </div>
                </el-form-item>

                <el-form-item label="总体感想">
                  <el-input
                    v-model="form.summaryNote"
                    type="textarea"
                    :rows="4"
                    maxlength="500"
                    placeholder="记录这段旅程的整体感受吧..."
                  />
                  <span class="field-counter">{{ summaryLength }}/500</span>
                </el-form-item>

                <div class="form-meta-row">
                  <el-form-item label="省份">
                    <el-input v-model="form.province" placeholder="例如：福建省" />
                  </el-form-item>
                  <el-form-item label="城市">
                    <el-input v-model="form.city" placeholder="例如：厦门市" />
                  </el-form-item>
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
                </div>
              </el-form>
            </section>

            <section class="editor-card editor-card--cover-panel">
              <div class="section-title">
                <span></span>
                <strong>封面图片</strong>
              </div>

              <el-upload
                class="cover-upload"
                drag
                :show-file-list="false"
                :before-upload="beforeImageUpload"
                :http-request="handleUploadCoverImage"
                accept="image/*"
              >
                <div v-if="coverEntry?.imageUrl" class="cover-upload__filled">
                  <div class="cover-upload__preview-frame">
                    <img class="cover-upload__image" :src="coverEntry.imageUrl" :alt="coverEntry.remark || form.title || '旅行封面'" />
                  </div>
                  <div class="cover-upload__actions">
                    <button type="button" class="cover-action cover-action--ghost" @click.stop.prevent="removeCoverEntry">
                      移除封面
                    </button>
                    <button type="button" class="cover-action cover-action--primary">
                      更换封面
                    </button>
                  </div>
                </div>
                <div v-else class="cover-upload__empty">
                  <div class="cover-upload__placeholder">
                    <el-icon><Plus /></el-icon>
                    <strong>上传封面</strong>
                  </div>
                </div>
              </el-upload>
            </section>
          </div>

          <section class="editor-card editor-card--advanced">
            <button type="button" class="advanced-toggle" @click="advancedOpen = !advancedOpen">
              <span>高级参数</span>
              <el-icon class="toggle-icon" :class="{ open: advancedOpen }"><ArrowDown /></el-icon>
            </button>
            <Transition name="slide-down">
              <div v-show="advancedOpen" class="advanced-content">
                <div class="advanced-field advanced-field--inline">
                  <div>
                    <label class="advanced-field-label">地图展示</label>
                    <span class="advanced-field-hint">
                      {{ form.status === 1 ? '保存后会在旅行地图中展示' : '保存后暂不公开展示在旅行地图中' }}
                    </span>
                  </div>
                  <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
                </div>
              </div>
            </Transition>
          </section>

          <section class="editor-card">
            <div class="section-title section-title--inline">
              <div>
                <span></span>
                <strong>旅行照片</strong>
              </div>
            </div>

            <div class="entry-board">
              <article
                v-for="(entry, index) in form.entries"
                :key="entry.id || entry.imageUrl || index"
                class="memory-entry-card"
                :class="{
                  'is-cover': entry.cover,
                  'is-active': selectedEntryIndex === index,
                  'is-drag-over': dragOverEntryIndex === index,
                  'is-dragging': draggedEntryIndex === index,
                }"
                @dragover.prevent="handleEntryDragOver($event, index)"
                @drop.prevent="handleEntryDrop($event, index)"
              >
                <div
                  class="memory-entry-card__media"
                  draggable="true"
                  @click="selectedEntryIndex = index"
                  @dragstart="handleEntryDragStart($event, index)"
                  @dragend="handleEntryDragEnd"
                >
                  <img :src="entry.imageUrl" :alt="entry.remark || form.title || `旅行照片 ${index + 1}`" />
                  <button
                    v-if="!entry.cover"
                    type="button"
                    class="memory-entry-card__cover-action"
                    @click.stop="setCover(index)"
                  >
                    设封面
                  </button>
                  <span v-else class="memory-entry-card__cover-badge">封面</span>
                  <button type="button" class="memory-entry-card__remove" title="删除照片" @click.stop="removeEntry(index)">
                    <el-icon><Close /></el-icon>
                  </button>
                </div>

                <div class="memory-entry-card__body">
                  <el-input
                    v-model="entry.thanksNote"
                    type="textarea"
                    :rows="3"
                    maxlength="100"
                    placeholder="为这张照片写一点描述..."
                  />
                  <label>
                    <el-date-picker
                      v-model="entry.shotAt"
                      type="date"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      placeholder="选择日期"
                      class="w-full"
                    />
                  </label>
                </div>
              </article>

              <el-upload
                class="entry-add-card"
                :show-file-list="false"
                :before-upload="beforeImageUpload"
                :http-request="handleUploadEntryImage"
                accept="image/*"
                multiple
              >
                <button type="button" class="entry-add-card__button">
                  <el-icon><Plus /></el-icon>
                  <span>添加照片</span>
                </button>
              </el-upload>
            </div>
          </section>
        </main>

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
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { UploadRequestOptions } from 'element-plus'
import { ElMessage } from 'element-plus'
import { ArrowDown, ArrowLeft, Close, Location, Plus, Search } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
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
const locationSearchKeyword = ref('')
const locationSearchRequest = ref(0)
const advancedOpen = ref(false)
let locationResolveRequestId = 0
const selectedEntryIndex = ref(0)
const draggedEntryIndex = ref<number | null>(null)
const dragOverEntryIndex = ref<number | null>(null)
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
const titleLength = computed(() => form.title?.length || 0)
const summaryLength = computed(() => form.summaryNote?.length || 0)
const coverEntry = computed(() => form.entries.find((entry) => entry.cover) || form.entries[0] || null)
const hasPickedLocation = computed(() => form.latitude != null && form.longitude != null)
const currentLocationTitle = computed(() => form.city || form.province || form.title || '未命名地点')
const currentLocationSubTitle = computed(() => {
  const regionText = [form.province, form.city].filter(Boolean).join(' · ')
  if (regionText) return regionText
  if (form.latitude != null && form.longitude != null) {
    return `${Number(form.latitude).toFixed(4)}，${Number(form.longitude).toFixed(4)}`
  }
  return '点击地图选择坐标'
})
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
  visitedEndAt: '',
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
    visitedEndAt: detail.visitedEndAt || '',
    status: detail.status ?? 1,
    sortOrder: detail.sortOrder ?? 0,
    entries: (detail.entries || [])
      .slice()
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((entry, index) => ({
        id: entry.id,
        imageUrl: entry.imageUrl,
        remark: entry.remark || '',
        thanksNote: entry.thanksNote || '',
        shotAt: entry.shotAt || '',
        displayOrder: index,
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
    await appendUploadedEntry(result, { cover: form.entries.length === 0 })
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

async function handleUploadCoverImage(options: UploadRequestOptions) {
  uploading.value = true
  try {
    const result = await uploadTravelMemoryImage(options.file as File)
    await appendUploadedEntry(result, { cover: true })
    if ((form.latitude == null || form.longitude == null) && result.latitude != null && result.longitude != null) {
      await applyCoordinateSelection(result.latitude, result.longitude, { silent: true })
    }
    options.onSuccess?.(result as never)
    ElMessage.success('封面图片上传成功')
  } catch (error) {
    options.onError?.(error as never)
    ElMessage.error('封面上传失败')
  } finally {
    uploading.value = false
  }
}

async function appendUploadedEntry(
  result: { url: string; shotAt?: string; latitude?: number; longitude?: number },
  options: { cover?: boolean } = {},
) {
  if (options.cover) {
    form.entries.forEach((entry) => {
      entry.cover = false
    })
  }

  const nextEntry: TravelMemoryEntryUpsertCommand = {
    imageUrl: result.url,
    remark: '',
    thanksNote: '',
    shotAt: result.shotAt,
    displayOrder: form.entries.length,
    cover: options.cover || form.entries.length === 0,
    sourceLatitude: result.latitude,
    sourceLongitude: result.longitude,
    geoSource: result.latitude != null && result.longitude != null ? 'EXIF' : 'NONE',
  }
  form.entries.push(nextEntry)
  normalizeEntryOrder()
  selectedEntryIndex.value = form.entries.length - 1
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

async function handleExistingLocationSelect(id: number) {
  const target = list.value.find((item) => item.id === id)
  if (!target || target.latitude == null || target.longitude == null) return
  await applyCoordinateSelection(Number(target.latitude), Number(target.longitude))
  form.province = target.province || form.province
  form.city = target.city || form.city
  if (!form.title.trim()) {
    form.title = target.title || ''
  }
}

function handleLocationSearch() {
  const keyword = locationSearchKeyword.value.trim()
  if (!keyword) {
    focusCoordinateHint()
    return
  }

  locationSearchRequest.value += 1
}

function handleLocationSearchError(message: string) {
  ElMessage.warning(message)
}

function focusCoordinateHint() {
  ElMessage.info('先在地图上点一下位置，我们会尝试自动补全省份和城市。')
}

function clearCoordinateSelection() {
  form.latitude = undefined
  form.longitude = undefined
  form.province = ''
  form.city = ''
  lastResolvedAddress.value = ''
  locationMetaNeedsManualConfirm.value = false
}

function setCover(index: number) {
  form.entries.forEach((entry, currentIndex) => {
    entry.cover = currentIndex === index
  })
}

function removeCoverEntry() {
  const coverIndex = form.entries.findIndex((entry) => entry.cover)
  if (coverIndex < 0) return
  removeEntry(coverIndex)
}

function normalizeEntryOrder() {
  form.entries.forEach((entry, index) => {
    entry.displayOrder = index
  })
}

function handleEntryDragStart(event: DragEvent, index: number) {
  draggedEntryIndex.value = index
  dragOverEntryIndex.value = index
  selectedEntryIndex.value = index
  event.dataTransfer?.setData('text/plain', String(index))
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function handleEntryDragOver(event: DragEvent, index: number) {
  if (draggedEntryIndex.value == null || draggedEntryIndex.value === index) return
  dragOverEntryIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function handleEntryDrop(event: DragEvent, index: number) {
  const rawIndex = draggedEntryIndex.value ?? Number(event.dataTransfer?.getData('text/plain'))
  if (!Number.isInteger(rawIndex) || rawIndex < 0 || rawIndex >= form.entries.length || rawIndex === index) {
    handleEntryDragEnd()
    return
  }

  const [movedEntry] = form.entries.splice(rawIndex, 1)
  form.entries.splice(index, 0, movedEntry)
  selectedEntryIndex.value = index
  normalizeEntryOrder()
  handleEntryDragEnd()
}

function handleEntryDragEnd() {
  draggedEntryIndex.value = null
  dragOverEntryIndex.value = null
}

function removeEntry(index: number) {
  form.entries.splice(index, 1)
  if (form.entries.length > 0 && !form.entries.some((entry) => entry.cover)) {
    form.entries[0].cover = true
  }
  if (selectedEntryIndex.value >= form.entries.length) {
    selectedEntryIndex.value = Math.max(0, form.entries.length - 1)
  }
  normalizeEntryOrder()
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
        displayOrder: index,
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

.entry-empty--upload {
  min-height: 160px;
}

.entry-board {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  padding-bottom: 8px;
  justify-items: center;
}

.memory-entry-card {
  display: grid;
  width: min(100%, 940px);
  grid-template-columns: minmax(170px, 220px) minmax(0, 1fr);
  align-items: start;
  gap: 18px;
  padding: 14px;
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
  width: 100%;
  aspect-ratio: 4 / 3;
  padding: 0;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--memory-page-border);
  background:
    linear-gradient(135deg, rgba(255, 250, 253, 0.96), rgba(248, 242, 247, 0.92)),
    radial-gradient(circle at center, rgba(222, 187, 206, 0.18), transparent 58%);
  cursor: pointer;
}

.memory-entry-card__preview img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
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
  gap: 9px;
  min-width: 0;
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
  .memory-entry-card,
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

  .editor-map-card :deep(.travel-map-shell.is-picker-mode),
  .editor-map-card :deep(.travel-map-canvas) {
    min-height: 220px;
  }

  :deep(.footer-button) {
    width: 100%;
  }
}
</style>

<style scoped lang="scss">
.travel-memory-create-page {
  width: min(1540px, calc(100vw - 72px));
  min-height: 100vh;
  margin: 0 auto;
  padding: 78px 0 calc(96px + env(safe-area-inset-bottom, 0));
  color: #43343c;
}

.travel-memory-editor {
  position: relative;
  display: grid;
  grid-template-columns: minmax(430px, 0.9fr) minmax(650px, 1.55fr);
  gap: 14px;
  align-items: stretch;
  min-height: calc(100vh - 146px);
  padding: 0;
}

.travel-memory-editor::before,
.travel-memory-editor::after {
  content: "";
  position: fixed;
  z-index: 0;
  width: 26px;
  height: 18px;
  border-radius: 80% 20% 70% 30%;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255, 126, 174, 0.24), rgba(255, 204, 220, 0.04));
}

.travel-memory-editor::before {
  right: 34px;
  top: 11vh;
  transform: rotate(-24deg);
}

.travel-memory-editor::after {
  right: 20px;
  bottom: 13vh;
  transform: rotate(31deg);
}

.travel-memory-map-panel,
.travel-memory-form-panel,
.travel-memory-create__topbar,
.travel-memory-create__footer {
  position: relative;
  z-index: 1;
}

.travel-memory-map-panel,
.editor-card {
  border: 1px solid rgba(238, 225, 234, 0.92);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 250, 253, 0.76)),
    radial-gradient(circle at 88% 8%, rgba(255, 206, 224, 0.22), transparent 28%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 18px 40px rgba(211, 184, 199, 0.12);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.travel-memory-map-panel {
  position: sticky;
  top: 12px;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto auto 1fr;
  min-height: calc(100vh - 146px);
  padding: 22px;
  border-radius: 16px;
}

.map-panel__head,
.panel-title,
.travel-memory-create__topbar-inner,
.travel-memory-create__meta,
.section-title,
.section-title--inline,
.section-title--inline > div,
.display-toggle,
.map-panel__locate,
.map-picked-card {
  display: flex;
  align-items: center;
}

.map-panel__head {
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.panel-title {
  gap: 10px;
}

.panel-title strong,
.section-title strong {
  color: #2f2730;
  font-size: 17px;
  font-weight: 800;
}

.panel-title__dot {
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #ff4f91, #ff8cb4);
  box-shadow: 0 8px 18px rgba(255, 99, 151, 0.26);
}

.panel-title__dot .el-icon {
  font-size: 15px;
}

.panel-title__hint {
  color: #8f8792;
  font-size: 13px;
}

.map-search {
  width: min(260px, 100%);
  margin-bottom: 16px;
}

.map-search :deep(.el-input__wrapper) {
  min-height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 0 0 1px rgba(235, 222, 232, 0.96) inset,
    0 10px 24px rgba(221, 199, 211, 0.12);
}

.map-search__button {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  color: #8c8390;
  background: transparent;
  cursor: pointer;
}

.map-panel__canvas {
  position: relative;
  min-height: 500px;
  overflow: hidden;
  border-radius: 18px;
}

.map-panel__canvas :deep(.travel-map-shell.is-picker-mode),
.map-panel__canvas :deep(.travel-map-canvas) {
  min-height: 100%;
  height: 100%;
  border-radius: 18px;
}

.map-panel__canvas :deep(.travel-map-state) {
  border-radius: 18px;
}

.map-panel__tools {
  position: absolute;
  left: 24px;
  bottom: 152px;
  z-index: 4;
  display: grid;
  gap: 9px;
}

.map-panel__tools button,
.map-panel__locate {
  border: 1px solid rgba(235, 224, 232, 0.94);
  background: rgba(255, 255, 255, 0.92);
  color: #615866;
  box-shadow: 0 12px 28px rgba(203, 182, 195, 0.14);
  cursor: pointer;
}

.map-panel__tools button {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  font-size: 22px;
}

.map-panel__locate {
  position: absolute;
  left: 24px;
  bottom: 28px;
  z-index: 4;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
}

.map-picked-card {
  position: absolute;
  right: 22px;
  bottom: 28px;
  z-index: 4;
  gap: 13px;
  width: min(230px, calc(100% - 52px));
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid rgba(238, 228, 235, 0.96);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 34px rgba(207, 184, 198, 0.2);
}

.map-picked-card__pin {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border-radius: 999px;
  color: #ff5592;
  background: rgba(255, 235, 243, 0.96);
}

.map-picked-card div {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.map-picked-card strong {
  color: #4c3d47;
  font-size: 13px;
  line-height: 1.35;
}

.map-picked-card span {
  color: #8d8290;
  font-size: 12px;
}

.map-picked-card button {
  margin-left: auto;
  padding: 0;
  border: 0;
  color: #ff4f91;
  background: transparent;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
}

.travel-memory-form-panel {
  display: grid;
  align-content: start;
  gap: 10px;
  min-width: 0;
}

.travel-memory-create__topbar {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 285;
  padding:
    calc(9px + env(safe-area-inset-top, 0))
    calc(24px + env(safe-area-inset-right, 0))
    9px
    calc(24px + env(safe-area-inset-left, 0));
  border-bottom: 1px solid rgba(238, 226, 235, 0.78);
  background: rgba(255, 250, 253, 0.78);
  box-shadow: 0 10px 30px rgba(219, 192, 206, 0.08);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.travel-memory-create__topbar-inner {
  width: min(1540px, calc(100vw - 72px));
  min-height: 38px;
  margin: 0 auto;
  justify-content: space-between;
}

.travel-memory-create__back {
  color: #8f8290;
  font-weight: 700;
}

.travel-memory-create__meta {
  gap: 8px;
}

.travel-memory-create__meta span {
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(238, 226, 235, 0.88);
  color: #8f8290;
  font-size: 12px;
}

.travel-memory-form-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(286px, 320px);
  gap: 10px;
  align-items: stretch;
}

.editor-card {
  display: grid;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 16px;
}

.editor-card--main-info,
.editor-card--cover-panel {
  align-content: start;
}

.editor-card--advanced {
  gap: 0;
  padding-top: 16px;
  padding-bottom: 16px;
}

.advanced-toggle {
  width: 100%;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  border: 0;
  background: transparent;
  color: #4f414b;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.advanced-toggle .toggle-icon {
  color: #9a8f9b;
  transition: transform 0.2s ease;
}

.advanced-toggle .toggle-icon.open {
  transform: rotate(180deg);
}

.advanced-content {
  display: grid;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(238, 226, 235, 0.92);
}

.advanced-field {
  display: grid;
  gap: 8px;
}

.advanced-field--inline {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

.advanced-field-label {
  display: block;
  color: #4f414b;
  font-size: 13px;
  font-weight: 800;
}

.advanced-field-hint {
  display: block;
  margin-top: 4px;
  color: #918695;
  font-size: 12px;
  line-height: 1.45;
}

.section-title {
  gap: 10px;
}

.section-title > span,
.section-title--inline > div > span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff4f91, #ff9dbc);
  box-shadow: 0 0 0 5px rgba(255, 108, 161, 0.1);
}

.section-title--inline {
  justify-content: flex-start;
  gap: 14px;
}

.section-title--inline > div {
  gap: 10px;
}

.section-title--inline small {
  color: #8f8792;
  font-size: 13px;
}

.editor-form {
  display: grid;
  gap: 10px;
}

.date-range-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.date-range-row__divider {
  color: #9a8f9b;
  font-size: 18px;
}

.field-counter {
  position: absolute;
  right: 12px;
  bottom: 8px;
  color: #9a909d;
  font-size: 12px;
}

.form-meta-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
}

.form-meta-row .coordinate-status {
  grid-column: 1 / -1;
}

.form-meta-row .display-toggle {
  justify-self: start;
}

.coordinate-status {
  display: grid;
  gap: 4px;
  min-height: 56px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(235, 224, 232, 0.94);
  background: rgba(255, 251, 253, 0.9);
}

.coordinate-status strong {
  color: #4f414b;
  font-size: 12px;
}

.coordinate-status span {
  overflow: hidden;
  color: #918695;
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coordinate-status.is-loading {
  border-color: rgba(255, 172, 203, 0.96);
}

.coordinate-status.is-warning {
  background: rgba(255, 247, 251, 0.98);
  border-color: rgba(255, 187, 211, 0.98);
}

.display-toggle {
  gap: 8px;
  min-height: 56px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(235, 224, 232, 0.94);
  background: rgba(255, 251, 253, 0.9);
  color: #837783;
  font-size: 12px;
  white-space: nowrap;
}

.cover-upload,
.cover-upload :deep(.el-upload),
.cover-upload :deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
}

.cover-upload :deep(.el-upload-dragger) {
  overflow: hidden;
  min-height: 250px;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
}

.cover-upload__empty,
.cover-upload__filled {
  display: grid;
  gap: 12px;
  min-height: 250px;
}

.cover-upload__empty {
  grid-template-rows: minmax(180px, 1fr);
}

.cover-upload__filled {
  align-content: start;
  grid-template-rows: auto auto;
}

.cover-upload__placeholder {
  overflow: hidden;
  position: relative;
  min-height: 180px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  border-radius: 14px;
  border: 1.5px dashed rgba(255, 143, 184, 0.72);
  background: rgba(255, 250, 253, 0.74);
  color: #ff5e99;
}

.cover-upload__placeholder .el-icon {
  position: relative;
  z-index: 1;
  color: #ff5e99;
  font-size: 32px;
}

.cover-upload__placeholder strong {
  position: relative;
  z-index: 1;
  color: #4d404a;
  font-size: 14px;
}

.cover-upload__preview-frame {
  overflow: hidden;
  width: 100%;
  height: 180px;
  border-radius: 14px;
  border: 1.5px dashed rgba(255, 143, 184, 0.72);
  background: rgba(255, 250, 253, 0.74);
}

.cover-upload__image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.cover-upload__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.cover-action {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 999px;
  border: 1px solid rgba(238, 226, 235, 0.96);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.cover-action--ghost {
  color: #6f6570;
  background: rgba(255, 255, 255, 0.82);
}

.cover-action--primary {
  color: #fff;
  border-color: rgba(255, 91, 144, 0.96);
  background: linear-gradient(135deg, #ff4f91, #ff8bb4);
  box-shadow: 0 12px 24px rgba(255, 91, 144, 0.22);
}

.entry-board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(218px, 218px));
  gap: 16px;
  align-items: start;
  justify-items: start;
  padding: 0;
}

.memory-entry-card,
.entry-add-card__button {
  min-height: 300px;
  border-radius: 16px;
  border: 1px solid rgba(238, 226, 235, 0.96);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 248, 252, 0.84)),
    radial-gradient(circle at 50% 6%, rgba(255, 184, 210, 0.14), transparent 36%);
  box-shadow: 0 14px 26px rgba(213, 190, 203, 0.1);
}

.memory-entry-card {
  overflow: hidden;
  display: grid;
  width: 218px;
  grid-template-columns: 1fr;
  grid-template-rows: 134px 1fr;
  padding: 10px;
}

.memory-entry-card.is-active,
.memory-entry-card:hover {
  border-color: rgba(255, 151, 189, 0.82);
}

.memory-entry-card.is-drag-over {
  border-color: rgba(255, 91, 144, 0.92);
  box-shadow:
    0 0 0 3px rgba(255, 166, 200, 0.18),
    0 18px 30px rgba(213, 190, 203, 0.14);
}

.memory-entry-card.is-dragging {
  opacity: 0.68;
}

.memory-entry-card__media {
  position: relative;
  overflow: hidden;
  height: 124px;
  border: 1.5px dashed rgba(255, 142, 184, 0.76);
  border-radius: 14px;
  background: rgba(255, 250, 253, 0.74);
  cursor: grab;
}

.memory-entry-card__media:active {
  cursor: grabbing;
}

.memory-entry-card__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: 12px;
}

.memory-entry-card__cover-badge,
.memory-entry-card__cover-action,
.memory-entry-card__remove {
  position: absolute;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 91, 144, 0.92);
}

.memory-entry-card__cover-badge,
.memory-entry-card__cover-action {
  top: 8px;
  left: 8px;
  min-height: 22px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
}

.memory-entry-card__cover-action {
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.memory-entry-card:hover .memory-entry-card__cover-action {
  opacity: 1;
}

.memory-entry-card__remove {
  top: 7px;
  right: 7px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: #ff6f9f;
  background: rgba(255, 255, 255, 0.92);
  cursor: pointer;
}

.memory-entry-card__body {
  display: grid;
  gap: 7px;
  align-content: start;
  padding-top: 8px;
}

.memory-entry-card__body :deep(.el-textarea__inner) {
  min-height: 64px !important;
  padding: 9px 10px;
  line-height: 1.5;
  resize: vertical;
}

.memory-entry-card__body :deep(.el-input__wrapper) {
  min-height: 34px;
}

.memory-entry-card__body label {
  display: grid;
  gap: 0;
}

.entry-add-card :deep(.el-upload) {
  width: 218px;
  height: 300px;
}

.entry-add-card__button {
  width: 100%;
  height: 300px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  border-style: dashed;
  border-color: rgba(255, 154, 191, 0.72);
  color: #5f5962;
  cursor: pointer;
}

.entry-add-card__button .el-icon {
  color: #5f5962;
  font-size: 28px;
}

.entry-add-card__button span {
  font-size: 13px;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-form-item__label) {
  padding-bottom: 6px;
  color: #3d333b;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-date-editor.el-input__wrapper),
:deep(.el-date-editor .el-input__wrapper),
:deep(.el-input-number) {
  width: 100%;
  border-radius: 9px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 0 0 1px rgba(224, 218, 226, 0.98) inset;
}

:deep(.el-input__wrapper) {
  min-height: 38px;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  box-shadow:
    0 0 0 1px rgba(255, 91, 144, 0.92) inset,
    0 0 0 4px rgba(255, 191, 214, 0.22);
}

:deep(.el-input__suffix) {
  color: #9a909d;
  font-size: 12px;
}

.travel-memory-create__footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 290;
  padding:
    11px calc(24px + env(safe-area-inset-right, 0))
    calc(11px + env(safe-area-inset-bottom, 0))
    calc(24px + env(safe-area-inset-left, 0));
  border-top: 1px solid rgba(238, 226, 235, 0.9);
  background: rgba(255, 250, 253, 0.88);
  box-shadow: 0 -8px 30px rgba(219, 192, 206, 0.1);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.travel-memory-create__footer-inner {
  width: min(1540px, calc(100vw - 72px));
  margin: 0 auto;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

:deep(.footer-button) {
  min-width: 126px;
  min-height: 42px;
  border-radius: 999px;
  font-weight: 800;
}

:deep(.footer-button--neutral) {
  border-color: rgba(227, 216, 225, 0.98) !important;
  background: rgba(255, 255, 255, 0.92) !important;
  color: #766a76 !important;
}

:deep(.footer-button--save) {
  border-color: rgba(255, 91, 144, 0.96) !important;
  background: linear-gradient(135deg, #ff4f91, #ff8bb4) !important;
  color: #fff !important;
  box-shadow: 0 12px 24px rgba(255, 91, 144, 0.26) !important;
}

@media (max-width: 1180px) {
  .travel-memory-editor {
    grid-template-columns: 1fr;
  }

  .travel-memory-map-panel {
    position: relative;
    top: 0;
    min-height: 520px;
  }

  .map-panel__canvas {
    min-height: 420px;
  }

  .entry-board {
    grid-template-columns: repeat(3, minmax(150px, 1fr));
  }

  .travel-memory-form-top {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .travel-memory-create-page {
    width: min(100vw - 18px, 100%);
  }

  .travel-memory-map-panel,
  .editor-card {
    padding: 16px;
    border-radius: 14px;
  }

  .travel-memory-create__topbar {
    padding-left: 12px;
    padding-right: 12px;
  }

  .travel-memory-create__topbar-inner {
    width: min(100vw - 18px, 100%);
  }

  .travel-memory-create__topbar-inner,
  .map-panel__head,
  .form-meta-row {
    grid-template-columns: 1fr;
  }

  .travel-memory-create__topbar-inner {
    display: grid;
    gap: 8px;
  }

  .date-range-row {
    grid-template-columns: 1fr;
  }

  .date-range-row__divider {
    display: none;
  }

  .form-meta-row,
  .entry-board {
    grid-template-columns: 1fr;
  }

  .advanced-field--inline {
    grid-template-columns: 1fr;
  }

  .map-picked-card {
    left: 16px;
    right: 16px;
    width: auto;
  }

  .travel-memory-create__footer-inner {
    width: min(100vw - 18px, 100%);
  }

  :deep(.footer-button) {
    flex: 1;
    min-width: 0;
  }
}
</style>
