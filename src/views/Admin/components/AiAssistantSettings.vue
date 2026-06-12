<template>
  <section class="ai-settings" v-loading="loading">
    <div class="ai-settings__hero">
      <div>
        <p class="eyebrow">Lyra Control Room</p>
        <h3>AI 助手配置</h3>
      </div>
      <div class="hero-actions">
        <UiButton icon="refresh" :loading="loading" @click="loadConfig">重新加载</UiButton>
        <UiButton icon="connection" :loading="testing" @click="testConnection">测试连接</UiButton>
        <UiButton variant="primary" :loading="saving" @click="saveConfig">保存 AI 配置</UiButton>
      </div>
    </div>

    <div class="status-grid">
      <div class="status-card">
        <span>模型</span>
        <strong>{{ form.llm.model || '未指定' }}</strong>
      </div>
      <div class="status-card">
        <span>API Key</span>
        <strong>{{ form.llm.apiKeyConfigured ? form.llm.apiKeyPreview || '已配置' : '未配置' }}</strong>
      </div>
      <div class="status-card">
        <span>聊天能力</span>
        <strong>{{ form.chat.enabled ? '已开启' : '已关闭' }}</strong>
      </div>
      <div class="status-card">
        <span>站内检索</span>
        <strong>{{ form.chat.retrievalEnabled ? '已开启' : '已关闭' }}</strong>
      </div>
    </div>

    <UiTabs v-model="activePane" :items="paneItems" variant="line" class="ai-tabs">
      <div v-show="activePane === 'llm'">
        <div class="panel-grid">
          <el-form label-position="top" class="settings-form">
            <el-form-item label="启用模型调用">
              <el-switch v-model="form.llm.enabled" />
            </el-form-item>
            <el-form-item label="Base URL">
              <el-input v-model="form.llm.baseUrl" placeholder="https://api.openai.com/v1" />
            </el-form-item>
            <el-form-item label="模型名称">
              <el-input v-model="form.llm.model" placeholder="例如 gpt-5.4-mini、gpt-4.1-mini" />
            </el-form-item>
            <el-form-item label="API 风格">
              <el-select v-model="form.llm.apiStyle" class="full-width">
                <el-option label="Chat Completions" value="chat-completions" />
                <el-option label="Responses" value="responses" />
              </el-select>
            </el-form-item>
            <el-form-item label="API Key">
              <el-input
                v-model="form.llm.apiKey"
                type="password"
                show-password
                clearable
                placeholder="留空表示不修改已保存的 Key"
              />
              <p class="field-hint">
                {{ form.llm.apiKeyConfigured ? `当前已保存：${form.llm.apiKeyPreview || '已脱敏'}` : '当前还没有保存 API Key' }}
              </p>
            </el-form-item>
          </el-form>

          <el-form label-position="top" class="settings-form">
            <el-form-item label="Temperature">
              <el-slider v-model="form.llm.temperature" :min="0" :max="2" :step="0.1" show-input />
            </el-form-item>
            <el-form-item label="Max Tokens">
              <el-input-number v-model="form.llm.maxTokens" :min="128" :max="8192" :step="128" />
            </el-form-item>
            <el-form-item label="超时时间（秒）">
              <el-input-number v-model="form.llm.timeoutSeconds" :min="5" :max="120" />
            </el-form-item>
            <el-form-item label="测试消息">
              <el-input
                v-model="testMessage"
                type="textarea"
                :rows="4"
                maxlength="160"
                show-word-limit
                placeholder="例如：用 Lyra 的语气回复一句问候"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div v-show="activePane === 'persona'">
        <div class="panel-grid panel-grid--single">
          <el-form label-position="top" class="settings-form">
            <div class="form-row">
              <el-form-item label="名字">
                <el-input v-model="form.maid.name" placeholder="Lyra" />
              </el-form-item>
              <el-form-item label="人设版本">
                <el-input v-model="form.maid.personaVersion" placeholder="v1.1" />
              </el-form-item>
            </div>
            <el-form-item>
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
              <el-input
                v-model="form.maid.systemPrompt"
                type="textarea"
                :rows="5"
                placeholder="留空则使用 maid-system-prompt.txt 默认模板"
              />
            </el-form-item>
            <el-form-item>
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
              <el-input
                v-model="form.maid.helperPrompt"
                type="textarea"
                :rows="5"
                placeholder="留空则使用 maid-helper-task-prompt.txt 默认模板"
              />
            </el-form-item>
            <el-form-item>
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
              <el-input
                v-model="form.maid.companionPrompt"
                type="textarea"
                :rows="5"
                placeholder="留空则使用 maid-companion-task-prompt.txt 默认模板"
              />
            </el-form-item>
            <div class="persona-actions">
              <UiButton variant="primary" :loading="saving" @click="saveConfig">保存提示词设置</UiButton>
            </div>
          </el-form>
        </div>
      </div>

      <div v-show="activePane === 'chat'">
        <div class="panel-grid">
          <el-form label-position="top" class="settings-form">
            <el-form-item label="启用聊天">
              <el-switch v-model="form.chat.enabled" />
            </el-form-item>
            <el-form-item label="启用站内检索">
              <el-switch v-model="form.chat.retrievalEnabled" />
            </el-form-item>
            <el-form-item label="相关推荐需明确意图">
              <el-switch v-model="form.chat.requireRecommendIntentForRelatedArticles" />
            </el-form-item>
            <el-form-item label="引用数量">
              <el-input-number v-model="form.chat.maxCitationCount" :min="0" :max="8" />
            </el-form-item>
            <el-form-item label="相关文章数量">
              <el-input-number v-model="form.chat.relatedArticleLimit" :min="0" :max="6" />
            </el-form-item>
          </el-form>

          <el-form label-position="top" class="settings-form">
            <el-form-item label="上下文消息数">
              <el-input-number v-model="form.chat.maxContextMessages" :min="1" :max="20" />
            </el-form-item>
            <el-form-item label="文章正文注入字符数">
              <el-input-number v-model="form.chat.maxArticleContentChars" :min="500" :max="12000" :step="500" />
            </el-form-item>
            <el-form-item label="文章摘要注入字符数">
              <el-input-number v-model="form.chat.maxArticleSummaryChars" :min="80" :max="1000" :step="40" />
            </el-form-item>
            <el-form-item label="建议按钮数量">
              <el-input-number v-model="form.chat.maxSuggestionCount" :min="0" :max="5" />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div v-show="activePane === 'bubble'">
        <el-form label-position="top" class="settings-form">
          <el-form-item label="小气泡最大字符数">
            <el-input-number v-model="form.chat.bubbleMaxChars" :min="12" :max="60" />
          </el-form-item>
          <el-form-item>
            <template #label>
              <span class="field-label">
                长回复替代文案
                <UiTooltip content="长回复仍然完整展示在聊天面板里，小气泡只负责情绪反馈和引导。" placement="top">
                  <UiIcon name="info" class="field-help" />
                </UiTooltip>
              </span>
            </template>
            <el-input v-model="form.chat.bubbleLongReplyText" maxlength="40" show-word-limit />
          </el-form-item>
          <el-form-item>
            <template #label>
              <span class="field-label">
                Web Search 工具
                <UiTooltip content="当前为预留开关，后续接入真实搜索工具后可直接沿用。" placement="top">
                  <UiIcon name="info" class="field-help" />
                </UiTooltip>
              </span>
            </template>
            <el-switch v-model="form.tools.webSearchEnabled" />
          </el-form-item>
        </el-form>
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
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { notify } from '@/lib/feedback';
import { UiButton, UiTabs, UiTooltip, UiIcon } from '@/components/ui';
import type { UiTabItem } from '@/components/ui';
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
  display: grid;
  gap: 18px;
  min-width: 0;
}

.ai-settings__hero,
.status-card,
.settings-form {
  border: 1px solid rgba(235, 219, 228, 0.86);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(255, 249, 252, 0.78)),
    radial-gradient(circle at right top, rgba(255, 214, 230, 0.24), transparent 42%);
  box-shadow: 0 16px 32px rgba(151, 106, 127, 0.06);
}

.ai-settings__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 20px;
  border-radius: 18px;
  min-width: 0;

  h3 {
    margin: 4px 0 8px;
    color: #573848;
    font-size: 22px;
  }

  p {
    max-width: 760px;
    margin: 0;
    color: rgba(96, 72, 86, 0.72);
    line-height: 1.8;
  }
}

.eyebrow {
  color: #d984a5 !important;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 0 1 360px;

  :deep(.el-button) {
    margin-left: 0;
  }
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 12px;
  min-width: 0;
}

.status-card {
  padding: 16px;
  border-radius: 16px;
  min-width: 0;

  span {
    display: block;
    color: rgba(96, 72, 86, 0.62);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 8px;
    color: #573848;
    font-size: 16px;
    word-break: break-all;
  }
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  min-width: 0;
}

.panel-grid--single {
  grid-template-columns: 1fr;
}

.settings-form {
  padding: 18px;
  border-radius: 18px;
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
  color: rgba(217, 132, 165, 0.86);
  cursor: help;
  font-size: 15px;
  transform: translateY(1px);
  transition:
    color 0.18s ease,
    transform 0.18s ease;

  &:hover {
    color: #4f9fff;
    transform: translateY(1px) scale(1.08);
  }
}

.field-hint {
  margin: 8px 0 0;
  color: rgba(96, 72, 86, 0.62);
  font-size: 12px;
  line-height: 1.6;
}

.persona-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 4px;
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
  .ai-settings__hero {
    flex-direction: column;
  }

  .hero-actions {
    width: 100%;
    justify-content: flex-start;
    flex-basis: auto;
  }

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
  .ai-settings__hero {
    flex-direction: column;
  }

  .hero-actions {
    width: 100%;

    :deep(.el-button) {
      flex: 1;
    }
  }

  .persona-actions {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;

    :deep(.el-button) {
      flex: 1;
    }
  }
}
</style>
