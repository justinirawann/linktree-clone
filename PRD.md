# PRD — Core Consign Link-in-Bio

Versi: 2.0  
Tanggal: 20 November 2026  
Pemilik: Justin Irawan — Core Consign  
Frontend: React + Vite + Tailwind CSS, JavaScript  
Backend: Supabase Auth + PostgreSQL + Storage

## 1. Ringkasan

Bangun website link-in-bio bergaya Linktree khusus untuk Core Consign, toko consignment komputer milik Justin. Website hanya memiliki satu halaman bisnis dan satu pemilik/admin. Pengunjung membuka satu URL untuk memilih tujuan seperti WhatsApp, Shopee, Toco, Instagram, website katalog, atau informasi cara titip jual.

Admin dapat mengubah profil toko, daftar link, urutan, gambar, dan tampilan dari dashboard pribadi. Data tersimpan di Supabase dan dapat dikelola dari perangkat lain.

Dokumen ini menggantikan seluruh scope PRD versi 1.0. Fokusnya adalah halaman link bisnis pribadi, bukan layanan SaaS untuk pengguna umum. Nama dan daftar kanal awal merupakan default yang bisa diubah admin; URL, nomor WhatsApp, serta akun toko harus diisi dengan data asli sebelum dipublikasikan.

## 2. Tujuan

- Satu URL untuk seluruh kanal Core Consign, cocok ditempel pada bio Instagram dan materi promosi.
- Pengunjung mudah memilih tempat belanja, menghubungi toko, atau mencari informasi titip jual.
- Pemilik dapat mengubah link/tampilan tanpa mengedit kode.
- Tampilan mendekati pengalaman Linktree: profil di atas, tombol link vertikal, thumbnail/icon, share, dan editor dengan live preview.
- Implementasi sederhana dengan React dan Supabase, tanpa backend Laravel/Express terpisah untuk fitur inti.

## 3. Batas scope

| Termasuk | Di luar scope |
| --- | --- |
| Satu halaman publik Core Consign | Multi-user, multi-toko, workspace, dan undangan anggota |
| Login satu admin | Registrasi publik, onboarding creator, claim username |
| Kelola profil dan link | Payment gateway, checkout, transaksi, refund, dan invoice |
| Kelola tema dan live preview | Subscription, paket berbayar, billing, dan paywall |
| Upload logo/thumbnail/background | Manajemen stok, pencatatan penitip, komisi, dan laporan keuangan |
| Share URL dan QR | Booking, subscriber, email marketing, dan AI assistant |
| Publish/unpublish halaman | Katalog produk internal dan sistem order |

Tombol Shopee/Toco/WhatsApp hanya membuka layanan eksternal. Pembelian, percakapan, atau proses consignment berlangsung di kanal tersebut. Aplikasi ini tidak menerima pembayaran atau mencatat transaksi. Link ke katalog yang sudah ada boleh ditambahkan tanpa membangun katalog baru.

## 4. Aktor dan akses

| Aktor | Hak akses |
| --- | --- |
| Visitor | Membaca halaman published, membuka link, membagikan URL, melihat QR |
| Owner/admin | Login, mengubah profil/link/tema, mengunggah gambar, publish/unpublish |

Tidak ada akun customer. Admin dibuat secara manual melalui Supabase Dashboard. Public signup dan anonymous sign-in dinonaktifkan. Hanya UUID admin yang ditetapkan saat setup memiliki hak tulis; status authenticated saja tidak cukup.

## 5. Teknologi

| Kebutuhan | Pilihan |
| --- | --- |
| UI | React + Vite, JavaScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth, email dan password untuk owner |
| Database | Supabase PostgreSQL |
| Gambar | Supabase Storage |
| Akses data | `@supabase/supabase-js` melalui repository/service fitur |
| Authorization | RLS dan database grants/policies |
| Atomic save/reorder | PostgreSQL RPC dengan pemeriksaan owner dan revision |
| Hosting frontend | Hosting static dengan SPA fallback; domain ditentukan pemilik |

Browser menggunakan project URL dan publishable key. Secret/service-role key tidak boleh masuk bundle atau variabel `VITE_*`. Fitur inti tidak memerlukan Edge Function. Supabase Realtime tidak wajib; pembaruan dapat dilihat pada kunjungan/reload berikutnya.

## 6. Routes

| Route | Fungsi |
| --- | --- |
| `/` | Halaman publik Core Consign |
| `/admin/login` | Login owner |
| `/admin/dashboard` | Profil dan editor link dengan preview |
| `/admin/appearance` | Tema, warna, font, background, tombol |
| `/admin/settings` | Publish/unpublish, share URL, QR, dan logout |
| `/admin/reset-password` | Pemulihan password owner melalui Supabase Auth |

Tidak ada route registrasi, pricing, checkout, atau username dinamis. Admin routes harus mendukung refresh/deep link dan dilindungi session guard; database tetap menegakkan hak akses melalui RLS.

## 7. Halaman publik

Urutan tampilan:

1. Tombol share di area atas.
2. Logo/avatar Core Consign.
3. Nama toko dan bio singkat.
4. Social icons yang diaktifkan.
5. Daftar tombol link sesuai urutan admin.
6. Footer sederhana dengan nama toko.

Contoh link awal, dibuat nonaktif sampai URL asli diisi:

| Label awal | Tujuan |
| --- | --- |
| Chat WhatsApp | WhatsApp toko, URL `https://wa.me/...` yang valid |
| Belanja di Shopee | Halaman toko/listing Shopee |
| Belanja di Toco | Halaman toko/listing Toco |
| Instagram Core Consign | Akun Instagram toko |
| Mau Titip Jual? | WhatsApp dengan pesan awal titip jual atau halaman informasi eksternal |
| Lihat Katalog | Website katalog eksternal jika tersedia |

Link tidak valid atau placeholder tidak boleh tampil sebagai tombol aktif. Platform di atas merupakan seed opsional, bukan integrasi API marketplace.

### Persyaratan visual

- Mobile-first, satu kolom, konten terpusat; lebar maksimum sekitar 640 px.
- Logo sekitar 96 px, padding horizontal minimal 16 px.
- Tombol minimal tinggi 48 px dan jarak 12–16 px.
- Style bersih seperti Linktree: nama/bio jelas, tombol besar, ikon konsisten, hover halus.
- Tema awal Core Consign: `#1D1616`, `#8E1616`, `#D84040`, `#EEEEEE`.
- Logo RGB Core Consign dapat diunggah sebagai asset asli; jangan menggambar ulang atau mengubah logo otomatis.
- Gambar latar memiliki fallback solid; thumbnail rusak tidak merusak layout.
- Font, warna, dan bentuk tombol dapat diubah admin. Font dipilih dari daftar terkurasi.
- Nama panjang dan bio dapat wrap; tidak ada scroll horizontal pada lebar 360 px.

## 8. Kebutuhan fungsional

### AUTH-01 — Login pribadi

- Owner login dengan email/password akun Supabase yang sudah dibuat.
- Tidak ada tombol atau API signup yang diaktifkan untuk publik.
- Setelah login, cek owner yang diizinkan sebelum menampilkan editor.
- Session ditangani SDK Supabase sesuai konfigurasi SPA; jangan membuat session/token tiruan sendiri. Bersihkan cache privat pada logout.
- Login gagal menampilkan pesan umum; form mendukung password manager.
- Recovery memakai email reset Supabase dengan redirect allowlist ke domain aplikasi; email delivery harus dikonfigurasi sebelum fitur dianggap siap.

Acceptance: visitor tidak dapat membuka dashboard; akun authenticated lain tetap tidak dapat mengubah data melalui API langsung.

### PROF-01 — Profil toko

| Field | Validasi |
| --- | --- |
| Nama toko | Wajib, 1–60 karakter |
| Bio | Opsional, maksimal 160 karakter, teks biasa |
| Logo | JPEG/PNG/WebP, maksimal 5 MB |
| Social links | URL HTTP/HTTPS valid, satu per platform |

Logo bisa diunggah, diganti, dan dihapus. PNG/WebP transparan dipertahankan. Tidak ada field komisi, data penitip, pembayaran, atau informasi pelanggan.

Acceptance: setelah save dan reload dari perangkat lain, profil tetap sesuai data terakhir tersimpan.

### LINK-01 — Pengelolaan link

Data tiap link: title, URL, optional description, thumbnail/icon, style classic/featured, enabled, position, dan timestamps.

- Tambah, edit, duplicate, hapus dengan konfirmasi, dan aktif/nonaktif.
- Title wajib 1–100 karakter; description opsional maksimal 160 karakter.
- URL maksimal 2.048 karakter, absolute HTTP/HTTPS. Tolak `javascript:`, `data:`, dan skema lain.
- WhatsApp memakai URL HTTPS, bukan skema khusus. Pesan awal harus di-URL-encode dengan benar.
- Link baru/duplicate default nonaktif sampai admin sengaja mengaktifkan.
- Drag-and-drop untuk urutan, dengan Move up/down sebagai alternatif keyboard/mobile.
- Reorder disimpan atomik; gagal save mengembalikan urutan tersimpan dan menyediakan retry.
- Tidak ada hard limit link sebagai aturan bisnis; editor tetap usable untuk setidaknya 100 link.

Acceptance: hanya link aktif pada halaman published yang dapat dibaca visitor melalui API; link nonaktif tidak sekadar disembunyikan dengan CSS.

### APPR-01 — Appearance dan preview

- Minimal tiga preset: Core Consign Dark, Light, dan Gradient.
- Custom background solid/gradient/gambar, text color, button color, button text color, radius, border, dan shadow.
- Warna divalidasi; jangan menerima CSS atau HTML bebas.
- Gunakan renderer yang sama untuk preview dan public page.
- Desktop: navigasi, editor, preview ponsel; mobile: editor dan toggle/tab preview.
- Preview memakai draft lokal dan tidak membuka tujuan link saat diklik.

Acceptance: sesudah save, urutan, teks, gambar, font, dan tema preview sama dengan public page.

### SAVE-01 — Simpan dan publikasi

Gunakan tombol `Simpan Perubahan` yang eksplisit untuk menyederhanakan aplikasi pribadi ini. Autosave tidak diwajibkan.

- Profile/theme memakai draft lokal dan status unsaved/saving/saved/error.
- Link form disimpan per item; reorder disimpan sebagai satu transaksi.
- Setelah server sukses, cache frontend di-refresh. Jangan menampilkan Saved saat request masih berjalan/gagal.
- Simpan perubahan pada halaman published membuat data baru tampil pada request publik berikutnya; tidak perlu publish ulang.
- Publish/unpublish merupakan aksi terpisah. Publikasi pertama memerlukan nama toko dan minimal satu link valid aktif.
- Unpublish menampilkan pesan halaman sementara tidak tersedia, tanpa mengirim data toko/link ke visitor.
- Navigasi dengan perubahan belum tersimpan memberi peringatan.
- Setiap resource memiliki revision; save memakai revision yang dibaca. Konflik dua tab tidak boleh menimpa diam-diam: pertahankan draft dan tawarkan reload/review.

Acceptance: gagal jaringan tidak membuang input; klik simpan ganda dicegah; respons lama tidak menimpa draft baru.

### SHARE-01 — Share dan QR

- Copy canonical public URL, dengan fallback teks yang bisa dipilih jika clipboard gagal.
- Native share jika browser mendukung, fallback copy URL.
- QR berisi canonical public URL dan dapat diunduh sebagai PNG.
- Canonical URL dikonfigurasi pemilik; jangan meng-encode URL preview atau `/admin` pada QR.

### SETTINGS-01 — Identitas dan metadata

- Nama toko, SEO title, description, favicon, dan share image Core Consign.
- Karena hanya satu halaman bisnis, metadata awal dapat dipasang pada HTML build. Mengubah tema/link tidak membutuhkan rebuild.
- Jika metadata diedit lewat dashboard, perubahan untuk crawler memerlukan rebuild/prerender integration; jangan menjanjikan Open Graph dinamis dari client-only SPA. Metadata dashboard dinamis di luar scope inti.
- Admin pages noindex dan tidak dimasukkan sitemap.

## 9. Supabase data model

| Tabel | Field utama |
| --- | --- |
| `site_settings` | `id` singleton, `store_name`, `bio`, `logo_path`, `is_published`, `revision`, timestamps |
| `appearance` | `site_id` unique, `preset`, token warna/font/radius, `background_path`, `revision`, timestamps |
| `links` | `id` UUID, `site_id`, `title`, `description`, `url`, `thumbnail_path`, `icon_key`, `layout`, `is_active`, `position`, `revision`, timestamps |
| `social_links` | `id`, `site_id`, `platform`, `url`, `position`; unique site/platform |
| `private.site_admins` | `user_id` UUID, satu row owner; dikelola hanya lewat setup administratif |

- Satu row site dan satu row appearance; tidak ada tenant, workspace, subscription, order, atau payment table.
- Foreign key dan CHECK constraint mencerminkan validasi field serta enum; URL scheme juga dicek di database.
- Owner tidak boleh diganti lewat update `site_settings` atau user metadata.
- Index link berdasarkan site/position; urutan deterministik dengan ID sebagai tie-breaker.
- Migration dan seed disimpan di repository. Seed berisi label contoh, bukan URL palsu yang aktif.

## 10. RLS dan Storage policies

| Resource | Visitor/anon | Owner resmi | Authenticated lain |
| --- | --- | --- | --- |
| Site settings/appearance | SELECT hanya saat site published | SELECT/UPDATE | Hanya akses publik yang sama |
| Links | SELECT hanya site published dan link aktif | CRUD | Tidak boleh mutate/read hidden |
| Social links | SELECT hanya site published | CRUD | Hanya akses publik yang sama |
| Admin allowlist | Tidak dapat dibaca/diubah langsung | Tidak diedit dari aplikasi | Tidak dapat dibaca/diubah |
| Storage | Hanya gambar yang memang publik | Upload/update/delete pada path yang diizinkan | Tidak dapat menulis |

- Enable RLS pada seluruh tabel yang diekspos API dan berikan grants minimal.
- Gunakan owner check berdasarkan `auth.uid()` terhadap allowlist server-managed. Jangan memakai `user_metadata.is_admin` yang dapat diedit pengguna.
- Jika helper `is_site_admin()` memakai SECURITY DEFINER untuk membaca private allowlist, tentukan search_path aman, referensi schema eksplisit, grant execute minimal, dan pastikan helper hanya mengembalikan boolean.
- RPC save/reorder wajib mengecek owner, field yang diizinkan, revision, dan site singleton di database; jangan mempercayai ID/payload browser.
- Reorder memverifikasi daftar ID lengkap, unik, dan valid sebelum mengubah seluruh position dalam satu transaksi.
- Storage bucket `site-assets` hanya memuat logo, thumbnail, dan background yang boleh terlihat publik. Bucket public berarti file yang URL-nya diketahui tetap bisa diakses walaupun halaman di-unpublish; unpublish bukan pencabutan akses file.
- Batasi upload pada owner dan path bucket yang ditetapkan. Konfigurasi allowed MIME dan batas ukuran; decode/re-encode raster sebelum upload untuk consistency. Jangan menerima SVG/HTML unggahan dalam scope awal.
- Gunakan filename UUID, unggah file baru lebih dulu, update referensi, lalu hapus file lama jika sudah tidak digunakan.
- Uji policies memakai anon key dan user lain, bukan hanya SQL editor atau secret key yang dapat melewati RLS.

## 11. Integrasi frontend

- Buat satu Supabase client pada `shared/lib/supabaseClient.js`.
- Konfigurasi publik: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SITE_URL`.
- Feature repositories: `siteRepository`, `linkRepository`, `appearanceRepository`, `assetRepository`; jangan memanggil Supabase langsung di komponen presentational.
- Public query hanya membaca kolom yang diperlukan dan data yang lolos RLS.
- Setiap pemanggilan Supabase memeriksa `error`; jangan menganggap query berhasil karena Promise resolve.
- RPC untuk conditional save/reorder mengembalikan data terbaru dan revision; konflik dipetakan ke pesan yang bisa ditindaklanjuti.
- Storage upload dan update DB bukan satu transaksi; tangani cleanup asset orphan tanpa menghapus asset lama sebelum referensi baru tersimpan.
- `CODE_STANDARD.md` tetap menjadi pedoman clean code/SOLID/reusable components. Keputusan khusus PRD ini mengungguli contoh generik: Supabase SDK untuk auth/data, manual save, single-owner, dan tanpa custom REST backend.

## 12. Loading, error, dan kualitas

- Public page: loading singkat, error + retry, unpublished, dan published tanpa link aktif.
- Dashboard: input invalid inline, upload progress, save error dengan input tetap ada, session expired, dan akses ditolak.
- Keyboard navigation, label form, focus ring, alt text, kontras terbaca, dan reduced-motion.
- Uji lebar 360/390/768/1440 px; target tombol minimal 44–48 px.
- Optimalkan ukuran logo/thumbnail dan tentukan dimensi agar tidak terjadi layout shift.
- External link memakai anchor; jika membuka tab baru, pakai `rel="noopener noreferrer"`.
- Tidak memuat tracker tambahan pada rilis inti. Statistik klik/visitor bersifat opsional di luar scope saat ini; kegagalan analytics tidak boleh menjadi penghambat publikasi.
- Tidak menjanjikan sinkronisasi offline; data production wajib persisten di Supabase.

## 13. Alur utama

### Pengunjung

Buka URL Core Consign → lihat profil dan kanal → pilih WhatsApp/Shopee/Toco/Instagram/katalog → lanjut di layanan tujuan.

### Admin

Login → edit profil/link/tampilan → lihat preview → simpan → cek halaman publik. Publish/unpublish tersedia di settings.

### Setup awal oleh developer

1. Buat project Supabase dan jalankan migration/seed.
2. Buat satu akun owner melalui dashboard administratif.
3. Daftarkan UUID owner pada allowlist private; matikan signup dan anonymous sign-in.
4. Aktifkan RLS, grants, RPC authorization, serta Storage policies.
5. Konfigurasi project URL/publishable key, canonical URL, recovery redirect, dan email delivery.
6. Isi logo, bio, dan URL asli toko; aktifkan link yang valid.
7. Deploy React, uji akses publik dan admin, lalu publish.

Dokumen ini adalah spesifikasi; project Supabase, akun, dan policy belum dibuat oleh penyusunan PRD ini.

## 14. Acceptance criteria / UAT

| ID | Skenario | Hasil wajib |
| --- | --- | --- |
| 01 | Visitor membuka `/` | Profil dan link aktif tampil tanpa login |
| 02 | Owner login | Dashboard dapat diakses; refresh mempertahankan session valid |
| 03 | Signup melalui SDK langsung | Ditolak konfigurasi Supabase |
| 04 | Anon/user lain mencoba mutation | Ditolak RLS/RPC dan Storage policy |
| 05 | Tambah/edit/nonaktif/hapus link | Hasil benar dan tersimpan setelah reload/perangkat lain |
| 06 | Reorder dengan drag/keyboard | Urutan sama dan tersimpan atomik |
| 07 | Edit tema dan logo | Preview sama dengan publik setelah save |
| 08 | URL berbahaya/input terlalu panjang | Ditolak frontend dan database/RPC |
| 09 | Gagal upload/save | Data lama tetap aman; draft tidak hilang |
| 10 | Dua tab menyimpan revision stale | Conflict terlihat; tidak overwrite diam-diam |
| 11 | Unpublish | Halaman/API publik tidak mengirim data site/link |
| 12 | Link nonaktif diminta lewat REST langsung | Anon tidak dapat membaca row tersebut |
| 13 | Share/copy/QR | Menggunakan URL publik yang benar |
| 14 | Layar 360 px dan keyboard-only | Konten terbaca, aksi utama dapat dipakai |
| 15 | Buka WhatsApp/Shopee/Toco | Tujuan benar; tidak ada checkout/payment di aplikasi |

## 15. Definition of Done

Selesai ketika halaman Core Consign dapat dipakai pengunjung, satu owner dapat mengelola konten dari dashboard, data tersimpan di Supabase, RLS/Storage policies teruji, preview sesuai publik, dan seluruh UAT inti lulus. Tidak ada registrasi, billing, payment, fitur multi-toko, maupun tombol placeholder.

## 16. Referensi teknis resmi

- [Supabase Auth configuration](https://supabase.com/docs/guides/auth/general-configuration) — menonaktifkan pendaftaran dan anonymous sign-in.
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — membatasi akses database dengan policies.
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys) — publishable key untuk client; secret tetap server-side.
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control) — kebijakan akses file.
