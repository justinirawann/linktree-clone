export const PUBLIC_PAGE_PATH = '/core-consign'

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
