<template>
  <div class="emoji-admin">
    <UiPanel icon="image" title="表情包管理" flush>
      <template #actions>
        <div class="header-actions">
          <UiUpload
            :show-file-list="false"
            accept=".zip,application/zip"
            :before-upload="beforeImportUpload"
            :http-request="handleImportZip"
          >
            <UiButton :loading="importing" icon="upload">导入 ZIP</UiButton>
          </UiUpload>
          <UiButton variant="primary" icon="add" @click="openPackDialog()">新建表情包</UiButton>
          <UiButton variant="ghost" icon="add" @click="openItemDialog()">新建表情</UiButton>
        </div>
      </template>

      <div class="panel-inner">
        <div class="section-block">
          <div class="section-head">
            <h3>表情包列表</h3>
            <UiButton variant="text" size="sm" icon="refresh" @click="loadPacks(packPage)">刷新</UiButton>
          </div>
          <UiTable :data="packs" :loading="packsLoading" style="width: 100%">
            <UiTableColumn prop="packCode" label="编码" min-width="140" />
            <UiTableColumn prop="name" label="名称" min-width="160" />
            <UiTableColumn prop="description" label="描述" min-width="220" show-overflow-tooltip />
            <UiTableColumn prop="sort" label="排序" width="90" />
            <UiTableColumn label="状态" width="100">
              <template #default="{ row }">
                <AppStatusPill :status="row.enabled === 1 ? 'enabled' : 'disabled'">
                  {{ row.enabled === 1 ? '启用' : '停用' }}
                </AppStatusPill>
              </template>
            </UiTableColumn>
            <UiTableColumn label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <div class="row-actions">
                  <UiButton variant="text" size="sm" @click="openPackDialog(row)">编辑</UiButton>
                  <UiButton variant="text" size="sm" @click="handleDeletePack(row)">删除</UiButton>
                </div>
              </template>
            </UiTableColumn>
          </UiTable>
          <div class="table-footer">
            <UiPagination
              :current="packPage"
              :page-size="packPageSize"
              :total="packTotal"
              @change="handlePackPageChange"
            />
          </div>
        </div>

        <div class="section-block">
          <div class="section-head">
            <h3>表情列表</h3>
            <div class="section-tools">
              <UiSelect
                v-model="itemFilterPack"
                clearable
                placeholder="按表情包筛选"
                style="width: 180px"
                :options="enabledPacks.map((pack) => ({ label: pack.name, value: pack.packCode }))"
                @change="handleFilterPackChange"
              />
              <UiButton variant="text" size="sm" icon="refresh" @click="loadItems(itemPage)">刷新</UiButton>
            </div>
          </div>
          <UiTable :data="items" :loading="itemsLoading" style="width: 100%">
            <UiTableColumn prop="shortcode" label="短码" min-width="180" />
            <UiTableColumn prop="label" label="名称" min-width="140" />
            <UiTableColumn prop="packCode" label="所属表情包" min-width="120" />
            <UiTableColumn label="预览" width="90">
              <template #default="{ row }">
                <span v-if="row.type === 0" class="emoji-preview">{{ row.unicode || '\u{1F642}' }}</span>
                <img v-else-if="row.assetUrl" :src="row.assetUrl" alt="" class="emoji-preview__img" />
                <span v-else class="emoji-preview">-</span>
              </template>
            </UiTableColumn>
            <UiTableColumn label="类型" width="90">
              <template #default="{ row }">
                <UiBadge :tone="row.type === 1 ? 'warning' : 'success'" size="sm">
                  {{ row.type === 1 ? '图片' : 'Unicode' }}
                </UiBadge>
              </template>
            </UiTableColumn>
            <UiTableColumn prop="category" label="分类" width="120" />
            <UiTableColumn prop="sort" label="排序" width="90" />
            <UiTableColumn label="状态" width="100">
              <template #default="{ row }">
                <AppStatusPill :status="row.enabled === 1 ? 'enabled' : 'disabled'">
                  {{ row.enabled === 1 ? '启用' : '停用' }}
                </AppStatusPill>
              </template>
            </UiTableColumn>
            <UiTableColumn label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <div class="row-actions">
                  <UiButton variant="text" size="sm" @click="openItemDialog(row)">编辑</UiButton>
                  <UiButton variant="text" size="sm" @click="handleDeleteItem(row)">删除</UiButton>
                </div>
              </template>
            </UiTableColumn>
          </UiTable>
          <div class="table-footer">
            <UiPagination
              :current="itemPage"
              :page-size="itemPageSize"
              :total="itemTotal"
              @change="handleItemPageChange"
            />
          </div>
        </div>
      </div>
    </UiPanel>

    <UiDialog v-model="packDialogVisible" :title="editingPackId ? '编辑表情包' : '新建表情包'" width="520px">
      <UiForm :model="packForm" label-width="88px">
        <UiFormField label="编码">
          <UiInput v-model="packForm.packCode" :disabled="Boolean(editingPackId)" placeholder="例如：basic / mood" />
        </UiFormField>
        <UiFormField label="名称">
          <UiInput v-model="packForm.name" placeholder="请输入表情包名称" />
        </UiFormField>
        <UiFormField label="描述">
          <UiTextarea v-model="packForm.description" :rows="3" placeholder="请输入表情包描述" />
        </UiFormField>
        <UiFormField label="图标 URL">
          <UiInput v-model="packForm.iconUrl" placeholder="可选" />
        </UiFormField>
        <UiFormField label="排序">
          <UiNumberField v-model="packForm.sort" :min="0" :max="9999" />
        </UiFormField>
        <UiFormField label="启用">
          <UiSwitch v-model="packForm.enabled" :active-value="1" :inactive-value="0" />
        </UiFormField>
      </UiForm>
      <template #footer>
        <UiButton variant="text" @click="packDialogVisible = false">取消</UiButton>
        <UiButton variant="primary" :loading="packSaving" @click="handleSavePack">保存</UiButton>
      </template>
    </UiDialog>

    <UiDialog v-model="itemDialogVisible" :title="editingItemId ? '编辑表情' : '新建表情'" width="560px">
      <UiForm :model="itemForm" label-width="88px">
        <UiFormField label="表情包">
          <UiSelect
            v-model="itemForm.packCode"
            placeholder="请选择表情包"
            style="width: 100%"
            :options="enabledPacks.map((pack) => ({ label: pack.name, value: pack.packCode }))"
          />
        </UiFormField>
        <UiFormField label="短码">
          <UiInput v-model="itemForm.shortcode" :disabled="Boolean(editingItemId)" placeholder="例如：mood_peek" />
        </UiFormField>
        <UiFormField label="名称">
          <UiInput v-model="itemForm.label" placeholder="请输入展示名称" />
        </UiFormField>
        <UiFormField label="分类">
          <UiInput v-model="itemForm.category" placeholder="例如：emotion / social / daily" />
        </UiFormField>
        <UiFormField label="类型">
          <UiRadioGroup v-model="itemForm.type" :options="emojiTypeOptions" />
        </UiFormField>
        <UiFormField v-if="itemForm.type === 0" label="Unicode">
          <UiInput v-model="itemForm.unicode" placeholder="请输入 Unicode 表情，例如：🙂" />
        </UiFormField>
        <UiFormField v-else label="图片 URL">
          <UiInput v-model="itemForm.assetUrl" placeholder="请输入图片地址" />
        </UiFormField>
        <UiFormField label="尺寸">
          <div class="size-row">
            <UiNumberField v-model="itemForm.width" :min="0" :max="512" placeholder="宽度" />
            <UiNumberField v-model="itemForm.height" :min="0" :max="512" placeholder="高度" />
          </div>
        </UiFormField>
        <UiFormField label="排序">
          <UiNumberField v-model="itemForm.sort" :min="0" :max="9999" />
        </UiFormField>
        <UiFormField label="启用">
          <UiSwitch v-model="itemForm.enabled" :active-value="1" :inactive-value="0" />
        </UiFormField>
      </UiForm>
      <template #footer>
        <UiButton variant="text" @click="itemDialogVisible = false">取消</UiButton>
        <UiButton variant="primary" :loading="itemSaving" @click="handleSaveItem">保存</UiButton>
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { notify, confirmDelete } from '@/lib/feedback'
import { UiPanel, UiButton, UiBadge, UiDialog, UiForm, UiFormField, UiInput, UiNumberField, UiPagination, UiRadioGroup, UiSelect, UiSwitch, UiTable, UiTableColumn, UiTextarea, UiUpload } from '@/components/ui'
import type { UploadRequestOptions } from '@/components/ui'
import { AppStatusPill } from '@/components/app'
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
const emojiTypeOptions = [
  { label: 'Unicode', value: 0 },
  { label: '图片', value: 1 },
]

const loadPacks = async (page = packPage.value) => {
  packsLoading.value = true
  try {
    const res = await getAdminEmojiPacks({ page, size: packPageSize })
    packs.value = res.list || []
    packTotal.value = res.total || 0
    packPage.value = res.page || page
  } catch {
    notify.error('表情包列表加载失败')
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
    notify.error('表情列表加载失败')
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
    notify.warning('请填写表情包编码和名称')
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
    notify.success('表情包保存成功')
    await Promise.all([loadPacks(packPage.value), loadItems(itemPage.value), refreshRegistry()])
  } catch {
    notify.error('表情包保存失败')
  } finally {
    packSaving.value = false
  }
}

const handleDeletePack = async (row: AdminEmojiPack) => {
  const confirmed = await confirmDelete(`确定删除表情包“${row.name}”吗？`)
  if (!confirmed) {
    return
  }
  try {
    await deleteEmojiPack(row.id)
    notify.success('表情包删除成功')
    if (itemFilterPack.value === row.packCode) {
      itemFilterPack.value = ''
      itemPage.value = 1
    }
    const nextPackPage = packs.value.length === 1 && packPage.value > 1 ? packPage.value - 1 : packPage.value
    await Promise.all([loadPacks(nextPackPage), loadItems(itemPage.value), refreshRegistry()])
  } catch {
    notify.error('表情包删除失败')
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
    notify.warning('请填写表情包、短码和名称')
    return
  }
  if (itemForm.type === 0 && !itemForm.unicode.trim()) {
    notify.warning('Unicode 表情必须填写字符')
    return
  }
  if (itemForm.type === 1 && !itemForm.assetUrl.trim()) {
    notify.warning('图片表情必须填写图片地址')
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
    notify.success('表情保存成功')
    await Promise.all([loadItems(itemPage.value), refreshRegistry()])
  } catch {
    notify.error('表情保存失败')
  } finally {
    itemSaving.value = false
  }
}

const handleDeleteItem = async (row: AdminEmojiItem) => {
  const confirmed = await confirmDelete(`确定删除表情“${row.label}”吗？`)
  if (!confirmed) {
    return
  }
  try {
    await deleteEmojiItem(row.id)
    notify.success('表情删除成功')
    const nextItemPage = items.value.length === 1 && itemPage.value > 1 ? itemPage.value - 1 : itemPage.value
    await Promise.all([loadItems(nextItemPage), refreshRegistry()])
  } catch {
    notify.error('表情删除失败')
  }
}

const beforeImportUpload = (file: File) => {
  const isZip = file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')
  if (!isZip) {
    notify.warning('请上传 ZIP 文件')
    return false
  }
  return true
}

const handleImportZip = async (options: UploadRequestOptions) => {
  importing.value = true
  try {
    const result = await importEmojiPack(options.file)
    options.onSuccess?.(result as never)
    notify.success(`导入完成：成功 ${result.successCount} 条，失败 ${result.failCount} 条`)
    await Promise.all([loadPacks(packPage.value), loadItems(itemPage.value), refreshRegistry()])
  } catch (error) {
    options.onError?.(error as any)
    notify.error('导入表情包失败')
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
.panel-inner {
  padding: var(--space-lg);
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
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
