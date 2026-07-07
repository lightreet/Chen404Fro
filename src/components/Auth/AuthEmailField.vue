<template>
  <div class="auth-email-field" :class="{ 'auth-email-field--active': isFocused }">
    <div class="auth-email-field__main">
      <span class="auth-email-field__icon">
        <UiIcon name="mail" />
      </span>
      <UiInput
        :model-value="localPart"
        class="auth-email-field__input"
        :placeholder="placeholder"
        :size="size"
        borderless
        autocomplete="email"
        @update:model-value="handleLocalPartInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
    <div class="auth-email-field__divider"></div>
    <UiSelect
      :model-value="domain"
      class="auth-email-field__select"
      :size="size"
      borderless
      :options="domainOptions"
      @update:model-value="handleDomainUpdate"
      @change="handleDomainChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { UiIcon, UiInput, UiSelect } from '@/components/ui'
import type { UiSelectOption, UiSize } from '@/components/ui'

type EmailDomainValue = string | number | boolean | Array<string | number | boolean> | null | undefined

const DEFAULT_EMAIL_DOMAIN = '@qq.com'
const EMAIL_DOMAIN_OPTIONS: UiSelectOption[] = [
  { label: '@qq.com', value: '@qq.com' },
  { label: '@163.com', value: '@163.com' },
  { label: '@126.com', value: '@126.com' },
  { label: '@gmail.com', value: '@gmail.com' },
  { label: '@outlook.com', value: '@outlook.com' },
  { label: '@hotmail.com', value: '@hotmail.com' },
  { label: '@foxmail.com', value: '@foxmail.com' },
  { label: '@icloud.com', value: '@icloud.com' },
  { label: '@yeah.net', value: '@yeah.net' },
  { label: '@sina.com', value: '@sina.com' },
]

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  size?: UiSize
  domains?: UiSelectOption[]
}>(), {
  modelValue: '',
  placeholder: '请输入邮箱账号',
  size: 'lg',
  domains: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'focus', ev: FocusEvent): void
  (e: 'blur', ev: FocusEvent): void
}>()

const isFocused = ref(false)
const localPart = ref('')
const domain = ref(DEFAULT_EMAIL_DOMAIN)

const domainOptions = computed(() => props.domains?.length ? props.domains : EMAIL_DOMAIN_OPTIONS)

function composeEmail(local: string, suffix: string) {
  const normalizedLocal = local.trim().replace(/\s+/g, '')
  return normalizedLocal ? `${normalizedLocal}${suffix}` : ''
}

function splitEmail(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return { localPart: '', domain: domainOptions.value[0]?.value?.toString() || DEFAULT_EMAIL_DOMAIN }
  }

  const atIndex = normalized.indexOf('@')
  if (atIndex <= 0) {
    return {
      localPart: normalized.replace(/\s+/g, ''),
      domain: domainOptions.value[0]?.value?.toString() || DEFAULT_EMAIL_DOMAIN,
    }
  }

  const rawLocalPart = normalized.slice(0, atIndex).replace(/\s+/g, '')
  const rawDomain = normalized.slice(atIndex)
  const matchedDomain = domainOptions.value.find((option) => option.value === rawDomain)
  return {
    localPart: rawLocalPart,
    domain: matchedDomain?.value?.toString() || rawDomain || DEFAULT_EMAIL_DOMAIN,
  }
}

function syncFromModel(nextValue: string) {
  const next = splitEmail(nextValue)
  localPart.value = next.localPart
  domain.value = next.domain
}

function emitEmail(emitChange = false) {
  const nextEmail = composeEmail(localPart.value, domain.value)
  emit('update:modelValue', nextEmail)
  if (emitChange) {
    emit('change', nextEmail)
  }
}

function handleLocalPartInput(value: string) {
  localPart.value = value
  emitEmail(true)
}

function resolveDomainValue(value: EmailDomainValue) {
  return Array.isArray(value) ? value[0] : value
}

function handleDomainUpdate(value: EmailDomainValue) {
  domain.value = String(resolveDomainValue(value) ?? DEFAULT_EMAIL_DOMAIN)
  emitEmail(true)
}

function handleDomainChange(value: EmailDomainValue) {
  domain.value = String(resolveDomainValue(value) ?? DEFAULT_EMAIL_DOMAIN)
  emitEmail(true)
}

function handleFocus(ev: FocusEvent) {
  isFocused.value = true
  emit('focus', ev)
}

function handleBlur(ev: FocusEvent) {
  isFocused.value = false
  emitEmail(true)
  emit('blur', ev)
}

watch(() => props.modelValue, (nextValue) => {
  const currentEmail = composeEmail(localPart.value, domain.value)
  if ((nextValue || '') === currentEmail) {
    return
  }
  syncFromModel(nextValue || '')
}, { immediate: true })
</script>

<style scoped lang="scss">
.auth-email-field {
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: var(--control-height-lg);
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: 0 0 0 1px var(--color-border) inset;
  transition: box-shadow var(--motion-duration-base) var(--motion-ease-standard);

  &:hover {
    box-shadow: 0 0 0 1px var(--primary-light) inset;
  }
}

.auth-email-field--active {
  box-shadow: 0 0 0 2px var(--primary) inset;
}

.auth-email-field__main {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.auth-email-field__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  color: var(--color-text-tertiary);
  font-size: 15px;
  flex-shrink: 0;
}

.auth-email-field__input {
  flex: 1;
  min-width: 0;

  :deep(.ui-input) {
    height: 100%;
    height: 100%;
  }

  :deep(.ui-input__inner) {
    padding-inline: 0 12px;
  }

  :deep(.ui-input__inner::placeholder) {
    color: var(--color-text-tertiary);
  }

  :deep(.ui-input__inner) {
    color: var(--color-text-primary);
  }
}

.auth-email-field__divider {
  width: 1px;
  margin: 10px 0;
  background: linear-gradient(
    180deg,
    rgba(227, 229, 231, 0),
    rgba(227, 229, 231, 0.95) 18%,
    rgba(227, 229, 231, 0.95) 82%,
    rgba(227, 229, 231, 0)
  );
}

.auth-email-field__select {
  width: 154px;
  flex-shrink: 0;

  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-select__wrapper) {
    min-height: var(--control-height-lg);
    padding-inline: 12px 12px;
  }

  :deep(.el-select__selected-item) {
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  :deep(.el-select__caret) {
    color: var(--color-text-tertiary);
  }
}

@media (max-width: 520px) {
  .auth-email-field {
    flex-direction: column;
    border-radius: var(--radius-md);
  }

  .auth-email-field__divider {
    width: auto;
    height: 1px;
    margin: 0 14px;
    background: linear-gradient(
      90deg,
      rgba(243, 199, 215, 0),
      rgba(243, 199, 215, 0.9) 18%,
      rgba(243, 199, 215, 0.9) 82%,
      rgba(243, 199, 215, 0)
    );
  }

  .auth-email-field__select {
    width: 100%;
  }
}
</style>
