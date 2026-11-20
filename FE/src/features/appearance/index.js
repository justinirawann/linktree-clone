import { rpc } from '../../shared/lib/transport'
export const appearanceRepository = {
  save: (theme, expected) => rpc('save_appearance', { theme, expected }),
}
