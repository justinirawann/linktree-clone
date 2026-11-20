import { useState } from 'react'
import { Globe, LogOut, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { auth } from '../../features/auth'
import { siteRepository } from '../../features/site'
import { Button, Dialog } from '../../shared/ui/Controls'
import { EditorHeading } from '../../shared/ui/EditorHeading'
import SharePanel from '../../shared/ui/SharePanel'
export function Settings({ page, editor, local }) {
  const [confirm, setConfirm] = useState(false),
    navigate = useNavigate()
  const published = page.profile.is_published
  const logout = useMutation({
    mutationFn: async () => {
      if (!local) await auth.logout()
    },
    onSuccess: () => navigate(local ? '/' : '/admin/login', { replace: true }),
  })
  return (
    <div className="settings-stack">
      <section className="editor-panel">
        <EditorHeading icon={Globe}>Publikasi halaman</EditorHeading>
        <p className="muted">
          {published
            ? 'Pengunjung dapat melihat profil dan semua tautan aktif.'
            : 'Halaman masih berupa draft. Aktifkan minimal satu tautan untuk memublikasikannya.'}
        </p>
        <Button variant="primary" disabled={editor.busy} onClick={() => setConfirm(true)}>
          {published ? 'Tarik publikasi' : 'Publikasikan halaman'}
        </Button>
      </section>
      <section className="editor-panel">
        <EditorHeading icon={Share2}>Bagikan toko</EditorHeading>
        <SharePanel name={page.profile.store_name} />
      </section>
      <Button disabled={editor.busy || logout.isPending} onClick={() => logout.mutate()}>
        <LogOut size={16} />
        {local ? 'Keluar dari studio lokal' : 'Keluar dari akun'}
      </Button>
      {logout.isError && (
        <p role="alert" className="error-text">
          Gagal keluar. Periksa koneksi dan coba lagi.
        </p>
      )}
      {confirm && (
        <Dialog
          title={published ? 'Tarik publikasi?' : 'Publikasikan halaman?'}
          onClose={() => {
            if (!editor.busy) setConfirm(false)
          }}
        >
          <p>
            {published
              ? 'Profil dan tautan toko akan disembunyikan.'
              : 'Profil toko dan tautan aktif akan terlihat di halaman publik.'}
            {local && ' Perubahan ini berlaku di browser ini.'}
          </p>
          {editor.feedback?.error && (
            <p className="error-text" role="alert">
              {editor.feedback.message}
            </p>
          )}
          <div className="button-row">
            <Button disabled={editor.busy} onClick={() => setConfirm(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              disabled={editor.busy}
              onClick={() =>
                editor.run(() => siteRepository.publish(!published, page.profile.revision), {
                  after: () => setConfirm(false),
                })
              }
            >
              {published ? 'Ya, tarik publikasi' : 'Ya, publikasikan'}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
