import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import 'virtual:uno.css'

import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'

// 全局样式
import './assets/styles/global.scss'

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

useUserStore(pinia).initUser()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.mount('#app')
