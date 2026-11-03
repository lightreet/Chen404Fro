<template>
  <UiPanel icon="category" title="分类管理" flush>
    <template #actions>
      <UiButton variant="primary" icon="add" @click="openCategoryDialog()">新建分类</UiButton>
    </template>

    <div class="panel-inner">
      <UiTable :data="categoriesList" style="width: 100%" :loading="categoriesLoading">
        <UiTableColumn prop="id" label="ID" width="120" />
        <UiTableColumn prop="name" label="分类名称" min-width="180" />
        <UiTableColumn label="图标" width="92">
          <template #default="{ row }">
            <span class="table-icon-cell">
              <CategoryIcon :icon="row.icon" width="18" height="18" />
            </span>
          </template>
        </UiTableColumn>
        <UiTableColumn prop="slug" label="别名" min-width="180" />
        <UiTableColumn prop="sortOrder" label="排序" width="90" />
        <UiTableColumn prop="status" label="状态" width="100">
          <template #default="{ row }">
            <AppStatusPill :status="row.status === 1 ? 'enabled' : 'disabled'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </AppStatusPill>
          </template>
        </UiTableColumn>
        <UiTableColumn label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <UiButton variant="text" size="sm" @click="openCategoryDialog(row)">编辑</UiButton>
              <UiButton variant="text" size="sm" @click="handleDeleteCategory(row)">删除</UiButton>
            </div>
          </template>
        </UiTableColumn>
      </UiTable>

      <div class="table-footer">
        <UiPagination
          :current="currentPage"
          :page-size="pageSize"
          :total="total"
          @change="handlePageChange"
        />
      </div>
    </div>

    <UiDialog v-model="categoryDialogVisible" :title="categoryDialogTitle" width="720px">
      <UiForm :model="categoryForm" label-width="90px" class="category-form">
        <UiFormField label="名称">
          <UiInput v-model="categoryForm.name" placeholder="请输入分类名称" />
        </UiFormField>
        <UiFormField label="别名">
          <UiInput v-model="categoryForm.slug" placeholder="可选，用于 URL 标识" />
        </UiFormField>
        <UiFormField label="描述">
          <UiTextarea v-model="categoryForm.description" :rows="3" placeholder="请输入分类描述" />
        </UiFormField>
        <UiFormField label="图标">
          <CategoryIconPicker v-model="categoryForm.icon" />
        </UiFormField>
        <UiFormField label="排序">
          <UiNumberField v-model="categoryForm.sortOrder" :min="0" :max="9999" />
        </UiFormField>
        <UiFormField label="状态">
          <UiSwitch v-model="categoryForm.status" :active-value="1" :inactive-value="0" />
        </UiFormField>
      </UiForm>
      <template #footer>
        <UiButton variant="text" @click="categoryDialogVisible = false">取消</UiButton>
        <UiButton variant="primary" :loading="categorySaving" @click="handleSaveCategory">保存</UiButton>
      </template>
    </UiDialog>
  </UiPanel>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { notify, confirmDelete } from '@/lib/feedback'
import { UiPanel, UiButton, UiDialog, UiForm, UiFormField, UiInput, UiNumberField, UiPagination, UiSwitch, UiTable, UiTableColumn, UiTextarea } from '@/components/ui'
import { AppStatusPill } from '@/components/app'
import CategoryIcon from '@/components/CategoryIcon/CategoryIcon.vue'
import CategoryIconPicker from '@/components/CategoryIcon/CategoryIconPicker.vue'
import type { Category, CreateCategoryCommand } from '@/types'
import { createCategory, deleteCategory, getAdminCategories, updateCategory } from '@/api/article'
import { normalizeCategoryIcon } from '@/utils/categoryIcon'

const categoriesList = ref<Category[]>([])
const categoriesLoading = ref(false)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)

const categoryDialogVisible = ref(false)
const categorySaving = ref(false)
const editingCategoryId = ref<number | null>(null)
const categoryDialogTitle = computed(() => (editingCategoryId.value ? '编辑分类' : '新建分类'))

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
    notify.error('分类列表加载失败')
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
  } else {
    editingCategoryId.value = null
    resetCategoryForm()
  }
  categoryDialogVisible.value = true
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
    notify.warning('请输入分类名称')
    return
  }
  categorySaving.value = true
  try {
    const payload = buildCategoryPayload()
    if (editingCategoryId.value) {
      await updateCategory(editingCategoryId.value, payload)
      notify.success('分类更新成功')
    } else {
      await createCategory(payload)
      notify.success('分类创建成功')
    }
    categoryDialogVisible.value = false
    await loadCategories(currentPage.value)
  } catch {
    notify.error('操作失败')
  } finally {
    categorySaving.value = false
  }
}

const handleDeleteCategory = async (row: Category) => {
  const confirmed = await confirmDelete(`确定删除分类“${row.name}”吗？`)
  if (!confirmed) {
    return
  }

  try {
    await deleteCategory(Number(row.id))
    notify.success('分类删除成功')
    const nextPage = categoriesList.value.length === 1 && currentPage.value > 1 ? currentPage.value - 1 : currentPage.value
    await loadCategories(nextPage)
  } catch {
    notify.error('删除失败')
  }
}

const handlePageChange = (page: number) => {
  loadCategories(page)
}

onMounted(() => {
  loadCategories()
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

@media (max-width: 767px) {
  .category-form :deep(.el-form-item) {
    flex-direction: column;
    align-items: stretch;
  }

  .category-form :deep(.el-form-item__label) {
    justify-content: flex-start;
    width: auto !important;
  }

  .category-form :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
}
</style>
