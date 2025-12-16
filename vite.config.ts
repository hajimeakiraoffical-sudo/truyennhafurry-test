
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: './' giúp đường dẫn tương đối hoạt động tốt trên shared hosting
  base: '/', 
  server: {
    allowedHosts: ['.onrender.com', 'localhost'],
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
