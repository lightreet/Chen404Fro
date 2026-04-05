/**
 * Form validation helpers aligned with backend rules.
 */
import type { FormItemRule } from 'element-plus';

export const DEFAULT_IMAGE_MAX_MB = 12;
export const AVATAR_MAX_MB = 2;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export function validateImageFile(
  file: File,
  maxSizeMb: number = DEFAULT_IMAGE_MAX_MB
): { valid: true } | { valid: false; message: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, message: '只能上传图片文件（支持 GIF 动图）' };
  }

  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, message: `图片大小不能超过 ${maxSizeMb}MB` };
  }

  return { valid: true };
}

export function isValidUsername(value: string): boolean {
  const normalized = value.trim();
  return (
    normalized.length >= USERNAME_MIN_LENGTH &&
    normalized.length <= USERNAME_MAX_LENGTH &&
    USERNAME_REGEX.test(normalized)
  );
}

export function createUsernameRules(fieldLabel = '用户名'): FormItemRule[] {
  return [
    { required: true, message: `请输入${fieldLabel}`, trigger: 'blur' },
    {
      min: USERNAME_MIN_LENGTH,
      max: USERNAME_MAX_LENGTH,
      message: `${fieldLabel}长度需为 ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} 位`,
      trigger: 'blur',
    },
    {
      pattern: USERNAME_REGEX,
      message: `${fieldLabel}只能包含字母、数字、下划线`,
      trigger: 'blur',
    },
  ];
}

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
