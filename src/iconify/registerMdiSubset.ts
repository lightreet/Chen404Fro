import { addIcon } from '@iconify/vue'
// @iconify/icons-mdi 为单图标 CJS 模块（替代整包 icons.json ~3MB）
import heartOutline from '@iconify/icons-mdi/heart-outline'
import folder from '@iconify/icons-mdi/folder'
import folderOpen from '@iconify/icons-mdi/folder-open'
import mdiVuejs from '@iconify/icons-mdi/vuejs'
import mdiServer from '@iconify/icons-mdi/server'
import mdiDatabase from '@iconify/icons-mdi/database'
import mdiCloud from '@iconify/icons-mdi/cloud'
import mdiCoffee from '@iconify/icons-mdi/coffee'
import mdiRobot from '@iconify/icons-mdi/robot'

function asIcon(data: unknown) {
  const d = data as { default?: typeof data }
  return (d && typeof d === 'object' && 'default' in d ? d.default : data) as Parameters<
    typeof addIcon
  >[1]
}

/**
 * 与 `REGISTERED_CATEGORY_MDICONS` / `resolveCategoryIcon` 保持一致；
 * 新增分类用神 icon 时：在此 addIcon 并写入 categoryIcon.ts 集合。
 */
export function registerMdiSubset() {
  addIcon('mdi:heart-outline', asIcon(heartOutline))
  addIcon('mdi:folder', asIcon(folder))
  addIcon('mdi:folder-open', asIcon(folderOpen))
  addIcon('mdi:vuejs', asIcon(mdiVuejs))
  addIcon('mdi:server', asIcon(mdiServer))
  addIcon('mdi:database', asIcon(mdiDatabase))
  addIcon('mdi:cloud', asIcon(mdiCloud))
  addIcon('mdi:coffee', asIcon(mdiCoffee))
  addIcon('mdi:robot', asIcon(mdiRobot))
}
