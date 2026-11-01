import { defineConfig } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const raw = path.join(dir, '..', 'raw')

export default defineConfig({
  testDir: dir,
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.CHAPTERA_VIDEO_BASE ?? 'http://127.0.0.1:4173',
    trace: 'off',
    screenshot: 'off',
  },
  outputDir: path.join(raw, 'test-results'),
})
