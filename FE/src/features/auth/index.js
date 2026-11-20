import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getClient, unwrap } from '../../shared/lib/supabaseClient'
import { canonicalUrl, hasSupabase } from '../../shared/lib/env'
import { InputError } from '../../shared/lib/rules'
export const auth = {
  login: (email, password) => unwrap(getClient().auth.signInWithPassword({ email, password })),
  async register(email, password) {
    const { data, error } = await getClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: new URL('/admin/login', canonicalUrl || window.location.origin).href,
      },
    })
    // Supabase can return a placeholder user with no identities for a confirmed account.
    const isDuplicate =
      ['user_already_exists', 'email_exists'].includes(error?.code) ||
      error?.message === 'User already registered' ||
      (!error && !data.session && data.user?.identities?.length === 0)
    if (isDuplicate) throw new InputError('Email ini sudah terdaftar. Masuk untuk melanjutkan.')
    if (error) throw error
    return data
  },
  logout: () => unwrap(getClient().auth.signOut({ scope: 'local' })),
  recover(email) {
    if (!canonicalUrl) throw new InputError('Atur VITE_SITE_URL untuk mengaktifkan pemulihan akun.')
    return unwrap(
      getClient().auth.resetPasswordForEmail(email, {
        redirectTo: new URL('/admin/reset-password', canonicalUrl).href,
      }),
    )
  },
  changePassword: (password) => unwrap(getClient().auth.updateUser({ password })),
}
export function useSession() {
  const [session, setSession] = useState(undefined)
  const cache = useQueryClient()
  useEffect(() => {
    if (!hasSupabase) return
    let previous
    const {
      data: { subscription },
    } = getClient().auth.onAuthStateChange((_event, next) => {
      const id = next?.user.id
      if (!id || (previous && previous !== id)) {
        cache.removeQueries({ queryKey: ['editor'] })
        cache.removeQueries({ queryKey: ['owner'] })
        cache.removeQueries({ queryKey: ['asset'] })
        cache.removeQueries({ queryKey: ['member-editor'] })
      }
      previous = id
      setSession(next)
    })
    return () => subscription.unsubscribe()
  }, [cache])
  return session
}
export function useOwner() {
  const session = useSession()
  const owner = useQuery({
    queryKey: ['owner', session?.user.id],
    queryFn: () => unwrap(getClient().rpc('is_site_admin')),
    enabled: Boolean(session),
    retry: false,
  })
  return {
    session,
    allowed: owner.data === true,
    loading: hasSupabase && (session === undefined || (Boolean(session) && owner.isPending)),
    error: owner.error,
    retry: owner.refetch,
  }
}
