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
            <span>{{ stopCount }} 个片段</span>
            <span>{{ photoCount }} 张照片</span>
          </div>
        </div>
      </div>

      <aside class="travel-memory-map-panel">
        <div class="map-panel__head">
          <div class="panel-title">
            <span class="panel-title__dot">
              <el-icon><Location /></el-icon>
            </span>
            <strong>选择地点</strong>
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
        </div>

        <div v-if="activeStopTarget" class="map-panel__focus-banner">
          <div>
            <strong>片段定位中</strong>
            <span>地图点击会写入「{{ stopDisplayTitle(activeStopTarget, coordinateTargetStopIndex ?? 0) }}」的单独坐标</span>
          </div>
          <button type="button" @click="switchToLocationTarget">返回主地点</button>
        </div>

        <div class="map-panel__canvas">
          <TravelMemoryMap
            ref="pickerMapRef"
            :locations="list"
            picker-mode
            :picker-latitude="pickerLatitude"
            :picker-longitude="pickerLongitude"
            :search-keyword="locationSearchKeyword"
            :search-request="locationSearchRequest"
            @pick="handlePickCoordinate"
            @select="handleExistingLocationSelect"
            @search-error="handleLocationSearchError"
          />
        </div>

        <div class="map-panel__tools" aria-label="地图操作">
          <button type="button" title="放大地图" @click="zoomInPickerMap">
            <el-icon><Plus /></el-icon>
          </button>
          <button type="button" title="缩小地图" @click="zoomOutPickerMap">
            <span>-</span>
          </button>
          <button type="button" title="清除当前坐标" @click="clearCoordinateSelection">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <button type="button" class="map-panel__locate" @click="locateCurrentPosition">
          <el-icon><Location /></el-icon>
          <span>自动定位</span>
        </button>

        <div v-if="hasCurrentTargetCoordinate" class="map-picked-card">
          <span class="map-picked-card__pin">
            <el-icon><Location /></el-icon>
          </span>
          <div>
            <strong>{{ currentLocationTitle }}</strong>
            <span>{{ currentLocationSubTitle }}</span>
          </div>
          <button type="button" @click="clearCoordinateSelection">
            {{ isStopCoordinateTarget ? '清除片段坐标' : '清除选择' }}
          </button>
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
                  placeholder="给这趟旅行起个标题吧"
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

              <el-form-item label="旅行摘要">
                <el-input
                  v-model="form.summaryNote"
                  type="textarea"
                  :rows="4"
                  maxlength="500"
                  placeholder="这里写整趟旅行的整体感受，下面的片段再写具体景点或阶段。"
                />
                <span class="field-counter">{{ summaryLength }}/500</span>
              </el-form-item>

              <div class="form-meta-row">
                <el-form-item label="省份">
                  <el-input v-model="form.province" placeholder="例如：广东省" />
                </el-form-item>
                <el-form-item label="城市">
                  <el-input v-model="form.city" placeholder="例如：广州市" />
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
                  <img
                    class="cover-upload__image"
                    :src="coverEntry.imageUrl"
                    :alt="coverEntry.remark || form.title || '旅行封面'"
                  />
                </div>
                <div class="cover-upload__actions">
                  <button type="button" class="cover-action cover-action--ghost" @click.stop.prevent="removeCoverEntry">
                    移除封面
                  </button>
                  <button type="button" class="cover-action cover-action--primary">
                    上传新封面
                  </button>
                </div>
                <p class="cover-upload__hint">封面会保存成一张真实照片，也可以在下方片段照片里直接设为整趟封面。</p>
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
                    {{ form.status === 1 ? '保存后会展示在旅行地图中' : '保存后暂不展示在旅行地图中' }}
                  </span>
                </div>
                <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
              </div>
            </div>
          </Transition>
        </section>

        <section class="editor-card editor-card--stops">
          <div class="section-title section-title--inline">
            <div class="section-heading-stack">
              <div>
                <span></span>
                <strong>旅途片段 / 景点分组</strong>
              </div>
            </div>
            <div class="inline-actions">
              <div class="inline-stats">
                <span>{{ stopCount }} 个片段</span>
                <span>{{ photoCount }} 张照片</span>
              </div>
            </div>
          </div>

          <div class="stop-board">
            <article
              v-for="(stop, stopIndex) in form.stops"
              :key="stop.id || `stop-${stopIndex}`"
              class="stop-card"
              :class="{ 'is-active': stopIndex === selectedStopIndex || stopIndex === coordinateTargetStopIndex }"
            >
              <div class="stop-card__side">
                <div class="stop-card__header">
                  <span class="stop-number">{{ String(stopIndex + 1).padStart(2, '0') }}</span>
                  <div class="stop-title-main" @click="selectStop(stopIndex)">
                    <h3>{{ stopDisplayTitle(stop, stopIndex) }}</h3>
                  </div>
                  <div class="stop-actions">
                    <button type="button" class="icon-button" title="上移片段" @click="moveStop(stopIndex, -1)">
                      ↑
                    </button>
                    <button type="button" class="icon-button" title="下移片段" @click="moveStop(stopIndex, 1)">
                      ↓
                    </button>
                    <button type="button" class="icon-button" title="删除片段" @click="removeStop(stopIndex)">
                      ×
                    </button>
                  </div>
                </div>

                <div class="field">
                  <label>片段 / 景点标题</label>
                  <el-input v-model="stop.title" maxlength="50" placeholder="例如：凌晨 2 点的街道" @focus="selectStop(stopIndex)" />
                </div>

                <div class="field">
                  <label>片段文字</label>
                  <el-input
                    v-model="stop.storyNote"
                    type="textarea"
                    :rows="4"
                    maxlength="500"
                    placeholder="记录这个片段里最值得留下的一小段。"
                    @focus="selectStop(stopIndex)"
                  />
                </div>

                <div class="stop-meta-grid">
                  <div class="field">
                    <label>片段日期（可选）</label>
                    <el-date-picker
                      v-model="stop.visitedAt"
                      type="date"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      placeholder="选择片段日期"
                      class="w-full"
                    />
                  </div>
                </div>

                <div class="field field--subsection">
                  <div class="field-head">
                    <label>片段定位</label>
                    <span class="field-head__meta">
                      {{ stop.latitude != null && stop.longitude != null ? '独立坐标' : '跟随主地点' }}
                    </span>
                  </div>
                  <p class="stop-coordinate-text">{{ stopCoordinateSummary(stop) }}</p>
                  <div class="stop-coordinate-actions">
                    <button type="button" class="stop-coordinate-action" @click="activateStopCoordinateTarget(stopIndex)">单独定位</button>
                    <button type="button" class="stop-coordinate-action" @click="useLocationCoordinateForStop(stopIndex)">使用主地点</button>
                  </div>
                </div>
                <span class="stop-help">此片段会成为详情页“这趟路的节奏”中的一个站点。</span>
              </div>

              <div class="field field--subsection field--gallery">
                <div class="field-head">
                  <label>片段照片</label>
                  <span class="field-head__meta">{{ stop.entries.length }} 张，可设片段封面和整趟封面</span>
                </div>

                <div v-if="stop.entries.length" class="photo-strip">
                  <div
                    v-for="(entry, entryIndex) in stop.entries"
                    :key="entry.id || entry.imageUrl || `${stopIndex}-${entryIndex}`"
                    class="mini-photo"
                  >
                    <img :src="entry.imageUrl" :alt="entry.remark || stop.title || form.title || `片段照片 ${entryIndex + 1}`" />
                    <span v-if="entry.stopCover" class="mini-photo-badge">片段封面</span>
                    <span v-if="entry.cover" class="mini-photo-badge mini-photo-badge--travel">旅行封面</span>
                    <div class="mini-photo__toolbar">
                      <button type="button" class="mini-photo-icon" title="前移照片" @click="moveEntry(stopIndex, entryIndex, -1)">←</button>
                      <button type="button" class="mini-photo-icon" title="后移照片" @click="moveEntry(stopIndex, entryIndex, 1)">→</button>
                      <button type="button" class="mini-photo-remove" title="删除照片" @click="removeEntry(stopIndex, entryIndex)">×</button>
                    </div>
                    <div class="mini-photo__actions">
                      <button type="button" class="mini-photo-action" :class="{ active: entry.stopCover }" @click="setStopCover(stopIndex, entryIndex)">
                        设片段封面
                      </button>
                      <button type="button" class="mini-photo-action" :class="{ active: entry.cover }" @click="setTravelCover(stopIndex, entryIndex)">
                        设旅行封面
                      </button>
                    </div>
                    <el-input v-model="entry.remark" maxlength="80" placeholder="照片备注（可选）" class="photo-inline-input" />
                    <el-date-picker
                      v-model="entry.shotAt"
                      type="datetime"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      placeholder="拍摄时间（可选）"
                      class="w-full photo-inline-input"
                    />
                  </div>
                </div>

                <p v-else class="stop-gallery-empty">这个片段还没有照片，先上传一张吧。</p>

                <el-upload
                  class="stop-photo-upload"
                  :show-file-list="false"
                  :before-upload="beforeImageUpload"
                  :http-request="(options) => handleUploadStopImage(stopIndex, options)"
                  accept="image/*"
                  multiple
                >
                  <button type="button" class="mini-photo-add">
                    <el-icon><Plus /></el-icon>
                    添加照片
                  </button>
                </el-upload>
              </div>
            </article>

            <button type="button" class="add-stop-card" @click="addStop">
              <span class="add-stop-card__icon">+</span>
              <div class="add-stop-card__copy">
                <h3>添加旅途片段 / 景点</h3>
                <p>记录下一个景点、一段街区，或者一段值得单独留下的路。</p>
              </div>
              <span class="add-stop-card__cta">新增分组</span>
            </button>
          </div>
        </section>
      </main>

      <div class="travel-memory-create__footer">
        <div class="travel-memory-create__footer-inner">
          <el-button class="footer-button footer-button--neutral" @click="router.push('/memory-map')">
            返回地图
          </el-button>
          <el-button
            class="footer-button footer-button--save"
            type="primary"
            :loading="saving"
            :disabled="uploading"
            @click="handleSave"
          >
            {{ saveButtonLabel }}
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import type { AxiosError } from 'axios'
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
  TravelMemoryEntry,
  TravelMemoryEntryUpsertCommand,
  TravelMemoryLocationDetail,
  TravelMemoryStopUpsertCommand,
} from '@/types'
import { reverseGeocodeLocation } from '@/utils/amap'
import { normalizeCoordinate } from '@/utils/coordinate'
import { DEFAULT_IMAGE_MAX_MB, validateImageFile } from '@/utils/validation'
import { applySiteMeta } from '@/utils/siteConfig'

interface TravelMemoryEditorForm extends Omit<CreateTravelMemoryCommand, 'entries' | 'stops'> {
  stops: TravelMemoryStopUpsertCommand[]
}

type CoordinateTarget =
  | { type: 'location' }
  | { type: 'stop'; stopIndex: number }

const route = useRoute()
const router = useRouter()
const { siteConfig, loadSiteConfig } = useSiteConfig()
const pickerMapRef = ref<InstanceType<typeof TravelMemoryMap> | null>(null)

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
const selectedStopIndex = ref(0)
const coordinateTarget = ref<CoordinateTarget>({ type: 'location' })
const editingDetail = ref<TravelMemoryLocationDetail | null>(null)
let locationResolveRequestId = 0

const editingId = computed(() => {
  const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  const numericId = Number(rawId)
  return Number.isFinite(numericId) ? numericId : null
})
const isEditMode = computed(() => editingId.value != null)
const pageTitle = computed(() => (isEditMode.value ? '编辑旅行地点' : '新增旅行地点'))
const saveButtonLabel = computed(() => (isEditMode.value ? '保存修改' : '保存地点'))
const titleLength = computed(() => form.title?.length || 0)
const summaryLength = computed(() => form.summaryNote?.length || 0)
const stopCount = computed(() => form.stops.length)
const photoCount = computed(() => allEntries.value.length)
const coverEntry = computed(() => allEntries.value.find((entry) => entry.cover) || allEntries.value[0] || null)
const hasPickedLocation = computed(() => form.latitude != null && form.longitude != null)
const coordinateTargetStopIndex = computed(() => coordinateTarget.value.type === 'stop' ? coordinateTarget.value.stopIndex : null)
const isStopCoordinateTarget = computed(() => coordinateTarget.value.type === 'stop')
const activeStopTarget = computed(() => {
  const index = coordinateTargetStopIndex.value
  return index == null ? null : form.stops[index] || null
})
const hasCurrentTargetCoordinate = computed(() => {
  if (coordinateTarget.value.type === 'location') {
    return hasPickedLocation.value
  }
  const stop = form.stops[coordinateTarget.value.stopIndex]
  return !!stop && stop.latitude != null && stop.longitude != null
})
const pickerLatitude = computed(() => {
  if (coordinateTarget.value.type === 'location') {
    return form.latitude ?? null
  }
  const stop = form.stops[coordinateTarget.value.stopIndex]
  return stop?.latitude ?? null
})
const pickerLongitude = computed(() => {
  if (coordinateTarget.value.type === 'location') {
    return form.longitude ?? null
  }
  const stop = form.stops[coordinateTarget.value.stopIndex]
  return stop?.longitude ?? null
})
const currentLocationTitle = computed(() => {
  if (coordinateTarget.value.type === 'stop') {
    const stop = form.stops[coordinateTarget.value.stopIndex]
    return `当前片段：${stopDisplayTitle(stop, coordinateTarget.value.stopIndex)}`
  }
  return form.city || form.province || form.title || '未命名地点'
})
const currentLocationSubTitle = computed(() => {
  if (coordinateTarget.value.type === 'stop') {
    const stop = form.stops[coordinateTarget.value.stopIndex]
    if (!stop) return '点击地图为片段单独定位'
    if (stop.latitude != null && stop.longitude != null) {
      return `${Number(stop.latitude).toFixed(4)}，${Number(stop.longitude).toFixed(4)}`
    }
    if (form.latitude != null && form.longitude != null) {
      return '当前使用主地点坐标'
    }
    return '点击地图为这个片段单独定位'
  }

  const regionText = [form.province, form.city].filter(Boolean).join(' · ')
  if (regionText) return regionText
  if (form.latitude != null && form.longitude != null) {
    return `${Number(form.latitude).toFixed(4)}，${Number(form.longitude).toFixed(4)}`
  }
  return '点击地图选择主地点坐标'
})
const locationMetaStatusTitle = computed(() => {
  if (resolvingLocationMeta.value) return '正在识别地点'
  if (form.province || form.city) return '已自动匹配省市'
  if (form.latitude != null && form.longitude != null) return '还未识别到完整省市'
  return '先在地图上选一个位置'
})
const locationMetaStatusText = computed(() => {
  if (resolvingLocationMeta.value) {
    return '正在根据当前坐标反查省份和城市，请稍等片刻。'
  }
  if (form.province || form.city) {
    const summary = [form.province, form.city].filter(Boolean).join(' / ')
    if (locationMetaNeedsManualConfirm.value) {
      return `${summary || '已识别到部分地点信息'}，如果有偏差可以继续手动修改。`
    }
    return lastResolvedAddress.value || `${summary}，你也可以继续补充标题和摘要。`
  }
  if (form.latitude != null && form.longitude != null) {
    return '主地点坐标已选中，但还没有匹配出完整省市，可以手动补充。'
  }
  return '点击地图后会自动尝试补全省份和城市。'
})
const hasInvalidTravelDateRange = computed(() => isEndDateBeforeStartDate(form.visitedAt, form.visitedEndAt))
const allEntries = computed(() => form.stops.flatMap((stop) => stop.entries))

const createEmptyStop = (index: number): TravelMemoryStopUpsertCommand => ({
  title: '',
  storyNote: '',
  visitedAt: '',
  latitude: undefined,
  longitude: undefined,
  sortOrder: index,
  entries: [],
})

const createEmptyForm = (): TravelMemoryEditorForm => ({
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
  stops: [createEmptyStop(0)],
})

const form = reactive<TravelMemoryEditorForm>(createEmptyForm())

function resetForm() {
  Object.assign(form, createEmptyForm())
  selectedStopIndex.value = 0
  coordinateTarget.value = { type: 'location' }
  resolvingLocationMeta.value = false
  locationMetaNeedsManualConfirm.value = false
  lastResolvedAddress.value = ''
  locationResolveRequestId = 0
}

function stopDisplayTitle(stop?: Pick<TravelMemoryStopUpsertCommand, 'title'> | null, index = 0) {
  return stop?.title?.trim() || `第 ${index + 1} 站`
}

function cloneEntry(entry: TravelMemoryEntry, index: number): TravelMemoryEntryUpsertCommand {
  return {
    id: entry.id,
    imageUrl: entry.imageUrl,
    remark: entry.remark || '',
    thanksNote: entry.thanksNote || '',
    shotAt: entry.shotAt || '',
    displayOrder: index,
    cover: !!entry.cover,
    stopCover: !!entry.stopCover,
    sourceLatitude: entry.sourceLatitude,
    sourceLongitude: entry.sourceLongitude,
    geoSource: entry.geoSource || 'NONE',
  }
}

function buildStopsFromDetail(detail: TravelMemoryLocationDetail): TravelMemoryStopUpsertCommand[] {
  const stops = detail.stops?.length
    ? detail.stops
    : [
        {
          title: detail.title || '旅途片段',
          storyNote: detail.summaryNote || '',
          coverImage: detail.coverImage,
          visitedAt: detail.visitedAt,
          latitude: detail.latitude,
          longitude: detail.longitude,
          sortOrder: 0,
          entries: detail.entries || [],
        },
      ]

  return stops
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((stop, stopIndex) => ({
      id: stop.id,
      title: stop.title || '',
      storyNote: stop.storyNote || '',
      visitedAt: stop.visitedAt || '',
      latitude: stop.latitude,
      longitude: stop.longitude,
      sortOrder: stopIndex,
      entries: (stop.entries || [])
        .slice()
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((entry, entryIndex) => cloneEntry(entry, entryIndex)),
    }))
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
    stops: buildStopsFromDetail(detail),
  })
  normalizeAllStops()
  selectedStopIndex.value = 0
  coordinateTarget.value = { type: 'location' }
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
    isEditMode.value ? '继续整理这段旅途，让地图和详情页保持一致。' : '把新的旅途整理成一篇完整的旅行记忆。',
  )
}

async function focusCurrentMapTarget() {
  await nextTick()
  if (coordinateTarget.value.type === 'stop') {
    const stop = form.stops[coordinateTarget.value.stopIndex]
    if (stop?.latitude != null && stop.longitude != null) {
      pickerMapRef.value?.focusPickerLocation(stop.latitude, stop.longitude)
    }
    return
  }

  if (form.latitude != null && form.longitude != null) {
    pickerMapRef.value?.focusPickerLocation(form.latitude, form.longitude)
  }
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
    await focusCurrentMapTarget()
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

function isEndDateBeforeStartDate(start?: string, end?: string) {
  if (!start || !end) return false
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return false
  return endTime < startTime
}

function resolveSaveErrorMessage(error: unknown) {
  const fallback = '保存失败，请检查权限、坐标、日期和图片后再试'
  const axiosError = error as AxiosError<{ message?: string }> | undefined
  const responseMessage = axiosError?.response?.data?.message
  if (responseMessage) return responseMessage
  if (error instanceof Error && error.message) return error.message
  return fallback
}

function selectStop(index: number) {
  selectedStopIndex.value = Math.max(0, Math.min(index, form.stops.length - 1))
}

function ensureUploadStopIndex(preferredIndex = selectedStopIndex.value) {
  if (!form.stops.length) {
    form.stops.push(createEmptyStop(0))
  }
  const nextIndex = Math.max(0, Math.min(preferredIndex, form.stops.length - 1))
  selectStop(nextIndex)
  return nextIndex
}

function normalizeStopCover(stop: TravelMemoryStopUpsertCommand) {
  if (!stop.entries.length) return
  let assigned = false
  stop.entries.forEach((entry) => {
    if (entry.stopCover && !assigned) {
      assigned = true
      entry.stopCover = true
      return
    }
    entry.stopCover = false
  })
  if (!assigned) {
    stop.entries[0].stopCover = true
  }
}

function normalizeTravelCover() {
  const entries = allEntries.value
  if (!entries.length) return
  let assigned = false
  entries.forEach((entry) => {
    if (entry.cover && !assigned) {
      assigned = true
      entry.cover = true
      return
    }
    entry.cover = false
  })
  if (!assigned) {
    entries[0].cover = true
  }
}

function normalizeAllStops() {
  form.stops.forEach((stop, stopIndex) => {
    stop.sortOrder = stopIndex
    stop.entries.forEach((entry, entryIndex) => {
      entry.displayOrder = entryIndex
      if (!entry.geoSource) {
        entry.geoSource = 'NONE'
      }
    })
    normalizeStopCover(stop)
  })
  normalizeTravelCover()
}

async function appendUploadedEntry(
  result: { url: string; shotAt?: string; latitude?: number; longitude?: number },
  options: { stopIndex: number; cover?: boolean; stopCover?: boolean } = { stopIndex: 0 },
) {
  const stop = form.stops[options.stopIndex]
  if (!stop) return

  if (options.cover) {
    allEntries.value.forEach((entry) => {
      entry.cover = false
    })
  }
  if (options.stopCover) {
    stop.entries.forEach((entry) => {
      entry.stopCover = false
    })
  }

  const nextEntry: TravelMemoryEntryUpsertCommand = {
    imageUrl: result.url,
    remark: '',
    thanksNote: '',
    shotAt: result.shotAt,
    displayOrder: stop.entries.length,
    cover: options.cover || allEntries.value.length === 0,
    stopCover: options.stopCover || stop.entries.length === 0,
    sourceLatitude: result.latitude,
    sourceLongitude: result.longitude,
    geoSource: result.latitude != null && result.longitude != null ? 'EXIF' : 'NONE',
  }
  stop.entries.push(nextEntry)
  normalizeAllStops()
}

async function handleUploadStopImage(stopIndex: number, options: UploadRequestOptions) {
  uploading.value = true
  try {
    const result = await uploadTravelMemoryImage(options.file as File)
    await appendUploadedEntry(result, { stopIndex, stopCover: form.stops[stopIndex]?.entries.length === 0 })
    if (coordinateTarget.value.type === 'stop' && coordinateTarget.value.stopIndex === stopIndex && result.latitude != null && result.longitude != null) {
      updateStopCoordinate(stopIndex, result.latitude, result.longitude)
    }
    if ((form.latitude == null || form.longitude == null) && result.latitude != null && result.longitude != null) {
      await applyLocationCoordinateSelection(result.latitude, result.longitude, { silent: true })
    }
    options.onSuccess?.(result as never)
    ElMessage.success('片段照片上传成功')
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
    const stopIndex = ensureUploadStopIndex()
    await appendUploadedEntry(result, {
      stopIndex,
      cover: true,
      stopCover: form.stops[stopIndex].entries.length === 0,
    })
    if ((form.latitude == null || form.longitude == null) && result.latitude != null && result.longitude != null) {
      await applyLocationCoordinateSelection(result.latitude, result.longitude, { silent: true })
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

function updateLocationCoordinateFields(latitude: number, longitude: number) {
  const coordinate = normalizeCoordinate(latitude, longitude)
  form.latitude = coordinate.latitude
  form.longitude = coordinate.longitude
}

function updateStopCoordinate(stopIndex: number, latitude: number, longitude: number) {
  const stop = form.stops[stopIndex]
  if (!stop) return
  const coordinate = normalizeCoordinate(latitude, longitude)
  stop.latitude = coordinate.latitude
  stop.longitude = coordinate.longitude
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

async function applyLocationCoordinateSelection(
  latitude: number,
  longitude: number,
  options: { silent?: boolean } = {},
) {
  updateLocationCoordinateFields(latitude, longitude)
  form.province = ''
  form.city = ''
  lastResolvedAddress.value = ''
  await resolveLocationMetaFromCoordinate(latitude, longitude, options)
}

async function handlePickCoordinate(payload: { latitude: number; longitude: number }) {
  if (coordinateTarget.value.type === 'stop') {
    updateStopCoordinate(coordinateTarget.value.stopIndex, payload.latitude, payload.longitude)
    pickerMapRef.value?.focusPickerLocation(payload.latitude, payload.longitude)
    ElMessage.success('已为片段设置单独坐标')
    return
  }
  await applyLocationCoordinateSelection(payload.latitude, payload.longitude)
  pickerMapRef.value?.focusPickerLocation(payload.latitude, payload.longitude)
}

async function handleExistingLocationSelect(id: number) {
  const target = list.value.find((item) => item.id === id)
  if (!target || target.latitude == null || target.longitude == null) return
  if (coordinateTarget.value.type === 'stop') {
    updateStopCoordinate(coordinateTarget.value.stopIndex, Number(target.latitude), Number(target.longitude))
    pickerMapRef.value?.focusPickerLocation(Number(target.latitude), Number(target.longitude))
    ElMessage.success('已引用现有地点坐标到片段')
    return
  }
  await applyLocationCoordinateSelection(Number(target.latitude), Number(target.longitude))
  pickerMapRef.value?.focusPickerLocation(Number(target.latitude), Number(target.longitude))
  form.province = target.province || form.province
  form.city = target.city || form.city
  if (!form.title.trim()) {
    form.title = target.title || ''
  }
}

function handleLocationSearch() {
  const keyword = locationSearchKeyword.value.trim()
  if (!keyword) {
    ElMessage.info('先输入一个地点关键词，或者直接在地图上点一下位置。')
    return
  }
  locationSearchRequest.value += 1
}

function handleLocationSearchError(message: string) {
  ElMessage.warning(message)
}

function zoomInPickerMap() {
  pickerMapRef.value?.zoomIn()
}

function zoomOutPickerMap() {
  pickerMapRef.value?.zoomOut()
}

function switchToLocationTarget() {
  coordinateTarget.value = { type: 'location' }
  void focusCurrentMapTarget()
}

function activateStopCoordinateTarget(stopIndex: number) {
  selectStop(stopIndex)
  coordinateTarget.value = { type: 'stop', stopIndex }
  void focusCurrentMapTarget()
}

function locateCurrentPosition() {
  if (!navigator.geolocation) {
    ElMessage.warning('当前浏览器不支持自动定位')
    return
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude = position.coords.latitude
      const longitude = position.coords.longitude

      if (coordinateTarget.value.type === 'stop') {
        updateStopCoordinate(coordinateTarget.value.stopIndex, latitude, longitude)
        pickerMapRef.value?.focusPickerLocation(latitude, longitude)
        ElMessage.success('已为当前片段定位')
        return
      }

      await applyLocationCoordinateSelection(latitude, longitude)
      pickerMapRef.value?.focusPickerLocation(latitude, longitude)
      ElMessage.success('已定位到当前位置')
    },
    () => {
      ElMessage.warning('自动定位失败，请手动搜索或点击地图选择')
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    },
  )
}

function clearCoordinateSelection() {
  if (coordinateTarget.value.type === 'stop') {
    const stop = form.stops[coordinateTarget.value.stopIndex]
    if (!stop) return
    stop.latitude = undefined
    stop.longitude = undefined
    return
  }
  form.latitude = undefined
  form.longitude = undefined
  form.province = ''
  form.city = ''
  lastResolvedAddress.value = ''
  locationMetaNeedsManualConfirm.value = false
}

function useLocationCoordinateForStop(stopIndex: number) {
  const stop = form.stops[stopIndex]
  if (!stop) return
  stop.latitude = undefined
  stop.longitude = undefined
  if (coordinateTarget.value.type === 'stop' && coordinateTarget.value.stopIndex === stopIndex) {
    switchToLocationTarget()
  }
}

function setTravelCover(stopIndex: number, entryIndex: number) {
  form.stops.forEach((stop, outerIndex) => {
    stop.entries.forEach((entry, innerIndex) => {
      entry.cover = outerIndex === stopIndex && innerIndex === entryIndex
    })
  })
}

function setStopCover(stopIndex: number, entryIndex: number) {
  const stop = form.stops[stopIndex]
  if (!stop) return
  stop.entries.forEach((entry, currentIndex) => {
    entry.stopCover = currentIndex === entryIndex
  })
}

function removeCoverEntry() {
  const location = findCoverEntryPosition()
  if (!location) return
  removeEntry(location.stopIndex, location.entryIndex)
}

function findCoverEntryPosition() {
  for (let stopIndex = 0; stopIndex < form.stops.length; stopIndex += 1) {
    const entryIndex = form.stops[stopIndex].entries.findIndex((entry) => entry.cover)
    if (entryIndex >= 0) {
      return { stopIndex, entryIndex }
    }
  }
  return null
}

function moveStop(stopIndex: number, direction: -1 | 1) {
  const nextIndex = stopIndex + direction
  if (nextIndex < 0 || nextIndex >= form.stops.length) return
  const [movedStop] = form.stops.splice(stopIndex, 1)
  form.stops.splice(nextIndex, 0, movedStop)
  normalizeAllStops()
  selectStop(nextIndex)
  if (coordinateTarget.value.type === 'stop') {
    if (coordinateTarget.value.stopIndex === stopIndex) {
      coordinateTarget.value = { type: 'stop', stopIndex: nextIndex }
    } else if (direction === -1 && coordinateTarget.value.stopIndex === nextIndex) {
      coordinateTarget.value = { type: 'stop', stopIndex: nextIndex + 1 }
    } else if (direction === 1 && coordinateTarget.value.stopIndex === nextIndex) {
      coordinateTarget.value = { type: 'stop', stopIndex: nextIndex - 1 }
    }
  }
}

function removeStop(stopIndex: number) {
  form.stops.splice(stopIndex, 1)
  if (!form.stops.length) {
    form.stops.push(createEmptyStop(0))
  }
  normalizeAllStops()
  selectStop(Math.min(stopIndex, form.stops.length - 1))
  if (coordinateTarget.value.type === 'stop' && coordinateTarget.value.stopIndex === stopIndex) {
    switchToLocationTarget()
  }
}

function addStop() {
  const nextIndex = form.stops.length
  form.stops.push(createEmptyStop(nextIndex))
  normalizeAllStops()
  selectStop(nextIndex)
}

function moveEntry(stopIndex: number, entryIndex: number, direction: -1 | 1) {
  const stop = form.stops[stopIndex]
  if (!stop) return
  const nextIndex = entryIndex + direction
  if (nextIndex < 0 || nextIndex >= stop.entries.length) return
  const [movedEntry] = stop.entries.splice(entryIndex, 1)
  stop.entries.splice(nextIndex, 0, movedEntry)
  normalizeAllStops()
}

function removeEntry(stopIndex: number, entryIndex: number) {
  const stop = form.stops[stopIndex]
  if (!stop) return
  stop.entries.splice(entryIndex, 1)
  normalizeAllStops()
}

function stopCoordinateSummary(stop: TravelMemoryStopUpsertCommand) {
  if (stop.latitude != null && stop.longitude != null) {
    return `片段坐标：${Number(stop.latitude).toFixed(4)}，${Number(stop.longitude).toFixed(4)}`
  }
  if (form.latitude != null && form.longitude != null) {
    return '使用主地点坐标'
  }
  return '还没有片段坐标'
}

function validateStopsBeforeSave() {
  if (!form.stops.length) {
    ElMessage.warning('至少需要保留一个旅途片段')
    return false
  }
  for (let stopIndex = 0; stopIndex < form.stops.length; stopIndex += 1) {
    const stop = form.stops[stopIndex]
    if (!stop.title.trim()) {
      ElMessage.warning(`请补充第 ${stopIndex + 1} 个片段的标题`)
      selectStop(stopIndex)
      return false
    }
    if (!stop.entries.length) {
      ElMessage.warning(`第 ${stopIndex + 1} 个片段还没有照片`)
      selectStop(stopIndex)
      return false
    }
  }
  return true
}

async function handleSave() {
  if (uploading.value) {
    ElMessage.warning('照片还在上传中，请等上传完成后再保存')
    return
  }
  if (!form.title.trim()) {
    ElMessage.warning('请输入地点标题')
    return
  }
  if (!hasPickedLocation.value) {
    ElMessage.warning('请先在地图上选择主地点坐标')
    return
  }
  if (hasInvalidTravelDateRange.value) {
    ElMessage.warning('旅行结束日期不能早于开始日期')
    return
  }
  if (!validateStopsBeforeSave()) {
    return
  }

  normalizeAllStops()

  const payload: CreateTravelMemoryCommand = {
    title: form.title.trim(),
    province: form.province?.trim() || '',
    city: form.city?.trim() || '',
    latitude: form.latitude,
    longitude: form.longitude,
    summaryNote: form.summaryNote?.trim() || '',
    visitedAt: form.visitedAt || undefined,
    visitedEndAt: form.visitedEndAt || undefined,
    status: form.status,
    sortOrder: form.sortOrder,
    stops: form.stops.map((stop, stopIndex) => ({
      id: stop.id,
      title: stop.title.trim(),
      storyNote: stop.storyNote?.trim() || '',
      visitedAt: stop.visitedAt || undefined,
      latitude: stop.latitude,
      longitude: stop.longitude,
      sortOrder: stopIndex,
      entries: stop.entries.map((entry, entryIndex) => ({
        id: entry.id,
        imageUrl: entry.imageUrl,
        remark: entry.remark?.trim() || '',
        thanksNote: entry.thanksNote?.trim() || '',
        shotAt: entry.shotAt || undefined,
        displayOrder: entryIndex,
        cover: !!entry.cover,
        stopCover: !!entry.stopCover,
        sourceLatitude: entry.sourceLatitude,
        sourceLongitude: entry.sourceLongitude,
        geoSource: entry.geoSource || 'NONE',
      })),
    })),
  }

  saving.value = true
  try {
    const saved = isEditMode.value && editingId.value != null
      ? await updateTravelMemory(editingId.value, payload)
      : await createTravelMemory(payload)
    ElMessage.success(isEditMode.value ? '旅行地点更新成功' : '旅行地点创建成功')
    await loadList()
    router.push({ name: 'TravelMemoryDetail', params: { id: saved.id } })
  } catch (error) {
    ElMessage.error(resolveSaveErrorMessage(error))
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
  width: min(1540px, calc(100vw - 72px));
  min-height: 100vh;
  margin: 0 auto;
  padding: 78px 0 calc(96px + env(safe-area-inset-bottom, 0));
  color: #43343c;
}

.travel-memory-editor {
  position: relative;
  display: grid;
  grid-template-columns: minmax(430px, 0.92fr) minmax(650px, 1.55fr);
  column-gap: 14px;
  row-gap: 10px;
  align-items: stretch;
  min-height: auto;
}

.travel-memory-editor::before,
.travel-memory-editor::after {
  content: '';
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

.travel-memory-create__topbar,
.travel-memory-create__footer,
.travel-memory-map-panel,
.editor-card {
  position: relative;
  z-index: 1;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.travel-memory-create__back {
  color: #8f8290;
  font-weight: 700;
}

.travel-memory-create__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.travel-memory-create__meta span,
.small-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(238, 226, 235, 0.88);
  color: #8f8290;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.small-pill.is-strong,
.count-pill {
  color: #e44d78;
  border-color: rgba(255, 187, 211, 0.92);
  background: rgba(255, 247, 251, 0.9);
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
  grid-column: 1;
  grid-row: 1;
  position: relative;
  top: 0;
  align-self: stretch;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  min-height: 0;
  height: 100%;
  padding: 22px;
  border-radius: 16px;
}

.map-panel__head,
.panel-title,
.section-title,
.section-title--inline,
.section-title--inline > div,
.map-picked-card,
.inline-actions,
.stop-title-main {
  display: flex;
  align-items: center;
}

.map-panel__head {
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  flex-wrap: nowrap;
  margin-bottom: 18px;
}

.panel-title {
  gap: 10px;
  min-width: 0;
  flex: 1 1 auto;
}

.panel-title strong,
.section-title strong {
  color: #2f2730;
  font-size: 17px;
  font-weight: 800;
}

.panel-title strong {
  white-space: nowrap;
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

.map-panel__focus-banner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 187, 211, 0.92);
  background:
    linear-gradient(180deg, rgba(255, 251, 253, 0.96), rgba(255, 247, 251, 0.9)),
    radial-gradient(circle at 90% 8%, rgba(255, 206, 224, 0.26), transparent 34%);
}

.map-panel__focus-banner strong {
  color: #4f414b;
  font-size: 13px;
}

.map-panel__focus-banner span {
  display: block;
  margin-top: 4px;
  color: #918695;
  font-size: 12px;
  line-height: 1.45;
}

.map-panel__focus-banner button {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(238, 226, 235, 0.96);
  border-radius: 999px;
  color: #6f6570;
  background: rgba(255, 255, 255, 0.82);
}

.map-search {
  width: min(340px, 100%);
  margin-bottom: 0;
  margin-left: auto;
  flex: 0 1 340px;
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
  width: 100%;
  aspect-ratio: 1 / 1;
  min-height: clamp(360px, 32vw, 620px);
  height: auto;
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
  bottom: 112px;
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
  font-size: 18px;
}

.map-panel__locate {
  position: absolute;
  right: 22px;
  bottom: 84px;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.map-picked-card {
  position: absolute;
  right: 22px;
  bottom: 20px;
  z-index: 4;
  gap: 8px;
  width: min(212px, calc(100% - 52px));
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(238, 228, 235, 0.96);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 20px rgba(203, 182, 195, 0.14);
}

.map-picked-card__pin {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  border-radius: 999px;
  color: #ff5592;
  background: rgba(255, 235, 243, 0.96);
}

.map-picked-card div {
  display: grid;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}

.map-picked-card strong {
  color: #4c3d47;
  font-size: 11px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-picked-card span {
  color: #8d8290;
  font-size: 10px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-picked-card button {
  margin-left: auto;
  padding: 0;
  border: 0;
  color: #ff4f91;
  background: transparent;
  font-size: 10px;
  flex: 0 0 auto;
  white-space: nowrap;
}

.travel-memory-form-panel {
  display: contents;
}

.travel-memory-form-top {
  grid-column: 2;
  grid-row: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(286px, 320px);
  gap: 10px;
  align-items: stretch;
  min-width: 0;
  height: 100%;
  min-height: 100%;
}

.editor-card--main-info,
.editor-card--cover-panel {
  height: 100%;
  align-content: start;
}

.editor-card {
  display: grid;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 16px;
}

.section-title {
  gap: 10px;
}

.section-title > span,
.section-title--inline > div > span,
.section-heading-stack > div > span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff4f91, #ff9dbc);
  box-shadow: 0 0 0 5px rgba(255, 108, 161, 0.1);
}

.section-title--inline {
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.section-heading-stack {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.section-heading-stack > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-heading-stack small {
  color: #918695;
  font-size: 12px;
  line-height: 1.45;
}

.inline-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.editor-form,
.field {
  display: grid;
  gap: 10px;
}

.field label,
.field-head label {
  color: #3d333b;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
}

.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.field-head__meta {
  color: #918695;
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
}

.date-range-row,
.form-meta-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.form-meta-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: end;
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

.coordinate-status {
  grid-column: 1 / -1;
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
  color: #918695;
  font-size: 12px;
  line-height: 1.45;
}

.coordinate-status.is-loading {
  border-color: rgba(255, 172, 203, 0.96);
}

.coordinate-status.is-warning {
  background: rgba(255, 247, 251, 0.98);
  border-color: rgba(255, 187, 211, 0.98);
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

.cover-upload__filled {
  align-content: start;
}

.cover-upload__empty {
  grid-template-rows: minmax(180px, 1fr);
}

.cover-upload__placeholder,
.cover-upload__preview-frame {
  overflow: hidden;
  min-height: 180px;
  border-radius: 14px;
  border: 1.5px dashed rgba(255, 143, 184, 0.72);
  background: rgba(255, 250, 253, 0.74);
}

.cover-upload__placeholder {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  color: #ff5e99;
}

.cover-upload__placeholder .el-icon {
  font-size: 32px;
}

.cover-upload__placeholder strong {
  color: #4d404a;
  font-size: 14px;
}

.cover-upload__image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.cover-upload__actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.cover-upload__actions .cover-action {
  width: 100%;
}

.cover-upload__hint {
  margin: 0;
  color: rgba(77, 64, 74, 0.62);
  font-size: 12px;
  line-height: 1.6;
}

.cover-action,
.footer-button,
.ghost-button,
.primary-button {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 999px;
  border: 1px solid rgba(238, 226, 235, 0.96);
  font-size: 13px;
  font-weight: 800;
}

.primary-button {
  padding: 0 15px;
  color: #fff;
  border-color: rgba(255, 91, 144, 0.96);
  background: linear-gradient(135deg, #ff4f91, #ff8bb4);
  box-shadow: 0 12px 24px rgba(255, 91, 144, 0.22);
}

.ghost-button,
.cover-action--ghost,
.footer-button--neutral {
  color: #6f6570;
  background: rgba(255, 255, 255, 0.82);
}

.cover-action--primary,
.footer-button--save {
  color: #fff;
  border-color: rgba(255, 91, 144, 0.96);
  background: linear-gradient(135deg, #ff4f91, #ff8bb4);
  box-shadow: 0 12px 24px rgba(255, 91, 144, 0.22);
}

.editor-card--advanced {
  grid-column: 1 / -1;
  grid-row: 3;
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

.advanced-field--inline {
  display: grid;
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

.editor-card--stops {
  grid-column: 1 / -1;
  grid-row: 2;
  gap: 16px;
  padding-bottom: 24px;
}

.editor-card--stops .section-title--inline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 18px;
}

.editor-card--stops .inline-actions {
  align-self: start;
  justify-content: flex-end;
}

.inline-stats {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 14px;
  color: #8c808d;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.inline-stats span {
  position: relative;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.inline-stats span + span::before {
  content: '';
  width: 4px;
  height: 4px;
  margin-right: 14px;
  border-radius: 999px;
  background: rgba(207, 183, 195, 0.9);
}

.stop-board {
  display: grid;
  gap: 18px;
}

.stop-card {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(238, 226, 235, 0.96);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 24px rgba(213, 190, 203, 0.1);
}

.stop-card.is-active {
  border-color: rgba(255, 151, 189, 0.9);
  box-shadow:
    0 0 0 3px rgba(255, 166, 200, 0.18),
    0 18px 30px rgba(213, 190, 203, 0.14);
}

.stop-card__side {
  display: grid;
  align-content: start;
  gap: 12px;
  min-width: 0;
}

.stop-card__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}

.stop-number {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 91, 144, 0.92);
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 10px 20px rgba(255, 91, 144, 0.18);
}

.stop-title-main {
  min-width: 0;
  cursor: pointer;
}

.stop-title-main h3 {
  margin: 0;
  color: #2f2730;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stop-actions {
  display: flex;
  gap: 7px;
}

.icon-button,
.mini-photo-icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(238, 226, 235, 0.96);
  border-radius: 999px;
  color: #9a8f9b;
  background: rgba(255, 255, 255, 0.82);
}

.stop-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field--subsection {
  gap: 8px;
  min-width: 0;
}

.field--gallery {
  gap: 12px;
}

.stop-coordinate-text,
.stop-gallery-empty,
.stop-help {
  margin: 0;
  color: #918695;
  font-size: 12px;
  line-height: 1.55;
}

.stop-coordinate-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stop-coordinate-action {
  min-height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(232, 218, 227, 0.96);
  color: #6f6570;
  background: rgba(255, 255, 255, 0.86);
  font-size: 12px;
  font-weight: 700;
}

.stop-coordinate-action:hover {
  border-color: rgba(255, 182, 208, 0.96);
  color: #e44d78;
  background: rgba(255, 255, 255, 0.98);
}

.photo-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  align-items: start;
}

.mini-photo {
  position: relative;
  display: grid;
  align-content: start;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(238, 226, 235, 0.96);
  background: rgba(255, 255, 255, 0.92);
}

.mini-photo img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 12px;
}

.mini-photo-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  min-height: 22px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 91, 144, 0.92);
  font-size: 12px;
  font-weight: 800;
}

.mini-photo-badge--travel {
  left: auto;
  right: 42px;
  background: rgba(97, 86, 102, 0.92);
}

.mini-photo__toolbar {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
}

.mini-photo-remove {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid rgba(238, 226, 235, 0.96);
  border-radius: 999px;
  color: #ff5d94;
  background: rgba(255, 255, 255, 0.92);
}

.mini-photo__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mini-photo-action {
  min-height: 28px;
  width: 100%;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid rgba(238, 226, 235, 0.96);
  color: #8a7a84;
  background: rgba(255, 255, 255, 0.86);
  font-size: 11px;
  font-weight: 700;
}

.mini-photo-action.active {
  color: #e44d78;
  border-color: rgba(255, 187, 211, 0.92);
  background: rgba(255, 247, 251, 0.92);
}

.photo-inline-input :deep(.el-input__wrapper),
.photo-inline-input :deep(.el-textarea__inner),
.photo-inline-input :deep(.el-date-editor.el-input__wrapper) {
  min-height: 34px;
}

.mini-photo-add {
  width: 100%;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px dashed rgba(228, 214, 223, 0.96);
  border-radius: 14px;
  color: #5f5962;
  background: rgba(255, 255, 255, 0.86);
}

.stop-photo-upload :deep(.el-upload) {
  display: block;
  width: 100%;
}

.add-stop-card {
  min-height: 132px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 22px 24px;
  border: 1px dashed rgba(228, 214, 223, 0.96);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  color: #5f5962;
  text-align: left;
}

.add-stop-card__icon {
  display: inline-grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 999px;
  color: #e44d78;
  background: rgba(255, 247, 251, 0.96);
  border: 1px solid rgba(255, 187, 211, 0.92);
  font-size: 20px;
  font-weight: 700;
}

.add-stop-card__copy {
  display: grid;
  gap: 6px;
}

.add-stop-card__copy h3,
.add-stop-card__copy p {
  margin: 0;
}

.add-stop-card__copy h3 {
  color: #4f414b;
  font-size: 15px;
  font-weight: 800;
}

.add-stop-card__copy p {
  color: #918695;
  font-size: 12px;
  line-height: 1.6;
}

.add-stop-card__cta {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  color: #8a7a84;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(232, 218, 227, 0.96);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
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
:deep(.el-date-editor .el-input__wrapper) {
  width: 100%;
  border-radius: 9px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
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
    grid-column: 1;
    grid-row: auto;
    height: auto;
    min-height: 0;
  }

  .map-panel__canvas {
    min-height: 420px;
    height: auto;
    aspect-ratio: auto;
  }

  .travel-memory-form-top {
    grid-column: 1;
    grid-row: auto;
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
  }

  .editor-card--advanced,
  .editor-card--stops {
    grid-column: 1;
    grid-row: auto;
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

  .travel-memory-create__topbar-inner,
  .travel-memory-create__footer-inner {
    width: min(100vw - 18px, 100%);
  }

  .travel-memory-create__topbar-inner {
    display: grid;
    gap: 8px;
  }

  .map-panel__head {
    flex-direction: column;
    align-items: stretch;
  }

  .map-search {
    width: 100%;
    flex-basis: auto;
  }

  .date-range-row,
  .form-meta-row,
  .photo-strip,
  .add-stop-card,
  .stop-meta-grid,
  .editor-card--stops .section-title--inline {
    grid-template-columns: 1fr;
  }

  .date-range-row__divider {
    display: none;
  }

  .stop-card__header {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .mini-photo__actions {
    grid-template-columns: 1fr;
  }

  .field-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .field-head__meta {
    white-space: normal;
  }

  .stop-coordinate-actions {
    flex-direction: column;
  }

  .stop-actions {
    grid-column: 1 / -1;
  }

  .map-picked-card {
    left: 16px;
    right: 16px;
    width: auto;
  }

  .map-panel__locate {
    left: 16px;
    right: auto;
    bottom: 86px;
  }

  .map-panel__tools {
    left: 16px;
    bottom: 150px;
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

