import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'virtual:uno.css'

import App from './App.vue'
import router, { CHUNK_RELOAD_KEY } from './router'
import { useUserStore } from './stores/user'
import { registerMdiSubset } from '@/iconify/registerMdiSubset'

// 全局样式
import './assets/styles/global.scss'

registerMdiSubset()

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
const userStore = useUserStore()
userStore.initUser()

app.use(router)

async function bootstrap() {
  try {
    app.mount('#app')
  } catch (e) {
    console.error('[Chen404] 应用挂载失败', e)
    const el = document.getElementById('app')
    if (el) {
      el.innerHTML =
        '<p style="padding:2rem;font-family:sans-serif">页面加载失败，请尝试强制刷新 (Ctrl+Shift+R) 或稍后再试。</p>'
    }
    return
  }
  sessionStorage.removeItem(CHUNK_RELOAD_KEY)

  // 不在 mount 前 await：避免 /auth/info 慢/超时导致长时间白屏；路由守卫仍会校验需登录页
  try {
    await userStore.syncAuthState()
  } catch (e) {
    console.warn('[Chen404] 启动同步登录态失败（已用本地缓存继续）', e)
  }
}

void bootstrap()
