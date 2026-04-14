import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,

    allowedHosts: true
    
    
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