create function public.save_appearance(expected bigint, theme jsonb)
returns public.appearance language plpgsql security definer set search_path = '' as $$
declare current_theme public.appearance;
begin
  perform private.require_owner();
  select * into current_theme from public.appearance where site_id=1 for update;
  perform private.check_revision(current_theme.revision,expected);
  update public.appearance set preset=theme->>'preset', background_type=theme->>'background_type',
    background_color=theme->>'background_color', gradient_color=theme->>'gradient_color', text_color=theme->>'text_color',
    button_color=theme->>'button_color',button_text_color=theme->>'button_text_color', font=theme->>'font',
    radius=(theme->>'radius')::smallint,border_enabled=(theme->>'border_enabled')::boolean,
    shadow_enabled=(theme->>'shadow_enabled')::boolean,background_path=theme->>'background_path',
    revision=revision+1,updated_at=now() where site_id=1 returning * into current_theme;
  return current_theme;
end $$;
revoke all on function public.save_appearance(bigint,jsonb) from public,anon;
grant execute on function public.save_appearance(bigint,jsonb) to authenticated;
