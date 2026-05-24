<template>
  <section class="manager-shell">
    <div v-if="showToolbar" class="manager-toolbar">
      <div class="manager-toolbar__controls">
        <div class="manager-actions">
          <el-button @click="loadList" :loading="loading">刷新地点</el-button>
          <el-button type="primary" @click="goCreatePage">
            <el-icon><Plus /></el-icon>
            新增旅游地点
          </el-button>
          <el-button :disabled="!activeLocation" @click="goCurrentEditPage">
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
      :size="'min(760px, 96vw)'"
      :append-to-body="true"
      :destroy-on-close="false"
    >
      <template #header>
        <div class="drawer-header">
          <div>
            <h3>{{ dialogTitle }}</h3>
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
          <section class="editor-card editor-card--intro">
            <div class="section-head">
              <span class="section-mark">1</span>
              <div class="section-copy">
                <h4>地点信息</h4>
              </div>
            </div>

            <el-form label-position="top" class="editor-form">
              <div class="form-grid form-grid--intro">
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

          <section class="editor-card editor-card--coordinate">
            <div class="section-head">
              <span class="section-mark">2</span>
              <div class="section-copy">
                <h4>位置坐标</h4>
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
                <el-form-item label="纬度（WGS84）">
                  <el-input-number v-model="form.latitude" :precision="6" :step="0.0001" class="w-full" />
                </el-form-item>
                <el-form-item label="经度（WGS84）">
                  <el-input-number v-model="form.longitude" :precision="6" :step="0.0001" class="w-full" />
                </el-form-item>
                <button type="button" class="coordinate-adjust-hint">在地图上调整</button>
              </div>
            </div>
          </section>

          <section class="entry-section editor-card">
            <div class="section-head section-head--split">
              <div class="section-head__main">
                <span class="section-mark">3</span>
                <div class="section-copy">
                  <h4>照片记忆</h4>
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
                <el-button class="section-upload-btn" type="primary" plain :loading="uploading">上传照片</el-button>
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
                <el-button class="entry-empty__button" type="primary" plain :loading="uploading">上传第一张照片</el-button>
              </el-upload>
            </div>

            <div v-else class="entry-board">
              <article
                v-for="(entry, index) in form.entries"
                :key="entry.id || entry.imageUrl || index"
                class="memory-entry-card"
                :class="{ 'is-active': selectedEntryIndex === index }"
              >
                <button type="button" class="memory-entry-card__preview" @click="selectedEntryIndex = index">
                  <img :src="entry.imageUrl" :alt="entry.remark || form.title || `旅行照片 ${index + 1}`" />
                </button>

                <div class="memory-entry-card__fields">
                  <div class="memory-entry-card__meta">
                    <span>备注标题</span>
                    <button type="button" class="entry-inline-action" @click="selectedEntryIndex = index">聚焦编辑</button>
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
                    <el-button text type="danger" @click="removeEntry(index)">删除</el-button>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div class="drawer-footer">
          <el-button class="footer-button footer-button--neutral" @click="drawerVisible = false">取消</el-button>
          <el-button v-if="editingId" class="footer-button footer-button--danger" type="danger" plain @click="confirmDeleteCurrent">删除地点</el-button>
          <el-button class="footer-button footer-button--save" type="primary" :loading="saving" @click="handleSave">保存地点</el-button>
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
import { useRouter } from 'vue-router'
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
import { normalizeCoordinate } from '@/utils/coordinate'
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

const router = useRouter()

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

function goCreatePage() {
  router.push({ name: 'TravelMemoryCreate' })
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

function goCurrentEditPage() {
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
      const coordinate = normalizeCoordinate(result.latitude, result.longitude)
      form.latitude = coordinate.latitude
      form.longitude = coordinate.longitude
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
  const coordinate = normalizeCoordinate(payload.latitude, payload.longitude)
  form.latitude = coordinate.latitude
  form.longitude = coordinate.longitude
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
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-right: 8px;

  h3 {
    margin: 0;
    color: #5d4037;
    font-size: 22px;
    font-weight: 700;
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
    background: rgba(247, 238, 229, 0.92);
    border: 1px solid rgba(228, 212, 198, 0.96);
    color: #8a6759;
    font-size: 12px;
  }
}

.drawer-body {
  display: grid;
  gap: 12px;
  height: 100%;
  padding: 4px 2px 18px;
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
  border: 1px solid rgba(231, 217, 206, 0.96);
  background: rgba(252, 247, 241, 0.88);
  text-align: left;
  cursor: pointer;
  transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;

  strong {
    color: #66483d;
    font-size: 14px;
  }

  span {
    color: #a28779;
    font-size: 12px;
  }

  &:hover,
  &.is-active {
    transform: translateY(-2px);
    border-color: rgba(223, 173, 156, 0.94);
    box-shadow: 0 16px 24px rgba(219, 194, 178, 0.18);
  }
}

.editor-sheet,
.editor-form,
.entry-section {
  display: grid;
  gap: 14px;
}

.editor-sheet {
  padding-bottom: 14px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.section-head--split {
  justify-content: space-between;
  gap: 16px;
}

.section-head__main {
  display: flex;
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
  background: linear-gradient(135deg, rgba(232, 191, 173, 0.96), rgba(244, 220, 204, 0.96));
  color: #79564a;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 10px 20px rgba(218, 189, 170, 0.24);
}

.section-copy {
  min-width: 0;
}

.section-copy h4 {
  margin: 0;
  color: #63463b;
  font-size: 16px;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-grid--intro {
  gap: 14px 12px;
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
  background: rgba(251, 245, 239, 0.94);
  border: 1px solid rgba(231, 216, 204, 0.94);
  color: #8a6a5d;
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
  padding: 17px;
  border-radius: 24px;
  border: 1px solid rgba(230, 216, 204, 0.92);
  background:
    linear-gradient(180deg, rgba(252, 249, 245, 0.97), rgba(249, 243, 236, 0.94)),
    radial-gradient(circle at top right, rgba(243, 224, 210, 0.14), transparent 42%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 14px 26px rgba(212, 191, 177, 0.1);
}

.coordinate-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(176px, 0.95fr);
  gap: 14px;
  align-items: start;
}

.editor-map-card {
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(228, 214, 202, 0.94);
  background: rgba(255, 252, 249, 0.88);
}

.editor-map-card :deep(.travel-map-shell.is-picker-mode) {
  min-height: 170px;
  border-radius: 18px;
  box-shadow: none;
}

.editor-map-card :deep(.travel-map-canvas) {
  min-height: 170px;
}

.coordinate-fields {
  display: grid;
  gap: 10px;
}

.coordinate-fields :deep(.el-form-item) {
  margin-bottom: 0;
}

.coordinate-adjust-hint {
  min-height: 38px;
  border-radius: 999px;
  border: 1px solid rgba(227, 195, 178, 0.92);
  background: rgba(252, 245, 239, 0.96);
  color: #bb7e67;
  font-size: 13px;
  cursor: pointer;
}

:deep(.section-upload-btn),
:deep(.entry-empty__button) {
  --el-button-bg-color: rgba(251, 245, 239, 0.96);
  --el-button-border-color: rgba(226, 196, 180, 0.96);
  --el-button-hover-bg-color: rgba(248, 238, 229, 0.98);
  --el-button-hover-border-color: rgba(220, 190, 174, 0.98);
  --el-button-active-bg-color: rgba(244, 233, 224, 1);
  --el-button-active-border-color: rgba(214, 184, 168, 1);
  --el-button-text-color: #b77461;
  border-color: rgba(226, 196, 180, 0.96) !important;
  background: rgba(251, 245, 239, 0.96) !important;
  color: #b77461 !important;
  box-shadow: none !important;
}

.entry-empty {
  min-height: 120px;
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 18px;
  border-radius: 18px;
  border: 1px dashed rgba(229, 213, 201, 0.94);
  color: #a28a7e;
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
  width: min(100%, 920px);
  grid-template-columns: minmax(170px, 210px) minmax(0, 1fr);
  align-items: start;
  gap: 18px;
  padding: 13px;
  border-radius: 20px;
  border: 1px solid rgba(230, 216, 204, 0.92);
  background: rgba(253, 249, 245, 0.92);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.memory-entry-card:hover,
.memory-entry-card.is-active {
  transform: translateY(-2px);
  border-color: rgba(219, 172, 159, 0.95);
  box-shadow: 0 16px 28px rgba(217, 193, 177, 0.16);
}

.memory-entry-card__preview {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  padding: 0;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(228, 214, 202, 0.94);
  background:
    linear-gradient(135deg, rgba(253, 249, 245, 0.96), rgba(248, 242, 236, 0.9)),
    radial-gradient(circle at center, rgba(242, 224, 211, 0.22), transparent 58%);
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
  }
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
  color: #8a6a5d;
  font-size: 12px;
}

.entry-inline-action {
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(231, 208, 193, 0.94);
  background: rgba(249, 241, 234, 0.94);
  color: #bf826d;
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

  span {
    color: #8a6a5d;
    font-size: 12px;
  }
}

.memory-entry-card__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 2px;
  border-top: 1px dashed rgba(229, 214, 202, 0.94);
}

.memory-entry-card__actions :deep(.el-button) {
  min-height: 28px;
  padding: 0 6px;
  border-radius: 999px;
}

.memory-entry-card__actions :deep(.el-button + .el-button) {
  margin-left: 8px;
}

.drawer-footer {
  position: relative;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 16px 10px;
  margin: 10px 0 0;
  border: 1px solid rgba(229, 214, 202, 0.94);
  border-radius: 20px 20px 0 0;
  background:
    linear-gradient(180deg, rgba(252, 248, 243, 0.94), rgba(249, 243, 236, 0.98)),
    radial-gradient(circle at top center, rgba(242, 224, 211, 0.22), transparent 52%);
  box-shadow: 0 -8px 20px rgba(214, 191, 176, 0.1);
  backdrop-filter: blur(10px);
}

:deep(.footer-button) {
  border-radius: 14px;
}

:deep(.footer-button--neutral) {
  border-color: rgba(229, 214, 202, 0.94) !important;
  background: rgba(252, 248, 243, 0.96) !important;
  color: #8a6759 !important;
}

:deep(.footer-button--danger) {
  border-color: rgba(233, 206, 196, 0.96) !important;
  background: rgba(252, 245, 240, 0.94) !important;
  color: #c98874 !important;
}

:deep(.footer-button--save) {
  color: #fff !important;
  border-color: rgba(213, 147, 126, 0.96) !important;
  background: linear-gradient(135deg, rgba(218, 153, 131, 0.98), rgba(231, 176, 156, 0.98)) !important;
  box-shadow: 0 10px 18px rgba(214, 180, 164, 0.18) !important;
}

:deep(.travel-memory-drawer) {
  width: min(760px, 96vw) !important;
  border-top-left-radius: 30px;
  border-bottom-left-radius: 30px;
  overflow: hidden;
}

:deep(.travel-memory-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 18px 20px 10px;
  background:
    linear-gradient(145deg, rgba(252, 248, 243, 0.96), rgba(248, 240, 232, 0.9)),
    radial-gradient(circle at top right, rgba(242, 224, 211, 0.2), transparent 42%);
  border-bottom: 1px solid rgba(229, 214, 202, 0.9);
}

:deep(.travel-memory-drawer .el-drawer__body) {
  padding: 0 20px 14px;
  background:
    linear-gradient(180deg, rgba(251, 247, 242, 0.98), rgba(248, 241, 234, 0.96)),
    radial-gradient(circle at top right, rgba(243, 224, 210, 0.14), transparent 40%);
}

:deep(.travel-memory-drawer .el-form-item) {
  margin-bottom: 0;
}

:deep(.travel-memory-drawer .el-form-item__label) {
  padding-bottom: 7px;
  color: #785b4f;
  font-size: 12px;
  font-weight: 600;
}

:deep(.travel-memory-drawer .el-input__wrapper),
:deep(.travel-memory-drawer .el-textarea__inner),
:deep(.travel-memory-drawer .el-input-number),
:deep(.travel-memory-drawer .el-date-editor.el-input__wrapper),
:deep(.travel-memory-drawer .el-date-editor .el-input__wrapper) {
  border-radius: 14px;
  width: 100%;
}

:deep(.travel-memory-drawer .el-input__wrapper),
:deep(.travel-memory-drawer .el-input-number__decrease),
:deep(.travel-memory-drawer .el-input-number__increase),
:deep(.travel-memory-drawer .el-textarea__inner) {
  background: rgba(253, 249, 245, 0.96);
  box-shadow: 0 0 0 1px rgba(227, 213, 201, 0.96) inset;
}

:deep(.travel-memory-drawer .el-date-editor) {
  width: 100%;
}

:deep(.travel-memory-drawer .el-input-number) {
  width: 100%;
}

:deep(.travel-memory-drawer .el-input__wrapper.is-focus),
:deep(.travel-memory-drawer .el-textarea__inner:focus),
:deep(.travel-memory-drawer .el-input-number.is-controls-right .el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px rgba(210, 145, 125, 0.98) inset,
    0 0 0 4px rgba(242, 221, 207, 0.56);
}

:deep(.travel-memory-drawer .el-button) {
  border-radius: 14px;
}

:deep(.travel-memory-drawer .el-button--primary),
:deep(.travel-memory-drawer .el-button--primary:hover),
:deep(.travel-memory-drawer .el-button--primary:focus-visible) {
  --el-button-bg-color: #da9983;
  --el-button-border-color: #d5957d;
  --el-button-hover-bg-color: #df9f88;
  --el-button-hover-border-color: #db9b84;
  --el-button-active-bg-color: #cd8c75;
  --el-button-active-border-color: #cb8b74;
  --el-button-text-color: #fff;
  color: #fff !important;
  border-color: rgba(213, 147, 126, 0.96) !important;
  background: linear-gradient(135deg, rgba(218, 153, 131, 0.98), rgba(231, 176, 156, 0.98)) !important;
  box-shadow: 0 10px 18px rgba(214, 180, 164, 0.18);
}

:deep(.travel-memory-drawer .el-button--primary.is-plain),
:deep(.travel-memory-drawer .el-button--primary.is-plain:hover),
:deep(.travel-memory-drawer .el-button--primary.is-plain:focus-visible) {
  --el-button-bg-color: rgba(251, 245, 239, 0.96);
  --el-button-border-color: rgba(226, 196, 180, 0.96);
  --el-button-hover-bg-color: rgba(248, 238, 229, 0.98);
  --el-button-hover-border-color: rgba(220, 190, 174, 0.98);
  --el-button-active-bg-color: rgba(244, 233, 224, 1);
  --el-button-active-border-color: rgba(214, 184, 168, 1);
  --el-button-text-color: #b77461;
  border-color: rgba(226, 196, 180, 0.96) !important;
  background: rgba(251, 245, 239, 0.96) !important;
  color: #b77461 !important;
  box-shadow: none !important;
}

:deep(.travel-memory-drawer .el-button--danger.is-plain),
:deep(.travel-memory-drawer .el-button--danger.is-plain:hover),
:deep(.travel-memory-drawer .el-button--danger.is-plain:focus-visible) {
  --el-button-bg-color: rgba(252, 245, 240, 0.94);
  --el-button-border-color: rgba(233, 206, 196, 0.96);
  --el-button-hover-bg-color: rgba(249, 238, 231, 0.98);
  --el-button-hover-border-color: rgba(227, 200, 190, 0.98);
  --el-button-active-bg-color: rgba(245, 233, 225, 1);
  --el-button-active-border-color: rgba(220, 192, 182, 1);
  --el-button-text-color: #c98874;
  border-color: rgba(233, 206, 196, 0.96) !important;
  background: rgba(252, 245, 240, 0.94) !important;
  color: #c98874 !important;
}

:deep(.travel-memory-drawer .drawer-footer .el-button:not(.el-button--primary):not(.el-button--danger)) {
  --el-button-bg-color: rgba(252, 248, 243, 0.96);
  --el-button-border-color: rgba(229, 214, 202, 0.94);
  --el-button-hover-bg-color: rgba(248, 242, 236, 0.98);
  --el-button-hover-border-color: rgba(223, 208, 196, 0.96);
  --el-button-active-bg-color: rgba(244, 238, 232, 1);
  --el-button-active-border-color: rgba(217, 202, 190, 1);
  --el-button-text-color: #8a6759;
  border-color: rgba(229, 214, 202, 0.94) !important;
  background: rgba(252, 248, 243, 0.96) !important;
  color: #8a6759 !important;
}

@media (max-width: 1100px) {
  .manager-toolbar__controls {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .manager-toolbar__controls,
  .manager-actions,
  .section-head--split,
  .section-head__main,
  .drawer-header,
  .drawer-footer {
    flex-direction: column;
  }

  .form-grid,
  .coordinate-layout,
  .memory-entry-card,
  .memory-entry-card__inline,
  .entry-board {
    grid-template-columns: 1fr;
  }

  .drawer-header__meta,
  .drawer-footer {
    width: 100%;
    justify-content: flex-start;
  }

}
</style>
