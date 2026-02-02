import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import pkg from './package.json'

// Get current git commit hash
let commitHash = ''
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch (e) {
  // console.warn('Could not get git commit hash', e)
  commitHash = 'unknown'
}

const buildDate = new Date().toISOString().split('T')[0]

// https://vite.dev/config/
export default defineConfig({
  base: './', // Use relative path for Electron and generic static hosting
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
})
