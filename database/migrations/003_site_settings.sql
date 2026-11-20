create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  store_name text not null check (length(trim(store_name)) between 1 and 60),
  bio text not null default '' check (length(bio) <= 160),
  logo_path text check (private.valid_asset(logo_path, 'logos')),
  is_published boolean not null default false,
  revision bigint not null default 1,
  order_revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
revoke all on public.site_settings from public, anon, authenticated;
grant select on public.site_settings to anon, authenticated;
create policy read_site on public.site_settings for select to anon, authenticated
using (is_published or (select public.is_site_admin()));
