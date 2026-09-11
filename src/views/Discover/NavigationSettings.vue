<template>
  <DefaultLayout mobile-title="自定义底栏">
    <div class="navigation-settings">
      <h1>让常用栏目更顺手</h1>
      <p class="settings-description">首页与发现固定，中间最多放 {{ MOBILE_NAV_LIMIT }} 个栏目。按箭头调整顺序，也可以拖动排列。</p>
      <section aria-labelledby="selected-title">
        <h2 id="selected-title">当前底栏 <span>{{ draft.length + 2 }} / 5</span></h2>
        <div class="navigation-rows">
          <div class="navigation-row is-fixed"><UiIcon name="home" :size="24" /><strong>首页</strong><span>固定</span></div>
          <div v-for="(item, index) in selectedItems" :key="item.key" class="navigation-row" draggable="true"
            @dragstart="draggedKey = item.key" @dragend="draggedKey = ''" @dragover.prevent @drop.prevent="dropAt(index)">
            <UiIcon :name="item.icon" :size="24" /><strong>{{ item.label }}</strong>
            <button class="app-mobile-icon" type="button" :aria-label="`上移${item.label}`" :disabled="index === 0" @click="move(index, -1)"><UiIcon name="arrow-up" /></button>
            <button class="app-mobile-icon" type="button" :aria-label="`下移${item.label}`" :disabled="index === draft.length - 1" @click="move(index, 1)"><UiIcon name="arrow-down" /></button>
            <button class="app-mobile-icon" type="button" :aria-label="`移除${item.label}`" @click="remove(item.key)"><UiIcon name="close" /></button>
          </div>
          <div class="navigation-row is-fixed"><UiIcon name="compass" :size="24" /><strong>发现</strong><span>固定</span></div>
        </div>
      </section>
      <section aria-labelledby="available-title">
        <h2 id="available-title">可添加的栏目</h2>
        <div class="navigation-choices">
          <button v-for="item in availableItems" :key="item.key" type="button" :disabled="draft.length >= MOBILE_NAV_LIMIT" @click="draft.push(item.key)">
            <UiIcon :name="item.icon" :size="22" /><span>{{ item.label }}</span><UiIcon name="add" />
          </button>
        </div>
        <p class="settings-description" aria-live="polite">{{ draft.length >= MOBILE_NAV_LIMIT ? '已放满，移除一个栏目后可添加。' : '未添加的栏目仍可从发现进入。' }}</p>
      </section>
      <p v-if="saveWarning" class="settings-warning" role="status">{{ saveWarning }}</p>
      <div class="navigation-save">
        <UiButton @click="draft = [...DEFAULT_MOBILE_NAV]">恢复默认</UiButton>
        <UiButton variant="primary" @click="save">保存底栏</UiButton>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { UiButton, UiIcon } from '@/components/ui';
import { useMobileNavigationStore } from '@/stores/mobile-navigation';
import { DEFAULT_MOBILE_NAV, MOBILE_NAV_LIMIT, OPTIONAL_MOBILE_DESTINATIONS } from '@/modules/mobile/navigation';
import { confirmAction, notify } from '@/lib/feedback';
const navigation = useMobileNavigationStore();
const router = useRouter();
const draft = ref([...navigation.selected]);
const draggedKey = ref('');
const saveWarning = ref('');
const selectedItems = computed(() => draft.value.flatMap(key => OPTIONAL_MOBILE_DESTINATIONS.filter(item => item.key === key)));
const availableItems = computed(() => OPTIONAL_MOBILE_DESTINATIONS.filter(item => !draft.value.includes(item.key)));
const dirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(navigation.selected));
function remove(key: string) { draft.value = draft.value.filter(item => item !== key); }
function move(index: number, direction: number) {
  const to = index + direction;
  if (to < 0 || to >= draft.value.length) return;
  const item = draft.value.splice(index, 1)[0];
  if (item) draft.value.splice(to, 0, item);
}
function dropAt(index: number) {
  const from = draft.value.indexOf(draggedKey.value);
  if (from >= 0) move(from, index - from);
  draggedKey.value = '';
}
function save() {
  const persisted = navigation.save(draft.value);
  if (!persisted) { saveWarning.value = '底栏已在本次浏览中生效；浏览器未允许保存偏好，关闭后可能恢复默认。'; return; }
  notify.success('底栏已保存');
  void router.replace('/discover');
}
onBeforeRouteLeave(async () => !dirty.value || await confirmAction({ title: '放弃底栏调整？', message: '当前修改还没有保存。', confirmText: '放弃修改', cancelText: '继续调整', tone: 'warning' }));
</script>

<style scoped lang="scss">
.navigation-settings { max-width: 640px; margin: auto; padding-top: 16px; }
h1 { font-size: 24px; line-height: 1.4; }
.settings-description { margin: 10px 0 20px; font-size: 13px; color: var(--color-text-secondary); line-height: 1.7; }
section { margin-block: 24px; }
h2 { display: flex; justify-content: space-between; font-size: 18px; margin-bottom: 12px; }
h2 span { color: var(--color-text-secondary); font-size: 13px; font-weight: 400; }
.navigation-rows { background: var(--color-surface); border-radius: var(--mobile-card-radius); overflow: hidden; }
.navigation-row { display: flex; align-items: center; gap: 8px; min-height: 60px; padding: 8px 12px; border-bottom: 1px solid var(--color-border-light); }
.navigation-row > .ui-icon { margin-right: 4px; color: var(--color-accent-readable); }
.navigation-row strong { flex: 1; font-size: 15px; font-weight: 500; }
.is-fixed span { color: var(--color-text-secondary); font-size: 12px; padding-right: 8px; }
.navigation-choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.navigation-choices button { min-height: 56px; border: 0; border-radius: var(--mobile-control-radius); background: var(--color-surface); color: var(--color-text-primary); display: flex; align-items: center; gap: 8px; padding: 12px; cursor: pointer; font: inherit; font-size: 14px; }
.navigation-choices span { flex: 1; text-align: left; }
button:disabled { opacity: .4; cursor: default; }
.navigation-save { position: sticky; bottom: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px 0 calc(16px + env(safe-area-inset-bottom)); background: var(--color-canvas); }
.settings-warning { color: var(--color-accent-readable); font-size: 13px; }
</style>
