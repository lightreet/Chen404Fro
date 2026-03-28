import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import 'virtual:uno.css'

import App from './App.vue'
import router, { CHUNK_RELOAD_KEY } from './router'
import { useUserStore } from './stores/user'

// 全局样式
import './assets/styles/global.scss'

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const userStore = useUserStore(pinia)
userStore.initUser()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

async function bootstrap() {
  // 启动时先与后端同步一次登录态，避免“本地显示已登录但服务端判匿名”
  await userStore.syncAuthState()
  app.mount('#app')
  sessionStorage.removeItem(CHUNK_RELOAD_KEY)
}

bootstrap()
