insert into public.site_settings (id,store_name,bio)
values (1,'Core Consign','Titip jual dan belanja komponen PC. Temukan semua kanal Core Consign di sini.');
insert into public.appearance (site_id) values (1);
insert into public.links (title,description,icon_key,layout,position) values
('Chat WhatsApp','Tanya stok atau ngobrol langsung dengan admin.','whatsapp','featured',0),
('Belanja di Shopee','Temukan komponen PC di toko Shopee kami.','shopee','classic',1),
('Belanja di Toco','Jelajahi pilihan hardware kami di Toco.','toco','classic',2),
('Instagram Core Consign','Lihat update barang dan aktivitas toko.','instagram','classic',3),
('Mau Titip Jual?','Cari tahu cara menitipkan hardware kamu.','consign','classic',4),
('Lihat Katalog','Telusuri koleksi komponen PC kami.','catalog','classic',5);
