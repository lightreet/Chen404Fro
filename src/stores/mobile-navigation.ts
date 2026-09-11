import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  buildMobileNavigation, DEFAULT_MOBILE_NAV, MOBILE_NAV_STORAGE_KEY, normalizeMobileNavigation,
} from '@/modules/mobile/navigation';

export const useMobileNavigationStore = defineStore('mobile-navigation', () => {
  const selected = ref<string[]>([...DEFAULT_MOBILE_NAV]);
  try {
    const saved = localStorage.getItem(MOBILE_NAV_STORAGE_KEY);
    if (saved !== null) selected.value = normalizeMobileNavigation(JSON.parse(saved));
  } catch { /* Storage may be unavailable; defaults remain usable. */ }

  const items = computed(() => buildMobileNavigation(selected.value));

  function save(keys: readonly string[]): boolean {
    selected.value = normalizeMobileNavigation(keys);
    try {
      localStorage.setItem(MOBILE_NAV_STORAGE_KEY, JSON.stringify(selected.value));
      return true;
    } catch {
      return false;
    }
  }

  return { selected, items, save };
});
