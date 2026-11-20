import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { AssetImage } from './AssetImage'
import { prepareImage } from '../lib/assetRepository'
import { Button } from './Controls'
export function ImageField({ label, folder, path, image, imageSrc, onChange, onProcessing }) {
  const [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    fileInput = useRef(null)
  async function choose(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setLoading(true)
    onProcessing(true)
    try {
      const prepared = await prepareImage(file, folder)
      onChange(prepared, path)
    } catch (e) {
      setError(e.message || 'Gagal membaca gambar.')
    } finally {
      setLoading(false)
      onProcessing(false)
    }
  }
  return (
    <div className="image-field" data-folder={folder}>
      <span className="field-label">{label}</span>
      <div className="button-row">
        <span className="image-sample">
          <AssetImage
            path={imageSrc === undefined ? path : undefined}
            preview={image?.preview ?? imageSrc}
            size={54}
            fallback={<ImagePlus size={22} />}
          />
        </span>
        <input
          hidden
          ref={fileInput}
          type="file"
          aria-label={label}
          accept="image/png,image/jpeg,image/webp"
          onChange={choose}
        />
        <Button disabled={loading} onClick={() => fileInput.current?.click()}>
          {loading ? 'Memproses…' : 'Pilih gambar'}
        </Button>
        {(image || path) && (
          <Button disabled={loading} variant="text-btn" onClick={() => onChange(null, null)}>
            Hapus gambar
          </Button>
        )}
      </div>
      <small>PNG, JPEG, atau WebP · hingga 5 MB</small>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </div>
  )
}
