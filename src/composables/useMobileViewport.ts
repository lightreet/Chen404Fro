import { onMounted, onUnmounted, ref } from 'vue';

// Phone layout is separate from the existing 1024px sidebar-collapse breakpoint.
export const MOBILE_VIEWPORT_QUERY = '(max-width: 767px)';

export function useMobileViewport() {
  const media = typeof window === 'undefined' ? null : window.matchMedia(MOBILE_VIEWPORT_QUERY);
  const isMobile = ref(media?.matches ?? false);
  const update = () => { isMobile.value = media?.matches ?? false; };
  onMounted(() => media?.addEventListener('change', update));
  onUnmounted(() => media?.removeEventListener('change', update));
  return { isMobile };
}
