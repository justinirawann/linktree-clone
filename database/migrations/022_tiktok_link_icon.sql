begin;

alter table public.links
  drop constraint links_icon_key_check,
  add constraint links_icon_key_check check (
    icon_key in ('whatsapp','shopee','toco','tokopedia','line','instagram','tiktok','consign','catalog','link')
  );

-- The avatar and appearance overloads delegate link validation to this function.
create or replace function public.save_member_page(
  expected bigint, chosen_name text, chosen_bio text, chosen_theme text,
  chosen_links jsonb, publish_page boolean
) returns public.member_pages language plpgsql security definer set search_path = '' as $$
declare
  page public.member_pages;
  entry jsonb;
  cleaned jsonb := '[]';
  seen_ids uuid[] := '{}';
  link_id uuid;
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  select * into page from public.member_pages where owner_id = auth.uid() for update;
  perform private.check_revision(page.revision, expected);

  if jsonb_typeof(chosen_links) is distinct from 'array' then
    raise check_violation using message = 'invalid_links';
  end if;
  if jsonb_array_length(chosen_links) > 50 then
    raise check_violation using message = 'invalid_links';
  end if;

  for entry in select value from jsonb_array_elements(chosen_links) loop
    if jsonb_typeof(entry) is distinct from 'object'
      or (entry->>'id') is null
      or char_length(btrim(coalesce(entry->>'title', ''))) not between 1 and 100
      or char_length(coalesce(entry->>'description', '')) > 160
      or private.valid_url(entry->>'url') is distinct from true
      or jsonb_typeof(entry->'is_active') is distinct from 'boolean'
      or coalesce(entry->>'icon_key', '') not in (
        'whatsapp','shopee','toco','tokopedia','line','instagram','tiktok','consign','catalog','link'
      )
      or coalesce(entry->>'icon_color', '') !~ '^#[0-9a-fA-F]{6}$'
    then raise check_violation using message = 'invalid_member_link'; end if;

    link_id := (entry->>'id')::uuid;
    if link_id = any(seen_ids) then raise check_violation using message = 'duplicate_link'; end if;
    seen_ids := array_append(seen_ids, link_id);
    cleaned := cleaned || jsonb_build_object(
      'id', link_id, 'title', btrim(entry->>'title'), 'url', entry->>'url',
      'description', coalesce(entry->>'description', ''), 'is_active', entry->'is_active',
      'icon_key', entry->>'icon_key', 'icon_color', entry->>'icon_color'
    );
  end loop;

  if publish_page and not exists (
    select 1 from jsonb_array_elements(cleaned) as link where (link->>'is_active')::boolean
  ) then raise check_violation using message = 'active_link_required'; end if;

  update public.member_pages
    set display_name = btrim(chosen_name), bio = chosen_bio, theme = chosen_theme,
        links = cleaned, published = publish_page, revision = revision + 1
    where owner_id = auth.uid() returning * into page;
  return page;
end $$;

commit;
