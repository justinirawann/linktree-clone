import { EMPTY_LINK } from '../../../shared/lib/defaults'
import { ICON_LABELS } from '../../../shared/lib/rules'
import { Button, Field } from '../../../shared/ui/Controls'
import { ColorField } from '../../../shared/ui/ColorField'
import { EditorHeading } from '../../../shared/ui/EditorHeading'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Link2,
  Plus,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { resolveMemberTheme, resolveLinkButton } from '../themes'
import { ButtonFields } from './MemberAppearance'

export function MemberLinks({
  links,
  onChange,
  issue,
  preset,
  appearance,
  linkStyles = {},
  onStyleChange,
  linkIcon: LinkIcon = Link2,
}) {
  const theme = resolveMemberTheme(preset, appearance)
  function update(index, patch) {
    onChange(links.map((link, position) => (position === index ? { ...link, ...patch } : link)))
  }
  function move(index, direction) {
    const next = [...links]
    const target = index + direction
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <section id="tautan" className="editor-panel member-section member-links" tabIndex={-1}>
      <div className="member-links-heading">
        <EditorHeading icon={Link2}>Tautan</EditorHeading>
        <Button
          disabled={links.length >= 50}
          onClick={() =>
            onChange([...links, { ...EMPTY_LINK, id: crypto.randomUUID(), is_active: true }])
          }
        >
          <Plus size={16} aria-hidden="true" />
          Tambah tautan
        </Button>
      </div>
      {!links.length && (
        <p className="editor-empty">Tambahkan tautan pertama yang ingin kamu bagikan.</p>
      )}
      {links.map((link, index) => (
        <article className="member-link-card" key={link.id}>
          <header className="member-link-title">
            <span aria-hidden="true">
              <LinkIcon name={link.icon_key} color={link.icon_color} size={21} />
            </span>
            <h3>{link.title.trim() || 'Tautan ' + (index + 1)}</h3>
          </header>
          <div className="member-link-fields">
            <Field
              label={'Judul tautan ' + (index + 1)}
              error={issue?.id === link.id && issue?.field === 'title' ? issue.message : undefined}
            >
              {(props) => (
                <input
                  {...props}
                  name={link.id + '-title'}
                  maxLength={100}
                  value={link.title}
                  onChange={(event) => update(index, { title: event.target.value })}
                />
              )}
            </Field>
            <Field
              label={'URL tujuan ' + (index + 1)}
              error={issue?.id === link.id && issue?.field === 'url' ? issue.message : undefined}
            >
              {(props) => (
                <input
                  {...props}
                  name={link.id + '-url'}
                  inputMode="url"
                  maxLength={2048}
                  placeholder="instagram.com/akunmu"
                  value={link.url}
                  onChange={(event) => update(index, { url: event.target.value })}
                />
              )}
            </Field>
            <Field label="Ikon">
              {(props) => (
                <select
                  {...props}
                  value={link.icon_key}
                  onChange={(event) => update(index, { icon_key: event.target.value })}
                >
                  {Object.entries(ICON_LABELS).map(([icon, label]) => (
                    <option key={icon} value={icon}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <ColorField
              label="Warna ikon"
              value={link.icon_color}
              onChange={(icon_color) => update(index, { icon_color })}
            />
          </div>
          <details className="member-link-style">
            <summary>
              <SlidersHorizontal size={16} aria-hidden="true" />
              Tampilan khusus tautan {index + 1}
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <ButtonFields
              settings={linkStyles[link.id] || {}}
              button={resolveLinkButton(theme, linkStyles[link.id])}
              perLink
              onChange={(settings) => {
                const next = { ...linkStyles, [link.id]: settings }
                if (!Object.keys(settings).length) delete next[link.id]
                onStyleChange(next)
              }}
            />
          </details>
          <div className="button-row member-link-actions">
            <label className="check">
              <input
                type="checkbox"
                checked={link.is_active}
                onChange={(event) => update(index, { is_active: event.target.checked })}
              />{' '}
              Aktif
            </label>
            <Button disabled={index === 0} onClick={() => move(index, -1)}>
              <ArrowUp size={14} />
              Naik
            </Button>
            <Button disabled={index === links.length - 1} onClick={() => move(index, 1)}>
              <ArrowDown size={14} />
              Turun
            </Button>
            <Button onClick={() => onChange(links.filter((item) => item.id !== link.id))}>
              <Trash2 size={14} />
              Hapus
            </Button>
          </div>
        </article>
      ))}
    </section>
  )
}
