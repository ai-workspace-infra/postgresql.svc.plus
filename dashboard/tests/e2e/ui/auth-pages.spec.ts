import { Page, expect, test } from '@playwright/test'

async function expectAuthLayoutWithinViewport(page: Page) {
  const viewport = page.viewportSize()
  if (!viewport) {
    throw new Error('Viewport size is not available')
  }

  const authLayout = page.getByTestId('auth-layout')
  await expect(authLayout).toBeVisible()

  const boundingBox = await authLayout.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
    }
  })

  const tolerance = 1
  expect.soft(boundingBox.top).toBeGreaterThanOrEqual(-tolerance)
  expect.soft(boundingBox.left).toBeGreaterThanOrEqual(-tolerance)
  expect.soft(boundingBox.right).toBeLessThanOrEqual(viewport.width + tolerance)
  expect.soft(boundingBox.bottom).toBeLessThanOrEqual(viewport.height + tolerance)

  await expect(page.locator('nav')).toHaveCount(0)
}

test.describe('Auth pages', () => {
  test('login form visible on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await expectAuthLayoutWithinViewport(page)
  })

  test('login form visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await expectAuthLayoutWithinViewport(page)
  })

  test('register form visible on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await expectAuthLayoutWithinViewport(page)
  })

  test('register form visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await expectAuthLayoutWithinViewport(page)
  })
})
