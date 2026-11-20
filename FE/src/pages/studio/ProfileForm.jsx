import { useState } from 'react'
import { Save, UserRound } from 'lucide-react'
import { PLATFORMS, profileSchema, validUrl } from '../../shared/lib/rules'
import { Button, Field } from '../../shared/ui/Controls'
import { ImageField } from '../../shared/ui/ImageField'
import { EditorHeading } from '../../shared/ui/EditorHeading'
import { saveWithImage } from '../../shared/lib/assetRepository'
import { siteRepository } from '../../features/site'
export function ProfileForm({ page, editor }) {
  const [errors, setErrors] = useState({})
  const form = editor.draft || {
    kind: 'profile',
    value: { ...page.profile },
    socials: page.socials,
    previous: page.profile.logo_path,
    expected: page.profile.revision,
  }
  function change(next) {
    editor.edit({ ...form, ...next, changed: true })
    setErrors({})
  }
  function field(key, value) {
    change({ value: { ...form.value, [key]: value } })
  }
  function social(platform, url) {
    const urls = {
      ...Object.fromEntries(form.socials.map((l) => [l.platform, l.url])),
      [platform]: url,
    }
    change({
      socials: Object.entries(urls)
        .filter(([, v]) => v)
        .map(([platform, url]) => ({ platform, url })),
    })
  }
  function save(e) {
    e.preventDefault()
    const parsed = profileSchema.safeParse(form.value),
      issues = {}
    if (!parsed.success)
      for (const issue of parsed.error.issues) issues[issue.path[0]] = issue.message
    for (const l of form.socials)
      if (!validUrl(l.url)) issues[l.platform] = 'Isi URL HTTP atau HTTPS lengkap yang valid.'
    setErrors(issues)
    if (Object.keys(issues).length) return
    editor.run(
      () =>
        saveWithImage({
          image: form.image,
          path: form.value.logo_path,
          previous: form.previous,
          folder: 'logos',
          save: (logo_path) =>
            siteRepository.save({ ...parsed.data, logo_path }, form.socials, form.expected),
        }),
      { after: () => editor.edit(null) },
    )
  }
  return (
    <form onSubmit={save} className="editor-panel">
      <fieldset disabled={editor.busy}>
        <EditorHeading icon={UserRound}>Profil toko</EditorHeading>
        <div className="editor-profile-grid">
          <div className="editor-profile-photo">
            <ImageField
              label="Logo toko"
              folder="logos"
              path={form.value.logo_path}
              image={form.image}
              onProcessing={editor.setProcessing}
              onChange={(image, logo_path) =>
                change({ image, value: { ...form.value, logo_path } })
              }
            />
          </div>
          <div className="editor-profile-text">
            <Field label="Nama toko" error={errors.store_name}>
              {(p) => (
                <input
                  {...p}
                  required
                  maxLength={60}
                  value={form.value.store_name}
                  onChange={(e) => field('store_name', e.target.value)}
                />
              )}
            </Field>
            <Field label="Bio" hint={form.value.bio.length + '/160 karakter'}>
              {(p) => (
                <textarea
                  {...p}
                  maxLength={160}
                  rows={3}
                  value={form.value.bio}
                  onChange={(e) => field('bio', e.target.value)}
                />
              )}
            </Field>
          </div>
        </div>
        <div className="editor-group">
          <h3>Media sosial</h3>
          <p className="muted">Kosongkan platform yang ingin disembunyikan.</p>
          <div className="editor-social-fields">
            {Object.entries(PLATFORMS).map(([key, label]) => (
              <Field key={key} label={label} error={errors[key]}>
                {(p) => (
                  <input
                    {...p}
                    type="url"
                    placeholder="https://"
                    value={form.socials.find((l) => l.platform === key)?.url || ''}
                    onChange={(e) => social(key, e.target.value)}
                  />
                )}
              </Field>
            ))}
          </div>
        </div>
        <Button type="submit" variant="primary" disabled={!editor.dirty}>
          <Save size={16} />
          {editor.busy ? 'Menyimpan…' : 'Simpan Perubahan'}
        </Button>
      </fieldset>
    </form>
  )
}
