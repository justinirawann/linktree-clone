begin;

create table public.member_pages (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique check (
    char_length(slug) between 3 and 32 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 160),
  theme text not null default 'light' check (theme in ('light', 'dark', 'gradient')),
  links jsonb not null default '[]' check (jsonb_typeof(links) = 'array'),
  published boolean not null default false,
  revision bigint not null default 1
);

alter table public.member_pages enable row level security;
revoke all on public.member_pages from public, anon, authenticated;
grant select on public.member_pages to authenticated;
create policy member_reads_own_page on public.member_pages
  for select to authenticated using (owner_id = (select auth.uid()));

create function public.create_member_page(chosen_slug text, chosen_name text)
returns public.member_pages language plpgsql security definer set search_path = '' as $$
declare page public.member_pages;
begin
  if auth.uid() is null then raise insufficient_privilege; end if;

  insert into public.member_pages (owner_id, slug, display_name)
  values (auth.uid(), lower(btrim(chosen_slug)), btrim(chosen_name))
  on conflict (owner_id) do nothing returning * into page;

  if not found then
    select * into page from public.member_pages where owner_id = auth.uid();
  end if;
  return page;
end $$;

create function public.save_member_page(
  expected bigint, chosen_name text, chosen_bio text, chosen_theme text,
  chosen_links jsonb, publish_page boolean
) returns public.member_pages language plpgsql security definer set search_path = '' as $$
declare
  page public.member_pages;
  entry jsonb;
  cleaned jsonb := '[]';
  seen_ids uuid[] := '{}';
  link_id uuid;
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  select * into page from public.member_pages where owner_id = auth.uid() for update;
  perform private.check_revision(page.revision, expected);

  if jsonb_typeof(chosen_links) is distinct from 'array' then
    raise check_violation using message = 'invalid_links';
  end if;
  if jsonb_array_length(chosen_links) > 50 then
    raise check_violation using message = 'invalid_links';
  end if;

  for entry in select value from jsonb_array_elements(chosen_links) loop
    if jsonb_typeof(entry) is distinct from 'object'
      or (entry->>'id') is null
      or char_length(btrim(coalesce(entry->>'title', ''))) not between 1 and 100
      or char_length(coalesce(entry->>'description', '')) > 160
      or private.valid_url(entry->>'url') is distinct from true
      or jsonb_typeof(entry->'is_active') is distinct from 'boolean'
      or coalesce(entry->>'icon_key', '') not in (
        'whatsapp','shopee','toco','tokopedia','line','instagram','consign','catalog','link'
      )
      or coalesce(entry->>'icon_color', '') !~ '^#[0-9a-fA-F]{6}$'
    then raise check_violation using message = 'invalid_member_link'; end if;

    link_id := (entry->>'id')::uuid;
    if link_id = any(seen_ids) then raise check_violation using message = 'duplicate_link'; end if;
    seen_ids := array_append(seen_ids, link_id);
    cleaned := cleaned || jsonb_build_object(
      'id', link_id, 'title', btrim(entry->>'title'), 'url', entry->>'url',
      'description', coalesce(entry->>'description', ''), 'is_active', entry->'is_active',
      'icon_key', entry->>'icon_key', 'icon_color', entry->>'icon_color'
    );
  end loop;

  if publish_page and not exists (
    select 1 from jsonb_array_elements(cleaned) as link where (link->>'is_active')::boolean
  ) then raise check_violation using message = 'active_link_required'; end if;

  update public.member_pages
    set display_name = btrim(chosen_name), bio = chosen_bio, theme = chosen_theme,
        links = cleaned, published = publish_page, revision = revision + 1
    where owner_id = auth.uid() returning * into page;
  return page;
end $$;

create function public.get_member_page(page_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'slug', p.slug, 'display_name', p.display_name, 'bio', p.bio, 'theme', p.theme,
    'links', coalesce((
      select jsonb_agg(link order by position)
      from jsonb_array_elements(p.links) with ordinality as entry(link, position)
      where (link->>'is_active')::boolean
    ), '[]'::jsonb)
  )
  from public.member_pages p where p.slug = page_slug and p.published
$$;

revoke all on function public.create_member_page(text,text) from public, anon, authenticated;
revoke all on function public.save_member_page(bigint,text,text,text,jsonb,boolean) from public, anon, authenticated;
revoke all on function public.get_member_page(text) from public, anon, authenticated;
grant execute on function public.create_member_page(text,text) to authenticated;
grant execute on function public.save_member_page(bigint,text,text,text,jsonb,boolean) to authenticated;
grant execute on function public.get_member_page(text) to anon, authenticated;
notify pgrst, 'reload schema';

commit;
