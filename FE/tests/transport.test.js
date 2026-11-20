import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createClient } from '@supabase/supabase-js'
import { unwrap } from '../src/shared/lib/supabaseClient'
const base = 'https://local-project.supabase.test'
const client = createClient(base, 'sb_publishable_testonly', {
  auth: { persistSession: false, autoRefreshToken: false },
})
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
it.each([
  [409, 'PT409'],
  [422, '23514'],
  [500, 'internal'],
])('kesalahan HTTP %s menjadi penolakan promise', async (status, code) => {
  server.use(
    http.post(base + '/rest/v1/rpc/save_profile', () =>
      HttpResponse.json({ code, message: 'save_failed' }, { status }),
    ),
  )
  await expect(unwrap(client.rpc('save_profile', {}))).rejects.toMatchObject({ code })
})
it('pembatalan request tidak menghasilkan halaman kosong', async () => {
  const controller = new AbortController()
  const delayed = vi.fn()
  server.use(
    http.post(base + '/rest/v1/rpc/get_public_page', async () => {
      await new Promise((r) => setTimeout(r, 20))
      delayed()
      return HttpResponse.json(null)
    }),
  )
  const call = unwrap(client.rpc('get_public_page').abortSignal(controller.signal))
  controller.abort()
  await expect(call).rejects.toBeTruthy()
})
