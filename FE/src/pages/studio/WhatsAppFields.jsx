import { useState } from 'react'
import { Button, Field } from '../../shared/ui/Controls'
import { validUrl } from '../../shared/lib/rules'
export function WhatsAppFields({ onApply }) {
  const [number, setNumber] = useState(''),
    [message, setMessage] = useState(''),
    [error, setError] = useState('')
  function apply() {
    const digits = number
      .trim()
      .replace(/^\+/, '')
      .replace(/[ ()-]/g, '')
    if (!/^[1-9]\d{6,14}$/.test(digits)) {
      setError('Masukkan nomor internasional lengkap, diawali kode negara.')
      return
    }
    const url = 'https://wa.me/' + digits + (message ? '?text=' + encodeURIComponent(message) : '')
    if (!validUrl(url)) {
      setError('Persingkat pesan agar URL tujuan tetap valid.')
      return
    }
    setError('')
    onApply(url)
  }
  return (
    <details className="wa-fields">
      <summary>Buat tautan WhatsApp</summary>
      <div>
        <Field
          label="Nomor WhatsApp"
          hint="Awali dengan kode negara, misalnya +62 untuk Indonesia."
        >
          {(p) => (
            <input {...p} type="tel" value={number} onChange={(e) => setNumber(e.target.value)} />
          )}
        </Field>
        <Field label="Pesan awal (opsional)">
          {(p) => (
            <textarea
              {...p}
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          )}
        </Field>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <Button onClick={apply}>Gunakan URL WhatsApp</Button>
      </div>
    </details>
  )
}
