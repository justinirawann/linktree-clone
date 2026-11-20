import { test, expect } from '@playwright/test'
import { PUBLIC_PAGE_PATH } from '../../src/shared/lib/routes'
test('owner lokal mengedit, menerbitkan, berbagi QR, lalu menarik publikasi', async ({ page }) => {
  await page.goto('/admin/dashboard')
  await expect(page).toHaveURL(/admin\/login$/)
  await page.getByRole('link', { name: 'Buka studio lokal' }).click()
  await page.getByRole('button', { name: 'Edit Chat WhatsApp', exact: true }).click()
  await page.getByLabel('URL tujuan').fill('javascript:bad')
  await page.getByLabel('Tautan aktif').check()
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click()
  await expect(page.getByText('Masukkan URL HTTP atau HTTPS lengkap yang valid.')).toBeVisible()
  await page.getByText('Buat tautan WhatsApp', { exact: true }).click()
  await page.getByLabel('Nomor WhatsApp').fill('+62 812345678')
  await page.getByLabel('Pesan awal (opsional)').fill('Titip jual')
  await page.getByRole('button', { name: 'Gunakan URL WhatsApp' }).click()
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click()
  await expect(page.getByText('Perubahan tersimpan.')).toBeVisible()
  await page.getByRole('button', { name: 'Turunkan Chat WhatsApp' }).click()
  await expect(page.locator('.editor-links li').nth(1)).toContainText('Chat WhatsApp')
  await page.getByRole('button', { name: 'Profil', exact: true }).click()
  await page.getByLabel('Nama toko').fill('Core Hardware')
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click()
  await expect(page.getByText('Perubahan tersimpan.')).toBeVisible()
  await page.getByRole('link', { name: 'Tampilan' }).click()
  await page.getByRole('button', { name: 'Light', exact: true }).click()
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click()
  await expect(page.getByText('Perubahan tersimpan.')).toBeVisible()
  await page.getByRole('link', { name: 'Pengaturan' }).click()
  await page.getByRole('button', { name: 'Publikasikan halaman' }).click()
  await page.getByRole('button', { name: 'Ya, publikasikan' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('link', { name: 'Lihat halaman' }).click()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Core Hardware', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Chat WhatsApp/ })).toHaveAttribute(
    'href',
    'https://wa.me/62812345678?text=Titip%20jual',
  )
  await expect(page.getByText('Belanja di Shopee')).toHaveCount(0)
  await expect(page.locator('.directory')).toHaveCSS('background-color', 'rgb(243, 241, 239)')
  await page.getByRole('button', { name: 'Bagikan' }).click()
  await expect(page.getByLabel('Alamat publik')).toHaveValue(
    'https://core-consign.test/core-consign',
  )
  const download = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Unduh QR' }).click()
  expect((await download).suggestedFilename()).toBe('core-consign-qr.png')
  const colors = page.getByRole('group', { name: 'Warna kode QR' })
  await colors.getByRole('button', { name: 'Putih' }).press('Space')
  await expect(colors.getByRole('button', { name: 'Putih' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByLabel('Latar PNG').selectOption({ label: 'Transparan' })
  const whiteQr = page.getByRole('img', { name: 'Kode QR Core Hardware' })
  expect(
    await whiteQr.evaluate(async (image) => {
      await image.decode()
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0)
      return context.getImageData(0, 0, 1, 1).data[3]
    }),
  ).toBe(0)
  const whiteDownload = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Unduh QR' }).click()
  expect((await whiteDownload).suggestedFilename()).toBe('core-consign-qr-putih-transparan.png')
  await page.keyboard.press('Escape')
  await page.goto('/studio/settings')
  await page.getByRole('button', { name: 'Tarik publikasi', exact: true }).click()
  await page.getByRole('button', { name: 'Ya, tarik publikasi' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goto(PUBLIC_PAGE_PATH)
  await expect(
    page.getByRole('heading', { name: 'Halaman sementara tidak tersedia' }),
  ).toBeVisible()
})
test('draft bertahan saat konflik dua tab dan navigasi meminta konfirmasi', async ({
  page,
  context,
}) => {
  await page.goto('/studio/dashboard')
  await page.getByRole('button', { name: 'Profil', exact: true }).click()
  await page.getByLabel('Nama toko').fill('Draft tab satu')
  const other = await context.newPage()
  await other.goto('/studio/dashboard')
  await other.getByRole('button', { name: 'Profil', exact: true }).click()
  await other.getByLabel('Nama toko').fill('Versi tab dua')
  await other.getByRole('button', { name: 'Simpan Perubahan' }).click()
  await expect(other.getByText('Perubahan tersimpan.')).toBeVisible()
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click()
  await expect(page.getByRole('alert')).toContainText('Versi tersimpan sudah berubah')
  await expect(page.getByLabel('Nama toko')).toHaveValue('Draft tab satu')
  await page.getByRole('link', { name: 'Tampilan' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Tetap di sini' }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Muat versi terbaru' }).click()
  await expect(page.getByLabel('Nama toko')).toHaveValue('Versi tab dua')
})
test('tambah, duplikasi, hapus dan pembatalan', async ({ page }) => {
  await page.goto('/studio/dashboard')
  await page.getByRole('button', { name: 'Tambah tautan' }).click()
  await page.getByLabel('Judul tautan').fill('Katalog hardware')
  await page.getByLabel('URL tujuan').fill('https://coreconsign.id/katalog')
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click()
  await page.getByRole('button', { name: 'Duplikat Katalog hardware' }).click()
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click()
  await page.getByRole('button', { name: 'Hapus Katalog hardware (salinan)' }).click()
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  await page.getByRole('button', { name: 'Hapus Katalog hardware (salinan)' }).click()
  await page.getByRole('button', { name: 'Hapus tautan', exact: true }).click()
  await expect(page.locator('.editor-links li')).toHaveCount(7)
})
for (const width of [360, 390, 768, 1440]) {
  test('halaman dan editor pada ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(
      page.getByRole('heading', { level: 1, name: /Satu link.*Semua tujuan/ }),
    ).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.getByRole('contentinfo').getByText(/core consign/i)).toHaveCount(0)
    await expect(
      page.getByRole('navigation', { name: 'Akun Linkfy' }).getByRole('link', { name: 'Daftar' }),
    ).toHaveAttribute('href', '/register')
    await page.goto(PUBLIC_PAGE_PATH)
    await expect(page).toHaveURL(PUBLIC_PAGE_PATH)
    await expect(page.getByRole('heading', { name: 'Core Consign', exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.getByRole('link', { name: /Chat WhatsApp/ })).toHaveCount(0)
    await page.getByRole('link', { name: 'Buka studio' }).click()
    await expect(page.getByRole('heading', { name: 'Daftar tautan' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (width < 761) {
      await page.getByRole('button', { name: 'Pratinjau', exact: true }).click()
      await expect(page.getByRole('region', { name: 'Pratinjau toko' })).toBeVisible()
    }
  })
}

test('landing Linkfy punya demo tema dan jalur ke Studio', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Coba demo' }).click()
  await expect(page).toHaveURL(/#contoh$/)
  const lime = page.getByRole('radio', { name: 'Lime' })
  await lime.focus()
  await page.keyboard.press('Space')
  await expect(lime).toBeChecked()
  await expect(page.locator('.ly-phone')).toHaveCSS('background-color', 'rgb(232, 249, 152)')
  await page.getByRole('link', { name: 'Buka Studio', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Daftar tautan' })).toBeVisible()
})

test('ilustrasi mengikuti pointer dan menghormati preferensi gerak', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const sculpture = page.locator('.sculpture')
  const assembly = sculpture.locator('.sculpture-assembly')
  await sculpture.hover({ position: { x: 10, y: 10 } })
  await expect(assembly).not.toHaveCSS('transform', 'none')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await sculpture.hover({ position: { x: 10, y: 10 } })
  await expect(assembly).toHaveCSS('transform', 'none')
  await expect(sculpture.locator('img')).toHaveCSS('animation-name', 'none')
})
