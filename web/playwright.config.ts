import { defineConfig, devices } from '@playwright/test';

// Testes ponta a ponta do fluxo principal (US-01, US-02, US-04) contra o banco de testes.
// Pré-requisitos: Postgres de teste (scripts/db-local.sh), emulador ou `supabase start`, e `next dev` na porta 3000.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: 'e2e-relatorio', open: 'never' }]],
  globalSetup: './e2e/preparar-banco.ts',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    viewport: { width: 1440, height: 900 },
    locale: 'pt-BR',
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
});
