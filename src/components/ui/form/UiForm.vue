<template>
  <el-form ref="formRef" class="ui-form" v-bind="$attrs">
    <slot />
  </el-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElForm } from 'element-plus'
import type { FormInstance } from 'element-plus'

const formRef = ref<FormInstance>()

defineExpose({
  validate: async () => (await formRef.value?.validate()) ?? false,
  clearValidate: (props?: string | string[]) => formRef.value?.clearValidate(props),
  resetFields: (props?: string | string[]) => formRef.value?.resetFields(props),
  scrollToField: (prop: string) => formRef.value?.scrollToField(prop),
})
</script>

<style scoped lang="scss">
.ui-form {
  width: 100%;
}
</style>
