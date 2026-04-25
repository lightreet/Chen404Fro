/**
 * 文件上传相关 API（统一走 multipart/form-data，减少重复）
 */

import request from './request';

export interface UploadResult {
  url: string;
  name: string;
  size?: string;
}

type UploadEndpoint = 'image' | 'cover' | 'avatar' | 'trust-attachment';

/**
 * 统一上传：将文件以 multipart 形式 POST 到指定上传端点
 */
function uploadFile(file: File, endpoint: UploadEndpoint): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  return request.post(`/upload/${endpoint}`, formData, { timeout: 60000 });
}

/** 上传单张图片（编辑器内） */
export function uploadImage(file: File): Promise<UploadResult> {
  return uploadFile(file, 'image');
}

/** 批量上传图片（并行） */
export async function uploadImages(files: File[]): Promise<UploadResult[]> {
  return Promise.all(files.map((file) => uploadFile(file, 'image')));
}

/** 上传封面图 */
export function uploadCover(file: File): Promise<UploadResult> {
  return uploadFile(file, 'cover');
}

/** 上传头像 */
export function uploadAvatar(file: File): Promise<UploadResult> {
  return uploadFile(file, 'avatar');
}

/** 上传受信申请附件 */
export function uploadTrustAttachment(file: File): Promise<UploadResult> {
  return uploadFile(file, 'trust-attachment');
}

/**
 * 删除文件
 * @param url 文件URL
 */
export function deleteFile(url: string): Promise<void> {
  return request.delete('/upload/file', { params: { url } });
}
