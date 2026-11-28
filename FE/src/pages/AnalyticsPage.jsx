import { LoadingPage } from '../shared/ui/LoadingPage'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChartNoAxesColumnIncreasing, RefreshCw } from 'lucide-react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { AnalyticsReport, analytics } from '../features/analytics'
import { useSession } from '../features/auth'
import { hasSupabase } from '../shared/lib/env'
import { Button } from '../shared/ui/Controls'
import { LinkfyLogo } from '../shared/ui/LinkfyLogo'
import './analytics.css'

const PERIODS = [7, 30]

export default function AnalyticsPage({ ownerStore = false }) {
  const session = useSession()
  const [search, setSearch] = useSearchParams()
  const days = search.get('hari') === '30' ? 30 : 7
  const userId = session?.user.id
  const report = useQuery({
    queryKey: ['page-analytics', userId, ownerStore, days],
    queryFn: ({ signal }) => analytics.read(days, ownerStore, signal),
    enabled: Boolean(userId),
    retry: false,
  })
  const studio = ownerStore ? '/admin/dashboard' : '/dashboard'

  if (!hasSupabase || session === null) return <Navigate to="/admin/login" replace />
  if (!session) return <LoadingPage label="Memeriksa sesi…" />

  const migrationNeeded = ['PGRST202', '42883'].includes(report.error?.code)
  const accessDenied = report.error?.code === '42501'
  return (
    <main className="analytics-page linkfy-ui">
      <header className="analytics-header">
        <div className="analytics-shell">
          <LinkfyLogo />
          <Link className="btn secondary" to={studio}>
            <ArrowLeft size={16} aria-hidden="true" />
            Studio
          </Link>
        </div>
      </header>
      <div className="analytics-shell analytics-content">
        <div className="analytics-hero">
          <div>
            <p>
              <ChartNoAxesColumnIncreasing size={17} aria-hidden="true" />{' '}
              {ownerStore ? 'Core Consign' : 'Halaman Linkfy'}
            </p>
            <h1>Statistik</h1>
            <span>Kunjungan halaman, klik tautan, dan kunjungan dari QR.</span>
          </div>
          <img src="/linkfy-chain.webp" alt="" width="960" height="960" />
        </div>
        <div className="analytics-toolbar">
          <div role="group" aria-label="Rentang statistik">
            {PERIODS.map((period) => (
              <button
                type="button"
                key={period}
                aria-pressed={days === period}
                onClick={() => setSearch({ hari: String(period) }, { replace: true })}
              >
                {period} hari
              </button>
            ))}
          </div>
          <Button disabled={report.isFetching || accessDenied} onClick={() => report.refetch()}>
            <RefreshCw size={15} aria-hidden="true" /> Perbarui
          </Button>
        </div>
        {report.isPending && (
          <div className="analytics-panel" role="status">
            Memuat statistik…
          </div>
        )}
        {report.isError && (
          <p className="notice error-notice" role="alert">
            {migrationNeeded
              ? 'Statistik belum aktif. Jalankan migrasi 023 di Supabase.'
              : accessDenied
                ? 'Statistik ini hanya tersedia untuk pemilik halaman.'
                : 'Statistik gagal dimuat. Coba perbarui.'}
          </p>
        )}
        {report.isSuccess &&
          (report.data ? (
            <AnalyticsReport key={days} days={report.data.days} links={report.data.links} />
          ) : (
            <div className="analytics-panel analytics-empty">
              <p>Buat halaman Linkfy untuk mulai mencatat aktivitas.</p>
              <Link className="btn primary" to={studio}>
                Buat halaman
              </Link>
            </div>
          ))}
      </div>
    </main>
  )
}
