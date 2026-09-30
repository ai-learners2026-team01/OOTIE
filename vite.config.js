import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('chart.js')) {
              return 'vendor-chartjs';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('vue') || id.includes('pinia')) {
              return 'vendor-vue';
            }
            return 'vendor-libs';
          }
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom'
  }
});
