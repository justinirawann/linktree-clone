import { test, expect } from '@playwright/test'
import { PUBLIC_PAGE_PATH } from '../../src/shared/lib/routes'

test('logo dan warna tautan tersimpan serta tampil pada halaman publik', async ({ page }) => {
  await page.goto('/studio/dashboard')
  await page.getByRole('button', { name: 'Edit Chat WhatsApp', exact: true }).click()
  const picker = page.getByLabel('Ikon', { exact: true })
  for (const label of ['WA', 'Shopee', 'Toco', 'Tokopedia', 'Line']) {
    await picker.selectOption({ label })
    await expect(page.locator('.color-input [aria-hidden]')).toHaveCSS('mask-image', /\.svg/)
  }
  await picker.selectOption({ label: 'Instagram' })
  await expect(page.locator('.color-input [aria-hidden]')).toHaveCSS(
    'mask-image',
    /instagram_white\.svg/,
  )
  await picker.selectOption({ label: 'TikTok' })
  await page.getByLabel('Warna ikon').fill('#34cc88')
  await page.getByLabel('URL tujuan').fill('https://www.tiktok.com/@coreconsign')
  await page.getByLabel('Tautan aktif').check()
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click()
  await expect(page.getByText('Perubahan tersimpan.')).toBeVisible()
  await page.goto('/studio/settings')
  await page.getByRole('button', { name: 'Publikasikan halaman' }).click()
  await page.getByRole('button', { name: 'Ya, publikasikan' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goto(PUBLIC_PAGE_PATH)
  const logo = page.locator('.channel-tiktok [aria-hidden]')
  await expect(logo).toHaveCSS('background-color', 'rgb(52, 204, 136)')
  await expect(logo).toHaveCSS('mask-image', /tiktok_white\.svg/)
})
