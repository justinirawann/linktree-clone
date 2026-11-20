begin;

alter table public.member_pages
  add column appearance jsonb not null default '{}',
  add column link_styles jsonb not null default '{}';

create function private.valid_member_style(settings jsonb, page_style boolean)
returns boolean language plpgsql immutable set search_path = '' as $$
declare field record;
begin
  if jsonb_typeof(settings) is distinct from 'object' then return false; end if;
  for field in select * from jsonb_each_text(settings) loop
    if field.value is null or not (case
      when field.key in ('fill','ink') or (page_style and field.key in ('background','gradient'))
        then field.value ~ '^#[0-9a-fA-F]{6}$'
      when field.key = 'shape' then field.value in ('square','slight','rounded','round','pill')
      when field.key = 'effect' then field.value in ('plain','glass','soft')
      else false end)
    then return false; end if;
  end loop;
  return true;
end $$;

create function public.save_member_page(
  expected bigint, chosen_name text, chosen_bio text, chosen_theme text,
  chosen_links jsonb, publish_page boolean, chosen_avatar_path text,
  chosen_appearance jsonb, chosen_link_styles jsonb
) returns public.member_pages language plpgsql security definer set search_path = '' as $$
declare page public.member_pages;
begin
  page := public.save_member_page(
    expected, chosen_name, chosen_bio, chosen_theme, chosen_links, publish_page, chosen_avatar_path
  );
  if not private.valid_member_style(chosen_appearance, true)
    or jsonb_typeof(chosen_link_styles) is distinct from 'object'
  then raise check_violation using message = 'invalid_member_appearance'; end if;
  if exists (
    select 1 from jsonb_each(chosen_link_styles) as style(id, settings)
    where not private.valid_member_style(settings, false)
      or not exists (select 1 from jsonb_array_elements(page.links) link where link->>'id' = style.id)
  ) then raise check_violation using message = 'invalid_link_style'; end if;
  update public.member_pages set appearance = chosen_appearance, link_styles = chosen_link_styles
    where owner_id = page.owner_id returning * into page;
  return page;
end $$;

revoke all on function public.save_member_page(bigint,text,text,text,jsonb,boolean,text,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.save_member_page(bigint,text,text,text,jsonb,boolean,text,jsonb,jsonb)
  to authenticated;

create or replace function public.get_member_page(page_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'slug', p.slug, 'display_name', p.display_name, 'bio', p.bio, 'theme', p.theme,
    'avatar_path', p.avatar_path, 'appearance', p.appearance,
    'links', visible.links, 'link_styles', visible.styles
  )
  from public.member_pages p cross join lateral (
    select coalesce(jsonb_agg(link order by position), '[]'::jsonb) as links,
      coalesce(jsonb_object_agg(link->>'id', p.link_styles->(link->>'id'))
        filter (where p.link_styles ? (link->>'id')), '{}'::jsonb) as styles
    from jsonb_array_elements(p.links) with ordinality as entry(link, position)
    where (link->>'is_active')::boolean
  ) visible where p.slug = page_slug and p.published
$$;

notify pgrst, 'reload schema';
commit;
