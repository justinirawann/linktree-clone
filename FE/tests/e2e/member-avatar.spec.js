import { test, expect } from '@playwright/test'
import { createServer } from 'vite'
import jsQR from 'jsqr'

const FIXTURE_URL = 'https://linkfy-ui.supabase.test'
const SITE_URL = 'http://127.0.0.1:5193'
let server

test.beforeAll(async () => {
  process.env.VITE_SUPABASE_URL = FIXTURE_URL
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ui_fixture'
  process.env.VITE_SITE_URL = 'https://canonical.linkfy.test'
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

async function openMemberStudio(
  page,
  { legacy = false, withoutPage = false, slugCheckMissing = false } = {},
) {
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
  if (withoutPage) savedPage = null
  const files = new Map()
  const activity = []
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
    } else if (endpoint.endsWith('/record_page_analytics')) {
      activity.push(request.postDataJSON())
      await route.fulfill({ json: null })
    } else if (endpoint.endsWith('/read_page_analytics')) {
      const { period_days } = request.postDataJSON()
      const visits = activity.filter((event) => !event.link_id)
      const clicks = activity.length - visits.length
      await route.fulfill({
        json: {
          days: Array.from({ length: period_days }, (_, index) => ({
            day: '2026-11-' + String(index + 1).padStart(2, '0'),
            views: index === period_days - 1 ? visits.length : 0,
            clicks: index === period_days - 1 ? clicks : 0,
            qrViews:
              index === period_days - 1
                ? visits.filter((event) => event.visit_source === 'qr').length
                : 0,
          })),
          links: clicks
            ? [{ id: savedPage.links[0].id, title: savedPage.links[0].title, clicks }]
            : [],
        },
      })
    } else if (endpoint.endsWith('/member_pages')) {
      await route.fulfill({ json: savedPage ? [savedPage] : [] })
    } else if (endpoint.endsWith('/member_slug_taken')) {
      if (slugCheckMissing) await route.fulfill({ status: 404, json: { code: 'PGRST202' } })
      else await route.fulfill({ json: request.postDataJSON().chosen_slug === 'maya' })
    } else if (endpoint.endsWith('/create_member_page')) {
      const { chosen_slug, chosen_name } = request.postDataJSON()
      if (chosen_slug === 'maya' || chosen_slug === 'maya-balap') {
        await route.fulfill({ status: 409, json: { code: '23505' } })
      } else {
        savedPage = {
          slug: chosen_slug,
          display_name: chosen_name,
          bio: '',
          theme: 'light',
          published: false,
          revision: 1,
          avatar_path: null,
          links: [],
        }
        await route.fulfill({ json: savedPage })
      }
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

test('layar memuat Linkfy mengikuti preferensi gerakan sampai profil siap', async ({
  page,
}, testInfo) => {
  let finish
  const pending = new Promise((resolve) => {
    finish = resolve
  })
  await page.route(FIXTURE_URL + '/rest/v1/rpc/get_member_page', async (route) => {
    await pending
    await route.fulfill({ json: { slug: 'maya', display_name: 'Maya', theme: 'light', links: [] } })
  })
  await page.route(FIXTURE_URL + '/rest/v1/rpc/record_page_analytics', (route) =>
    route.fulfill({ json: null }),
  )
  await page.setViewportSize({ width: 390, height: 750 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(SITE_URL + '/maya')
  const status = page.getByRole('status').filter({ hasText: 'Memuat halaman' })
  const chain = page.locator('.loading-sculpture img')
  try {
    await expect(status).toBeVisible()
    await expect(chain).toHaveCSS('animation-name', 'linkfy-chain-float')
    await chain.evaluate((img) => img.decode())
    await page.screenshot({ path: testInfo.outputPath('loading-linkfy.png') })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(chain).toHaveCSS('animation-name', 'none')
    await expect(chain).toBeVisible()
  } finally {
    finish()
  }
  await expect(page.getByRole('heading', { name: 'Maya' })).toBeVisible()
  await expect(status).toHaveCount(0)
})

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

test('QR dengan foto profil dapat dipindai pada kedua warna dan pilihan latar', async ({
  page,
}) => {
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
  const download = page.getByRole('link', { name: 'Unduh QR' })
  const colors = page.getByRole('group', { name: 'Warna kode QR' })
  const backdrop = page.getByLabel('Latar PNG')
  await expect(colors.getByRole('button', { name: 'Hitam' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(backdrop).toHaveValue('solid')
  for (const [label, mode, background, foreground, filename] of [
    ['Hitam', 'solid', 255, 0, 'linkfy-qr.png'],
    ['Hitam', 'transparent', 255, 0, 'linkfy-qr-transparan.png'],
    ['Putih', 'transparent', 0, 255, 'linkfy-qr-putih-transparan.png'],
    ['Putih', 'solid', 0, 255, 'linkfy-qr-putih.png'],
  ]) {
    await colors.getByRole('button', { name: label }).click()
    await backdrop.selectOption(mode)
    await expect(download).toHaveAttribute('download', filename)
    await expect(qr).toBeVisible()
    expect(await download.getAttribute('href')).toBe(await qr.getAttribute('src'))
    const pixels = await qr.evaluate(async (image, background) => {
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0)
      const corner = [...context.getImageData(0, 0, 1, 1).data]
      const center = [...context.getImageData(canvas.width >> 1, canvas.height >> 1, 1, 1).data]
      context.globalCompositeOperation = 'destination-over'
      context.fillStyle = background === 255 ? '#fff' : '#000'
      context.fillRect(0, 0, canvas.width, canvas.height)
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height)
      let bytes = ''
      for (const value of data) bytes += String.fromCharCode(value)
      return { bytes: btoa(bytes), width, height, corner, center }
    }, background)
    const imageData = new Uint8ClampedArray(Buffer.from(pixels.bytes, 'base64'))
    expect(pixels.corner).toEqual(
      mode === 'solid' ? [background, background, background, 255] : [0, 0, 0, 0],
    )
    expect(pixels.center[0]).toBeGreaterThan(170)
    expect(pixels.center[1]).toBeLessThan(90)
    expect(pixels.center[3]).toBe(255)
    const decoded = jsQR(imageData, pixels.width, pixels.height)
    expect(decoded?.data).toBe(SITE_URL + '/maya?ref=qr')
    const finder = decoded.location.topLeftFinderPattern
    const finderOffset = (Math.floor(finder.y) * pixels.width + Math.floor(finder.x)) * 4
    expect([...imageData.slice(finderOffset, finderOffset + 4)]).toEqual([
      foreground,
      foreground,
      foreground,
      255,
    ])
  }

  await page.getByRole('link', { name: 'Lihat halaman publik' }).click()
  await expect(page).toHaveURL(SITE_URL + '/maya')
  await expect(page.getByRole('img', { name: 'Foto profil Maya', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Bagikan' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Putih' }).click()
  await dialog.getByLabel('Latar PNG').selectOption('transparent')
  await expect(dialog.getByRole('img', { name: 'Kode QR dengan foto profil Maya' })).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'Unduh QR' })).toHaveAttribute(
    'download',
    'linkfy-qr-putih-transparan.png',
  )
})

test('dashboard menampilkan kunjungan QR dan klik, lalu mengganti rentang', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await openMemberStudio(page)
  const statistics = page.getByRole('link', { name: 'Statistik', exact: true })
  await statistics.click()
  await expect(page.getByText('Belum ada klik yang tercatat.')).toBeVisible()

  const recorded = page.waitForRequest(
    (request) =>
      request.url().endsWith('/record_page_analytics') && !request.postDataJSON().link_id,
  )
  await page.goto(SITE_URL + '/u/maya?ref=qr')
  await expect(page).toHaveURL(SITE_URL + '/maya?ref=qr')
  expect((await recorded).postDataJSON()).toMatchObject({ page_slug: 'maya', visit_source: 'qr' })
  const destination = page.getByRole('link', { name: 'Portofolio' })
  await destination.evaluate((link) =>
    link.addEventListener('click', (event) => event.preventDefault(), { once: true }),
  )
  const clicked = page.waitForResponse(
    (response) =>
      response.url().endsWith('/record_page_analytics') &&
      Boolean(response.request().postDataJSON().link_id),
  )
  await destination.click()
  await clicked

  await page.goto(SITE_URL + '/dashboard')
  await statistics.click()
  await expect(page.getByRole('heading', { name: 'Statistik', exact: true })).toBeVisible()
  const metrics = page.locator('.analytics-metrics dd')
  await expect(metrics).toHaveText(['1', '1', '1'])
  await expect(page.getByRole('list').getByText('Portofolio')).toBeVisible()
  await page.getByRole('button', { name: '30 hari' }).click()
  await expect(page).toHaveURL(/hari=30$/)
  await expect(page.getByLabel('Tanggal aktivitas').locator('option')).toHaveCount(30)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360)
})

test('warna, bentuk dan efek dibagikan persis seperti pratinjau', async ({ page }) => {
  await openMemberStudio(page)
  const global = page.getByRole('region', { name: 'Tampilan halaman' })
  const preview = page.getByRole('region', { name: 'Pratinjau toko' })
  const card = preview.locator('.channel-card').first()
  const icon = card.locator('.channel-icon')
  await expect(icon.locator('[aria-hidden]')).toHaveCSS('mask-image', /instagram_white\.svg/)
  const iconStyle = page.getByLabel('Tampilan ikon', { exact: true })
  const iconShape = page.getByLabel('Bentuk wadah ikon', { exact: true })
  await page.getByRole('button', { name: 'Tambah tautan' }).click()
  await page.getByLabel('Judul tautan 2').fill('Toko')
  await page.getByLabel('URL tujuan 2').fill('www.tiktok.com/@maya')
  await page.getByLabel('Ikon', { exact: true }).nth(1).selectOption({ label: 'TikTok' })
  await page.getByLabel('Warna ikon', { exact: true }).nth(1).fill('#34cc88')
  const secondIcon = preview.locator('.channel-icon').nth(1)
  await expect(secondIcon.locator('[aria-hidden]')).toHaveCSS('mask-image', /tiktok_white\.svg/)
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
  const globalRadius = global.getByRole('slider', { name: 'Bentuk tombol' })
  await globalRadius.press('End')
  await expect(card).toHaveCSS('border-radius', '999px')
  await globalRadius.press('Home')
  await global.getByLabel('Gaya tombol').selectOption('glass')
  await expect(card).toHaveCSS('border-radius', '0px')
  await expect(card).toHaveCSS('backdrop-filter', /blur\(.+\).*saturate\(/)
  await page.getByText('Tampilan khusus tautan 1', { exact: true }).click()
  const custom = page.locator('details[open]')
  const customRadius = custom.getByRole('slider', { name: 'Bentuk tombol' })
  await customRadius.press('ArrowRight')
  await expect(card).toHaveCSS('border-radius', '1px')
  await custom.getByRole('button', { name: 'Ikuti tema', exact: true }).click()
  await expect(card).toHaveCSS('border-radius', '0px')
  for (let step = 0; step < 3; step++) await customRadius.press('ArrowRight')
  await custom.getByLabel('Gaya tombol').selectOption('soft')
  await custom.getByLabel('Warna tombol', { exact: true }).fill('#ffdddd')
  await expect(card).toHaveCSS('border-radius', '3px')
  await expect(card).toHaveCSS('background-color', 'rgb(255, 221, 221)')
  await expect(card).toHaveCSS('box-shadow', /inset.*inset/)
  await page.getByRole('button', { name: 'Simpan halaman' }).click()
  await expect(page.getByText('Perubahan tersimpan.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(card).toHaveCSS('border-radius', '3px')
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
  await expect(page.getByRole('link', { name: 'Toko', exact: true })).toHaveCSS(
    'border-radius',
    '0px',
  )
  await expect(published.locator('.channel-icon')).toHaveCSS('border-radius', '50%')
  await expect(published.locator('.channel-icon')).toHaveCSS('border-top-width', '1px')
  await expect(
    page.getByRole('link', { name: 'Toko', exact: true }).locator('.channel-icon'),
  ).toHaveCSS('border-radius', '50%')
  const publishedTikTok = page
    .getByRole('link', { name: 'Toko', exact: true })
    .locator('.channel-icon [aria-hidden]')
  await expect(publishedTikTok).toHaveCSS('mask-image', /tiktok_white\.svg/)
  await expect(publishedTikTok).toHaveCSS('background-color', 'rgb(52, 204, 136)')
  await expect(published).toHaveCSS('border-radius', '3px')
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
    await page.goto(SITE_URL + '/' + preset)
    const card = page.getByRole('link', { name: 'Instagram' })
    await expect(card).toBeVisible()
    await expect(card).toHaveCSS('backdrop-filter', /blur\(/)
    await expect(card).toHaveCSS('border-radius', '28px')
    await page.screenshot({ path: testInfo.outputPath('glass-' + preset + '.png') })
    await page.unroute(FIXTURE_URL + '/rest/v1/rpc/get_member_page')
  }
  const link = page.getByRole('link', { name: 'Instagram' })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await link.hover({ position: { x: 42, y: 20 } })
  const reflection = () => link.evaluate((el) => el.style.getPropertyValue('--reflection-x'))
  const firstReflection = await reflection()
  expect(firstReflection).toMatch(/%$/)
  await link.hover({ position: { x: 300, y: 20 } })
  expect(parseFloat(await reflection())).toBeGreaterThan(parseFloat(firstReflection))
  await page.mouse.move(0, 0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await link.hover()
  expect(await reflection()).toBe('')
  const media = await page.context().newCDPSession(page)
  await media.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  })
  await expect(link).toHaveCSS('backdrop-filter', 'none')
})

test('Claymorphism tersimpan di Studio dan tampil pada tiga tema publik', async ({
  page,
}, testInfo) => {
  await openMemberStudio(page)
  const global = page.getByRole('region', { name: 'Tampilan halaman' })
  await global.getByLabel('Gaya tombol').selectOption({ label: 'Claymorphism' })
  await global.getByRole('slider', { name: 'Bentuk tombol' }).press('End')
  for (const [index, title, icon, fill] of [
    [2, 'Katalog', 'catalog', '#ffbda1'],
    [3, 'WhatsApp', 'whatsapp', '#a1d9c2'],
  ]) {
    await page.getByRole('button', { name: 'Tambah tautan' }).click()
    await page.getByLabel('Judul tautan ' + index).fill(title)
    await page.getByLabel('URL tujuan ' + index).fill('https://ruangstudio.id/' + icon)
    await page
      .getByLabel('Ikon', { exact: true })
      .nth(index - 1)
      .selectOption(icon)
    const custom = page.locator('details').filter({ hasText: 'Tampilan khusus tautan ' + index })
    await custom.locator('summary').click()
    await custom.getByLabel('Warna tombol', { exact: true }).fill(fill)
  }
  for (const preset of ['light', 'dark', 'gradient']) {
    await global.getByLabel('Tema', { exact: true }).selectOption(preset)
    const preview = page.getByRole('region', { name: 'Pratinjau toko' })
    const first = preview.locator('.channel-card').first()
    await expect(first).toHaveAttribute('data-effect', 'clay')
    const material = await first.evaluate((el) => getComputedStyle(el).boxShadow)
    await page.getByRole('button', { name: 'Simpan halaman' }).click()
    await expect(page.getByText('Perubahan tersimpan.', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Lihat halaman publik' }).click()
    await page.setViewportSize({ width: 390, height: 750 })
    const card = page.getByRole('link', { name: 'Portofolio' })
    await expect(card).toHaveCSS('box-shadow', material)
    await expect(card).toHaveCSS('border-radius', '999px')
    await expect(page.getByRole('link', { name: 'Katalog' })).toHaveCSS(
      'background-color',
      'rgb(255, 189, 161)',
    )
    const list = await page.locator('.channel-list').boundingBox()
    await page.screenshot({
      path: testInfo.outputPath('clay-' + preset + '.png'),
      clip: { x: 0, y: Math.floor(list.y) - 14, width: 390, height: Math.ceil(list.height) + 32 },
    })
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(SITE_URL + '/dashboard')
    await expect(global.getByLabel('Gaya tombol')).toHaveValue('clay')
  }
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
  const navigation = page.getByRole('navigation', { name: 'Bagian editor' })
  const appearance = navigation.getByRole('link', { name: 'Tampilan', exact: true })
  const links = navigation.getByRole('link', { name: 'Tautan', exact: true })
  const preview = navigation.getByRole('link', { name: 'Pratinjau', exact: true })
  const scrollToSection = (id) =>
    page.locator('#' + id).evaluate((section) => section.scrollIntoView())
  const navbarTop = () => navigation.evaluate((nav) => nav.getBoundingClientRect().top)

  await scrollToSection('tampilan')
  await expect(appearance).toHaveAttribute('aria-current', 'location')
  await expect.poll(navbarTop).toBeCloseTo(6, 0)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.setViewportSize({ width: 360, height: 800 })
  await page.screenshot({ path: testInfo.outputPath('studio-mobile.png') })
  await page.getByLabel('Bio', { exact: true }).fill('Katalog Maya')
  await preview.click()
  await expect(
    page.getByRole('region', { name: 'Pratinjau toko' }).getByText('Katalog Maya'),
  ).toBeInViewport()
  await expect(preview).toHaveAttribute('aria-current', 'location')
  await expect.poll(navbarTop).toBeCloseTo(6, 0)
  await appearance.click()
  await expect(page.getByRole('heading', { name: 'Tampilan halaman' })).toBeInViewport()
  await expect(appearance).toHaveAttribute('aria-current', 'location')
  await page.getByLabel('Warna latar', { exact: true }).fill('#eee0ff')
  await scrollToSection('tautan')
  await expect(links).toHaveAttribute('aria-current', 'location')
  await expect.poll(navbarTop).toBeCloseTo(6, 0)
  await scrollToSection('tampilan')
  await expect(appearance).toHaveAttribute('aria-current', 'location')
  await expect(page).toHaveURL(/#tampilan$/)
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
      expect(route.request().postDataJSON().data?.linkfy_username).toBeUndefined()
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
    await expect(page.getByLabel('Username untuk alamat halaman')).toHaveCount(0)
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

test('setelah masuk, akun tanpa halaman memilih username yang unik', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await openMemberStudio(page, { withoutPage: true })
  await expect(page.getByRole('heading', { name: 'Buat halamanmu' })).toBeVisible()
  const username = page.getByLabel('Username untuk alamat halaman')
  await page.getByLabel('Nama profil').fill('Maya')
  await username.fill('MAYA')
  const domain = page.getByText(new URL(SITE_URL).host + '/', { exact: true })
  await expect(domain).toBeVisible()
  const domainBox = await domain.boundingBox()
  const usernameBox = await username.boundingBox()
  expect(domainBox.x + domainBox.width).toBeCloseTo(usernameBox.x)
  expect(domainBox.y).toBeCloseTo(usernameBox.y)
  await expect(username).toHaveValue('maya')
  const create = page.getByRole('button', { name: 'Buat halaman' })
  const status = page.locator('#member-slug-status')
  await expect(status).toContainText('Username ini sudah dipakai')
  await expect(status).toHaveCSS('color', 'rgb(157, 40, 59)')
  await expect(status.locator('svg.lucide-x')).toBeVisible()
  await expect(create).toBeDisabled()
  await username.fill('maya-balap')
  await expect(status).toHaveText('Username tersedia.')
  await expect(status).toHaveCSS('color', 'rgb(19, 92, 56)')
  await expect(status.locator('svg.lucide-check')).toBeVisible()
  await create.click()
  await expect(status).toContainText('Username ini sudah dipakai')
  await username.fill('maya-baru')
  await expect(status).toHaveText('Username tersedia.')
  await create.click()
  await expect(page.getByRole('navigation', { name: 'Bagian editor' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('navigation', { name: 'Bagian editor' })).toBeVisible()
  await expect(username).toHaveCount(0)
})

test('editor menjelaskan jika cek username belum aktif dan tetap bisa membuat halaman', async ({
  page,
}) => {
  await openMemberStudio(page, { withoutPage: true, slugCheckMissing: true })
  await page.getByLabel('Nama profil').fill('Maya')
  await page.getByLabel('Username untuk alamat halaman').fill('maya')
  const status = page.locator('#member-slug-status')
  await expect(status).toContainText('Cek otomatis belum aktif')
  await page.getByRole('button', { name: 'Buat halaman' }).click()
  await expect(status).toContainText('Username ini sudah dipakai')
  await page.getByLabel('Username untuk alamat halaman').fill('maya-baru')
  await expect(status).toContainText('Cek otomatis belum aktif')
  await page.getByRole('button', { name: 'Buat halaman' }).click()
  await expect(page.getByRole('navigation', { name: 'Bagian editor' })).toBeVisible()
})
