import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { rpc } from '../../shared/lib/transport'
import { pageVisitSource } from '../../shared/lib/routes'
export { AnalyticsReport } from './AnalyticsReport'

export const analytics = {
  read: (days, ownerStore, signal) =>
    rpc('read_page_analytics', { period_days: days, owner_store: ownerStore }, signal),
}

function recordVisit(slug, source, linkId) {
  // Analytics is best effort and must not block the public page.
  void rpc('record_page_analytics', {
    page_slug: slug,
    link_id: linkId,
    visit_source: source,
  }).catch(() => {})
}

export function usePageAnalytics(slug, isPublished) {
  const location = useLocation()
  const tracked = useRef('')
  const source = pageVisitSource(location.search)

  useEffect(() => {
    const visit = location.key + ':' + location.pathname
    if (!isPublished || tracked.current === visit) return
    tracked.current = visit
    recordVisit(slug, source, null)
  }, [isPublished, location.key, location.pathname, slug, source])

  if (!isPublished) return undefined
  return (linkId) => recordVisit(slug, source, linkId)
}
