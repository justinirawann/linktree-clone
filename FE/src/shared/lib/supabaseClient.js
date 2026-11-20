import { createClient } from '@supabase/supabase-js'
import { hasSupabase, supabaseConfig } from './env'
let instance
export function getClient() {
  if (!hasSupabase) throw new Error('Konfigurasi Supabase belum lengkap.')
  instance ??= createClient(supabaseConfig.projectUrl, supabaseConfig.publishableKey, {
    auth: {
      persistSession: true,
      storage: window.sessionStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return instance
}
export async function unwrap(request) {
  const { data, error } = await request
  if (error) throw error
  return data
}
