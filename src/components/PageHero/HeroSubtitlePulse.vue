<template>
  <div class="hero-subtitle page-hero__subtitle-text">
    <span class="hero-subtitle__text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  text: string;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.hero-subtitle {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  max-width: min(100%, 34rem);
  padding: 0.08rem 0.35rem 0.08rem;
}

.hero-subtitle__text {
  display: inline-block;
  color: inherit;
  text-wrap: balance;
}

@media (max-width: 768px) {
  .hero-subtitle {
    padding-bottom: 0.04rem;
  }
}
</style>
