# Linkfy

Landing page Linkfy, halaman dan Studio pribadi per akun, serta Studio owner Core Consign. Frontend menggunakan React, Vite, Tailwind v4, React Router, dan TanStack Query. Form tautan Core Consign memakai React Hook Form dan Zod.

## Mencoba di perangkat lokal

Dari direktori `FE`, dengan Node 22.15.1 dan npm 10.9.2:

```sh
npm ci
npm run dev
```

Buka alamat yang dicetak Vite untuk melihat landing Linkfy. Selama kedua variabel Supabase kosong, `/core-consign` menampilkan contoh desain dengan enam contoh kanal nonaktif. Pilih **Buka Studio** atau kunjungi `/studio/dashboard`. Tambahkan URL tujuan, aktifkan tautan, lalu gunakan **Pengaturan → Publikasikan halaman** untuk mencoba halaman pengunjung. Setelah publikasi pertama, menarik publikasi akan menampilkan halaman sementara tidak tersedia.

Studio lokal tersedia pada development server melalui localhost/HTTPS. Perubahan dan gambar lokal tersimpan di browser yang digunakan. Web Locks menjaga pemeriksaan revisi lintas tab. Data lokal terpisah dari Supabase. Setelah terhubung, isi konten asli melalui studio owner. Build produksi dengan konfigurasi kosong menampilkan halaman belum tersedia.

## Menghubungkan Supabase nanti

1. Ikuti [panduan database](../database/README.md) untuk membuat schema, policies, dan owner.
2. Salin `.env.example` ke `.env.local`. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` dari project yang sama. Isi `VITE_SITE_URL` dengan origin publik toko, misalnya domain HTTPS milikmu tanpa route admin, query, atau fragment.
3. Restart Vite. Buka `/admin/login`, masuk dengan akun owner, unggah logo asli, lalu isi URL toko. Seed tetap nonaktif sampai diaktifkan. Logo awal pada antarmuka adalah ikon chip generik.
4. Atur allowlist pemulihan password dan email delivery. Uji pengiriman email serta login dari perangkat kedua sebelum membuka halaman untuk pengunjung.

Supabase Auth mengelola sesi SPA di `sessionStorage` per tab. Guard memeriksa allowlist server. Mutasi memakai RPC dengan revisi. RLS dan grants berlaku pada permintaan langsung ke Data API. Kunci rahasia, token administratif, dan password database hanya untuk tooling server.

## Halaman

| Route                   | Fungsi                                           |
| ----------------------- | ------------------------------------------------ |
| `/`                     | Landing Linkfy dan demo tema                     |
| `/core-consign`         | Direktori toko, share, salin URL, QR PNG         |
| `/register`             | Pendaftaran Linkfy lewat email                   |
| `/dashboard`            | Membuat dan mengelola halaman pribadi            |
| `/u/:slug`              | Halaman publik milik pengguna                    |
| `/admin/login`          | Login atau permintaan email pemulihan            |
| `/admin/reset-password` | Form kata sandi setelah membuka email pemulihan  |
| `/admin/dashboard`      | Profil, sosial, logo, dan CRUD/reorder tautan    |
| `/admin/appearance`     | Tema, font, warna, gambar latar, dan gaya tombol |
| `/admin/settings`       | Publikasi, berbagi, QR, dan logout               |

Tiga halaman studio memiliki padanan development di `/studio/` ketika Supabase belum dikonfigurasi. Preview merender komponen yang sama dengan halaman pengunjung. Tombol **Simpan Perubahan** menyimpan profil, formulir tautan, atau tampilan. Aksi cepat aktif/nonaktif dan perubahan urutan langsung disimpan. Konflik menahan draft dan menyediakan aksi memuat ulang versi tersimpan.

## Validasi dan build

```sh
npm run lint
npm run format:check
npm run test:run
npm run test:e2e
npm run build
```

Playwright memakai Chrome lokal pada instalasi Windows standar. Lingkungan lain bisa memakai `npx playwright install chromium` atau menetapkan `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. E2E menjalankan server test sendiri di port 5189 dengan konfigurasi terisolasi. Tes SQL menjalankan semua migrasi pada PostgreSQL melalui PGlite, dengan fixture untuk schema milik Supabase. Tes integrasi SDK menggunakan HTTP mock. Pemeriksaan Auth/email, Data API, bucket, dan sinkronisasi perangkat pada project hosted dilakukan setelah koneksi tersedia.

Output hosting statis ada di `dist/`. Sajikan `core-consign/index.html` pada `/core-consign` untuk metadata toko, dan arahkan deep link Studio ke `index.html`. File `_redirects` dan `_headers` tersedia untuk host yang mendukung format itu. Pada host lain, terapkan SPA fallback dan header `X-Robots-Tag: noindex, nofollow` pada `/admin/*`. Metadata share dibuat saat build dengan `VITE_SITE_URL`. Bangun ulang jika metadata atau origin berubah.
