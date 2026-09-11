<template><DefaultLayout mobile-title="与 Lyra 聊聊"><div class="lyra-page"><Live2D page-mode /></div></DefaultLayout></template>
<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import Live2D from '@/components/Live2D/Live2D.vue'
</script>
<style scoped lang="scss">
.lyra-page { max-width: 680px; margin: 0 auto; height: calc(100dvh - 160px); min-height: 400px; }
@media (max-width: 767px) { .lyra-page { height: calc(100dvh - var(--mobile-header-height) - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 24px); min-height: 320px; } }
</style>
