import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Check, Copy, Globe, Share2 } from 'lucide-react'
import { readLinkMetadata } from './linkMetadata'

export default function LinkPreview({ link }) {
  const [copyState, setCopyState] = useState('')
  const [failedImage, setFailedImage] = useState('')
  const query = useQuery({
    queryKey: ['link-metadata', link.url],
    queryFn: ({ signal }) => readLinkMetadata(link.url, signal),
    staleTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const data = query.data
  const domain = new URL(link.url).hostname
  const image = [data?.image?.url, data?.logo?.url].find((url) => url?.startsWith('https://'))
  const title = data?.title?.trim() || link.title
  async function copy() {
    try {
      await navigator.clipboard.writeText(link.url)
      setCopyState('copied')
    } catch {
      setCopyState('manual')
    }
  }

  return (
    <div className="destination-preview">
      <article>
        <div className="destination-art">
          {image && image !== failedImage ? (
            <img
              src={image}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setFailedImage(image)}
            />
          ) : (
            <Globe size={42} strokeWidth={1.4} aria-hidden="true" />
          )}
        </div>
        <div className="destination-copy">
          <small>{domain}</small>
          <h3>{title}</h3>
          {data?.description && <p>{data.description}</p>}
          {query.isPending && <p role="status">Mengambil info dari situs…</p>}
        </div>
      </article>
      <a className="destination-open" href={link.url} target="_blank" rel="noopener noreferrer">
        Buka tautan <ArrowUpRight size={18} />
      </a>
      <div className="destination-share">
        <button type="button" onClick={copy}>
          {copyState === 'copied' ? <Check size={16} /> : <Copy size={16} />}{' '}
          <span aria-live="polite">{copyState === 'copied' ? 'Tersalin' : 'Salin tautan'}</span>
        </button>
        <a
          href={'https://wa.me/?text=' + encodeURIComponent(link.url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Share2 size={16} /> WhatsApp
        </a>
      </div>
      {copyState === 'manual' && (
        <input
          aria-label="Alamat untuk disalin"
          readOnly
          value={link.url}
          onFocus={(event) => event.target.select()}
        />
      )}
    </div>
  )
}
