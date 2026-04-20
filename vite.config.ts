import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import ElementPlus from 'unplugin-element-plus/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    ElementPlus({}),
    Components({
      dts: 'src/components.d.ts',
      resolvers: [
        ElementPlusResolver({
          importStyle: 'css',
        }),
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * 路由拆太碎时首页会并发拉很多 /assets/*.js；弱网下易出现 ERR_CONNECTION_RESET → 动态 import 失败白屏。
         * 合并布局壳、ArticleCard 等多页复用模块为单 chunk，减少并发请求数。
         * 注意：不要对 Home.vue 单独 manualChunks，易把 Vue 运行时卷进「首页包」导致文章页误拉 1MB+。
         */
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('element-plus')) {
              return 'vendor-element-plus'
            }
            if (
              /[\\/]node_modules[\\/]vue[\\/]/.test(id) ||
              id.includes('vue-router') ||
              id.includes('pinia') ||
              id.includes('@vue/')
            ) {
              return 'vendor-vue'
            }
            return
          }

          const isLayoutShell =
            /[\\/]src[\\/]layouts[\\/]/.test(id) ||
            /[\\/]src[\\/]components[\\/]Header[\\/]/.test(id) ||
            /[\\/]src[\\/]components[\\/]Footer[\\/]/.test(id) ||
            /[\\/]src[\\/]components[\\/]Live2D[\\/]/.test(id) ||
            /[\\/]src[\\/]components[\\/]SakuraOverlay[\\/]/.test(id) ||
            /[\\/]src[\\/]composables[\\/]useLayoutMobile/.test(id)

          if (isLayoutShell) {
            return 'chunk-layout-shell'
          }

          if (/[\\/]src[\\/]components[\\/]ArticleCard[\\/]/.test(id)) {
            return 'chunk-article-card'
          }
        },
      },
    },
  },
})
