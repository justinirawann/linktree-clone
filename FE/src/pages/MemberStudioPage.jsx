import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  Globe,
  Link2,
  LogOut,
  Palette,
  Save,
  ScanLine,
  Smartphone,
  UserRound,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { auth, useSession } from '../features/auth'
import {
  MemberLinks,
  MemberAppearance,
  memberDirectory,
  memberLinkUrl,
  memberPagePath,
  memberPageUrl,
  members,
  useMemberAvatar,
} from '../features/members'
import { ChannelIcon, Directory } from '../features/storefront'
import { EMPTY_LINK } from '../shared/lib/defaults'
import { hasSupabase } from '../shared/lib/env'
import { linkSchema } from '../shared/lib/rules'
import { Button, Dialog, Field, StatusPage } from '../shared/ui/Controls'
import { LinkfyLogo } from '../shared/ui/LinkfyLogo'
import { ImageField } from '../shared/ui/ImageField'
import { EditorHeading } from '../shared/ui/EditorHeading'
import SharePanel from '../shared/ui/SharePanel'
import { useEditor } from './studio/useEditor'
import './members.css'
import './studio/editor.css'
import './studio/member-editor.css'

const EDITOR_KEY = 'member-editor'
function CreatePage({ userId }) {
  const cache = useQueryClient()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const create = useMutation({
    mutationFn: () => members.create(slug, name),
    onSuccess: (page) => cache.setQueryData([EDITOR_KEY, userId], page),
  })

  return (
    <section className="editor-panel editor-surface member-create">
      <EditorHeading icon={UserRound}>Buat halamanmu</EditorHeading>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!create.isPending) create.mutate()
        }}
      >
        <fieldset disabled={create.isPending}>
          <Field label="Nama profil">
            {(props) => (
              <input
                {...props}
                required
                maxLength={60}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            )}
          </Field>
          <Field
            label="Alamat halaman"
            hint="3–32 karakter. Gunakan huruf kecil, angka, atau tanda hubung di antara kata."
          >
            {(props) => (
              <input
                {...props}
                required
                minLength={3}
                maxLength={32}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                value={slug}
                onChange={(event) => setSlug(event.target.value.toLowerCase())}
              />
            )}
          </Field>
          {slug && <p className="muted">Alamatmu {memberPagePath(slug)}</p>}
          {create.isError && (
            <p role="alert" className="error-text">
              {create.error.code === '23505'
                ? 'Alamat ini sudah dipakai. Pilih alamat lain.'
                : 'Halaman belum bisa dibuat. Periksa nama dan alamat, lalu coba lagi.'}
            </p>
          )}
          <Button variant="primary" type="submit">
            Buat halaman
          </Button>
        </fieldset>
      </form>
    </section>
  )
}

function EditPage({ page, userId }) {
  const editor = useEditor(userId, EDITOR_KEY)
  const location = useLocation()
  useEffect(() => {
    const section = document.getElementById(location.hash.slice(1))
    if (section) {
      section.focus({ preventScroll: true })
      section.scrollIntoView({ block: 'start' })
    }
  }, [location])
  const [validation, setValidation] = useState('')
  const [issue, setIssue] = useState(null)
  const draft = editor.draft?.value ?? page
  const avatar = useMemberAvatar(page.avatar_path)
  const draftAvatar = draft.avatarImage?.preview || (draft.avatar_path ? avatar.data : '')
  function update(fields) {
    setValidation('')
    setIssue(null)
    editor.edit({ changed: true, value: { ...draft, ...fields } })
  }
  function submit(event) {
    event.preventDefault()
    setValidation('')
    setIssue(null)
    const links = []
    const form = event.currentTarget
    function flag(link, field, message) {
      setIssue({ id: link.id, field, message })
      form.elements.namedItem(link.id + '-' + field)?.focus()
    }
    for (const link of draft.links) {
      if (!link.title.trim()) {
        flag(link, 'title', 'Isi judul tautan.')
        return
      }
      const destination = memberLinkUrl(link.url)
      if (destination.error) {
        flag(link, 'url', destination.error)
        return
      }
      const parsed = linkSchema.safeParse({ ...EMPTY_LINK, ...link, url: destination.url })
      if (!parsed.success) {
        setValidation(parsed.error.issues[0].message)
        return
      }
      links.push({ ...parsed.data, id: link.id })
    }
    if (draft.published && !draft.links.some((link) => link.is_active)) {
      setValidation('Aktifkan minimal satu tautan sebelum publikasi.')
      return
    }
    editor.run(
      () =>
        members.save(
          { ...draft, links },
          {
            image: draft.avatarImage,
            previousAvatarPath: page.avatar_path,
          },
        ),
      {
        after: () => editor.edit(null),
      },
    )
  }

  return (
    <div className="member-layout">
      <div className="member-editor editor-surface">
        <nav className="member-shortcuts" aria-label="Bagian editor">
          <Link
            to="#profil"
            aria-current={['', '#profil'].includes(location.hash) ? 'location' : undefined}
          >
            <UserRound size={16} />
            Profil
          </Link>
          <Link
            to="#tampilan"
            aria-current={location.hash === '#tampilan' ? 'location' : undefined}
          >
            <Palette size={16} />
            Tampilan
          </Link>
          <Link to="#tautan" aria-current={location.hash === '#tautan' ? 'location' : undefined}>
            <Link2 size={16} />
            Tautan
          </Link>
          <Link
            to="#pratinjau"
            className="preview-shortcut"
            aria-current={location.hash === '#pratinjau' ? 'location' : undefined}
          >
            <Smartphone size={16} />
            Pratinjau
          </Link>
        </nav>
        <form className="member-form" onSubmit={submit}>
          <fieldset disabled={editor.busy}>
            <section className="editor-panel member-section" id="profil" tabIndex={-1}>
              <EditorHeading icon={UserRound}>Profil dan halaman</EditorHeading>
              <div className="editor-profile-grid">
                <div className="editor-profile-photo">
                  <ImageField
                    label="Foto profil"
                    folder="avatars"
                    path={draft.avatar_path}
                    image={draft.avatarImage}
                    imageSrc={draftAvatar || ''}
                    onChange={(avatarImage, avatar_path) => update({ avatarImage, avatar_path })}
                    onProcessing={editor.setProcessing}
                  />
                  {draft.avatar_path && avatar.isError && (
                    <p className="muted" role="status">
                      Foto tersimpan belum bisa dimuat.
                    </p>
                  )}
                </div>
                <div className="editor-profile-text">
                  <Field label="Nama profil">
                    {(props) => (
                      <input
                        {...props}
                        required
                        maxLength={60}
                        value={draft.display_name}
                        onChange={(event) => update({ display_name: event.target.value })}
                      />
                    )}
                  </Field>
                  <Field label="Bio" hint={draft.bio.length + '/160 karakter'}>
                    {(props) => (
                      <textarea
                        {...props}
                        rows={3}
                        placeholder="Ceritakan sedikit tentangmu atau tokomu"
                        maxLength={160}
                        value={draft.bio}
                        onChange={(event) => update({ bio: event.target.value })}
                      />
                    )}
                  </Field>
                </div>
              </div>
            </section>
            <MemberAppearance preset={draft.theme} settings={draft.appearance} onChange={update} />
            <MemberLinks
              linkIcon={ChannelIcon}
              links={draft.links}
              issue={issue}
              preset={draft.theme}
              appearance={draft.appearance}
              linkStyles={draft.link_styles}
              onStyleChange={(link_styles) => update({ link_styles })}
              onChange={(links) => update({ links })}
            />
            <div className="member-save">
              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(event) => update({ published: event.target.checked })}
                />{' '}
                Publikasikan halaman
              </label>
              <Button
                variant="primary"
                type="submit"
                disabled={!editor.dirty}
                aria-busy={editor.busy}
              >
                <Save size={16} aria-hidden="true" />
                {editor.busy ? 'Menyimpan…' : 'Simpan halaman'}
              </Button>
            </div>
            {validation && (
              <p role="alert" className="error-text">
                {validation}
              </p>
            )}
          </fieldset>
        </form>
        {editor.feedback && (
          <p
            className={'notice' + (editor.feedback.error ? ' error-notice' : '')}
            role={editor.feedback.error ? 'alert' : 'status'}
          >
            {editor.feedback.message}
          </p>
        )}
        {editor.feedback?.conflict && <Button onClick={editor.reload}>Muat versi terbaru</Button>}
        {page.published && (
          <section className="editor-panel">
            <EditorHeading icon={ScanLine}>Bagikan halaman</EditorHeading>
            <Link className="member-public-link" to={memberPagePath(page.slug)}>
              Lihat halaman publik <ArrowUpRight size={15} />
            </Link>
            <SharePanel
              name={page.display_name}
              url={memberPageUrl(page.slug)}
              qrFilename="linkfy-qr.png"
              logoSrc={avatar.data}
              isLogoLoading={Boolean(page.avatar_path) && avatar.isPending}
            />
          </section>
        )}
      </div>
      <aside id="pratinjau" className="member-preview" tabIndex={-1}>
        <h2>
          <Smartphone size={16} aria-hidden="true" />
          Pratinjau langsung
        </h2>
        <div className="member-preview-device">
          <Directory
            page={memberDirectory(
              {
                ...draft,
                links: draft.links.map((link) => ({
                  ...link,
                  url: memberLinkUrl(link.url).url || '',
                })),
              },
              draftAvatar,
            )}
            member
            preview
          />
        </div>
        <Link className="member-back-editor" to="#profil">
          Kembali ke editor
        </Link>
      </aside>
      {editor.blocker.state === 'blocked' && (
        <Dialog title="Tinggalkan perubahan?" onClose={editor.blocker.reset}>
          <p>Perubahan yang belum disimpan akan hilang.</p>
          <div className="button-row">
            <Button onClick={editor.blocker.reset}>Tetap di sini</Button>
            <Button variant="primary" disabled={editor.busy} onClick={editor.blocker.proceed}>
              Tinggalkan
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default function MemberStudioPage() {
  const session = useSession()
  const userId = session?.user.id
  const page = useQuery({
    queryKey: [EDITOR_KEY, userId],
    queryFn: members.read,
    enabled: Boolean(userId),
    retry: false,
  })
  const logout = useMutation({ mutationFn: auth.logout })
  if (!hasSupabase || session === null) return <Navigate to="/admin/login" replace />
  if (session === undefined || page.isPending)
    return <StatusPage className="linkfy-ui" brand={<LinkfyLogo />} title="Memuat studio…" />
  if (page.isError)
    return (
      <StatusPage
        className="linkfy-ui"
        brand={<LinkfyLogo />}
        title="Studio gagal dimuat"
        retry={page.refetch}
      >
        <Button onClick={() => logout.mutate()}>Keluar</Button>
      </StatusPage>
    )

  return (
    <main className="member-studio linkfy-ui">
      <header className="studio-head">
        <LinkfyLogo />
        <Button disabled={logout.isPending} onClick={() => logout.mutate()}>
          <LogOut size={16} />
          Keluar
        </Button>
      </header>
      <div className="member-shell">
        <div className="member-hero">
          <div>
            <h1>
              Studio <em>Linkfy</em>
            </h1>
            {page.data && (
              <div className="member-page-meta">
                <span className="member-address">
                  <Link2 size={15} />
                  {memberPagePath(page.data.slug)}
                </span>
                <span className="member-status" data-published={page.data.published}>
                  {page.data.published ? <Check size={13} /> : <Globe size={13} />}
                  {page.data.published ? 'Dipublikasikan' : 'Draft'}
                </span>
              </div>
            )}
          </div>
          <div className="member-hero-art" aria-hidden="true">
            <img src="/linkfy-chain.webp" alt="" width="960" height="960" />
          </div>
        </div>
        {logout.isError && <p role="alert">Gagal keluar. Coba lagi.</p>}
        {page.data ? (
          <EditPage key={userId} page={page.data} userId={userId} />
        ) : (
          <CreatePage userId={userId} />
        )}
      </div>
    </main>
  )
}
