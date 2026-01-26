import { expect, test } from '@playwright/test'

// this is an example Playwright e2e test
test('should navigate to media collection', async ({ page }) => {
  await page.goto('/admin')

  // login
  await page.fill('#field-email', 'dev@payloadcms.com')
  await page.fill('#field-password', 'test')
  await page.click('.form-submit button')

  // should show dashboard
  await expect(page).toHaveTitle(/Dashboard/)

  // Navigate to media
  // Navigate to media via URL for reliability
  await page.goto('/admin/collections/media')
  await expect(page).toHaveURL(/\/collections\/media/)

  // Check for gallery toggle button (plugin specific)
  // We use the custom class added in MediaListView.tsx. There are two buttons (List/Gallery).
  const toggleButtons = page.locator('button.folder-view-toggle-button')
  await expect(toggleButtons.first()).toBeVisible()
  await expect(toggleButtons).toHaveCount(3)
})
