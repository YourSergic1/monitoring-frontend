import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8082,
    open: true,
    // 👇 Настройка прокси для обхода CORS
    proxy: {
      '/api': {
        target: 'http://localhost:8081', // Адрес твоего Spring Boot
        changeOrigin: true,              // Меняет Origin заголовка на target
        secure: false,                   // Если бэкенд http, а не https
      },
    },
  },
})