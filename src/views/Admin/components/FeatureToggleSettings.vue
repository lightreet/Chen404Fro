<template>
  <UiLoadingState :loading="loading" message="正在加载功能开关..." class="feature-settings">
    <header class="feature-settings__header">
      <div>
        <h3>运行时功能开关</h3>
        <p>保存后立即影响新的业务请求，不需要修改服务器配置或重启后端。</p>
      </div>
      <UiBadge v-if="hasLoadedConfig" tone="info">
        已开启 {{ enabledCount }}/{{ featureCount }}
      </UiBadge>
      <UiBadge v-else tone="warning">配置未加载</UiBadge>
    </header>

    <div class="behavior-note" role="note">
      <UiIcon name="info" />
      <p>关闭知友创作只收回新增、编辑和删除能力，用户仍可查看自己的历史记录；管理员始终保留维护权限。</p>
    </div>

    <section class="feature-group" aria-labelledby="collaboration-features-title">
      <div class="feature-group__heading">
        <h4 id="collaboration-features-title">知友共创</h4>
        <p>分别控制知友参与三类内容创作的能力。</p>
      </div>
      <div class="feature-list">
        <div class="feature-row">
          <div>
            <h5 id="article-creation-label">文章创作</h5>
            <p>允许知友新建、编辑和删除自己创作的文章。</p>
          </div>
          <UiSwitch
            v-model="form.articleCreationEnabled"
            :disabled="controlsDisabled"
            active-text="开启"
            inactive-text="关闭"
            aria-labelledby="article-creation-label"
          />
        </div>
        <div class="feature-row">
          <div>
            <h5 id="travel-creation-label">旅行创作</h5>
            <p>允许知友维护自己的旅行地点、行程和照片。</p>
          </div>
          <UiSwitch
            v-model="form.travelCreationEnabled"
            :disabled="controlsDisabled"
            active-text="开启"
            inactive-text="关闭"
            aria-labelledby="travel-creation-label"
          />
        </div>
        <div class="feature-row">
          <div>
            <h5 id="music-creation-label">音乐创作</h5>
            <p>允许知友上传并管理自己的音乐曲目。</p>
          </div>
          <UiSwitch
            v-model="form.musicCreationEnabled"
            :disabled="controlsDisabled"
            active-text="开启"
            inactive-text="关闭"
            aria-labelledby="music-creation-label"
          />
        </div>
      </div>
    </section>

    <section class="feature-group" aria-labelledby="site-features-title">
      <div class="feature-group__heading">
        <h4 id="site-features-title">站点协作</h4>
        <p>控制后台接收共创活动提醒的方式。</p>
      </div>
      <div class="feature-list">
        <div class="feature-row">
          <div>
            <h5 id="admin-notification-label">管理员消息中心</h5>
            <p>记录知友发布内容、导入书籍和提交申请等站内消息。</p>
          </div>
          <UiSwitch
            v-model="form.adminNotificationEnabled"
            :disabled="controlsDisabled"
            active-text="开启"
            inactive-text="关闭"
            aria-labelledby="admin-notification-label"
          />
        </div>
      </div>
    </section>

    <section class="feature-group" aria-labelledby="ai-features-title">
      <div class="feature-group__heading">
        <h4 id="ai-features-title">AI 业务能力</h4>
        <p>这些开关控制具体入口，模型连接和参数仍在“AI 助手”中管理。</p>
      </div>
      <div class="feature-list">
        <div class="feature-row">
          <div>
            <h5 id="ai-article-assist-label">文章摘要与标签</h5>
            <p>允许编辑器根据正文生成摘要和标签建议。</p>
          </div>
          <UiSwitch
            v-model="form.aiArticleAssistEnabled"
            :disabled="controlsDisabled"
            active-text="开启"
            inactive-text="关闭"
            aria-labelledby="ai-article-assist-label"
          />
        </div>
        <div class="feature-row">
          <div>
            <h5 id="ai-music-assist-label">音乐信息补全</h5>
            <p>允许后台根据曲名和现有资料生成候选元数据。</p>
          </div>
          <UiSwitch
            v-model="form.aiMusicAssistEnabled"
            :disabled="controlsDisabled"
            active-text="开启"
            inactive-text="关闭"
            aria-labelledby="ai-music-assist-label"
          />
        </div>
        <div class="feature-row">
          <div>
            <h5 id="ai-article-recommend-label">相关文章推荐</h5>
            <p>允许 Lyra 在合适的对话中返回站内相关文章。</p>
          </div>
          <UiSwitch
            v-model="form.aiArticleRecommendEnabled"
            :disabled="controlsDisabled"
            active-text="开启"
            inactive-text="关闭"
            aria-labelledby="ai-article-recommend-label"
          />
        </div>
      </div>
    </section>

    <AdminSettingsFooter>
      <UiButton variant="text" :disabled="loading || saving" @click="loadConfig">
        {{ hasLoadedConfig ? '恢复已保存值' : '重新加载' }}
      </UiButton>
      <UiButton
        variant="primary"
        :loading="saving"
        :disabled="loading || !hasLoadedConfig"
        @click="saveConfig"
      >
        保存功能开关
      </UiButton>
    </AdminSettingsFooter>
  </UiLoadingState>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getFeatureToggleConfig, updateFeatureToggleConfig } from '@/api/feature-toggle-admin'
import { UiBadge, UiButton, UiIcon, UiLoadingState, UiSwitch } from '@/components/ui'
import { notify } from '@/lib/feedback'
import type { FeatureToggleConfig } from '@/types'
import AdminSettingsFooter from '@/views/Admin/components/AdminSettingsFooter.vue'

const defaultConfig: FeatureToggleConfig = {
  articleCreationEnabled: false,
  travelCreationEnabled: false,
  musicCreationEnabled: false,
  adminNotificationEnabled: false,
  aiArticleAssistEnabled: true,
  aiMusicAssistEnabled: true,
  aiArticleRecommendEnabled: true,
}
const featureKeys = Object.keys(defaultConfig) as Array<keyof FeatureToggleConfig>
const featureCount = featureKeys.length
const loading = ref(false)
const saving = ref(false)
const hasLoadedConfig = ref(false)
const form = reactive<FeatureToggleConfig>({ ...defaultConfig })

const enabledCount = computed(() => featureKeys.filter((key) => form[key]).length)
const controlsDisabled = computed(() => loading.value || saving.value || !hasLoadedConfig.value)

function applyConfig(config: FeatureToggleConfig) {
  Object.assign(form, defaultConfig, config)
}

async function loadConfig() {
  loading.value = true
  try {
    applyConfig(await getFeatureToggleConfig({ suppressErrorMessage: true }))
    hasLoadedConfig.value = true
  } catch {
    hasLoadedConfig.value = false
    notify.error('加载功能开关失败')
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  if (!hasLoadedConfig.value) {
    notify.warning('请先重新加载功能开关')
    return
  }
  saving.value = true
  try {
    applyConfig(await updateFeatureToggleConfig(
      { ...form },
      { suppressErrorMessage: true },
    ))
    notify.success('功能开关已保存并生效')
  } catch {
    notify.error('保存功能开关失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadConfig()
})
</script>

<style scoped lang="scss">
.feature-settings {
  width: 100%;
  max-width: 920px;
  min-width: 0;
  margin-inline: auto;
}

.feature-settings__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-lg);

  h3,
  p {
    margin: 0;
  }

  h3 {
    color: var(--color-text-primary);
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  p {
    max-width: 68ch;
    margin-top: var(--space-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.65;
  }
}

.behavior-note {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
  padding: var(--space-md);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);

  :deep(.ui-icon) {
    flex: 0 0 auto;
    margin-top: 2px;
    color: var(--color-info);
  }

  p {
    margin: 0;
    font-size: var(--font-size-sm);
    line-height: 1.65;
  }
}

.feature-group {
  padding-block: var(--space-xl) var(--space-sm);
}

.feature-group + .feature-group {
  border-top: 1px solid var(--color-border-light);
}

.feature-group__heading {
  margin-bottom: var(--space-sm);

  h4,
  p {
    margin: 0;
  }

  h4 {
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
    font-weight: 600;
  }

  p {
    margin-top: 4px;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
}

.feature-list {
  display: grid;
}

.feature-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-xl);
  min-height: 76px;
  padding-block: var(--space-md);
  border-top: 1px solid var(--color-border-light);

  h5,
  p {
    margin: 0;
  }

  h5 {
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  p {
    margin-top: 4px;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.55;
  }
}

@media (max-width: 640px) {
  .feature-settings__header {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .feature-row {
    grid-template-columns: 1fr;
    gap: var(--space-sm);

    :deep(.ui-switch) {
      justify-self: start;
    }
  }
}
</style>
