-- Both readers use the caller's RLS policies. The public projection always filters drafts,
-- including when the browser also has an owner session.
create function public.get_public_page() returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'profile',jsonb_build_object('store_name',s.store_name,'bio',s.bio,'logo_path',s.logo_path),
    'theme',to_jsonb(a)-array['site_id','revision','created_at','updated_at'],
    'socials',coalesce((select jsonb_agg(jsonb_build_object('platform',platform,'url',url) order by position) from public.social_links where site_id=s.id),'[]'),
    'links',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'description',description,'url',url,'layout',layout,'icon_key',icon_key,'thumbnail_path',thumbnail_path) order by position,id)
      from public.links where site_id=s.id and is_active),'[]'))
  from public.site_settings s join public.appearance a on a.site_id=s.id where s.id=1 and s.is_published
$$;
revoke all on function public.get_public_page() from public;
grant execute on function public.get_public_page() to anon,authenticated;

create function public.get_editor_page() returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if not public.is_site_admin() then raise insufficient_privilege using message='owner_required'; end if;
  return (select jsonb_build_object('profile',to_jsonb(s),'theme',to_jsonb(a),
    'socials',coalesce((select jsonb_agg(to_jsonb(l) order by position) from public.social_links l where site_id=s.id),'[]'),
    'links',coalesce((select jsonb_agg(to_jsonb(l) order by position,id) from public.links l where site_id=s.id),'[]'))
    from public.site_settings s join public.appearance a on a.site_id=s.id where s.id=1);
end $$;
revoke all on function public.get_editor_page() from public,anon;
grant execute on function public.get_editor_page() to authenticated;
notify pgrst, 'reload schema';
