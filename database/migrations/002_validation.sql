create function private.valid_url(value text) returns boolean
language plpgsql immutable strict set search_path = '' as $$
declare parts text[];
declare hostname text;
begin
  if length(value)>2048 or value ~ '[[:space:]<>\\]' or value like '%...%' then return false; end if;
  parts := regexp_match(value,
    '^https?://(\[[0-9a-f:.]+\]|[a-z0-9.-]+)(:([0-9]{1,5}))?([/?#].*)?$', 'i');
  if parts is null then return false; end if;
  hostname := lower(parts[1]);
  if parts[3] is not null and parts[3]::integer > 65535 then return false; end if;
  if hostname ~ '^\[' or hostname ~ '^[0-9]+(\.[0-9]+){3}$' then
    begin
      perform trim(both '[]' from hostname)::inet;
    exception when invalid_text_representation then return false;
    end;
  elsif hostname !~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$' then
    return false;
  end if;
  if hostname ~ '(^|\.)example\.(com|net|org)$|\.(invalid|test|example)$' then return false; end if;
  if hostname in ('wa.me','www.wa.me') then
    return value ~* '^https://(www\.)?wa\.me/[1-9][0-9]{6,14}/?(\?[^#]*)?(#.*)?$';
  end if;
  return true;
end $$;

create function private.valid_asset(value text, folder text) returns boolean
language sql immutable strict set search_path = '' as $$
  select value ~ ('^' || folder || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$')
$$;
create domain public.theme_color as text check (value ~ '^#[0-9A-Fa-f]{6}$');
