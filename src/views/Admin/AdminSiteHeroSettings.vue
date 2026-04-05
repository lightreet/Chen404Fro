<template>
  <el-card class="info-card" shadow="never">
    <template #header>
      <div class="header-row">
        <span class="card-title">
          <el-icon class="card-icon"><Picture /></el-icon>
          页面封面
        </span>
        <el-button :loading="loading" @click="loadConfig">刷新</el-button>
      </div>
    </template>

    <div class="intro">
      为带有顶部封面的页面配置背景图，支持静态图片与 GIF 动图。未设置时，前台会继续使用代码中的默认图。
    </div>

    <div v-loading="loading" class="hero-grid">
      <section v-for="item in heroPages" :key="item.key" class="hero-card">
        <div class="hero-card__head">
          <div>
            <h3 class="hero-card__title">{{ item.label }}</h3>
            <p class="hero-card__desc">{{ item.desc }}</p>
          </div>
        </div>

        <div class="hero-preview">
          <img
            v-if="heroImages[item.key]"
            :src="heroImages[item.key]"
            :alt="`${item.label}封面`"
            class="hero-preview__img"
          />
          <div v-else class="hero-preview__empty">未设置，将使用默认封面</div>
        </div>

        <div class="hero-actions">
          <el-upload
            :show-file-list="false"
            :before-upload="beforeHeroUpload"
            :http-request="(options) => handleHeroUpload(item.key, options)"
            accept="image/*"
          >
            <el-button :loading="uploadingKey === item.key" type="primary">
              上传封面
            </el-button>
          </el-upload>

          <el-button
            v-if="heroImages[item.key]"
            text
            type="danger"
            @click="heroImages[item.key] = ''"
          >
            清除
          </el-button>
        </div>

        <p class="hero-tip">支持 GIF 动图；清除后需要点击底部“保存配置”才会对前台生效。</p>

        <el-input
          v-model="heroImages[item.key]"
          placeholder="也可以直接粘贴图片 URL（支持 GIF）"
          clearable
        />
      </section>
    </div>

    <div class="footer-row">
      <el-button @click="loadConfig">重置</el-button>
      <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { UploadRequestOptions } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Picture } from '@element-plus/icons-vue';
import { getSiteConfig, updateSiteConfig } from '@/api/home';
import { uploadCover } from '@/api/upload';
import { validateImageFile, DEFAULT_IMAGE_MAX_MB } from '@/utils/validation';
import { useSiteConfig } from '@/composables/useSiteConfig';
import type { SiteConfig } from '@/types';

type HeroKey = 'home' | 'archive' | 'category' | 'tag' | 'about' | 'guestbook';

const heroPages: Array<{ key: HeroKey; label: string; desc: string }> = [
  { key: 'home', label: '首页', desc: '首页主视觉封面' },
  { key: 'archive', label: '时光轴', desc: '时光轴页面顶部封面' },
  { key: 'category', label: '分类页', desc: '分类列表顶部封面' },
  { key: 'tag', label: '标签页', desc: '标签云顶部封面' },
  { key: 'about', label: '关于页', desc: '关于页面顶部封面' },
  { key: 'guestbook', label: '留言板', desc: '留言板顶部封面' },
];

const { setSiteConfig } = useSiteConfig();

const loading = ref(false);
const saving = ref(false);
const uploadingKey = ref<HeroKey | ''>('');
const heroImages = reactive<Record<HeroKey, string>>({
  home: '',
  archive: '',
  category: '',
  tag: '',
  about: '',
  guestbook: '',
});

const applyConfig = (config: SiteConfig) => {
  heroImages.home = config.heroImages?.home ?? '';
  heroImages.archive = config.heroImages?.archive ?? '';
  heroImages.category = config.heroImages?.category ?? '';
  heroImages.tag = config.heroImages?.tag ?? '';
  heroImages.about = config.heroImages?.about ?? '';
  heroImages.guestbook = config.heroImages?.guestbook ?? '';
};

const isSafeHeroUrl = (value: string) => {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/[\"'()<>\\\r\n]/.test(trimmed)) return false;
  return trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://');
};

const loadConfig = async () => {
  loading.value = true;
  try {
    const config = await getSiteConfig();
    applyConfig(config);
  } catch {
    ElMessage.error('加载站点配置失败');
  } finally {
    loading.value = false;
  }
};

const beforeHeroUpload = (file: File) => {
  const result = validateImageFile(file, DEFAULT_IMAGE_MAX_MB);
  if (!result.valid) {
    ElMessage.error(result.message);
    return false;
  }
  return true;
};

const handleHeroUpload = async (key: HeroKey, options: UploadRequestOptions) => {
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
};

const saveConfig = async () => {
  const payload = {
    heroImages: {
      home: heroImages.home.trim(),
      archive: heroImages.archive.trim(),
      category: heroImages.category.trim(),
      tag: heroImages.tag.trim(),
      about: heroImages.about.trim(),
      guestbook: heroImages.guestbook.trim(),
    },
  };

  const invalidEntry = Object.entries(payload.heroImages).find(([, value]) => !isSafeHeroUrl(value));
  if (invalidEntry) {
    ElMessage.warning('封面地址只支持本站相对路径或 http/https 图片链接');
    return;
  }

  saving.value = true;
  try {
    const nextConfig = await updateSiteConfig(payload);
    applyConfig(nextConfig);
    setSiteConfig(nextConfig);
    ElMessage.success('页面封面保存成功');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadConfig();
});
</script>

<style scoped lang="scss">
.info-card {
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);

  :deep(.el-card__header) {
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--border-light);
    font-weight: 600;
  }

  :deep(.el-card__body) {
    padding: var(--spacing-lg);
  }
}

.header-row,
.footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.card-title {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-primary);
}

.card-icon {
  color: var(--primary);
  font-size: 18px;
}

.intro {
  margin-bottom: 18px;
  color: var(--text-secondary);
  font-size: 14px;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 20px;
}

.hero-card {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px;
  background: var(--bg-secondary);
}

.hero-card__head {
  margin-bottom: 12px;
}

.hero-card__title {
  margin: 0 0 4px;
  font-size: 16px;
  color: var(--text-primary);
}

.hero-card__desc {
  margin: 0;
  color: var(--text-tertiary);
  font-size: 13px;
}

.hero-preview {
  height: 148px;
  border-radius: 14px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(51, 65, 85, 0.88));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.hero-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-preview__empty {
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.hero-tip {
  margin: 0 0 12px;
  color: var(--text-tertiary);
  font-size: 12px;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
}
</style>
