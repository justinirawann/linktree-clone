export const PUBLIC_PAGE_PATH = '/core-consign'

// Keep in sync with the database reservation for root-level routes and assets.
const RESERVED_MEMBER_SLUGS = new Set([
  'admin',
  'api',
  'assets',
  PUBLIC_PAGE_PATH.slice(1),
  'dashboard',
  'register',
  'studio',
])

export const isReservedMemberSlug = (slug) => RESERVED_MEMBER_SLUGS.has(slug)
export const isMemberSlug = (slug) =>
  slug.length >= 3 && slug.length <= 32 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
export const memberPagePath = (slug) =>
  (isReservedMemberSlug(slug) ? '/u/' : '/') + encodeURIComponent(slug)

const SOURCE_PARAM = 'ref'
const QR_SOURCE = 'qr'

export function qrPageUrl(url) {
  const marked = new URL(url)
  marked.searchParams.set(SOURCE_PARAM, QR_SOURCE)
  return marked.href
}

export function pageVisitSource(search) {
  return new URLSearchParams(search).get(SOURCE_PARAM) === QR_SOURCE ? QR_SOURCE : 'other'
}
