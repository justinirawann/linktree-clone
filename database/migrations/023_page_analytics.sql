begin;

create table private.page_analytics_daily (
  owner_id uuid references public.member_pages(owner_id) on delete cascade,
  scope text generated always as (coalesce(owner_id::text, 'store')) stored,
  day date not null,
  link_key text not null,
  source text not null check (source in ('other', 'qr')),
  hits bigint not null check (hits > 0),
  primary key (scope, day, link_key, source)
);
create index page_analytics_daily_owner on private.page_analytics_daily(owner_id);
alter table private.page_analytics_daily enable row level security;
revoke all on private.page_analytics_daily from public, anon, authenticated;

-- A null link records a page visit. A null slug refers to the singleton storefront.
create function public.record_page_analytics(page_slug text, link_id uuid, visit_source text)
returns void language plpgsql security definer set search_path = '' as $$
declare member_owner uuid;
begin
  if visit_source is null or visit_source not in ('other', 'qr') then return; end if;

  if page_slug is null then
    if not exists (select 1 from public.site_settings where id = 1 and is_published) then return; end if;
    if link_id is not null and not exists (
      select 1 from public.links where id = link_id and site_id = 1 and is_active
    ) then return; end if;
  else
    select p.owner_id into member_owner from public.member_pages p
    where p.slug = page_slug and p.published and (
      link_id is null or exists (
        select 1 from jsonb_array_elements(p.links) as entry
        where entry->>'id' = link_id::text and entry->>'is_active' = 'true'
      )
    );
    if not found then return; end if;
  end if;

  insert into private.page_analytics_daily (owner_id, day, link_key, source, hits)
  values (member_owner, (now() at time zone 'Asia/Jakarta')::date,
    coalesce(link_id::text, ''), visit_source, 1)
  on conflict (scope, day, link_key, source)
  do update set hits = private.page_analytics_daily.hits + 1;
end $$;

create function public.read_page_analytics(period_days integer, owner_store boolean)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  scope_key text := (select auth.uid())::text;
  today date := (now() at time zone 'Asia/Jakarta')::date;
  first_day date;
  current_links jsonb;
begin
  if scope_key is null then raise insufficient_privilege; end if;
  if period_days is null or period_days not in (7, 30) then raise check_violation; end if;
  first_day := today - (period_days - 1);

  if owner_store then
    perform private.require_owner();
    scope_key := 'store';
    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'title', title)), '[]'::jsonb)
      into current_links from public.links where site_id = 1;
  else
    select links into current_links from public.member_pages where owner_id = auth.uid();
  end if;
  if current_links is null then return null; end if;

  return (
    with hits as materialized (
      select day, link_key, source, hits
      from private.page_analytics_daily
      where scope = scope_key and day between first_day and today
    ), activity as (
      select day,
        coalesce(sum(hits) filter (where link_key = ''), 0) as views,
        coalesce(sum(hits) filter (where link_key <> ''), 0) as clicks,
        coalesce(sum(hits) filter (where link_key = '' and source = 'qr'), 0) as qr_views
      from hits group by day
    ), dates as (
      select first_day + offset_day as day
      from generate_series(0, period_days - 1) as offset_day
    ), ranking as (
      select link_key, sum(hits) as clicks from hits where link_key <> ''
      group by link_key order by clicks desc, link_key limit 10
    )
    select jsonb_build_object(
      'days', (
        select jsonb_agg(jsonb_build_object(
          'day', dates.day, 'views', coalesce(activity.views, 0),
          'clicks', coalesce(activity.clicks, 0), 'qrViews', coalesce(activity.qr_views, 0)
        ) order by dates.day) from dates left join activity using (day)
      ),
      'links', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', ranking.link_key, 'title', link->>'title', 'clicks', ranking.clicks
        ) order by ranking.clicks desc, ranking.link_key)
        from ranking left join lateral jsonb_array_elements(current_links) as link
          on link->>'id' = ranking.link_key
      ), '[]'::jsonb)
    )
  );
end $$;

revoke all on function public.record_page_analytics(text, uuid, text) from public, anon, authenticated;
grant execute on function public.record_page_analytics(text, uuid, text) to anon, authenticated;
revoke all on function public.read_page_analytics(integer, boolean) from public, anon, authenticated;
grant execute on function public.read_page_analytics(integer, boolean) to authenticated;
notify pgrst, 'reload schema';

commit;
