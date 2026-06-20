import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createSyncPlugin } from './scripts/syncPlugin.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), createSyncPlugin()],
  base: './'
})

