import { expect, test } from '@playwright/test'

test.describe('Marketing homepage experience', () => {
  test('renders localized markdown content and switches language dynamically', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1, name: '云原生套件' })).toBeVisible()
    await expect(page.getByText('构建一体化的云原生工具集', { exact: false })).toBeVisible()

    await expect(page.getByRole('heading', { level: 2, name: '产品专题' })).toBeVisible()
    await expect(page.getByRole('link', { name: '产品体验' }).first()).toHaveAttribute(
      'href',
      /\/demo\/?\?product=xcloudflow/
    )
    await expect(page.getByRole('link', { name: '下载链接' })).toHaveAttribute('href', /\/download\/?\?product=xcloudflow/)

    await expect(page.getByRole('heading', { level: 2, name: '获取支持' })).toBeVisible()

    const languageToggle = page.getByRole('combobox')
    await languageToggle.selectOption('en')

    await expect(page.getByRole('heading', { level: 1, name: 'Cloud-Native Suite' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Product Spotlights' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Try the product' }).first()).toHaveAttribute(
      'href',
      /\/demo\/?\?product=xcloudflow/
    )
    await expect(page.getByRole('heading', { level: 2, name: 'Get Support' })).toBeVisible()
    await expect(
      page.getByText('Join the enterprise WeChat group via QR code', { exact: false })
    ).toBeVisible()
  })
})
