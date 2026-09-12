<template>
  <UiDrawer
    :model-value="isOpen"
    class="navigation-settings-sheet"
    direction="btt"
    size="auto"
    title="自定义底栏"
    append-to-body
    :show-close="false"
    :before-close="close"
  >
    <template #header>
      <div class="navigation-heading">
        <span class="navigation-heading__handle" aria-hidden="true" />
        <h2>自定义底栏</h2>
        <button type="button" class="app-mobile-icon" aria-label="关闭自定义底栏" @click="close">
          <UiIcon name="close" :size="24" />
        </button>
      </div>
    </template>

    <div class="navigation-settings">
      <p class="settings-description">把最常用的栏目放到底部，最多 {{ MOBILE_NAV_LIMIT + 2 }} 项。</p>
      <section aria-labelledby="preview-title">
        <h3 id="preview-title" class="preview-title">底栏预览</h3>
        <div class="navigation-preview" aria-label="调整后的底栏预览">
          <div v-for="item in previewItems" :key="item.key" class="navigation-preview__item" :class="{ 'is-home': item.key === 'home' }">
            <UiIcon :name="item.icon" :size="24" />
            <span>{{ item.label }}</span>
            <UiIcon v-if="item.key === 'home' || item.key === 'discover'" name="lock" :size="12" label="固定栏目" />
          </div>
        </div>
        <p class="settings-hint">首页和发现始终保留，其他栏目可自由调整。</p>
      </section>

      <section aria-labelledby="selected-title">
        <h3 id="selected-title">已选栏目 <span>{{ draft.length }} / {{ MOBILE_NAV_LIMIT }} · 拖动右侧排序</span></h3>
        <p id="navigation-sort-help" class="visually-hidden">拖动排序手柄，或点击选择移动方向；键盘可用上下方向键调整。</p>
        <ol ref="rows" class="navigation-rows">
          <li v-for="(item, index) in selectedItems" :key="item.key" class="navigation-row" :class="{ 'is-dragging': draggedKey === item.key }" :data-key="item.key">
            <button class="navigation-remove" type="button" :aria-label="'移除' + item.label" @click="remove(item.key)">
              <span><UiIcon name="minus" :size="16" /></span>
            </button>
            <UiIcon :name="item.icon" :size="24" />
            <strong>{{ item.label }}</strong>
            <div class="navigation-sort">
              <button class="app-mobile-icon navigation-sort__handle" type="button" :aria-label="'排序' + item.label" aria-describedby="navigation-sort-help"
                :aria-expanded="sortMenu === item.key" @click="toggleSortMenu(item.key)"
                @pointerdown="startDrag($event, item.key)" @pointermove="dragOver" @pointerup="endDrag" @pointercancel="cancelDrag"
                @keydown.up.prevent="move(index, index - 1)" @keydown.down.prevent="move(index, index + 1)" @keydown.esc="sortMenu = ''">
                <UiIcon name="drag" :size="20" />
              </button>
              <div v-if="sortMenu === item.key" class="navigation-sort__menu">
                <button type="button" :disabled="index === 0" @click="move(index, index - 1); sortMenu = ''">向前移动</button>
                <button type="button" :disabled="index === draft.length - 1" @click="move(index, index + 1); sortMenu = ''">向后移动</button>
              </div>
            </div>
          </li>
        </ol>
        <p v-if="!draft.length" class="settings-hint">还未选择栏目，可从下方添加。</p>
      </section>

      <section aria-labelledby="available-title">
        <h3 id="available-title">可添加栏目 <span>{{ isFull ? '移除一项后可添加' : '还可添加 ' + (MOBILE_NAV_LIMIT - draft.length) + ' 项' }}</span></h3>
        <div class="navigation-choices">
          <button v-for="item in availableItems" :key="item.key" type="button" :disabled="isFull" :aria-label="'添加' + item.label" @click="add(item.key)">
            <UiIcon :name="item.icon" :size="24" /><span class="navigation-choice__label">{{ item.label }}</span><UiIcon name="add" :size="20" />
          </button>
        </div>
      </section>
      <p class="visually-hidden" role="status">{{ announcement }}</p>
      <p v-if="saveWarning" class="settings-warning" role="status">{{ saveWarning }}</p>
    </div>

    <template #footer>
      <div class="navigation-save">
        <UiButton @click="reset">恢复默认</UiButton>
        <UiButton variant="primary" @click="save">保存设置</UiButton>
      </div>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { UiButton, UiDrawer, UiIcon } from '@/components/ui';
import { useMobileNavigationStore } from '@/stores/mobile-navigation';
import { buildMobileNavigation, DEFAULT_MOBILE_NAV, MOBILE_NAV_LIMIT, OPTIONAL_MOBILE_DESTINATIONS } from '@/modules/mobile/navigation';
import { confirmAction, notify } from '@/lib/feedback';

const navigation = useMobileNavigationStore();
const route = useRoute();
const router = useRouter();
const isOpen = computed(() => route.query.panel === 'navigation');
const draft = ref([...navigation.selected]);
const rows = ref<HTMLOListElement>();
const draggedKey = ref('');
const sortMenu = ref('');
const saveWarning = ref('');
const announcement = ref('');
let dragStartY = 0;
let dragStartOrder: string[] = [];
let pointerId: number | null = null;
let didDrag = false;
const selectedItems = computed(() => draft.value.flatMap(key => OPTIONAL_MOBILE_DESTINATIONS.filter(item => item.key === key)));
const availableItems = computed(() => OPTIONAL_MOBILE_DESTINATIONS.filter(item => !draft.value.includes(item.key)));
const previewItems = computed(() => buildMobileNavigation(draft.value));
const isFull = computed(() => draft.value.length >= MOBILE_NAV_LIMIT);
const dirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(navigation.selected));

watch(isOpen, open => {
  if (open) {
    draft.value = [...navigation.selected];
    saveWarning.value = '';
    announcement.value = '';
    sortMenu.value = '';
  }
}, { immediate: true });

function remove(key: string) {
  draft.value = draft.value.filter(item => item !== key);
  sortMenu.value = '';
}
function add(key: string) {
  if (!isFull.value && availableItems.value.some(item => item.key === key)) draft.value.push(key);
}
function reset() {
  draft.value = [...DEFAULT_MOBILE_NAV];
  sortMenu.value = '';
}
function move(from: number, to: number) {
  if (from < 0 || to < 0 || to >= draft.value.length || from === to) return;
  const item = draft.value.splice(from, 1)[0];
  if (!item) return;
  draft.value.splice(to, 0, item);
  const label = OPTIONAL_MOBILE_DESTINATIONS.find(destination => destination.key === item)?.label;
  announcement.value = label + '已移到第 ' + (to + 1) + ' 位';
}
function startDrag(event: PointerEvent, key: string) {
  if (!event.isPrimary || event.button !== 0) return;
  const handle = event.currentTarget;
  if (!(handle instanceof HTMLElement)) return;
  handle.setPointerCapture(event.pointerId);
  pointerId = event.pointerId;
  draggedKey.value = key;
  dragStartY = event.clientY;
  dragStartOrder = [...draft.value];
  didDrag = false;
}
function dragOver(event: PointerEvent) {
  if (pointerId !== event.pointerId || !draggedKey.value || !rows.value) return;
  if (!didDrag && Math.abs(event.clientY - dragStartY) < 6) return;
  didDrag = true;
  sortMenu.value = '';
  const from = draft.value.indexOf(draggedKey.value);
  const items = Array.from(rows.value.children);
  // Compare row midpoints so touch and mouse use the same stable reorder threshold.
  for (let index = 0; index < items.length; index++) {
    const rect = items[index]!.getBoundingClientRect();
    const middle = rect.top + rect.height / 2;
    if ((index < from && event.clientY < middle) || (index > from && event.clientY > middle)) {
      move(from, index);
      break;
    }
  }
}
function endDrag() {
  pointerId = null;
  draggedKey.value = '';
}
function cancelDrag() {
  if (pointerId !== null) draft.value = [...dragStartOrder];
  didDrag = false;
  endDrag();
}
function toggleSortMenu(key: string) {
  if (didDrag) { didDrag = false; return; }
  sortMenu.value = sortMenu.value === key ? '' : key;
}
function close() {
  const query = { ...route.query };
  delete query.panel;
  void router.replace({ path: '/discover', query });
}
function save() {
  const persisted = navigation.save(draft.value);
  if (!persisted) { saveWarning.value = '底栏已在本次浏览中生效；浏览器未允许保存偏好，关闭后可能恢复默认。'; return; }
  notify.success('底栏已保存');
  close();
}
async function canLeave() {
  return !isOpen.value || !dirty.value || await confirmAction({ title: '放弃底栏调整？', message: '当前修改还没有保存。', confirmText: '放弃修改', cancelText: '继续调整', tone: 'warning' });
}
onBeforeRouteLeave(canLeave);
onBeforeRouteUpdate(to => to.query.panel === 'navigation' || canLeave());
</script>

<style scoped lang="scss">
.navigation-heading { position: relative; display: flex; align-items: center; justify-content: space-between; width: 100%; padding-top: 12px; }
.navigation-heading__handle { position: absolute; width: 46px; height: 4px; border-radius: var(--radius-pill); background: var(--color-border); top: 0; left: calc(50% - 23px); }
.navigation-heading h2 { font-size: 20px; line-height: 28px; font-weight: 600; }
.navigation-settings { color: var(--color-text-primary); }
.settings-description, .settings-hint { font-size: 13px; line-height: 1.6; color: var(--color-text-secondary); }
.settings-description { margin: 0 0 18px; }
.settings-hint { margin-top: 8px; }
section + section { margin-top: 24px; }
h3 { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 15px; font-weight: 600; line-height: 24px; margin-bottom: 8px; }
h3 > span { color: var(--color-text-secondary); font-size: 12px; font-weight: 400; }
.preview-title { font-size: 13px; font-weight: 400; color: var(--color-text-secondary); }
.navigation-preview { display: flex; justify-content: space-around; padding: 16px 8px 12px; border-radius: var(--mobile-card-radius); background: var(--color-canvas); }
.navigation-preview__item { display: flex; flex: 1; min-width: 0; flex-direction: column; align-items: center; gap: 6px; color: var(--color-text-secondary); font-size: 12px; line-height: 18px; }
.navigation-preview__item.is-home { color: var(--color-accent-readable); }
.navigation-preview__item > .ui-icon:last-child { color: var(--color-text-secondary); }
.navigation-rows { display: grid; gap: 6px; padding: 0; margin: 0; list-style: none; }
.navigation-row { position: relative; display: flex; align-items: center; gap: 10px; min-height: 50px; padding: 3px 4px; border-radius: var(--mobile-control-radius); background: var(--color-canvas); }
.navigation-row.is-dragging { outline: 1px solid var(--color-accent-readable); background: var(--color-accent-soft); }
.navigation-row strong { flex: 1; min-width: 0; font-size: 15px; font-weight: 500; }
.navigation-remove { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; cursor: pointer; }
.navigation-remove > span { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; color: var(--color-accent-readable); background: var(--control-secondary-background, var(--color-accent-soft)); }
.navigation-sort { position: relative; }
.navigation-sort__handle { touch-action: none; cursor: grab; color: var(--color-text-secondary); }
.is-dragging .navigation-sort__handle { cursor: grabbing; }
.navigation-sort__menu { position: absolute; z-index: 1; right: 0; top: 44px; width: 120px; padding: 4px; border: 1px solid var(--color-border); border-radius: var(--mobile-control-radius); background: var(--color-surface); box-shadow: var(--shadow-md); }
.navigation-sort__menu button { display: block; width: 100%; min-height: 44px; border: 0; border-radius: 8px; background: transparent; color: var(--color-text-primary); font: inherit; font-size: 13px; cursor: pointer; }
.navigation-choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.navigation-choices button { min-height: 50px; border: 0; border-radius: var(--mobile-control-radius); background: var(--color-canvas); color: var(--color-text-primary); display: flex; align-items: center; gap: 10px; padding: 10px 12px; cursor: pointer; font: inherit; font-size: 15px; }
.navigation-choice__label { flex: 1; min-width: 0; text-align: left; }
button:disabled { opacity: .45; cursor: default; }
button:focus-visible { outline: 2px solid var(--color-accent-readable); outline-offset: 2px; }
.navigation-save { display: grid; grid-template-columns: 105px 1fr; gap: 12px; }
.navigation-save .ui-button { min-height: 48px; border-radius: var(--mobile-control-radius); }
.settings-warning { margin-top: 12px; color: var(--color-accent-readable); font-size: 13px; }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>

<style lang="scss">
.ui-drawer.navigation-settings-sheet {
  width: min(100%, 480px);
  max-height: 88dvh;
  margin-inline: auto;
  border-radius: var(--mobile-sheet-radius) var(--mobile-sheet-radius) 0 0;
  background: var(--color-surface);
  .el-drawer__header { padding: 12px 20px 0; margin-bottom: 0; }
  .el-drawer__body { padding: 0 20px 20px; }
  .el-drawer__footer { padding: 14px 20px calc(16px + env(safe-area-inset-bottom)); border-top: 1px solid var(--color-border-light); }
}
</style>
