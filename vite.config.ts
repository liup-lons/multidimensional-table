import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 将 /api 请求代理到后端服务
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        // 可选：如果后端API没有/api前缀，需要重写路径
        // rewrite: (path) => path.replace(/^/api/, '')
      }
    }
  }
})