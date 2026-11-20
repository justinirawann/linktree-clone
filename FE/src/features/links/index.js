import { rpc } from '../../shared/lib/transport'
export const linkRepository = {
  save: (entry, id = null, expected = null) => rpc('save_link', { entry, link_id: id, expected }),
  remove: (id, expected) => rpc('delete_link', { link_id: id, expected }),
  reorder: (ids, expected) => rpc('reorder_links', { ids, expected }),
}
