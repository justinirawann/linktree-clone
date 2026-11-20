import { describe, expect, it } from 'vitest'
import { MEMBER_THEMES, resolveLinkButton, resolveMemberTheme } from './themes'

describe('tema halaman Linkfy', () => {
  it('memperkuat tint kaca jika dua ujung gradasi membutuhkan kontras lebih tinggi', () => {
    const design = resolveMemberTheme('gradient', {
      background: '#000000',
      gradient: '#ffffff',
      fill: '#eeeeee',
      effect: 'glass',
    })
    const glass = resolveLinkButton(design, {})
    expect(parseFloat(glass.glass.tint)).toBeGreaterThan(46)
    expect(glass.ink).toBe('#000000')
    expect(resolveLinkButton(design, { fill: '#000000', ink: '#ccff99' }).ink).toBe('#ccff99')
    expect(resolveLinkButton(design, { effect: 'plain' }).glass).toBeUndefined()
  })
  it.each(Object.keys(MEMBER_THEMES))('mempertahankan warna preset lama %s', (preset) => {
    expect(resolveMemberTheme(preset).theme).toEqual(MEMBER_THEMES[preset])
  })

  it('warna otomatis merespons kedua warna gradasi dan menghormati pilihan manual', () => {
    const first = resolveMemberTheme('gradient', { background: '#112233', gradient: '#ffffff' })
    const next = resolveMemberTheme('gradient', { background: '#112233', gradient: '#000000' })
    expect(first.button.fill).not.toBe(next.button.fill)
    expect(next.button.ink).toBe('#ffffff')
    const manual = resolveMemberTheme('light', { fill: '#abcdef', ink: '#301020', shape: 'square' })
    expect(resolveLinkButton(manual, { effect: 'glass' })).toMatchObject({
      fill: '#abcdef',
      ink: '#301020',
      radius: 0,
      effect: 'glass',
    })
  })

  it('menghitung teks dari warna tombol khusus dan memulihkan pewarisan', () => {
    const theme = resolveMemberTheme('light', { shape: 'pill' })
    expect(resolveLinkButton(theme, { fill: '#111111', shape: 'square' })).toMatchObject({
      ink: '#ffffff',
      radius: 0,
    })
    expect(resolveLinkButton(theme, {})).toMatchObject({ ...theme.button, radius: 999 })
  })
})
