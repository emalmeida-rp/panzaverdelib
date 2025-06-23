import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:6003'
    },
    // 🚀 OPTIMIZACIONES DE PERFORMANCE
    hmr: {
      overlay: false, // Desactivar overlay de errores
    },
    host: true,
    port: 5173,
    strictPort: false,
    // Optimizar el watching
    watch: {
      usePolling: false,
      interval: 1000,
    }
  },
  // 🎯 OPTIMIZACIONES DE BUILD
  build: {
    sourcemap: false, // Desactivar sourcemaps en dev
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          bootstrap: ['bootstrap'],
        }
      }
    }
  },
  // 🔧 OPTIMIZACIONES DE DEPENDENCIES
  optimizeDeps: {
    include: ['react', 'react-dom', 'bootstrap'],
    exclude: ['@vite/client', '@vite/env']
  }
});
