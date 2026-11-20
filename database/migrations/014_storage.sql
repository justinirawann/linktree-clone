insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('site-assets','site-assets',true,5242880,array['image/webp']);
-- Read access by public object URL only. Listing and deletion are owner-only.
create function public.can_manage_asset(object_name text) returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_site_admin() and private.valid_asset(object_name,'(logos|thumbnails|backgrounds)')
$$;
create function public.asset_in_use(object_name text) returns boolean language sql stable security definer set search_path = '' as $$
  select not public.is_site_admin()
    or exists(select 1 from public.site_settings where logo_path=object_name)
    or exists(select 1 from public.links where thumbnail_path=object_name)
    or exists(select 1 from public.appearance where background_path=object_name)
$$;
revoke all on function public.can_manage_asset(text), public.asset_in_use(text) from public,anon;
grant execute on function public.can_manage_asset(text), public.asset_in_use(text) to authenticated;
create policy owner_asset_read on storage.objects for select to authenticated
using (bucket_id='site-assets' and public.can_manage_asset(name));
create policy owner_asset_insert on storage.objects for insert to authenticated
with check (bucket_id='site-assets' and public.can_manage_asset(name));
create policy owner_asset_delete on storage.objects for delete to authenticated
using (bucket_id='site-assets' and public.can_manage_asset(name) and not public.asset_in_use(name));
