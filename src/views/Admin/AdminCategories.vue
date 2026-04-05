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

    <el-dialog v-model="categoryDialogVisible" :title="categoryDialogTitle" width="520px">
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
          <el-input v-model="categoryForm.icon" placeholder="可选" />
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CollectionTag, Plus } from '@element-plus/icons-vue'
import type { Category } from '@/types'
import { createCategory, deleteCategory, getAdminCategories, updateCategory } from '@/api/article'

const categoriesList = ref<Category[]>([])
const categoriesLoading = ref(false)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)

const categoryDialogVisible = ref(false)
const categorySaving = ref(false)
const editingCategoryId = ref<number | null>(null)

const categoryDialogTitle = computed(() => (editingCategoryId.value ? '编辑分类' : '新建分类'))

const categoryForm = reactive<Partial<Category>>({
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

const handleSaveCategory = async () => {
  if (!categoryForm.name?.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  categorySaving.value = true
  try {
    if (editingCategoryId.value) {
      await updateCategory(editingCategoryId.value, categoryForm)
      ElMessage.success('分类更新成功')
    } else {
      await createCategory(categoryForm)
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

onMounted(() => {
  loadCategories()
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
</style>
