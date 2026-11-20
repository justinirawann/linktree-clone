import { z } from 'zod'
export const ICON_KEYS = [
  'whatsapp',
  'shopee',
  'toco',
  'tokopedia',
  'line',
  'instagram',
  'consign',
  'catalog',
  'link',
]
export const PLATFORMS = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  website: 'Website',
  youtube: 'YouTube',
  tiktok: 'TikTok',
}
export function validUrl(value) {
  if (
    !value ||
    value.length > 2048 ||
    !/^https?:\/\/[^/?#]/i.test(value) ||
    /[\s<>\\]/.test(value) ||
    value.includes('...')
  )
    return false
  try {
    const url = new URL(value)
    if (
      url.username ||
      url.password ||
      url.href.length > 2048 ||
      /(^|\.)example\.(com|net|org)$|\.(invalid|test|example)$/i.test(url.hostname)
    )
      return false
    if (
      !url.hostname.startsWith('[') &&
      !url.hostname.split('.').every((part) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(part))
    )
      return false
    if (/^(www\.)?wa\.me$/i.test(url.hostname))
      return url.protocol === 'https:' && /^\/[1-9]\d{6,14}\/?$/.test(url.pathname)
    return true
  } catch {
    return false
  }
}
const urlField = z
  .string()
  .refine((value) => !value || validUrl(value), 'Masukkan URL HTTP atau HTTPS lengkap yang valid.')
  .transform((value) => (value ? new URL(value).href : ''))
export const linkSchema = z
  .object({
    title: z.string().trim().min(1, 'Isi judul tautan.').max(100),
    description: z.string().max(160),
    url: urlField,
    is_active: z.boolean(),
    icon_key: z.enum(ICON_KEYS),
    icon_color: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .default('#ffffff'),
    layout: z.enum(['classic', 'featured']),
    thumbnail_path: z.string().nullable(),
  })
  .refine((link) => !link.is_active || Boolean(link.url), {
    path: ['url'],
    message: 'Isi URL sebelum mengaktifkan tautan.',
  })
export const profileSchema = z.object({
  store_name: z.string().trim().min(1, 'Isi nama toko.').max(60),
  bio: z.string().max(160),
  logo_path: z.string().nullable(),
})
export const themeSchema = z.object({
  preset: z.enum(['dark', 'light', 'gradient', 'custom']),
  background_type: z.enum(['solid', 'gradient', 'image']),
  ...Object.fromEntries(
    ['background_color', 'gradient_color', 'text_color', 'button_color', 'button_text_color'].map(
      (key) => [key, z.string().regex(/^#[0-9a-f]{6}$/i)],
    ),
  ),
  font: z.enum(['dm', 'system', 'georgia']),
  radius: z.number().int().min(0).max(36),
  border_enabled: z.boolean(),
  shadow_enabled: z.boolean(),
  background_path: z.string().nullable(),
})
export function friendlyError(error) {
  if (error?.code === 'PT409')
    return 'Versi tersimpan sudah berubah. Tinjau versi terbaru sebelum mencoba lagi.'
  if (error?.message === 'active_link_required')
    return 'Aktifkan minimal satu tautan dengan URL valid sebelum publikasi.'
  if (error?.code === '42501' || error?.status === 401)
    return 'Akses ditolak. Periksa sesi dan akun owner kamu.'
  if (error?.code === '23514')
    return 'Ada isian yang belum valid. Periksa URL, panjang teks, dan pilihan tampilan.'
  if (error?.name === 'QuotaExceededError')
    return 'Penyimpanan browser penuh. Gunakan gambar yang lebih kecil.'
  if (error instanceof InputError) return error.message
  return 'Perubahan belum berhasil diproses. Periksa koneksi lalu coba lagi.'
}
export class InputError extends Error {}
