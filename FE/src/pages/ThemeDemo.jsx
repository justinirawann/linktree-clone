import { useState } from 'react'
import { Briefcase, ChevronRight, Link2, Mail } from 'lucide-react'
import { ChannelIcon } from '../shared/ui/ChannelIcon'
import './theme-demo.css'

const THEMES = [
  { id: 'lavender', label: 'Lavender' },
  { id: 'rose', label: 'Mawar' },
  { id: 'peach', label: 'Peach' },
  { id: 'honey', label: 'Madu' },
  { id: 'lime', label: 'Lime' },
  { id: 'mint', label: 'Mint' },
  { id: 'sky', label: 'Biru langit' },
  { id: 'sand', label: 'Pasir' },
  { id: 'navy', label: 'Biru malam', dark: true },
  { id: 'dark', label: 'Gelap', dark: true },
]
const DEMO_LINKS = [
  { label: 'Portofolio', icon: <Briefcase size={17} aria-hidden="true" /> },
  { label: 'Instagram', icon: <ChannelIcon name="instagram" size={17} /> },
  { label: 'Hubungi saya', icon: <Mail size={17} aria-hidden="true" /> },
]

export function ThemeDemo() {
  const [theme, setTheme] = useState(THEMES[0])

  return (
    <section className="ly-demo" id="contoh" aria-label="Demo tema Linkfy">
      <div className="ly-orbit" aria-hidden="true" />
      <div className="ly-stage-label">
        <span /> Demo halaman
      </div>
      <div className="ly-phone" data-theme={theme.id}>
        <div className="ly-phone-top">
          <span className="ly-phone-address">
            <Link2 size={13} aria-hidden="true" /> /ruang-studio
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
          {DEMO_LINKS.map(({ label, icon }) => (
            <li key={label}>
              {icon}
              <span>{label}</span>
              <ChevronRight size={15} aria-hidden="true" />
            </li>
          ))}
        </ul>
        <div className="ly-phone-footer">
          <img
            src={theme.dark ? '/linkfy-ly-white.svg' : '/linkfy-ly-black.svg'}
            width="28"
            height="28"
            alt="Linkfy"
          />
        </div>
      </div>
      <fieldset className="ly-theme-picker">
        <legend>Coba tema</legend>
        <div className="ly-theme-swatches">
          {THEMES.map((option) => (
            <label
              key={option.id}
              title={option.label}
              className="ly-theme-option"
              data-theme={option.id}
            >
              <input
                type="radio"
                name="demo-theme"
                value={option.id}
                checked={theme.id === option.id}
                onChange={() => setTheme(option)}
              />
              <span className="ly-sr-only">{option.label}</span>
              <i aria-hidden="true" />
            </label>
          ))}
        </div>
        <p className="ly-theme-name">{theme.label}</p>
      </fieldset>
    </section>
  )
}
