// NoraIvoire — configuration Playwright (régression visuelle et accessibilité web).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés. Outillage de dev, non distribué.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.NORA_VISUAL_PORT ?? 4173);

export default defineConfig({
  testDir: 'tests/visual',
  testMatch: /.*\.spec\.mjs$/,
  outputDir: 'test-results',
  // Une capture de référence par plateforme : darwin (local) ou linux (CI, conteneur Playwright officiel).
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.001,
      stylePath: 'tests/visual/stabilize.css',
    },
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 } }],
  webServer: {
    command: 'node tests/visual/serve.mjs',
    env: { PORT: String(PORT) },
    url: `http://127.0.0.1:${PORT}/templates/html/index.html`,
    reuseExistingServer: !process.env.CI,
  },
});
