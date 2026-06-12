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

      <div v-if="editorLoadError" class="travel-memory-editor-error" role="alert">
        <div class="travel-memory-editor-error__copy">
          <strong>旅行地点加载失败</strong>
          <p>{{ editorLoadError }}</p>
        </div>
        <div class="travel-memory-editor-error__actions">
          <el-button type="primary" @click="retryPageLoad">重新加载</el-button>
          <el-button @click="goToMemoryMap">返回地图</el-button>
        </div>
      </div>

      <template v-else>
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
            清除选择
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
              <button type="button" class="section-action section-action--primary" @click="addStop">
                <el-icon><Plus /></el-icon>
                添加旅途片段
              </button>
            </div>
          </div>

          <div class="stop-board">
            <article
              v-for="(stop, stopIndex) in form.stops"
              :key="stop.id || `stop-${stopIndex}`"
              class="stop-card"
              :class="{ 'is-active': stopIndex === selectedStopIndex, 'is-expanded': isStopExpanded(stopIndex) }"
            >
              <template v-if="isStopExpanded(stopIndex)">
                <div class="stop-editor-main">
                  <div class="stop-card__header">
                    <span class="stop-number">{{ String(stopIndex + 1).padStart(2, '0') }}</span>
                    <button type="button" class="stop-title-main" @click="selectStop(stopIndex)">
                      <h3>{{ stopDisplayTitle(stop, stopIndex) }}</h3>
                    </button>
                    <div class="stop-actions">
                      <button
                        type="button"
                        class="icon-button icon-button--toggle"
                        title="折叠片段"
                        aria-label="折叠片段"
                        @click="collapseStop(stopIndex)"
                      >
                        <el-icon><ArrowUp /></el-icon>
                      </button>
                      <button
                        type="button"
                        class="icon-button"
                        title="上移片段"
                        aria-label="上移片段"
                        :disabled="stopIndex === 0"
                        @click="moveStop(stopIndex, -1)"
                      >
                        <el-icon><Top /></el-icon>
                      </button>
                      <button
                        type="button"
                        class="icon-button"
                        title="下移片段"
                        aria-label="下移片段"
                        :disabled="stopIndex === form.stops.length - 1"
                        @click="moveStop(stopIndex, 1)"
                      >
                        <el-icon><Bottom /></el-icon>
                      </button>
                      <button type="button" class="icon-button" title="删除片段" aria-label="删除片段" @click="removeStop(stopIndex)">
                        <el-icon><Close /></el-icon>
                      </button>
                    </div>
                  </div>

                  <div class="stop-editor-grid">
                    <div class="stop-fields-panel">
                      <div class="field">
                        <label>片段 / 景点标题</label>
                        <el-input v-model="stop.title" maxlength="50" placeholder="例如：凌晨 2 点的街道" @focus="selectStop(stopIndex)" />
                      </div>

                      <div class="field">
                        <label>片段文字</label>
                        <el-input
                          v-model="stop.storyNote"
                          type="textarea"
                          :rows="5"
                          maxlength="500"
                          show-word-limit
                          placeholder="记录这个片段里最值得留下的一小段。"
                          @focus="selectStop(stopIndex)"
                        />
                      </div>

                      <div class="field stop-date-field">
                        <label>片段日期（可选）</label>
                        <el-date-picker
                          v-model="stop.visitedAt"
                          type="date"
                          value-format="YYYY-MM-DDTHH:mm:ss"
                          placeholder="选择片段日期"
                          class="w-full"
                        />
                      </div>

                      <span class="stop-help">此片段会成为详情页“这趟路的节奏”中的一个站点。</span>
                    </div>

                    <div class="field field--subsection field--gallery">
                      <div class="field-head">
                        <label>片段照片</label>
                        <span class="field-head__meta">{{ stop.entries.length }} 张，第一张为片段封面，可设整趟封面</span>
                      </div>

                      <div
                        class="photo-strip"
                        :class="{
                          'is-empty': !stop.entries.length,
                          'is-single': stop.entries.length === 1,
                        }"
                      >
                        <div
                          v-for="(entry, entryIndex) in stop.entries"
                          :key="entry.id || entry.imageUrl || `${stopIndex}-${entryIndex}`"
                          class="mini-photo"
                          :class="{
                            'is-cover': entry.stopCover,
                            'is-action-open': isEntryActionsOpen(stopIndex, entryIndex),
                            'is-dragging': isDraggingEntry(stopIndex, entryIndex),
                          }"
                          draggable="true"
                          @dragstart="handleEntryDragStart($event, stopIndex, entryIndex)"
                          @dragend="handleEntryDragEnd"
                          @dragover.prevent="handleEntryDragOver"
                          @drop="handleEntryDrop($event, stopIndex, entryIndex)"
                        >
                          <div class="mini-photo__media" @click="toggleEntryActions(stopIndex, entryIndex)">
                            <img :src="entry.imageUrl" :alt="entry.remark || stop.title || form.title || `片段照片 ${entryIndex + 1}`" />
                            <span v-if="entry.stopCover" class="mini-photo-badge">片段封面</span>
                            <span v-if="entry.cover" class="mini-photo-badge mini-photo-badge--travel">旅行封面</span>
                            <span class="mini-photo-drag-handle" title="拖拽排序" aria-hidden="true">
                              <el-icon><Rank /></el-icon>
                            </span>
                            <div class="mini-photo__overlay" @click.stop>
                              <button type="button" class="mini-photo-overlay-action" @click="setTravelCoverFromOverlay(stopIndex, entryIndex)">
                                设为旅行封面
                              </button>
                              <div class="mini-photo__mobile-sort">
                                <button type="button" class="mini-photo-overlay-action" @click="moveEntryFromOverlay(stopIndex, entryIndex, -1)">
                                  前移
                                </button>
                                <button type="button" class="mini-photo-overlay-action" @click="moveEntryFromOverlay(stopIndex, entryIndex, 1)">
                                  后移
                                </button>
                              </div>
                              <button type="button" class="mini-photo-overlay-action is-danger" @click="removeEntryFromOverlay(stopIndex, entryIndex)">
                                删除
                              </button>
                            </div>
                          </div>
                          <div class="mini-photo__remark">
                            <el-input
                              v-if="isEditingEntryRemark(stopIndex, entryIndex)"
                              v-model="entry.remark"
                              maxlength="80"
                              placeholder="添加一句照片说明"
                              autofocus
                              class="photo-remark-input"
                              @blur="finishEntryRemarkEdit"
                            />
                            <button
                              v-else
                              type="button"
                              class="mini-photo__remark-preview"
                              :class="{ 'is-empty': !entry.remark?.trim() }"
                              @click="editEntryRemark(stopIndex, entryIndex)"
                            >
                              {{ entry.remark?.trim() || '添加一句照片说明' }}
                            </button>
                          </div>
                        </div>

                        <el-upload
                          class="stop-photo-upload mini-photo-add-tile"
                          :show-file-list="false"
                          :before-upload="beforeImageUpload"
                          :http-request="(options) => handleUploadStopImage(stopIndex, options)"
                          accept="image/*"
                          multiple
                        >
                          <button type="button" class="mini-photo-add">
                            <el-icon><Plus /></el-icon>
                            <span>{{ stop.entries.length ? '继续添加' : '添加照片' }}</span>
                          </button>
                        </el-upload>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <button type="button" class="stop-compact" @click="selectStop(stopIndex)">
                  <span class="stop-number">{{ String(stopIndex + 1).padStart(2, '0') }}</span>
                  <span class="stop-compact__body">
                    <span class="stop-compact__title">{{ stopDisplayTitle(stop, stopIndex) }}</span>
                    <span class="stop-compact__meta">
                      <span>{{ stopDateText(stop) }}</span>
                      <span>{{ stop.entries.length }} 张照片</span>
                    </span>
                  </span>
                  <span class="stop-compact__thumbs" aria-hidden="true">
                    <span
                      v-for="(entry, entryIndex) in stopPreviewEntries(stop)"
                      :key="entry.id || entry.imageUrl || `${stopIndex}-preview-${entryIndex}`"
                      class="stop-compact__thumb"
                    >
                      <img :src="entry.imageUrl" :alt="entry.remark || stop.title || `片段照片 ${entryIndex + 1}`" />
                    </span>
                    <span v-if="!stop.entries.length" class="stop-compact__empty">暂无照片</span>
                  </span>
                  <span class="stop-compact__toggle" title="展开片段" aria-label="展开片段">
                    <el-icon><ArrowDown /></el-icon>
                  </span>
                </button>
              </template>
            </article>

          </div>
        </section>
      </main>

      <div class="travel-memory-create__footer">
        <div class="travel-memory-create__footer-inner">
          <el-button class="footer-button footer-button--neutral" @click="goToMemoryMap">
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
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import type { AxiosError } from 'axios'
import type { UploadRequestOptions } from 'element-plus'
import { notify } from '@/lib/feedback';
import { ArrowDown, ArrowLeft, ArrowUp, Bottom, Close, Location, Plus, Rank, Search, Top } from '@element-plus/icons-vue'
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
const expandedStopIndex = ref<number | null>(0)
const editingDetail = ref<TravelMemoryLocationDetail | null>(null)
const editorLoadError = ref('')
const editingEntryRemark = ref<{ stopIndex: number; entryIndex: number } | null>(null)
const activeEntryActions = ref<{ stopIndex: number; entryIndex: number } | null>(null)
const draggingEntry = ref<{ stopIndex: number; entryIndex: number } | null>(null)
let locationResolveRequestId = 0
let listRequestVersion = 0
let detailRequestVersion = 0
let pageLoadVersion = 0

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
const hasCurrentTargetCoordinate = computed(() => hasPickedLocation.value)
const pickerLatitude = computed(() => form.latitude ?? null)
const pickerLongitude = computed(() => form.longitude ?? null)
const currentLocationTitle = computed(() => form.city || form.province || form.title || '未命名地点')
const currentLocationSubTitle = computed(() => {
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
  expandedStopIndex.value = 0
  resolvingLocationMeta.value = false
  locationMetaNeedsManualConfirm.value = false
  lastResolvedAddress.value = ''
  locationResolveRequestId += 1
}

function stopDisplayTitle(stop?: Pick<TravelMemoryStopUpsertCommand, 'title'> | null, index = 0) {
  return stop?.title?.trim() || `第 ${index + 1} 站`
}

function stopDateText(stop: Pick<TravelMemoryStopUpsertCommand, 'visitedAt'>) {
  return stop.visitedAt ? stop.visitedAt.slice(0, 10) : '未选择日期'
}

function stopPreviewEntries(stop: Pick<TravelMemoryStopUpsertCommand, 'entries'>) {
  return stop.entries
    .slice()
    .sort((a, b) => Number(b.stopCover) - Number(a.stopCover) || (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .slice(0, 3)
}

function isEditingEntryRemark(stopIndex: number, entryIndex: number) {
  return editingEntryRemark.value?.stopIndex === stopIndex && editingEntryRemark.value.entryIndex === entryIndex
}

function editEntryRemark(stopIndex: number, entryIndex: number) {
  editingEntryRemark.value = { stopIndex, entryIndex }
}

function finishEntryRemarkEdit() {
  editingEntryRemark.value = null
}

function isEntryActionsOpen(stopIndex: number, entryIndex: number) {
  return activeEntryActions.value?.stopIndex === stopIndex && activeEntryActions.value.entryIndex === entryIndex
}

function toggleEntryActions(stopIndex: number, entryIndex: number) {
  activeEntryActions.value = isEntryActionsOpen(stopIndex, entryIndex) ? null : { stopIndex, entryIndex }
}

function closeEntryActions() {
  activeEntryActions.value = null
}

function isDraggingEntry(stopIndex: number, entryIndex: number) {
  return draggingEntry.value?.stopIndex === stopIndex && draggingEntry.value.entryIndex === entryIndex
}

function stopEntryShotAt(stop: Pick<TravelMemoryStopUpsertCommand, 'visitedAt'>) {
  return stop.visitedAt || form.visitedAt || undefined
}

function cloneEntry(entry: TravelMemoryEntry, index: number): TravelMemoryEntryUpsertCommand {
  return {
    id: entry.id,
    imageUrl: entry.imageUrl,
    remark: entry.remark || '',
    thanksNote: entry.thanksNote || '',
    shotAt: '',
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
  expandedStopIndex.value = 0
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
  if (form.latitude != null && form.longitude != null) {
    pickerMapRef.value?.focusPickerLocation(form.latitude, form.longitude)
  }
}

async function loadList() {
  const requestVersion = ++listRequestVersion
  try {
    const nextList = await getAdminTravelMemories()
    if (requestVersion !== listRequestVersion) return
    list.value = nextList
  } catch {
    if (requestVersion !== listRequestVersion) return
    notify.error('旅行地点列表加载失败')
  }
}

async function loadEditingDetail() {
  const requestVersion = ++detailRequestVersion
  if (!isEditMode.value || editingId.value == null) {
    if (requestVersion === detailRequestVersion) {
      editingDetail.value = null
      editorLoadError.value = ''
      resetForm()
      applyEditorMeta()
    }
    return
  }

  try {
    const detail = await getAdminTravelMemoryDetail(editingId.value)
    if (requestVersion !== detailRequestVersion) return
    editingDetail.value = detail
    editorLoadError.value = ''
    fillFormFromDetail(detail)
    if ((!detail.province || !detail.city) && detail.latitude != null && detail.longitude != null) {
      await resolveLocationMetaFromCoordinate(Number(detail.latitude), Number(detail.longitude), { silent: true })
    }
    applyEditorMeta()
    await focusCurrentMapTarget()
  } catch {
    if (requestVersion !== detailRequestVersion) return
    editingDetail.value = null
    resetForm()
    editorLoadError.value = '这段旅行暂时没有加载出来，你可以重新试一次，或先返回地图。'
    notify.error('地点详情加载失败')
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  goToMemoryMap()
}

function beforeImageUpload(file: File) {
  const result = validateImageFile(file, DEFAULT_IMAGE_MAX_MB)
  if (!result.valid) {
    notify.error(result.message)
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

function buildMemoryMapRoute() {
  const focusId = editingDetail.value?.id ?? editingId.value
  return {
    path: '/memory-map',
    query: focusId != null ? { focus: String(focusId) } : undefined,
  }
}

function goToMemoryMap() {
  router.push(buildMemoryMapRoute())
}

async function syncEditorPage() {
  const requestVersion = ++pageLoadVersion
  loading.value = true
  editorLoadError.value = ''
  if (!siteConfig.value?.siteName) {
    await loadSiteConfig().catch(() => null)
  }
  try {
    await loadList()
    if (requestVersion !== pageLoadVersion) return
    await loadEditingDetail()
  } finally {
    if (requestVersion === pageLoadVersion) {
      loading.value = false
    }
  }
}

function retryPageLoad() {
  void syncEditorPage()
}

function selectStop(index: number) {
  const nextIndex = Math.max(0, Math.min(index, form.stops.length - 1))
  selectedStopIndex.value = nextIndex
  expandedStopIndex.value = nextIndex
}

function isStopExpanded(index: number) {
  return expandedStopIndex.value === index
}

function collapseStop(index: number) {
  if (expandedStopIndex.value === index) {
    expandedStopIndex.value = null
  }
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
  stop.entries.forEach((entry, entryIndex) => {
    entry.stopCover = entryIndex === 0
  })
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
  result: { url: string; latitude?: number; longitude?: number },
  options: { stopIndex: number; cover?: boolean } = { stopIndex: 0 },
) {
  const stop = form.stops[options.stopIndex]
  if (!stop) return

  if (options.cover) {
    allEntries.value.forEach((entry) => {
      entry.cover = false
    })
  }
  const nextEntry: TravelMemoryEntryUpsertCommand = {
    imageUrl: result.url,
    remark: '',
    thanksNote: '',
    shotAt: '',
    displayOrder: stop.entries.length,
    cover: options.cover || allEntries.value.length === 0,
    stopCover: stop.entries.length === 0,
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
    await appendUploadedEntry(result, { stopIndex })
    if ((form.latitude == null || form.longitude == null) && result.latitude != null && result.longitude != null) {
      await applyLocationCoordinateSelection(result.latitude, result.longitude, { silent: true })
    }
    options.onSuccess?.(result as never)
    notify.success('片段照片上传成功')
  } catch (error) {
    options.onError?.(error as never)
    notify.error('照片上传失败')
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
    })
    if ((form.latitude == null || form.longitude == null) && result.latitude != null && result.longitude != null) {
      await applyLocationCoordinateSelection(result.latitude, result.longitude, { silent: true })
    }
    options.onSuccess?.(result as never)
    notify.success('封面图片上传成功')
  } catch (error) {
    options.onError?.(error as never)
    notify.error('封面上传失败')
  } finally {
    uploading.value = false
  }
}

function updateLocationCoordinateFields(latitude: number, longitude: number) {
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
      notify.success('已自动匹配省份和城市')
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
  await applyLocationCoordinateSelection(payload.latitude, payload.longitude)
  pickerMapRef.value?.focusPickerLocation(payload.latitude, payload.longitude)
}

async function handleExistingLocationSelect(id: number) {
  const target = list.value.find((item) => item.id === id)
  if (!target || target.latitude == null || target.longitude == null) return
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
    notify.info('先输入一个地点关键词，或者直接在地图上点一下位置。')
    return
  }
  locationSearchRequest.value += 1
}

function handleLocationSearchError(message: string) {
  notify.warning(message)
}

function zoomInPickerMap() {
  pickerMapRef.value?.zoomIn()
}

function zoomOutPickerMap() {
  pickerMapRef.value?.zoomOut()
}

function locateCurrentPosition() {
  if (!navigator.geolocation) {
    notify.warning('当前浏览器不支持自动定位')
    return
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude = position.coords.latitude
      const longitude = position.coords.longitude

      await applyLocationCoordinateSelection(latitude, longitude)
      pickerMapRef.value?.focusPickerLocation(latitude, longitude)
      notify.success('已定位到当前位置')
    },
    () => {
      notify.warning('自动定位失败，请手动搜索或点击地图选择')
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    },
  )
}

function clearCoordinateSelection() {
  form.latitude = undefined
  form.longitude = undefined
  form.province = ''
  form.city = ''
  lastResolvedAddress.value = ''
  locationMetaNeedsManualConfirm.value = false
}

function setTravelCover(stopIndex: number, entryIndex: number) {
  form.stops.forEach((stop, outerIndex) => {
    stop.entries.forEach((entry, innerIndex) => {
      entry.cover = outerIndex === stopIndex && innerIndex === entryIndex
    })
  })
}

function setTravelCoverFromOverlay(stopIndex: number, entryIndex: number) {
  setTravelCover(stopIndex, entryIndex)
  closeEntryActions()
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
}

function removeStop(stopIndex: number) {
  form.stops.splice(stopIndex, 1)
  if (!form.stops.length) {
    form.stops.push(createEmptyStop(0))
  }
  normalizeAllStops()
  selectStop(Math.min(stopIndex, form.stops.length - 1))
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

function moveEntryToIndex(stopIndex: number, fromIndex: number, toIndex: number) {
  const stop = form.stops[stopIndex]
  if (!stop || fromIndex === toIndex) return
  if (fromIndex < 0 || fromIndex >= stop.entries.length) return
  if (toIndex < 0 || toIndex >= stop.entries.length) return
  const [movedEntry] = stop.entries.splice(fromIndex, 1)
  stop.entries.splice(toIndex, 0, movedEntry)
  normalizeAllStops()
}

function moveEntryFromOverlay(stopIndex: number, entryIndex: number, direction: -1 | 1) {
  moveEntry(stopIndex, entryIndex, direction)
  closeEntryActions()
}

function removeEntry(stopIndex: number, entryIndex: number) {
  const stop = form.stops[stopIndex]
  if (!stop) return
  stop.entries.splice(entryIndex, 1)
  normalizeAllStops()
}

function removeEntryFromOverlay(stopIndex: number, entryIndex: number) {
  removeEntry(stopIndex, entryIndex)
  closeEntryActions()
}

function handleEntryDragStart(event: DragEvent, stopIndex: number, entryIndex: number) {
  draggingEntry.value = { stopIndex, entryIndex }
  closeEntryActions()
  event.dataTransfer?.setData('text/plain', `${stopIndex}:${entryIndex}`)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function handleEntryDragOver(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function handleEntryDrop(event: DragEvent, stopIndex: number, entryIndex: number) {
  event.preventDefault()
  const source = draggingEntry.value
  draggingEntry.value = null
  if (!source || source.stopIndex !== stopIndex) return
  moveEntryToIndex(stopIndex, source.entryIndex, entryIndex)
}

function handleEntryDragEnd() {
  draggingEntry.value = null
}

function validateStopsBeforeSave() {
  if (!form.stops.length) {
    notify.warning('至少需要保留一个旅途片段')
    return false
  }
  for (let stopIndex = 0; stopIndex < form.stops.length; stopIndex += 1) {
    const stop = form.stops[stopIndex]
    if (!stop.title.trim()) {
      notify.warning(`请补充第 ${stopIndex + 1} 个片段的标题`)
      selectStop(stopIndex)
      return false
    }
    if (!stop.entries.length) {
      notify.warning(`第 ${stopIndex + 1} 个片段还没有照片`)
      selectStop(stopIndex)
      return false
    }
  }
  return true
}

async function handleSave() {
  if (uploading.value) {
    notify.warning('照片还在上传中，请等上传完成后再保存')
    return
  }
  if (!form.title.trim()) {
    notify.warning('请输入地点标题')
    return
  }
  if (!hasPickedLocation.value) {
    notify.warning('请先在地图上选择主地点坐标')
    return
  }
  if (hasInvalidTravelDateRange.value) {
    notify.warning('旅行结束日期不能早于开始日期')
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
      sortOrder: stopIndex,
      entries: stop.entries.map((entry, entryIndex) => ({
        id: entry.id,
        imageUrl: entry.imageUrl,
        remark: entry.remark?.trim() || '',
        thanksNote: entry.thanksNote?.trim() || '',
        shotAt: stopEntryShotAt(stop),
        displayOrder: entryIndex,
        cover: !!entry.cover,
        stopCover: entryIndex === 0,
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
    notify.success(isEditMode.value ? '旅行地点更新成功' : '旅行地点创建成功')
    router.push({ name: 'TravelMemoryDetail', params: { id: saved.id } })
  } catch (error) {
    notify.error(resolveSaveErrorMessage(error))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void syncEditorPage()
})

watch(
  () => route.params.id,
  () => {
    void syncEditorPage()
  },
)
</script>

<style scoped lang="scss">
.travel-memory-create-page {
  width: min(1540px, calc(100vw - 72px));
  min-height: 100vh;
  margin: 0 auto;
  padding: 78px 0 calc(132px + env(safe-area-inset-bottom, 0));
  color: #43343c;
}

.travel-memory-editor-error {
  display: grid;
  gap: 16px;
  width: min(720px, 100%);
  margin: 56px auto 0;
  padding: 28px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 251, 252, 0.98), rgba(255, 245, 248, 0.94)),
    radial-gradient(circle at top right, rgba(255, 213, 226, 0.24), transparent 34%);
  border: 1px solid rgba(240, 210, 221, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 18px 36px rgba(223, 194, 205, 0.14);
}

.travel-memory-editor-error__copy {
  display: grid;
  gap: 8px;
}

.travel-memory-editor-error__copy strong {
  color: #6c4252;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
}

.travel-memory-editor-error__copy p {
  margin: 0;
  color: #7a5a68;
  font-size: 14px;
  line-height: 1.8;
}

.travel-memory-editor-error__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(238, 226, 235, 0.62);
  color: #a095a2;
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
  gap: 14px;
  padding: 24px;
}

.editor-card--stops .section-title--inline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
}

.editor-card--stops .inline-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
}

.section-action {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
  border-radius: 10px;
  border: 1px solid rgba(255, 177, 207, 0.92);
  color: #fb5d95;
  background: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.section-action--primary {
  border-color: rgba(255, 93, 148, 0.92);
  color: #fff;
  background: linear-gradient(135deg, #ff5d94, #ff79ab);
  box-shadow: 0 12px 24px rgba(255, 93, 148, 0.18);
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
  gap: 10px;
}

.stop-card {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  min-width: 0;
  padding: 0;
  border: 1px solid rgba(244, 224, 234, 0.96);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  box-shadow: 0 10px 22px rgba(213, 190, 203, 0.08);
}

.stop-card.is-active {
  border-color: rgba(255, 206, 224, 0.96);
  box-shadow: 0 12px 26px rgba(213, 190, 203, 0.12);
}

.stop-card.is-expanded {
  border-color: rgba(255, 151, 189, 0.9);
  box-shadow:
    0 0 0 2px rgba(255, 166, 200, 0.2),
    0 18px 34px rgba(213, 190, 203, 0.14);
}

.stop-editor-main {
  display: grid;
  gap: 18px;
  padding: 22px;
}

.stop-card__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.stop-number {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 91, 144, 0.92);
  font-size: 14px;
  font-weight: 900;
  box-shadow: 0 10px 20px rgba(255, 91, 144, 0.18);
}

.stop-title-main {
  display: block;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.stop-title-main h3 {
  margin: 0;
  color: #2f2730;
  font-size: 18px;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stop-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid rgba(245, 218, 230, 0.96);
  border-radius: 999px;
  color: #a88b9a;
  background: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.icon-button:hover:not(:disabled) {
  border-color: rgba(255, 151, 189, 0.88);
  color: #fb5f93;
  background: rgba(255, 247, 251, 0.98);
  box-shadow: 0 8px 18px rgba(245, 155, 188, 0.16);
  transform: translateY(-1px);
}

.icon-button:disabled {
  color: #d2c5ce;
  background: rgba(255, 255, 255, 0.62);
  cursor: not-allowed;
}

.icon-button--toggle {
  color: #8f7c88;
}

.stop-editor-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.82fr) minmax(540px, 1.18fr);
  gap: 26px;
  align-items: start;
}

.stop-fields-panel {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 2px 0 0;
}

.stop-date-field {
  width: min(260px, 100%);
}

.field--subsection {
  gap: 8px;
  min-width: 0;
}

.field--gallery {
  gap: 14px;
}

.stop-help {
  margin: 0;
  color: #918695;
  font-size: 12px;
  line-height: 1.55;
}

.photo-strip {
  display: grid;
  grid-template-columns: minmax(260px, 1.18fr) repeat(2, minmax(150px, 0.62fr));
  grid-auto-rows: minmax(112px, auto);
  gap: 12px;
  align-items: start;
}

.photo-strip.is-empty {
  grid-template-columns: minmax(220px, 320px);
  justify-content: start;
}

.photo-strip.is-single {
  grid-template-columns: minmax(420px, 600px) minmax(220px, 280px);
  justify-content: start;
  align-items: start;
}

.mini-photo {
  position: relative;
  display: grid;
  align-content: start;
  gap: 7px;
  min-width: 0;
  padding: 0;
  border-radius: 12px;
  border: 0;
  background: transparent;
  cursor: grab;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.mini-photo.is-dragging {
  opacity: 0.48;
  transform: scale(0.985);
}

.mini-photo__media {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(238, 226, 235, 0.96);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 20px rgba(213, 190, 203, 0.08);
}

.mini-photo.is-cover:not(:only-child) {
  grid-row: span 2;
}

.photo-strip.is-single .mini-photo {
  grid-column: auto;
  grid-row: auto;
  width: 100%;
  max-width: 600px;
}

.mini-photo img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 11;
  object-fit: cover;
  border-radius: 0;
}

.mini-photo.is-cover:not(:only-child) img {
  aspect-ratio: 4 / 3;
}

.photo-strip.is-single .mini-photo img {
  aspect-ratio: 16 / 9;
  max-height: 360px;
}

.mini-photo-badge {
  position: absolute;
  top: 10px;
  left: 10px;
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
  right: 46px;
  background: rgba(97, 86, 102, 0.92);
}

.mini-photo-drag-handle {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.46);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(40, 32, 38, 0.32);
  opacity: 0.58;
  pointer-events: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition:
    opacity 0.18s ease,
    background-color 0.18s ease,
    transform 0.18s ease;
}

.mini-photo:hover .mini-photo-drag-handle,
.mini-photo.is-dragging .mini-photo-drag-handle {
  opacity: 1;
  background: rgba(40, 32, 38, 0.5);
  transform: translateY(-1px);
}

.mini-photo__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex-wrap: wrap;
  gap: 7px;
  padding: 42px 10px 12px;
  background: linear-gradient(180deg, rgba(40, 32, 38, 0.04), rgba(40, 32, 38, 0.58));
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease;
}

.mini-photo:hover .mini-photo__overlay,
.mini-photo.is-action-open .mini-photo__overlay {
  opacity: 1;
  pointer-events: auto;
}

.mini-photo-overlay-action {
  min-height: 30px;
  padding: 0 11px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  font-size: 11px;
  font-weight: 800;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
}

.mini-photo-overlay-action.is-danger {
  color: #ffedf3;
  border-color: rgba(255, 161, 190, 0.58);
  background: rgba(255, 85, 132, 0.36);
}

.mini-photo__mobile-sort {
  display: none;
  gap: 7px;
}

.mini-photo__remark {
  min-width: 0;
  padding: 0 2px;
}

.mini-photo__remark-preview {
  width: 100%;
  min-height: 34px;
  padding: 0 2px;
  border: 0;
  color: #5f5962;
  background: transparent;
  font-size: 12px;
  line-height: 1.45;
  text-align: left;
  cursor: text;
}

.mini-photo__remark-preview.is-empty {
  color: #aaa1aa;
}

.photo-remark-input :deep(.el-input__wrapper) {
  min-height: 34px;
  border-radius: 10px;
}

.mini-photo-add {
  width: 100%;
  min-height: 100%;
  aspect-ratio: 16 / 11;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px dashed rgba(228, 214, 223, 0.96);
  border-radius: 14px;
  color: #5f5962;
  background: rgba(255, 255, 255, 0.86);
  cursor: pointer;
}

.photo-strip.is-empty .mini-photo-add {
  aspect-ratio: 4 / 3;
}

.photo-strip.is-single .mini-photo-add {
  min-height: 220px;
  aspect-ratio: 4 / 3;
}

.stop-photo-upload :deep(.el-upload) {
  display: block;
  width: 100%;
  height: 100%;
}

.stop-compact {
  width: 100%;
  min-height: 74px;
  display: grid;
  grid-template-columns: auto minmax(160px, 1fr) minmax(180px, auto) auto;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  border: 0;
  background: rgba(255, 255, 255, 0.84);
  color: #4f414b;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.stop-compact:hover {
  background: rgba(255, 250, 253, 0.96);
  box-shadow: inset 0 0 0 1px rgba(255, 196, 217, 0.72);
}

.stop-compact .stop-number {
  width: 34px;
  height: 34px;
  font-size: 13px;
}

.stop-compact__body {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.stop-compact__title {
  min-width: 0;
  overflow: hidden;
  color: #3d333b;
  font-size: 15px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stop-compact__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  color: #8d8190;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.stop-compact__meta span + span::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  margin-right: 12px;
  border-radius: 999px;
  background: rgba(224, 190, 207, 0.9);
  vertical-align: middle;
}

.stop-compact__thumbs {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  justify-content: flex-end;
}

.stop-compact__thumb {
  width: 70px;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 247, 251, 0.96);
  box-shadow: inset 0 0 0 1px rgba(238, 226, 235, 0.82);
}

.stop-compact__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stop-compact__empty {
  color: #918695;
  font-size: 13px;
  font-weight: 700;
}

.stop-compact__toggle {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(245, 218, 230, 0.96);
  border-radius: 999px;
  color: #a88b9a;
  background: rgba(255, 255, 255, 0.92);
  transition:
    border-color 0.18s ease,
    color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.stop-compact:hover .stop-compact__toggle {
  border-color: rgba(255, 151, 189, 0.88);
  color: #fb5f93;
  background: rgba(255, 247, 251, 0.98);
  box-shadow: 0 8px 18px rgba(245, 155, 188, 0.16);
  transform: translateY(-1px);
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

  .stop-editor-grid {
    grid-template-columns: 1fr;
  }

  .photo-strip {
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  }

  .photo-strip.is-single {
    grid-template-columns: minmax(320px, 520px) minmax(190px, 240px);
  }

  .photo-strip.is-single .mini-photo {
    max-width: 520px;
  }

  .photo-strip.is-single .mini-photo img {
    max-height: 320px;
  }

  .mini-photo.is-cover {
    grid-row: auto;
  }

  .stop-compact {
    grid-template-columns: auto minmax(140px, 1fr) auto;
  }

  .stop-compact__thumbs {
    display: none;
  }
}

@media (max-width: 760px) {
  .travel-memory-create-page {
    width: min(100vw - 18px, 100%);
    padding-bottom: calc(168px + env(safe-area-inset-bottom, 0));
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
  .photo-strip.is-empty,
  .photo-strip.is-single,
  .stop-editor-grid,
  .editor-card--stops .section-title--inline {
    grid-template-columns: 1fr;
  }

  .editor-card--stops .inline-actions {
    justify-content: flex-start;
  }

  .section-action {
    width: 100%;
  }

  .stop-editor-main {
    padding: 16px;
  }

  .date-range-row__divider {
    display: none;
  }

  .stop-card__header {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .stop-actions {
    justify-content: flex-start;
  }

  .mini-photo {
    cursor: default;
  }

  .mini-photo-drag-handle {
    opacity: 0.82;
  }

  .photo-strip.is-single .mini-photo {
    max-width: none;
  }

  .photo-strip.is-single .mini-photo img {
    max-height: none;
  }

  .photo-strip.is-single .mini-photo-add {
    min-height: 180px;
    aspect-ratio: 16 / 10;
  }

  .mini-photo__overlay {
    align-content: end;
    align-items: flex-end;
    padding: 46px 12px 14px;
  }

  .mini-photo__mobile-sort {
    display: flex;
  }

  .stop-compact {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    padding: 12px;
  }

  .stop-compact__meta,
  .stop-compact__thumbs {
    display: none;
  }

  .field-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .field-head__meta {
    white-space: normal;
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

