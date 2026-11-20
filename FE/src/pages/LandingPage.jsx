import { useState } from 'react'
import {
  ArrowUpRight,
  Briefcase,
  Camera,
  ChevronRight,
  Link2,
  Mail,
  Palette,
  QrCode,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { localStudio } from '../shared/lib/env'
import { PUBLIC_PAGE_PATH } from '../shared/lib/routes'
import { LinkfyLogo } from '../shared/ui/LinkfyLogo'
import './landing.css'

const STUDIO_PATH = localStudio ? '/studio/dashboard' : '/register'
const STUDIO_LABEL = localStudio ? 'Buka Studio' : 'Daftar'
const THEMES = [
  { id: 'lavender', label: 'Lavender', swatch: '#dcd1ff' },
  { id: 'lime', label: 'Lime', swatch: '#e9fa85' },
  { id: 'dark', label: 'Gelap', swatch: '#242137' },
]
const DEMO_LINKS = [
  { label: 'Portofolio', Icon: Briefcase },
  { label: 'Instagram', Icon: Camera },
  { label: 'Hubungi saya', Icon: Mail },
]
const FEATURES = [
  {
    title: 'Tautan dalam satu tempat',
    text: 'Susun tautan ke toko, media sosial, dan kontak sesuai urutan yang kamu mau.',
    Icon: Link2,
  },
  {
    title: 'Tampilan sesuai gayamu',
    text: 'Atur foto profil, warna, ikon, dan latar. Lihat hasilnya di Studio sebelum dipublikasikan.',
    Icon: Palette,
  },
  {
    title: 'Mudah dibagikan',
    text: 'Bagikan alamat halaman atau unduh kode QR untuk bio, kartu nama, dan kemasan.',
    Icon: QrCode,
  },
]

function ThemeDemo() {
  const [theme, setTheme] = useState('lavender')

  return (
    <section className="ly-demo" id="contoh" aria-label="Demo tema Linkfy">
      <div className="ly-orbit" aria-hidden="true" />
      <div className="ly-chain" aria-hidden="true" />
      <div className="ly-stage-label">
        <span /> Demo halaman
      </div>
      <div className="ly-phone" data-theme={theme}>
        <div className="ly-phone-top">
          <span className="ly-phone-address">
            <Link2 size={13} aria-hidden="true" /> /u/ruang-studio
          </span>
        </div>
        <div className="ly-phone-profile">
          <span className="ly-demo-avatar" aria-hidden="true">
            <i />
            <i />
          </span>
          <h2>Ruang Studio</h2>
          <p>Desain, foto, dan proyek kreatif.</p>
        </div>
        <ul className="ly-phone-links">
          {DEMO_LINKS.map(({ label, Icon }) => (
            <li key={label}>
              <Icon size={17} aria-hidden="true" />
              <span>{label}</span>
              <ChevronRight size={15} aria-hidden="true" />
            </li>
          ))}
        </ul>
        <div className="ly-phone-footer">
          <img
            src={theme === 'dark' ? '/linkfy-ly-white.svg' : '/linkfy-ly-black.svg'}
            width="28"
            height="28"
            alt="Linkfy"
          />
        </div>
      </div>
      <fieldset className="ly-theme-picker">
        <legend>Coba tema</legend>
        {THEMES.map(({ id, label, swatch }) => (
          <label key={id} title={label} className="ly-theme-option" style={{ '--swatch': swatch }}>
            <input
              type="radio"
              name="demo-theme"
              value={id}
              checked={theme === id}
              onChange={() => setTheme(id)}
            />
            <span className="ly-sr-only">{label}</span>
            <i aria-hidden="true" />
          </label>
        ))}
      </fieldset>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="ly-page">
      <header className="ly-header">
        <div className="ly-shell ly-nav">
          <LinkfyLogo />
          <nav aria-label="Navigasi Linkfy">
            <a href="#fitur">Fitur</a>
            <a href="#cara-kerja">Cara kerja</a>
          </nav>
          <Link className="ly-button ly-nav-action" to="/admin/login">
            Masuk <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <main className="ly-shell">
        <section className="ly-hero" aria-labelledby="linkfy-title">
          <div className="ly-hero-copy">
            <p className="ly-eyebrow">
              <Link2 size={17} aria-hidden="true" /> HALAMAN LINK DI BIO
            </p>
            <h1 id="linkfy-title">
              Satu link.
              <br />
              Semua <em>tujuan.</em>
            </h1>
            <p className="ly-intro">
              Satukan toko, media sosial, dan kontakmu di satu halaman yang gampang dibagikan.
            </p>
            <div className="ly-actions">
              <Link className="ly-button ly-button-primary" to={STUDIO_PATH}>
                {STUDIO_LABEL}
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
              <a className="ly-button ly-button-outline" href="#contoh">
                Coba demo
              </a>
            </div>
          </div>
          <ThemeDemo />
        </section>
        <section className="ly-features" id="fitur" aria-label="Fitur Linkfy">
          {FEATURES.map(({ title, text, Icon }) => (
            <article key={title}>
              <span className="ly-feature-icon">
                <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </section>
        <section className="ly-flow" id="cara-kerja" aria-labelledby="ly-flow-title">
          <div>
            <h2 id="ly-flow-title">Bikin halamanmu sendiri.</h2>
            <p>Atur semuanya dari Studio, lalu bagikan satu alamat.</p>
            <Link className="ly-button ly-button-primary" to={STUDIO_PATH}>
              {STUDIO_LABEL}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <ol>
            <li>
              <strong>Isi profil</strong>
              <span>Tambahkan nama, foto, dan bio singkat.</span>
            </li>
            <li>
              <strong>Susun tautan</strong>
              <span>Masukkan tujuan, pilih ikon, dan atur tampilannya.</span>
            </li>
            <li>
              <strong>Publikasikan</strong>
              <span>Salin alamat halamanmu atau bagikan lewat QR.</span>
            </li>
          </ol>
        </section>
      </main>
      <footer className="ly-footer">
        <div className="ly-shell">
          <LinkfyLogo light />
          <Link to={PUBLIC_PAGE_PATH}>Core Consign</Link>
        </div>
      </footer>
    </div>
  )
}
