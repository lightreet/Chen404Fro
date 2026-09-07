<template>
  <main class="mobile-upload-panel">
    <header class="mobile-upload-panel__brand">
      <img v-if="logoSrc" :src="logoSrc" :alt="brandName + ' Logo'" width="30" height="30" />
      <span
        >{{ brandName }}<template v-if="moduleLabel"> · {{ moduleLabel }}</template></span
      >
    </header>

    <section class="mobile-upload-panel__content">
      <div v-if="targetLabel" class="mobile-upload-panel__target">
        <h1>{{ targetLabel }}</h1>
        <p v-if="maxCount != null">已选 {{ selectedCount }} / {{ maxCount }} 张</p>
      </div>
      <slot />
    </section>

    <footer v-if="$slots.footer" class="mobile-upload-panel__footer">
      <slot name="footer" />
    </footer>
  </main>
</template>

<script setup lang="ts">
/** 跨模块复用的手机图片上传展示容器，不依赖旅行 API、凭证或队列模型。 */
withDefaults(
  defineProps<{
    moduleLabel: string
    targetLabel?: string
    selectedCount?: number
    maxCount?: number
    brandName?: string
    logoSrc?: string
  }>(),
  {
    targetLabel: '',
    selectedCount: 0,
    brandName: 'Chen404',
    logoSrc: '/favicon.png',
  },
)
</script>

<style scoped lang="scss">
.mobile-upload-panel {
  display: flex;
  flex-direction: column;
  max-width: 520px;
  min-height: 100dvh;
  margin: 0 auto;
  background: var(--color-surface);
  color: var(--color-text-primary);
}
.mobile-upload-panel__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-accent-readable);
  font-size: 16px;
  font-weight: 600;
}
.mobile-upload-panel__brand img {
  flex: 0 0 30px;
  object-fit: contain;
}
.mobile-upload-panel__brand span {
  min-width: 0;
  overflow-wrap: anywhere;
}
.mobile-upload-panel__content {
  flex: 1;
  min-width: 0;
  padding: 24px;
}
.mobile-upload-panel__target {
  margin-bottom: 22px;
}
.mobile-upload-panel__target h1 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 650;
  line-height: 1.4;
  overflow-wrap: anywhere;
  text-wrap: balance;
}
.mobile-upload-panel__target p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}
.mobile-upload-panel__footer {
  position: sticky;
  bottom: 0;
  display: grid;
  gap: 10px;
  padding: 16px 24px max(24px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}
@media (min-width: 700px) {
  .mobile-upload-panel {
    min-height: auto;
    margin-block: 32px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    overflow: hidden;
  }
}
@media (max-width: 360px) {
  .mobile-upload-panel__brand,
  .mobile-upload-panel__content,
  .mobile-upload-panel__footer {
    padding-inline: 16px;
  }
}
</style>
