import './loading-page.css'

export function LoadingPage({ label = 'Memuat halaman…' }) {
  return (
    <main className="linkfy-loading">
      <div className="loading-sculpture" aria-hidden="true">
        <div className="loading-orbit" />
        <img src="/linkfy-chain.webp" width="180" height="180" alt="" />
      </div>
      <p role="status">{label}</p>
    </main>
  )
}
