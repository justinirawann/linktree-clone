import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Link2,
  Palette,
  QrCode,
  Sparkle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { localStudio } from '../shared/lib/env'
import { LinkfyLogo } from '../shared/ui/LinkfyLogo'
import { LinkSculpture } from '../shared/ui/LinkSculpture'
import { ThemeDemo } from './ThemeDemo'
import './landing.css'

const STUDIO_PATH = localStudio ? '/studio/dashboard' : '/register'
const STUDIO_LABEL = localStudio ? 'Buka Studio' : 'Buat halamanmu'
const CHANNELS = [
  ['WhatsApp', '/whatsapp_white_vector.svg'],
  ['Shopee', '/shopee_white_vector.svg'],
  ['Tokopedia', '/tokopedia_logo_vectorized_white_1x1.svg'],
  ['Toco', '/toco_white_vector.svg'],
  ['LINE', '/line_white_original_vector.svg'],
]
const FEATURES = [
  {
    title: 'Susun tautanmu',
    text: 'Urutkan toko, portofolio, dan media sosial sesuai prioritasmu.',
    Icon: Link2,
  },
  {
    title: 'Beri sentuhan pribadi',
    text: 'Pilih warna, ikon, dan bentuk tombol yang paling kamu suka.',
    Icon: Palette,
  },
  {
    title: 'Bagikan di mana saja',
    text: 'Pasang link di bio atau cetak kode QR untuk kemasan dan kartu nama.',
    Icon: QrCode,
  },
]

function StudioLink() {
  return (
    <Link className="ly-cta" to={STUDIO_PATH}>
      {STUDIO_LABEL}
      <span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </span>
    </Link>
  )
}

export default function LandingPage() {
  return (
    <div className="ly-page" id="atas">
      <header className="ly-header">
        <div className="ly-shell ly-nav">
          <LinkfyLogo />
          <nav aria-label="Navigasi utama">
            <a href="#fitur">Fitur</a>
            <a href="#contoh">Demo</a>
            <a href="#cara-kerja">Cara kerja</a>
          </nav>
          <div className="ly-entry">
            <Link to="/admin/login">Masuk</Link>
            <Link className="ly-nav-register" to="/register">
              Daftar <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>
      <main>
        <section className="ly-hero" aria-labelledby="linkfy-title">
          <div className="ly-shell ly-hero-inner">
            <div className="ly-hero-copy">
              <p className="ly-kicker">
                <Sparkle size={15} fill="currentColor" aria-hidden="true" /> Link in bio
              </p>
              <h1 id="linkfy-title">
                Satu link.
                <br />
                Semua <em>tujuan.</em>
              </h1>
              <p className="ly-intro">
                Satukan toko, karya, dan media sosialmu di satu halaman yang terasa seperti kamu.
              </p>
              <div className="ly-actions">
                <StudioLink />
                <a className="ly-demo-jump" href="#contoh">
                  Coba demo <ArrowDown size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
            <LinkSculpture />
          </div>
        </section>
        <div className="ly-channels">
          <div className="ly-shell ly-channel-inner">
            <p>
              Tautkan kanal <br />
              favoritmu
            </p>
            <ul>
              {CHANNELS.map(([name, src]) => (
                <li key={name}>
                  <img src={src} alt="" width="32" height="32" />
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <section className="ly-shell ly-features" id="fitur" aria-labelledby="features-title">
          <div className="ly-feature-copy">
            <p className="ly-kicker">
              <Palette size={16} aria-hidden="true" /> Tampilan halaman
            </p>
            <h2 id="features-title">
              Gayamu punya
              <br />
              <em>tempat sendiri.</em>
            </h2>
            <ul>
              {FEATURES.map(({ title, text, Icon }) => (
                <li key={title}>
                  <i>
                    <Icon size={20} aria-hidden="true" />
                  </i>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <ThemeDemo />
        </section>
        <section className="ly-flow" id="cara-kerja" aria-labelledby="flow-title">
          <div className="ly-shell ly-flow-inner">
            <div>
              <h2 id="flow-title">
                Mulai dari <em>sini.</em>
              </h2>
              <StudioLink />
            </div>
            <ol>
              <li>
                <strong>Isi profil</strong>
                <span>Tambahkan nama, foto, dan bio singkat.</span>
              </li>
              <li>
                <strong>Susun tautan</strong>
                <span>Masukkan tujuan dan sesuaikan tampilannya.</span>
              </li>
              <li>
                <strong>Publikasikan</strong>
                <span>Bagikan halamanmu dengan tautan atau kode QR.</span>
              </li>
            </ol>
          </div>
        </section>
      </main>
      <footer className="ly-footer">
        <div className="ly-shell">
          <div className="ly-footer-main">
            <div>
              <LinkfyLogo light />
              <p>Satu halaman untuk semua tautanmu.</p>
            </div>
            <nav aria-label="Jelajahi Linkfy">
              <h2>Jelajahi</h2>
              <a href="#fitur">Fitur</a>
              <a href="#contoh">Demo tema</a>
              <a href="#cara-kerja">Cara kerja</a>
            </nav>
            <nav aria-label="Akun Linkfy">
              <h2>Akun</h2>
              <Link to="/admin/login">Masuk</Link>
              <Link to="/register">
                Daftar <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </nav>
          </div>
          <div className="ly-footer-base">
            <small>© {new Date().getFullYear()} Linkfy</small>
            <a href="#atas">
              Kembali ke atas <ArrowUp size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
