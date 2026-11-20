export const THEMES = {
  dark: {
    preset: 'dark',
    background_type: 'solid',
    background_color: '#171719',
    gradient_color: '#381F22',
    text_color: '#EEEEEE',
    button_color: '#252527',
    button_text_color: '#EEEEEE',
    font: 'dm',
    radius: 14,
    border_enabled: true,
    shadow_enabled: false,
    background_path: null,
  },
}
THEMES.light = {
  ...THEMES.dark,
  preset: 'light',
  background_color: '#F3F1EF',
  text_color: '#1D1616',
  button_color: '#FFFFFF',
  button_text_color: '#1D1616',
}
THEMES.gradient = {
  ...THEMES.dark,
  preset: 'gradient',
  background_type: 'gradient',
  background_color: '#1D1616',
  gradient_color: '#8E1616',
  button_color: '#322124',
}
export const EMPTY_LINK = {
  title: '',
  description: '',
  url: '',
  icon_key: 'link',
  icon_color: '#ffffff',
  layout: 'classic',
  is_active: false,
  thumbnail_path: null,
}
