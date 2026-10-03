# RANGKUMAN DISKUSI PENGEMBANGAN SISTEM E-RAPOR & LMS PONDOK
**Tanggal:** 30 September 2026

Dokumen ini merangkum seluruh poin pembahasan, arsitektur, dan rencana pengembangan sistem yang telah didiskusikan dari sesi pagi.

---

## 1. Fitur Pengaman Keluar Halaman (Dirty State Guard)
* **Tujuan:** Mencegah hilangnya data nilai jika ustadz tidak sengaja menekan tombol Back di HP/browser, tombol ESC, atau menutup tab.
* **Status:** Sudah terpasang aktif di sistem.
* **Mekanisme:** 
  - Sistem mendeteksi otomatis jika ada perubahan nilai/catatan (*dirty state*).
  - Menampilkan konfirmasi popup sebelum modal ditutup.
  - Memasang pengaman native browser (`beforeunload`) jika browser/tab ingin ditutup.

---

## 2. Kapasitas & Pengelolaan Database (Supabase)
* **Kapasitas Akun Gratis (Free Tier):**
  - Penyimpanan database 500 MB sangat cukup untuk menampung data ~500 santri, ~50 karyawan, rekap nilai, dan absensi selama bertahun-tahun.
  - Kuota bandwidth 5 GB/bulan sangat memadai untuk aktivitas cetak rapor periodik.
* **Kemudahan Pengelolaan:**
  - Seluruh operasi data (tambah, edit, hapus, cetak) dilakukan **100% langsung lewat web**.
  - Admin & ustadz tidak perlu membuka atau memahami dashboard Supabase. Supabase murni bekerja sebagai gudang data di belakang layar.

---

## 3. Pemahaman Konsep CRUD
* **Singkatan:**
  - **C (Create):** Tambah data baru (misal: tombol *+ Tambah Santri*).
  - **R (Read):** Menampilkan daftar data ke tabel di layar.
  - **U (Update):** Mengubah data yang salah/naik kelas (tombol *Edit*).
  - **D (Delete):** Menghapus data santri/karyawan (tombol *Hapus*).
* **Alur:** Form Web $\rightarrow$ React $\rightarrow$ Perintah API Supabase $\rightarrow$ Data Database Diperbarui secara instan.

---

## 4. Rencana Ekspansi Sistem (Roadmap Semester Depan)
* **Keputusan:** Eksekusi perombakan besar **ditunda hingga semester depan** demi menjaga stabilitas pembagian rapor yang sedang berjalan saat ini.
* **Fitur-Fitur Masa Depan yang Disiapkan:**
  1. **Master Data Santri & Karyawan:** Manajemen biodata lengkap langsung di web.
  2. **Rapor Diniyah & Akhlak:** Penilaian mata pelajaran keagamaan (Nahwu, Fiqih, dll) terpisah dari Tahfidz.
  3. **Modul Presensi / Absensi:** Rekap kehadiran santri dan ustadz.
  4. **Modul PSB (Penerimaan Santri Baru):** Form pendaftaran online publik + seleksi santri baru.
  5. **Cetak Rapor Gabungan:** Opsi cetak gabungan (Diniyah + Tahfidz) dalam satu bundle dokumen resmi.

---

## 5. Arsitektur: Monolith vs Multi-Modul (Routing & Sidebar)
* **Kondisi Sekarang:**
  - Berbentuk *1 Modul Monolith* di `App.jsx`, semua fitur dibuka melalui popup modal.
* **Kondisi Setelah Dipecah (Semester Depan):**
  - Menggunakan **React Router** (`react-router-dom`) dan **Layout Sidebar**.
  - Setiap modul memiliki halaman dan folder sendiri (misal: `/santri`, `/diniyah`, `/tahfidz`, `/psb`).
  - Aplikasi menjadi jauh lebih ringan, cepat, dan modul tidak saling mengganggu jika ada perbaikan.

---



---

## 7. Rapor Diniyah & Pembagian Hak Akses (RBAC)
* **Pemisahan Menu:**
  - Menu Diniyah dibuat terpisah dari menu Tahfidz karena guru pengampu dan struktur nilainya berbeda (mapel vs juz).
  - Model input nilai Diniyah menggunakan format lembar kelas/mapel cepat ala Excel.
* **Hak Akses Berdasarkan Peran (Role-Based Access Control):**
  - 👑 **Admin:** Memiliki "kunci master", dapat melihat seluruh menu (Tahfidz, Diniyah, Karyawan, PSB, Pengaturan).
  - 📖 **Guru Tahfidz:** Hanya melihat modul Tahfidz & profilnya.
  - 📚 **Guru Diniyah:** Hanya melihat modul Diniyah & kelas yang diampunya.
  - Dilengkapi *Protected Routes* (satpam rute web) agar user tidak bisa membuka halaman yang bukan haknya.
