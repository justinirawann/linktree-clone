import { useQuery } from '@tanstack/react-query'
import { imageDataUrl } from '../../shared/lib/assetRepository'
import { InputError } from '../../shared/lib/rules'
import { getClient, unwrap } from '../../shared/lib/supabaseClient'

const BUCKET = 'member-avatars'
const storage = () => getClient().storage.from(BUCKET)

export const memberAvatars = {
  async upload(slug, webp) {
    const path = slug + '/' + crypto.randomUUID() + '.webp'
    try {
      await unwrap(storage().upload(path, webp, { contentType: 'image/webp', upsert: false }))
      return path
    } catch {
      throw new InputError('Foto gagal diunggah. Periksa koneksi lalu coba simpan lagi.')
    }
  },
  remove: (path) => unwrap(storage().remove([path])),
}

export function useMemberAvatar(path) {
  return useQuery({
    queryKey: ['asset', 'member-avatar', path],
    enabled: Boolean(path),
    queryFn: async ({ signal }) => {
      const photo = await unwrap(storage().download(path, {}, { signal }))
      return imageDataUrl(photo)
    },
    retry: false,
  })
}
