-- Single owner, managed through the SQL Editor or a trusted migration role.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.site_admins (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade
);
revoke all on private.site_admins from public, anon, authenticated;

create function public.is_site_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from private.site_admins where user_id = (select auth.uid())) $$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to anon, authenticated;

create function private.require_owner() returns void
language plpgsql set search_path = '' as $$
begin
  if not public.is_site_admin() then raise insufficient_privilege using message = 'owner_required'; end if;
end $$;
create function private.check_revision(actual bigint, expected bigint) returns void
language plpgsql set search_path = '' as $$
begin
  if actual is distinct from expected or actual is null then
    raise sqlstate 'PT409' using message = 'revision_conflict';
  end if;
end $$;
