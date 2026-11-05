import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for deployment. Set VITE_BASE_PATH at build time for subpath
  // hosts (e.g. "/kanabot/" for a GitHub Pages project site). Defaults to "/"
  // for local development.
  base: process.env.VITE_BASE_PATH || '/',
})
