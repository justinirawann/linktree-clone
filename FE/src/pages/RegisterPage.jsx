import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import { auth, useSession } from '../features/auth'
import { hasSupabase } from '../shared/lib/env'
import { InputError } from '../shared/lib/rules'
import { Button, Field } from '../shared/ui/Controls'
import { AccountLayout } from './AccountLayout'
import { PasswordInput } from '../shared/ui/PasswordInput'

function registrationMessage(error) {
  if (error instanceof InputError) return error.message
  if (error?.code === 'signup_disabled') return 'Pendaftaran publik belum diaktifkan.'
  return 'Pendaftaran gagal. Periksa email dan pastikan kata sandimu memenuhi syarat.'
}

export default function RegisterPage() {
  const session = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const registration = useMutation({ mutationFn: () => auth.register(email.trim(), password) })
  if (session || registration.data?.session) return <Navigate to="/dashboard" replace />

  return (
    <AccountLayout
      variant="register"
      title={
        <>
          Buat akun <em>Linkfy.</em>
        </>
      }
      description={
        registration.isSuccess ? undefined : 'Daftar untuk membuat halaman tautan milikmu sendiri.'
      }
    >
      {!hasSupabase ? (
        <p>Pendaftaran memerlukan koneksi Supabase.</p>
      ) : registration.isSuccess ? (
        <p role="status" className="notice">
          Cek email untuk mengonfirmasi akunmu. Setelah dikonfirmasi, masuk untuk membuat halaman
          Linkfy.
        </p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!registration.isPending) registration.mutate()
          }}
        >
          <fieldset disabled={registration.isPending}>
            <Field label="Email">
              {(props) => (
                <input
                  {...props}
                  type="email"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </Field>
            <Field label="Kata sandi" hint="Minimal 8 karakter.">
              {(props) => (
                <PasswordInput
                  {...props}
                  autoComplete="new-password"
                  placeholder="Buat kata sandi"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              )}
            </Field>
            <Button variant="primary" type="submit">
              {registration.isPending ? 'Mendaftarkan…' : 'Daftar'}{' '}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Button>
          </fieldset>
        </form>
      )}
      {registration.isError && (
        <p role="alert" className="notice">
          {registrationMessage(registration.error)}
        </p>
      )}
      <Link className="account-switch" to="/admin/login">
        Sudah punya akun? <strong>Masuk</strong>
      </Link>
    </AccountLayout>
  )
}
