import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    proxy: {
      '/ttyd': {
        target: 'http://localhost:7681',
        ws: true
      }
    }
  }
})
