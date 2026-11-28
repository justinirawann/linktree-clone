import { LoadingPage } from '../shared/ui/LoadingPage'
import { useState } from 'react'
import { Link, NavLink, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Link2,
  Palette,
  Settings2,
  Eye,
  PanelLeft,
  ExternalLink,
  Smartphone,
  ChartNoAxesColumnIncreasing,
} from 'lucide-react'
import { siteRepository } from '../features/site'
import { useOwner } from '../features/auth'
import { Directory } from '../features/storefront'
import { localStudio } from '../shared/lib/env'
import { PUBLIC_PAGE_PATH } from '../shared/lib/routes'
import { Button, Dialog, StatusPage } from '../shared/ui/Controls'
import { LinkfyLogo } from '../shared/ui/LinkfyLogo'
import { useEditor } from './studio/useEditor'
import { LinksEditor } from './studio/LinksEditor'
import { ProfileForm } from './studio/ProfileForm'
import { AppearanceForm } from './studio/AppearanceForm'
import { Settings } from './studio/Settings'
import './studio/editor.css'
const SECTIONS = {
  dashboard: ['Editor halaman', Link2],
  appearance: ['Tampilan', Palette],
  settings: ['Pengaturan', Settings2],
}
function previewPage(page, draft, order) {
  const preview = { ...page, links: order || page.links }
  if (!draft) return preview
  if (draft.kind === 'profile')
    return {
      ...preview,
      profile: { ...draft.value, logo_preview: draft.image?.preview },
      socials: draft.socials,
    }
  if (draft.kind === 'theme')
    return { ...preview, theme: { ...draft.value, background_preview: draft.image?.preview } }
  const editing = { ...draft.value, id: draft.id, thumbnail_preview: draft.image?.preview }
  return { ...preview, links: preview.links.map((l) => (l.id === draft.id ? editing : l)) }
}
function Studio({ section, local, userId }) {
  const [tab, setTab] = useState('links'),
    [mobilePreview, setMobilePreview] = useState(false)
  const editor = useEditor(userId)
  const query = useQuery({
    queryKey: ['editor', userId],
    queryFn: siteRepository.readEditor,
    refetchOnWindowFocus: false,
  })
  if (query.isPending) return <LoadingPage label="Memuat studio…" />
  if (!query.data) return <StatusPage title="Studio gagal dimuat" retry={query.refetch} />
  const page = query.data,
    base = local ? '/studio/' : '/admin/'
  function selectTab(t) {
    if (t === tab || editor.busy) return
    if (editor.dirty && !window.confirm('Buang perubahan sebelum berpindah tab?')) return
    editor.edit(null)
    setTab(t)
  }
  return (
    <div className="studio linkfy-ui">
      <header className="studio-head">
        <LinkfyLogo />
        <span className="studio-label">{local ? 'Studio lokal' : 'Studio owner'}</span>
        <Link className="public-link" to={PUBLIC_PAGE_PATH}>
          Lihat halaman <ExternalLink size={15} />
        </Link>
      </header>
      <div className="studio-layout">
        <nav className="studio-nav" aria-label="Navigasi studio">
          {Object.entries(SECTIONS).map(([key, [title, Icon]]) => (
            <NavLink key={key} to={base + key}>
              <Icon size={18} />
              {title}
            </NavLink>
          ))}
          {!local && (
            <Link to="/admin/analytics">
              <ChartNoAxesColumnIncreasing size={18} aria-hidden="true" />
              Statistik
            </Link>
          )}
        </nav>
        <main className="studio-main">
          <div className="studio-title">
            <p className="eyebrow">{page.profile.store_name}</p>
            <h1>{SECTIONS[section][0]}</h1>
          </div>
          {local && (
            <p className="studio-local">Studio lokal · perubahan disimpan di browser ini.</p>
          )}
          <div className="mobile-mode">
            <Button aria-pressed={!mobilePreview} onClick={() => setMobilePreview(false)}>
              <PanelLeft size={16} />
              Editor
            </Button>
            <Button aria-pressed={mobilePreview} onClick={() => setMobilePreview(true)}>
              <Eye size={16} />
              Pratinjau
            </Button>
          </div>
          <div
            className={
              mobilePreview
                ? 'edit-content editor-surface mobile-hidden'
                : 'edit-content editor-surface'
            }
          >
            {editor.feedback && (
              <div
                className={'notice ' + (editor.feedback.error ? 'error-notice' : '')}
                role={editor.feedback.error ? 'alert' : 'status'}
              >
                {editor.feedback.message}
                {editor.feedback.conflict && (
                  <Button disabled={editor.busy} onClick={editor.reload}>
                    Muat versi terbaru
                  </Button>
                )}
                {editor.feedback.retry && !editor.feedback.conflict && (
                  <Button disabled={editor.busy} onClick={editor.feedback.retry}>
                    Coba lagi
                  </Button>
                )}
              </div>
            )}
            {query.isError && (
              <div className="notice" role="alert">
                Data terbaru gagal dimuat. <Button onClick={query.refetch}>Coba lagi</Button>
              </div>
            )}
            {editor.dirty && (
              <p className="draft-note" role="status">
                {editor.busy ? 'Sedang memproses…' : 'Ada perubahan belum tersimpan'}
              </p>
            )}
            {editor.draft?.image && editor.busy && !editor.processing && (
              <label className="upload-progress">
                Mengunggah dan menyimpan gambar… <progress />
              </label>
            )}
            {section === 'dashboard' && (
              <>
                <div className="tabs">
                  {[
                    ['links', 'Tautan'],
                    ['profile', 'Profil'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={tab === key}
                      disabled={editor.busy}
                      onClick={() => selectTab(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {tab === 'links' ? (
                  <LinksEditor page={page} editor={editor} />
                ) : (
                  <ProfileForm page={page} editor={editor} />
                )}
              </>
            )}
            {section === 'appearance' && <AppearanceForm page={page} editor={editor} />}
            {section === 'settings' && <Settings page={page} editor={editor} local={local} />}
          </div>
        </main>
        <aside className={'preview-pane ' + (mobilePreview ? 'mobile-show' : '')}>
          <div className="preview-title">
            <Smartphone size={15} />
            <span>Pratinjau langsung</span>
          </div>
          <div className="phone-frame">
            <Directory preview page={previewPage(page, editor.draft, editor.order)} />
          </div>
        </aside>
      </div>
      {editor.blocker.state === 'blocked' && (
        <Dialog title="Tinggalkan editor?" onClose={() => editor.blocker.reset()}>
          <p>
            {editor.busy
              ? 'Tunggu hingga proses selesai.'
              : 'Perubahan yang belum disimpan akan dibuang.'}
          </p>
          <div className="button-row">
            <Button onClick={() => editor.blocker.reset()}>Tetap di sini</Button>
            <Button
              variant="primary"
              disabled={editor.busy}
              onClick={() => editor.blocker.proceed()}
            >
              Tinggalkan
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
export default function StudioPage({ local = false, section }) {
  const { loading, allowed, session, error, retry } = useOwner()
  if (local && localStudio) return <Studio key={section} section={section} local userId="local" />
  if (loading) return <LoadingPage label="Memeriksa sesi…" />
  if (error) return <StatusPage title="Gagal memeriksa akses" retry={retry} />
  if (!allowed) return <Navigate to="/admin/login" replace />
  return <Studio key={section} section={section} userId={session.user.id} />
}
