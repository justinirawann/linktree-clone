import { Save, Check, Palette } from 'lucide-react'
import { EditorHeading } from '../../shared/ui/EditorHeading'
import { THEMES } from '../../shared/lib/defaults'
import { themeSchema } from '../../shared/lib/rules'
import { appearanceRepository } from '../../features/appearance'
import { saveWithImage } from '../../shared/lib/assetRepository'
import { ImageField } from '../../shared/ui/ImageField'
import { Button, Field } from '../../shared/ui/Controls'
import { ColorField } from '../../shared/ui/ColorField'
const NAMES = { dark: 'Core Consign Dark', light: 'Light', gradient: 'Gradient' }
const COLORS = {
  background_color: 'Warna latar',
  gradient_color: 'Warna gradasi',
  text_color: 'Warna teks',
  button_color: 'Warna tombol',
  button_text_color: 'Teks tombol',
}
export function AppearanceForm({ page, editor }) {
  const form = editor.draft || {
    kind: 'theme',
    value: page.theme,
    expected: page.theme.revision,
    previous: page.theme.background_path,
  }
  const t = form.value
  function change(patch, extra = {}) {
    editor.edit({ ...form, value: { ...t, preset: 'custom', ...patch }, changed: true, ...extra })
  }
  function save(e) {
    e.preventDefault()
    editor.run(
      () =>
        saveWithImage({
          image: form.image,
          path: t.background_path,
          previous: form.previous,
          folder: 'backgrounds',
          save: (background_path) =>
            appearanceRepository.save(themeSchema.parse({ ...t, background_path }), form.expected),
        }),
      { after: () => editor.edit(null) },
    )
  }
  return (
    <form className="editor-panel" onSubmit={save}>
      <fieldset disabled={editor.busy}>
        <EditorHeading icon={Palette}>Preset tema</EditorHeading>
        <div className="preset-grid">
          {Object.entries(NAMES).map(([key, name]) => (
            <button
              type="button"
              key={key}
              className={'preset ' + key}
              aria-pressed={t.preset === key}
              onClick={() => change(THEMES[key], { image: null })}
            >
              <i />
              <b>{name}</b>
              {t.preset === key && <Check size={14} />}
            </button>
          ))}
        </div>
        <h3>Latar dan warna</h3>
        <Field label="Jenis latar">
          {(p) => (
            <select
              className="dropdown"
              {...p}
              value={t.background_type}
              onChange={(e) => change({ background_type: e.target.value })}
            >
              <option value="solid">Solid</option>
              <option value="gradient">Gradasi</option>
              <option value="image">Gambar</option>
            </select>
          )}
        </Field>
        {t.background_type === 'image' && (
          <ImageField
            label="Gambar latar"
            folder="backgrounds"
            path={t.background_path}
            image={form.image}
            onProcessing={editor.setProcessing}
            onChange={(image, background_path) => change({ background_path }, { image })}
          />
        )}
        <div className="colors">
          {Object.entries(COLORS)
            .filter(([key]) => key !== 'gradient_color' || t.background_type === 'gradient')
            .map(([key, label]) => (
              <ColorField
                key={key}
                label={label}
                value={t[key]}
                onChange={(value) => change({ [key]: value })}
              />
            ))}
        </div>
        <Field label="Font">
          {(p) => (
            <select
              className="dropdown"
              {...p}
              value={t.font}
              onChange={(e) => change({ font: e.target.value })}
            >
              <option value="dm">DM Sans</option>
              <option value="system">System Sans</option>
              <option value="georgia">Georgia</option>
            </select>
          )}
        </Field>
        <Field label={'Sudut tombol · ' + t.radius + ' px'}>
          {(p) => (
            <input
              {...p}
              type="range"
              min="0"
              max="36"
              value={t.radius}
              onChange={(e) => change({ radius: Number(e.target.value) })}
            />
          )}
        </Field>
        <div className="button-row">
          {[
            ['border_enabled', 'Garis tepi'],
            ['shadow_enabled', 'Bayangan'],
          ].map(([key, label]) => (
            <label className="check" key={key}>
              <input
                type="checkbox"
                checked={t[key]}
                onChange={(e) => change({ [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
        <Button variant="primary" type="submit" disabled={!editor.dirty}>
          <Save size={16} />
          {editor.busy ? 'Menyimpan…' : 'Simpan Perubahan'}
        </Button>
      </fieldset>
    </form>
  )
}
