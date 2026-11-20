import { localStudio } from './env'
export async function rpc(name, args = {}, signal) {
  if (import.meta.env.DEV && localStudio) return (await import('./localStore')).localRpc(name, args)
  const { getClient, unwrap } = await import('./supabaseClient')
  const call = getClient().rpc(name, args)
  return unwrap(signal ? call.abortSignal(signal) : call)
}
