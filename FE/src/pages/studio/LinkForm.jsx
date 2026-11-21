import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link2 } from 'lucide-react'
import { EditorHeading } from '../../shared/ui/EditorHeading'
import { Button, Field } from '../../shared/ui/Controls'
import { ImageField } from '../../shared/ui/ImageField'
import { linkSchema, ICON_LABELS } from '../../shared/lib/rules'
import { linkRepository } from '../../features/links'
import { saveWithImage } from '../../shared/lib/assetRepository'
import { WhatsAppFields } from './WhatsAppFields'
import { ChannelIcon } from '../../features/storefront'
export function LinkForm({ editor, onCancel }) {
  const form = editor.draft
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: form.value, resolver: zodResolver(linkSchema) })
  function update(fields) {
    editor.edit({ ...form, ...fields, changed: true })
  }
  const connect = (name) =>
    register(name, {
      onChange: () =>
        update({
          value: { ...form.value, ...getValues(), thumbnail_path: form.value.thumbnail_path },
        }),
    })
  function save(entry) {
    editor.run(
      () =>
        saveWithImage({
          image: form.image,
          path: form.value.thumbnail_path,
          previous: form.previous,
          folder: 'thumbnails',
          save: (thumbnail_path) =>
            linkRepository.save(
              { ...entry, thumbnail_path },
              form.id || form.createId,
              form.expected,
            ),
        }),
      { after: () => editor.edit(null) },
    )
  }
  return (
    <form className="editor-panel" onSubmit={handleSubmit(save)} noValidate>
      <fieldset disabled={editor.busy}>
        <EditorHeading icon={Link2}>{form.id ? 'Edit tautan' : 'Tautan baru'}</EditorHeading>
        <Field label="Judul tautan" error={errors.title?.message}>
          {(p) => <input {...p} {...connect('title')} maxLength={100} autoFocus />}
        </Field>
        <Field
          label="URL tujuan"
          hint="Gunakan URL lengkap. Untuk WhatsApp, gunakan https://wa.me/ diikuti nomor internasional."
          error={errors.url?.message}
        >
          {(p) => <input {...p} {...connect('url')} type="url" placeholder="https://" />}
        </Field>
        {['whatsapp', 'consign'].includes(form.value.icon_key) && (
          <WhatsAppFields
            onApply={(url) => {
              setValue('url', url, { shouldDirty: true, shouldValidate: true })
              update({ value: { ...form.value, url } })
            }}
          />
        )}
        <Field label="Deskripsi" error={errors.description?.message}>
          {(p) => <textarea {...p} {...connect('description')} rows={2} maxLength={160} />}
        </Field>
        <div className="form-pair">
          <Field label="Ikon">
            {(p) => (
              <select className="dropdown" {...p} {...connect('icon_key')}>
                {Object.entries(ICON_LABELS).map(([icon, label]) => (
                  <option key={icon} value={icon}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Gaya kartu">
            {(p) => (
              <select className="dropdown" {...p} {...connect('layout')}>
                <option value="classic">Classic</option>
                <option value="featured">Featured</option>
              </select>
            )}
          </Field>
        </div>
        <Field
          label="Warna ikon"
          hint={
            form.value.thumbnail_path || form.image
              ? 'Thumbnail menggantikan ikon pada kartu ini.'
              : undefined
          }
        >
          {(p) => (
            <span className="color-input">
              <input {...p} {...connect('icon_color')} type="color" />
              <span className="icon-color-sample">
                <ChannelIcon name={form.value.icon_key} color={form.value.icon_color} />
              </span>
              {form.value.icon_color?.toUpperCase()}
            </span>
          )}
        </Field>
        <ImageField
          label="Thumbnail"
          folder="thumbnails"
          path={form.value.thumbnail_path}
          image={form.image}
          onProcessing={editor.setProcessing}
          onChange={(image, thumbnail_path) =>
            update({ image, value: { ...form.value, thumbnail_path } })
          }
        />
        {form.id ? (
          <label className="check">
            <input type="checkbox" {...connect('is_active')} />
            Tautan aktif
          </label>
        ) : (
          <p className="notice">Tautan baru disimpan nonaktif. Aktifkan setelah URL siap.</p>
        )}
        <div className="button-row">
          <Button type="submit" variant="primary">
            {editor.busy ? 'Menyimpan…' : 'Simpan Perubahan'}
          </Button>
          <Button onClick={onCancel}>Batal</Button>
        </div>
      </fieldset>
    </form>
  )
}
