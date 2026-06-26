import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  esbuild: {
    drop: ['console', 'debugger'],
  },
  resolve: {
    alias: {
      'html2canvas': path.resolve(__dirname, './src/mock-html2canvas.js'),
    }
  }
})
