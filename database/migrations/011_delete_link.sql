create function public.delete_link(link_id uuid, expected bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare current_revision bigint;
begin
  perform private.require_owner();
  perform 1 from public.site_settings where id=1 for update;
  select revision into current_revision from public.links where id=link_id and site_id=1 for update;
  perform private.check_revision(current_revision,expected);
  delete from public.links where id=link_id and site_id=1;
  update public.site_settings set order_revision=order_revision+1 where id=1 returning order_revision into current_revision;
  return current_revision;
end $$;
revoke all on function public.delete_link(uuid,bigint) from public,anon;
grant execute on function public.delete_link(uuid,bigint) to authenticated;
