# Royal Palace v2: Undangan Briand & Tiara dengan editor teks

Paket ini berisi undangan, gambar, audio asli, halaman admin, dan penyimpanan RSVP bersama. Halaman tamu ada di `/`. Halaman editor ada di `/admin`.

## Pasang melalui GitHub dan Railway

1. Ekstrak ZIP. Unggah **isi folder** `briand-tiara-royal-palace` ke akar repository GitHub. Pastikan `package.json`, `Dockerfile`, `server.mjs`, `defaults.json`, dan folder `public` langsung terlihat di akar repository.
2. Di Railway, buat proyek dan pilih **Deploy from GitHub repo**. Pilih repository tersebut. Dockerfile sudah menyiapkan proses menjalankan aplikasi.
3. Di bagian **Variables**, tambahkan `ADMIN_PASSWORD` dengan kata sandi pribadi minimal 10 karakter. Jangan menaruh kata sandi nyata di GitHub.
4. Tambahkan **Volume** pada service undangan dengan **Mount Path `/data`**. Railway menyediakan `RAILWAY_VOLUME_MOUNT_PATH`; aplikasi memakainya untuk menyimpan perubahan dan RSVP. Jika Anda menetapkan `DATA_DIR`, pastikan nilainya menunjuk mount path yang sama.
5. Di **Settings → Networking**, pilih **Generate Domain**. Gunakan port yang diberikan Railway melalui variabel `PORT`; aplikasi sudah mendengarkan pada `0.0.0.0`.
6. Buka domain tersebut untuk melihat undangan. Tambahkan `/admin` pada domain untuk masuk ke editor.

Sumber resmi: https://docs.railway.com/quick-start, https://docs.railway.com/builds/dockerfiles, dan https://docs.railway.com/volumes.

## Memperbarui website sebelumnya

Unduh cadangan melalui `/admin` sebelum memperbarui. Ganti berkas proyek lama di repository dengan seluruh isi folder versi ini. Pertahankan service Railway, Volume `/data`, `ADMIN_PASSWORD`, dan `DATA_DIR` yang sudah digunakan. Jangan menghapus Volume saat mengganti desain. Server mengambil kembali teks dan RSVP dari `state.json` pada Volume, lalu melengkapi konfigurasi tampilan versi terbaru.

## Tampilan dan animasi

Ada sembilan tampilan: gerbang pembuka, tujuh bilik utama, dan epilog. Navigasi memakai tombol bilik, tombol maju/mundur, keyboard panah, atau gestur horizontal. Halaman yang isinya panjang tetap dapat digulir di ponsel agar formulir dan teks dapat dibaca utuh.

Lingkungan arsitektur memakai gambar yang sudah dirender. Dua daun pintu memiliki geometri 3D WebGL, ketebalan, engsel, pencahayaan, rotasi 118 derajat, dan gerak kamera. Browser yang tidak mendukung WebGL memakai animasi pintu CSS. Tombol lewati mempercepat masuk tanpa menunggu animasi. Pengaturan perangkat untuk mengurangi gerak juga didukung.

## Mengubah teks

Masuk ke `/admin` memakai `ADMIN_PASSWORD`. Pilih bagian atau cari teks. Edit lalu klik **Simpan Perubahan**. Pratinjau diperbarui setelah berhasil tersimpan. Tamu yang membuka atau memuat ulang undangan menerima teks terbaru tanpa perlu deploy ulang.

Editor mencakup nama pendek dan lengkap, nama orang tua, salam, ayat dan terjemahan, tanggal yang tampil, lokasi yang tampil, label tombol, placeholder formulir, keterangan gambar, navigasi, cerita, serta pesan konfirmasi dan audio. Semua perubahan memakai teks aman; editor tidak menerima HTML bebas.

Tanggal yang tampil, target countdown, serta waktu kalender memiliki isian tersendiri. Saat mengubah acara, sesuaikan ketiganya. Target countdown memakai WIB, misalnya `2026-12-12T08:00:00+07:00`. Waktu kalender memakai UTC: `20261212T010000Z` berarti 12 Desember 2026 pukul 08.00 WIB. `20261212T043000Z` berarti pukul 11.30 WIB.

Tautan Maps kosong akan mencari nama lokasi yang tampil. Isi tautan HTTPS yang tepat jika ingin membuka titik tempat tertentu. Nama lokasi awal mengikuti brief dan perlu Anda cocokkan dengan lokasi acara sebenarnya.

Isi nama bank, pemilik, dan nomor rekening di bagian **Tanda Tresna**. Selama nomor rekening kosong, bagian rekening disembunyikan.

## RSVP dan cadangan

Tamu mengirim konfirmasi ke server. Buku doa pada bagian RSVP diperbarui setiap tujuh detik selama bagian tersebut terbuka. Admin melihat seluruh konfirmasi melalui tab **Daftar RSVP** dan dapat mengunduh CSV untuk dibuka di Excel.

Gunakan **Unduh Cadangan** untuk menyimpan salinan teks dan konfirmasi. Cadangan berisi data tamu; simpan untuk keperluan pengelolaan acara.

Volume wajib dipasang agar perubahan dan RSVP tetap ada setelah deploy ulang. Penyimpanan di luar volume Railway bersifat sementara. Jalankan satu instance aplikasi karena penyimpanan memakai satu berkas JSON. Paket ini tidak memakai database eksternal atau mengirim email/WhatsApp secara otomatis.

## Menjalankan di komputer

Gunakan Node.js 22 atau lebih baru. Pada terminal di folder proyek:

```bash
ADMIN_PASSWORD='kata-sandi-pribadi-anda' npm start
```

Di Windows PowerShell:

```powershell
$env:ADMIN_PASSWORD="kata-sandi-pribadi-anda"
npm start
```

Buka `http://localhost:3000`. Tidak ada dependency yang perlu diinstal. Server tidak membaca `.env` secara otomatis; isi variabel pada Railway atau terminal.

## Media

Gambar berada di `public/assets/`. Rekaman asli ada di `public/assets/music.mp3`; byte audio tidak diubah, hanya nama berkas yang disederhanakan. Ilustrasi pengantin tetap memakai bahan yang diberikan. Visual pendopo dan gebyok merupakan ilustrasi konsep. Dua lingkungan baru tidak memuat teks tertanam; nama, tanggal, judul, dan tombol memakai HTML yang dapat diedit.

Audio dimulai setelah tamu menekan tombol buka atau tombol musik. Tombol musik di kanan atas menjeda dan melanjutkan rekaman. Volume rekaman awal adalah 24%; dapat diubah di `public/app.js` pada `media.volume=.24*progress` (rentang `0` sampai `1`). Rekaman ini berdurasi sekitar 25 detik dan diputar berulang sesuai bahan yang diberikan.

## Pemeriksaan

Jalankan `npm test`. Pemeriksaan meliputi login, penyimpanan teks, konflik versi, penanganan konten berbahaya, RSVP, pemutaran media melalui HTTP range, ekspor, dan keberlanjutan data setelah server dimulai ulang.
