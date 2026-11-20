import { THEMES, EMPTY_LINK } from './defaults'
import { linkSchema, profileSchema, themeSchema, validUrl, PLATFORMS, InputError } from './rules'
const KEY = 'core-consign:local-studio:v1'
const ASSETS = KEY + ':asset:'
const seed = [
  ['Chat WhatsApp', 'Tanya stok atau ngobrol langsung dengan admin.', 'whatsapp'],
  ['Belanja di Shopee', 'Temukan komponen PC di toko Shopee kami.', 'shopee'],
  ['Belanja di Toco', 'Jelajahi pilihan hardware kami di Toco.', 'toco'],
  ['Instagram Core Consign', 'Lihat update barang dan aktivitas toko.', 'instagram'],
  ['Mau Titip Jual?', 'Cari tahu cara menitipkan hardware kamu.', 'consign'],
  ['Lihat Katalog', 'Telusuri koleksi komponen PC kami.', 'catalog'],
]
function initial() {
  return {
    profile: {
      store_name: 'Core Consign',
      bio: 'Titip jual dan belanja komponen PC. Temukan semua kanal Core Consign di sini.',
      logo_path: null,
      is_published: false,
      revision: 1,
      order_revision: 1,
    },
    theme: { ...THEMES.dark, revision: 1 },
    socials: [],
    links: seed.map(([title, description, icon_key], i) => ({
      ...EMPTY_LINK,
      id: 'seed-' + i,
      title,
      description,
      icon_key,
      layout: i === 0 ? 'featured' : 'classic',
      revision: 1,
      position: i,
    })),
    sample: true,
  }
}
function read() {
  const stored = localStorage.getItem(KEY)
  return stored ? JSON.parse(stored) : initial()
}
function checkRevision(actual, expected) {
  if (actual == null || actual !== expected)
    throw Object.assign(new Error('revision_conflict'), { code: 'PT409' })
}
const commands = {
  save_profile(page, { expected, profile, socials }) {
    checkRevision(page.profile.revision, expected)
    if (
      socials.some((s) => !Object.hasOwn(PLATFORMS, s.platform) || !validUrl(s.url)) ||
      new Set(socials.map((s) => s.platform)).size !== socials.length
    )
      throw new InputError('Periksa kembali URL sosial.')
    Object.assign(page.profile, profileSchema.parse(profile), { revision: expected + 1 })
    page.socials = socials
  },
  save_appearance(page, { expected, theme }) {
    checkRevision(page.theme.revision, expected)
    page.theme = { ...themeSchema.parse(theme), revision: expected + 1 }
  },
  save_link(page, { link_id, expected, entry }) {
    const parsed = linkSchema.parse(entry)
    if (expected === null) {
      const existing = page.links.find((l) => l.id === link_id)
      if (existing) {
        if (
          existing.revision === 1 &&
          Object.entries({ ...parsed, is_active: false }).every(([k, v]) => existing[k] === v)
        )
          return
        checkRevision(existing.revision, null)
      }
      page.links.push({
        ...parsed,
        id: link_id || crypto.randomUUID(),
        is_active: false,
        revision: 1,
        position: page.links.length,
      })
      page.profile.order_revision++
      return
    }
    const existing = page.links.find((l) => l.id === link_id)
    checkRevision(existing?.revision, expected)
    Object.assign(existing, parsed, { revision: expected + 1 })
  },
  delete_link(page, { link_id, expected }) {
    checkRevision(page.links.find((l) => l.id === link_id)?.revision, expected)
    page.links = page.links.filter((l) => l.id !== link_id)
    page.profile.order_revision++
  },
  reorder_links(page, { ids, expected }) {
    checkRevision(page.profile.order_revision, expected)
    if (
      ids.length !== page.links.length ||
      new Set(ids).size !== ids.length ||
      !ids.every((id) => page.links.some((l) => l.id === id))
    )
      throw new InputError('Daftar urutan tidak lengkap.')
    const indexed = new Map(page.links.map((l) => [l.id, l]))
    page.links = ids.map((id, position) => ({ ...indexed.get(id), position }))
    page.profile.order_revision++
  },
  set_publication(page, { published, expected }) {
    checkRevision(page.profile.revision, expected)
    if (published && !page.links.some((l) => l.is_active && validUrl(l.url)))
      throw new Error('active_link_required')
    page.profile.is_published = published
    page.profile.revision++
    page.sample = false
  },
}
export async function localRpc(name, args) {
  if (name === 'get_editor_page') return read()
  if (name === 'get_public_page') {
    const page = read()
    if (!page.profile.is_published) return page.sample ? { ...initial(), showcase: true } : null
    return { ...page, links: page.links.filter((l) => l.is_active && validUrl(l.url)) }
  }
  return navigator.locks.request(KEY, () => {
    const page = read()
    commands[name](page, args)
    localStorage.setItem(KEY, JSON.stringify(page))
    return page
  })
}
export const localAssets = {
  read: (path) => localStorage.getItem(ASSETS + path),
  upload: (path, file) => localStorage.setItem(ASSETS + path, file.preview),
  remove(path) {
    const p = read()
    if (
      ![
        p.profile.logo_path,
        p.theme.background_path,
        ...p.links.map((l) => l.thumbnail_path),
      ].includes(path)
    )
      localStorage.removeItem(ASSETS + path)
  },
}
