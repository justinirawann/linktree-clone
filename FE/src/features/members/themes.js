import { THEMES } from '../../shared/lib/defaults'
import { z } from 'zod'

export const MEMBER_THEMES = {
  light: {
    ...THEMES.light,
    background_color: '#f8f7fc',
    text_color: '#211b2c',
    button_color: '#ffffff',
    button_text_color: '#211b2c',
  },
  dark: {
    ...THEMES.dark,
    background_color: '#211a33',
    text_color: '#f7efff',
    button_color: '#30244c',
    button_text_color: '#f7efff',
  },
  gradient: {
    ...THEMES.gradient,
    background_color: '#ede4ff',
    gradient_color: '#e8fa81',
    text_color: '#211b2c',
    button_color: '#f8f7fc',
    button_text_color: '#211b2c',
  },
}

export const MAX_BUTTON_RADIUS = 50
const PILL_RADIUS = 999
const LEGACY_BUTTON_RADII = { square: 0, slight: 8, rounded: 14, round: 28, pill: PILL_RADIUS }
export const BUTTON_EFFECTS = {
  plain: 'Biasa',
  glass: 'Glassmorphism',
  soft: 'Neumorphism',
}
export const ICON_STYLES = { filled: 'Wadah isi', outline: 'Outline', bare: 'Icon Only' }
export const ICON_SHAPES = {
  square: 'Kotak',
  rounded: 'Kotak membulat',
  circle: 'Lingkaran',
}
const iconSchema = z.object({
  icon_style: z.enum(Object.keys(ICON_STYLES)).optional(),
  icon_shape: z.enum(Object.keys(ICON_SHAPES)).optional(),
})

export function resolveLinkIcon(settings) {
  const icon = iconSchema.safeParse(settings).data
  return { style: icon?.icon_style || 'filled', shape: icon?.icon_shape || 'rounded' }
}
const color = z.string().regex(/^#[0-9a-f]{6}$/i)
const buttonSchema = z.object({
  fill: color.optional(),
  ink: color.optional(),
  shape: z.enum(Object.keys(LEGACY_BUTTON_RADII)).optional(),
  radius: z.number().int().min(0).max(MAX_BUTTON_RADIUS).optional(),
  effect: z.enum(Object.keys(BUTTON_EFFECTS)).optional(),
})
const appearanceSchema = buttonSchema.extend({
  background: color.optional(),
  gradient: color.optional(),
})

function resolveButtonRadius({ radius, shape }, fallback) {
  if (radius === MAX_BUTTON_RADIUS) return PILL_RADIUS
  return radius ?? LEGACY_BUTTON_RADII[shape] ?? fallback
}

function channels(hex) {
  return hex
    .slice(1)
    .match(/../g)
    .map((part) => parseInt(part, 16))
}

function mix(first, second, amount) {
  const other = channels(second)
  return (
    '#' +
    channels(first)
      .map((value, index) =>
        Math.round(value + (other[index] - value) * amount)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

function luminance(hex) {
  const [r, g, b] = channels(hex).map((value) => {
    const srgb = value / 255
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function readableInk(fill) {
  // Crossover where black and white have the same WCAG contrast ratio.
  return luminance(fill) > 0.1791 ? '#000000' : '#ffffff'
}

function glassSurface(fill, backdrop) {
  // Keep the glass clear unless a gradient needs more tint for readable text.
  for (const tint of [0.36, 0.56, 0.76, 0.84]) {
    const colors = backdrop.map((color) => mix(color, fill, tint))
    const levels = colors.map(luminance)
    const blackContrast = (Math.min(...levels) + 0.05) / 0.05
    const whiteContrast = 1.05 / (Math.max(...levels) + 0.05)
    if (Math.max(blackContrast, whiteContrast) >= 4.5) {
      return {
        tint: tint * 100 + '%',
        opaque: colors[Math.floor(colors.length / 2)],
        ink: blackContrast >= whiteContrast ? '#000000' : '#ffffff',
      }
    }
  }
  return { tint: '100%', opaque: fill, ink: readableInk(fill) }
}

export function resolveMemberTheme(preset, appearance) {
  const base = MEMBER_THEMES[preset] || MEMBER_THEMES.light
  const custom = appearanceSchema.safeParse(appearance).data || {}
  const background = custom.background || base.background_color
  const gradient = custom.gradient || base.gradient_color
  const hasCustomBackground = Boolean(
    custom.background || (base.background_type === 'gradient' && custom.gradient),
  )
  const sample = base.background_type === 'gradient' ? mix(background, gradient, 0.5) : background
  const suggested = hasCustomBackground ? mix(sample, readableInk(sample), 0.2) : base.button_color
  const fill = custom.fill || suggested
  const effect = custom.effect || 'plain'
  const backdrop =
    base.background_type === 'gradient' ? [background, sample, gradient] : [background]
  const glass = effect === 'glass' ? glassSurface(fill, backdrop) : undefined
  const opaqueInk =
    custom.ink || (custom.fill || hasCustomBackground ? readableInk(fill) : base.button_text_color)
  const ink = custom.ink || glass?.ink || opaqueInk
  return {
    theme: {
      ...base,
      background_color: background,
      gradient_color: gradient,
      text_color: hasCustomBackground ? readableInk(background) : base.text_color,
      button_color: fill,
      button_text_color: opaqueInk,
    },
    button: {
      fill,
      ink,
      radius: resolveButtonRadius(custom, LEGACY_BUTTON_RADII.rounded),
      effect,
      glass,
    },
    backdrop,
    manualInk: custom.ink,
  }
}

export function resolveLinkButton(design, settings) {
  const overrides = buttonSchema.safeParse(settings).data || {}
  const { shape, radius, ...styles } = overrides
  const button = {
    ...design.button,
    ...styles,
    radius: resolveButtonRadius({ shape, radius }, design.button.radius),
  }
  if (button.fill !== design.button.fill || button.effect !== design.button.effect) {
    button.glass =
      button.effect === 'glass' ? glassSurface(button.fill, design.backdrop) : undefined
  }
  button.ink =
    overrides.ink ||
    design.manualInk ||
    button.glass?.ink ||
    (overrides.fill || overrides.effect ? readableInk(button.fill) : design.button.ink)
  return button
}
