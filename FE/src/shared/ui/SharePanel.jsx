import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Copy, Download, Share2 } from 'lucide-react'
import { publicPageUrl } from '../lib/env'
import { createProfileQr } from '../lib/profileQr'
import { Button } from './Controls'
import './share-panel.css'

const QR_VARIANTS = [
  { value: 'black', label: 'Hitam' },
  { value: 'white', label: 'Putih' },
]

export default function SharePanel({
  name,
  url = publicPageUrl,
  qrFilename = 'core-consign-qr.png',
  logoSrc,
  isLogoLoading = false,
}) {
  const [message, setMessage] = useState(''),
    [copied, setCopied] = useState(false)
  const [qrVariant, setQrVariant] = useState('black')
  const [qrBackground, setQrBackground] = useState('solid')
  const urlInput = useRef(null)
  const qr = useQuery({
    queryKey: ['qr', url, logoSrc, qrVariant, qrBackground],
    enabled: Boolean(url) && !isLogoLoading,
    queryFn: () => createProfileQr(url, logoSrc, { variant: qrVariant, background: qrBackground }),
  })
  const qrCode = isLogoLoading ? undefined : qr.data
  const suffix =
    (qrVariant === 'white' ? '-putih' : '') + (qrBackground === 'transparent' ? '-transparan' : '')
  const downloadName = suffix ? qrFilename.replace(/\.png$/i, '') + suffix + '.png' : qrFilename
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setMessage('Alamat publik disalin.')
    } catch {
      setMessage('Pilih dan salin alamat di bawah ini.')
      urlInput.current?.focus()
      urlInput.current?.select()
    }
  }
  async function share() {
    try {
      await navigator.share({ title: name, url })
    } catch (error) {
      if (error.name !== 'AbortError') await copy()
    }
  }
  if (!url)
    return (
      <p className="notice">
        Alamat publik belum diatur. Isi VITE_SITE_URL saat domain toko sudah siap untuk mengaktifkan
        berbagi dan QR.
      </p>
    )
  return (
    <div className="share-panel">
      <div className="share-qr">
        <div className="share-qr-preview" data-variant={qrVariant} data-background={qrBackground}>
          {qrCode && (
            <img
              src={qrCode.png}
              alt={qrCode.hasLogo ? 'Kode QR dengan foto profil ' + name : 'Kode QR ' + name}
              width="180"
              height="180"
            />
          )}
          {(isLogoLoading || qr.isPending) && <p role="status">Membuat kode QR…</p>}
          {!qrCode && !isLogoLoading && qr.isError && (
            <Button onClick={() => qr.refetch()}>Muat ulang QR</Button>
          )}
        </div>
        <div className="share-qr-colors" role="group" aria-label="Warna kode QR">
          {QR_VARIANTS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              data-variant={value}
              aria-pressed={qrVariant === value}
              onClick={() => setQrVariant(value)}
            >
              <span aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        <label className="share-qr-background">
          Latar PNG
          <select value={qrBackground} onChange={(event) => setQrBackground(event.target.value)}>
            <option value="solid">Solid</option>
            <option value="transparent">Transparan</option>
          </select>
        </label>
      </div>
      <div className="share-details">
        {logoSrc && qrCode && !qrCode.hasLogo && (
          <p role="status">Foto belum bisa dimuat. Kode QR biasa tetap tersedia.</p>
        )}
        <label>
          Alamat publik
          <input ref={urlInput} readOnly value={url} onFocus={(e) => e.target.select()} />
        </label>
        <div className="button-row">
          <Button onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}Salin tautan
          </Button>
          {navigator.share && (
            <Button onClick={share}>
              <Share2 size={16} />
              Bagikan
            </Button>
          )}
          {qrCode && (
            <a className="btn secondary" href={qrCode.png} download={downloadName}>
              <Download size={16} />
              Unduh QR
            </a>
          )}
        </div>
        <p role="status">{message}</p>
      </div>
    </div>
  )
}
