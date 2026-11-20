import { useState } from 'react'
import { Briefcase, ChevronRight, Link2, Mail } from 'lucide-react'
import { ChannelIcon } from '../shared/ui/ChannelIcon'
import './theme-demo.css'

const THEMES = [
  { id: 'lavender', label: 'Lavender', swatch: '#dcd1ff' },
  { id: 'lime', label: 'Lime', swatch: '#e9fa85' },
  { id: 'dark', label: 'Gelap', swatch: '#242137' },
]
const DEMO_LINKS = [
  { label: 'Portofolio', icon: <Briefcase size={17} aria-hidden="true" /> },
  { label: 'Instagram', icon: <ChannelIcon name="instagram" size={17} /> },
  { label: 'Hubungi saya', icon: <Mail size={17} aria-hidden="true" /> },
]

export function ThemeDemo() {
  const [theme, setTheme] = useState('lavender')

  return (
    <section className="ly-demo" id="contoh" aria-label="Demo tema Linkfy">
      <div className="ly-orbit" aria-hidden="true" />
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
