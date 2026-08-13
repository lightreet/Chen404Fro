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
            <div class="section-head runtime-section-head">
              <h3>评论互动策略</h3>
            </div>

            <div class="runtime-list">
              <section class="runtime-row">
                <div>
                  <h4>评论审核</h4>
                  <p>开启后，普通用户和游客的新评论会进入待审核状态。</p>
                  <UiButton
                    v-if="form.commentAudit"
                    class="review-entry"
                    variant="text"
                    size="sm"
                    icon="comment"
                    @click="goToCommentReview"
                  >
                    前往评论审核
                  </UiButton>
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

            <div class="section-head runtime-section-head">
              <div>
                <h3>消息与协作功能</h3>
                <p>这些开关即时生效，用于控制管理消息和知友创作入口。</p>
              </div>
            </div>

            <div class="runtime-list">
              <section class="runtime-row">
                <div>
                  <h4>管理员消息记录</h4>
                  <p>开启后，文章、旅行、音乐和书籍等内容变更会写入管理后台消息中心。</p>
                </div>
                <UiSwitch
                  v-model="featureToggles.adminNotificationEnabled"
                  active-text="开启"
                  inactive-text="关闭"
                />
              </section>

              <section class="runtime-row">
                <div>
                  <h4>知友文章创作</h4>
                  <p>允许具备对应权限的知友创建和管理文章。</p>
                </div>
                <UiSwitch v-model="featureToggles.articleCreationEnabled" active-text="开启" inactive-text="关闭" />
              </section>

              <section class="runtime-row">
                <div>
                  <h4>知友旅行创作</h4>
                  <p>允许具备对应权限的知友创建和管理旅行记忆。</p>
                </div>
                <UiSwitch v-model="featureToggles.travelCreationEnabled" active-text="开启" inactive-text="关闭" />
              </section>

              <section class="runtime-row">
                <div>
                  <h4>知友音乐创作</h4>
                  <p>允许具备对应权限的知友创建和管理音乐内容。</p>
                </div>
                <UiSwitch v-model="featureToggles.musicCreationEnabled" active-text="开启" inactive-text="关闭" />
              </section>
            </div>

            <div class="section-head runtime-section-head">
              <div>
                <h3>AI 功能</h3>
                <p>控制前台 AI 辅助能力；模型参数仍在“AI 助手”页配置。</p>
              </div>
            </div>

            <div class="runtime-list">
              <section class="runtime-row">
                <div>
                  <h4>AI 文章助手</h4>
                  <p>为文章编辑提供内容辅助能力。</p>
                </div>
                <UiSwitch v-model="featureToggles.aiArticleAssistEnabled" active-text="开启" inactive-text="关闭" />
              </section>

              <section class="runtime-row">
                <div>
                  <h4>AI 音乐信息补全</h4>
                  <p>允许使用 AI 补全音乐元数据。</p>
                </div>
                <UiSwitch v-model="featureToggles.aiMusicAssistEnabled" active-text="开启" inactive-text="关闭" />
              </section>

              <section class="runtime-row">
                <div>
                  <h4>相关文章推荐</h4>
                  <p>允许使用 AI 生成相关文章推荐。</p>
                </div>
                <UiSwitch v-model="featureToggles.aiArticleRecommendEnabled" active-text="开启" inactive-text="关闭" />
              </section>
            </div>
          </section>

        <section v-show="activeTab === 'hero'" class="settings-section settings-section--wide">
          <div class="section-head section-head--hero">
            <div>
              <h3>页面封面</h3>
              <p>按前台导航选择页面，每次集中编辑一张封面。</p>
            </div>
            <span class="hero-summary">{{ configuredHeroCount }}/{{ heroPages.length }} 已配置</span>
          </div>

          <div class="hero-workspace">
            <nav class="hero-page-menu" aria-label="页面封面分类">
              <p class="hero-page-menu__label">前台导航</p>
              <div class="hero-page-menu__items">
                <template v-for="item in heroNavigationItems" :key="item.key">
                  <button
                    v-if="item.type === 'page'"
                    type="button"
                    class="hero-page-menu__item"
                    :class="{ 'is-active': activeHeroKey === item.key }"
                    :aria-pressed="activeHeroKey === item.key"
                    @click="selectHeroPage(item.key)"
                  >
                    <UiIcon :name="item.icon" class="hero-page-menu__icon" />
                    <span class="hero-page-menu__name">{{ item.label }}</span>
                    <span class="hero-page-menu__suffix">
                      <span
                        class="hero-page-menu__status"
                        :class="{ 'is-configured': Boolean(heroImages[item.key]) }"
                        :title="heroImages[item.key] ? '已配置封面' : '使用默认封面'"
                      />
                    </span>
                  </button>

                  <div
                    v-else
                    class="hero-page-menu__submenu"
                    :class="{
                      'is-open': expandedHeroMenus[item.key],
                    }"
                  >
                    <button
                      type="button"
                      class="hero-page-menu__item hero-page-menu__trigger"
                      :class="{ 'is-active': isHeroMenuActive(item) }"
                      :aria-expanded="expandedHeroMenus[item.key]"
                      :aria-controls="`hero-submenu-${item.key}`"
                      @click="toggleHeroMenu(item.key)"
                    >
                      <UiIcon :name="item.icon" class="hero-page-menu__icon" />
                      <span class="hero-page-menu__name">{{ item.label }}</span>
                      <span class="hero-page-menu__suffix">
                        <span class="hero-page-menu__count">
                          {{ configuredHeroCountFor(item) }}/{{ item.pages.length }}
                        </span>
                        <UiIcon
                          name="arrow-down"
                          class="hero-page-menu__chevron"
                          aria-hidden="true"
                        />
                      </span>
                    </button>

                    <div
                      v-show="expandedHeroMenus[item.key]"
                      :id="`hero-submenu-${item.key}`"
                      class="hero-page-menu__children"
                    >
                      <button
                        v-for="child in item.pages"
                        :key="child.key"
                        type="button"
                        class="hero-page-menu__item hero-page-menu__child"
                        :class="{ 'is-active': activeHeroKey === child.key }"
                        :aria-pressed="activeHeroKey === child.key"
                        @click="selectHeroPage(child.key, item.key)"
                      >
                        <UiIcon :name="child.icon" class="hero-page-menu__icon" />
                        <span class="hero-page-menu__name">{{ child.label }}</span>
                        <span class="hero-page-menu__suffix">
                          <span
                            class="hero-page-menu__status"
                            :class="{ 'is-configured': Boolean(heroImages[child.key]) }"
                            :title="heroImages[child.key] ? '已配置封面' : '使用默认封面'"
                          />
                        </span>
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </nav>

            <section class="hero-editor" :aria-labelledby="`hero-editor-${activeHeroKey}`">
              <header class="hero-editor__head">
                <div class="hero-editor__identity">
                  <span class="hero-editor__icon" aria-hidden="true">
                    <UiIcon :name="activeHeroPage.icon" />
                  </span>
                  <div>
                    <div class="hero-editor__title-row">
                      <h4 :id="`hero-editor-${activeHeroKey}`">{{ activeHeroPage.label }}</h4>
                      <span class="hero-editor__group">{{ activeHeroNavigationLabel }}</span>
                    </div>
                    <p>{{ activeHeroPage.description }}</p>
                  </div>
                </div>
                <span class="hero-editor__state" :class="{ 'is-configured': activeHeroImage }">
                  {{ activeHeroImage ? '已配置自定义封面' : '当前使用默认封面' }}
                </span>
              </header>

              <div class="hero-preview">
                <HeroImageFocusEditor
                  :key="activeHeroKey"
                  :image-url="activeHeroImage"
                  :position="heroImagePositions[activeHeroKey]"
                  @update:position="heroImagePositions[activeHeroKey] = $event"
                />
              </div>

              <div class="hero-editor__controls">
                <div class="hero-actions">
                  <UiUpload
                    :show-file-list="false"
                    :before-upload="beforeImageUpload"
                    :http-request="(options) => handleHeroUpload(activeHeroKey, options)"
                    accept="image/*"
                  >
                    <UiButton icon="upload" :loading="uploadingKey === activeHeroKey">
                      上传封面
                    </UiButton>
                  </UiUpload>
                  <UiButton
                    v-if="activeHeroImage"
                    variant="danger"
                    icon="delete"
                    @click="clearHeroImage(activeHeroKey)"
                  >
                    清除封面
                  </UiButton>
                </div>
                <UiInput
                  v-model="heroImages[activeHeroKey]"
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

        <div v-if="activeTab === 'feature-toggles'" class="settings-pane settings-pane--wide">
          <FeatureToggleSettings />
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
import { useRouter } from 'vue-router';
import { notify } from '@/lib/feedback';
import { UiPanel, UiButton, UiIcon, UiTabs, UiForm, UiFormField, UiInput, UiLoadingState, UiSwitch, UiTextarea, UiUpload } from '@/components/ui';
import type { UiTabItem } from '@/components/ui';
import type { UploadRequestOptions } from '@/components/ui';
import { getSiteConfig, updateSiteConfig } from '@/api/home';
import {
  getFeatureToggleConfig,
  updateFeatureToggleConfig,
  type FeatureToggleConfig,
} from '@/api/feature-toggle';
import { uploadSiteAsset, uploadSiteHero } from '@/api/upload';
import AiAssistantSettings from '@/views/Admin/components/AiAssistantSettings.vue';
import AdminSettingsFooter from '@/views/Admin/components/AdminSettingsFooter.vue';
import GitHubDevelopmentSettings from '@/views/Admin/components/GitHubDevelopmentSettings.vue';
import FeatureToggleSettings from '@/views/Admin/components/FeatureToggleSettings.vue';
import HeroImageFocusEditor from '@/components/HeroImageFocusEditor/HeroImageFocusEditor.vue';
import { useSiteConfig } from '@/composables/useSiteConfig';
import type { SiteConfig } from '@/types';
import { DEFAULT_IMAGE_MAX_MB, validateImageFile } from '@/utils/validation';

const tabItems: UiTabItem[] = [
  { label: '基础信息', value: 'basic' },
  { label: '品牌资源', value: 'brand' },
  { label: 'SEO', value: 'seo' },
  { label: '运行配置', value: 'runtime' },
  { label: '功能开关', value: 'feature-toggles' },
  { label: '页面封面', value: 'hero' },
  { label: '开发同步', value: 'github-development' },
  { label: 'AI 助手', value: 'ai' },
];

type HeroKey =
  | 'home'
  | 'archive'
  | 'development-history'
  | 'memory-map'
  | 'music'
  | 'bookshelf'
  | 'category'
  | 'about'
  | 'guestbook';
type HeroMenuKey = 'timeline' | 'more';
type AssetKey = 'siteLogo' | 'siteFavicon';
type UploadingKey = HeroKey | AssetKey | '';

interface HeroPage {
  key: HeroKey;
  label: string;
  icon: string;
  description: string;
}

interface HeroPageNavigationItem extends HeroPage {
  type: 'page';
}

interface HeroPageMenu {
  type: 'menu';
  key: HeroMenuKey;
  label: string;
  icon: string;
  pages: HeroPage[];
}

type HeroNavigationItem = HeroPageNavigationItem | HeroPageMenu;

const heroNavigationItems: HeroNavigationItem[] = [
  {
    type: 'page',
    key: 'home',
    label: '首页',
    icon: 'HomeFilled',
    description: '站点首页顶部展示的主封面。',
  },
  {
    type: 'page',
    key: 'category',
    label: '分类',
    icon: 'List',
    description: '文章分类浏览页顶部展示的封面。',
  },
  {
    type: 'menu',
    key: 'timeline',
    label: '时光轴',
    icon: 'clock',
    pages: [
      {
        key: 'archive',
        label: '文章记录',
        icon: 'article',
        description: '顶部导航「时光轴」菜单中的文章记录页面封面。',
      },
      {
        key: 'development-history',
        label: '开发历程',
        icon: 'branch',
        description: '顶部导航「时光轴」菜单中的开发历程页面封面。',
      },
    ],
  },
  {
    type: 'page',
    key: 'memory-map',
    label: '旅行地图',
    icon: 'Place',
    description: '旅行地图与旅行记忆入口顶部展示的封面。',
  },
  {
    type: 'page',
    key: 'music',
    label: '音乐馆',
    icon: 'Headset',
    description: '音乐馆入口顶部展示的封面。',
  },
  {
    type: 'page',
    key: 'bookshelf',
    label: '书架',
    icon: 'book',
    description: '书架入口顶部展示的封面。',
  },
  {
    type: 'menu',
    key: 'more',
    label: '更多',
    icon: 'more',
    pages: [
      {
        key: 'guestbook',
        label: '留言板',
        icon: 'ChatDotRound',
        description: '顶部导航「更多」菜单中的留言板页面封面。',
      },
      {
        key: 'about',
        label: '关于本站',
        icon: 'InfoFilled',
        description: '顶部导航「更多」菜单中的关于本站页面封面。',
      },
    ],
  },
];
const heroPages = heroNavigationItems.flatMap((item) =>
  item.type === 'page' ? [item] : item.pages,
);
const HERO_DEFAULT_POSITIONS: Record<HeroKey, string> = {
  home: '50% 58%',
  archive: '50% 44%',
  'development-history': '50% 44%',
  'memory-map': '50% 48%',
  music: '50% 52%',
  bookshelf: '50% 47%',
  category: '50% 40%',
  about: '50% 42%',
  guestbook: '50% 40%',
};

const { setSiteConfig } = useSiteConfig();
const router = useRouter();

const activeTab = ref('basic');
const activeHeroKey = ref<HeroKey>('home');
const expandedHeroMenus = reactive<Record<HeroMenuKey, boolean>>({
  timeline: false,
  more: false,
});
const activeHeroPage = computed(
  () => heroPages.find((item) => item.key === activeHeroKey.value) ?? heroPages[0],
);
const activeHeroNavigationLabel = computed(() => {
  const navigationItem = heroNavigationItems.find((item) =>
    item.type === 'page'
      ? item.key === activeHeroKey.value
      : item.pages.some((page) => page.key === activeHeroKey.value),
  );
  return navigationItem?.type === 'menu' ? `${navigationItem.label}菜单` : '前台导航';
});
const activeHeroImage = computed(() => heroImages[activeHeroKey.value]);
const configuredHeroCount = computed(
  () => heroPages.filter((item) => Boolean(heroImages[item.key].trim())).length,
);

function isHeroMenuActive(menu: HeroPageMenu) {
  return menu.pages.some((page) => page.key === activeHeroKey.value);
}

function configuredHeroCountFor(menu: HeroPageMenu) {
  return menu.pages.filter((page) => Boolean(heroImages[page.key].trim())).length;
}

function toggleHeroMenu(menuKey: HeroMenuKey) {
  expandedHeroMenus[menuKey] = !expandedHeroMenus[menuKey];
}

function selectHeroPage(heroKey: HeroKey, menuKey?: HeroMenuKey) {
  activeHeroKey.value = heroKey;
  if (menuKey) {
    expandedHeroMenus[menuKey] = true;
  }
}

const activeTabManagesOwnActions = computed(() =>
  activeTab.value === 'ai'
  || activeTab.value === 'github-development'
  || activeTab.value === 'feature-toggles',
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
const featureToggles = reactive<FeatureToggleConfig>({
  articleCreationEnabled: false,
  travelCreationEnabled: false,
  musicCreationEnabled: false,
  adminNotificationEnabled: true,
  aiArticleAssistEnabled: true,
  aiMusicAssistEnabled: true,
  aiArticleRecommendEnabled: true,
});

const heroImages = reactive<Record<HeroKey, string>>({
  home: '',
  archive: '',
  'development-history': '',
  'memory-map': '',
  music: '',
  bookshelf: '',
  category: '',
  about: '',
  guestbook: '',
});
const heroImagePositions = reactive<Record<HeroKey, string>>({
  home: HERO_DEFAULT_POSITIONS.home,
  archive: HERO_DEFAULT_POSITIONS.archive,
  'development-history': HERO_DEFAULT_POSITIONS['development-history'],
  'memory-map': HERO_DEFAULT_POSITIONS['memory-map'],
  music: HERO_DEFAULT_POSITIONS.music,
  bookshelf: HERO_DEFAULT_POSITIONS.bookshelf,
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
  heroImages['development-history'] = config.heroImages?.['development-history'] ?? '';
  heroImages['memory-map'] = config.heroImages?.['memory-map'] ?? '';
  heroImages.music = config.heroImages?.music ?? '';
  heroImages.bookshelf = config.heroImages?.bookshelf ?? '';
  heroImages.category = config.heroImages?.category ?? '';
  heroImages.about = config.heroImages?.about ?? '';
  heroImages.guestbook = config.heroImages?.guestbook ?? '';

  heroImagePositions.home = config.heroImagePositions?.home ?? HERO_DEFAULT_POSITIONS.home;
  heroImagePositions.archive = config.heroImagePositions?.archive ?? HERO_DEFAULT_POSITIONS.archive;
  heroImagePositions['development-history'] =
    config.heroImagePositions?.['development-history']
    ?? HERO_DEFAULT_POSITIONS['development-history'];
  heroImagePositions['memory-map'] =
    config.heroImagePositions?.['memory-map'] ?? HERO_DEFAULT_POSITIONS['memory-map'];
  heroImagePositions.music = config.heroImagePositions?.music ?? HERO_DEFAULT_POSITIONS.music;
  heroImagePositions.bookshelf =
    config.heroImagePositions?.bookshelf ?? HERO_DEFAULT_POSITIONS.bookshelf;
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
      'development-history': heroImages['development-history'].trim(),
      'memory-map': heroImages['memory-map'].trim(),
      music: heroImages.music.trim(),
      bookshelf: heroImages.bookshelf.trim(),
      category: heroImages.category.trim(),
      about: heroImages.about.trim(),
      guestbook: heroImages.guestbook.trim(),
    },
    heroImagePositions: {
      home: heroImagePositions.home.trim(),
      archive: heroImagePositions.archive.trim(),
      'development-history': heroImagePositions['development-history'].trim(),
      'memory-map': heroImagePositions['memory-map'].trim(),
      music: heroImagePositions.music.trim(),
      bookshelf: heroImagePositions.bookshelf.trim(),
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
    const [config, nextFeatureToggles] = await Promise.all([
      getSiteConfig(),
      getFeatureToggleConfig(),
    ]);
    applyConfig(config);
    Object.assign(featureToggles, nextFeatureToggles);
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
    const res = await uploadSiteHero(options.file);
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

function goToCommentReview() {
  void router.push({
    path: '/admin',
    query: {
      tab: 'comments',
      status: '0',
    },
  });
}

async function saveConfig() {
  const payload = toPayload();
  if (!validatePayload(payload)) return;

  saving.value = true;
  try {
    const [nextConfig, nextFeatureToggles] = await Promise.all([
      updateSiteConfig(payload),
      updateFeatureToggleConfig({ ...featureToggles }),
    ]);
    applyConfig(nextConfig);
    Object.assign(featureToggles, nextFeatureToggles);
    setSiteConfig(nextConfig);
    notify.success('配置保存成功');
  } catch {
    // 请求层已经展示具体失败原因，避免再弹出一条笼统的“保存失败”。
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

.runtime-section-head:not(:first-child) {
  margin-top: var(--space-xl);
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

.review-entry {
  margin-top: var(--space-xs);
  margin-left: -8px;
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

.section-head--hero {
  align-items: flex-end;

  p {
    max-width: 62ch;
    margin: 6px 0 0;
    color: var(--color-text-secondary);
    font-size: 13px;
    line-height: 1.6;
  }
}

.hero-summary {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.hero-workspace {
  --hero-tint: oklch(72% 0.08 310);
  --hero-menu-surface: var(--color-surface);
  --hero-menu-divider: color-mix(in oklch, var(--color-accent) 18%, var(--color-surface));
  --hero-menu-ink: color-mix(in oklch, var(--color-text-primary) 88%, var(--color-accent));
  --hero-menu-meta: color-mix(in oklch, var(--color-text-primary) 62%, var(--color-accent));
  --hero-menu-hover: color-mix(in oklch, var(--color-accent) 6%, var(--color-surface));
  --hero-menu-active: color-mix(in oklch, var(--color-accent) 13%, var(--color-surface));
  --hero-menu-active-border: color-mix(in oklch, var(--color-accent) 30%, var(--color-surface));
  --hero-menu-accent-ink: color-mix(
    in oklch,
    var(--color-accent-strong) 74%,
    var(--color-text-primary)
  );

  display: grid;
  grid-template-columns: minmax(196px, 224px) minmax(0, 1fr);
  min-height: 520px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-surface);
}

.hero-page-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: var(--space-md);
  border-right: 1px solid var(--hero-menu-divider);
  background: var(--hero-menu-surface);
}

.hero-page-menu__label {
  margin: 0 0 2px;
  padding: 0 10px;
  color: var(--hero-menu-meta);
  font-size: 12px;
  font-weight: 650;
}

.hero-page-menu__items {
  display: grid;
  gap: 3px;
}

.hero-page-menu__item {
  width: 100%;
  min-height: 42px;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--hero-menu-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    color var(--motion-duration-fast) var(--motion-ease-standard),
    background-color var(--motion-duration-fast) var(--motion-ease-standard);

  &:hover:not(.is-active) {
    background: var(--hero-menu-hover);
    color: var(--hero-menu-accent-ink);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent-strong);
    outline-offset: 2px;
  }

  &.is-active {
    background: var(--hero-menu-active);
    color: var(--hero-menu-accent-ink);
    font-weight: 650;
    box-shadow: 0 0 0 1px var(--hero-menu-active-border) inset;
  }
}

.hero-page-menu__submenu {
  display: grid;
  gap: 3px;
}

.hero-page-menu__trigger {
  position: relative;
}

.hero-page-menu__children {
  display: grid;
  gap: 3px;
  margin: 0 0 3px 17px;
  padding-left: 8px;
  border-left: 1px solid var(--hero-menu-divider);
}

.hero-page-menu__child {
  min-height: 39px;
}

.hero-page-menu__icon {
  font-size: 16px;
}

.hero-page-menu__name {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-page-menu__suffix {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}

.hero-page-menu__count {
  color: var(--hero-menu-meta);
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.hero-page-menu__chevron {
  color: var(--hero-menu-meta);
  font-size: 13px;
  transition: transform var(--motion-duration-fast) var(--motion-ease-standard);
}

.hero-page-menu__submenu.is-open .hero-page-menu__chevron {
  transform: rotate(180deg);
}

.hero-page-menu__status {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: color-mix(in oklch, var(--color-accent) 18%, var(--color-surface));
  box-shadow: 0 0 0 1px var(--hero-menu-active-border) inset;

  &.is-configured {
    background: var(--color-accent);
    box-shadow: none;
  }
}

.hero-page-menu__item.is-active {
  .hero-page-menu__count,
  .hero-page-menu__chevron {
    color: var(--hero-menu-accent-ink);
  }
}

.hero-page-menu__submenu:has(.hero-page-menu__child.is-active)
  > .hero-page-menu__trigger.is-active {
  background: var(--hero-menu-hover);
  box-shadow: none;
}

.hero-editor {
  min-width: 0;
  padding: clamp(var(--space-lg), 2.6vw, var(--space-xl));
}

.hero-editor__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.hero-editor__identity {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;

  > div {
    min-width: 0;
  }

  p {
    max-width: 64ch;
    margin: 6px 0 0;
    color: var(--color-text-secondary);
    font-size: 12px;
    line-height: 1.6;
    text-wrap: pretty;
  }
}

.hero-editor__icon {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  display: inline-grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  font-size: 18px;
}

.hero-editor__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  h4 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 16px;
    font-weight: 650;
  }
}

.hero-editor__group,
.hero-editor__state {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.hero-editor__group {
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
}

.hero-editor__state {
  flex: 0 0 auto;
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);

  &.is-configured {
    background: var(--color-accent-soft);
    color: var(--color-accent-strong);
  }
}

.hero-preview {
  padding: 12px;
  border-radius: var(--radius-lg);
  background: color-mix(in oklch, var(--color-surface-muted) 90%, var(--hero-tint));
}

.hero-editor__controls {
  display: grid;
  gap: 12px;
  margin-top: var(--space-lg);
}

@media (max-width: 1080px) {
  .brand-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .hero-workspace {
    grid-template-columns: 190px minmax(0, 1fr);
  }
}

@media (max-width: 900px) {
  .hero-workspace {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-page-menu {
    border-right: 0;
    border-bottom: 1px solid var(--hero-menu-divider);
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

  .section-head--hero {
    align-items: flex-start;
  }

  .asset-panel {
    width: 100%;
    grid-template-columns: 1fr;
  }

  .hero-editor {
    padding: var(--space-md);
  }

  .hero-editor__head {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .runtime-row {
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-page-menu__item,
  .hero-page-menu__chevron {
    transition: none;
  }
}
</style>
