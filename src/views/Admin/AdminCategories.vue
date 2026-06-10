<template>
  <el-card class="info-card" shadow="never">
    <template #header>
      <div class="header-row">
        <span class="card-title">
          <el-icon class="card-icon"><CollectionTag /></el-icon>
          分类管理
        </span>
        <el-button type="primary" @click="openCategoryDialog()">
          <el-icon><Plus /></el-icon>
          新建分类
        </el-button>
      </div>
    </template>

    <el-table :data="categoriesList" style="width: 100%" v-loading="categoriesLoading">
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="name" label="分类名称" min-width="180" />
      <el-table-column label="图标" width="92">
        <template #default="{ row }">
          <span class="table-icon-cell">
            <CategoryIcon :icon="row.icon" width="18" height="18" />
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="slug" label="别名" min-width="180" />
      <el-table-column prop="sortOrder" label="排序" width="90" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openCategoryDialog(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDeleteCategory(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-footer">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog v-model="categoryDialogVisible" :title="categoryDialogTitle" width="720px">
      <el-form :model="categoryForm" label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="别名">
          <el-input v-model="categoryForm.slug" placeholder="可选，用于 URL 标识" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="categoryForm.description" type="textarea" :rows="3" placeholder="请输入分类描述" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="icon-field">
            <div class="icon-preview-card">
              <div class="icon-preview-main">
                <span class="icon-preview-avatar">
                  <CategoryIcon
                    :icon="categoryForm.icon"
                    width="28"
                    height="28"
                    @load-state="handlePreviewLoadState"
                  />
                </span>
                <div class="icon-preview-copy">
                  <strong>{{ iconPreviewLabel }}</strong>
                  <span>{{ iconPreviewHint }}</span>
                </div>
              </div>
              <div class="icon-preview-actions">
                <el-button size="small" @click="setDefaultCategoryIcon">默认图标</el-button>
                <el-button size="small" @click="clearCategoryIcon">清空</el-button>
              </div>
            </div>

            <el-input
              v-model="categoryForm.icon"
              clearable
              placeholder="例如 mdi:folder-open 或 solar:music-note-bold"
            />

            <el-input
              v-model="iconSearchKeyword"
              clearable
              placeholder="搜索图标关键词，例如 music、robot、server"
            />

            <p v-if="iconSearchError" class="icon-search-error">
              {{ iconSearchError }}
            </p>

            <div v-else-if="iconSearchLoading" class="icon-search-status">
              正在搜索图标...
            </div>

            <div v-else-if="iconSearchKeyword.trim() && iconSearchResults.length === 0" class="icon-search-status">
              没有找到匹配结果，可以直接输入完整图标名。
            </div>

            <div v-if="iconSearchResults.length > 0" class="icon-search-grid">
              <button
                v-for="item in iconSearchResults"
                :key="item.value"
                type="button"
                class="icon-search-item"
                :class="{ selected: categoryForm.icon === item.value }"
                @click="applyIconSuggestion(item.value)"
              >
                <CategoryIcon :icon="item.value" width="18" height="18" />
                <span class="icon-search-item__name">{{ item.value }}</span>
                <span class="icon-search-item__meta">{{ item.collectionName }}</span>
              </button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sortOrder" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="categoryForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="categorySaving" @click="handleSaveCategory">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CollectionTag, Plus } from '@element-plus/icons-vue'
import CategoryIcon from '@/components/CategoryIcon/CategoryIcon.vue'
import type { Category, CreateCategoryCommand } from '@/types'
import { createCategory, deleteCategory, getAdminCategories, updateCategory } from '@/api/article'
import { searchCategoryIcons, type CategoryIconSearchResult } from '@/modules/category-icons/service'
import { DEFAULT_CATEGORY_ICON, getCategoryIconOrFallback, normalizeCategoryIcon } from '@/utils/categoryIcon'

const categoriesList = ref<Category[]>([])
const categoriesLoading = ref(false)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)

const categoryDialogVisible = ref(false)
const categorySaving = ref(false)
const editingCategoryId = ref<number | null>(null)
const iconSearchKeyword = ref('')
const iconSearchResults = ref<CategoryIconSearchResult[]>([])
const iconSearchLoading = ref(false)
const iconSearchError = ref('')
const iconPreviewFailed = ref(false)

const categoryDialogTitle = computed(() => (editingCategoryId.value ? '编辑分类' : '新建分类'))
const iconPreviewValue = computed(() => getCategoryIconOrFallback(categoryForm.icon, DEFAULT_CATEGORY_ICON))
const iconPreviewLabel = computed(() => iconPreviewValue.value)
const iconPreviewHint = computed(() => {
  if (!normalizeCategoryIcon(categoryForm.icon)) {
    return '未设置时会使用默认分类图标'
  }
  if (iconPreviewFailed.value) {
    return '当前图标加载失败，预览已回退为默认图标'
  }
  return '可直接输入完整 Iconify 图标名，或从搜索结果中选择'
})

const categoryForm = reactive<CreateCategoryCommand>({
  name: '',
  slug: '',
  description: '',
  icon: '',
  sortOrder: 0,
  status: 1,
})

const loadCategories = async (page = currentPage.value) => {
  categoriesLoading.value = true
  try {
    const res = await getAdminCategories({ page, size: pageSize })
    categoriesList.value = res.list || []
    total.value = res.total || 0
    currentPage.value = res.page || page
  } catch {
    categoriesList.value = []
    total.value = 0
    ElMessage.error('分类列表加载失败')
  } finally {
    categoriesLoading.value = false
  }
}

const resetCategoryForm = () => {
  categoryForm.name = ''
  categoryForm.slug = ''
  categoryForm.description = ''
  categoryForm.icon = ''
  categoryForm.sortOrder = 0
  categoryForm.status = 1
  iconSearchKeyword.value = ''
  iconSearchResults.value = []
  iconSearchError.value = ''
  iconPreviewFailed.value = false
}

const openCategoryDialog = (row?: Category) => {
  if (row) {
    editingCategoryId.value = Number(row.id)
    categoryForm.name = row.name
    categoryForm.slug = row.slug
    categoryForm.description = row.description || ''
    categoryForm.icon = row.icon || ''
    categoryForm.sortOrder = row.sortOrder ?? 0
    categoryForm.status = row.status ?? 1
    iconSearchKeyword.value = ''
    iconSearchResults.value = []
    iconSearchError.value = ''
    iconPreviewFailed.value = false
  } else {
    editingCategoryId.value = null
    resetCategoryForm()
  }
  categoryDialogVisible.value = true
}

const handlePreviewLoadState = (payload: { failed: boolean; requestedIcon: string; renderedIcon: string }) => {
  iconPreviewFailed.value = payload.failed && payload.requestedIcon === normalizeCategoryIcon(categoryForm.icon)
}

const applyIconSuggestion = (value: string) => {
  categoryForm.icon = value
}

const clearCategoryIcon = () => {
  categoryForm.icon = ''
}

const setDefaultCategoryIcon = () => {
  categoryForm.icon = DEFAULT_CATEGORY_ICON
}

const buildCategoryPayload = (): CreateCategoryCommand => {
  const icon = normalizeCategoryIcon(categoryForm.icon)

  return {
    name: categoryForm.name.trim(),
    slug: categoryForm.slug?.trim() || undefined,
    description: categoryForm.description?.trim() || undefined,
    icon: icon || undefined,
    sortOrder: categoryForm.sortOrder ?? 0,
    status: categoryForm.status ?? 1,
  }
}

const handleSaveCategory = async () => {
  if (!categoryForm.name?.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  categorySaving.value = true
  try {
    const payload = buildCategoryPayload()
    if (editingCategoryId.value) {
      await updateCategory(editingCategoryId.value, payload)
      ElMessage.success('分类更新成功')
    } else {
      await createCategory(payload)
      ElMessage.success('分类创建成功')
    }
    categoryDialogVisible.value = false
    await loadCategories(currentPage.value)
  } catch {
    ElMessage.error('操作失败')
  } finally {
    categorySaving.value = false
  }
}

const handleDeleteCategory = async (row: Category) => {
  try {
    await ElMessageBox.confirm(`确定删除分类“${row.name}”吗？`, '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  try {
    await deleteCategory(Number(row.id))
    ElMessage.success('分类删除成功')
    const nextPage = categoriesList.value.length === 1 && currentPage.value > 1 ? currentPage.value - 1 : currentPage.value
    await loadCategories(nextPage)
  } catch {
    ElMessage.error('删除失败')
  }
}

const handlePageChange = (page: number) => {
  loadCategories(page)
}

let iconSearchTimer: ReturnType<typeof setTimeout> | null = null
let iconSearchController: AbortController | null = null
let iconSearchRequestId = 0

const clearIconSearchTask = () => {
  if (iconSearchTimer) {
    clearTimeout(iconSearchTimer)
    iconSearchTimer = null
  }
  if (iconSearchController) {
    iconSearchController.abort()
    iconSearchController = null
  }
}

watch(iconSearchKeyword, (value) => {
  clearIconSearchTask()
  iconSearchError.value = ''
  const requestId = ++iconSearchRequestId

  const keyword = value.trim()
  if (!keyword) {
    iconSearchResults.value = []
    iconSearchLoading.value = false
    return
  }

  iconSearchLoading.value = true
  iconSearchTimer = setTimeout(async () => {
    const controller = new AbortController()
    iconSearchController = controller

    try {
      const results = await searchCategoryIcons(keyword, controller.signal)
      if (requestId !== iconSearchRequestId) return
      iconSearchResults.value = results
    } catch (error) {
      if (controller.signal.aborted || requestId !== iconSearchRequestId) return
      console.error('分类图标搜索失败', error)
      iconSearchResults.value = []
      iconSearchError.value = '图标搜索失败，请直接输入完整图标名。'
    } finally {
      if (iconSearchController === controller) {
        iconSearchController = null
      }
      if (requestId === iconSearchRequestId) {
        iconSearchLoading.value = false
      }
    }
  }, 280)
})

onMounted(() => {
  loadCategories()
})

onUnmounted(() => {
  clearIconSearchTask()
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

.header-row {
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

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.table-icon-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary) 12%, white);
  color: var(--primary);
}

.icon-field {
  display: grid;
  gap: 12px;
  width: 100%;
}

.icon-preview-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--border-light);
  border-radius: 14px;
  background: color-mix(in srgb, var(--bg-secondary) 88%, white);
}

.icon-preview-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.icon-preview-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.14), rgba(64, 158, 255, 0.08));
  color: var(--primary);
  flex-shrink: 0;
}

.icon-preview-copy {
  display: grid;
  gap: 4px;
  min-width: 0;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--text-primary);
    font-size: 14px;
  }

  span {
    color: var(--text-secondary);
    font-size: 12px;
  }
}

.icon-preview-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.icon-search-status,
.icon-search-error {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.icon-search-error {
  color: var(--el-color-danger);
}

.icon-search-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-height: 280px;
  overflow: auto;
}

.icon-search-item {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 4px 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  background: white;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: rgba(64, 158, 255, 0.42);
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  }

  &.selected {
    border-color: rgba(64, 158, 255, 0.62);
    background: rgba(64, 158, 255, 0.06);
  }
}

.icon-search-item__name,
.icon-search-item__meta {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-search-item__name {
  font-size: 13px;
  font-weight: 600;
}

.icon-search-item__meta {
  grid-column: 2;
  font-size: 11px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .icon-preview-card {
    flex-direction: column;
    align-items: stretch;
  }

  .icon-preview-actions {
    justify-content: flex-start;
  }

  .icon-search-grid {
    grid-template-columns: 1fr;
  }
}
</style>
