begin;

create or replace function private.valid_member_style(settings jsonb, page_style boolean)
returns boolean language plpgsql immutable set search_path = '' as $$
declare field record;
begin
  if jsonb_typeof(settings) is distinct from 'object' then return false; end if;
  for field in select * from jsonb_each_text(settings) loop
    if field.value is null or not (case
      when field.key in ('fill','ink') or (page_style and field.key in ('background','gradient'))
        then field.value ~ '^#[0-9a-fA-F]{6}$'
      when field.key = 'shape' then field.value in ('square','slight','rounded','round','pill')
      when field.key = 'effect' then field.value in ('plain','glass','soft')
      when field.key = 'icon_style' then field.value in ('filled','outline','bare')
      when field.key = 'icon_shape' then field.value in ('square','rounded','circle')
      else false end)
    then return false; end if;
  end loop;
  return true;
end $$;

-- Use the first customized icon in link order as the initial shared setting.
with previous_styles as (
  select page.owner_id, jsonb_strip_nulls(jsonb_build_object(
    'icon_style', chosen.style->'icon_style', 'icon_shape', chosen.style->'icon_shape'
  )) as icon
  from public.member_pages page
  cross join lateral (
    select page.link_styles->(entry.link->>'id') as style
    from jsonb_array_elements(page.links) with ordinality as entry(link, position)
    where (page.link_styles->(entry.link->>'id')) ?| array['icon_style','icon_shape']
    order by position
    limit 1
  ) chosen
  where not (page.appearance ?| array['icon_style','icon_shape'])
)
update public.member_pages page
set appearance = page.appearance || previous_styles.icon, revision = page.revision + 1
from previous_styles
where page.owner_id = previous_styles.owner_id;

commit;
