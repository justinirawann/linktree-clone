# CODE_STANDARD — React + Vite + Tailwind CSS

Versi: 1.0  
Tanggal: 20 November 2026  
Bahasa: JavaScript ES Modules (`.js` dan `.jsx`).  
Berlaku untuk seluruh frontend, termasuk kode yang dihasilkan AI.  
Prioritas: correctness → readability → maintainability → performance berdasarkan pengukuran.

## 1. Aturan utama

Dokumen ini merupakan standar implementasi wajib. `WAJIB` berarti syarat review; `SEBAIKNYA` berarti default yang dapat dikecualikan dengan alasan teknis tertulis pada PR.

1. WAJIB menggunakan functional components dan React Hooks.
2. WAJIB memisahkan render UI, aturan bisnis, dan akses data.
3. WAJIB menggunakan JavaScript; jangan menambahkan TypeScript tanpa keputusan proyek.
4. WAJIB menerapkan SOLID secara proporsional melalui composition, props, hooks, dan adapter.
5. WAJIB menggunakan komponen reusable untuk perilaku/tampilan yang benar-benar sama.
6. WAJIB menyediakan state loading, empty, error, dan success yang relevan.
7. WAJIB menangani aksesibilitas dan responsivitas sebagai bagian implementasi.
8. DILARANG menyimpan secret atau menjadikan frontend sebagai otoritas keamanan.
9. DILARANG menganggap mock/localStorage sebagai persistence production.
10. DILARANG mengubah requirement diam-diam untuk menyederhanakan implementasi.

Jangan membuat abstraksi generik sebelum ada kebutuhan konkret. Fungsi kecil dan composition sering cukup; proyek ini tidak memerlukan class hierarchy atau dependency-injection framework.

## 2. Stack dan setup

| Area | Standar |
| --- | --- |
| UI | React, Vite, JavaScript |
| Styling | Tailwind CSS v4 dengan plugin Vite; kunci versi yang dipakai pada lockfile |
| Routing | React Router; gunakan satu mode routing secara konsisten |
| Server state | TanStack Query untuk fetch, cache, dan mutation |
| Form kompleks | React Hook Form + schema validation, misalnya Zod |
| Form sederhana | Controlled input lokal jika lebih jelas |
| Icons | Satu library SVG; jangan campur beberapa icon packs tanpa kebutuhan |
| Class composition | `clsx` + `tailwind-merge` pada helper `cn` |
| Lint/format | ESLint, React Hooks lint, Prettier |
| Unit/integration | Vitest + React Testing Library + user-event |
| API mock | MSW pada development/test |
| End-to-end | Playwright untuk alur inti |

Tambahkan dependency hanya jika manfaatnya jelas. Jangan mengimpor library alternatif yang menduplikasi fungsi yang sudah tersedia. Commit `package-lock.json` dan gunakan `npm ci` pada CI. Versi Node dan package manager dicatat pada repository; jangan mengarang versi kompatibel tanpa memeriksa package yang dipilih.

Contoh integrasi Tailwind v4:

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

```css
/* src/styles/index.css */
@import 'tailwindcss';

@theme {
  --color-brand-600: #6d28d9;
  --color-brand-700: #5b21b6;
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}
```

Import `src/styles/index.css` sekali dari `main.jsx`. Jangan mencampur instruksi v3 (`@tailwind base/components/utilities`) ke konfigurasi v4 ini. Pada repository lama, ikuti versi yang sudah dipakai sampai ada migrasi eksplisit.

## 3. Arsitektur berdasarkan fitur

Gunakan direktori berikut sebagai acuan; buat file hanya saat dibutuhkan:

```text
src/
  app/
    App.jsx
    router.jsx
    providers.jsx
    createDependencies.js
  pages/
    LinksPage.jsx
    AppearancePage.jsx
    AnalyticsPage.jsx
    PublicProfilePage.jsx
  features/
    auth/
    links/
      components/
        LinkEditor.jsx
        LinkEditorCard.jsx
        LinkForm.jsx
      hooks/
        useLinks.js
        useSaveLink.js
      services/
        createLinkRepository.js
      model/
        linkSchema.js
        linkMappers.js
        linkRules.js
      index.js
    profile/
    appearance/
    analytics/
  shared/
    ui/
      Button.jsx
      TextField.jsx
      Dialog.jsx
      EmptyState.jsx
    hooks/
    lib/
      httpClient.js
      cn.js
    config/
      env.js
    constants/
  styles/
    index.css
  test/
    setup.js
```

### Batas dependensi

| Lapisan | Boleh mengimpor | Dilarang |
| --- | --- | --- |
| `app` | pages, feature public API, shared | Menyimpan logic detail tiap fitur |
| `pages` | feature public API, shared | Fetch manual dan aturan bisnis di JSX |
| `features/*` | File internal sendiri, shared | Deep import fitur lain atau pages/app |
| `shared` | shared dan dependency eksternal | Mengimpor feature/pages/app |

- Komunikasi lintas fitur diorkestrasi page/app melalui props dan public API.
- Ekspor lintas fitur melalui `features/<name>/index.js`; internal feature gunakan import file langsung agar tidak menciptakan circular dependency.
- Aturan bisnis berada di `model`, API mapping di `services/model`, UI di `components`, orkestrasi state di `hooks`.
- Schema bisnis spesifik tetap di fitur; `shared` hanya untuk kebutuhan lintas fitur yang stabil.
- Jangan membuat folder `utils` sebagai tempat pembuangan fungsi tanpa domain jelas.
- Alias `@/` boleh digunakan jika Vite dan editor dikonfigurasi konsisten; jangan menggunakan alias sebelum setup tersedia.

## 4. Penamaan dan clean code

| Item | Konvensi | Contoh |
| --- | --- | --- |
| Komponen/file JSX | PascalCase | `LinkEditorCard.jsx` |
| Hook | camelCase diawali use | `useSaveLink.js` |
| Fungsi/variabel | camelCase deskriptif | `normalizeLinkUrl` |
| Boolean | is/has/can/should | `isArchived`, `canPublish` |
| Konstanta global | UPPER_SNAKE_CASE | `MAX_LINK_TITLE_LENGTH` |
| Event prop | on + aksi | `onArchive`, `onSubmit` |
| Handler internal | handle + aksi | `handleArchive` |
| Test | Nama file subjek | `linkRules.test.js` |

- Gunakan `const`; `let` hanya untuk reassignment. Jangan memakai `var`.
- Satu fungsi memiliki satu tujuan yang dapat dijelaskan. Gunakan early return untuk mengurangi nesting.
- Nama seperti `data`, `temp`, `item`, dan `res` hanya dipakai pada konteks lokal yang benar-benar jelas.
- Hindari nested ternary dan parameter boolean yang tidak jelas maksudnya.
- Destructure props secara eksplisit. Jangan menyebarkan seluruh response API ke komponen UI.
- Gunakan immutable update; jangan mutasi props, state, query cache, atau array milik caller.
- Extract angka/aturan bisnis bermakna ke konstanta; jangan mengonstankan setiap nilai CSS biasa.
- Komentar menjelaskan alasan/tradeoff; hapus kode mati, import tidak terpakai, dan debug log.
- SEBAIKNYA review pemecahan file komponen ketika melewati sekitar 200 baris; jumlah baris bukan aturan mekanis.
- Gunakan JSDoc pada kontrak service atau fungsi domain yang tidak jelas dari nama.

## 5. Penerapan SOLID di React

### S — Single Responsibility Principle

Satu modul mempunyai satu alasan utama untuk berubah.

- `LinkEditorCard`: tampilan dan interaksi kartu.
- `useSaveLink`: lifecycle mutation dan sinkronisasi cache.
- `linkSchema`: aturan input domain.
- `createLinkRepository`: komunikasi data dan mapping kontrak API.

Komponen halaman tidak boleh sekaligus mengurus URL validation, HTTP request, upload, retry, rendering grafik, dan form kompleks. Extract berdasarkan tanggung jawab, bukan memecah setiap div menjadi file.

### O — Open/Closed Principle

Perluasan tipe block dilakukan dengan menambah renderer dan registry tanpa terus menambah conditional di seluruh aplikasi.

```jsx
const blockRenderers = {
  link: PublicLinkBlock,
  heading: HeadingBlock,
  text: TextBlock,
};

export function BlockRenderer({ block, mode = 'public' }) {
  const Renderer = blockRenderers[block.type];
  if (!Renderer) return null;
  return <Renderer block={block} mode={mode} />;
}
```

Type yang tidak dikenal dicatat pada observability internal tanpa membocorkan data pengguna. Registry hanya memuat kode milik aplikasi; jangan menjalankan component/script dari input pengguna.

### L — Liskov Substitution Principle

Adapter yang menggantikan adapter lain harus mempertahankan kontrak hasil, error, dan perilaku yang diandalkan caller.

Contoh `linkRepository`: implementasi HTTP dan implementasi mock sama-sama mengembalikan Promise berisi bentuk link yang sama. `update` menolak dengan normalized error pada kegagalan; mock tidak boleh selalu resolve sukses sehingga UI gagal diuji.

Pada UI, komponen pengganti harus mempertahankan semantik: navigasi memakai anchor, aksi memakai button. Jangan membuat `Button` yang kadang menjadi clickable div dengan keyboard behavior berbeda.

### I — Interface Segregation Principle

Berikan props yang dibutuhkan consumer. Kartu link tidak membutuhkan seluruh objek user, token, analytics global, dan konfigurasi aplikasi.

```jsx
<LinkEditorCard
  link={link}
  isSaving={isSaving}
  onEdit={handleEdit}
  onArchive={handleArchive}
/>
```

Pisahkan komponen editor dari public link karena kebutuhan interaksinya berbeda. Hindari satu komponen universal dengan banyak flag seperti `isAdmin`, `isPublic`, `showForm`, dan `isAnalyticsMode`.

### D — Dependency Inversion Principle

Aturan bisnis bergantung pada kontrak data, bukan langsung pada `fetch`, localStorage, atau vendor tertentu. Adapter dibuat di composition root dan diberikan melalui provider yang sempit atau parameter hook.

```js
// features/links/services/createLinkRepository.js
export function createLinkRepository(httpClient) {
  return {
    async update(id, changes, revision) {
      const response = await httpClient.patch(
        `/api/me/blocks/${encodeURIComponent(id)}`,
        { ...changes, revision },
      );
      return response.data;
    },
  };
}
```

```js
// features/links/hooks/useSaveLink.js
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSaveLink({ pageId, linkRepository }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, changes, revision }) =>
      linkRepository.update(id, changes, revision),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['links', pageId] }),
  });
}
```

Kontrak `httpClient.patch` di atas mengembalikan parsed API envelope dan throw normalized error untuk status gagal. Instance repository dibuat sekali per environment/session yang tepat; jangan membuat instance baru setiap render. Contoh mutation ini untuk save biasa; autosave memerlukan antrean/revision handling tambahan sesuai bagian 8.

## 6. Komponen reusable

### Tingkatan komponen

| Tingkatan | Lokasi | Tanggung jawab |
| --- | --- | --- |
| Primitive UI | `shared/ui` | Button, input, dialog, badge; bebas aturan bisnis |
| Feature UI | `features/*/components` | LinkEditorCard, ThemePicker, AnalyticsSummary |
| Page/layout | `pages` atau `app` | Menggabungkan fitur dan menentukan layout/navigation |

Extract komponen saat ada pola stabil yang dipakai beberapa tempat, atau satu bagian memiliki tanggung jawab/kompleksitas yang layak berdiri sendiri. Kemiripan markup saja belum cukup untuk menyatukan perilaku berbeda.

```js
// shared/lib/cn.js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

```jsx
// shared/ui/Button.jsx
import { cn } from '../lib/cn';

const variantClasses = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'border border-slate-300 bg-white text-slate-900',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  type = 'button',
  className,
  ...buttonProps
}) {
  return (
    <button
      {...buttonProps}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 font-medium',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant] ?? variantClasses.primary,
        className,
      )}
    >
      {isLoading && <span aria-hidden="true">…</span>}
      {children}
    </button>
  );
}
```

- Default `type="button"` mencegah submit tidak sengaja; form memakai `type="submit"` eksplisit.
- Loading mempertahankan accessible name dari children. Hasil async penting diumumkan melalui status region pada form.
- `className` adalah escape hatch styling, bukan tempat menyembunyikan konflik desain terus-menerus.
- Primitive boleh meneruskan native props; feature component mengekspos props secara eksplisit.
- Field reusable wajib menghubungkan label, input ID, error ID, `aria-invalid`, dan `aria-describedby`.
- Gunakan dialog/menu library aksesibel yang terpelihara bila behavior kompleks; jangan mengimplementasikan focus trap setengah jadi.
- Public profile dan dashboard preview memakai renderer konten yang sama dengan mode berbeda, agar layout tidak menyimpang.

## 7. State dan React Hooks

| Jenis state | Tempat |
| --- | --- |
| Open dialog, tab lokal | `useState` pada ancestor terdekat |
| Form draft dan errors | React Hook Form atau state lokal |
| Server entities/cache | TanStack Query |
| Filter yang harus bisa dibagikan | URL search params |
| Session/dependency/tema aplikasi | Context sempit sesuai domain |
| Nilai turunan | Hitung dari sumber, jangan duplikasi state |

- Hooks dipanggil di top level, tidak di dalam conditional/loop. Dependency effect harus lengkap.
- Gunakan `useEffect` untuk sinkronisasi sistem eksternal; event pengguna ditangani di handler, bukan effect yang mengamati flag.
- Jangan menaruh side effect di render. Cleanup subscription, timer, object URL, dan request yang tidak lagi diperlukan.
- Jangan menyalin query data ke state tanpa kebutuhan draft yang jelas. Draft memiliki revision dan aturan rekonsiliasi eksplisit.
- Gunakan stable ID sebagai `key`; index array tidak boleh menjadi key untuk daftar yang bisa reorder/delete.
- Context tidak menjadi satu store raksasa untuk seluruh aplikasi.
- `useMemo`, `useCallback`, dan `memo` dipakai setelah ada alasan terukur atau kebutuhan identity yang nyata.
- Callback yang bergantung pada state lama memakai functional updater bila tepat; hindari stale closure.

## 8. API, mutation, dan autosave

- HTTP hanya melalui shared client dan feature repository; tidak ada `fetch` di presentational component.
- Client menangani base URL, credentials, parsing, timeout/cancellation, dan normalized error. Jangan retry mutation otomatis tanpa jaminan idempotency.
- Query keys mencakup page ID dan filter. Bersihkan cache data privat ketika logout/ganti akun.
- Gunakan abort signal pada request baca bila tersedia. Membatalkan request di browser tidak menjamin mutation server dibatalkan.
- Tampilkan error field dari 422; 401 mengarahkan autentikasi; 409 membutuhkan review/reload; 429 menghormati retry delay.
- Optimistic update hanya jika rollback jelas. Simpan snapshot, cegah refetch menimpa optimistic state, dan revalidate setelah selesai.
- Request response dimapping ke domain model; JSX tidak mengakses struktur backend yang tersebar.

### Autosave wajib

1. Validasi draft sebelum kirim; debounce 700 ms sesuai PRD.
2. Satu mutation aktif per resource; antrekan draft valid terbaru saja.
3. Sertakan revision terakhir yang diakui server.
4. Saat respons tiba, update baseline/revision; jangan menimpa field yang sudah diedit lagi.
5. Kirim draft terbaru yang masih pending menggunakan revision baru.
6. Pada 409, hentikan autosave dan minta pengguna meninjau versi server versus draft.
7. Pada gagal jaringan, pertahankan draft, tampilkan retry, dan jangan memberi status Saved.
8. Saat pindah halaman dengan draft belum tersimpan, tampilkan guard navigasi yang sesuai. Jangan bergantung pada unload request untuk menjamin save.

Debounce saja tidak menyelesaikan request race. Reorder memakai revision koleksi dan transaksi server. Preview membaca draft lokal; public page hanya membaca data server yang diizinkan.

## 9. Validasi dan error handling

- Schema per fitur menjadi sumber aturan frontend; backend wajib memvalidasi ulang secara independen.
- Parse URL dengan `new URL`, lalu allowlist `http:`/`https:`. Jangan memakai regex sebagai satu-satunya pemeriksaan URL.
- Normalisasi username konsisten; jangan trim password atau mengubahnya diam-diam.
- Validasi file client untuk feedback; MIME, ukuran, decoding, dan authorization tetap dicek server.
- Error message menjelaskan cara memperbaiki input. Jangan menampilkan stack trace ke pengguna.
- Dilarang `catch {}` kosong, mengubah gagal menjadi array kosong, atau mengabaikan Promise rejection.
- Error boundary untuk crash render per route/area besar; error async tetap ditangani pada query/mutation/handler.
- Toast untuk ringkasan aksi; error field dan informasi penting tetap ada pada layar.

## 10. Tailwind dan design system

- Gunakan token warna, font, radius, dan spacing yang konsisten. Styling layout mobile-first.
- Breakpoint desktop menambahkan perubahan dari layout mobile; tidak mengandalkan ukuran layar tetap.
- State hover, focus-visible, disabled, invalid, loading, dan reduced-motion wajib relevan.
- Jangan membangun nama class dinamis seperti `bg-${color}-500`; Tailwind perlu melihat class utuh.
- Gunakan map statis untuk variant. Nilai tema pengguna memakai CSS custom properties setelah validasi.
- Hindari `!important`, style global yang menyasar semua button/input, dan penggunaan `@apply` berlebihan.
- Inline style hanya untuk nilai dinamis seperti theme variables atau transform drag; tampilan statis memakai utility.
- Gunakan satu sumber token untuk public page dan preview. Tema dashboard terpisah dari tema profil pengguna.

```jsx
export function ProfileSurface({ theme, children }) {
  // theme sudah diparse oleh schema: warna HEX tervalidasi dan font dari allowlist.
  return (
    <section
      style={{
        '--profile-bg': theme.backgroundColor,
        '--profile-text': theme.textColor,
      }}
      className="min-h-dvh bg-[var(--profile-bg)] px-4 py-8 text-[var(--profile-text)]"
    >
      <div className="mx-auto w-full max-w-[680px]">{children}</div>
    </section>
  );
}
```

Jangan memasukkan arbitrary CSS dari database ke `style` atau stylesheet. Background image harus berupa asset URL yang diizinkan, bukan string CSS bebas.

## 11. Aksesibilitas dan UX

- Gunakan HTML semantik: button untuk aksi, anchor untuk navigasi, heading berurutan, label pada form.
- Seluruh fitur inti dapat digunakan keyboard. Fokus terlihat dan urutannya sesuai visual.
- Ikon tanpa teks harus memiliki accessible name; ikon dekoratif memakai `aria-hidden`.
- Dialog mengelola focus entry, focus trap, Escape, dan focus return. Menu memiliki keyboard behavior yang benar.
- Drag-and-drop menyediakan alternatif Move up/down dan pengumuman perubahan urutan.
- Error bukan hanya warna; target kontras dan perilaku mengikuti WCAG 2.2 AA.
- Gambar memiliki alt yang sesuai; dekoratif memakai alt kosong. Tetapkan width/height agar tidak menyebabkan layout shift.
- Loading memakai skeleton yang tidak mengubah layout besar; hormati reduced motion.
- Empty state tidak menampilkan angka/demo sebagai data nyata.
- Public view tidak menampilkan kontrol dashboard yang tersembunyi hanya lewat CSS.

## 12. Keamanan dan konfigurasi

- Semua `VITE_*` adalah konfigurasi publik yang masuk bundle. API secret, private key, credential database, dan token provider server dilarang ada di sana.
- `.env.example` hanya berisi placeholder aman. `.env.local` dan secret tidak di-commit.
- Untuk backend milik aplikasi, default autentikasi memakai cookie HttpOnly/Secure dan proteksi CSRF; jika vendor mengharuskan mekanisme lain, dokumentasikan alur token dan ancamannya.
- Jangan menyimpan session production di localStorage sebagai default. Route guard frontend tidak menggantikan authorization server.
- Dilarang `dangerouslySetInnerHTML` untuk konten pengguna. Rich content memerlukan schema terstruktur/sanitization khusus.
- Anchor dengan `target="_blank"` wajib memakai `rel="noopener noreferrer"`.
- Jangan log password, token, email subscriber, atau URL bertoken ke console/error tracker.
- Dependency dan embedded provider harus disetujui proyek; jangan menjalankan script URL yang dimasukkan pengguna.
- API publik tidak boleh mengirim draft/private data untuk kemudian disembunyikan oleh frontend.

## 13. Performance

- Lazy-load route dashboard dan editor berat. Konten publik penting dimuat dengan prioritas sesuai kebutuhan.
- Optimalkan avatar/thumbnail dan tetapkan dimensi. Gunakan responsive images bila sesuai.
- Lazy-load embed pihak ketiga; sediakan fallback link.
- Hindari fetch waterfall dan effect berulang karena objek dependency baru tiap render.
- Gunakan pagination/virtualization untuk daftar besar setelah mengukur kebutuhan; pertahankan aksesibilitas reorder.
- Ukur bundle dan public-page LCP/INP/CLS sesuai target PRD. Jangan mengklaim target field tercapai hanya dari satu Lighthouse run.
- SEO/OG public page memerlukan HTML awal dari backend/prerender integration; mengubah `document.title` saja tidak memenuhi kebutuhan share crawler.

## 14. Testing yang bermakna

| Lapisan | Wajib diuji |
| --- | --- |
| Unit | URL/schedule eligibility, normalisasi, perhitungan metrik, conflict rules |
| Component | Input invalid, keyboard action, loading/error, callback penting |
| Integration | Save → cache/preview, rollback reorder, autosave race/conflict |
| E2E | Register/publish, open public profile, edit persist, unpublish, analytics smoke |
| Backend contract | Ownership lintas akun, public filtering, unique username, redirect validation |

- Test perilaku yang terlihat dan business rule; jangan menguji detail internal hook atau seluruh class Tailwind.
- Query elemen dengan role/name/label; `data-testid` hanya ketika tidak ada pilihan semantik.
- Jangan memakai snapshot besar sebagai satu-satunya bukti correctness.
- API mock harus mencakup 422, 409, 500, delay, dan abort yang relevan.
- Autosave test memakai fake timers dan respons yang datang tidak berurutan untuk membuktikan draft terbaru aman.
- Frontend test tidak membuktikan backend authorization; kontrak keamanan memerlukan pengujian server atau E2E nyata.

## 15. Quality gate dan workflow

Repository wajib mendefinisikan script berikut sebelum dipakai pada CI:

| Script | Perintah yang diharapkan |
| --- | --- |
| `dev` | `vite` |
| `build` | `vite build` |
| `preview` | `vite preview` |
| `lint` | `eslint . --max-warnings 0` |
| `format:check` | `prettier --check .` |
| `test` | `vitest` |
| `test:run` | `vitest run` |
| `test:e2e` | `playwright test` |

Konfigurasi ESLint minimal mencakup recommended JS/React Hooks dan pemeriksaan unused variables. Konfigurasi formatter, lint, serta test runner harus benar-benar ada; daftar script bukan bukti setup sudah dilakukan.

CI: `npm ci` → lint → format check → unit/integration → build; E2E dijalankan untuk alur kritis di environment test yang terisolasi. Jangan menambahkan test baru untuk perubahan teks/styling trivial kecuali perubahan tersebut membawa risiko perilaku.

PR menjelaskan masalah, perilaku akhir, validasi yang benar-benar dijalankan, dan keterbatasan yang masih ada. Jangan menyebut test lulus jika belum dijalankan. Perubahan kontrak API atau schema harus menyebut kebutuhan migrasi.

## 16. Checklist review

- [ ] Requirement dan acceptance criteria PRD terpenuhi.
- [ ] Komponen, hook, domain rule, dan repository memiliki tanggung jawab jelas.
- [ ] Batas import terjaga; tidak ada circular/deep cross-feature import.
- [ ] SOLID diterapkan dengan composition/kontrak yang berguna.
- [ ] Komponen reusable digunakan sesuai semantik dan tanpa flag berlebihan.
- [ ] Draft dan server state jelas; mutation race, retry, dan revision ditangani.
- [ ] Loading, empty, error, invalid, success, dan unauthorized relevan tersedia.
- [ ] Keyboard, focus, label, contrast, dan layout mobile sudah diperiksa.
- [ ] URL/file/theme divalidasi; tidak ada secret atau data privat pada public payload.
- [ ] Lint, format, build, dan test yang relevan lulus.
- [ ] Tidak ada placeholder production, kode mati, debug log, atau klaim test palsu.

## 17. Instruksi untuk AI coding assistant

Saat mengimplementasikan fitur pada repository ini:

1. Baca `PRD.md`, dokumen ini, dan konfigurasi proyek saat ini.
2. Tentukan feature owner, model, adapter, hook, serta UI yang diperlukan.
3. Gunakan komponen dan dependensi yang sudah ada sebelum menambah baru.
4. Implementasikan alur end-to-end sesuai tahap rilis; jangan membuat semua fitur sebagai stub.
5. Jika backend belum tersedia, gunakan adapter/mock development yang ditandai jelas dan laporkan batasannya.
6. Lengkapi validation, error states, aksesibilitas, serta handling request yang diperlukan.
7. Jalankan check yang relevan dan laporkan hasil nyata serta pekerjaan yang belum selesai.

Jangan membuat satu file halaman raksasa, API call di JSX, state global tanpa kebutuhan, komponen universal dengan banyak boolean flag, atau abstraksi berlapis tanpa manfaat.

## 18. Referensi resmi

- [React — Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- [React — Managing State](https://react.dev/learn/managing-state)
- [Tailwind CSS — Vite installation](https://tailwindcss.com/docs/installation/using-vite)
- [Vite — Environment Variables and Modes](https://vite.dev/guide/env-and-mode)

Standar arsitektur dan contoh dalam dokumen ini adalah keputusan proyek. Referensi resmi menjelaskan perilaku framework yang mendasarinya.
