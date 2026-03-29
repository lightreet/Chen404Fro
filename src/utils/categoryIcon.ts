/**
 * 分类图标仅离线注册少量 MDI（见 iconify/registerMdiSubset.ts）。
 * 未在此集合且未在 registerMdiSubset 注册的 mdi: 名称会回落为 mdi:folder。
 */
export const REGISTERED_CATEGORY_MDICONS = new Set([
  'mdi:folder',
  'mdi:folder-open',
  'mdi:vuejs',
  'mdi:server',
  'mdi:database',
  'mdi:cloud',
  'mdi:coffee',
  'mdi:robot',
])

export function resolveCategoryIcon(raw: string | null | undefined): string {
  const s = (raw ?? '').trim()
  if (!s.startsWith('mdi:')) return 'mdi:folder'
  return REGISTERED_CATEGORY_MDICONS.has(s) ? s : 'mdi:folder'
}
