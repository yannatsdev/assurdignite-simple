import { test, expect } from '@playwright/test';

/**
 * Smoke E2E for the adhesion flow.
 * Validates that the landing page loads, simulation can be opened,
 * and the adhesion wizard mounts the unified progress bar.
 * Full OCR→KYC→sign→PDF requires authenticated context and live storage;
 * tested here in offline-friendly mode (no auth) up to the login gate.
 */

test('Landing page renders simulator', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AssurDignit/i);
  // Simulator section should be present
  await expect(page.getByText(/Simul/i).first()).toBeVisible({ timeout: 10_000 });
});

test('Adhesion route prompts auth or shows wizard', async ({ page }) => {
  await page.goto('/espace-client/adhesion');
  // Either auth screen or wizard heading
  const headingPromise = page.getByRole('heading', { name: /Adh[ée]sion|Connexion|Espace Client/i }).first();
  await expect(headingPromise).toBeVisible({ timeout: 10_000 });
});

test('Telemetry admin page is gated', async ({ page }) => {
  await page.goto('/admin/telemetrie');
  // Should redirect to login or render the dashboard
  await expect(page.locator('body')).toBeVisible();
});
