<template>
  <div class="hero-subtitle page-hero__subtitle-text">
    <span
      v-for="(line, index) in textLines"
      :key="`${index}-${line}`"
      class="hero-subtitle__text"
      :class="{ 'hero-subtitle__text--secondary': index > 0 }"
    >
      {{ line }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  text: string | string[];
}

const props = defineProps<Props>();

const textLines = computed(() => {
  const source = Array.isArray(props.text) ? props.text : props.text.split('\n');
  return source.map((line) => line.trim()).filter(Boolean);
});
</script>

<style scoped lang="scss">
.hero-subtitle {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  max-width: min(100%, 34rem);
  gap: 0.34rem;
  padding: 0.08rem 0.35rem 0.08rem;
}

.hero-subtitle__text {
  display: inline-block;
  color: inherit;
  text-wrap: balance;
}

.hero-subtitle__text--secondary {
  font-size: 0.95em;
  opacity: 0.84;
}

@media (max-width: 768px) {
  .hero-subtitle {
    gap: 0.24rem;
    padding-bottom: 0.04rem;
  }
}
</style>
