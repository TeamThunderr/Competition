// File Name: vite.config.js
// Purpose: Configuration for Vite bundler
// Written for beginner developers

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
})
