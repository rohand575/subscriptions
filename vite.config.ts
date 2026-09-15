import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom domain (subscriptions.rohan-dhanawade.de) serves from root, so base is '/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendors so the initial load stays light on mobile.
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          charts: ['recharts'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
