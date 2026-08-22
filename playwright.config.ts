import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Points at a dedicated test Supabase project, kept separate from real data.
// See e2e/README.md for how this file is set up.
dotenv.config({ path: '.env.test' })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // A single worker for now — the test project is a fresh/free-tier
  // Supabase instance, and concurrent page loads against it were timing
  // out. Revisit once it's had more traffic and clearly isn't cold anymore.
  workers: 1,
  timeout: 90_000,
  // Web-first assertions (toBeVisible, toHaveURL, etc.) use this, separately
  // from actionTimeout/navigationTimeout below — the app's own data fetches
  // (e.g. ProtectedRoute's business-profile check) need real room too.
  // The test project is brand new and shows intermittent request latency
  // spikes typical of a fresh free-tier project still "warming up" — the
  // database itself responds instantly when checked directly, so this is
  // about giving individual slow requests room, not working around a bug.
  expect: {
    timeout: 30_000,
  },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? '',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? '',
    },
    timeout: 120_000,
  },
})
