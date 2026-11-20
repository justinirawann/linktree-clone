import { test, expect } from '@playwright/test'
test('reorder yang gagal kembali ke urutan tersimpan dan dapat dicoba ulang', async ({ page }) => {
  await page.addInitScript(() => {
    const write = Storage.prototype.setItem
    let fail = true
    Storage.prototype.setItem = function (key, value) {
      if (fail && key === 'core-consign:local-studio:v1') {
        fail = false
        throw new DOMException('Storage full', 'QuotaExceededError')
      }
      return write.call(this, key, value)
    }
  })
  await page.goto('/studio/dashboard')
  await page.getByRole('button', { name: 'Turunkan Chat WhatsApp' }).click()
  await expect(page.getByRole('alert')).toContainText('Penyimpanan browser penuh')
  await expect(page.locator('.editor-links li').first()).toContainText('Chat WhatsApp')
  await page.getByRole('button', { name: 'Coba lagi' }).click()
  await expect(page.locator('.editor-links li').nth(1)).toContainText('Chat WhatsApp')
  await page.reload()
  await expect(page.locator('.editor-links li').nth(1)).toContainText('Chat WhatsApp')
})
test('logo divalidasi, dioptimalkan, disimpan, dan dapat dihapus', async ({ page }) => {
  await page.goto('/studio/dashboard')
  await page.getByRole('button', { name: 'Profil', exact: true }).click()
  const input = page.locator('input[type=file]')
  await input.setInputFiles({
    name: 'invalid.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('file'),
  })
  await expect(page.getByRole('alert')).toContainText('Pilih JPEG, PNG, atau WebP')
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 20
    canvas.height = 20
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#e24040'
    ctx.fillRect(4, 4, 12, 12)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await input.setInputFiles({
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(encoded, 'base64'),
  })
  await expect(page.getByRole('img', { name: 'Logo Core Consign' })).toHaveAttribute(
    'src',
    /^data:image\/webp/,
  )
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click()
  await expect(page.getByText('Perubahan tersimpan.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('img', { name: 'Logo Core Consign' })).toBeVisible()
  await page.getByRole('button', { name: 'Profil', exact: true }).click()
  await page.getByRole('button', { name: 'Hapus gambar' }).click()
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click()
  await expect(page.getByText('Perubahan tersimpan.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('img', { name: 'Logo Core Consign' })).toHaveCount(0)
})
