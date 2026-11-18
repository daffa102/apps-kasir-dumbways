# Kopora POS — Project Context & Learning Roadmap

> Dokumen handoff untuk GPT/AI yang membantu Mas Daffa melanjutkan proyek. Baca dokumen ini dan file sumber terkait sebelum memberi saran. Jangan menganggap isi dokumen menggantikan pemeriksaan kode aktual.

## 1. Ringkasan proyek

Kopora adalah aplikasi POS untuk kafe dengan tiga peran: `ADMIN`, `CASHIER`, dan `BARISTA`. Fokus saat ini adalah backend API, lalu integrasi frontend. Tujuan pendampingan bukan sekadar menghasilkan kode: bantu Mas Daffa memahami alur, membuat keputusan, dan menulis kode sendiri.

## 2. Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Axios, React Context API, `useState`.
- Backend: Node.js, Express 5, TypeScript, REST API.
- Database: PostgreSQL melalui Prisma ORM.
- Keamanan: JWT, bcryptjs, role-based access control (RBAC).
- Validasi: Zod v4.
- Upload gambar menu: Multer, penyimpanan lokal di `server/uploads/menus`.
- Pengujian API manual: Postman.

Periksa `server/package.json` dan konfigurasi aktual sebelum memberi instruksi instalasi atau versi.

## 3. Struktur/file penting

- `mockup-preview.html` — mockup produk dan acuan fitur/UI.
- `server/prisma/schema.prisma` — model dan relasi database (`User`, `Category`, `Menu`, `Order`, `OrderItem`).
- `server/prisma/seed.ts` — data awal/akun dan data uji; periksa sebelum mengasumsikan kredensial atau isi database.
- `server/src/server.ts` — entry point Express, middleware global, registrasi route, static uploads.
- `server/src/middleware/auth.middleware.ts` — verifikasi JWT dan pemeriksaan role.
- `server/src/middleware/upload.middleware.ts` — konfigurasi Multer: folder, nama file, MIME filter, batas ukuran.
- `server/src/schemas/auth.schema.ts` — contoh schema Zod autentikasi.
- `server/src/schemas/category.schema.ts` — validasi kategori.
- `server/src/schemas/menu.schema.ts` — validasi menu.
- `server/src/controllers/category.controller.ts` — CRUD kategori.
- `server/src/controllers/menu.controller.ts` — controller menu.
- `server/src/routes/auth.route.ts` — route autentikasi.
- `server/src/routes/category.route.ts` — route kategori + RBAC.
- `server/src/routes/menu.route.ts` — route menu + upload.

Path proyek Windows: `D:\belajar\kopora\`.

## 4. Status pekerjaan yang sudah tercapai

### Fondasi backend
- API Express berjalan di port 5001 dan route auth sudah digunakan.
- Login JWT, middleware autentikasi, pemeriksaan role, dan endpoint profil telah diuji sebelumnya.
- Kategori: `GET`, `POST`, `PUT`, `DELETE` dibuat dan diuji di Postman.
- Penghapusan kategori memeriksa keberadaan kategori dan jumlah menu terkait.

### Menu dan upload
- Schema create menu Zod dibuat dengan `name`, `description`, `price` (coerce), dan `categoryId`.
- Multer menyimpan satu gambar ke disk dengan batas 2 MB dan filter MIME image.
- Express menyajikan folder uploads melalui prefix `/uploads`.
- `GET /api/menus` mendukung filter opsional `categoryId`, menyertakan kategori, dan mengurutkan nama.
- `POST /api/menus` menerima multipart form-data, mewajibkan file gambar, memvalidasi body, mengecek kategori, lalu menyimpan menu.
- `DELETE /api/menus/:id` menghapus record dan file lokal bila path-nya lokal.
- Uji manual Postman berhasil membuat, membaca, dan menghapus menu; file statis sempat diverifikasi memberi HTTP 200.
- `menu.route.ts` saat terakhir diperiksa memuat GET, POST, DELETE. `updateMenu` belum dibuat.

Jangan menyatakan proyek atau semua CRUD selesai: update menu dan tahap lanjutan masih tersisa.

## 5. Roadmap berikutnya

### Sesi/pekerjaan saat ini — selesaikan master data menu
1. Review kondisi terbaru seluruh file karena beberapa perubahan mungkin terjadi setelah dokumen ini dibuat.
2. Buat dan review `updateMenuSchema` dengan validasi parsial. Perhatikan khusus nilai boolean dari multipart form-data: string `"false"` tidak aman dikonversi dengan `Boolean()`/`z.coerce.boolean()` karena string non-empty dianggap truthy.
3. Rancang `PUT /api/menus/:id`: cari menu; validasi data parsial; jika kategori berubah, pastikan kategori baru ada; pertahankan gambar lama bila tidak ada upload baru; bila ada gambar baru, update record dulu lalu bersihkan gambar lama dengan penanganan kegagalan yang aman.
4. Daftarkan route dengan autentikasi, role ADMIN, Multer, dan controller dalam urutan yang benar. Putuskan dan jelaskan apakah edit tanpa gambar diperbolehkan.
5. Uji happy path dan edge case: id tidak ada, body invalid, kategori invalid, edit harga saja, edit status `false`, ganti gambar, kegagalan DB, dan upload ditolak.
6. Review batasan upload: validasi MIME dari client tidak membuktikan konten file; evaluasi signature/file magic untuk produksi. Hindari cleanup yang dapat melempar error sekunder.

### Setelah CRUD master data
7. Verifikasi semua endpoint categories/menu, status HTTP, otorisasi role, dan error responses.
8. Lanjutkan API transaksi/order: membuat order dalam Prisma transaction, validasi harga dari database (jangan percaya harga client), hitung subtotal/total/kembalian di server, simpan snapshot harga, dan cegah stok/ketersediaan tidak valid.
9. Lanjutkan workflow KDS/barista, status order, dan endpoint yang sesuai mockup.
10. Hubungkan frontend React: API client Axios, auth state/token, role-aware routing, halaman admin menu/kategori, kasir, dan KDS.
11. Tambahkan tes otomatis (unit/integration), konfigurasi CORS ketat, validasi environment secrets, logging/error middleware, dan dokumentasi API.
12. Persiapkan deployment dan penyimpanan gambar yang sesuai produksi; local disk cocok untuk development/single-server, bukan otomatis pilihan yang aman untuk deployment ephemeral/multi-instance.

## 6. Catatan review teknis untuk GPT

Periksa hal-hal ini secara kritis; jangan menganggap pola saat ini production-ready:

- `schema.prisma` saat ini memiliki `Category.name @unique`, yang biasanya case-sensitive di PostgreSQL. Pengecekan `findFirst` dengan mode insensitive sebelum create/update tidak mencegah race condition; dua request bersamaan dapat lolos cek. Jika aturan nama harus case-insensitive, rancang constraint/index yang sesuai dan tangani unique conflict di database.
- Relasi `Menu.category` di schema saat ini memakai `onDelete: Cascade`, sementara controller kategori menolak penghapusan jika masih ada menu. Database cascade tetap dapat menghapus menu jika ada jalur lain atau race; selaraskan kebijakan database dan aplikasi. Menu juga terkait ke `OrderItem`, jadi histori transaksi harus dilindungi dari penghapusan menu.
- Controller menu menggunakan `fs.unlinkSync` dalam jalur request: operasi sync memblokir event loop. Untuk versi lebih kuat, gunakan operasi async dan tangani kegagalan cleanup tanpa mengaburkan hasil DB.
- Pada `createMenu`, jika DB gagal setelah upload, file harus dibersihkan. Pastikan operasi cleanup sendiri tidak mengganti error asli atau menyebabkan response kedua.
- `req.params.id as string` hanya assertion compile-time, bukan runtime validation. Validasi parameter bila format/keberadaan penting.
- `getAllMenu` saat ini meng-cast `req.query.categoryId as string`; query parameter dapat memiliki tipe selain string. Validasi tipe sebelum Prisma.
- `z.coerce.number()` dapat menerima bentuk input yang tidak diinginkan (contoh string kosong bisa terkonversi menjadi 0 pada sebagian skema). Tambahkan validasi format dan integer sesuai harga dalam rupiah.
- Batas 2 MB pada Multer perlu diselaraskan dengan UX/kebutuhan file; fileFilter MIME tidak cukup sebagai jaminan keamanan konten.
- Static uploads bersifat publik. Jangan simpan file sensitif di bawah folder tersebut. Gunakan konfigurasi cache dan strategi penyimpanan produksi yang disengaja.
- Periksa import tak terpakai/auto-import yang pernah muncul (mis. `success` dari `zod`) dan konsistensi nama respons (`message` vs `messages`).
- Jangan mengasumsikan path middleware: file aktual menggunakan `server/src/middleware` (singular), bukan `middlewares`.
- Pernah ada file `server/prisma/db.ts` dari konfigurasi Prisma lain yang menghasilkan error import contract. Jangan menghapus atau mengubah file tanpa memeriksa status terbaru dan penggunaan aktual.

## 7. Cara membimbing Mas Daffa

- Panggil pengguna “Mas Daffa”, gunakan bahasa Indonesia yang hangat tetapi lugas.
- Pengguna memahami alur logika, tetapi masih sering lupa sintaks JavaScript/TypeScript dan urutan API. Beri peta alur ringkas yang bisa dirujuk saat berpindah IDE/Telegram.
- Jangan langsung memberikan file/fungsi lengkap. Mulai dari model mental, jelaskan istilah dan sintaks yang diperlukan, lalu ajukan 1–2 pertanyaan terarah.
- Setelah pengguna menjawab atau menunjukkan percobaan, evaluasi jawaban/kodenya. Berikan scaffolding kecil 3–5 baris ber-TODO bila perlu, atau jelaskan potongan sintaks tepat yang ditanyakan.
- Jika Mas Daffa berkata tidak paham atau meminta contoh langsung, tingkatkan bantuan bertahap: pseudocode → kerangka → contoh minimal. Jelaskan setiap field, parameter, dan keyword.
- Jangan mengedit file proyek dengan tools kecuali Mas Daffa secara eksplisit meminta “kamu aja yang perbaiki”. Untuk review, baca file dan berikan diagnosis.
- Saat debugging: jelaskan arti error, tunjukkan akar masalah berdasarkan file aktual, dan arahkan satu perubahan kecil untuk diuji. Jangan klaim sudah bersih tanpa membaca/menjalankan pemeriksaan nyata.
- Jangan memuji berlebihan. Validasi spesifik terhadap hal yang benar, sebutkan risiko/celah dengan jelas.
- Saat fitur baru, pisahkan penjelasan konsep dari kode jadi; jangan gabungkan kuliah konsep dan solusi siap salin dalam satu balasan.

## 8. Dokumen pendamping dan instruksi melanjutkan

Baca `PROJECT_ROADMAP_AND_PROGRESS.md` untuk planning fase demi fase, progres, acceptance criteria, backlog, dan format update progres. Dokumen ini dan roadmap harus dibaca bersama.

Mulai sesi berikutnya dengan mengonfirmasi konteks secara singkat, lalu baca file relevan dan cek status aktual. Posisi yang tercatat: operasi GET/POST/DELETE menu sudah dibuat dan diuji; berikutnya merancang UPDATE menu. Sebelum coding, pastikan status terbaru `menu.schema.ts`, `menu.controller.ts`, `menu.route.ts`, dan `schema.prisma`. Jangan mengedit file tanpa instruksi eksplisit Mas Daffa.
