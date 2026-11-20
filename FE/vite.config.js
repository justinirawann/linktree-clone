import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { PUBLIC_PAGE_PATH } from './src/shared/lib/routes.js'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
  if (
    key.startsWith('sb_secret_') ||
    (key.includes('.') &&
      Buffer.from(key.split('.')[1] || '', 'base64url')
        .toString('utf8')
        .includes('service_role'))
  )
    throw new Error('Konfigurasi frontend hanya menerima Supabase publishable key atau anon key.')
  const configured = env.VITE_SITE_URL
  let origin = ''
  if (configured) {
    const url = new URL(configured)
    if (!['http:', 'https:'].includes(url.protocol) || url.href !== url.origin + '/')
      throw new Error('VITE_SITE_URL harus berupa origin publik tanpa path.')
    origin = url.origin
  }
  return {
    // Wait for editor writes to settle before caching the transformed module.
    server: { watch: { awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 } } },
    build: {
      rolldownOptions: {
        input: {
          home: fileURLToPath(new URL('./index.html', import.meta.url)),
          storefront: fileURLToPath(
            new URL('.' + PUBLIC_PAGE_PATH + '/index.html', import.meta.url),
          ),
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'store-metadata',
        transformIndexHtml(_html, context) {
          const isStorefront = context.path === PUBLIC_PAGE_PATH + '/index.html'
          const url = origin + (isStorefront ? PUBLIC_PAGE_PATH : '/')
          const tags = []
          if (isStorefront)
            tags.push({
              tag: 'meta',
              attrs: { property: 'og:image', content: origin + '/share-card.jpg' },
            })
          if (origin)
            tags.push(
              { tag: 'link', attrs: { rel: 'canonical', href: url } },
              { tag: 'meta', attrs: { property: 'og:url', content: url } },
            )
          return tags
        },
      },
    ],
  }
})
