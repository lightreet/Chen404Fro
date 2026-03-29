import { ref, onMounted, onUnmounted } from 'vue';

/** 与 DefaultLayout、`variables.scss` 中 $breakpoint-lg 一致 */
export const LAYOUT_MOBILE_MAX_WIDTH = 1024;

export function useLayoutMobile() {
  const isMobile = ref(false);

  const update = () => {
    isMobile.value = window.innerWidth < LAYOUT_MOBILE_MAX_WIDTH;
  };

  onMounted(() => {
    update();
    window.addEventListener('resize', update);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', update);
  });

  return { isMobile };
}
