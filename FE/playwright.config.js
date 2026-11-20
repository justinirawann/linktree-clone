import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'
const installedChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:5189',
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
        (existsSync(installedChrome) ? installedChrome : undefined),
    },
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5189 --strictPort --mode e2e',
    url: 'http://127.0.0.1:5189',
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_PUBLISHABLE_KEY: '',
      VITE_SITE_URL: 'https://core-consign.test',
    },
  },
})
