/**
 * 文件上传相关 API
 * 包含图片上传、封面上传、头像上传等功能
 */

import request from './request';

export interface UploadResult {
  url: string;
  name: string;
  size: string;
}

/**
 * 上传单张图片（用于编辑器内）
 * @param file 图片文件
 */
export function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 批量上传图片
 * @param files 图片文件列表
 */
export function uploadImages(files: File[]): Promise<UploadResult[]> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  return request.post('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 上传封面图
 * @param file 封面图片
 */
export function uploadCover(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/upload/cover', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 上传头像
 * @param file 头像图片
 */
export function uploadAvatar(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 删除文件
 * @param url 文件URL
 */
export function deleteFile(url: string): Promise<void> {
  return request.delete('/upload/file', { params: { url } });
}
