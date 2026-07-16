<template>
  <UiLoadingState :loading="loading" message="正在加载 AI 配置..." class="ai-settings">
    <header class="ai-settings__header">
      <div class="title-row">
        <h3>AI 助手配置</h3>
        <UiBadge :tone="form.llm.enabled ? 'success' : 'info'">
          {{ form.llm.enabled ? '已启用' : '已停用' }}
        </UiBadge>
      </div>
    </header>

    <dl class="status-strip">
      <div>
        <dt>模型</dt>
        <dd>{{ form.llm.model || '未指定' }}</dd>
      </div>
      <div>
        <dt>API Key</dt>
        <dd>{{ form.llm.apiKeyConfigured ? form.llm.apiKeyPreview || '已配置' : '未配置' }}</dd>
      </div>
      <div>
        <dt>聊天能力</dt>
        <dd>{{ form.chat.enabled ? '已开启' : '已关闭' }}</dd>
      </div>
      <div>
        <dt>站内检索</dt>
        <dd>{{ form.chat.retrievalEnabled ? '已开启' : '已关闭' }}</dd>
      </div>
    </dl>

    <UiTabs v-model="activePane" :items="paneItems" variant="line" class="ai-tabs">
      <div v-show="activePane === 'llm'">
        <div class="panel-grid">
          <UiForm label-position="top" class="settings-form">
            <UiFormField label="启用模型调用">
              <UiSwitch v-model="form.llm.enabled" />
            </UiFormField>
            <UiFormField label="Base URL">
              <UiInput v-model="form.llm.baseUrl" placeholder="https://api.openai.com/v1" />
            </UiFormField>
            <UiFormField label="模型名称">
              <UiInput v-model="form.llm.model" placeholder="例如 gpt-5.4-mini、gpt-4.1-mini" />
            </UiFormField>
            <UiFormField label="API 风格">
              <UiSelect
                v-model="form.llm.apiStyle"
                class="full-width"
                :options="[
                  { label: 'Chat Completions', value: 'chat-completions' },
                  { label: 'Responses', value: 'responses' },
                ]"
              />
            </UiFormField>
            <UiFormField label="API Key">
              <UiInput
                v-model="form.llm.apiKey"
                type="password"
                clearable
                placeholder="留空表示不修改已保存的 Key"
              />
              <p class="field-hint">
                {{ form.llm.apiKeyConfigured ? `当前已保存：${form.llm.apiKeyPreview || '已脱敏'}` : '当前还没有保存 API Key' }}
              </p>
            </UiFormField>
          </UiForm>

          <UiForm label-position="top" class="settings-form">
            <UiFormField label="回复随机度">
              <UiSlider v-model="form.llm.temperature" :min="0" :max="2" :step="0.1" show-input />
            </UiFormField>
            <UiFormField label="最大输出 Token">
              <UiNumberField v-model="form.llm.maxTokens" :min="128" :max="8192" :step="128" />
            </UiFormField>
            <UiFormField label="超时时间（秒）">
              <UiNumberField v-model="form.llm.timeoutSeconds" :min="5" :max="120" />
            </UiFormField>
            <UiFormField label="测试消息">
              <UiTextarea
                v-model="testMessage"
                :rows="4"
                maxlength="160"
                show-count
                placeholder="例如：用 Lyra 的语气回复一句问候"
              />
            </UiFormField>
          </UiForm>
        </div>
      </div>

      <div v-show="activePane === 'persona'">
        <div class="panel-grid panel-grid--single">
          <UiForm label-position="top" class="settings-form">
            <div class="form-row">
              <UiFormField label="名字">
                <UiInput v-model="form.maid.name" placeholder="Lyra" />
              </UiFormField>
              <UiFormField label="人设版本">
                <UiInput v-model="form.maid.personaVersion" placeholder="v1.1" />
              </UiFormField>
            </div>
            <UiFormField>
              <template #label>
                <span class="field-label">
                  系统提示词
                  <UiTooltip
                    content="控制 Lyra 的基础人设、语气、能力边界和回复长度规则。留空时使用后端 resources/prompts/ai 下的默认模板。"
                    placement="top"
                  >
                    <UiIcon name="info" class="field-help" />
                  </UiTooltip>
                </span>
              </template>
              <UiTextarea
                v-model="form.maid.systemPrompt"
                :rows="5"
                placeholder="留空则使用 maid-system-prompt.txt 默认模板"
              />
            </UiFormField>
            <UiFormField>
              <template #label>
                <span class="field-label">
                  站内助手场景提示词
                  <UiTooltip
                    content="控制总结文章、站内检索、引用和推荐等 helper 场景行为。留空时使用默认模板。"
                    placement="top"
                  >
                    <UiIcon name="info" class="field-help" />
                  </UiTooltip>
                </span>
              </template>
              <UiTextarea
                v-model="form.maid.helperPrompt"
                :rows="5"
                placeholder="留空则使用 maid-helper-task-prompt.txt 默认模板"
              />
            </UiFormField>
            <UiFormField>
              <template #label>
                <span class="field-label">
                  陪聊场景提示词
                  <UiTooltip
                    content="控制轻量陪伴、闲聊和从陪聊切回内容帮助的 companion 场景行为。留空时使用默认模板。"
                    placement="top"
                  >
                    <UiIcon name="info" class="field-help" />
                  </UiTooltip>
                </span>
              </template>
              <UiTextarea
                v-model="form.maid.companionPrompt"
                :rows="5"
                placeholder="留空则使用 maid-companion-task-prompt.txt 默认模板"
              />
            </UiFormField>
          </UiForm>
        </div>
      </div>

      <div v-show="activePane === 'chat'">
        <div class="panel-grid">
          <UiForm label-position="top" class="settings-form">
            <UiFormField label="启用聊天">
              <UiSwitch v-model="form.chat.enabled" />
            </UiFormField>
            <UiFormField label="启用站内检索">
              <UiSwitch v-model="form.chat.retrievalEnabled" />
            </UiFormField>
            <UiFormField label="相关推荐需明确意图">
              <UiSwitch v-model="form.chat.requireRecommendIntentForRelatedArticles" />
            </UiFormField>
            <UiFormField label="引用数量">
              <UiNumberField v-model="form.chat.maxCitationCount" :min="0" :max="8" />
            </UiFormField>
            <UiFormField label="相关文章数量">
              <UiNumberField v-model="form.chat.relatedArticleLimit" :min="0" :max="6" />
            </UiFormField>
          </UiForm>

          <UiForm label-position="top" class="settings-form">
            <UiFormField label="上下文消息数">
              <UiNumberField v-model="form.chat.maxContextMessages" :min="1" :max="20" />
            </UiFormField>
            <UiFormField label="文章正文注入字符数">
              <UiNumberField v-model="form.chat.maxArticleContentChars" :min="500" :max="12000" :step="500" />
            </UiFormField>
            <UiFormField label="文章摘要注入字符数">
              <UiNumberField v-model="form.chat.maxArticleSummaryChars" :min="80" :max="1000" :step="40" />
            </UiFormField>
            <UiFormField label="建议按钮数量">
              <UiNumberField v-model="form.chat.maxSuggestionCount" :min="0" :max="5" />
            </UiFormField>
          </UiForm>
        </div>
      </div>

      <div v-show="activePane === 'bubble'">
        <UiForm label-position="top" class="settings-form">
          <UiFormField label="小气泡最大字符数">
            <UiNumberField v-model="form.chat.bubbleMaxChars" :min="12" :max="60" />
          </UiFormField>
          <UiFormField>
            <template #label>
              <span class="field-label">
                长回复替代文案
                <UiTooltip content="长回复仍然完整展示在聊天面板里，小气泡只负责情绪反馈和引导。" placement="top">
                  <UiIcon name="info" class="field-help" />
                </UiTooltip>
              </span>
            </template>
            <UiInput v-model="form.chat.bubbleLongReplyText" maxlength="40" show-word-limit />
          </UiFormField>
          <UiFormField>
            <template #label>
              <span class="field-label">
                Web Search 工具
                <UiTooltip content="当前为预留开关，后续接入真实搜索工具后可直接沿用。" placement="top">
                  <UiIcon name="info" class="field-help" />
                </UiTooltip>
              </span>
            </template>
            <UiSwitch v-model="form.tools.webSearchEnabled" />
          </UiFormField>
        </UiForm>
      </div>
    </UiTabs>

    <div
      v-if="testResult"
      class="test-result"
      :class="testResult.success ? 'test-result--success' : 'test-result--error'"
    >
      <div class="test-result__head">
        <UiIcon :name="testResult.success ? 'success' : 'error'" />
        <strong>{{ testResult.message }}</strong>
      </div>
      <p v-if="testResult.sampleText">{{ testResult.sampleText }}</p>
      <p v-if="testResult.latencyMs">耗时：{{ testResult.latencyMs }}ms</p>
    </div>

    <AdminSettingsFooter>
      <UiButton variant="text" :disabled="saving || testing" @click="loadConfig">重置</UiButton>
      <UiButton icon="connection" :loading="testing" :disabled="saving" @click="testConnection">
        测试连接
      </UiButton>
      <UiButton variant="primary" :loading="saving" :disabled="testing" @click="saveConfig">
        保存配置
      </UiButton>
    </AdminSettingsFooter>
  </UiLoadingState>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { notify } from '@/lib/feedback';
import { UiBadge, UiButton, UiTabs, UiTooltip, UiForm, UiFormField, UiIcon, UiInput, UiLoadingState, UiSwitch, UiSelect, UiSlider, UiNumberField, UiTextarea } from '@/components/ui';
import type { UiTabItem } from '@/components/ui';
import AdminSettingsFooter from '@/views/Admin/components/AdminSettingsFooter.vue';
import { getAiAdminConfig, testAiAdminConfig, updateAiAdminConfig } from '@/api/ai-admin';
import type { AiAdminConfig, AiConfigTestResponse } from '@/types';

const paneItems: UiTabItem[] = [
  { label: '模型调用', value: 'llm' },
  { label: '女仆人设', value: 'persona' },
  { label: '聊天与检索', value: 'chat' },
  { label: '小气泡', value: 'bubble' },
];

const activePane = ref('llm');
const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const testMessage = ref('你好，Lyra。请用一句话确认你可以正常工作。');
const testResult = ref<AiConfigTestResponse | null>(null);

const form = reactive<AiAdminConfig>(createDefaultConfig());

function createDefaultConfig(): AiAdminConfig {
  return {
    llm: {
      enabled: false,
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-5.4-mini',
      apiStyle: 'chat-completions',
      apiKey: '',
      apiKeyConfigured: false,
      apiKeyPreview: '',
      temperature: 0.2,
      maxTokens: 512,
      timeoutSeconds: 30,
    },
    maid: {
      name: 'Lyra',
      personaVersion: 'v1.1',
      systemPrompt: '',
      helperPrompt: '',
      companionPrompt: '',
    },
    chat: {
      enabled: true,
      retrievalEnabled: true,
      maxCitationCount: 3,
      maxContextMessages: 8,
      maxArticleContentChars: 3000,
      maxArticleSummaryChars: 300,
      maxSuggestionCount: 3,
      relatedArticleLimit: 2,
      requireRecommendIntentForRelatedArticles: true,
      bubbleMaxChars: 36,
      bubbleLongReplyText: '我整理好了，打开聊天框看详细内容吧。',
    },
    tools: {
      webSearchEnabled: false,
    },
  };
}

function applyConfig(config: AiAdminConfig) {
  const next = createDefaultConfig();
  Object.assign(next.llm, config.llm ?? {});
  Object.assign(next.maid, config.maid ?? {});
  Object.assign(next.chat, config.chat ?? {});
  Object.assign(next.tools, config.tools ?? {});
  next.llm.apiKey = '';
  Object.assign(form.llm, next.llm);
  Object.assign(form.maid, next.maid);
  Object.assign(form.chat, next.chat);
  Object.assign(form.tools, next.tools);
}

function toPayload(): AiAdminConfig {
  return {
    llm: { ...form.llm },
    maid: { ...form.maid },
    chat: { ...form.chat },
    tools: { ...form.tools },
  };
}

async function loadConfig() {
  loading.value = true;
  try {
    applyConfig(await getAiAdminConfig());
  } catch {
    notify.error('加载 AI 配置失败');
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  saving.value = true;
  try {
    applyConfig(await updateAiAdminConfig(toPayload()));
    notify.success('AI 配置已保存');
  } catch {
    notify.error('保存 AI 配置失败');
  } finally {
    saving.value = false;
  }
}

async function testConnection() {
  testing.value = true;
  testResult.value = null;
  try {
    testResult.value = await testAiAdminConfig({
      message: testMessage.value,
      useUnsavedConfig: true,
      config: toPayload(),
    });
    if (testResult.value.success) {
      notify.success('模型连接测试成功');
    } else {
      notify.warning(testResult.value.message || '模型连接测试失败');
    }
  } catch {
    notify.error('模型连接测试失败');
  } finally {
    testing.value = false;
  }
}

onMounted(() => {
  void loadConfig();
});
</script>

<style scoped lang="scss">
.ai-settings {
  min-width: 0;

  > :deep(.ui-loading-state__content) {
    display: grid;
    gap: 28px;
    min-width: 0;
  }
}

.ai-settings__header,
.title-row {
  display: flex;
  align-items: center;
}

.ai-settings__header {
  min-height: 32px;
}

.title-row {
  gap: 10px;

  h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 20px;
    letter-spacing: 0;
  }
}

.status-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.status-strip > div {
  --metric-tint: var(--primary);

  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 76px;
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  background: color-mix(in oklch, var(--color-surface) 92%, var(--metric-tint));
  min-width: 0;
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

.ai-tabs {
  min-width: 0;

  :deep(.ui-tabs__panel) {
    padding-top: 24px;
  }

  :deep(.ui-tabs__nav) {
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
  }

  :deep(.ui-tabs__nav::-webkit-scrollbar) {
    display: none;
  }

  :deep(.ui-tabs__tab) {
    flex: 0 0 auto;
    white-space: nowrap;
  }
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 36px;
  min-width: 0;
}

.panel-grid--single {
  grid-template-columns: 1fr;
}

.settings-form {
  min-width: 0;

  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  min-width: 0;
}

.full-width {
  width: 100%;
}

.field-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.field-help {
  color: var(--color-text-tertiary);
  cursor: help;
  font-size: 14px;
  transition: color var(--motion-duration-fast) var(--motion-ease-standard);

  &:hover {
    color: var(--primary);
  }
}

.field-hint {
  margin: 8px 0 0;
  color: rgba(96, 72, 86, 0.62);
  font-size: 12px;
  line-height: 1.6;
}

.test-result {
  border-radius: 14px;
  padding: 14px 16px;
  border: 1px solid var(--color-border-light);

  p {
    margin: 6px 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
}

.test-result__head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-md);
}

.test-result--success {
  background: var(--color-success-soft);
  .test-result__head {
    color: var(--color-success);
  }
}

.test-result--error {
  background: var(--color-danger-soft);
  .test-result__head {
    color: var(--color-danger);
  }
}

@media (max-width: 1360px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1080px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .status-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ai-settings {
    > :deep(.ui-loading-state__content) {
      gap: var(--space-lg);
    }
  }
}
</style>
