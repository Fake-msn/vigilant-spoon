import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // 开发代理目标与客户端 API 前缀解耦：
      // 客户端始终用相对前缀 /api，由 Vite 代理转发到后端端口，
      // 避免 VITE_API_BASE 需同时充当“客户端前缀”和“后端 origin”造成冲突。
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8010',
        changeOrigin: true,
      },
      '/api/ws': {
        target: process.env.VITE_PROXY_TARGET_WS || process.env.VITE_PROXY_TARGET || 'ws://localhost:8010',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
