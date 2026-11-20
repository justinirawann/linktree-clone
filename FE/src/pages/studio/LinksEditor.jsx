import { useState } from 'react'
import { ArrowUp, ArrowDown, Copy, GripVertical, Link2, Pencil, Plus, Trash2 } from 'lucide-react'
import { EditorHeading } from '../../shared/ui/EditorHeading'
import { ChannelIcon } from '../../features/storefront'
import { EMPTY_LINK } from '../../shared/lib/defaults'
import { validUrl } from '../../shared/lib/rules'
import { linkRepository } from '../../features/links'
import { assetRepository } from '../../shared/lib/assetRepository'
import { Button, Dialog } from '../../shared/ui/Controls'
import { LinkForm } from './LinkForm'
function Tool({ label, icon: Icon, ...props }) {
  return (
    <Button aria-label={label} title={label} className="icon-btn" {...props}>
      <Icon size={16} />
    </Button>
  )
}
export function LinksEditor({ page, editor }) {
  const [remove, setRemove] = useState(null),
    [drag, setDrag] = useState(null)
  const links = editor.order || page.links
  function open(link, duplicate = false) {
    const existing = link && !duplicate
    editor.edit({
      kind: 'link',
      id: existing ? link.id : null,
      createId: existing ? null : crypto.randomUUID(),
      expected: existing ? link.revision : null,
      previous: existing ? link.thumbnail_path : null,
      changed: Boolean(duplicate),
      value: {
        ...EMPTY_LINK,
        ...link,
        url: link?.url || '',
        ...(duplicate
          ? { title: (link.title + ' (salinan)').slice(0, 100), is_active: false }
          : {}),
      },
    })
  }
  function move(from, to) {
    if (from === to || from < 0 || to < 0 || to >= links.length || editor.busy) return
    const next = [...links]
    next.splice(to, 0, ...next.splice(from, 1))
    const ids = next.map((l) => l.id)
    editor.run(() => linkRepository.reorder(ids, page.profile.order_revision), {
      optimistic: next,
      retry: true,
    })
  }
  function cancel() {
    if (!editor.dirty || window.confirm('Buang perubahan tautan ini?')) editor.edit(null)
  }
  async function deleteLink() {
    await linkRepository.remove(remove.id, remove.revision)
    if (remove.thumbnail_path) {
      try {
        await assetRepository.cleanup(remove.thumbnail_path)
      } catch {
        return 'Tautan dihapus. Thumbnail lama perlu dibersihkan dari Storage.'
      }
    }
    return 'Tautan dihapus.'
  }
  if (editor.draft?.kind === 'link') return <LinkForm editor={editor} onCancel={cancel} />
  return (
    <section>
      <div className="list-heading">
        <div>
          <EditorHeading icon={Link2}>Daftar tautan</EditorHeading>
          <p className="muted">
            {links.length} tautan · {links.filter((l) => l.is_active).length} aktif
          </p>
        </div>
        <Button variant="primary" disabled={editor.busy} onClick={() => open(null)}>
          <Plus size={16} />
          Tambah tautan
        </Button>
      </div>
      {!links.length && <p className="empty">Tambahkan tautan pertama untuk toko kamu.</p>}
      <ul className="editor-links">
        {links.map((l, index) => (
          <li
            key={l.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              move(
                links.findIndex((x) => x.id === drag),
                index,
              )
              setDrag(null)
            }}
          >
            <div className="editor-link-main">
              <span
                className="drag-handle"
                draggable={!editor.busy}
                onDragStart={(e) => {
                  setDrag(l.id)
                  e.dataTransfer.setData('text/plain', l.id)
                }}
                onDragEnd={() => setDrag(null)}
                title="Seret untuk memindahkan"
              >
                <GripVertical size={16} />
              </span>
              <span className={'channel-icon small channel-' + l.icon_key}>
                <ChannelIcon name={l.icon_key} color={l.icon_color} />
              </span>
              <div className="min-w-0">
                <h3>{l.title}</h3>
                <p className="truncate">{l.url || 'URL belum diisi'}</p>
              </div>
            </div>
            <div className="link-tools">
              <button
                type="button"
                className="switch-btn"
                aria-pressed={l.is_active}
                aria-label={(l.is_active ? 'Nonaktifkan ' : 'Aktifkan ') + l.title}
                disabled={editor.busy}
                onClick={() => {
                  if (!l.is_active && !validUrl(l.url)) {
                    open(l)
                    return
                  }
                  editor.run(() =>
                    linkRepository.save(
                      { ...l, url: l.url || '', is_active: !l.is_active },
                      l.id,
                      l.revision,
                    ),
                  )
                }}
              >
                <i />
                {l.is_active ? 'Aktif' : 'Nonaktif'}
              </button>
              <div className="tool-group">
                <Tool
                  label={'Naikkan ' + l.title}
                  icon={ArrowUp}
                  disabled={index === 0 || editor.busy}
                  onClick={() => move(index, index - 1)}
                />
                <Tool
                  label={'Turunkan ' + l.title}
                  icon={ArrowDown}
                  disabled={index === links.length - 1 || editor.busy}
                  onClick={() => move(index, index + 1)}
                />
                <Tool
                  label={'Edit ' + l.title}
                  icon={Pencil}
                  disabled={editor.busy}
                  onClick={() => open(l)}
                />
                <Tool
                  label={'Duplikat ' + l.title}
                  icon={Copy}
                  disabled={editor.busy}
                  onClick={() => open(l, true)}
                />
                <Tool
                  label={'Hapus ' + l.title}
                  icon={Trash2}
                  disabled={editor.busy}
                  onClick={() => setRemove(l)}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      {remove && (
        <Dialog
          title="Hapus tautan?"
          onClose={() => {
            if (!editor.busy) setRemove(null)
          }}
        >
          <p>“{remove.title}” akan dihapus dari daftar toko.</p>
          {editor.feedback?.error && <p role="alert">{editor.feedback.message}</p>}
          <div className="button-row">
            <Button disabled={editor.busy} onClick={() => setRemove(null)}>
              Batal
            </Button>
            <Button
              variant="primary"
              disabled={editor.busy}
              onClick={() => editor.run(deleteLink, { after: () => setRemove(null) })}
            >
              Hapus tautan
            </Button>
          </div>
        </Dialog>
      )}
    </section>
  )
}
