/**
 * 表单校验工具（与后端规则对齐，减少重复）
 */
import type { FormItemRule } from 'element-plus';

/** 最大图片体积默认 12MB */
export const DEFAULT_IMAGE_MAX_MB = 12;

/** 头像最大 2MB */
export const AVATAR_MAX_MB = 2;

/**
 * 校验图片文件：类型与大小
 * @returns true 通过，false 不通过（调用方需自行 ElMessage）
 */
export function validateImageFile(
  file: File,
  maxSizeMb: number = DEFAULT_IMAGE_MAX_MB
): { valid: true } | { valid: false; message: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, message: '只能上传图片文件' };
  }
  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, message: `图片大小不能超过 ${maxSizeMb}MB` };
  }
  return { valid: true };
}

/**
 * 生成“确认密码”校验规则（与密码字段比对）
 * 用于注册、修改密码等表单项
 */
export function createConfirmPasswordRule(
  getPassword: () => string,
  fieldLabel = '确认密码'
): FormItemRule {
  return {
    validator: (_rule: unknown, value: string, callback: (err?: Error) => void) => {
      if (!value) {
        callback(new Error(`请输入${fieldLabel}`));
        return;
      }
      if (value !== getPassword()) {
        callback(new Error('两次输入的密码不一致'));
        return;
      }
      callback();
    },
    trigger: 'blur',
  };
}
