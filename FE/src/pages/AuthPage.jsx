import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { auth, useOwner } from '../features/auth'
import { hasSupabase, localStudio } from '../shared/lib/env'
import { Button, Field } from '../shared/ui/Controls'
import { AccountLayout } from './AccountLayout'
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
  const mode = reset ? 'reset' : recover ? 'recover' : 'login'
  const headings = {
    login: (
      <>
        Masuk ke <em>studio.</em>
      </>
    ),
    recover: (
      <>
        Pulihkan <em>akun.</em>
      </>
    ),
    reset: (
      <>
        Ubah kata <em>sandi.</em>
      </>
    ),
  }
  const descriptions = {
    login: 'Kelola profil dan semua tautanmu dari satu tempat.',
    recover: 'Masukkan email akunmu untuk mendapat tautan pemulihan.',
    reset: 'Pilih kata sandi baru untuk akun Linkfy milikmu.',
  }
  const submitLabels = {
    login: 'Masuk',
    recover: 'Kirim tautan pemulihan',
    reset: 'Simpan kata sandi',
  }
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
    <AccountLayout variant="login" title={headings[mode]} description={descriptions[mode]}>
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
          <Link className="account-switch" to="/admin/login">
            <strong>Kembali ke login</strong>
          </Link>
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
                    placeholder={reset ? 'Minimal 8 karakter' : 'Masukkan kata sandi'}
                    minLength={reset ? 8 : undefined}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
              </Field>
            )}
            <Button variant="primary" type="submit">
              {busy ? 'Memproses…' : submitLabels[mode]}{' '}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Button>
          </fieldset>
          {!reset && (
            <Button
              variant="text-btn"
              disabled={busy}
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
        <Link className="account-switch" to="/register">
          Belum punya akun? <strong>Daftar</strong>
        </Link>
      )}
    </AccountLayout>
  )
}
