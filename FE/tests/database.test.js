import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFile, readdir } from 'node:fs/promises'
const owner = '00000000-0000-4000-8000-000000000001',
  other = '00000000-0000-4000-8000-000000000002',
  avatarOwner = '00000000-0000-4000-8000-000000000003'
let db
async function role(name, uid = '') {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid])
  await db.exec('set role ' + name)
}
const scalar = async (sql, args = []) => Object.values((await db.query(sql, args)).rows[0])[0]
beforeAll(async () => {
  db = new PGlite()
  // Platform-owned schemas are fixture dependencies. Every application object comes from the migrations.
  await db.exec(`create role anon; create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,storage to anon,authenticated;
 alter default privileges in schema public grant all on tables to anon,authenticated;
 alter default privileges in schema public grant execute on functions to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(bucket_id text references storage.buckets(id),name text,primary key(bucket_id,name));
 alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to anon,authenticated;`)
  const folder = new URL('../../database/migrations/', import.meta.url)
  for (const name of (await readdir(folder)).filter((n) => n.endsWith('.sql')).sort())
    await db.exec(await readFile(new URL(name, folder), 'utf8'))
  await db.query('insert into auth.users values ($1),($2),($3)', [owner, other, avatarOwner])
  await db.query('insert into private.site_admins(user_id) values ($1)', [owner])
}, 45000)
afterAll(async () => {
  await db?.close()
})
describe('migrasi dan hak akses PostgreSQL', () => {
  it('anon dan authenticated lain hanya mendapatkan halaman yang dipublikasikan', async () => {
    for (const [name, uid] of [
      ['anon', ''],
      ['authenticated', other],
    ]) {
      await role(name, uid)
      expect(await scalar('select public.is_site_admin()')).toBe(false)
      expect(await scalar('select public.get_public_page()')).toBeNull()
      for (const table of ['site_settings', 'links', 'appearance', 'social_links'])
        expect(await scalar('select count(*)::int from public.' + table)).toBe(0)
      await expect(db.exec('select * from private.site_admins')).rejects.toMatchObject({
        code: '42501',
      })
      await expect(db.exec('select public.get_editor_page()')).rejects.toMatchObject({
        code: '42501',
      })
      await expect(db.exec('select public.set_publication(1,true)')).rejects.toMatchObject({
        code: '42501',
      })
      await expect(
        db.exec("update public.site_settings set store_name='test'"),
      ).rejects.toMatchObject({ code: '42501' })
    }
  })
  it('owner menyimpan, menerbitkan, dan mendeteksi revisi lama', async () => {
    await role('authenticated', owner)
    const draft = await scalar('select public.get_editor_page()')
    expect(draft.links).toHaveLength(6)
    await expect(db.exec('select public.set_publication(1,true)')).rejects.toMatchObject({
      message: 'active_link_required',
    })
    const link = draft.links[0],
      save = (params, rev = 1) =>
        db.query('select public.save_link($1,$2,$3)', [link.id, rev, { ...link, ...params }])
    await expect(save({ url: 'javascript:test', is_active: true })).rejects.toMatchObject({
      code: '23514',
    })
    await expect(save({ icon_key: 'unknown' })).rejects.toMatchObject({ code: '23514' })
    await save({
      url: 'https://www.tiktok.com/@coreconsign',
      icon_key: 'tiktok',
      icon_color: '#34cc88',
      is_active: true,
    })
    await expect(save({ title: 'Stale' })).rejects.toMatchObject({ code: 'PT409' })
    await db.exec('select public.set_publication(1,true)')
    expect((await scalar('select public.get_public_page()')).links).toMatchObject([
      { icon_key: 'tiktok', icon_color: '#34cc88' },
    ])
    for (const [name, uid] of [
      ['anon', ''],
      ['authenticated', other],
    ]) {
      await role(name, uid)
      expect(await scalar('select count(*)::int from public.links')).toBe(1)
      expect(await scalar('select count(*)::int from public.links where not is_active')).toBe(0)
      expect((await scalar('select public.get_public_page()')).profile.store_name).toBe(
        'Core Consign',
      )
    }
  })
  it('profil dan sosial berubah atomik, tema dan urutan memakai revisi', async () => {
    await role('authenticated', owner)
    const { links, theme, profile } = await scalar('select public.get_editor_page()')
    const profileSave = (socials) =>
      db.query('select public.save_profile($1,$2,$3)', [
        profile.revision,
        { ...profile, store_name: 'Core Lab' },
        JSON.stringify(socials),
      ])
    await expect(profileSave([{ platform: 'instagram', url: 'data:123' }])).rejects.toMatchObject({
      code: '23514',
    })
    expect((await scalar('select public.get_editor_page()')).profile.store_name).toBe(
      'Core Consign',
    )
    await profileSave([{ platform: 'instagram', url: 'https://instagram.com/coreconsign' }])
    await expect(profileSave([])).rejects.toMatchObject({ code: 'PT409' })
    await db.query('select public.save_appearance($1,$2)', [
      theme.revision,
      { ...theme, radius: 24 },
    ])
    await expect(
      db.query('select public.save_appearance($1,$2)', [theme.revision, theme]),
    ).rejects.toMatchObject({ code: 'PT409' })
    const ids = links.map((l) => l.id).reverse()
    const reorder = (order, rev = profile.order_revision) =>
      db.query('select public.reorder_links($1,$2::uuid[])', [rev, order])
    await expect(reorder(ids.slice(1))).rejects.toMatchObject({ code: '23514' })
    await expect(reorder(ids.map(() => ids[0]))).rejects.toMatchObject({ code: '23514' })
    await reorder(ids)
    await expect(reorder(ids)).rejects.toMatchObject({ code: 'PT409' })
    const updated = await scalar('select public.get_editor_page()')
    expect(updated.links.map((l) => l.id)).toEqual(ids)
    const duplicate = await scalar('select to_jsonb(public.save_link(null,null,$1))', [
      { ...links[0], title: 'Salinan', is_active: true },
    ])
    expect(duplicate.is_active).toBe(false)
    await db.query('select public.delete_link($1,$2)', [duplicate.id, duplicate.revision])
    await db.query('select public.set_publication($1,false)', [updated.profile.revision])
    await role('anon')
    expect(await scalar('select public.get_public_page()')).toBeNull()
  })
  it('Storage memeriksa owner, folder, dan referensi aktif', async () => {
    const path = 'logos/11111111-1111-4111-8111-111111111111.webp'
    const upload = (p) => db.query("insert into storage.objects values ('site-assets',$1)", [p])
    await role('authenticated', other)
    await expect(upload(path)).rejects.toMatchObject({ code: '42501' })
    await role('authenticated', owner)
    await expect(upload('elsewhere/bad.svg')).rejects.toMatchObject({ code: '42501' })
    await upload(path)
    const { profile } = await scalar('select public.get_editor_page()')
    await db.query('select public.save_profile($1,$2,$3)', [
      profile.revision,
      { ...profile, logo_path: path },
      '[]',
    ])
    await db.query('delete from storage.objects where name=$1', [path])
    expect(await scalar('select count(*)::int from storage.objects')).toBe(1)
    await db.query('select public.save_profile($1,$2,$3)', [
      profile.revision + 1,
      { ...profile, logo_path: null },
      '[]',
    ])
    await db.query('delete from storage.objects where name=$1', [path])
    expect(await scalar('select count(*)::int from storage.objects')).toBe(0)
  })
  it('halaman Linkfy terisolasi per akun dan hanya menampilkan tautan aktif setelah publikasi', async () => {
    const create = (slug, name) =>
      scalar('select to_jsonb(public.create_member_page($1,$2))', [slug, name])
    const readPublic = (slug) => scalar('select public.get_member_page($1)', [slug])
    const save = (revision, links, published) =>
      scalar('select to_jsonb(public.save_member_page($1,$2,$3,$4,$5,$6))', [
        revision,
        'Halaman Andi',
        'Bio',
        'light',
        JSON.stringify(links),
        published,
      ])
    const active = {
      id: '10000000-0000-4000-8000-000000000001',
      title: 'Portofolio',
      url: 'https://instagram.com/andi',
      icon_key: 'instagram',
      icon_color: '#ffffff',
      is_active: true,
    }
    const inactive = {
      ...active,
      id: '10000000-0000-4000-8000-000000000002',
      title: 'Draft',
      is_active: false,
    }

    await role('anon')
    await expect(create('andi', 'Andi')).rejects.toMatchObject({ code: '42501' })
    await expect(scalar("select public.member_slug_taken('andi')")).rejects.toMatchObject({
      code: '42501',
    })
    await role('authenticated', other)
    const created = await create('andi', 'Andi')
    expect((await create('alias-lain', 'Andi')).slug).toBe('andi')
    expect(await readPublic('andi')).toBeNull()
    expect(await scalar("select public.member_slug_taken(' ANDI ')")).toBe(true)
    expect(await scalar("select public.member_slug_taken('alias-lain')")).toBe(false)
    await expect(save(created.revision, [], true)).rejects.toMatchObject({ code: '23514' })
    await expect(
      save(created.revision, [{ ...active, url: 'javascript:alert(1)' }], true),
    ).rejects.toMatchObject({ code: '23514' })
    await expect(
      save(created.revision, [{ ...active, icon_key: 'unknown' }], true),
    ).rejects.toMatchObject({ code: '23514' })
    const published = await save(created.revision, [active, inactive], true)
    await expect(save(created.revision, [active], false)).rejects.toMatchObject({ code: 'PT409' })

    await role('authenticated', owner)
    expect(await scalar("select count(*)::int from public.member_pages where slug='andi'")).toBe(0)
    await expect(create(' ANDI ', 'Owner')).rejects.toMatchObject({ code: '23505' })
    await expect(create(' Dashboard ', 'Owner')).rejects.toMatchObject({
      code: '23514',
      message: 'reserved_member_slug',
    })
    await expect(save(published.revision, [active], false)).rejects.toMatchObject({ code: 'PT409' })
    await expect(
      db.exec("update public.member_pages set published=false where slug='andi'"),
    ).rejects.toMatchObject({ code: '42501' })
    await create('core-team', 'Owner')
    expect(await scalar('select count(*)::int from public.member_pages')).toBe(1)

    await role('anon')
    const publicPage = await readPublic('andi')
    expect(publicPage.links.map((link) => link.title)).toEqual(['Portofolio'])
    expect(publicPage).not.toHaveProperty('owner_id')
    expect(await readPublic('core-team')).toBeNull()
    await role('authenticated', other)
    await save(published.revision, [active, inactive], false)
    await role('anon')
    expect(await readPublic('andi')).toBeNull()
  })
  it('foto Linkfy tetap privat sampai publikasi dan hanya bisa diganti pemiliknya', async () => {
    const path = 'maya/10000000-0000-4000-8000-000000000001.webp'
    const absent = 'maya/10000000-0000-4000-8000-000000000002.webp'
    const photoCount = () =>
      scalar(
        "select count(*)::int from storage.objects where bucket_id='member-avatars' and name=$1",
        [path],
      )
    const save = (revision, photo, published) =>
      scalar('select to_jsonb(public.save_member_page($1,$2,$3,$4,$5,$6,$7))', [
        revision,
        'Maya',
        '',
        'light',
        JSON.stringify([
          {
            id: '10000000-0000-4000-8000-000000000003',
            title: 'Portofolio',
            url: 'https://instagram.com/maya',
            icon_key: 'instagram',
            icon_color: '#ffffff',
            is_active: true,
          },
        ]),
        published,
        photo,
      ])
    const upload = () =>
      db.query("insert into storage.objects values ('member-avatars',$1)", [path])
    const remove = () =>
      db.query("delete from storage.objects where bucket_id='member-avatars' and name=$1", [path])
    await role('authenticated', avatarOwner)
    const created = await scalar("select to_jsonb(public.create_member_page('maya','Maya'))")
    await expect(save(created.revision, absent, false)).rejects.toMatchObject({
      message: 'avatar_not_found',
    })
    await upload()
    const draft = await save(created.revision, path, false)
    await role('anon')
    expect(await photoCount()).toBe(0)
    await role('authenticated', other)
    await expect(upload()).rejects.toMatchObject({ code: '42501' })
    await expect(save(1, path, false)).rejects.toMatchObject({ code: '42501' })
    expect(await photoCount()).toBe(0)
    await role('authenticated', avatarOwner)
    await remove()
    expect(await photoCount()).toBe(1)
    const published = await save(draft.revision, path, true)
    await role('anon')
    expect(await photoCount()).toBe(1)
    expect((await scalar("select public.get_member_page('maya')")).avatar_path).toBe(path)
    await role('authenticated', avatarOwner)
    await save(published.revision, null, true)
    await remove()
    expect(await photoCount()).toBe(0)
  })
  it('menyimpan tema secara atomik dan hanya membagikan gaya tautan aktif', async () => {
    const uid = '00000000-0000-4000-8000-000000000004'
    await db.exec('reset role')
    await db.query('insert into auth.users values ($1)', [uid])
    await role('authenticated', uid)
    const created = await scalar("select to_jsonb(public.create_member_page('tema','Tema'))")
    expect(created.appearance).toEqual({})
    const links = [true, false].map((is_active, index) => ({
      id: '10000000-0000-4000-8000-00000000000' + index,
      title: 'Tautan ' + index,
      url: 'https://www.tiktok.com/@tema',
      is_active,
      icon_key: 'tiktok',
      icon_color: '#34cc88',
    }))
    const iconStyle = { radius: 0, icon_style: 'outline', icon_shape: 'circle' }
    const styles = { [links[0].id]: iconStyle, [links[1].id]: { effect: 'glass' } }
    const appearance = { background: '#ffee00', effect: 'soft', radius: 17, icon_style: 'bare' }
    const save = (theme, overrides, revision = 1) =>
      scalar('select to_jsonb(public.save_member_page($1,$2,$3,$4,$5,$6,$7,$8,$9))', [
        revision,
        'Tema',
        '',
        'light',
        JSON.stringify(links),
        true,
        null,
        theme,
        overrides,
      ])
    await expect(save({ background: 'red' }, styles)).rejects.toMatchObject({ code: '23514' })
    await expect(save(appearance, { [uid]: {} })).rejects.toMatchObject({ code: '23514' })
    await expect(save(appearance, { [links[0].id]: { effect: 'curved' } })).rejects.toMatchObject({
      code: '23514',
    })
    await expect(
      save(appearance, { [links[0].id]: { icon_shape: 'triangle' } }),
    ).rejects.toMatchObject({ code: '23514' })
    await expect(save({ icon_style: 'invalid' }, styles)).rejects.toMatchObject({ code: '23514' })
    await expect(save({ radius: 51 }, styles)).rejects.toMatchObject({ code: '23514' })
    await expect(save({ radius: '17' }, styles)).rejects.toMatchObject({ code: '23514' })
    await expect(save(appearance, { [links[0].id]: { radius: 2.5 } })).rejects.toMatchObject({
      code: '23514',
    })
    const saved = await save(appearance, styles)
    expect(saved.link_styles).toEqual(styles)
    await expect(save({}, {})).rejects.toMatchObject({ code: 'PT409' })
    await role('anon')
    const published = await scalar("select public.get_member_page('tema')")
    expect(published.appearance).toEqual(appearance)
    expect(published.links).toMatchObject([{ icon_key: 'tiktok', icon_color: '#34cc88' }])
    expect(published.link_styles).toEqual({ [links[0].id]: iconStyle })
    await expect(save({}, {}, saved.revision)).rejects.toMatchObject({ code: '42501' })
  })

  it('statistik hanya mencatat halaman publik dan hanya terbaca pemiliknya', async () => {
    const user = '00000000-0000-4000-8000-000000000005'
    const link = {
      id: '20000000-0000-4000-8000-000000000001',
      title: 'WhatsApp',
      url: 'https://wa.me/62812345678',
      is_active: true,
      icon_key: 'whatsapp',
      icon_color: '#ffffff',
    }
    const inactive = { ...link, id: '20000000-0000-4000-8000-000000000002', is_active: false }
    const record = (slug, id = null, source = 'other') =>
      db.query('select public.record_page_analytics($1,$2,$3)', [slug, id, source])
    const read = (days = 7, store = false) =>
      scalar('select public.read_page_analytics($1,$2)', [days, store])

    await db.exec('reset role')
    await db.query('insert into auth.users values ($1)', [user])
    await role('authenticated', user)
    await scalar("select public.create_member_page('ukuran','Ukuran')")
    await role('anon')
    await record('ukuran')
    await expect(read()).rejects.toMatchObject({ code: '42501' })
    await expect(db.exec('select * from private.page_analytics_daily')).rejects.toMatchObject({
      code: '42501',
    })
    await role('authenticated', user)
    expect((await read()).days.at(-1)).toMatchObject({ views: 0, clicks: 0, qrViews: 0 })
    await db.query("select public.save_member_page(1,'Ukuran','','light',$1,true)", [
      JSON.stringify([link, inactive]),
    ])
    await role('anon')
    await record('ukuran', null, 'qr')
    await record('ukuran')
    await record('ukuran', link.id, 'qr')
    await record('ukuran', link.id)
    await record('ukuran', inactive.id)
    await record('ukuran', null, 'arbitrary')
    await role('authenticated', user)
    const report = await read(30)
    expect(report.days).toHaveLength(30)
    expect(report.days.at(-1)).toMatchObject({ views: 2, clicks: 2, qrViews: 1 })
    expect(report.links).toEqual([{ id: link.id, title: link.title, clicks: 2 }])
    await expect(read(90)).rejects.toMatchObject({ code: '23514' })
    await expect(read(7, true)).rejects.toMatchObject({ code: '42501' })
    await role('authenticated', other)
    expect((await read()).days.at(-1)).toMatchObject({ views: 0, clicks: 0, qrViews: 0 })

    await role('authenticated', owner)
    const store = await scalar('select public.get_editor_page()')
    await db.query('select public.set_publication($1,true)', [store.profile.revision])
    await role('anon')
    await record(null)
    await record(null, store.links.find((item) => item.is_active).id)
    await role('authenticated', owner)
    const storeReport = await read(7, true)
    expect(storeReport.days.at(-1)).toMatchObject({ views: 1, clicks: 1, qrViews: 0 })
    expect(storeReport.links).toHaveLength(1)
  })
})
