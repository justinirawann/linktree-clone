import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LinkfyLogo } from '../shared/ui/LinkfyLogo'
import { LinkSculpture } from '../shared/ui/LinkSculpture'
import './account.css'

export function AccountLayout({ variant, title, description, children }) {
  const registering = variant === 'register'
  return (
    <div className="linkfy-ui account-page" data-view={variant}>
      <header className="account-header">
        <LinkfyLogo />
        <Link to="/">
          <ArrowLeft size={15} aria-hidden="true" /> Beranda
        </Link>
      </header>
      <main className="account-main">
        <section className="account-form" aria-labelledby="account-title">
          <h1 id="account-title">{title}</h1>
          {description && <p className="account-description">{description}</p>}
          {children}
        </section>
        <div className="account-visual" aria-hidden="true">
          <div className="account-visual-copy">
            {registering ? (
              <>
                Halaman baru,
                <br />
                <em>ceritamu.</em>
              </>
            ) : (
              <>
                Satu link.
                <br />
                <em>Semua tujuan.</em>
              </>
            )}
          </div>
          <LinkSculpture />
        </div>
      </main>
      <footer className="account-footer">
        <small>© {new Date().getFullYear()} Linkfy</small>
      </footer>
    </div>
  )
}
