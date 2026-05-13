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
              <el-tag type="success" effect="plain">已接入</el-tag>
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

        <el-tab-pane label="运行配置" name="runtime">
          <section class="settings-section">
            <div class="section-head section-head--runtime">
              <div>
                <span class="section-kicker">Runtime</span>
                <h3>评论互动策略</h3>
                <p class="runtime-summary">把真正需要日常调整的评论开关留在这里，其余分页和上传限制固定为后端默认值。</p>
              </div>
              <el-tag type="success" effect="plain">仅保留必要开关</el-tag>
            </div>

            <div class="runtime-grid">
              <section class="runtime-panel">
                <div class="runtime-panel__icon">审核</div>
                <div class="runtime-panel__body">
                  <div class="runtime-panel__head">
                    <div>
                      <h4>评论审核</h4>
                      <p>控制新评论是否先进入待审核状态。</p>
                    </div>
                    <el-switch
                      v-model="form.commentAudit"
                      inline-prompt
                      active-text="开启"
                      inactive-text="关闭"
                    />
                  </div>
                  <div class="runtime-panel__meta">
                    <span class="runtime-chip runtime-chip--soft">推荐开启</span>
                    <span class="runtime-note">开启后，除管理员外的新评论默认待审核。</span>
                  </div>
                </div>
              </section>

              <section class="runtime-panel">
                <div class="runtime-panel__icon">访客</div>
                <div class="runtime-panel__body">
                  <div class="runtime-panel__head">
                    <div>
                      <h4>游客评论</h4>
                      <p>决定未登录用户能否在文章和留言板发言。</p>
                    </div>
                    <el-switch
                      v-model="form.commentGuest"
                      inline-prompt
                      active-text="允许"
                      inactive-text="关闭"
                    />
                  </div>
                  <div class="runtime-panel__meta">
                    <span class="runtime-chip">影响留言板和文章评论</span>
                    <span class="runtime-note">关闭后，所有评论都需要先登录。</span>
                  </div>
                </div>
              </section>
            </div>

            <div class="runtime-footer-note">
              <p>文章列表分页大小、图片上传大小限制与允许后缀已固定为后端默认配置，不再通过数据库管理。</p>
            </div>
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
                  <HeroImageFocusEditor
                    :image-url="heroImages[item.key]"
                    :position="heroImagePositions[item.key]"
                    @update:position="heroImagePositions[item.key] = $event"
                  />
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
                      @click="clearHeroImage(item.key)"
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
import { uploadSiteAsset } from '@/api/upload';
import HeroImageFocusEditor from '@/components/HeroImageFocusEditor/HeroImageFocusEditor.vue';
import { useSiteConfig } from '@/composables/useSiteConfig';
import type { SiteConfig } from '@/types';
import { DEFAULT_IMAGE_MAX_MB, validateImageFile } from '@/utils/validation';

type HeroKey = 'home' | 'archive' | 'memory-map' | 'category' | 'tag' | 'about' | 'guestbook';
type AssetKey = 'siteLogo' | 'siteFavicon';
type UploadingKey = HeroKey | AssetKey | '';

const heroPages: Array<{ key: HeroKey; label: string; desc: string }> = [
  { key: 'home', label: '首页', desc: '首页主视觉封面' },
  { key: 'archive', label: '时光轴', desc: '时光轴页面顶部封面' },
  { key: 'memory-map', label: '旅行地图', desc: '旅行纪念地图页面顶部封面' },
  { key: 'category', label: '分类页', desc: '分类列表顶部封面' },
  { key: 'tag', label: '标签页', desc: '标签云顶部封面（当前无主导航入口）' },
  { key: 'about', label: '关于页', desc: '关于页面顶部封面' },
  { key: 'guestbook', label: '留言板', desc: '留言板顶部封面' },
];
const HERO_DEFAULT_POSITIONS: Record<HeroKey, string> = {
  home: '50% 58%',
  archive: '50% 44%',
  'memory-map': '50% 48%',
  category: '50% 40%',
  tag: '50% 38%',
  about: '50% 42%',
  guestbook: '50% 40%',
};

const { setSiteConfig } = useSiteConfig();

const activeTab = ref('basic');
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
  category: '',
  tag: '',
  about: '',
  guestbook: '',
});
const heroImagePositions = reactive<Record<HeroKey, string>>({
  home: HERO_DEFAULT_POSITIONS.home,
  archive: HERO_DEFAULT_POSITIONS.archive,
  'memory-map': HERO_DEFAULT_POSITIONS['memory-map'],
  category: HERO_DEFAULT_POSITIONS.category,
  tag: HERO_DEFAULT_POSITIONS.tag,
  about: HERO_DEFAULT_POSITIONS.about,
  guestbook: HERO_DEFAULT_POSITIONS.guestbook,
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
  form.commentAudit = config.commentAudit ?? true;
  form.commentGuest = config.commentGuest ?? true;

  heroImages.home = config.heroImages?.home ?? '';
  heroImages.archive = config.heroImages?.archive ?? '';
  heroImages['memory-map'] = config.heroImages?.['memory-map'] ?? '';
  heroImages.category = config.heroImages?.category ?? '';
  heroImages.tag = config.heroImages?.tag ?? '';
  heroImages.about = config.heroImages?.about ?? '';
  heroImages.guestbook = config.heroImages?.guestbook ?? '';

  heroImagePositions.home = config.heroImagePositions?.home ?? HERO_DEFAULT_POSITIONS.home;
  heroImagePositions.archive = config.heroImagePositions?.archive ?? HERO_DEFAULT_POSITIONS.archive;
  heroImagePositions['memory-map'] =
    config.heroImagePositions?.['memory-map'] ?? HERO_DEFAULT_POSITIONS['memory-map'];
  heroImagePositions.category = config.heroImagePositions?.category ?? HERO_DEFAULT_POSITIONS.category;
  heroImagePositions.tag = config.heroImagePositions?.tag ?? HERO_DEFAULT_POSITIONS.tag;
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
      category: heroImages.category.trim(),
      tag: heroImages.tag.trim(),
      about: heroImages.about.trim(),
      guestbook: heroImages.guestbook.trim(),
    },
    heroImagePositions: {
      home: heroImagePositions.home.trim(),
      archive: heroImagePositions.archive.trim(),
      'memory-map': heroImagePositions['memory-map'].trim(),
      category: heroImagePositions.category.trim(),
      tag: heroImagePositions.tag.trim(),
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
    const res = await uploadSiteAsset(options.file);
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
    const res = await uploadSiteAsset(options.file);
    heroImages[key] = res.url;
    heroImagePositions[key] = HERO_DEFAULT_POSITIONS[key];
    options.onSuccess?.(res as any);
    ElMessage.success(`${heroPages.find((item) => item.key === key)?.label ?? '页面'}封面上传成功`);
  } catch (error) {
    options.onError?.(error as any);
    ElMessage.error('上传失败');
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

.section-head--runtime {
  align-items: flex-start;

  p {
    margin: 8px 0 0;
    color: var(--text-tertiary);
    font-size: 13px;
    line-height: 1.7;
  }
}

.settings-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.field-hint {
  margin: 8px 0 0;
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.6;
}

.runtime-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.runtime-panel {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 16px;
  padding: 20px;
  border: 1px solid rgba(235, 219, 228, 0.8);
  border-radius: 16px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.82), rgba(255, 248, 251, 0.72)),
    radial-gradient(circle at right top, rgba(255, 223, 236, 0.18), transparent 42%);
  box-shadow: 0 14px 28px rgba(212, 180, 194, 0.08);
}

.runtime-panel__icon {
  width: 68px;
  height: 68px;
  display: grid;
  place-items: center;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255, 229, 239, 0.88), rgba(239, 244, 255, 0.8));
  color: #b97792;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.runtime-panel__body {
  min-width: 0;
}

.runtime-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h4 {
    margin: 0;
    color: #573848;
    font-size: 17px;
  }

  p {
    margin: 8px 0 0;
    color: rgba(95, 73, 86, 0.72);
    font-size: 13px;
    line-height: 1.7;
  }
}

.runtime-panel__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.runtime-chip,
.runtime-note {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
}

.runtime-chip {
  background: rgba(255, 239, 245, 0.92);
  border: 1px solid rgba(237, 203, 219, 0.92);
  color: #9f6a82;
}

.runtime-chip--soft {
  background: rgba(243, 249, 255, 0.9);
  border-color: rgba(208, 223, 243, 0.92);
  color: #6e7f9d;
}

.runtime-note {
  background: rgba(255, 255, 255, 0.72);
  color: rgba(95, 73, 86, 0.7);
}

.runtime-footer-note {
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 250, 252, 0.74);
  border: 1px dashed rgba(227, 208, 218, 0.92);

  p {
    margin: 0;
    color: rgba(111, 88, 100, 0.76);
    font-size: 13px;
    line-height: 1.7;
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
  padding: 14px;
  background:
    linear-gradient(135deg, rgba(93, 66, 82, 0.78), rgba(145, 111, 132, 0.66));
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
  .runtime-grid,
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
