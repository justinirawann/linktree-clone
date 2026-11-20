import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { KeyRound, LogIn } from 'lucide-react'
import { auth, useOwner } from '../features/auth'
import { hasSupabase, localStudio } from '../shared/lib/env'
import { Button, Field } from '../shared/ui/Controls'
import { LinkfyLogo } from '../shared/ui/LinkfyLogo'
import { PasswordInput } from '../shared/ui/PasswordInput'
import { InputError } from '../shared/lib/rules'
export default function AuthPage({ reset = false }) {
  const { session, allowed, loading, error: ownerError, retry } = useOwner(),
    navigate = useNavigate()
  const [recover, setRecover] = useState(false),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('')
  if (session && !loading && !ownerError && !reset)
    return <Navigate to={allowed ? '/admin/dashboard' : '/dashboard'} replace />
  const title = reset ? 'Ubah kata sandi' : recover ? 'Pulihkan akun' : 'Masuk ke studio'
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setNotice('')
    try {
      if (reset) {
        await auth.changePassword(password)
        navigate(allowed ? '/admin/dashboard' : '/dashboard', { replace: true })
      } else if (recover) {
        await auth.recover(email)
        setNotice('Jika alamat terdaftar, periksa email untuk tautan pemulihan.')
      } else await auth.login(email, password)
    } catch (error) {
      setNotice(
        error instanceof InputError
          ? error.message
          : 'Permintaan gagal. Periksa isian dan koneksi kamu.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="auth-page linkfy-ui">
      <section className="auth-card">
        <LinkfyLogo />
        <h1>{title}</h1>
        {!hasSupabase ? (
          <>
            <p>
              Supabase belum terhubung.
              {localStudio
                ? ' Kamu bisa mencoba editor dengan data yang tersimpan di browser ini.'
                : ''}
            </p>
            {localStudio && (
              <Link className="btn primary" to="/studio/dashboard">
                Buka studio lokal
              </Link>
            )}
          </>
        ) : loading ? (
          <p role="status">Memeriksa sesi…</p>
        ) : ownerError ? (
          <Button onClick={retry}>Coba periksa akses lagi</Button>
        ) : reset && !session ? (
          <>
            <p>Buka tautan pemulihan dari email untuk mengatur kata sandi.</p>
            <Link to="/admin/login">Kembali ke login</Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <fieldset disabled={busy}>
              {!reset && (
                <Field label="Email">
                  {(p) => (
                    <input
                      {...p}
                      type="email"
                      placeholder="nama@email.com"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  )}
                </Field>
              )}
              {(!recover || reset) && (
                <Field label={reset ? 'Kata sandi baru' : 'Kata sandi'}>
                  {(p) => (
                    <PasswordInput
                      {...p}
                      autoComplete={reset ? 'new-password' : 'current-password'}
                      minLength={reset ? 8 : undefined}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  )}
                </Field>
              )}
              <Button variant="primary" type="submit">
                {recover || reset ? <KeyRound size={16} /> : <LogIn size={16} />}{' '}
                {busy
                  ? 'Memproses…'
                  : reset
                    ? 'Simpan kata sandi'
                    : recover
                      ? 'Kirim tautan pemulihan'
                      : 'Masuk'}
              </Button>
            </fieldset>
            {!reset && (
              <Button
                variant="text-btn"
                onClick={() => {
                  setRecover(!recover)
                  setNotice('')
                }}
              >
                {recover ? 'Kembali ke login' : 'Lupa kata sandi?'}
              </Button>
            )}
          </form>
        )}
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
        {!reset && hasSupabase && (
          <Link className="back-store" to="/register">
            Buat akun Linkfy
          </Link>
        )}
        <Link className="back-store" to="/">
          Kembali ke Linkfy
        </Link>
      </section>
    </main>
  )
}
