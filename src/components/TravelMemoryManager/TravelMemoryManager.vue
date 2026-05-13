<template>
  <section class="manager-shell glass-panel">
    <div class="manager-head">
      <div>
        <span class="eyebrow">Admin Tools</span>
        <h3>旅行地图管理</h3>
        <p>管理员可以直接在这里维护地点、照片、封面和展示状态，不用再切去后台页面。</p>
      </div>
      <div class="manager-actions">
        <el-button @click="loadList" :loading="loading">刷新</el-button>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新建地点
        </el-button>
      </div>
    </div>

    <div v-if="!list.length && !loading" class="manager-empty">
      还没有任何旅行地点，先新建一个吧。
    </div>
    <div v-else class="manager-list">
      <button
        v-for="item in list"
        :key="item.id"
        type="button"
        class="manager-card"
        :class="{ 'is-active': item.id === selectedId }"
        @click="emit('focus', item.id)"
      >
        <div class="manager-card__cover">
          <img v-if="item.coverImage" :src="item.coverImage" :alt="item.title" />
          <div v-else class="manager-card__placeholder">TRAVEL</div>
        </div>
        <div class="manager-card__body">
          <div class="manager-card__top">
            <div>
              <h4>{{ item.title }}</h4>
              <p>{{ formatLocation(item) }}</p>
            </div>
            <el-tag :type="item.status === 1 ? 'success' : 'info'" effect="plain">
              {{ item.status === 1 ? '展示' : '隐藏' }}
            </el-tag>
          </div>
          <div class="manager-card__meta">
            <span>{{ item.entryCount || 0 }} 张照片</span>
            <span>{{ formatDate(item.visitedAt) || '未填写到访时间' }}</span>
          </div>
          <div class="manager-card__actions">
            <el-button text type="primary" @click.stop="openEditDialog(item)">编辑</el-button>
            <el-button text type="danger" @click.stop="handleDelete(item)">删除</el-button>
          </div>
        </div>
      </button>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="min(1100px, 96vw)" top="4vh">
      <div class="editor-layout">
        <div class="editor-main">
          <el-form label-position="top" class="editor-form">
            <div class="form-grid">
              <el-form-item label="地点标题">
                <el-input v-model="form.title" placeholder="例如：成都春日散记" />
              </el-form-item>
              <el-form-item label="到访时间">
                <el-date-picker
                  v-model="form.visitedAt"
                  type="datetime"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  placeholder="可选"
                  class="w-full"
                />
              </el-form-item>
              <el-form-item label="省份">
                <el-input v-model="form.province" placeholder="例如：四川" />
              </el-form-item>
              <el-form-item label="城市">
                <el-input v-model="form.city" placeholder="例如：成都" />
              </el-form-item>
              <el-form-item label="纬度">
                <el-input-number v-model="form.latitude" :precision="6" :step="0.0001" class="w-full" />
              </el-form-item>
              <el-form-item label="经度">
                <el-input-number v-model="form.longitude" :precision="6" :step="0.0001" class="w-full" />
              </el-form-item>
              <el-form-item label="排序值">
                <el-input-number v-model="form.sortOrder" :min="0" :max="9999" class="w-full" />
              </el-form-item>
              <el-form-item label="展示状态">
                <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
              </el-form-item>
              <el-form-item label="地点简介" class="form-item--wide">
                <el-input
                  v-model="form.summaryNote"
                  type="textarea"
                  :rows="4"
                  maxlength="1000"
                  show-word-limit
                  placeholder="写一点这次停留的总说明吧"
                />
              </el-form-item>
            </div>

            <div class="coordinate-actions">
              <span class="coordinate-hint">右侧地图支持直接点选坐标；如果照片自带 EXIF 坐标，上传后也会自动回填。</span>
            </div>
          </el-form>

          <div class="entry-section">
            <div class="entry-section__head">
              <div>
                <h3>照片列表</h3>
                <p>上传多张照片后，可以分别填写备注、感想和拍摄时间。</p>
              </div>
              <el-upload
                :show-file-list="false"
                :before-upload="beforeImageUpload"
                :http-request="handleUploadEntryImage"
                accept="image/*"
                multiple
              >
                <el-button type="primary" :loading="uploading">上传照片</el-button>
              </el-upload>
            </div>

            <div v-if="!form.entries.length" class="entry-empty">至少需要上传一张照片。</div>
            <div v-else class="entry-grid">
              <article
                v-for="(entry, index) in form.entries"
                :key="entry.id || entry.imageUrl || index"
                class="entry-editor-card"
              >
                <div class="entry-editor-card__preview">
                  <img :src="entry.imageUrl" :alt="entry.remark || form.title || '旅行照片'" />
                </div>

                <div class="entry-editor-card__body">
                  <div class="entry-editor-card__head">
                    <el-tag :type="entry.cover ? 'danger' : 'info'" effect="plain">
                      {{ entry.cover ? '当前封面' : '普通照片' }}
                    </el-tag>
                    <div class="entry-actions">
                      <el-button text type="primary" @click="setCover(index)">设为封面</el-button>
                      <el-button text type="danger" @click="removeEntry(index)">删除</el-button>
                    </div>
                  </div>

                  <el-input v-model="entry.remark" placeholder="备注标题" />
                  <el-input
                    v-model="entry.thanksNote"
                    type="textarea"
                    :rows="3"
                    maxlength="2000"
                    show-word-limit
                    placeholder="为这张照片写一点感想"
                  />
                  <div class="entry-inline">
                    <el-date-picker
                      v-model="entry.shotAt"
                      type="datetime"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      placeholder="拍摄时间"
                      class="w-full"
                    />
                    <el-input-number v-model="entry.displayOrder" :min="0" :max="9999" class="w-full" />
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>

        <aside class="editor-side">
          <TravelMemoryMap
            :locations="list"
            picker-mode
            :picker-latitude="form.latitude ?? null"
            :picker-longitude="form.longitude ?? null"
            @pick="handlePickCoordinate"
          />
        </aside>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import type { UploadRequestOptions } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import TravelMemoryMap from '@/components/TravelMemoryMap/TravelMemoryMap.vue'
import {
  createTravelMemory,
  deleteTravelMemory,
  getAdminTravelMemories,
  updateTravelMemory,
} from '@/api/travel-memory'
import { uploadTravelMemoryImage } from '@/api/upload'
import type {
  CreateTravelMemoryCommand,
  TravelMemoryEntryUpsertCommand,
  TravelMemoryLocationDetail,
} from '@/types'
import { DEFAULT_IMAGE_MAX_MB, validateImageFile } from '@/utils/validation'

interface Props {
  selectedId?: number | null
}

withDefaults(defineProps<Props>(), {
  selectedId: null,
})

const emit = defineEmits<{
  (e: 'changed', payload: { selectedId?: number | null }): void
  (e: 'focus', id: number): void
}>()

const list = ref<TravelMemoryLocationDetail[]>([])
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)

const dialogTitle = computed(() => (editingId.value ? '编辑旅行地点' : '新建旅行地点'))

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
}

async function loadList() {
  loading.value = true
  try {
    list.value = await getAdminTravelMemories()
  } catch {
    ElMessage.error('旅行地点列表加载失败')
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row: TravelMemoryLocationDetail) {
  editingId.value = row.id
  Object.assign(form, {
    title: row.title || '',
    province: row.province || '',
    city: row.city || '',
    latitude: row.latitude,
    longitude: row.longitude,
    summaryNote: row.summaryNote || '',
    visitedAt: row.visitedAt || '',
    status: row.status ?? 1,
    sortOrder: row.sortOrder ?? 0,
    entries: (row.entries || []).map((entry) => ({
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
  dialogVisible.value = true
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
    if ((form.latitude == null || form.longitude == null) && result.latitude != null && result.longitude != null) {
      form.latitude = result.latitude
      form.longitude = result.longitude
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

function handlePickCoordinate(payload: { latitude: number; longitude: number }) {
  form.latitude = Number(payload.latitude.toFixed(6))
  form.longitude = Number(payload.longitude.toFixed(6))
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
        ...entry,
        remark: entry.remark?.trim() || '',
        thanksNote: entry.thanksNote?.trim() || '',
        displayOrder: entry.displayOrder ?? index,
        cover: !!entry.cover,
        geoSource: entry.geoSource || 'NONE',
      })),
    }

    const saved = editingId.value
      ? await updateTravelMemory(editingId.value, payload)
      : await createTravelMemory(payload)
    ElMessage.success(editingId.value ? '旅行地点更新成功' : '旅行地点创建成功')
    dialogVisible.value = false
    await loadList()
    emit('changed', { selectedId: saved.id })
    emit('focus', saved.id)
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: TravelMemoryLocationDetail) {
  try {
    await ElMessageBox.confirm(`确定删除地点“${row.title}”吗？`, '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  try {
    await deleteTravelMemory(row.id)
    ElMessage.success('地点删除成功')
    await loadList()
    emit('changed', { selectedId: null })
  } catch {
    ElMessage.error('删除失败')
  }
}

function formatDate(value?: string) {
  return value ? dayjs(value).format('YYYY.MM.DD HH:mm') : ''
}

function formatLocation(location?: { province?: string; city?: string }) {
  return [location?.province, location?.city].filter(Boolean).join(' · ') || '未标注地点'
}

defineExpose({
  loadList,
})

onMounted(() => {
  void loadList()
})
</script>

<style scoped lang="scss">
.glass-panel {
  border-radius: 28px;
  padding: 24px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 248, 251, 0.76)),
    radial-gradient(circle at top right, rgba(255, 221, 232, 0.24), transparent 34%);
  border: 1px solid rgba(236, 220, 228, 0.82);
  box-shadow: 0 18px 40px rgba(215, 184, 196, 0.12);
}

.eyebrow {
  display: inline-block;
  color: #c57f9a;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.manager-shell {
  display: grid;
  gap: 20px;
}

.manager-head,
.manager-actions,
.manager-card__top,
.manager-card__meta,
.manager-card__actions,
.coordinate-actions {
  display: flex;
  gap: 12px;
}

.manager-head,
.manager-card__top,
.manager-card__meta {
  justify-content: space-between;
}

.manager-head {
  align-items: flex-start;
  flex-wrap: wrap;

  h3 {
    margin: 8px 0 6px;
    color: var(--text-primary);
    font-size: 24px;
  }

  p {
    color: var(--text-secondary);
    line-height: 1.7;
  }
}

.manager-actions {
  flex-wrap: wrap;
}

.manager-empty {
  min-height: 160px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  border: 1px dashed rgba(235, 219, 228, 0.92);
  color: var(--text-secondary);
  text-align: center;
}

.manager-list {
  display: grid;
  gap: 16px;
}

.manager-card {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(239, 226, 233, 0.9);
  background: rgba(255, 255, 255, 0.72);
  text-align: left;
  cursor: pointer;
  transition: transform 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease;

  &:hover,
  &.is-active {
    transform: translateY(-2px);
    border-color: rgba(255, 176, 201, 0.88);
    box-shadow: 0 18px 30px rgba(255, 174, 197, 0.14);
  }
}

.manager-card__cover {
  height: 152px;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 238, 244, 0.94), rgba(245, 249, 255, 0.82));

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.manager-card__placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #be8ca2;
  letter-spacing: 0.18em;
  font-size: 12px;
}

.manager-card__body {
  display: grid;
  gap: 12px;
  min-width: 0;

  h4 {
    margin: 0 0 6px;
    color: var(--text-primary);
    font-size: 18px;
  }

  p {
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.manager-card__top {
  align-items: flex-start;
}

.manager-card__meta {
  flex-wrap: wrap;
  color: var(--text-tertiary);
  font-size: 12px;
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
}

.editor-form,
.entry-section {
  display: grid;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-item--wide {
  grid-column: 1 / -1;
}

.coordinate-hint,
.entry-section__head p {
  color: var(--text-tertiary);
  font-size: 13px;
}

.entry-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  h3 {
    margin: 0 0 6px;
    color: var(--text-primary);
  }
}

.entry-empty {
  min-height: 140px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  border: 1px dashed rgba(235, 219, 228, 0.92);
  color: var(--text-tertiary);
}

.entry-grid {
  display: grid;
  gap: 16px;
}

.entry-editor-card {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 16px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(236, 220, 228, 0.86);
  background: rgba(255, 251, 253, 0.8);
}

.entry-editor-card__preview {
  height: 180px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(249, 244, 247, 0.86);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.entry-editor-card__body {
  display: grid;
  gap: 12px;
}

.entry-editor-card__head,
.entry-actions,
.entry-inline {
  display: flex;
  align-items: center;
  gap: 12px;
}

.entry-editor-card__head {
  justify-content: space-between;
  flex-wrap: wrap;
}

.entry-inline > * {
  flex: 1;
}

@media (max-width: 1100px) {
  .manager-card,
  .editor-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .manager-head,
  .manager-card__top,
  .manager-card__meta,
  .entry-section__head {
    flex-direction: column;
  }

  .form-grid,
  .entry-editor-card {
    grid-template-columns: 1fr;
  }
}
</style>
