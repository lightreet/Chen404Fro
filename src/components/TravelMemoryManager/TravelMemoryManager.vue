<template>
  <section class="manager-shell">
    <div v-if="showToolbar" class="manager-toolbar">
      <div class="manager-toolbar__controls">
        <div class="manager-actions">
          <el-button @click="loadList" :loading="loading">刷新地点</el-button>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>
            新增旅游地点
          </el-button>
          <el-button :disabled="!activeLocation" @click="openCurrentEditDialog">
            编辑当前地点
          </el-button>
          <el-button :disabled="!activeLocation" type="danger" plain @click="confirmDeleteCurrent">
            删除当前地点
          </el-button>
        </div>
      </div>
    </div>

    <el-drawer
      v-model="drawerVisible"
      class="travel-memory-drawer"
      direction="rtl"
      :size="'min(680px, 94vw)'"
      :append-to-body="true"
      :destroy-on-close="false"
    >
      <template #header>
        <div class="drawer-header">
          <div>
            <span class="eyebrow">Memory Editor</span>
            <h3>{{ dialogTitle }}</h3>
            <p>{{ editingId ? '把这一站的地点信息、坐标和照片收进同一页手账里。' : '从这里新建一枚新的樱花印章。' }}</p>
          </div>
          <div class="drawer-header__meta">
            <span>{{ list.length }} 个地点</span>
            <span>{{ form.entries.length }} 张照片</span>
          </div>
        </div>
      </template>

      <div class="drawer-body">
        <section v-if="list.length" class="drawer-switcher">
          <button
            v-for="item in list"
            :key="item.id"
            type="button"
            class="drawer-switcher__chip"
            :class="{ 'is-active': editingId === item.id }"
            @click="openEditDialog(item)"
          >
            <strong>{{ item.title }}</strong>
            <span>{{ item.city || item.province || '未标注城市' }}</span>
          </button>
        </section>

        <div class="editor-sheet">
          <el-form label-position="top" class="editor-form">
            <div class="form-grid">
              <el-form-item label="地点标题" class="form-item--wide">
                <el-input v-model="form.title" placeholder="例如：厦门" />
              </el-form-item>
              <el-form-item label="省份">
                <el-input v-model="form.province" placeholder="例如：福建省" />
              </el-form-item>
              <el-form-item label="城市">
                <el-input v-model="form.city" placeholder="例如：厦门市" />
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
                  :rows="3"
                  maxlength="1000"
                  show-word-limit
                  placeholder="一段旅途走它的海出场，慢节奏，藏着风和久违温柔。"
                />
              </el-form-item>
              <el-form-item label="是否展示">
                <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
              </el-form-item>
              <el-form-item label="排序值">
                <el-input-number v-model="form.sortOrder" :min="0" :max="9999" class="w-full" />
              </el-form-item>
            </div>
          </el-form>

          <section class="editor-card">
            <div class="editor-card__head">
              <h4>位置坐标</h4>
              <p>点击小地图直接调整坐标，照片 EXIF 也会自动回填。</p>
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
                <el-form-item label="纬度">
                  <el-input-number v-model="form.latitude" :precision="6" :step="0.0001" class="w-full" />
                </el-form-item>
                <el-form-item label="经度">
                  <el-input-number v-model="form.longitude" :precision="6" :step="0.0001" class="w-full" />
                </el-form-item>
                <button type="button" class="coordinate-adjust-hint">在地图上调整</button>
              </div>
            </div>
          </section>

          <section class="editor-card">
            <div class="editor-card__head editor-card__head--split">
              <div>
                <h4>封面图片</h4>
                <p>当前地点最先展示的一张照片。</p>
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
            <div class="entry-section__head">
              <div>
                <h4>照片记忆</h4>
                <p>编辑当前选中照片的标题、感想和时间。</p>
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
            <div v-else-if="selectedEntry" class="entry-editor-panel">
              <div class="entry-editor-panel__preview">
                <img :src="selectedEntry.imageUrl" :alt="selectedEntry.remark || form.title || '旅行照片'" />
              </div>

              <div class="entry-editor-panel__body">
                <div class="entry-editor-panel__actions">
                  <el-tag :type="selectedEntry.cover ? 'danger' : 'info'" effect="plain">
                    {{ selectedEntry.cover ? '当前封面' : '普通照片' }}
                  </el-tag>
                  <div class="entry-actions">
                    <el-button text type="primary" @click="setCover(selectedEntryIndex)">设为封面</el-button>
                    <el-button text type="danger" @click="removeEntry(selectedEntryIndex)">删除</el-button>
                  </div>
                </div>

                <el-input v-model="selectedEntry.remark" placeholder="备注标题" />
                <el-input
                  v-model="selectedEntry.thanksNote"
                  type="textarea"
                  :rows="3"
                  maxlength="2000"
                  show-word-limit
                  placeholder="为这张照片写一点感想"
                />
                <div class="entry-inline">
                  <el-date-picker
                    v-model="selectedEntry.shotAt"
                    type="datetime"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    placeholder="拍摄时间"
                    class="w-full"
                  />
                  <el-input-number v-model="selectedEntry.displayOrder" :min="0" :max="9999" class="w-full" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button v-if="editingId" type="danger" plain @click="confirmDeleteCurrent">删除地点</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">保存地点</el-button>
        </div>
      </div>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
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
  activeLocation?: TravelMemoryLocationDetail | null
  showToolbar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null,
  activeLocation: null,
  showToolbar: true,
})

const emit = defineEmits<{
  (e: 'changed', payload: { selectedId?: number | null }): void
  (e: 'focus', id: number): void
}>()

const list = ref<TravelMemoryLocationDetail[]>([])
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const drawerVisible = ref(false)
const editingId = ref<number | null>(null)
const selectedEntryIndex = ref(0)

const dialogTitle = computed(() => (editingId.value ? '编辑旅行地点' : '新建旅行地点'))
const currentEditingLocation = computed(() =>
  editingId.value != null ? list.value.find((item) => item.id === editingId.value) || null : null,
)
const selectedEntry = computed(() => form.entries[selectedEntryIndex.value] || null)
const coverEntry = computed(() => form.entries.find((entry) => entry.cover) || form.entries[0] || null)

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
  drawerVisible.value = true
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
  selectedEntryIndex.value = 0
  drawerVisible.value = true
}

function openCurrentEditDialog() {
  if (!props.activeLocation) {
    ElMessage.info('先选择一个地点，再进行编辑。')
    return
  }
  openEditDialog(props.activeLocation)
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
    drawerVisible.value = false
    await loadList()
    emit('changed', { selectedId: saved.id })
    emit('focus', saved.id)
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(row: TravelMemoryLocationDetail) {
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

function confirmDeleteCurrent() {
  const target = currentEditingLocation.value || props.activeLocation
  if (!target) {
    ElMessage.info('先选择一个地点，再进行删除。')
    return
  }
  void confirmDelete(target)
}

defineExpose({
  loadList,
  openCreateDialog,
  openEditDialog,
  confirmDelete,
})

onMounted(() => {
  void loadList()
})
</script>

<style scoped lang="scss">
.manager-shell {
  position: relative;
}

.manager-toolbar {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  background:
    linear-gradient(145deg, rgba(255, 252, 253, 0.94), rgba(255, 245, 248, 0.82)),
    radial-gradient(circle at top right, rgba(255, 219, 230, 0.2), transparent 38%);
  border: 1px solid rgba(239, 220, 227, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 14px 28px rgba(219, 190, 201, 0.12);
  backdrop-filter: blur(12px);
}

.eyebrow {
  display: inline-block;
  color: #c57f9a;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.manager-toolbar__controls,
.manager-actions,
.coordinate-actions,
.entry-editor-card__head,
.entry-actions,
.entry-inline {
  display: flex;
  align-items: center;
  gap: 12px;
}

.manager-toolbar__controls {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.manager-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding-right: 8px;

  h3 {
    margin: 4px 0 6px;
    color: #51353f;
    font-size: 22px;
    font-weight: 600;
  }

  p {
    color: var(--text-secondary);
    line-height: 1.65;
    font-size: 13px;
  }
}

.drawer-header__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  span {
    min-height: 34px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    background: rgba(255, 245, 248, 0.82);
    border: 1px solid rgba(241, 220, 229, 0.9);
    color: #7b5c68;
    font-size: 12px;
  }
}

.drawer-body {
  display: grid;
  gap: 14px;
  height: 100%;
  padding: 6px 2px 12px;
}

.drawer-switcher {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(132px, 148px);
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.drawer-switcher__chip {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(237, 220, 228, 0.92);
  background: rgba(255, 252, 253, 0.78);
  text-align: left;
  cursor: pointer;
  transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;

  strong {
    color: #51353f;
    font-size: 14px;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  &:hover,
  &.is-active {
    transform: translateY(-2px);
    border-color: rgba(245, 163, 189, 0.9);
    box-shadow: 0 16px 24px rgba(224, 184, 197, 0.18);
  }
}

.editor-sheet,
.editor-form,
.entry-section {
  display: grid;
  gap: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 12px;
}

.form-item--wide {
  grid-column: 1 / -1;
}

.editor-card {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid rgba(236, 220, 228, 0.88);
  background:
    linear-gradient(180deg, rgba(255, 252, 253, 0.94), rgba(255, 248, 250, 0.9)),
    radial-gradient(circle at top right, rgba(255, 218, 230, 0.12), transparent 42%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 14px 26px rgba(223, 188, 198, 0.08);
}

.editor-card__head {
  display: grid;
  gap: 4px;

  h4 {
    margin: 0;
    color: #563943;
    font-size: 15px;
  }
}

.editor-card__head--split {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.editor-card__head p,
.entry-section__head p {
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}

.coordinate-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(160px, 0.85fr);
  gap: 12px;
  align-items: start;
}

.editor-map-card {
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(237, 221, 228, 0.92);
  background: rgba(255, 255, 255, 0.74);
}

.editor-map-card :deep(.travel-map-shell.is-picker-mode) {
  min-height: 160px;
  border-radius: 18px;
  box-shadow: none;
}

.editor-map-card :deep(.travel-map-canvas) {
  min-height: 160px;
}

.coordinate-fields {
  display: grid;
  gap: 10px;
}

.coordinate-fields :deep(.el-form-item) {
  margin-bottom: 0;
}

.coordinate-adjust-hint {
  min-height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(241, 194, 206, 0.88);
  background: rgba(255, 247, 249, 0.92);
  color: #d77493;
  font-size: 13px;
  cursor: pointer;
}

.cover-preview-row {
  display: grid;
}

.cover-preview-card {
  height: 108px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(237, 221, 228, 0.92);
  background: rgba(255, 255, 255, 0.76);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.cover-action {
  min-width: 104px;
}

.thumbnail-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
  gap: 10px;
}

.thumbnail-chip {
  position: relative;
  height: 68px;
  padding: 0;
  border: 1px solid rgba(237, 221, 228, 0.92);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover,
  &.is-active {
    transform: translateY(-1px);
    border-color: rgba(236, 147, 177, 0.86);
    box-shadow: 0 10px 20px rgba(225, 180, 193, 0.16);
  }
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
  background: rgba(255, 248, 250, 0.92);
  color: #d46d8d;
  font-size: 10px;
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
  min-height: 120px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  border: 1px dashed rgba(235, 219, 228, 0.92);
  color: var(--text-tertiary);
}

.entry-empty--compact {
  min-height: 88px;
}

.entry-editor-panel {
  display: grid;
  grid-template-columns: 152px minmax(0, 1fr);
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(236, 220, 228, 0.86);
  background: rgba(255, 251, 253, 0.8);
}

.entry-editor-panel__preview {
  height: 152px;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(249, 244, 247, 0.86);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.entry-editor-panel__body {
  display: grid;
  gap: 10px;
}

.entry-editor-panel__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.entry-inline > * {
  flex: 1;
}

.drawer-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 0 2px;
  background: linear-gradient(180deg, rgba(255, 250, 252, 0), rgba(255, 250, 252, 0.95) 36%);
}

:deep(.travel-memory-drawer) {
  border-top-left-radius: 30px;
  border-bottom-left-radius: 30px;
  overflow: hidden;
}

:deep(.travel-memory-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 18px 20px 10px;
  background:
    linear-gradient(145deg, rgba(255, 252, 253, 0.94), rgba(255, 245, 248, 0.82)),
    radial-gradient(circle at top right, rgba(255, 219, 230, 0.18), transparent 42%);
  border-bottom: 1px solid rgba(239, 220, 227, 0.82);
}

:deep(.travel-memory-drawer .el-drawer__body) {
  padding: 0 20px 14px;
  background:
    linear-gradient(180deg, rgba(255, 252, 253, 0.96), rgba(255, 247, 250, 0.94)),
    radial-gradient(circle at top right, rgba(255, 218, 230, 0.14), transparent 40%);
}

@media (max-width: 1100px) {
  .manager-toolbar__controls {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .entry-section__head {
    align-items: flex-start;
  }

  .manager-toolbar__controls,
  .manager-actions,
  .entry-section__head,
  .drawer-header,
  .drawer-footer,
  .editor-card__head--split {
    flex-direction: column;
  }

  .form-grid,
  .coordinate-layout,
  .entry-editor-panel {
    grid-template-columns: 1fr;
  }

  .drawer-header__meta,
  .drawer-footer {
    width: 100%;
    justify-content: flex-start;
  }

  .cover-action {
    width: 100%;
  }
}
</style>
