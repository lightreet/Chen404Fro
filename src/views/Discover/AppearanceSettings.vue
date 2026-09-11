<template>
  <DefaultLayout mobile-title="显示与主题">
    <div class="appearance-settings">
      <section><h1>主题</h1>
        <UiRadioGroup :model-value="app.theme" :options="themeOptions" @update:model-value="setTheme" />
      </section>
      <section><h2>樱花效果</h2>
        <p>为桌面端保留一点季节感，手机端优先展示内容。</p>
        <UiRadioGroup :model-value="app.sakuraEffect" :options="effectOptions" @update:model-value="setEffect" />
      </section>
      <p class="appearance-note">设置保存在当前浏览器，修改后即时生效。</p>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { UiRadioGroup } from '@/components/ui';
import { useAppStore } from '@/stores/app';
const app = useAppStore();
const themeOptions = [{ label: '浅色模式', value: 'light' }, { label: '深色模式', value: 'dark' }];
const effectOptions = [{ label: '完整', value: 'full' }, { label: '轻量', value: 'light' }, { label: '关闭', value: 'off' }];
function setTheme(value: string | number | boolean | undefined) { if (value === 'light' || value === 'dark') app.setTheme(value); }
function setEffect(value: string | number | boolean | undefined) { if (value === 'full' || value === 'light' || value === 'off') app.setSakuraEffect(value); }
</script>
<style scoped lang="scss">
.appearance-settings { max-width: 640px; margin: auto; padding-top: 16px; }
section { padding: 20px; background: var(--color-surface); border-radius: var(--mobile-card-radius); margin-bottom: 16px; }
h1, h2 { font-size: 18px; margin-bottom: 16px; }
p { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 16px; }
.appearance-note { text-align: center; margin-top: 24px; }
</style>
