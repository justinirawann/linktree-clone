import { rpc } from '../../shared/lib/transport'
export const siteRepository = {
  readPublic: ({ signal }) => rpc('get_public_page', {}, signal),
  readEditor: ({ signal }) => rpc('get_editor_page', {}, signal),
  save: (profile, socials, expected) =>
    rpc('save_profile', {
      profile,
      socials: socials.map(({ platform, url }) => ({ platform, url: new URL(url).href })),
      expected,
    }),
  publish: (published, expected) => rpc('set_publication', { published, expected }),
}
