import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [react(),mkcert()],
  server: {
    host: true,
    port: 5173,
    https: true
    
    /*proxy: {
      '/api': {
        target: 'http://192.168.122.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false
      }
    }*/

  }
})