<template>
  <div class="emoji-admin">
    <el-card class="info-card" shadow="never">
      <template #header>
        <div class="header-row">
        <span class="card-title">
          <el-icon class="card-icon"><CollectionTag /></el-icon>
          表情包管理
        </span>
        <div class="header-actions">
            <el-upload
              :show-file-list="false"
              accept=".zip,application/zip"
              :before-upload="beforeImportUpload"
              :http-request="handleImportZip"
            >
              <el-button :loading="importing" plain>导入 ZIP</el-button>
            </el-upload>
            <el-button type="primary" @click="openPackDialog()">新建表情包</el-button>
            <el-button type="primary" plain @click="openItemDialog()">新建表情</el-button>
          </div>
        </div>
      </template>

      <div class="section-block">
        <div class="section-head">
          <h3>表情包列表</h3>
          <el-button text @click="loadPacks(packPage)">刷新</el-button>
        </div>
        <el-table :data="packs" v-loading="packsLoading" style="width: 100%">
          <el-table-column prop="packCode" label="编码" min-width="140" />
          <el-table-column prop="name" label="名称" min-width="160" />
          <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
          <el-table-column prop="sort" label="排序" width="90" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.enabled === 1 ? 'success' : 'info'">
                {{ row.enabled === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openPackDialog(row)">编辑</el-button>
              <el-button type="danger" link @click="handleDeletePack(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="table-footer">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :current-page="packPage"
            :page-size="packPageSize"
            :total="packTotal"
            @current-change="handlePackPageChange"
          />
        </div>
      </div>

      <div class="section-block">
        <div class="section-head">
          <h3>表情列表</h3>
          <div class="section-tools">
            <el-select v-model="itemFilterPack" clearable placeholder="按表情包筛选" style="width: 180px" @change="handleFilterPackChange">
              <el-option
                v-for="pack in enabledPacks"
                :key="pack.id"
                :label="pack.name"
                :value="pack.packCode"
              />
            </el-select>
            <el-button text @click="loadItems(itemPage)">刷新</el-button>
          </div>
        </div>
        <el-table :data="items" v-loading="itemsLoading" style="width: 100%">
          <el-table-column prop="shortcode" label="短码" min-width="180" />
          <el-table-column prop="label" label="名称" min-width="140" />
          <el-table-column prop="packCode" label="所属表情包" min-width="120" />
          <el-table-column label="预览" width="90">
            <template #default="{ row }">
              <span v-if="row.type === 0" class="emoji-preview">{{ row.unicode || '\u{1F642}' }}</span>
              <img v-else-if="row.assetUrl" :src="row.assetUrl" alt="" class="emoji-preview__img" />
              <span v-else class="emoji-preview">-</span>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="row.type === 1 ? 'warning' : 'success'">
                {{ row.type === 1 ? '图片' : 'Unicode' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="sort" label="排序" width="90" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.enabled === 1 ? 'success' : 'info'">
                {{ row.enabled === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openItemDialog(row)">编辑</el-button>
              <el-button type="danger" link @click="handleDeleteItem(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="table-footer">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :current-page="itemPage"
            :page-size="itemPageSize"
            :total="itemTotal"
            @current-change="handleItemPageChange"
          />
        </div>
      </div>
    </el-card>

    <el-dialog v-model="packDialogVisible" :title="editingPackId ? '编辑表情包' : '新建表情包'" width="520px">
      <el-form :model="packForm" label-width="88px">
        <el-form-item label="编码">
          <el-input v-model="packForm.packCode" :disabled="Boolean(editingPackId)" placeholder="例如：basic / mood" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="packForm.name" placeholder="请输入表情包名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="packForm.description" type="textarea" :rows="3" placeholder="请输入表情包描述" />
        </el-form-item>
        <el-form-item label="图标 URL">
          <el-input v-model="packForm.iconUrl" placeholder="可选" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="packForm.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="packForm.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="packDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="packSaving" @click="handleSavePack">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="itemDialogVisible" :title="editingItemId ? '编辑表情' : '新建表情'" width="560px">
      <el-form :model="itemForm" label-width="88px">
        <el-form-item label="表情包">
          <el-select v-model="itemForm.packCode" placeholder="请选择表情包" style="width: 100%">
            <el-option v-for="pack in enabledPacks" :key="pack.id" :label="pack.name" :value="pack.packCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="短码">
          <el-input v-model="itemForm.shortcode" :disabled="Boolean(editingItemId)" placeholder="例如：mood_peek" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="itemForm.label" placeholder="请输入展示名称" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="itemForm.category" placeholder="例如：emotion / social / daily" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="itemForm.type">
            <el-radio :value="0">Unicode</el-radio>
            <el-radio :value="1">图片</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="itemForm.type === 0" label="Unicode">
          <el-input v-model="itemForm.unicode" placeholder="请输入 Unicode 表情，例如：🙂" />
        </el-form-item>
        <el-form-item v-else label="图片 URL">
          <el-input v-model="itemForm.assetUrl" placeholder="请输入图片地址" />
        </el-form-item>
        <el-form-item label="尺寸">
          <div class="size-row">
            <el-input-number v-model="itemForm.width" :min="0" :max="512" placeholder="宽度" />
            <el-input-number v-model="itemForm.height" :min="0" :max="512" placeholder="高度" />
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="itemForm.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="itemSaving" @click="handleSaveItem">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { UploadRequestOptions } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CollectionTag } from '@element-plus/icons-vue'
import {
  deleteEmojiItem,
  deleteEmojiPack,
  getAdminEmojiItems,
  getAdminEmojiPacks,
  importEmojiPack,
  upsertEmojiItem,
  upsertEmojiPack,
  type AdminEmojiItem,
  type AdminEmojiPack,
} from '@/api/emoji'
import { loadEmojiRegistry } from '@/emoji/provider'

const packs = ref<AdminEmojiPack[]>([])
const items = ref<AdminEmojiItem[]>([])
const packsLoading = ref(false)
const itemsLoading = ref(false)
const importing = ref(false)
const itemFilterPack = ref('')

const packPage = ref(1)
const packPageSize = 8
const packTotal = ref(0)
const itemPage = ref(1)
const itemPageSize = 12
const itemTotal = ref(0)

const packDialogVisible = ref(false)
const packSaving = ref(false)
const editingPackId = ref<number | null>(null)
const packForm = reactive({
  packCode: '',
  name: '',
  description: '',
  iconUrl: '',
  enabled: 1,
  sort: 0,
})

const itemDialogVisible = ref(false)
const itemSaving = ref(false)
const editingItemId = ref<number | null>(null)
const itemForm = reactive({
  packCode: '',
  shortcode: '',
  label: '',
  category: 'emotion',
  type: 0,
  unicode: '',
  assetUrl: '',
  width: null as number | null,
  height: null as number | null,
  enabled: 1,
  sort: 0,
})

const enabledPacks = computed(() => packs.value.filter((pack) => pack.enabled === 1))

const loadPacks = async (page = packPage.value) => {
  packsLoading.value = true
  try {
    const res = await getAdminEmojiPacks({ page, size: packPageSize })
    packs.value = res.list || []
    packTotal.value = res.total || 0
    packPage.value = res.page || page
  } catch {
    ElMessage.error('表情包列表加载失败')
    packs.value = []
    packTotal.value = 0
  } finally {
    packsLoading.value = false
  }
}

const loadItems = async (page = itemPage.value) => {
  itemsLoading.value = true
  try {
    const res = await getAdminEmojiItems({ page, size: itemPageSize, packCode: itemFilterPack.value || undefined })
    items.value = res.list || []
    itemTotal.value = res.total || 0
    itemPage.value = res.page || page
  } catch {
    ElMessage.error('表情列表加载失败')
    items.value = []
    itemTotal.value = 0
  } finally {
    itemsLoading.value = false
  }
}

const refreshRegistry = async () => {
  await loadEmojiRegistry().catch(() => undefined)
}

const resetPackForm = () => {
  packForm.packCode = ''
  packForm.name = ''
  packForm.description = ''
  packForm.iconUrl = ''
  packForm.enabled = 1
  packForm.sort = 0
}

const openPackDialog = (row?: AdminEmojiPack) => {
  if (row) {
    editingPackId.value = row.id
    packForm.packCode = row.packCode
    packForm.name = row.name
    packForm.description = row.description || ''
    packForm.iconUrl = row.iconUrl || ''
    packForm.enabled = row.enabled
    packForm.sort = row.sort
  } else {
    editingPackId.value = null
    resetPackForm()
  }
  packDialogVisible.value = true
}

const handleSavePack = async () => {
  if (!packForm.packCode.trim() || !packForm.name.trim()) {
    ElMessage.warning('请填写表情包编码和名称')
    return
  }
  packSaving.value = true
  try {
    await upsertEmojiPack({
      packCode: packForm.packCode.trim(),
      name: packForm.name.trim(),
      description: packForm.description.trim() || undefined,
      iconUrl: packForm.iconUrl.trim() || undefined,
      enabled: packForm.enabled,
      sort: packForm.sort,
    })
    packDialogVisible.value = false
    ElMessage.success('表情包保存成功')
    await Promise.all([loadPacks(packPage.value), loadItems(itemPage.value), refreshRegistry()])
  } catch {
    ElMessage.error('表情包保存失败')
  } finally {
    packSaving.value = false
  }
}

const handleDeletePack = async (row: AdminEmojiPack) => {
  try {
    await ElMessageBox.confirm(`确定删除表情包“${row.name}”吗？`, '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteEmojiPack(row.id)
    ElMessage.success('表情包删除成功')
    if (itemFilterPack.value === row.packCode) {
      itemFilterPack.value = ''
      itemPage.value = 1
    }
    const nextPackPage = packs.value.length === 1 && packPage.value > 1 ? packPage.value - 1 : packPage.value
    await Promise.all([loadPacks(nextPackPage), loadItems(itemPage.value), refreshRegistry()])
  } catch {
    ElMessage.error('表情包删除失败')
  }
}

const resetItemForm = () => {
  itemForm.packCode = enabledPacks.value[0]?.packCode || ''
  itemForm.shortcode = ''
  itemForm.label = ''
  itemForm.category = 'emotion'
  itemForm.type = 0
  itemForm.unicode = ''
  itemForm.assetUrl = ''
  itemForm.width = null
  itemForm.height = null
  itemForm.enabled = 1
  itemForm.sort = 0
}

const openItemDialog = (row?: AdminEmojiItem) => {
  if (row) {
    editingItemId.value = row.id
    itemForm.packCode = row.packCode
    itemForm.shortcode = row.shortcode
    itemForm.label = row.label
    itemForm.category = row.category
    itemForm.type = row.type
    itemForm.unicode = row.unicode || ''
    itemForm.assetUrl = row.assetUrl || ''
    itemForm.width = row.width ?? null
    itemForm.height = row.height ?? null
    itemForm.enabled = row.enabled
    itemForm.sort = row.sort
  } else {
    editingItemId.value = null
    resetItemForm()
  }
  itemDialogVisible.value = true
}

const handleSaveItem = async () => {
  if (!itemForm.packCode.trim() || !itemForm.shortcode.trim() || !itemForm.label.trim()) {
    ElMessage.warning('请填写表情包、短码和名称')
    return
  }
  if (itemForm.type === 0 && !itemForm.unicode.trim()) {
    ElMessage.warning('Unicode 表情必须填写字符')
    return
  }
  if (itemForm.type === 1 && !itemForm.assetUrl.trim()) {
    ElMessage.warning('图片表情必须填写图片地址')
    return
  }

  itemSaving.value = true
  try {
    await upsertEmojiItem({
      packCode: itemForm.packCode.trim(),
      shortcode: itemForm.shortcode.trim(),
      label: itemForm.label.trim(),
      category: itemForm.category.trim() || 'emotion',
      type: itemForm.type,
      unicode: itemForm.type === 0 ? itemForm.unicode.trim() : undefined,
      assetUrl: itemForm.type === 1 ? itemForm.assetUrl.trim() : undefined,
      width: itemForm.width,
      height: itemForm.height,
      enabled: itemForm.enabled,
      sort: itemForm.sort,
    })
    itemDialogVisible.value = false
    ElMessage.success('表情保存成功')
    await Promise.all([loadItems(itemPage.value), refreshRegistry()])
  } catch {
    ElMessage.error('表情保存失败')
  } finally {
    itemSaving.value = false
  }
}

const handleDeleteItem = async (row: AdminEmojiItem) => {
  try {
    await ElMessageBox.confirm(`确定删除表情“${row.label}”吗？`, '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteEmojiItem(row.id)
    ElMessage.success('表情删除成功')
    const nextItemPage = items.value.length === 1 && itemPage.value > 1 ? itemPage.value - 1 : itemPage.value
    await Promise.all([loadItems(nextItemPage), refreshRegistry()])
  } catch {
    ElMessage.error('表情删除失败')
  }
}

const beforeImportUpload = (file: File) => {
  const isZip = file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')
  if (!isZip) {
    ElMessage.warning('请上传 ZIP 文件')
    return false
  }
  return true
}

const handleImportZip = async (options: UploadRequestOptions) => {
  importing.value = true
  try {
    const result = await importEmojiPack(options.file)
    options.onSuccess?.(result as never)
    ElMessage.success(`导入完成：成功 ${result.successCount} 条，失败 ${result.failCount} 条`)
    await Promise.all([loadPacks(packPage.value), loadItems(itemPage.value), refreshRegistry()])
  } catch (error) {
    options.onError?.(error as any)
    ElMessage.error('导入表情包失败')
  } finally {
    importing.value = false
  }
}

const handlePackPageChange = (page: number) => {
  loadPacks(page)
}

const handleItemPageChange = (page: number) => {
  loadItems(page)
}

const handleFilterPackChange = () => {
  itemPage.value = 1
  loadItems(1)
}

onMounted(async () => {
  await Promise.all([loadPacks(), loadItems()])
  if (!itemForm.packCode) {
    resetItemForm()
  }
})
</script>

<style scoped lang="scss">
.info-card {
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);

  :deep(.el-card__header) {
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--border-light);
    font-weight: 600;
  }

  :deep(.el-card__body) {
    padding: var(--spacing-lg);
  }
}

.header-row,
.section-head,
.header-actions,
.section-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.card-title {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-primary);
}

.card-icon {
  color: var(--primary);
  font-size: 18px;
}

.section-block + .section-block {
  margin-top: 24px;
}

.section-head h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.emoji-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 22px;
}

.emoji-preview__img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.size-row {
  display: flex;
  gap: 12px;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
