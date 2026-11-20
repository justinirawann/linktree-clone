export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ ok: false })
  }
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.authorization !== 'Bearer ' + secret) {
    return response.status(401).json({ ok: false })
  }

  const projectUrl = process.env.VITE_SUPABASE_URL
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!projectUrl || !publishableKey) {
    console.error('Supabase health check is missing project configuration.')
    return response.status(503).json({ ok: false })
  }

  try {
    const result = await fetch(new URL('/rest/v1/rpc/get_public_page', projectUrl), {
      method: 'POST',
      headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
    })
    await result.body?.cancel()
    if (result.ok) return response.status(200).json({ ok: true })

    console.error('Supabase health check failed with HTTP status', result.status)
  } catch {
    console.error('Supabase health check could not reach the Data API.')
  }
  return response.status(502).json({ ok: false })
}
