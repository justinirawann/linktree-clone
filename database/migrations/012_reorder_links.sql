create function public.reorder_links(expected bigint, ids uuid[])
returns bigint language plpgsql security definer set search_path = '' as $$
declare current_revision bigint;
begin
  perform private.require_owner();
  select order_revision into current_revision from public.site_settings where id=1 for update;
  perform private.check_revision(current_revision,expected);
  if ids is null or cardinality(ids) <> (select count(*) from public.links where site_id=1)
    or cardinality(ids) <> (select count(distinct id) from unnest(ids) as t(id))
    or exists(select id from unnest(ids) as t(id) except select id from public.links where site_id=1)
  then raise check_violation using message='invalid_order'; end if;
  update public.links l set position=t.ord-1, updated_at=now() from unnest(ids) with ordinality t(id,ord) where l.id=t.id and l.site_id=1;
  update public.site_settings set order_revision=order_revision+1 where id=1 returning order_revision into current_revision;
  return current_revision;
end $$;
revoke all on function public.reorder_links(bigint,uuid[]) from public,anon;
grant execute on function public.reorder_links(bigint,uuid[]) to authenticated;
