import { Link } from 'react-router-dom'

export function LinkfyLogo({ light = false }) {
  return (
    <Link className="linkfy-logo" to="/" aria-label="Linkfy — beranda">
      <span className={light ? 'linkfy-mark linkfy-mark-dark' : 'linkfy-mark'}>
        <img
          src={light ? '/linkfy-ly-white.svg' : '/linkfy-ly-black.svg'}
          width="40"
          height="40"
          alt=""
        />
      </span>
      <span aria-hidden="true">Linkfy</span>
    </Link>
  )
}
