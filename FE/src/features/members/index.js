import { rpc } from '../../shared/lib/transport'
import { getClient, unwrap } from '../../shared/lib/supabaseClient'
import { canonicalUrl } from '../../shared/lib/env'
import { InputError } from '../../shared/lib/rules'
import { memberAvatars } from './avatars'
import { resolveMemberTheme, resolveLinkButton, resolveLinkIcon } from './themes'

export { useMemberAvatar } from './avatars'
export { MemberLinks } from './components/MemberLinks'
export { MemberAppearance } from './components/MemberAppearance'
export { memberLinkUrl } from './linkUrl'

export const memberPagePath = (slug) => '/u/' + encodeURIComponent(slug)
export const memberPageUrl = (slug) =>
  new URL(memberPagePath(slug), canonicalUrl || window.location.origin).href

function appearanceParams(page) {
  // Rows from before migration 019 still use the existing seven-argument RPC.
  if (!page.appearance && !page.link_styles) return {}
  const styles = {}
  for (const { id } of page.links) {
    if (page.link_styles?.[id]) styles[id] = page.link_styles[id]
  }
  return { chosen_appearance: page.appearance || {}, chosen_link_styles: styles }
}

export const members = {
  read: ({ signal }) =>
    unwrap(getClient().from('member_pages').select().abortSignal(signal).maybeSingle()),
  readPublic: (slug, signal) => rpc('get_member_page', { page_slug: slug }, signal),
  create: (slug, name) => rpc('create_member_page', { chosen_slug: slug, chosen_name: name }),
  async save(page, { image, previousAvatarPath } = {}) {
    const path = image
      ? await memberAvatars.upload(page.slug, image.blob)
      : (page.avatar_path ?? null)
    try {
      await rpc('save_member_page', {
        expected: page.revision,
        chosen_name: page.display_name,
        chosen_bio: page.bio,
        chosen_theme: page.theme,
        chosen_links: page.links,
        publish_page: page.published,
        chosen_avatar_path: path,
        ...appearanceParams(page),
      })
    } catch (error) {
      // A lost response may mean the database already linked the new file.
      if (image && /^(PT409|22|23|42501|PGRST202)/.test(error.code || '')) {
        try {
          await memberAvatars.remove(path)
        } catch (cleanupError) {
          throw Object.assign(error, { cleanupError })
        }
      }
      if (error.code === 'PGRST202' && (page.appearance || page.link_styles)) {
        throw new InputError(
          'Penyimpanan tampilan belum aktif. Jalankan migrasi 019 di Supabase, lalu klik Simpan halaman lagi.',
        )
      }
      throw error
    }
    if (previousAvatarPath && previousAvatarPath !== path) {
      try {
        await memberAvatars.remove(previousAvatarPath)
      } catch {
        return 'Perubahan tersimpan. File foto lama belum berhasil dibersihkan.'
      }
    }
    return 'Perubahan tersimpan.'
  },
}

export function memberDirectory(page, avatarSrc) {
  const design = resolveMemberTheme(page.theme, page.appearance)
  const icon = resolveLinkIcon(page.appearance)
  return {
    profile: { store_name: page.display_name, bio: page.bio, logo_preview: avatarSrc },
    theme: design.theme,
    links: page.links.map((link) => ({
      ...link,
      button: resolveLinkButton(design, page.link_styles?.[link.id]),
      icon,
    })),
    socials: [],
  }
}
