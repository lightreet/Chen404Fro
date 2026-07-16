<template>
  <UiLoadingState :loading="loading" message="正在加载 GitHub 配置..." class="github-settings">
    <header class="settings-toolbar">
      <div class="title-row">
        <h3>GitHub 开发同步</h3>
        <UiBadge :tone="form.tokenConfigured ? 'success' : 'info'">
          {{ form.tokenConfigured ? 'API 模式' : '公开源模式' }}
        </UiBadge>
      </div>
    </header>

    <dl class="status-strip">
      <div>
        <dt>仓库所有者</dt>
        <dd>{{ form.owner || '未配置' }}</dd>
      </div>
      <div>
        <dt>同步仓库</dt>
        <dd>{{ repositoryCount }} 个</dd>
      </div>
      <div>
        <dt>访问凭证</dt>
        <dd>{{ tokenStatus }}</dd>
      </div>
      <div>
        <dt>缓存周期</dt>
        <dd>{{ form.cacheMinutes }} 分钟</dd>
      </div>
    </dl>

    <div class="settings-grid">
      <section class="settings-section" aria-labelledby="github-source-title">
        <div class="section-title">
          <UiIcon name="branch" />
          <h4 id="github-source-title">仓库来源</h4>
        </div>

        <UiForm label-position="top" class="settings-form">
          <div class="form-row">
            <UiFormField label="仓库所有者">
              <UiInput v-model="form.owner" placeholder="例如 lightreet" />
            </UiFormField>
            <UiFormField label="默认分支">
              <UiInput v-model="form.branch" placeholder="main" />
            </UiFormField>
          </div>

          <UiFormField label="仓库列表">
            <UiTextarea
              v-model="repositoryText"
              :rows="5"
              placeholder="每行一个仓库，例如 Chen404Fro"
            />
          </UiFormField>

          <div class="form-row">
            <UiFormField label="GitHub API 地址">
              <UiInput v-model="form.apiBaseUrl" placeholder="https://api.github.com" />
            </UiFormField>
            <UiFormField label="GitHub 网页地址">
              <UiInput v-model="form.webBaseUrl" placeholder="https://github.com" />
            </UiFormField>
          </div>
        </UiForm>
      </section>

      <section class="settings-section" aria-labelledby="github-sync-title">
        <div class="section-title">
          <UiIcon name="commit" />
          <h4 id="github-sync-title">认证与同步</h4>
        </div>

        <UiForm label-position="top" class="settings-form">
          <UiFormField label="Fine-grained Token">
            <UiInput
              v-model="form.token"
              type="password"
              autocomplete="new-password"
              :placeholder="tokenPlaceholder"
            />
            <div class="token-row">
              <span>{{ tokenHint }}</span>
              <UiButton
                v-if="form.tokenConfigured && !clearToken"
                variant="text"
                size="sm"
                @click="clearToken = true"
              >
                清除已保存 Token
              </UiButton>
              <UiButton
                v-else-if="clearToken"
                variant="text"
                size="sm"
                @click="clearToken = false"
              >
                撤销清除
              </UiButton>
            </div>
          </UiFormField>

          <div class="numeric-grid">
            <UiFormField>
              <template #label>
                <span class="field-label">
                  缓存有效期（分钟）
                  <UiTooltip
                    content="同步成功后复用这批提交数据的时间。时间越短，页面更新越及时，但 GitHub 请求也会更多。"
                    placement="top"
                  >
                    <UiIcon name="info" class="field-help" />
                  </UiTooltip>
                </span>
              </template>
              <UiNumberField v-model="form.cacheMinutes" :min="1" :max="1440" />
            </UiFormField>
            <UiFormField>
              <template #label>
                <span class="field-label">
                  每仓库拉取条数
                  <UiTooltip
                    content="每次从一个仓库最多获取多少条提交。GitHub 单次 API 请求最多返回 100 条。"
                    placement="top"
                  >
                    <UiIcon name="info" class="field-help" />
                  </UiTooltip>
                </span>
              </template>
              <UiNumberField v-model="form.apiCommitLimit" :min="1" :max="100" />
            </UiFormField>
            <UiFormField>
              <template #label>
                <span class="field-label">
                  单次请求超时（秒）
                  <UiTooltip
                    content="等待 GitHub 单次响应的最长时间。超时后会尝试公开提交源或继续展示上次缓存。"
                    placement="top"
                  >
                    <UiIcon name="info" class="field-help" />
                  </UiTooltip>
                </span>
              </template>
              <UiNumberField v-model="form.requestTimeoutSeconds" :min="3" :max="120" />
            </UiFormField>
          </div>
        </UiForm>
      </section>
    </div>

    <AdminSettingsFooter>
      <UiButton variant="text" :disabled="saving || syncing" @click="loadConfig">重置</UiButton>
      <UiButton :loading="syncing" :disabled="saving" @click="refreshHistory">立即同步</UiButton>
      <UiButton variant="primary" :loading="saving" :disabled="syncing" @click="saveConfig">
        保存配置
      </UiButton>
    </AdminSettingsFooter>
  </UiLoadingState>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  UiBadge,
  UiButton,
  UiForm,
  UiFormField,
  UiIcon,
  UiInput,
  UiLoadingState,
  UiNumberField,
  UiTextarea,
  UiTooltip,
} from '@/components/ui'
import AdminSettingsFooter from '@/views/Admin/components/AdminSettingsFooter.vue'
import {
  getGitHubDevelopmentConfig,
  refreshGitHubDevelopmentHistory,
  updateGitHubDevelopmentConfig,
} from '@/api/development-history-admin'
import { notify } from '@/lib/feedback'
import type { GitHubDevelopmentAdminConfig } from '@/types/development-history'

const loading = ref(false)
const saving = ref(false)
const syncing = ref(false)
const repositoryText = ref('')
const clearToken = ref(false)
const form = reactive<GitHubDevelopmentAdminConfig>(createDefaultConfig())

const repositories = computed(() => parseRepositories(repositoryText.value))
const repositoryCount = computed(() => repositories.value.length)
const tokenStatus = computed(() => {
  if (clearToken.value) return '等待清除'
  if (form.token?.trim()) return '等待更新'
  return form.tokenConfigured ? form.tokenPreview || '已配置' : '未配置'
})
const tokenPlaceholder = computed(() =>
  form.tokenConfigured ? '留空则保留当前 Token' : 'github_pat_...',
)
const tokenHint = computed(() => {
  if (clearToken.value) return '保存后将清除 Token，并回退到公开 Atom 提交源'
  if (form.tokenConfigured) return `当前已保存：${form.tokenPreview || '已脱敏'}`
  return '未配置时使用 GitHub 公开 Atom 提交源'
})

function createDefaultConfig(): GitHubDevelopmentAdminConfig {
  return {
    owner: 'lightreet',
    repositories: ['Chen404Fro', 'Chen404Bac'],
    branch: 'main',
    token: '',
    tokenConfigured: false,
    tokenPreview: '',
    clearToken: false,
    cacheMinutes: 30,
    apiCommitLimit: 100,
    requestTimeoutSeconds: 12,
    apiBaseUrl: 'https://api.github.com',
    webBaseUrl: 'https://github.com',
  }
}

function applyConfig(config: GitHubDevelopmentAdminConfig) {
  Object.assign(form, createDefaultConfig(), config, {
    token: '',
    clearToken: false,
  })
  repositoryText.value = (config.repositories || []).join('\n')
  clearToken.value = false
}

function parseRepositories(value: string) {
  return [...new Set(value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean))]
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validateForm() {
  if (!form.owner.trim()) {
    notify.warning('请填写仓库所有者')
    return false
  }
  if (!form.branch.trim()) {
    notify.warning('请填写默认分支')
    return false
  }
  if (repositories.value.length === 0) {
    notify.warning('请至少配置一个仓库')
    return false
  }
  if (!isHttpUrl(form.apiBaseUrl) || !isHttpUrl(form.webBaseUrl)) {
    notify.warning('GitHub 地址必须是有效的 http/https 地址')
    return false
  }
  return true
}

function toPayload(): GitHubDevelopmentAdminConfig {
  return {
    ...form,
    owner: form.owner.trim(),
    branch: form.branch.trim(),
    repositories: repositories.value,
    token: form.token?.trim() || '',
    clearToken: clearToken.value && !form.token?.trim(),
    apiBaseUrl: form.apiBaseUrl.trim(),
    webBaseUrl: form.webBaseUrl.trim(),
  }
}

async function loadConfig() {
  loading.value = true
  try {
    applyConfig(await getGitHubDevelopmentConfig())
  } catch {
    notify.error('加载 GitHub 开发同步配置失败')
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  if (!validateForm()) return
  saving.value = true
  try {
    applyConfig(await updateGitHubDevelopmentConfig(toPayload()))
    notify.success('GitHub 开发同步配置已保存')
  } catch {
    notify.error('保存 GitHub 开发同步配置失败')
  } finally {
    saving.value = false
  }
}

async function refreshHistory() {
  syncing.value = true
  try {
    const history = await refreshGitHubDevelopmentHistory()
    notify.success(`同步完成，共获取 ${history.totalCommits} 条提交`)
  } catch {
    notify.error('开发历程同步失败，请检查当前配置')
  } finally {
    syncing.value = false
  }
}

watch(
  () => form.token,
  (token) => {
    if (token?.trim()) clearToken.value = false
  },
)

onMounted(() => {
  void loadConfig()
})
</script>

<style scoped lang="scss">
.github-settings {
  min-width: 0;

  > :deep(.ui-loading-state__content) {
    display: grid;
    gap: 28px;
    min-width: 0;
  }
}

.settings-toolbar,
.title-row,
.section-title,
.token-row,
.field-label {
  display: flex;
  align-items: center;
}

.settings-toolbar {
  min-height: 32px;
}

.title-row {
  gap: 10px;
}

.settings-toolbar h3,
.section-title h4 {
  margin: 0;
  color: var(--color-text-primary);
  letter-spacing: 0;
}

.settings-toolbar h3 {
  font-size: 20px;
}

.status-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
}

.status-strip > div {
  --metric-tint: var(--primary);

  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  min-height: 76px;
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  background: color-mix(in oklch, var(--color-surface) 92%, var(--metric-tint));
}

.status-strip > div:nth-child(2) {
  --metric-tint: oklch(72% 0.08 310);
}

.status-strip > div:nth-child(3) {
  --metric-tint: oklch(72% 0.08 245);
}

.status-strip > div:nth-child(4) {
  --metric-tint: var(--success);
}

.status-strip dt {
  color: color-mix(in oklch, var(--color-text-primary) 60%, var(--metric-tint));
  font-size: 11px;
}

.status-strip dd {
  overflow: hidden;
  margin: 6px 0 0;
  color: color-mix(in oklch, var(--color-text-primary) 90%, var(--metric-tint));
  font-size: 14px;
  font-weight: 620;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 36px;
  min-width: 0;
}

.settings-section {
  min-width: 0;
}

.section-title {
  align-items: center;
  gap: 10px;
  margin-bottom: var(--space-lg);
}

.section-title > :first-child {
  flex: 0 0 auto;
  color: var(--color-accent-strong);
  font-size: 18px;
}

.section-title h4 {
  font-size: 15px;
}

.settings-form,
.form-row,
.numeric-grid {
  min-width: 0;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.numeric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.token-row {
  justify-content: space-between;
  gap: 10px;
  margin-top: 7px;
  color: var(--color-text-tertiary);
  font-size: 11px;
  flex-wrap: wrap;
}

.field-label {
  gap: 6px;
}

.field-help {
  color: var(--color-text-tertiary);
  font-size: 14px;
  cursor: help;
}

@media (max-width: 1280px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .settings-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .status-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .form-row,
  .numeric-grid {
    grid-template-columns: 1fr;
  }

  .token-row {
    align-items: flex-start;
    flex-direction: column;
  }

}
</style>
