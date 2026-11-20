create function public.save_link(link_id uuid, expected bigint, entry jsonb)
returns public.links language plpgsql security definer set search_path = '' as $$
declare saved public.links;
begin
  perform private.require_owner();
  perform 1 from public.site_settings where id=1 for update;
  if expected is null then
    select * into saved from public.links where id=link_id and site_id=1;
    if found then
      if saved.revision=1 and not saved.is_active and saved.title=trim(entry->>'title')
        and saved.description=entry->>'description' and saved.url is not distinct from nullif(entry->>'url','')
        and saved.icon_key=entry->>'icon_key' and saved.layout=entry->>'layout'
        and saved.thumbnail_path is not distinct from (entry->>'thumbnail_path') then return saved; end if;
      raise sqlstate 'PT409' using message='revision_conflict';
    end if;
    insert into public.links (id,title,description,url,icon_key,layout,thumbnail_path,position,is_active)
    values (coalesce(link_id,gen_random_uuid()),trim(entry->>'title'),entry->>'description',nullif(entry->>'url',''),entry->>'icon_key',entry->>'layout',
      entry->>'thumbnail_path',(select coalesce(max(position)+1,0) from public.links where site_id=1),false) returning * into saved;
    update public.site_settings set order_revision=order_revision+1 where id=1;
  else
    select * into saved from public.links where id=link_id and site_id=1 for update;
    perform private.check_revision(saved.revision,expected);
    update public.links set title=trim(entry->>'title'),description=entry->>'description',url=nullif(entry->>'url',''),
      icon_key=entry->>'icon_key',layout=entry->>'layout',thumbnail_path=entry->>'thumbnail_path',is_active=(entry->>'is_active')::boolean,
      revision=revision+1,updated_at=now() where id=link_id and site_id=1 returning * into saved;
  end if;
  return saved;
end $$;
revoke all on function public.save_link(uuid,bigint,jsonb) from public,anon;
grant execute on function public.save_link(uuid,bigint,jsonb) to authenticated;
