import { LoadingPage } from './shared/ui/LoadingPage'
import { lazy, Suspense, useEffect } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
  useParams,
  Link,
  Navigate,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { canonicalUrl, localStudio } from './shared/lib/env'
import {
  PUBLIC_PAGE_PATH,
  isMemberSlug,
  isReservedMemberSlug,
  memberPagePath,
} from './shared/lib/routes'
import { StatusPage } from './shared/ui/Controls'
import { LinkfyLogo } from './shared/ui/LinkfyLogo'
const LandingPage = lazy(() => import('./pages/LandingPage')),
  AuthPage = lazy(() => import('./pages/AuthPage')),
  StudioPage = lazy(() => import('./pages/StudioPage')),
  PublicPage = lazy(() => import('./pages/PublicPage')),
  RegisterPage = lazy(() => import('./pages/RegisterPage')),
  MemberStudioPage = lazy(() => import('./pages/MemberStudioPage')),
  AnalyticsPage = lazy(() => import('./pages/AnalyticsPage')),
  MemberPublicPage = lazy(() => import('./pages/MemberPublicPage'))

function NotFoundPage() {
  return (
    <StatusPage className="linkfy-ui" brand={<LinkfyLogo />} title="Halaman tidak ditemukan">
      <Link to="/">Kembali ke Linkfy</Link>
    </StatusPage>
  )
}

function MemberRoute({ legacy = false }) {
  const { slug } = useParams()
  const { pathname, search, hash } = useLocation()
  const username = slug.toLowerCase()
  if (!isMemberSlug(username) || (!legacy && isReservedMemberSlug(username)))
    return <NotFoundPage />

  const canonicalPath = memberPagePath(username)
  if (pathname !== canonicalPath) {
    return <Navigate replace to={{ pathname: canonicalPath, search, hash }} />
  }
  return <MemberPublicPage />
}

function Layout() {
  const location = useLocation()
  useEffect(() => {
    const path = location.pathname.replace(/\/$/, '') || '/'
    const isStore = path === PUBLIC_PAGE_PATH
    const memberSlug = path.startsWith('/u/') ? path.slice(3) : path.slice(1)
    const isMemberPage = isMemberSlug(memberSlug) && path === memberPagePath(memberSlug)
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
    else if (path.endsWith('/analytics')) document.title = 'Statistik • Linkfy'
    else if (isStore) document.title = 'Core Consign — Komputer & Titip Jual'
    else if (isMemberPage) document.title = 'Halaman Linkfy'
    else document.title = 'Studio • Linkfy'

    if (!location.hash) window.scrollTo(0, 0)
  }, [location.pathname, location.hash])
  return (
    <Suspense fallback={<LoadingPage />}>
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
      { path: '/dashboard/analytics', element: <AnalyticsPage /> },
      { path: '/admin/analytics', element: <AnalyticsPage ownerStore /> },
      { path: '/u/:slug', element: <MemberRoute legacy /> },
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
      { path: '/:slug', element: <MemberRoute /> },
      { path: '*', element: <NotFoundPage /> },
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
