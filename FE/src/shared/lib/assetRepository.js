import { localStudio } from './env'
import { InputError } from './rules'
const BUCKET = 'site-assets'
export function imageDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
export async function prepareImage(file, folder) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
    throw new InputError('Pilih JPEG, PNG, atau WebP hingga 5 MB.')
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new InputError('Gambar gagal dibaca. Pilih file gambar lain.')
  }
  try {
    const limit = folder === 'backgrounds' ? 1920 : 512,
      scale = Math.min(1, limit / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86))
    if (!blob || blob.type !== 'image/webp' || blob.size > 5 * 1024 * 1024)
      throw new InputError('Gambar tidak dapat dioptimalkan. Coba file lebih kecil.')
    return { blob, preview: await imageDataUrl(blob) }
  } finally {
    bitmap.close()
  }
}
export async function assetUrl(path) {
  if (!path) return ''
  if (import.meta.env.DEV && localStudio)
    return (await import('./localStore')).localAssets.read(path)
  const { getClient } = await import('./supabaseClient')
  return getClient().storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
async function cleanup(path) {
  if (!path) return
  if (import.meta.env.DEV && localStudio) {
    ;(await import('./localStore')).localAssets.remove(path)
    return
  }
  const { getClient, unwrap } = await import('./supabaseClient')
  if (!(await unwrap(getClient().rpc('asset_in_use', { object_name: path }))))
    await unwrap(getClient().storage.from(BUCKET).remove([path]))
}
export async function saveWithImage({ image, path, previous, folder, save }) {
  let next = path
  if (image) {
    next = folder + '/' + crypto.randomUUID() + '.webp'
    if (import.meta.env.DEV && localStudio)
      (await import('./localStore')).localAssets.upload(next, image)
    else {
      const { getClient, unwrap } = await import('./supabaseClient')
      await unwrap(
        getClient()
          .storage.from(BUCKET)
          .upload(next, image.blob, { contentType: 'image/webp', upsert: false }),
      )
    }
  }
  try {
    await save(next)
  } catch (error) {
    if (image) await cleanup(next).catch(() => undefined)
    throw error
  }
  if (previous && previous !== next) {
    try {
      await cleanup(previous)
    } catch {
      return 'Tersimpan. File lama perlu dibersihkan dari Storage.'
    }
  }
  return 'Perubahan tersimpan.'
}
export const assetRepository = { cleanup }
