begin;

alter table public.member_pages add column avatar_path text;
create unique index member_pages_avatar_path on public.member_pages (avatar_path)
where avatar_path is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-avatars', 'member-avatars', false, 5242880, array['image/webp']);

create function public.owns_member_avatar(object_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select object_name ~ '^[a-z0-9]+(-[a-z0-9]+)*/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
    and exists (
      select 1 from public.member_pages
      where owner_id = (select auth.uid()) and slug = split_part(object_name, '/', 1)
    )
$$;

create function public.is_published_member_avatar(object_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.member_pages where published and avatar_path = object_name
  )
$$;

revoke all on function public.owns_member_avatar(text) from public, anon, authenticated;
revoke all on function public.is_published_member_avatar(text) from public, anon, authenticated;
grant execute on function public.owns_member_avatar(text) to authenticated;
grant execute on function public.is_published_member_avatar(text) to anon, authenticated;

create policy member_reads_own_avatar on storage.objects for select to authenticated
using (bucket_id = 'member-avatars' and public.owns_member_avatar(name));

create policy visitors_read_published_avatar on storage.objects for select to anon, authenticated
using (bucket_id = 'member-avatars' and public.is_published_member_avatar(name));

create policy member_uploads_own_avatar on storage.objects for insert to authenticated
with check (bucket_id = 'member-avatars' and public.owns_member_avatar(name));

create policy member_removes_unused_avatar on storage.objects for delete to authenticated
using (
  bucket_id = 'member-avatars' and public.owns_member_avatar(name)
  and not exists (
    select 1 from public.member_pages where owner_id = (select auth.uid()) and avatar_path = name
  )
);

create function public.save_member_page(
  expected bigint, chosen_name text, chosen_bio text, chosen_theme text,
  chosen_links jsonb, publish_page boolean, chosen_avatar_path text
) returns public.member_pages language plpgsql security definer set search_path = '' as $$
declare page public.member_pages;
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  if chosen_avatar_path is not null then
    if public.owns_member_avatar(chosen_avatar_path) is distinct from true then
      raise insufficient_privilege using message = 'invalid_avatar_path';
    end if;
    perform 1 from storage.objects
    where bucket_id = 'member-avatars' and name = chosen_avatar_path for key share;
    if not found then raise check_violation using message = 'avatar_not_found'; end if;
  end if;

  page := public.save_member_page(
    expected, chosen_name, chosen_bio, chosen_theme, chosen_links, publish_page
  );
  update public.member_pages set avatar_path = chosen_avatar_path
  where owner_id = page.owner_id returning * into page;
  return page;
end $$;

revoke all on function public.save_member_page(bigint,text,text,text,jsonb,boolean,text)
  from public, anon, authenticated;
grant execute on function public.save_member_page(bigint,text,text,text,jsonb,boolean,text)
  to authenticated;

create or replace function public.get_member_page(page_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'slug', p.slug, 'display_name', p.display_name, 'bio', p.bio, 'theme', p.theme,
    'avatar_path', p.avatar_path,
    'links', coalesce((
      select jsonb_agg(link order by position)
      from jsonb_array_elements(p.links) with ordinality as entry(link, position)
      where (link->>'is_active')::boolean
    ), '[]'::jsonb)
  )
  from public.member_pages p where p.slug = page_slug and p.published
$$;

notify pgrst, 'reload schema';
commit;
