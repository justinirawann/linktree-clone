import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Copy, Download, Share2 } from 'lucide-react'
import { publicPageUrl } from '../lib/env'
import { createProfileQr } from '../lib/profileQr'
import { Button } from './Controls'
export default function SharePanel({
  name,
  url = publicPageUrl,
  qrFilename = 'core-consign-qr.png',
  logoSrc,
  isLogoLoading = false,
}) {
  const [message, setMessage] = useState(''),
    [copied, setCopied] = useState(false)
  const urlInput = useRef(null)
  const qr = useQuery({
    queryKey: ['qr', url, logoSrc],
    enabled: Boolean(url) && !isLogoLoading,
    queryFn: () => createProfileQr(url, logoSrc),
  })
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
      {qr.data && (
        <img
          src={qr.data.png}
          alt={qr.data.hasLogo ? 'Kode QR dengan foto profil ' + name : 'Kode QR ' + name}
          width="180"
          height="180"
        />
      )}
      {qr.isPending && <p role="status">Membuat kode QR…</p>}
      {logoSrc && qr.data && !qr.data.hasLogo && (
        <p role="status">Foto belum bisa dimuat. Kode QR biasa tetap tersedia.</p>
      )}
      {qr.isError && <Button onClick={() => qr.refetch()}>Muat ulang QR</Button>}
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
        {qr.data && (
          <a className="btn secondary" href={qr.data.png} download={qrFilename}>
            <Download size={16} />
            Unduh QR
          </a>
        )}
      </div>
      <p role="status">{message}</p>
    </div>
  )
}
