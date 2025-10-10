import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://v.itejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})

