import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function PasswordInput(props) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye
  return (
    <span className="password-control">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        aria-label={visible ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
        onClick={() => setVisible(!visible)}
      >
        <Icon size={18} aria-hidden="true" />
      </button>
    </span>
  )
}
