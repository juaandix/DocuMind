import base from '../../playwright.config'
import { defineConfig } from '@playwright/test'

// Screenshot harness for design review: `npm run shots` (not part of CI).
export default defineConfig({ ...base, testDir: '.', reporter: 'line', webServer: { ...base.webServer, command: 'npx vite --port 5199 --strictPort', cwd: '../..' } as never })
