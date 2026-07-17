<template>
  <UiPanel icon="settings" title="站点配置" flush>
    <UiLoadingState :loading="loading" message="正在加载站点配置..." class="settings-body">
      <UiTabs v-model="activeTab" :items="tabItems" variant="line" class="settings-tabs">
        <section v-show="activeTab === 'basic'" class="settings-section settings-section--wide">
            <div class="section-head">
              <h3>站点基础信息</h3>
            </div>

            <UiForm label-position="top" class="settings-form">
              <div class="form-grid">
                <UiFormField label="站点名称">
                  <UiInput v-model="form.siteName" maxlength="40" show-word-limit placeholder="Chen404 Blog" />
                </UiFormField>
                <UiFormField label="联系邮箱">
                  <UiInput v-model="form.email" placeholder="helychen@outlook.com" />
                </UiFormField>
                <UiFormField label="ICP备案号">
                  <UiInput v-model="form.icp" placeholder="湘ICP备..." />
                </UiFormField>
                <UiFormField label="公安备案号">
                  <UiInput v-model="form.beian" placeholder="可选" />
                </UiFormField>
                <UiFormField label="GitHub 链接" class="form-item--wide">
                  <UiInput v-model="form.github" placeholder="https://github.com/..." />
                </UiFormField>
                <UiFormField label="站点描述" class="form-item--wide">
                  <UiTextarea
                    v-model="form.siteDescription"
                    :rows="3"
                    maxlength="120"
                    show-count
                    placeholder="一个写下技术，也收藏温柔日常的小小角落"
                  />
                </UiFormField>
              </div>
            </UiForm>
          </section>

        <section v-show="activeTab === 'brand'" class="settings-section settings-section--wide">
            <div class="section-head">
              <h3>Logo、图标与版权</h3>
            </div>

            <div class="brand-grid">
              <section class="asset-panel">
                <div class="asset-preview asset-preview--logo">
                  <img v-if="form.siteLogo" :src="form.siteLogo" alt="Logo 预览" />
                  <span v-else>Logo</span>
                </div>
                <div class="asset-body">
                  <h4>站点 Logo</h4>
                  <p>建议使用透明 PNG，适配导航与页脚展示。</p>
                  <div class="asset-actions">
                    <UiUpload
                      :show-file-list="false"
                      :before-upload="beforeImageUpload"
                      :http-request="(options) => handleAssetUpload('siteLogo', options)"
                      accept="image/*"
                    >
                      <UiButton icon="upload" :loading="uploadingKey === 'siteLogo'">上传</UiButton>
                    </UiUpload>
                    <UiButton v-if="form.siteLogo" variant="text" icon="delete" @click="form.siteLogo = ''">
                      清除
                    </UiButton>
                  </div>
                  <UiInput v-model="form.siteLogo" clearable placeholder="/logo.png 或图片 URL" />
                </div>
              </section>

              <section class="asset-panel">
                <div class="asset-preview asset-preview--favicon">
                  <img v-if="form.siteFavicon" :src="form.siteFavicon" alt="Favicon 预览" />
                  <span v-else>ICO</span>
                </div>
                <div class="asset-body">
                  <h4>站点图标</h4>
                  <p>用于浏览器标签页，当前入口页还会继续使用默认图标。</p>
                  <div class="asset-actions">
                    <UiUpload
                      :show-file-list="false"
                      :before-upload="beforeImageUpload"
                      :http-request="(options) => handleAssetUpload('siteFavicon', options)"
                      accept="image/*"
                    >
                      <UiButton icon="upload" :loading="uploadingKey === 'siteFavicon'">上传</UiButton>
                    </UiUpload>
                    <UiButton v-if="form.siteFavicon" variant="text" icon="delete" @click="form.siteFavicon = ''">
                      清除
                    </UiButton>
                  </div>
                  <UiInput v-model="form.siteFavicon" clearable placeholder="/favicon.png 或图片 URL" />
                </div>
              </section>
            </div>

            <UiForm label-position="top" class="settings-form settings-form--single">
              <UiFormField label="版权文案">
                <UiInput v-model="form.copyright" placeholder="Copyright 2024 Chen404" />
              </UiFormField>
            </UiForm>
          </section>

        <section v-show="activeTab === 'seo'" class="settings-section settings-section--focused">
            <div class="section-head">
              <h3>搜索展示信息</h3>
            </div>

            <UiForm label-position="top" class="settings-form">
              <UiFormField label="SEO 关键词">
                <UiInput
                  v-model="form.seoKeywords"
                  placeholder="博客,技术,前端,后端,Java,Vue"
                />
              </UiFormField>
              <UiFormField label="SEO 描述">
                <UiTextarea
                  v-model="form.seoDescription"
                  :rows="4"
                  maxlength="180"
                  show-count
                  placeholder="用于搜索引擎摘要展示"
                />
              </UiFormField>
            </UiForm>
          </section>

        <section v-show="activeTab === 'runtime'" class="settings-section settings-section--focused">
            <div class="section-head">
              <h3>评论互动策略</h3>
            </div>

            <div class="runtime-list">
              <section class="runtime-row">
                <div>
                  <h4>评论审核</h4>
                  <p>开启后，普通用户的新评论先进入待审核状态。</p>
                </div>
                <UiSwitch
                  v-model="form.commentAudit"
                  active-text="开启"
                  inactive-text="关闭"
                />
              </section>

              <section class="runtime-row">
                <div>
                  <h4>游客评论</h4>
                  <p>关闭后，文章和留言板仅允许登录用户发言。</p>
                </div>
                <UiSwitch
                  v-model="form.commentGuest"
                  active-text="允许"
                  inactive-text="关闭"
                />
              </section>
            </div>
          </section>

        <section v-show="activeTab === 'hero'" class="settings-section settings-section--wide">
            <div class="section-head">
              <h3>页面封面</h3>
            </div>

            <div class="hero-grid">
              <section v-for="item in heroPages" :key="item.key" class="hero-panel">
                <div class="hero-preview">
                  <HeroImageFocusEditor
                    :image-url="heroImages[item.key]"
                    :position="heroImagePositions[item.key]"
                    @update:position="heroImagePositions[item.key] = $event"
                  />
                </div>
                <div class="hero-panel__body">
                  <h4>{{ item.label }}</h4>
                  <div class="hero-actions">
                    <UiUpload
                      :show-file-list="false"
                      :before-upload="beforeImageUpload"
                      :http-request="(options) => handleHeroUpload(item.key, options)"
                      accept="image/*"
                    >
                      <UiButton icon="upload" :loading="uploadingKey === item.key">上传</UiButton>
                    </UiUpload>
                    <UiButton
                      v-if="heroImages[item.key]"
                      variant="danger"
                      icon="delete"
                      @click="clearHeroImage(item.key)"
                    >
                      清除
                    </UiButton>
                  </div>
                  <UiInput
                    v-model="heroImages[item.key]"
                    clearable
                    placeholder="粘贴图片 URL，支持 GIF"
                  />
                </div>
              </section>
            </div>
          </section>

        <div v-show="activeTab === 'ai'" class="settings-pane settings-pane--wide">
          <AiAssistantSettings />
        </div>

        <div v-if="activeTab === 'github-development'" class="settings-pane settings-pane--wide">
          <GitHubDevelopmentSettings />
        </div>
      </UiTabs>

      <AdminSettingsFooter v-if="!activeTabManagesOwnActions">
        <UiButton variant="text" @click="loadConfig">重置</UiButton>
        <UiButton variant="primary" :loading="saving" @click="saveConfig">保存配置</UiButton>
      </AdminSettingsFooter>
    </UiLoadingState>
  </UiPanel>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { notify } from '@/lib/feedback';
import { UiPanel, UiButton, UiTabs, UiForm, UiFormField, UiInput, UiLoadingState, UiSwitch, UiTextarea, UiUpload } from '@/components/ui';
import type { UiTabItem } from '@/components/ui';
import type { UploadRequestOptions } from '@/components/ui';
import { getSiteConfig, updateSiteConfig } from '@/api/home';
import { uploadSiteAsset } from '@/api/upload';
import AiAssistantSettings from '@/views/Admin/components/AiAssistantSettings.vue';
import AdminSettingsFooter from '@/views/Admin/components/AdminSettingsFooter.vue';
import GitHubDevelopmentSettings from '@/views/Admin/components/GitHubDevelopmentSettings.vue';
import HeroImageFocusEditor from '@/components/HeroImageFocusEditor/HeroImageFocusEditor.vue';
import { useSiteConfig } from '@/composables/useSiteConfig';
import type { SiteConfig } from '@/types';
import { DEFAULT_IMAGE_MAX_MB, validateImageFile } from '@/utils/validation';

const tabItems: UiTabItem[] = [
  { label: '基础信息', value: 'basic' },
  { label: '品牌资源', value: 'brand' },
  { label: 'SEO', value: 'seo' },
  { label: '运行配置', value: 'runtime' },
  { label: '页面封面', value: 'hero' },
  { label: '开发同步', value: 'github-development' },
  { label: 'AI 助手', value: 'ai' },
];

type HeroKey = 'home' | 'archive' | 'memory-map' | 'trust-request' | 'music' | 'category' | 'about' | 'guestbook';
type AssetKey = 'siteLogo' | 'siteFavicon';
type UploadingKey = HeroKey | AssetKey | '';

const heroPages: Array<{ key: HeroKey; label: string }> = [
  { key: 'trust-request', label: '好友申请' },
  { key: 'home', label: '首页' },
  { key: 'archive', label: '时光轴' },
  { key: 'memory-map', label: '旅行地图' },
  { key: 'music', label: '音乐馆' },
  { key: 'category', label: '分类页' },
  { key: 'about', label: '关于页' },
  { key: 'guestbook', label: '留言板' },
];
const HERO_DEFAULT_POSITIONS: Record<HeroKey, string> = {
  home: '50% 58%',
  archive: '50% 44%',
  'memory-map': '50% 48%',
  'trust-request': '50% 48%',
  music: '50% 52%',
  category: '50% 40%',
  about: '50% 42%',
  guestbook: '50% 40%',
};

const { setSiteConfig } = useSiteConfig();

const activeTab = ref('basic');
const activeTabManagesOwnActions = computed(() =>
  activeTab.value === 'ai' || activeTab.value === 'github-development',
);
const loading = ref(false);
const saving = ref(false);
const uploadingKey = ref<UploadingKey>('');
const form = reactive<Required<Omit<SiteConfig, 'heroImages' | 'heroImagePositions'>>>({
  siteName: '',
  siteDescription: '',
  siteLogo: '',
  siteFavicon: '',
  icp: '',
  beian: '',
  github: '',
  email: '',
  copyright: '',
  seoKeywords: '',
  seoDescription: '',
  commentAudit: true,
  commentGuest: true,
});

const heroImages = reactive<Record<HeroKey, string>>({
  home: '',
  archive: '',
  'memory-map': '',
  'trust-request': '',
  music: '',
  category: '',
  about: '',
  guestbook: '',
});
const heroImagePositions = reactive<Record<HeroKey, string>>({
  home: HERO_DEFAULT_POSITIONS.home,
  archive: HERO_DEFAULT_POSITIONS.archive,
  'memory-map': HERO_DEFAULT_POSITIONS['memory-map'],
  'trust-request': HERO_DEFAULT_POSITIONS['trust-request'],
  music: HERO_DEFAULT_POSITIONS.music,
  category: HERO_DEFAULT_POSITIONS.category,
  about: HERO_DEFAULT_POSITIONS.about,
  guestbook: HERO_DEFAULT_POSITIONS.guestbook,
});

function applyConfig(config: SiteConfig) {
  form.siteName = config.siteName ?? '';
  form.siteDescription = config.siteDescription ?? '';
  form.siteLogo = config.siteLogo ?? '';
  form.siteFavicon = config.siteFavicon ?? '';
  form.icp = config.icp ?? '';
  form.beian = config.beian ?? '';
  form.github = config.github ?? '';
  form.email = config.email ?? '';
  form.copyright = config.copyright ?? '';
  form.seoKeywords = config.seoKeywords ?? '';
  form.seoDescription = config.seoDescription ?? '';
  form.commentAudit = config.commentAudit ?? true;
  form.commentGuest = config.commentGuest ?? true;

  heroImages.home = config.heroImages?.home ?? '';
  heroImages.archive = config.heroImages?.archive ?? '';
  heroImages['memory-map'] = config.heroImages?.['memory-map'] ?? '';
  heroImages['trust-request'] = config.heroImages?.['trust-request'] ?? '';
  heroImages.music = config.heroImages?.music ?? '';
  heroImages.category = config.heroImages?.category ?? '';
  heroImages.about = config.heroImages?.about ?? '';
  heroImages.guestbook = config.heroImages?.guestbook ?? '';

  heroImagePositions.home = config.heroImagePositions?.home ?? HERO_DEFAULT_POSITIONS.home;
  heroImagePositions.archive = config.heroImagePositions?.archive ?? HERO_DEFAULT_POSITIONS.archive;
  heroImagePositions['memory-map'] =
    config.heroImagePositions?.['memory-map'] ?? HERO_DEFAULT_POSITIONS['memory-map'];
  heroImagePositions['trust-request'] =
    config.heroImagePositions?.['trust-request'] ?? HERO_DEFAULT_POSITIONS['trust-request'];
  heroImagePositions.music = config.heroImagePositions?.music ?? HERO_DEFAULT_POSITIONS.music;
  heroImagePositions.category = config.heroImagePositions?.category ?? HERO_DEFAULT_POSITIONS.category;
  heroImagePositions.about = config.heroImagePositions?.about ?? HERO_DEFAULT_POSITIONS.about;
  heroImagePositions.guestbook = config.heroImagePositions?.guestbook ?? HERO_DEFAULT_POSITIONS.guestbook;
}

function toPayload(): SiteConfig {
  return {
    siteName: form.siteName.trim(),
    siteDescription: form.siteDescription.trim(),
    siteLogo: form.siteLogo.trim(),
    siteFavicon: form.siteFavicon.trim(),
    icp: form.icp.trim(),
    beian: form.beian.trim(),
    github: form.github.trim(),
    email: form.email.trim(),
    copyright: form.copyright.trim(),
    seoKeywords: form.seoKeywords.trim(),
    seoDescription: form.seoDescription.trim(),
    commentAudit: form.commentAudit,
    commentGuest: form.commentGuest,
    heroImages: {
      home: heroImages.home.trim(),
      archive: heroImages.archive.trim(),
      'memory-map': heroImages['memory-map'].trim(),
      'trust-request': heroImages['trust-request'].trim(),
      music: heroImages.music.trim(),
      category: heroImages.category.trim(),
      about: heroImages.about.trim(),
      guestbook: heroImages.guestbook.trim(),
    },
    heroImagePositions: {
      home: heroImagePositions.home.trim(),
      archive: heroImagePositions.archive.trim(),
      'memory-map': heroImagePositions['memory-map'].trim(),
      'trust-request': heroImagePositions['trust-request'].trim(),
      music: heroImagePositions.music.trim(),
      category: heroImagePositions.category.trim(),
      about: heroImagePositions.about.trim(),
      guestbook: heroImagePositions.guestbook.trim(),
    },
  };
}

function isSafeAssetUrl(value: string) {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/[\"'()<>\\\r\n]/.test(trimmed)) return false;
  return trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

function validatePayload(payload: SiteConfig) {
  const assetEntries = [
    ['站点 Logo', payload.siteLogo],
    ['站点图标', payload.siteFavicon],
    ...Object.entries(payload.heroImages ?? {}).map(([key, value]) => [`页面封面 ${key}`, value]),
  ];
  const invalidAsset = assetEntries.find(([, value]) => !isSafeAssetUrl(String(value ?? '')));
  if (invalidAsset) {
    notify.warning(`${invalidAsset[0]} 只支持本站相对路径或 http/https 图片链接`);
    return false;
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    notify.warning('联系邮箱格式不正确');
    return false;
  }
  return true;
}

async function loadConfig() {
  loading.value = true;
  try {
    const config = await getSiteConfig();
    applyConfig(config);
  } catch {
    notify.error('加载站点配置失败');
  } finally {
    loading.value = false;
  }
}

function beforeImageUpload(file: File) {
  const result = validateImageFile(file, DEFAULT_IMAGE_MAX_MB);
  if (!result.valid) {
    notify.error(result.message);
    return false;
  }
  return true;
}

async function handleAssetUpload(key: AssetKey, options: UploadRequestOptions) {
  uploadingKey.value = key;
  try {
    const res = await uploadSiteAsset(options.file);
    form[key] = res.url;
    options.onSuccess?.(res as any);
    notify.success('品牌图片上传成功');
  } catch (error) {
    options.onError?.(error as any);
    notify.error('上传失败');
  } finally {
    uploadingKey.value = '';
  }
}

async function handleHeroUpload(key: HeroKey, options: UploadRequestOptions) {
  uploadingKey.value = key;
  try {
    const res = await uploadSiteAsset(options.file);
    heroImages[key] = res.url;
    heroImagePositions[key] = HERO_DEFAULT_POSITIONS[key];
    options.onSuccess?.(res as any);
    notify.success(`${heroPages.find((item) => item.key === key)?.label ?? '页面'}封面上传成功`);
  } catch (error) {
    options.onError?.(error as any);
    notify.error('上传失败');
  } finally {
    uploadingKey.value = '';
  }
}

function clearHeroImage(key: HeroKey) {
  heroImages[key] = '';
  heroImagePositions[key] = HERO_DEFAULT_POSITIONS[key];
}

async function saveConfig() {
  const payload = toPayload();
  if (!validatePayload(payload)) return;

  saving.value = true;
  try {
    const nextConfig = await updateSiteConfig(payload);
    applyConfig(nextConfig);
    setSiteConfig(nextConfig);
    notify.success('站点配置保存成功');
  } catch {
    notify.error('保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadConfig();
});
</script>

<style scoped lang="scss">
.section-head,
.asset-actions,
.hero-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.section-head {
  justify-content: space-between;
}

.settings-body {
  padding: clamp(var(--space-lg), 2.4vw, var(--space-xl));

  > :deep(.ui-loading-state__content) {
    display: grid;
    gap: var(--space-xl);
    min-width: 0;
  }
}

.settings-tabs {
  min-width: 0;

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

  :deep(.ui-tabs__panel) {
    margin-top: var(--space-xl);
  }
}

.settings-section,
.settings-pane {
  width: 100%;
  min-width: 0;
  margin-inline: auto;
}

.settings-section {
  padding: var(--space-xs) 2px var(--space-sm);
}

.settings-section--wide,
.settings-pane--wide {
  max-width: 1160px;
}

.settings-section--focused {
  max-width: 920px;
}

.section-head {
  margin-bottom: var(--space-xl);

  h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 18px;
    font-weight: 650;
    letter-spacing: 0;
  }
}

.settings-form {
  display: grid;
  gap: var(--space-lg);

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.runtime-list {
  display: grid;
  gap: var(--space-md);
}

.runtime-row {
  --runtime-tint: var(--primary);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  min-height: 88px;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  background: color-mix(in oklch, var(--color-surface) 92%, var(--runtime-tint));

  &:nth-child(2) {
    --runtime-tint: oklch(72% 0.08 310);
  }

  h4 {
    margin: 0;
    color: color-mix(in oklch, var(--color-text-primary) 90%, var(--runtime-tint));
    font-size: 15px;
    font-weight: 620;
  }

  p {
    margin: 5px 0 0;
    color: color-mix(in oklch, var(--color-text-primary) 68%, var(--runtime-tint));
    font-size: 12px;
    line-height: 1.6;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-lg);
}

.form-item--wide {
  grid-column: 1 / -1;
}

.settings-form--single {
  margin-top: var(--space-lg);
}

.brand-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-lg);
}

.asset-panel {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: var(--space-lg);
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
}

.asset-preview {
  min-height: 116px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-tertiary);
  font-size: 13px;

  img {
    max-width: 92px;
    max-height: 82px;
    object-fit: contain;
  }
}

.asset-preview--favicon img {
  width: 48px;
  height: 48px;
}

.asset-body {
  min-width: 0;

  h4 {
    margin: 0;
    color: var(--text-primary);
    font-size: 15px;
  }

  p {
    margin: 6px 0 12px;
    color: var(--color-text-secondary);
    font-size: 12px;
    line-height: 1.6;
  }

  .asset-actions {
    margin-bottom: 12px;
  }
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-lg);
  align-items: start;
}

.hero-panel {
  --hero-tint: oklch(72% 0.08 310);

  border: 1px solid color-mix(in oklch, var(--color-border-light) 82%, var(--hero-tint));
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: color-mix(in oklch, var(--color-surface) 97%, var(--hero-tint));
  align-self: start;
}

.hero-preview {
  padding: 14px;
  background: color-mix(in oklch, var(--color-surface) 93%, var(--hero-tint));
}

.hero-panel__body {
  display: grid;
  gap: 12px;
  padding: 15px;
  background: color-mix(in oklch, var(--color-surface) 97%, var(--hero-tint));

  h4 {
    margin: 0;
    color: color-mix(in oklch, var(--color-text-primary) 90%, var(--hero-tint));
    font-size: 15px;
    font-weight: 650;
  }
}

@media (max-width: 1080px) {
  .brand-grid,
  .hero-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .settings-body {
    padding: var(--space-md);
  }

  .settings-body > :deep(.ui-loading-state__content) {
    gap: var(--space-lg);
  }

  .settings-tabs :deep(.ui-tabs__panel) {
    margin-top: var(--space-lg);
  }

  .section-head {
    margin-bottom: var(--space-lg);
  }

  .asset-panel {
    width: 100%;
    grid-template-columns: 1fr;
  }

  .runtime-row {
    align-items: flex-start;
  }
}
</style>
