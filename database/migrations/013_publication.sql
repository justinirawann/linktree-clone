create function public.set_publication(expected bigint, published boolean)
returns public.site_settings language plpgsql security definer set search_path = '' as $$
declare current_site public.site_settings;
begin
  perform private.require_owner();
  select * into current_site from public.site_settings where id=1 for update;
  perform private.check_revision(current_site.revision,expected);
  if published and not exists(select 1 from public.links where site_id=1 and is_active and url is not null) then
    raise check_violation using message='active_link_required';
  end if;
  update public.site_settings set is_published=published,revision=revision+1,updated_at=now() where id=1 returning * into current_site;
  return current_site;
end $$;
revoke all on function public.set_publication(bigint,boolean) from public,anon;
grant execute on function public.set_publication(bigint,boolean) to authenticated;
