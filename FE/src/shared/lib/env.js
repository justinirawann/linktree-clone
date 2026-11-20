import { PUBLIC_PAGE_PATH } from './routes'

const projectUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
export const hasSupabase = Boolean(projectUrl && publishableKey)
export const localStudio = import.meta.env.DEV && !projectUrl && !publishableKey
export const supabaseConfig = { projectUrl, publishableKey }
export function publicOrigin(value) {
  try {
    const parsed = new URL(value)
    if (
      !['https:', 'http:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    )
      return ''
    return parsed.origin + '/'
  } catch {
    return ''
  }
}
export const canonicalUrl = publicOrigin(import.meta.env.VITE_SITE_URL)

export const publicPageUrl = canonicalUrl ? new URL(PUBLIC_PAGE_PATH, canonicalUrl).href : ''
