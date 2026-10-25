import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/RankLab/', // <-- Add this property here
  server: { port: 3000, host: '0.0.0.0' },
  preview: { port: 3000, host: '0.0.0.0' },
})