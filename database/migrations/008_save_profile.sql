create function public.save_profile(expected bigint, profile jsonb, socials jsonb)
returns public.site_settings language plpgsql security definer set search_path = '' as $$
declare current_site public.site_settings;
begin
  perform private.require_owner();
  select * into current_site from public.site_settings where id=1 for update;
  perform private.check_revision(current_site.revision,expected);
  if jsonb_typeof(socials) is distinct from 'array' then raise check_violation; end if;
  update public.site_settings set store_name=trim(profile->>'store_name'), bio=profile->>'bio', logo_path=profile->>'logo_path',
    revision=revision+1, updated_at=now() where id=1 returning * into current_site;
  delete from public.social_links where site_id=1;
  insert into public.social_links(platform,url,position)
    select entry->>'platform',entry->>'url',ord-1 from jsonb_array_elements(socials) with ordinality as t(entry,ord);
  return current_site;
end $$;
revoke all on function public.save_profile(bigint,jsonb,jsonb) from public,anon;
grant execute on function public.save_profile(bigint,jsonb,jsonb) to authenticated;
