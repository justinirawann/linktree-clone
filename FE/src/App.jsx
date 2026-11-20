import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Outlet, useLocation, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { canonicalUrl, localStudio } from './shared/lib/env'
import { PUBLIC_PAGE_PATH } from './shared/lib/routes'
import { StatusPage } from './shared/ui/Controls'
import { LinkfyLogo } from './shared/ui/LinkfyLogo'
const LandingPage = lazy(() => import('./pages/LandingPage')),
  AuthPage = lazy(() => import('./pages/AuthPage')),
  StudioPage = lazy(() => import('./pages/StudioPage')),
  PublicPage = lazy(() => import('./pages/PublicPage')),
  RegisterPage = lazy(() => import('./pages/RegisterPage')),
  MemberStudioPage = lazy(() => import('./pages/MemberStudioPage')),
  MemberPublicPage = lazy(() => import('./pages/MemberPublicPage'))
function Layout() {
  const location = useLocation()
  useEffect(() => {
    const path = location.pathname.replace(/\/$/, '') || '/'
    const isStore = path === PUBLIC_PAGE_PATH
    const isMemberPage = /^\/u\/[a-z0-9-]+$/.test(path)
    const isHome = path === '/'
    const meta = document.querySelector('meta[name="robots"]')
    if (meta) meta.content = isHome || isStore || isMemberPage ? 'index,follow' : 'noindex,nofollow'
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical && canonicalUrl && (isHome || isStore || isMemberPage))
      canonical.setAttribute('href', new URL(path, canonicalUrl).href)
    if (isHome) document.title = 'Linkfy — Satu link. Semua tujuan.'
    else if (path === '/admin/login') document.title = 'Masuk • Linkfy'
    else if (path === '/register') document.title = 'Daftar • Linkfy'
    else if (path === '/admin/reset-password') document.title = 'Ubah kata sandi • Linkfy'
    else if (isStore) document.title = 'Core Consign — Komputer & Titip Jual'
    else if (isMemberPage) document.title = 'Halaman Linkfy'
    else document.title = 'Studio • Linkfy'

    if (!location.hash) window.scrollTo(0, 0)
  }, [location.pathname, location.hash])
  return (
    <Suspense
      fallback={
        <div className="skeleton-page" role="status" aria-label="Memuat">
          <i />
          <i />
        </div>
      }
    >
      <Outlet />
    </Suspense>
  )
}
const sections = ['dashboard', 'appearance', 'settings']
const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: (
      <StatusPage className="linkfy-ui" brand={<LinkfyLogo />} title="Halaman gagal ditampilkan">
        <a href="/">Kembali ke Linkfy</a>
      </StatusPage>
    ),
    children: [
      { path: '/', element: <LandingPage /> },
      { path: PUBLIC_PAGE_PATH, element: <PublicPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/dashboard', element: <MemberStudioPage /> },
      { path: '/u/:slug', element: <MemberPublicPage /> },
      { path: '/admin/login', element: <AuthPage /> },
      { path: '/admin/reset-password', element: <AuthPage reset /> },
      ...sections.map((section) => ({
        path: '/admin/' + section,
        element: <StudioPage section={section} />,
      })),
      ...(localStudio
        ? sections.map((section) => ({
            path: '/studio/' + section,
            element: <StudioPage local section={section} />,
          }))
        : []),
      {
        path: '*',
        element: (
          <StatusPage className="linkfy-ui" brand={<LinkfyLogo />} title="Halaman tidak ditemukan">
            <Link to="/">Kembali ke Linkfy</Link>
          </StatusPage>
        ),
      },
    ],
  },
])
const cache = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 0 }, mutations: { retry: false } },
})
export default function App() {
  return (
    <QueryClientProvider client={cache}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
