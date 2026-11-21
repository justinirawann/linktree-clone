begin;

create or replace function public.member_slug_taken(chosen_slug text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.member_pages where slug = lower(btrim(chosen_slug))
  );
$$;

revoke all on function public.member_slug_taken(text) from public, anon, authenticated;
grant execute on function public.member_slug_taken(text) to authenticated;
notify pgrst, 'reload schema';

commit;
