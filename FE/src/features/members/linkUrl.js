import { validUrl } from '../../shared/lib/rules'

export function memberLinkUrl(value) {
  const input = value.trim()
  const isBareDomain = /^(?:[a-z0-9-]+\.)+[a-z0-9-]+(?=[:/?#]|$)/i.test(input)
  const url = isBareDomain ? 'https://' + input : input

  if (!url) return { error: 'Isi URL tujuan.' }
  if (/^https?:\/\/(?:www\.)?wa\.me(?:[/:?#]|$)/i.test(url) && !validUrl(url)) {
    return {
      error: 'Pakai https://wa.me/628123456789 dengan kode negara, tanpa +, 0 di awal, atau spasi.',
    }
  }
  if (!validUrl(url)) {
    return { error: 'Masukkan alamat web yang valid, misalnya instagram.com/akunmu.' }
  }
  return { url: new URL(url).href }
}
