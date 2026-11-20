// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SharePanel from './SharePanel'
afterEach(cleanup)
it('menawarkan teks terpilih ketika clipboard diblokir', async () => {
  const user = userEvent.setup()
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async () => {
        throw new Error('denied')
      },
    },
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SharePanel name="Core" url="https://coreconsign.id/" />
    </QueryClientProvider>,
  )
  await user.click(screen.getByRole('button', { name: 'Salin tautan' }))
  expect(screen.getByText('Pilih dan salin alamat di bawah ini.').getAttribute('role')).toBe(
    'status',
  )
  expect(document.activeElement).toBe(screen.getByLabelText('Alamat publik'))
})
