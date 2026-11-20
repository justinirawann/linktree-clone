import { z } from 'zod'

const metadata = z.object({
  title: z.string().nullish(),
  description: z.string().nullish(),
  image: z.object({ url: z.string() }).nullish(),
  logo: z.object({ url: z.string() }).nullish(),
})

export async function readLinkMetadata(url, signal) {
  const target = new URL(url)
  target.hash = ''
  const endpoint = new URL('https://api.microlink.io')
  endpoint.searchParams.set('url', target.href)
  const response = await fetch(endpoint, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  })
  if (!response.ok) throw new Error('Metadata belum tersedia.')
  const result = await response.json()
  if (result.status !== 'success') throw new Error('Metadata belum tersedia.')
  return metadata.parse(result.data)
}
