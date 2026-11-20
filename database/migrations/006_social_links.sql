create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  site_id smallint not null default 1 references public.site_settings(id),
  platform text not null check (platform in ('instagram','whatsapp','website','youtube','tiktok')),
  url text not null check (private.valid_url(url)),
  position integer not null check (position >= 0),
  unique(site_id,platform)
);
alter table public.social_links enable row level security;
revoke all on public.social_links from public, anon, authenticated;
grant select on public.social_links to anon, authenticated;
create policy read_social on public.social_links for select to anon, authenticated
using (exists(select 1 from public.site_settings where id = site_id));
