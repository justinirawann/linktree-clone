import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { siteRepository } from '../features/site'
import { Directory } from '../features/storefront'
import { usePageAnalytics } from '../features/analytics'
import { StatusPage } from '../shared/ui/Controls'
import { localStudio, hasSupabase } from '../shared/lib/env'
export default function PublicPage() {
  const page = useQuery({
    queryKey: ['public'],
    queryFn: siteRepository.readPublic,
    enabled: hasSupabase || localStudio,
  })
  const trackLink = usePageAnalytics(null, hasSupabase && Boolean(page.data))
  if (!hasSupabase && !localStudio)
    return (
      <StatusPage title="Halaman belum tersedia">
        <p>Toko belum menghubungkan halaman ini.</p>
      </StatusPage>
    )
  if (page.isPending)
    return (
      <div className="skeleton-page" role="status" aria-label="Memuat halaman toko">
        <i />
        <i />
        <i />
      </div>
    )
  if (page.isError)
    return (
      <StatusPage title="Halaman gagal dimuat" retry={page.refetch}>
        <p>Periksa koneksi dan coba lagi.</p>
      </StatusPage>
    )
  if (!page.data)
    return (
      <StatusPage title="Halaman sementara tidak tersedia">
        <p>Silakan kunjungi kembali nanti.</p>
        {localStudio && (
          <Link className="btn secondary" to="/studio/settings">
            Buka studio lokal
          </Link>
        )}
        <Link className="btn secondary" to="/">
          Kembali ke Linkfy
        </Link>
      </StatusPage>
    )
  return <Directory page={page.data} onLinkOpen={trackLink} />
}
