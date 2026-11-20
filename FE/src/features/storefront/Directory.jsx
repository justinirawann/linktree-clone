import { lazy, Suspense, useState } from 'react'
import {
  Cpu,
  Share2,
  Camera,
  PackageOpen,
  BookOpen,
  Link2,
  ExternalLink,
  Globe,
  Music2,
  Video,
  Layers3,
  ScanLine,
  User,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand, Button, Dialog } from '../../shared/ui/Controls'
import { AssetImage, useAsset } from '../../shared/ui/AssetImage'
import { themeSchema, PLATFORMS, validUrl } from '../../shared/lib/rules'
import { THEMES } from '../../shared/lib/defaults'
import { localStudio } from '../../shared/lib/env'
const SharePanel = lazy(() => import('../../shared/ui/SharePanel'))
const LinkPreview = lazy(() => import('./LinkPreview'))
import './link-preview.css'
const icons = {
  instagram: Camera,
  consign: PackageOpen,
  catalog: BookOpen,
  link: Link2,
  website: Globe,
  youtube: Video,
  tiktok: Music2,
}
const brandMasks = {
  whatsapp: 'url(/whatsapp_white_vector.svg) center / 114% no-repeat',
  shopee: 'url(/shopee_white_vector.svg) center / 114% no-repeat',
  toco: 'url(/toco_white_vector.svg) center / 114% no-repeat',
  tokopedia: 'url(/tokopedia_logo_vectorized_white_1x1.svg) center / 125% no-repeat',
  line: 'url(/line_white_original_vector.svg) center / 216% no-repeat',
}
export function ChannelIcon({ name, size = 22, color }) {
  if (brandMasks[name])
    return (
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          backgroundColor: color || '#ffffff',
          mask: brandMasks[name],
          WebkitMask: brandMasks[name],
        }}
      />
    )
  const Icon = icons[name] || Link2
  return <Icon size={size} color={color} strokeWidth={1.75} aria-hidden="true" />
}
const FONTS = {
  dm: '"DM Sans", sans-serif',
  system: 'system-ui, sans-serif',
  georgia: 'Georgia, serif',
}
function surface(theme, background) {
  const parsed = themeSchema.safeParse(theme),
    t = parsed.success ? parsed.data : THEMES.dark
  let image
  if (t.background_type === 'gradient')
    image = 'linear-gradient(155deg,' + t.background_color + ',' + t.gradient_color + ')'
  if (t.background_type === 'image' && background) image = 'url("' + background + '")'
  return {
    '--surface': t.background_color,
    '--ink': t.text_color,
    '--card': t.button_color,
    '--card-ink': t.button_text_color,
    '--card-radius': t.radius + 'px',
    '--edge': t.border_enabled ? '1px' : '0px',
    '--card-shadow': t.shadow_enabled ? '0 8px 18px #0003' : 'none',
    fontFamily: FONTS[t.font],
    backgroundImage: image,
  }
}
function Cover({ name }) {
  const words = name.trim().split(/\s+/),
    last = words.length > 1 ? words.pop() : ''
  return (
    <div className="cover" aria-hidden="true">
      <img src="/hardware-cover.webp" width="1440" height="480" alt="" fetchPriority="high" />
      <div className="cover-copy">
        <span className="cover-kicker">
          <i />
          PC HARDWARE
        </span>
        <strong>
          {words.join(' ') || name}
          {last && <em>{last}</em>}
        </strong>
        <span className="racing-stripes">
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  )
}
function ChannelCard({ link, interactive, onPreview }) {
  const button = link.button
  const cardProps = {
    className: 'channel-card ' + (link.layout === 'featured' ? 'featured' : ''),
    'data-effect': button?.effect,
    style: button && {
      '--card': button.fill,
      '--card-ink': button.ink,
      '--card-radius': button.radius + 'px',
      '--glass-tint': button.glass?.tint,
      '--glass-opaque': button.glass?.opaque,
    },
  }
  const body = (
    <>
      <span
        className={'channel-icon channel-' + link.icon_key}
        data-icon-style={link.icon?.style}
        data-icon-shape={link.icon?.shape}
      >
        <AssetImage
          path={link.thumbnail_path}
          preview={link.thumbnail_preview}
          size={46}
          fallback={<ChannelIcon name={link.icon_key} color={link.icon_color} />}
        />
      </span>
      <span className="channel-copy">
        <strong>{link.title}</strong>
        {link.description && <small>{link.description}</small>}
      </span>
    </>
  )
  const card = interactive ? (
    <a {...cardProps} href={link.url} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  ) : (
    <div {...cardProps}>{body}</div>
  )
  if (!onPreview) return card
  return (
    <div className="link-action-wrap" style={{ color: button?.ink || 'var(--card-ink)' }}>
      {card}
      <button
        className="link-preview-trigger"
        type="button"
        aria-label={'Pratinjau ' + link.title}
        aria-haspopup="dialog"
        onClick={() => onPreview(link)}
      >
        <ExternalLink size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
export default function Directory({
  page,
  preview = false,
  member = false,
  shareUrl,
  isAvatarLoading = false,
}) {
  const Content = preview ? 'div' : 'main'
  const [sharing, setSharing] = useState(false)
  const [previewLink, setPreviewLink] = useState(null)
  const { profile, theme, socials } = page
  const bg = useAsset(theme.background_path)
  const links = page.showcase
    ? page.links
    : page.links.filter((link) => link.is_active !== false && validUrl(link.url))
  const social = socials.filter((l) => validUrl(l.url))
  return (
    <section
      aria-label={preview ? 'Pratinjau toko' : 'Halaman toko'}
      className={'directory' + (preview ? ' in-phone' : '') + (member ? ' member-directory' : '')}
      style={surface(theme, theme.background_preview || bg)}
    >
      {(member || !preview) && (
        <header className="mast">
          <div>
            {member ? (
              <Link to="/" aria-label="Linkfy — beranda" className="member-brand-mark">
                <img src="/linkfy-ly-black.svg" alt="" width="32" height="32" />
              </Link>
            ) : (
              <Brand name={profile.store_name} />
            )}
            <div className="mast-actions">
              {localStudio && !preview && (
                <Link className="studio-entry" to="/studio/dashboard">
                  Buka studio
                </Link>
              )}
              {preview ? (
                <span className="member-share-preview" aria-hidden="true">
                  <Share2 size={18} />
                </span>
              ) : (
                <Button
                  className="share-button"
                  aria-label="Bagikan"
                  onClick={() => setSharing(true)}
                >
                  <Share2 size={18} />
                  {!member && 'Bagikan'}
                </Button>
              )}
            </div>
          </div>
        </header>
      )}
      <Content className="directory-body">
        {!member && <Cover name={profile.store_name} />}
        <div className="identity">
          <span className="avatar">
            <AssetImage
              path={profile.logo_path}
              preview={profile.logo_preview}
              size={84}
              alt={(member ? 'Foto profil ' : 'Logo ') + profile.store_name}
              fallback={
                member ? (
                  <User size={40} strokeWidth={1.4} aria-hidden="true" />
                ) : (
                  <Cpu size={40} strokeWidth={1.4} aria-hidden="true" />
                )
              }
            />
          </span>
          <h1>{profile.store_name}</h1>
          {profile.bio && <p>{profile.bio}</p>}
          {social.length > 0 && (
            <div className="social-row">
              {social.map((l) =>
                preview ? (
                  <span key={l.platform}>
                    <ChannelIcon name={l.platform} />
                  </span>
                ) : (
                  <a
                    key={l.platform}
                    aria-label={PLATFORMS[l.platform]}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ChannelIcon name={l.platform} />
                  </a>
                ),
              )}
            </div>
          )}
        </div>
        <div className={member ? 'sr-only' : 'section-title'}>
          <Layers3 size={15} />
          <h2>{member ? 'Tautan' : 'Kanal toko'}</h2>
          <span />
          {page.showcase && <small>Contoh nonaktif</small>}
        </div>
        {links.length ? (
          <ul className="channel-list">
            {links.map((link) => (
              <li key={link.id}>
                <ChannelCard
                  link={link}
                  interactive={!preview && !page.showcase}
                  onPreview={
                    !page.showcase && (member || !preview) && validUrl(link.url)
                      ? setPreviewLink
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Belum ada tautan aktif.</p>
        )}
        {!member && (
          <footer className="directory-footer">
            <Cpu size={15} />
            {profile.store_name}
          </footer>
        )}
        {!preview && localStudio && (
          <aside className="local-note">
            <ScanLine size={16} />
            <span>Pratinjau lokal</span>
          </aside>
        )}
      </Content>
      {previewLink && (
        <Dialog title="Pratinjau tautan" onClose={() => setPreviewLink(null)}>
          <Suspense fallback={<p role="status">Memuat pratinjau…</p>}>
            <LinkPreview link={previewLink} />
          </Suspense>
        </Dialog>
      )}
      {sharing && (
        <Dialog title="Bagikan halaman" onClose={() => setSharing(false)}>
          <Suspense fallback={<p>Memuat…</p>}>
            <SharePanel
              name={profile.store_name}
              url={shareUrl}
              qrFilename={member ? 'linkfy-qr.png' : undefined}
              logoSrc={member ? profile.logo_preview : undefined}
              isLogoLoading={isAvatarLoading}
            />
          </Suspense>
        </Dialog>
      )}
    </section>
  )
}
