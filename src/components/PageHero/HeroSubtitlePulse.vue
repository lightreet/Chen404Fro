<template>
  <div class="hero-subtitle">
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
  font-size: clamp(0.98rem, 1.45vw, 1.1rem);
  font-weight: 400;
  line-height: 1.76;
  letter-spacing: 0.09em;
  color: rgba(241, 228, 234, 0.9);
  text-align: center;
  text-wrap: balance;
  text-shadow:
    0 2px 10px rgba(18, 11, 18, 0.18),
    0 0 10px rgba(255, 231, 239, 0.04);
}

@media (max-width: 768px) {
  .hero-subtitle {
    padding-bottom: 0.04rem;
  }

  .hero-subtitle__text {
    font-size: 0.95rem;
    line-height: 1.68;
    letter-spacing: 0.06em;
  }
}
</style>
