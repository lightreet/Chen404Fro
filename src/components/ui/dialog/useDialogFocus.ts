import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue';

const openDialogs: symbol[] = [];
const scrollOwners = new Set<symbol>();
let previousOverflow = '';

/** Keep nested project dialogs from releasing each other's scroll lock or focus. */
export function useDialogFocus(open: () => boolean, panel: Ref<HTMLElement | null>, close: () => void, lockScroll: () => boolean) {
  const id = Symbol('dialog');
  let trigger: HTMLElement | null = null;
  let disposed = false;
  const release = () => {
    const index = openDialogs.indexOf(id);
    const wasTopDialog = index >= 0 && index === openDialogs.length - 1;
    if (index >= 0) openDialogs.splice(index, 1);
    if (scrollOwners.delete(id) && !scrollOwners.size) document.body.style.overflow = previousOverflow;
    document.removeEventListener('keydown', onKeydown, true);
    if (wasTopDialog && trigger?.isConnected) trigger.focus({ preventScroll: true });
    trigger = null;
  };
  function onKeydown(event: KeyboardEvent) {
    if (openDialogs.at(-1) !== id || !panel.value) return;
    // Dropdowns keep focus on their input, so inspect visible overlays as well as the event target.
    const target = event.target;
    if (target instanceof Element && target.closest('.el-image-viewer__wrapper, .el-select-dropdown, .el-picker-panel')) return;
    if ([...document.querySelectorAll<HTMLElement>('.el-select-dropdown, .el-picker-panel, .el-image-viewer__wrapper, .el-overlay-message-box')]
      .some(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }
    if (event.key !== 'Tab') return;
    const focusable = [...panel.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter(node => node.getClientRects().length && node.getAttribute('aria-hidden') !== 'true');
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) { event.preventDefault(); panel.value.focus(); return; }
    if (event.shiftKey && (document.activeElement === first || !panel.value.contains(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !panel.value.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  }
  watch(open, async value => {
    if (!value) { release(); return; }
    trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    openDialogs.push(id);
    if (lockScroll()) {
      if (!scrollOwners.size) previousOverflow = document.body.style.overflow;
      scrollOwners.add(id);
      document.body.style.overflow = 'hidden';
    }
    document.addEventListener('keydown', onKeydown, true);
    await nextTick();
    if (!disposed && open()) panel.value?.focus({ preventScroll: true });
  }, { immediate: true });
  onBeforeUnmount(() => { disposed = true; release(); });
}
