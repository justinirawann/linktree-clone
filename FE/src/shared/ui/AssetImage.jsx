import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { assetUrl } from '../lib/assetRepository'
export function useAsset(path) {
  return useQuery({
    queryKey: ['asset', path || ''],
    queryFn: () => assetUrl(path),
    enabled: Boolean(path),
    staleTime: Infinity,
  }).data
}
export function AssetImage({ path, preview, fallback, alt = '', size, className }) {
  const url = useAsset(path),
    [failed, setFailed] = useState('')
  const src = preview || url
  return src && src !== failed ? (
    <img
      className={className}
      src={src}
      width={size}
      height={size}
      alt={alt}
      onError={() => setFailed(src)}
    />
  ) : (
    fallback
  )
}
