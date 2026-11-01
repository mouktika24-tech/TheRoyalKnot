import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/\/node_modules\/(react|react-dom)(\/|$)/.test(id)) {
            return 'react-core'
          }
          if (id.includes('/node_modules/framer-motion/')) {
            return 'framer-motion'
          }
          if (id.includes('/node_modules/lucide-react/')) {
            return 'lucide-icons'
          }
        },
      },
    },
  },
})
