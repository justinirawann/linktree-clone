import { LoadingPage } from '../shared/ui/LoadingPage'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { hasSupabase } from '../shared/lib/env'
import { StatusPage } from '../shared/ui/Controls'
import { LinkfyLogo } from '../shared/ui/LinkfyLogo'
import { Directory } from '../features/storefront'
import { usePageAnalytics } from '../features/analytics'
import { memberDirectory, memberPageUrl, members, useMemberAvatar } from '../features/members'
import './members.css'

export default function MemberPublicPage() {
  const { slug } = useParams()
  const page = useQuery({
    queryKey: ['public', 'member', slug],
    queryFn: ({ signal }) => members.readPublic(slug, signal),
    enabled: hasSupabase,
  })
  const avatar = useMemberAvatar(page.data?.avatar_path)
  const trackLink = usePageAnalytics(slug, Boolean(page.data))
  const brand = <LinkfyLogo />
  if (hasSupabase && page.isPending) return <LoadingPage />
  if (page.isError)
    return (
      <StatusPage
        className="linkfy-ui"
        brand={brand}
        title="Halaman gagal dimuat"
        retry={page.refetch}
      />
    )
  if (!page.data)
    return (
      <StatusPage className="linkfy-ui" brand={brand} title="Halaman belum tersedia">
        <Link to="/">Kembali ke Linkfy</Link>
      </StatusPage>
    )

  return (
    <div className="member-public-stage">
      <Directory
        page={memberDirectory(page.data, avatar.data)}
        member
        shareUrl={memberPageUrl(slug)}
        isAvatarLoading={Boolean(page.data.avatar_path) && avatar.isPending}
        onLinkOpen={trackLink}
      />
    </div>
  )
}
