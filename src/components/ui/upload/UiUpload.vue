<template>
  <el-upload
    class="ui-upload"
    :show-file-list="showFileList"
    :before-upload="beforeUpload"
    :http-request="httpRequest"
    :accept="accept"
    :multiple="multiple"
    :drag="drag"
    :disabled="disabled"
    :limit="limit"
    :auto-upload="autoUpload"
  >
    <slot />
  </el-upload>
</template>

<script setup lang="ts">
import { ElUpload } from 'element-plus'
import type { UploadRequestHandler, UploadRequestOptions } from 'element-plus'

withDefaults(
  defineProps<{
    showFileList?: boolean
    beforeUpload?: (file: File) => boolean | Promise<boolean>
    httpRequest?: UploadRequestHandler
    accept?: string
    multiple?: boolean
    drag?: boolean
    disabled?: boolean
    limit?: number
    autoUpload?: boolean
  }>(),
  {
    showFileList: false,
    beforeUpload: undefined,
    httpRequest: undefined,
    accept: '',
    multiple: false,
    drag: false,
    disabled: false,
    limit: undefined,
    autoUpload: true,
  },
)

export type { UploadRequestHandler, UploadRequestOptions }
</script>

<style scoped lang="scss">
.ui-upload {
  display: inline-flex;
}
</style>
