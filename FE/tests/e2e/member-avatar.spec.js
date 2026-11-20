import { test, expect } from '@playwright/test'
import { createServer } from 'vite'
import jsQR from 'jsqr'

const FIXTURE_URL = 'https://linkfy-ui.supabase.test'
const SITE_URL = 'http://127.0.0.1:5193'
let server

test.beforeAll(async () => {
  process.env.VITE_SUPABASE_URL = FIXTURE_URL
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ui_fixture'
  process.env.VITE_SITE_URL = SITE_URL
  server = await createServer({
    cacheDir: 'node_modules/.vite-member-e2e',
    server: { host: '127.0.0.1', port: 5193, strictPort: true },
  })
  await server.listen()
})

test.afterAll(async () => {
  await server?.close()
  delete process.env.VITE_SUPABASE_URL
  delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  delete process.env.VITE_SITE_URL
})

async function openMemberStudio(page, { legacy = false } = {}) {
  const user = {
    id: '10000000-0000-4000-8000-000000000001',
    email: 'maya@linkfy.test',
    aud: 'authenticated',
  }
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const access = [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }),
    'Zml4dHVyZQ',
  ].join('.')
  let savedPage = {
    slug: 'maya',
    display_name: 'Maya',
    bio: '',
    theme: 'light',
    published: true,
    revision: 1,
    avatar_path: null,
    links: [
      {
        id: '10000000-0000-4000-8000-000000000002',
        title: 'Portofolio',
        url: 'https://instagram.com/maya',
        icon_key: 'instagram',
        icon_color: '#ffffff',
        is_active: true,
      },
    ],
  }
  const files = new Map()
  await page.route(FIXTURE_URL + '/**', async (route) => {
    const request = route.request()
    const endpoint = new URL(request.url()).pathname
    const avatarPrefix = '/storage/v1/object/member-avatars/'
    if (endpoint.startsWith(avatarPrefix)) {
      const objectName = endpoint.slice(avatarPrefix.length)
      if (request.method() === 'POST') {
        const multipart = new Response(request.postDataBuffer(), {
          headers: { 'content-type': request.headers()['content-type'] },
        })
        const photo = [...(await multipart.formData()).values()].find(
          (value) => value instanceof Blob,
        )
        expect(photo.type).toBe('image/webp')
        files.set(objectName, Buffer.from(await photo.arrayBuffer()))
        await route.fulfill({ json: { Id: user.id, Key: 'member-avatars/' + objectName } })
      } else {
        await route.fulfill({ contentType: 'image/webp', body: files.get(objectName) })
      }
      return
    }
    if (endpoint.endsWith('/token')) {
      await route.fulfill({
        json: {
          access_token: access,
          refresh_token: 'fixture',
          token_type: 'bearer',
          expires_in: 3600,
          user,
        },
      })
    } else if (endpoint.endsWith('/is_site_admin')) {
      await route.fulfill({ json: false })
    } else if (endpoint.endsWith('/member_pages')) {
      await route.fulfill({ json: [savedPage] })
    } else if (endpoint.endsWith('/save_member_page')) {
      const {
        chosen_avatar_path,
        chosen_appearance,
        chosen_link_styles,
        chosen_theme,
        chosen_links,
      } = request.postDataJSON()
      if (legacy && chosen_appearance) {
        await route.fulfill({
          status: 404,
          json: { code: 'PGRST202', message: 'function not found' },
        })
        return
      }
      if (chosen_avatar_path) expect(files.has(chosen_avatar_path)).toBe(true)
      savedPage = {
        ...savedPage,
        display_name: request.postDataJSON().chosen_name,
        avatar_path: chosen_avatar_path,
        appearance: chosen_appearance,
        link_styles: chosen_link_styles,
        theme: chosen_theme,
        links: chosen_links,
        revision: savedPage.revision + 1,
      }
      await route.fulfill({ json: savedPage })
    } else if (endpoint.endsWith('/get_member_page')) {
      await route.fulfill({ json: savedPage })
    } else {
      throw new Error('Unexpected endpoint: ' + endpoint)
    }
  })

  await page.goto(SITE_URL + '/admin/login')
  await page.getByLabel('Email', { exact: true }).fill(user.email)
  await page.getByLabel('Kata sandi').fill('strong-test-password')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
}

test('ikon pratinjau mengambil metadata sesuai URL dan tetap berguna saat situs gagal', async ({
  page,
}) => {
  await openMemberStudio(page)
  let unavailable = false
  const url = 'https://instagram.com/maya'
  await page.route('https://api.microlink.io/**', async (route) => {
    expect(new URL(route.request().url()).searchParams.get('url')).toBe(url)
    if (unavailable) return route.fulfill({ status: 429, body: '' })
    return route.fulfill({
      json: {
        status: 'success',
        data: { title: 'Karya Maya', description: 'Koleksi foto terbaru.' },
      },
    })
  })
  const trigger = page.getByRole('button', { name: 'Pratinjau Portofolio' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Pratinjau tautan' })
  await expect(dialog.getByRole('heading', { name: 'Karya Maya' })).toBeVisible()
  await expect(dialog.getByText('Koleksi foto terbaru.')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  unavailable = true
  await page.getByRole('link', { name: 'Lihat halaman publik' }).click()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Portofolio' })).toHaveAttribute('href', url)
  await trigger.click()
  await expect(dialog.getByRole('status')).toHaveCount(0)
  await expect(dialog.getByRole('heading', { name: 'Portofolio' })).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'Buka tautan' })).toHaveAttribute('href', url)
})

test('foto profil tersimpan dan menjadi pusat QR PNG yang dapat dipindai', async ({ page }) => {
  await openMemberStudio(page)
  const field = page.getByLabel('Foto profil', { exact: true })
  await field.waitFor({ state: 'attached' })

  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 60
    const context = canvas.getContext('2d')
    context.fillStyle = '#d52c61'
    context.fillRect(0, 0, 60, 60)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await field.setInputFiles({
    name: 'profil.png',
    mimeType: 'image/png',
    buffer: Buffer.from(photo, 'base64'),
  })
  await expect(page.getByRole('img', { name: 'Foto profil Maya', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Simpan halaman' }).click()
  await expect(page.getByText('Perubahan tersimpan.', { exact: true })).toBeVisible()
  await page.reload()

  const qr = page.getByRole('img', { name: 'Kode QR dengan foto profil Maya' })
  await expect(qr).toBeVisible()
  const download = page.getByRole('link', { name: 'Unduh QR' })
  expect(await download.getAttribute('href')).toBe(await qr.getAttribute('src'))
  const pixels = await qr.evaluate(async (image) => {
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0)
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height)
    let bytes = ''
    for (const value of data) bytes += String.fromCharCode(value)
    return { bytes: btoa(bytes), width, height }
  })
  const imageData = new Uint8ClampedArray(Buffer.from(pixels.bytes, 'base64'))
  const center = (Math.floor(pixels.height / 2) * pixels.width + Math.floor(pixels.width / 2)) * 4
  expect(imageData[center]).toBeGreaterThan(170)
  expect(imageData[center + 1]).toBeLessThan(90)
  expect(jsQR(imageData, pixels.width, pixels.height)?.data).toBe(SITE_URL + '/u/maya')

  await page.getByRole('link', { name: 'Lihat halaman publik' }).click()
  await expect(page).toHaveURL(SITE_URL + '/u/maya')
  await expect(page.getByRole('img', { name: 'Foto profil Maya', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Bagikan' }).click()
  await expect(page.getByRole('img', { name: 'Kode QR dengan foto profil Maya' })).toBeVisible()
})

test('warna, bentuk dan efek dibagikan persis seperti pratinjau', async ({ page }) => {
  await openMemberStudio(page)
  const global = page.getByRole('region', { name: 'Tampilan halaman' })
  const preview = page.getByRole('region', { name: 'Pratinjau toko' })
  const card = preview.locator('.channel-card').first()
  const icon = card.locator('.channel-icon')
  const iconStyle = page.getByLabel('Tampilan ikon', { exact: true })
  const iconShape = page.getByLabel('Bentuk wadah ikon', { exact: true })
  await page.getByRole('button', { name: 'Tambah tautan' }).click()
  await page.getByLabel('Judul tautan 2').fill('Toko')
  await page.getByLabel('URL tujuan 2').fill('shopee.co.id/maya')
  const secondIcon = preview.locator('.channel-icon').nth(1)
  await expect(iconStyle).toHaveCount(1)
  await expect(iconStyle).toHaveValue('filled')
  await iconStyle.selectOption('bare')
  await expect(iconShape).toHaveCount(0)
  await expect(icon).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(icon).toHaveCSS('border-top-width', '0px')
  await expect(secondIcon).toHaveCSS('border-top-width', '0px')
  await iconStyle.selectOption('outline')
  await iconShape.selectOption('circle')
  await expect(icon).toHaveCSS('border-radius', '50%')
  await expect(icon).toHaveCSS('border-top-width', '1px')
  await expect(secondIcon).toHaveCSS('border-radius', '50%')
  await global.getByLabel('Warna latar', { exact: true }).fill('#02040a')
  const defaultFill = await global.getByLabel('Warna tombol', { exact: true }).inputValue()
  expect(defaultFill).not.toBe('#ffffff')
  await global.getByLabel('Warna tombol', { exact: true }).fill('#ffeedd')
  await global.getByLabel('Warna latar', { exact: true }).fill('#234152')
  await expect(global.getByLabel('Warna tombol', { exact: true })).toHaveValue('#ffeedd')
  await global.getByLabel('Bentuk tombol').selectOption('square')
  await global.getByLabel('Gaya tombol').selectOption('glass')
  await expect(card).toHaveCSS('border-radius', '0px')
  await expect(card).toHaveCSS('backdrop-filter', /blur\(.+\).*saturate\(/)
  await page.getByText('Tampilan khusus tautan 1', { exact: true }).click()
  const custom = page.locator('details[open]')
  await custom.getByLabel('Bentuk tombol').selectOption('slight')
  await expect(card).toHaveCSS('border-radius', '8px')
  await custom.getByLabel('Bentuk tombol').selectOption('')
  await expect(card).toHaveCSS('border-radius', '0px')
  await custom.getByLabel('Bentuk tombol').selectOption('round')
  await custom.getByLabel('Gaya tombol').selectOption('soft')
  await custom.getByLabel('Warna tombol', { exact: true }).fill('#ffdddd')
  await expect(card).toHaveCSS('border-radius', '28px')
  await expect(card).toHaveCSS('background-color', 'rgb(255, 221, 221)')
  await expect(card).toHaveCSS('box-shadow', /inset.*inset/)
  await page.getByRole('button', { name: 'Simpan halaman' }).click()
  await expect(page.getByText('Perubahan tersimpan.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(card).toHaveCSS('border-radius', '28px')
  await page.getByRole('link', { name: 'Lihat halaman publik' }).click()
  const published = page.getByRole('link', { name: 'Portofolio' })
  const profileColumn = page.getByRole('region', { name: 'Halaman toko' })
  await expect(profileColumn).toHaveCSS('border-radius', '26px 26px 0px 0px')
  const columnBounds = await profileColumn.boundingBox()
  expect(columnBounds.y).toBe(36)
  expect(columnBounds.y + columnBounds.height).toBeGreaterThanOrEqual(page.viewportSize().height)
  expect(columnBounds.width).toBeLessThan(page.viewportSize().width)
  await expect(page.getByRole('link', { name: 'Toko', exact: true })).toHaveCSS(
    'backdrop-filter',
    /blur\(/,
  )
  await expect(published.locator('.channel-icon')).toHaveCSS('border-radius', '50%')
  await expect(published.locator('.channel-icon')).toHaveCSS('border-top-width', '1px')
  await expect(
    page.getByRole('link', { name: 'Toko', exact: true }).locator('.channel-icon'),
  ).toHaveCSS('border-radius', '50%')
  await expect(published).toHaveCSS('border-radius', '28px')
  await expect(published).toHaveCSS('background-color', 'rgb(255, 221, 221)')
  await expect(published).toHaveCSS('box-shadow', /inset.*inset/)
})

test('kaca mengikuti tema publik di layar ponsel dan pilihan kurangi transparansi', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 750 })
  for (const preset of ['light', 'dark', 'gradient']) {
    const profile = {
      slug: preset,
      display_name: 'Ruang Studio',
      bio: 'Desain, foto, dan proyek kreatif.',
      theme: preset,
      appearance: { effect: 'glass', shape: 'round' },
      links: ['Instagram', 'Katalog', 'WhatsApp'].map((title, index) => ({
        id: String(index),
        title,
        url: 'https://ruangstudio.id/',
        is_active: true,
        icon_key: ['instagram', 'catalog', 'whatsapp'][index],
        icon_color: '#ffffff',
      })),
    }
    await page.route(FIXTURE_URL + '/rest/v1/rpc/get_member_page', (route) =>
      route.fulfill({ json: profile }),
    )
    await page.goto(SITE_URL + '/u/' + preset)
    const card = page.getByRole('link', { name: 'Instagram' })
    await expect(card).toBeVisible()
    await expect(card).toHaveCSS('backdrop-filter', /blur\(/)
    await expect(card).toHaveCSS('border-radius', '28px')
    await page.screenshot({ path: testInfo.outputPath('glass-' + preset + '.png') })
    await page.unroute(FIXTURE_URL + '/rest/v1/rpc/get_member_page')
  }
  const media = await page.context().newCDPSession(page)
  await media.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  })
  await expect(page.getByRole('link', { name: 'Instagram' })).toHaveCSS('backdrop-filter', 'none')
})

test('studio tetap bisa menyimpan profil sebelum migrasi tema dijalankan', async ({ page }) => {
  await openMemberStudio(page, { legacy: true })
  await page.getByLabel('Nama profil').fill('Maya Lama')
  await page.getByLabel('Tema', { exact: true }).selectOption('dark')
  await page.getByRole('button', { name: 'Simpan halaman' }).click()
  await expect(page.getByText('Perubahan tersimpan.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Nama profil')).toHaveValue('Maya Lama')
  await page.getByLabel('Warna latar', { exact: true }).fill('#334488')
  await page.getByRole('button', { name: 'Simpan halaman' }).click()
  await expect(page.getByRole('alert')).toContainText('Jalankan migrasi 019')
  await expect(page.getByLabel('Warna latar', { exact: true })).toHaveValue('#334488')
})

test('pintasan editor bisa dipakai di HP tanpa kehilangan draft', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await openMemberStudio(page)
  await expect(page.getByLabel('Nama profil')).toHaveValue('Maya')
  await page.screenshot({ path: testInfo.outputPath('studio-desktop.png') })
  await page.setViewportSize({ width: 360, height: 800 })
  await page.screenshot({ path: testInfo.outputPath('studio-mobile.png') })
  await page.getByLabel('Bio', { exact: true }).fill('Katalog Maya')
  const navigation = page.getByRole('navigation', { name: 'Bagian editor' })
  await navigation.getByRole('link', { name: 'Pratinjau' }).click()
  await expect(
    page.getByRole('region', { name: 'Pratinjau toko' }).getByText('Katalog Maya'),
  ).toBeInViewport()
  await navigation.getByRole('link', { name: 'Tampilan' }).click()
  await expect(page.getByRole('heading', { name: 'Tampilan halaman' })).toBeInViewport()
  await page.getByLabel('Warna latar', { exact: true }).fill('#eee0ff')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
  await navigation.getByRole('link', { name: 'Profil' }).click()
  await expect(page.getByLabel('Bio', { exact: true })).toHaveValue('Katalog Maya')
})

test('sandi pendaftaran bisa ditampilkan dan disembunyikan dengan keyboard', async ({ page }) => {
  await page.goto(SITE_URL + '/register')
  const password = page.getByLabel('Kata sandi', { exact: true })
  await password.fill('contoh-password')
  await password.press('Tab')
  await page.keyboard.press('Enter')
  await expect(password).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Sembunyikan sandi' }).press('Space')
  await expect(password).toHaveAttribute('type', 'password')
  await expect(password).toHaveValue('contoh-password')
})

for (const registration of [
  { name: 'akun lama dengan respons tersamar', identities: [], error: null },
  { name: 'akun lama dengan kode konflik', error: 'user_already_exists' },
  { name: 'akun baru', identities: [{ provider: 'email' }], error: null },
]) {
  test('pendaftaran menampilkan hasil yang benar untuk ' + registration.name, async ({ page }) => {
    await page.route(FIXTURE_URL + '/auth/v1/signup**', (route) => {
      if (registration.error) {
        return route.fulfill({
          status: 422,
          json: { error_code: registration.error },
        })
      }
      return route.fulfill({
        json: { id: crypto.randomUUID(), identities: registration.identities },
      })
    })
    await page.goto(SITE_URL + '/register')
    await page.getByLabel('Email', { exact: true }).fill('maya@linkfy.test')
    await page.getByLabel('Kata sandi', { exact: true }).fill('contoh-password')
    await page.getByRole('button', { name: 'Daftar', exact: true }).click()
    if (registration.identities?.length) {
      await expect(page.getByRole('status')).toContainText('Cek email untuk mengonfirmasi akunmu')
      return
    }
    await expect(page.getByRole('alert')).toContainText('Email ini sudah terdaftar')
    await expect(
      page.getByText('Cek email untuk mengonfirmasi akunmu', { exact: false }),
    ).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Sudah punya akun? Masuk' })).toBeVisible()
  })
}
