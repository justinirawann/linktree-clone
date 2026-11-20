alter table public.links
  add column icon_color public.theme_color not null default '#ffffff',
  drop constraint links_icon_key_check,
  add constraint links_icon_key_check check (
    icon_key in ('whatsapp','shopee','toco','tokopedia','line','instagram','consign','catalog','link')
  );

create or replace function public.save_link(link_id uuid, expected bigint, entry jsonb)
returns public.links language plpgsql security definer set search_path = '' as $$
declare saved public.links;
declare selected_color public.theme_color := entry->>'icon_color';
begin
  perform private.require_owner();
  perform 1 from public.site_settings where id=1 for update;
  if expected is null then
    select * into saved from public.links where id=link_id and site_id=1;
    if found then
      if saved.revision=1 and not saved.is_active and saved.title=trim(entry->>'title')
        and saved.description=entry->>'description' and saved.url is not distinct from nullif(entry->>'url','')
        and saved.icon_color=coalesce(selected_color,'#ffffff') and saved.icon_key=entry->>'icon_key' and saved.layout=entry->>'layout'
        and saved.thumbnail_path is not distinct from (entry->>'thumbnail_path') then return saved; end if;
      raise sqlstate 'PT409' using message='revision_conflict';
    end if;
    insert into public.links (id,title,description,url,icon_key,icon_color,layout,thumbnail_path,position,is_active)
    values (coalesce(link_id,gen_random_uuid()),trim(entry->>'title'),entry->>'description',nullif(entry->>'url',''),entry->>'icon_key',coalesce(selected_color,'#ffffff'),entry->>'layout',
      entry->>'thumbnail_path',(select coalesce(max(position)+1,0) from public.links where site_id=1),false) returning * into saved;
    update public.site_settings set order_revision=order_revision+1 where id=1;
  else
    select * into saved from public.links where id=link_id and site_id=1 for update;
    perform private.check_revision(saved.revision,expected);
    update public.links set title=trim(entry->>'title'),description=entry->>'description',url=nullif(entry->>'url',''),
      icon_key=entry->>'icon_key',icon_color=coalesce(selected_color,icon_color),layout=entry->>'layout',thumbnail_path=entry->>'thumbnail_path',is_active=(entry->>'is_active')::boolean,
      revision=revision+1,updated_at=now() where id=link_id and site_id=1 returning * into saved;
  end if;
  return saved;
end $$;
revoke all on function public.save_link(uuid,bigint,jsonb) from public,anon;
grant execute on function public.save_link(uuid,bigint,jsonb) to authenticated;

-- Both readers use the caller's RLS policies. The public projection always filters drafts,
-- including when the browser also has an owner session.
create or replace function public.get_public_page() returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'profile',jsonb_build_object('store_name',s.store_name,'bio',s.bio,'logo_path',s.logo_path),
    'theme',to_jsonb(a)-array['site_id','revision','created_at','updated_at'],
    'socials',coalesce((select jsonb_agg(jsonb_build_object('platform',platform,'url',url) order by position) from public.social_links where site_id=s.id),'[]'),
    'links',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'description',description,'url',url,'layout',layout,'icon_key',icon_key,'icon_color',icon_color,'thumbnail_path',thumbnail_path) order by position,id)
      from public.links where site_id=s.id and is_active),'[]'))
  from public.site_settings s join public.appearance a on a.site_id=s.id where s.id=1 and s.is_published
$$;
revoke all on function public.get_public_page() from public;
grant execute on function public.get_public_page() to anon,authenticated;

notify pgrst, 'reload schema';
