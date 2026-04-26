<template>
  <el-card class="settings-card" shadow="never">
    <template #header>
      <div class="settings-header">
        <div class="settings-title">
          <el-icon class="settings-title__icon"><Setting /></el-icon>
          <div>
            <h2>站点配置</h2>
            <p>管理站点基础资料、品牌资源、SEO 与各页面封面。</p>
          </div>
        </div>
        <div class="settings-actions">
          <el-button :icon="Refresh" :loading="loading" @click="loadConfig">刷新</el-button>
          <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="settings-body">
      <section class="settings-overview">
        <div class="overview-brand">
          <div class="overview-logo">
            <img :src="form.siteLogo || '/logo.png'" alt="站点 Logo" />
          </div>
          <div>
            <span class="overview-kicker">Chen404 Config</span>
            <h3>{{ form.siteName || 'Chen404 Blog' }}</h3>
            <p>{{ form.siteDescription || '一个写下技术，也收藏温柔日常的小小角落' }}</p>
          </div>
        </div>
        <div class="overview-stats">
          <div>
            <span>基础信息</span>
            <strong>{{ filledBasicCount }}/6</strong>
          </div>
          <div>
            <span>品牌资源</span>
            <strong>{{ filledBrandCount }}/3</strong>
          </div>
          <div>
            <span>页面封面</span>
            <strong>{{ filledHeroCount }}/{{ heroPages.length }}</strong>
          </div>
        </div>
      </section>

      <el-tabs v-model="activeTab" class="settings-tabs">
        <el-tab-pane label="基础信息" name="basic">
          <section class="settings-section">
            <div class="section-head">
              <div>
                <span class="section-kicker">Basic</span>
                <h3>站点基础信息</h3>
              </div>
              <el-tag effect="plain">已接入</el-tag>
            </div>

            <el-form label-position="top" class="settings-form">
              <div class="form-grid">
                <el-form-item label="站点名称">
                  <el-input v-model="form.siteName" maxlength="40" show-word-limit placeholder="Chen404 Blog" />
                </el-form-item>
                <el-form-item label="联系邮箱">
                  <el-input v-model="form.email" placeholder="helychen@outlook.com" />
                </el-form-item>
                <el-form-item label="ICP备案号">
                  <el-input v-model="form.icp" placeholder="湘ICP备..." />
                </el-form-item>
                <el-form-item label="公安备案号">
                  <el-input v-model="form.beian" placeholder="可选" />
                </el-form-item>
                <el-form-item label="GitHub 链接" class="form-item--wide">
                  <el-input v-model="form.github" placeholder="https://github.com/..." />
                </el-form-item>
                <el-form-item label="站点描述" class="form-item--wide">
                  <el-input
                    v-model="form.siteDescription"
                    type="textarea"
                    :rows="3"
                    maxlength="120"
                    show-word-limit
                    placeholder="一个写下技术，也收藏温柔日常的小小角落"
                  />
                </el-form-item>
              </div>
            </el-form>
          </section>
        </el-tab-pane>

        <el-tab-pane label="品牌资源" name="brand">
          <section class="settings-section">
            <div class="section-head">
              <div>
                <span class="section-kicker">Brand</span>
                <h3>Logo、图标与版权</h3>
              </div>
              <el-tag type="warning" effect="plain">部分前台待接入</el-tag>
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
                    <el-upload
                      :show-file-list="false"
                      :before-upload="beforeImageUpload"
                      :http-request="(options) => handleAssetUpload('siteLogo', options)"
                      accept="image/*"
                    >
                      <el-button :icon="UploadFilled" :loading="uploadingKey === 'siteLogo'">上传</el-button>
                    </el-upload>
                    <el-button v-if="form.siteLogo" text type="danger" :icon="Delete" @click="form.siteLogo = ''">
                      清除
                    </el-button>
                  </div>
                  <el-input v-model="form.siteLogo" clearable placeholder="/logo.png 或图片 URL" />
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
                    <el-upload
                      :show-file-list="false"
                      :before-upload="beforeImageUpload"
                      :http-request="(options) => handleAssetUpload('siteFavicon', options)"
                      accept="image/*"
                    >
                      <el-button :icon="UploadFilled" :loading="uploadingKey === 'siteFavicon'">上传</el-button>
                    </el-upload>
                    <el-button v-if="form.siteFavicon" text type="danger" :icon="Delete" @click="form.siteFavicon = ''">
                      清除
                    </el-button>
                  </div>
                  <el-input v-model="form.siteFavicon" clearable placeholder="/favicon.png 或图片 URL" />
                </div>
              </section>
            </div>

            <el-form label-position="top" class="settings-form settings-form--single">
              <el-form-item label="版权文案">
                <el-input v-model="form.copyright" placeholder="Copyright 2024 Chen404" />
              </el-form-item>
            </el-form>
          </section>
        </el-tab-pane>

        <el-tab-pane label="SEO" name="seo">
          <section class="settings-section">
            <div class="section-head">
              <div>
                <span class="section-kicker">SEO</span>
                <h3>搜索展示信息</h3>
              </div>
              <el-tag type="info" effect="plain">配置已保存，前台待完整接入</el-tag>
            </div>

            <el-form label-position="top" class="settings-form">
              <el-form-item label="SEO 关键词">
                <el-input
                  v-model="form.seoKeywords"
                  placeholder="博客,技术,前端,后端,Java,Vue"
                />
              </el-form-item>
              <el-form-item label="SEO 描述">
                <el-input
                  v-model="form.seoDescription"
                  type="textarea"
                  :rows="4"
                  maxlength="180"
                  show-word-limit
                  placeholder="用于搜索引擎摘要展示"
                />
              </el-form-item>
            </el-form>
          </section>
        </el-tab-pane>

        <el-tab-pane label="页面封面" name="hero">
          <section class="settings-section">
            <div class="section-head">
              <div>
                <span class="section-kicker">Hero Images</span>
                <h3>页面封面</h3>
              </div>
              <el-tag effect="plain">已接入</el-tag>
            </div>

            <div class="hero-grid">
              <section v-for="item in heroPages" :key="item.key" class="hero-panel">
                <div class="hero-preview">
                  <img
                    v-if="heroImages[item.key]"
                    :src="heroImages[item.key]"
                    :alt="`${item.label}封面`"
                  />
                  <div v-else class="hero-preview__empty">未设置</div>
                </div>
                <div class="hero-panel__body">
                  <div>
                    <h4>{{ item.label }}</h4>
                    <p>{{ item.desc }}</p>
                  </div>
                  <div class="hero-actions">
                    <el-upload
                      :show-file-list="false"
                      :before-upload="beforeImageUpload"
                      :http-request="(options) => handleHeroUpload(item.key, options)"
                      accept="image/*"
                    >
                      <el-button :icon="UploadFilled" :loading="uploadingKey === item.key">上传</el-button>
                    </el-upload>
                    <el-button
                      v-if="heroImages[item.key]"
                      text
                      type="danger"
                      :icon="Delete"
                      @click="heroImages[item.key] = ''"
                    >
                      清除
                    </el-button>
                  </div>
                  <el-input
                    v-model="heroImages[item.key]"
                    clearable
                    placeholder="粘贴图片 URL，支持 GIF"
                  />
                </div>
              </section>
            </div>
          </section>
        </el-tab-pane>
      </el-tabs>

      <div class="settings-footer">
        <el-button @click="loadConfig">重置</el-button>
        <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { UploadRequestOptions } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Delete, Refresh, Setting, UploadFilled } from '@element-plus/icons-vue';
import { getSiteConfig, updateSiteConfig } from '@/api/home';
import { uploadCover } from '@/api/upload';
import { useSiteConfig } from '@/composables/useSiteConfig';
import type { SiteConfig } from '@/types';
import { DEFAULT_IMAGE_MAX_MB, validateImageFile } from '@/utils/validation';

type HeroKey = 'home' | 'archive' | 'category' | 'tag' | 'about' | 'guestbook';
type AssetKey = 'siteLogo' | 'siteFavicon';
type UploadingKey = HeroKey | AssetKey | '';

const heroPages: Array<{ key: HeroKey; label: string; desc: string }> = [
  { key: 'home', label: '首页', desc: '首页主视觉封面' },
  { key: 'archive', label: '时光轴', desc: '时光轴页面顶部封面' },
  { key: 'category', label: '分类页', desc: '分类列表顶部封面' },
  { key: 'tag', label: '标签页', desc: '标签云顶部封面' },
  { key: 'about', label: '关于页', desc: '关于页面顶部封面' },
  { key: 'guestbook', label: '留言板', desc: '留言板顶部封面' },
];

const { setSiteConfig } = useSiteConfig();

const activeTab = ref('basic');
const loading = ref(false);
const saving = ref(false);
const uploadingKey = ref<UploadingKey>('');

const form = reactive<Required<Omit<SiteConfig, 'heroImages'>>>({
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
});

const heroImages = reactive<Record<HeroKey, string>>({
  home: '',
  archive: '',
  category: '',
  tag: '',
  about: '',
  guestbook: '',
});

const filledBasicCount = computed(() =>
  [form.siteName, form.siteDescription, form.email, form.icp, form.beian, form.github].filter(Boolean).length
);
const filledBrandCount = computed(() =>
  [form.siteLogo, form.siteFavicon, form.copyright].filter(Boolean).length
);
const filledHeroCount = computed(() => Object.values(heroImages).filter(Boolean).length);

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

  heroImages.home = config.heroImages?.home ?? '';
  heroImages.archive = config.heroImages?.archive ?? '';
  heroImages.category = config.heroImages?.category ?? '';
  heroImages.tag = config.heroImages?.tag ?? '';
  heroImages.about = config.heroImages?.about ?? '';
  heroImages.guestbook = config.heroImages?.guestbook ?? '';
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
    heroImages: {
      home: heroImages.home.trim(),
      archive: heroImages.archive.trim(),
      category: heroImages.category.trim(),
      tag: heroImages.tag.trim(),
      about: heroImages.about.trim(),
      guestbook: heroImages.guestbook.trim(),
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
    ElMessage.warning(`${invalidAsset[0]} 只支持本站相对路径或 http/https 图片链接`);
    return false;
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    ElMessage.warning('联系邮箱格式不正确');
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
    ElMessage.error('加载站点配置失败');
  } finally {
    loading.value = false;
  }
}

function beforeImageUpload(file: File) {
  const result = validateImageFile(file, DEFAULT_IMAGE_MAX_MB);
  if (!result.valid) {
    ElMessage.error(result.message);
    return false;
  }
  return true;
}

async function handleAssetUpload(key: AssetKey, options: UploadRequestOptions) {
  uploadingKey.value = key;
  try {
    const res = await uploadCover(options.file);
    form[key] = res.url;
    options.onSuccess?.(res as any);
    ElMessage.success('品牌图片上传成功');
  } catch (error) {
    options.onError?.(error as any);
    ElMessage.error('上传失败');
  } finally {
    uploadingKey.value = '';
  }
}

async function handleHeroUpload(key: HeroKey, options: UploadRequestOptions) {
  uploadingKey.value = key;
  try {
    const res = await uploadCover(options.file);
    heroImages[key] = res.url;
    options.onSuccess?.(res as any);
    ElMessage.success(`${heroPages.find((item) => item.key === key)?.label ?? '页面'}封面上传成功`);
  } catch (error) {
    options.onError?.(error as any);
    ElMessage.error('上传失败');
  } finally {
    uploadingKey.value = '';
  }
}

async function saveConfig() {
  const payload = toPayload();
  if (!validatePayload(payload)) return;

  saving.value = true;
  try {
    const nextConfig = await updateSiteConfig(payload);
    applyConfig(nextConfig);
    setSiteConfig(nextConfig);
    ElMessage.success('站点配置保存成功');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadConfig();
});
</script>

<style scoped lang="scss">
.settings-card {
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);

  :deep(.el-card__header) {
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--border-light);
  }

  :deep(.el-card__body) {
    padding: var(--spacing-lg);
  }
}

.settings-header,
.settings-actions,
.section-head,
.asset-actions,
.hero-actions,
.settings-footer {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.settings-header,
.section-head,
.settings-footer {
  justify-content: space-between;
}

.settings-title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 18px;
  }

  p {
    margin: 4px 0 0;
    color: var(--text-tertiary);
    font-size: 13px;
  }
}

.settings-title__icon {
  width: 38px;
  height: 38px;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 229, 239, 0.72);
  color: var(--primary);
  font-size: 18px;
}

.settings-body {
  display: grid;
  gap: 18px;
}

.settings-overview,
.settings-section {
  border: 1px solid rgba(235, 219, 228, 0.86);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(255, 249, 252, 0.76)),
    radial-gradient(circle at right top, rgba(255, 214, 230, 0.2), transparent 40%);
}

.settings-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
}

.overview-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;

  h3 {
    margin: 3px 0 4px;
    color: #573848;
    font-size: 20px;
  }

  p {
    margin: 0;
    color: rgba(93, 70, 84, 0.72);
    font-size: 13px;
    line-height: 1.6;
  }
}

.overview-logo {
  width: 76px;
  height: 58px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(235, 219, 228, 0.74);

  img {
    width: 66px;
    height: 46px;
    object-fit: contain;
  }
}

.overview-kicker,
.section-kicker {
  color: #b97a94;
  font-size: 12px;
  letter-spacing: 0;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(96px, 1fr));
  gap: 10px;

  div {
    padding: 12px 14px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(235, 219, 228, 0.72);
  }

  span {
    display: block;
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 6px;
    color: #5f4050;
    font-size: 18px;
  }
}

.settings-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 14px;
  }
}

.settings-section {
  padding: 18px;
}

.section-head {
  margin-bottom: 18px;

  h3 {
    margin: 4px 0 0;
    color: var(--text-primary);
    font-size: 18px;
  }
}

.settings-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-item--wide {
  grid-column: 1 / -1;
}

.settings-form--single {
  margin-top: 16px;
}

.brand-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.asset-panel {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 16px;
  padding: 16px;
  border: 1px solid rgba(235, 219, 228, 0.78);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
}

.asset-preview {
  min-height: 116px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 245, 249, 0.92), rgba(240, 246, 255, 0.86));
  color: #b68098;
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
    color: var(--text-tertiary);
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
  gap: 16px;
}

.hero-panel {
  border: 1px solid rgba(235, 219, 228, 0.78);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.74);
}

.hero-preview {
  height: 150px;
  display: grid;
  place-items: center;
  background:
    linear-gradient(135deg, rgba(93, 66, 82, 0.78), rgba(145, 111, 132, 0.66));

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.hero-preview__empty {
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
}

.hero-panel__body {
  display: grid;
  gap: 12px;
  padding: 15px;

  h4 {
    margin: 0;
    color: var(--text-primary);
    font-size: 15px;
  }

  p {
    margin: 4px 0 0;
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.settings-footer {
  padding-top: 2px;
}

@media (max-width: 1080px) {
  .brand-grid,
  .hero-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .settings-header,
  .settings-overview,
  .section-head,
  .settings-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .settings-actions,
  .settings-footer {
    width: 100%;

    :deep(.el-button) {
      flex: 1;
    }
  }

  .overview-stats,
  .asset-panel {
    width: 100%;
    grid-template-columns: 1fr;
  }
}
</style>
