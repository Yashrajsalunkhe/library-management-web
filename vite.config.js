import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for Electron
  server: {
    port: 5173,
    host: 'localhost',
    // Enable HMR for faster updates
    hmr: true,
    // Open browser automatically
    open: false
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Optimize build performance
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios', 'date-fns']
        }
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'date-fns', 'lucide-react']
  },
  // Improve resolution performance
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
