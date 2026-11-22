# Database Core Consign

Folder `migrations/` adalah sumber schema Supabase. Terapkan setiap file **sekali, sesuai urutan nomor** pada project baru melalui SQL Editor dengan role administratif. Jalankan setiap file sebagai satu transaksi, misalnya dengan `psql --single-transaction --set ON_ERROR_STOP=on --file <file.sql>` pada koneksi administratif. Migrasi 007 mengisi enam kanal nonaktif tanpa URL. Migrasi lain mengandalkan tabel dari file sebelumnya.

| Nomor | Isi |
| --- | --- |
| 001 | Schema private, allowlist satu owner, helper akses dan revisi |
| 002 | Validasi tujuan, path aset, dan warna |
| 003 | Profil dan status publikasi singleton |
| 004 | Pengaturan tampilan |
| 005 | Tautan beserta urutan, ikon, status, dan revision |
| 006 | Kanal sosial unik per platform |
| 007 | Profil, tema awal, dan enam tautan nonaktif |
| 008 | RPC penyimpanan profil dan sosial dalam satu transaksi |
| 009 | RPC penyimpanan tampilan |
| 010 | RPC penambahan dan perubahan tautan |
| 011 | RPC penghapusan tautan |
| 012 | RPC reorder atomik dengan revisi koleksi |
| 013 | RPC publish dan unpublish |
| 014 | Bucket gambar publik dan policies Storage |
| 015 | Pembacaan halaman publik dan studio |
| 016 | Pilihan logo platform dan warna ikon per tautan |
| 017 | Halaman mandiri per akun Linkfy, alamat unik, dan akses berdasarkan pemilik |
| 018 | Foto profil Linkfy dan Storage privat per pemilik |
| 019 | Warna tema, bentuk dan efek tombol, serta pengaturan khusus per tautan Linkfy |
| 020 | Gaya dan bentuk wadah ikon per tautan Linkfy |
| 021 | Gaya dan bentuk ikon bersama untuk semua tautan dalam satu halaman |
| 022 | Izinkan ikon TikTok pada tautan owner dan halaman Linkfy |
| 023 | Catat statistik harian dan batasi laporan ke pemilik halaman |
| 027 | Simpan radius slider bentuk tombol Linkfy untuk tema dan per tautan |

## Pendaftaran pengguna Linkfy

Jalankan migrasi 017 pada project yang sudah melalui 001–016. Di Authentication → Sign In / Providers, aktifkan **Allow new users to sign up** dan gunakan **Confirm Email** pada provider Email. Atur Site URL ke origin aplikasi, dan tambahkan `http://localhost:5173/admin/login` pada Redirect URLs untuk pengujian lokal atau alamat production dengan path yang sama. Email konfirmasi untuk pendaftaran publik perlu SMTP yang mendukung alamat pengguna umum.

Halaman publik memakai `/nama` dan tampil setelah publikasi diaktifkan. Migrasi 024 mencadangkan nama rute bawaan. Alamat lama `/u/nama` mengarah ke alamat baru, dan profil lama yang namanya bertabrakan dengan rute bawaan tetap tersedia melalui `/u/nama`. Tabel `private.site_admins` khusus untuk owner Core Consign.

Pengguna memilih username di `/dashboard` setelah masuk jika akunnya belum memiliki halaman. Migrasi 026 menambahkan pengecekan otomatis melalui RPC untuk pengguna yang sudah masuk. Nama ini disimpan ketika draf halaman dibuat. Database memastikan setiap username hanya bisa dipakai oleh satu akun.

Jika cek otomatis mengembalikan `PGRST202` untuk `member_slug_taken`, jalankan seluruh isi [migrasi 026](migrations/026_member_slug_availability.sql) melalui SQL Editor pada proyek Supabase yang sama dengan `VITE_SUPABASE_URL`. Migrasi ini memuat ulang cache skema dan aman dijalankan ulang.

Migrasi 018 menambah bucket privat `member-avatars`. Pemilik dapat mengunggah WebP hingga 5 MB di folder slug miliknya. Pengunjung hanya bisa memuat foto yang sedang dipakai halaman terpublikasi.

Setelah migrasi 018, jalankan seluruh isi `019_member_appearance.sql` sekali di SQL Editor untuk mengaktifkan penyimpanan tema dan gaya per tautan. Preset halaman yang sudah ada tetap menjadi tampilan awal. Studio dan halaman publik membaca pengaturan yang sama.

Setelah migrasi 021, jalankan `022_tiktok_link_icon.sql` agar Studio bisa menyimpan tautan dengan ikon TikTok. Pilihan ikon Instagram pada tautan lama otomatis menggunakan SVG baru di frontend.

Setelah migrasi 022, jalankan `023_page_analytics.sql` untuk mengaktifkan Statistik di Studio. Laporan memakai hari WIB dan menjumlahkan kunjungan serta klik, termasuk kunjungan dari alamat dengan penanda QR. Data mulai tercatat sejak fitur aktif. Database menyimpan hitungan harian per halaman, tautan, dan sumber.

RLS, policy baca, dan grants dibuat bersama tabel terkait. Perubahan melalui browser hanya diizinkan melalui RPC owner. Isi `private.site_admins` dikelola dari SQL Editor. Tambahkan perubahan schema berikutnya sebagai file bernomor baru.

## Setup owner dan Auth

1. Pada Authentication, pastikan email/password aktif dan **Allow anonymous sign-ins** mati. Gunakan pengaturan pendaftaran publik di atas.
2. Buat satu akun email/password melalui Dashboard administratif. Salin **User UID** dari akun itu.
3. Jalankan pernyataan berikut setelah mengganti teks dalam tanda kutip dengan UUID owner:

```sql
insert into private.site_admins (user_id)
values ('GANTI_DENGAN_UUID_OWNER'::uuid);
```

4. Atur Site URL sesuai domain toko. Masukkan URL persis `https://DOMAIN-TOKO/admin/reset-password` pada redirect allowlist. Aktifkan layanan email/SMTP dan uji email reset pada akun owner.
5. Jika project memakai pengaturan Data API eksplisit, aktifkan Data API dan pastikan schema `public` terekspos. Biarkan schema `private` hanya untuk database.
6. Lengkapi konfigurasi frontend di [panduan aplikasi](../FE/README.md).

## Pemeriksaan setelah tersambung

Gunakan publishable key dan sesi pengguna yang sesuai saat menguji API. Periksa hasil melalui browser atau SDK:

- Saat belum dipublikasikan, `get_public_page()` mengembalikan null. SELECT anon atas profil, tampilan, sosial, dan tautan mengembalikan nol baris.
- Dengan akun authenticated lain, data tersembunyi tetap tertutup. RPC mutasi, SELECT allowlist, dan upload ke `site-assets` harus ditolak. Signup publik juga harus ditolak.
- Dengan owner, simpan profil, foto transparan, tema, dan URL valid. Login kembali dari perangkat kedua dan periksa hasilnya.
- Terbitkan halaman dan periksa bahwa anon hanya mendapat tautan aktif. Tarik publikasi dan periksa API kembali.
- Ubah resource yang sama dari dua tab. Penyimpanan revisi lama harus menampilkan konflik. Reorder harus menyertakan semua ID tepat sekali.
- Uji ganti/hapus gambar termasuk thumbnail yang masih dipakai salinan tautan. Bucket menerima hasil WebP hingga 5 MB di folder logos, thumbnails, dan backgrounds. URL objek publik yang sudah diketahui tetap dapat diakses meski halaman ditarik.

Tes lokal untuk kontrak migrasi tersedia di `FE/tests/database.test.js`.
