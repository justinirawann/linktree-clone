create table public.appearance (
  site_id smallint primary key references public.site_settings(id),
  preset text not null default 'dark' check (preset in ('dark','light','gradient','custom')),
  background_type text not null default 'solid' check (background_type in ('solid','gradient','image')),
  background_color public.theme_color not null default '#171719',
  gradient_color public.theme_color not null default '#381F22',
  text_color public.theme_color not null default '#EEEEEE',
  button_color public.theme_color not null default '#252527',
  button_text_color public.theme_color not null default '#EEEEEE',
  font text not null default 'dm' check (font in ('dm','system','georgia')),
  radius smallint not null default 14 check (radius between 0 and 36),
  border_enabled boolean not null default true,
  shadow_enabled boolean not null default false,
  background_path text check (private.valid_asset(background_path, 'backgrounds')),
  revision bigint not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.appearance enable row level security;
revoke all on public.appearance from public, anon, authenticated;
grant select on public.appearance to anon, authenticated;
create policy read_appearance on public.appearance for select to anon, authenticated
using (exists (select 1 from public.site_settings where id = site_id));
