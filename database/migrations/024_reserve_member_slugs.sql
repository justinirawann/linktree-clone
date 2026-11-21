begin;

-- Existing pages on reserved routes keep their old /u/ address.
-- Keep this list in sync with FE/src/shared/lib/routes.js.
create function private.reject_reserved_member_slug()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.slug in ('admin', 'api', 'assets', 'core-consign', 'dashboard', 'register', 'studio') then
    raise check_violation using message = 'reserved_member_slug';
  end if;
  return new;
end;
$$;

create trigger reserve_member_slug
before insert or update of slug on public.member_pages
for each row execute function private.reject_reserved_member_slug();

commit;
