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
      when field.key = 'radius' then case when jsonb_typeof(settings->'radius') = 'number' then
        field.value::numeric between 0 and 50 and field.value::numeric = trunc(field.value::numeric)
        else false end
      when field.key = 'effect' then field.value in ('plain','glass','soft')
      when field.key = 'icon_style' then field.value in ('filled','outline','bare')
      when field.key = 'icon_shape' then field.value in ('square','rounded','circle')
      else false end)
    then return false; end if;
  end loop;
  return true;
end $$;

commit;
