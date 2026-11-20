import { BookOpen, Globe, Link2, PackageOpen, Video } from 'lucide-react'

const ICONS = {
  consign: PackageOpen,
  catalog: BookOpen,
  link: Link2,
  website: Globe,
  youtube: Video,
}
const BRAND_MASKS = {
  whatsapp: 'url(/whatsapp_white_vector.svg) center / 114% no-repeat',
  shopee: 'url(/shopee_white_vector.svg) center / 114% no-repeat',
  toco: 'url(/toco_white_vector.svg) center / 114% no-repeat',
  tokopedia: 'url(/tokopedia_logo_vectorized_white_1x1.svg) center / 125% no-repeat',
  line: 'url(/line_white_original_vector.svg) center / 216% no-repeat',
  instagram: 'url(/instagram_white.svg) center / contain no-repeat',
  tiktok: 'url(/tiktok_white.svg) center / contain no-repeat',
}

export function ChannelIcon({ name, size = 22, color }) {
  if (Object.hasOwn(BRAND_MASKS, name)) {
    const mask = BRAND_MASKS[name]
    const defaultColor = name === 'instagram' || name === 'tiktok' ? 'currentColor' : '#ffffff'
    return (
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          backgroundColor: color || defaultColor,
          mask,
          WebkitMask: mask,
        }}
      />
    )
  }
  const Icon = Object.hasOwn(ICONS, name) ? ICONS[name] : Link2
  return <Icon size={size} color={color} strokeWidth={1.75} aria-hidden="true" />
}
