import { Field } from '../../../shared/ui/Controls'
import { ColorField } from '../../../shared/ui/ColorField'
import { EditorHeading } from '../../../shared/ui/EditorHeading'
import { Palette } from 'lucide-react'
import {
  BUTTON_EFFECTS,
  BUTTON_SHAPES,
  ICON_SHAPES,
  ICON_STYLES,
  resolveMemberTheme,
  resolveLinkIcon,
} from '../themes'

function patchStyle(current, key, value) {
  const next = { ...current, [key]: value }
  if (!value) delete next[key]
  return next
}

export function ButtonFields({ settings, button, onChange, perLink = false }) {
  const reset = perLink ? 'Ikuti tema' : 'Otomatis'
  function change(key, value) {
    onChange(patchStyle(settings, key, value))
  }
  return (
    <div className="member-link-fields">
      {[
        [
          'shape',
          'Bentuk tombol',
          Object.entries(BUTTON_SHAPES).map(([key, shape]) => [key, shape.label]),
        ],
        ['effect', 'Gaya tombol', Object.entries(BUTTON_EFFECTS)],
      ].map(([key, label, options]) => (
        <Field key={key} label={label}>
          {(props) => (
            <select
              {...props}
              value={perLink ? settings[key] || '' : button[key]}
              onChange={(e) => change(key, e.target.value)}
            >
              {perLink && <option value="">Ikuti tema</option>}
              {options.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          )}
        </Field>
      ))}
      <ColorField
        label="Warna tombol"
        value={button.fill}
        custom={settings.fill}
        resetLabel={reset}
        onChange={(v) => change('fill', v)}
      />
      <ColorField
        label="Warna teks tombol"
        value={button.ink}
        custom={settings.ink}
        resetLabel={reset}
        onChange={(v) => change('ink', v)}
      />
    </div>
  )
}

export function MemberAppearance({ preset, settings = {}, onChange }) {
  const { theme, button } = resolveMemberTheme(preset, settings)
  const icon = resolveLinkIcon(settings)
  const iconFields = [['icon_style', 'Tampilan ikon', icon.style, ICON_STYLES]]
  if (icon.style !== 'bare')
    iconFields.push(['icon_shape', 'Bentuk wadah ikon', icon.shape, ICON_SHAPES])
  return (
    <section
      className="editor-panel member-section member-appearance"
      id="tampilan"
      tabIndex={-1}
      aria-label="Tampilan halaman"
    >
      <EditorHeading icon={Palette}>Tampilan halaman</EditorHeading>
      <div className="editor-group">
        <h3>Latar halaman</h3>
        <div className="member-link-fields">
          <Field label="Tema">
            {(props) => (
              <select
                {...props}
                value={preset}
                onChange={(e) => {
                  const colors = { ...settings }
                  delete colors.background
                  delete colors.gradient
                  const fields = { theme: e.target.value }
                  if (settings.background || settings.gradient) fields.appearance = colors
                  onChange(fields)
                }}
              >
                <option value="light">Terang</option>
                <option value="dark">Gelap</option>
                <option value="gradient">Gradasi</option>
              </select>
            )}
          </Field>
          <ColorField
            label="Warna latar"
            value={theme.background_color}
            custom={settings.background}
            resetLabel="Pakai preset"
            onChange={(v) => onChange({ appearance: patchStyle(settings, 'background', v) })}
          />
          {preset === 'gradient' && (
            <ColorField
              label="Warna akhir gradasi"
              value={theme.gradient_color}
              custom={settings.gradient}
              resetLabel="Pakai preset"
              onChange={(v) => onChange({ appearance: patchStyle(settings, 'gradient', v) })}
            />
          )}
        </div>
      </div>
      <div className="editor-group">
        <h3>Tombol tautan</h3>
        <p className="muted">
          Warna tombol dan teks menyesuaikan latar sampai kamu memilih warna sendiri.
        </p>
        <ButtonFields
          settings={settings}
          button={button}
          onChange={(appearance) => onChange({ appearance })}
        />
      </div>
      <div className="editor-group">
        <h3>Ikon semua tautan</h3>
        <div className="member-link-fields">
          {iconFields.map(([key, label, selected, options]) => (
            <Field key={key} label={label}>
              {(props) => (
                <select
                  {...props}
                  value={selected}
                  onChange={(e) =>
                    onChange({ appearance: patchStyle(settings, key, e.target.value) })
                  }
                >
                  {Object.entries(options).map(([value, name]) => (
                    <option key={value} value={value}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          ))}
        </div>
      </div>
    </section>
  )
}
