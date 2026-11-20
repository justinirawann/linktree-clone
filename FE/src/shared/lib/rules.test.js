import { describe, expect, it } from 'vitest'
import { validUrl, linkSchema, themeSchema } from './rules'
import { THEMES, EMPTY_LINK } from './defaults'
import { publicOrigin } from './env'
describe('tujuan toko', () => {
  it.each([
    'data:text/html,hello',
    'javascript:void(0)',
    '/admin',
    'https://example.com',
    'https://wa.me/...',
    'http://wa.me/62812345678',
    'https://user:pw@shop.id',
    'https://shop.id/ha lo',
  ])('menolak %s', (value) => expect(validUrl(value)).toBe(false))
  it.each([
    'https://shopee.co.id/coreconsign',
    'https://wa.me/62812345678?text=Mau%20titip',
    'http://coreconsign.id',
  ])('menerima %s', (value) => expect(validUrl(value)).toBe(true))
  it('memerlukan URL saat aktif', () =>
    expect(
      linkSchema.safeParse({ ...EMPTY_LINK, title: 'WhatsApp', is_active: true }).success,
    ).toBe(false))
  it('hanya menerima token tema terkurasi', () =>
    expect(themeSchema.safeParse({ ...THEMES.dark, text_color: 'url(a)' }).success).toBe(false))
  it('canonical harus root publik', () => {
    expect(publicOrigin('https://shop.id/admin')).toBe('')
    expect(publicOrigin('https://shop.id')).toBe('https://shop.id/')
  })
})
