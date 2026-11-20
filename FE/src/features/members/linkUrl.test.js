import { describe, expect, it } from 'vitest'
import { memberLinkUrl } from './linkUrl'

describe('URL tujuan halaman Linkfy', () => {
  it.each([
    ['  instagram.com/andi  ', 'https://instagram.com/andi'],
    ['www.tiktok.com/@andi', 'https://www.tiktok.com/@andi'],
    ['wa.me/628123456789', 'https://wa.me/628123456789'],
    ['http://links.katalog.id:8080', 'http://links.katalog.id:8080/'],
  ])('menormalkan %s', (input, expected) => {
    expect(memberLinkUrl(input)).toEqual({ url: expected })
  })

  it.each(['javascript:alert(1)', '//instagram.com/andi', 'example.com', 'andi'])(
    'menolak %s',
    (input) => {
      expect(memberLinkUrl(input)).toHaveProperty('error')
    },
  )

  it('memberi petunjuk khusus untuk nomor WhatsApp lokal', () => {
    expect(memberLinkUrl('wa.me/08123456789').error).toContain('kode negara')
  })
})
