create table public.links (
  id uuid primary key default gen_random_uuid(),
  site_id smallint not null default 1 references public.site_settings(id),
  title text not null check (length(trim(title)) between 1 and 100),
  description text not null default '' check (length(description) <= 160),
  url text check (private.valid_url(url)),
  icon_key text not null default 'link' check (icon_key in ('whatsapp','shopee','toco','instagram','consign','catalog','link')),
  layout text not null default 'classic' check (layout in ('classic','featured')),
  thumbnail_path text check (private.valid_asset(thumbnail_path, 'thumbnails')),
  is_active boolean not null default false check (not is_active or url is not null),
  position integer not null check (position >= 0),
  revision bigint not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index links_site_position on public.links (site_id,position,id);
alter table public.links enable row level security;
revoke all on public.links from public, anon, authenticated;
grant select on public.links to anon, authenticated;
create policy read_links on public.links for select to anon, authenticated
using ((select public.is_site_admin()) or (is_active and exists(select 1 from public.site_settings where id = site_id and is_published)));
