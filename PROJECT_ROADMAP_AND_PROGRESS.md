# Kopora POS — Roadmap, Planning & Progress Tracker

> Handoff kerja untuk Mas Daffa dan GPT berikutnya. Status di sini adalah snapshot dari sesi terakhir yang diketahui; sebelum melanjutkan, verifikasi source code, database, dan hasil runtime yang aktual. Jangan menganggap item “dikerjakan” berarti sudah dites.

## 1. Cara memakai dokumen ini

- `PROJECT_CONTEXT_FOR_GPT.md`: ringkasan proyek, stack, peta file, aturan mentoring, dan catatan teknis.
- Dokumen ini: urutan fase, status pekerjaan, backlog, checklist penerimaan, dan risiko.
- Saat menyelesaikan satu item, tandai statusnya sebagai `Done` hanya setelah ada bukti konkret (file dibaca, typecheck/test berjalan, atau request API diuji).
- Jangan mencatat secret, token, password, atau data pribadi di sini.
- Jika roadmap resmi bootcamp/mockup berbeda, kebutuhan resmi yang terbaru mengalahkan asumsi roadmap ini; diskusikan perbedaannya dengan Mas Daffa.

### Status legend
- `[x]` selesai dan ada bukti dalam riwayat kerja.
- `[~]` dikerjakan sebagian / perlu review atau tes ulang.
- `[ ]` belum selesai.
- `[?]` perlu konfirmasi dari Mas Daffa atau pemeriksaan source aktual.

## 2. Tujuan produk dan MVP

Membangun POS kafe full-stack dengan tiga ruang kerja:

1. **Admin:** login, ringkasan operasional, CRUD kategori/menu, kelola harga/ketersediaan/gambar, pantau transaksi dan laporan sesuai mockup.
2. **Kasir:** pilih kategori/menu, kelola cart, isi nama pelanggan bila dibutuhkan, terima pembayaran tunai, hitung total/kembalian, buat order dan struk.
3. **Barista/KDS:** melihat antrean, membaca item/catatan, memulai dan menyelesaikan tiket, mengubah status secara sah.

Mockup utama: `mockup-preview.html` (sekitar 10 fitur MVP menurut judul/acuan). Baca isi mockup dan blueprint resmi sebelum menetapkan rincian UI/fitur; jangan menyimpulkan seluruh acceptance criteria dari judul file saja.

## 3. Snapshot progres saat handoff

### A. Database dan seed
- `[x/?]` PostgreSQL + schema Prisma dan seed pernah digunakan untuk proyek.
- `[x/?]` Model yang terbaca: `User`, `Category`, `Menu`, `Order`, `OrderItem`; enum role/status.
- `[?]` Periksa migrasi terakhir dan status database sebelum mengubah schema.
- `[?]` Ada data seed dan data uji manual. Jangan mengasumsikan record/count/credentials masih sama.

### B. Auth/security backend
- `[x]` Login JWT dan endpoint profil `/api/auth/me` pernah berhasil diuji.
- `[x]` Middleware `verifyToken` dan `checkRole` ada.
- `[~]` Perlu security review: JWT secret fallback default, bentuk token header, error semantics, token payload, role authorization, CORS.
- `[?]` Pastikan route register, login, me, dan alur frontend auth aktual.

### C. Kategori
- `[x]` `GET /api/categories` dengan urutan nama A–Z dan `_count.menus`.
- `[x]` `POST /api/categories` memakai Zod dan pengecekan duplikat case-insensitive di controller.
- `[x]` `PUT /api/categories/:id` memakai pengecekan id, validasi, pengecualian id sendiri saat mencari duplikat.
- `[x]` `DELETE /api/categories/:id` mengecek keberadaan dan menolak kategori yang punya menu.
- `[x/?]` Pengguna melaporkan tes Postman berjalan baik; lakukan regresi jika perubahan schema/route terjadi.
- `[~]` Pengecekan duplikat belum menjamin keunikan case-insensitive secara atomik; perlu constraint/index DB dan penanganan conflict.
- `[~]` Schema terakhir yang terbaca menggunakan `onDelete: Cascade` untuk `Menu.category`, yang perlu diselaraskan dengan guard controller dan histori transaksi.

### D. Menu/upload
- `[x]` `GET /api/menus` dengan filter opsional `categoryId`, `include: category`, `orderBy name asc`.
- `[x]` Schema create menu: name, optional description, price coercion, categoryId.
- `[x]` Multer disk storage, nama file unik, allowlist MIME, maksimum 2 MB.
- `[x]` Static files disajikan dari `/uploads`.
- `[x]` `POST /api/menus`: multipart field `image`, mewajibkan file, validasi body, cek category, create record, cleanup file di jalur gagal.
- `[x]` `DELETE /api/menus/:id`: menghapus record dan gambar lokal (gambar eksternal tidak dihapus).
- `[x]` Uji manual: user melaporkan upload dan delete berhasil; list menu menampilkan row dan URL gambar sempat diverifikasi `200 OK`.
- `[ ]` `PUT /api/menus/:id` belum selesai menurut pemeriksaan terakhir.
- `[~]` Cleanup masih menggunakan `fs.unlinkSync`; perlu review async dan failure behavior.
- `[~]` Pastikan create error cleanup tidak melempar error kedua atau menutupi error Prisma.

### E. Frontend
- `[?]` Stack rencana React/Vite/TS/Tailwind/shadcn/Axios/Context diketahui.
- `[ ]` Periksa folder `client` dan implementasi aktual. Jangan mengklaim frontend selesai hanya berdasarkan stack.
- `[ ]` Integrasi auth dan role-based UI.
- `[ ]` Admin master data, Kasir POS/cart/checkout, Barista/KDS.

### F. Order, KDS, reports, deployment
- `[ ]` API order/checkout transaksional.
- `[ ]` Workflow status KDS.
- `[ ]` Riwayat/laporan sesuai mockup.
- `[ ]` Automated tests, security hardening, deployment dan persistence file.

## 4. Roadmap fase demi fase

## Fase 0 — Orientasi dan baseline aktual

**Tujuan:** GPT dan Mas Daffa punya baseline yang benar sebelum perubahan.

Checklist:
- `[ ]` Baca dokumen handoff dan roadmap.
- `[ ]` Baca `server/package.json`, `server/tsconfig.json`, `schema.prisma`.
- `[ ]` Baca route/controller/schema/middleware kategori dan menu.
- `[ ]` Periksa `git status`/diff bila Mas Daffa mengizinkan pemeriksaan repo.
- `[ ]` Jalankan typecheck/build/test yang memang tersedia; jangan menebak script.
- `[ ]` Catat error aktual tanpa mengubah file.
- `[ ]` Konfirmasi scope sesi dengan Mas Daffa.

**Exit criteria:** daftar masalah aktual, no destructive action, dan langkah berikutnya disepakati.

## Fase 1 — Selesaikan CRUD master data menu

### 1.1 Update schema Zod
- `[ ]` Buat `updateMenuSchema` berdasarkan partial fields create.
- `[ ]` Pastikan `isAvailable` menerima boolean dan string multipart `"true"`/`"false"` dengan parsing yang benar. Jangan memakai `Boolean("false")` atau menganggap `z.coerce.boolean()` otomatis mem-parsing teks false.
- `[ ]` Tentukan aturan field yang boleh dikirim kosong/diabaikan, termasuk description dan categoryId.
- `[ ]` Pastikan `price` hasil parsing integer rupiah, finite, dan sesuai rentang bisnis.

### 1.2 Rancang controller update
- `[ ]` Ambil dan validasi `id` dari route parameter.
- `[ ]` Cari menu target; jika tidak ada, kembalikan 404.
- `[ ]` Validasi body parsial. Jika categoryId diberikan, pastikan category tujuan ada.
- `[ ]` Siapkan patch data hanya dari field yang benar-benar dikirim (hindari menimpa nilai lama dengan `undefined`/nilai default yang tidak disengaja).
- `[ ]` Jika tidak ada file baru, pertahankan `menu.image` lama.
- `[ ]` Jika file baru ada, gunakan path file baru dalam data update.
- `[ ]` Simpan perubahan DB terlebih dahulu. Jika DB gagal, hapus file baru yang baru terupload; jangan hapus foto lama.
- `[ ]` Setelah DB sukses, hapus foto lama hanya bila ia file lokal di folder uploads dan berbeda dari foto baru.
- `[ ]` Tangani kegagalan penghapusan file lama secara terpisah: record sudah berubah, sehingga jangan mengirim response gagal yang memberi kesan update DB batal. Catat untuk cleanup/reconciliation.
- `[ ]` Response sukses 200 memuat record menu terbaru.

### 1.3 Route dan upload
- `[ ]` Daftarkan `PUT /:id` hanya untuk ADMIN.
- `[ ]` Middleware order: autentikasi, otorisasi, Multer `single("image")`, controller.
- `[ ]` Pastikan controller memakai field name sesuai multipart Postman/frontend.

### 1.4 Tes update menu
- `[ ]` Tanpa token → 401/403 sesuai implementasi.
- `[ ]` Role non-admin → 403.
- `[ ]` ID tidak ada → 404.
- `[ ]` Body tidak valid → 400 dan uploaded file dibersihkan.
- `[ ]` Ubah harga saja → nama, kategori dan gambar lama tetap.
- `[ ]` Kirim `isAvailable: "false"` → tersimpan boolean false.
- `[ ]` Ganti categoryId valid → relasi berubah.
- `[ ]` Ganti categoryId tidak valid → ditolak, file baru dibersihkan, record/foto lama dipertahankan.
- `[ ]` Ganti gambar → URL baru tersimpan, gambar lama lokal dibersihkan setelah DB sukses.
- `[ ]` Update menu dengan URL gambar eksternal lama → jangan mencoba menghapus URL sebagai path lokal.
- `[ ]` Jalankan GET setelah update dan buka URL gambar baru untuk memastikan hasil benar.

**Exit criteria Fase 1:** GET/POST/PUT/DELETE kategori/menu bekerja, role benar, file tidak bocor pada jalur gagal yang teruji, histori order tidak dirusak, dan typecheck/test aktual berhasil.

## Fase 2 — Hardening backend dan konsistensi data

### Database/integritas
- `[ ]` Putuskan apakah menu/category/order yang pernah dipakai transaksi boleh dihapus. Prefer soft-delete/nonaktifkan bila histori harus utuh.
- `[ ]` Selaraskan `onDelete` pada relasi Category→Menu dan Menu→OrderItem dengan aturan bisnis. Jangan biarkan cascade menghapus histori tanpa keputusan eksplisit.
- `[ ]` Tetapkan keunikan nama kategori case-insensitive di level database (misalnya normalisasi canonical name atau unique functional index sesuai dukungan toolchain) dan tangani conflict unik secara terukur.
- `[ ]` Evaluasi constraint `price >= 0`, positive quantity, unique order number, foreign key dan indexing pada kolom filter/status/tanggal.
- `[ ]` Gunakan migration yang konsisten; tinjau SQL/migration sebelum diterapkan ke data penting.

### Keamanan/API
- `[ ]` Hapus fallback `JWT_SECRET` default; startup harus gagal jelas jika secret wajib tidak ada.
- `[ ]` Validasi token format/claims/expiry dan role; jangan percaya payload tanpa signature verification.
- `[ ]` Atur CORS origin allowlist, bukan wildcard untuk deployment transaksi.
- `[ ]` Validasi route params dan query dengan Zod; hindari type assertion sebagai validasi runtime.
- `[ ]` Batasi request body, upload bytes, extension dan file signature; cegah path traversal dan nama file dari user.
- `[ ]` Rancang penyajian gambar publik secara sadar; file upload jangan mengeksekusi konten aktif.
- `[ ]` Standarkan response: konsisten `message` (singular/plural), bentuk error, status 400/401/403/404/409/413/500.
- `[ ]` Buat centralized error middleware dan jangan bocorkan stack trace/secrets ke client.
- `[ ]` Periksa status API error dan duplicate request, logging tanpa token/password.

### Reliability
- `[ ]` Ganti `fs.unlinkSync` dengan operasi async bila sesuai; cleanup error tidak boleh menutupi error utama atau menyebabkan double response.
- `[ ]` Pertimbangkan orphan-file reconciliation (mis. job/manual maintenance) untuk kegagalan lintas filesystem/database.
- `[ ]` Kelola PrismaClient dengan satu instance lifecycle yang sesuai, connection pooling, dan graceful shutdown.
- `[ ]` Tambahkan pagination/filter untuk daftar besar.

### Testing/docs
- `[ ]` Tambah tests schema/controller/middleware, integration test database, route RBAC, dan upload.
- `[ ]` Dokumentasikan endpoint dan contoh request/response (OpenAPI atau dokumentasi ringkas).
- `[ ]` Siapkan Postman collection tanpa token/secret tertanam.

## Fase 3 — API transaksi kasir / order

### Kontrak dan aturan bisnis
- `[ ]` Baca mockup/brief untuk field order: customer name, items, quantity, notes, cash received, order number, tax/service fee bila ada.
- `[ ]` Definisikan DTO input; client mengirim menuId + quantity + note, bukan authoritative price/subtotal/total.
- `[ ]` Server mengambil harga dan ketersediaan terkini dari DB untuk semua menu.
- `[ ]` Tolak menu tidak ditemukan/nonaktif, quantity tidak valid, cart kosong, cash kurang dari total.
- `[ ]` Hitung subtotal/total/kembalian di server; tetapkan pembulatan, PB1/pajak/discount sesuai requirement resmi.

### Atomicity/concurrency
- `[ ]` Dalam satu Prisma transaction, buat Order dan seluruh OrderItem agar tidak ada order setengah tersimpan.
- `[ ]` Simpan unit price snapshot dan subtotal pada OrderItem untuk histori meskipun harga menu berubah.
- `[ ]` Buat orderNumber unik dengan strategi aman terhadap request bersamaan; tangani unique conflict/retry.
- `[ ]` Pertimbangkan idempotency key agar retry jaringan tidak membuat transaksi ganda.
- `[ ]` Tetapkan state awal dan ownership cashier dari token `req.user`, bukan userId yang dipercaya dari body.

### Endpoint dan tes
- `[ ]` Buat endpoint create order dengan autentikasi role kasir yang tepat.
- `[ ]` GET order detail/list sesuai kebutuhan admin/kasir.
- `[ ]` Uji rollback bila satu item invalid/DB gagal.
- `[ ]` Uji cash insufficient, menu unavailable, harga berubah, duplicate submit dan batas quantity.
- `[ ]` Verifikasi total/respon DB konsisten dengan receipt.

**Exit criteria Fase 3:** order dapat dibuat atomik, harga server authoritative, perhitungan benar, duplicate submit ditangani, histori tetap akurat.

## Fase 4 — Barista / KDS

- `[ ]` Definisikan alur status order dan transisi legal dari brief/mockup.
- `[ ]` Endpoint daftar antrean berdasarkan status dan waktu, dengan pagination bila dibutuhkan.
- `[ ]` Detail ticket mencakup item, quantity, note, waktu dan identitas yang diperlukan.
- `[ ]` Endpoint update status membatasi role BARISTA/role lain yang disepakati.
- `[ ]` Cegah status jumping, perubahan order terminal, dan race update (optimistic concurrency/version/status predicate).
- `[ ]` Definisikan apakah cancel dilakukan kasir/admin dan bagaimana item yang sudah dikerjakan ditangani.
- `[ ]` Pilih polling atau WebSocket berdasarkan kebutuhan; jangan menambahkan kompleksitas tanpa kebutuhan.
- `[ ]` Uji antrean kosong, dua barista update bersamaan, status invalid, dan refresh UI.

**Exit criteria Fase 4:** semua ticket muncul konsisten, transisi status terkendali dan tiap role hanya melakukan aksi yang diizinkan.

## Fase 5 — Integrasi frontend React

### Fondasi
- `[ ]` Inventarisasi `client` dan scripts/dependencies aktual.
- `[ ]` Buat API client Axios dengan base URL dari environment yang aman.
- `[ ]` Tetapkan strategi token sesuai requirement/security; jangan simpan credential rahasia di client.
- `[ ]` Atur loading/error/empty state, request cancellation bila perlu, dan handling 401/expired token.
- `[ ]` Auth context memuat user/role; protected route hanya UX, backend tetap penegak authorization.

### Admin
- `[ ]` Login dan navigasi Admin.
- `[ ]` CRUD kategori dengan validasi UX dan penanganan duplicate/foreign key errors.
- `[ ]` CRUD menu termasuk multipart image preview/upload, edit gambar opsional, availability, harga dan kategori.
- `[ ]` Tampilkan menu/order/report sesuai mockup, bukan asumsi.

### Cashier
- `[ ]` Load categories dan menu, filter kategori, image fallback.
- `[ ]` Cart state: add/remove/change quantity/note.
- `[ ]` Checkout mengirim item identifiers/quantity; server menghitung angka transaksi.
- `[ ]` Input tunai manual, kembalian real-time sebagai preview, validasi ulang server.
- `[ ]` Sukses order → receipt thermal sesuai brief, clear cart hanya setelah response sukses.

### Barista/KDS
- `[ ]` Board ticket, status, timer, clear/complete ticket sesuai mockup.
- `[ ]` Refresh/polling/realtime dengan error/reconnect behavior.

### UI/quality
- `[ ]` Responsive desktop/tablet dan aksesibilitas keyboard/label/focus.
- `[ ]` Empty/loading/error states, invalid token, network offline.
- `[ ]` Jangan menaruh harga/otorisasi hanya di UI.

**Exit criteria Fase 5:** alur end-to-end per role berjalan pada API lokal dengan state dan error yang benar.

## Fase 6 — Reporting, audit dan operasional

- `[ ]` Tetapkan definisi laporan (range tanggal, gross/net, refund/cancel, pajak, metode pembayaran) bersama brief.
- `[ ]` Query agregat efisien, timezone konsisten, index memadai.
- `[ ]` Role Admin-only, export bila diminta, sanitasi spreadsheet export.
- `[ ]` Audit log untuk aksi sensitif (perubahan harga, status, delete/cancel).
- `[ ]` Uji batas tanggal, timezone, data kosong dan volume.

## Fase 7 — Release / deployment

- `[ ]` Tentukan target (Vercel/VPS/layanan lain), database hosted, domain dan environment.
- `[ ]` Build production frontend/backend; jalankan migrations terkontrol dan seed hanya bila aman.
- `[ ]` HTTPS, secrets manager/env, restricted CORS, rate limiting auth, security headers, backup/restore.
- `[ ]` Pastikan persistent object storage untuk gambar jika filesystem deploy tidak persistent atau ada banyak instance.
- `[ ]` Health/readiness checks, logging/monitoring, graceful shutdown, DB pool limits.
- `[ ]` Smoke test login, CRUD, upload, checkout, KDS, receipt dan permission setelah deploy.
- `[ ]` Buat rollback plan dan dokumentasi operasional.

## 5. Rencana sesi belajar berikutnya (urutan pedagogis)

### Sesi berikut — UPDATE menu
1. Cek file aktual dan typecheck; jangan mulai dari asumsi.
2. Bedah dulu bentuk update parsial: apa yang berubah bila client hanya kirim harga? Apa yang terjadi pada file lama?
3. Bahas multipart string boolean, coercion harga, dan `undefined` vs `null`.
4. Mas Daffa rancang pseudocode/peta alur.
5. Implementasi bertahap dengan Mas Daffa mengetik; berikan scaffolding pendek jika diminta.
6. Review kode, uji skenario satu per satu, lalu jelaskan hasil.

### Sesi setelah update
- Review risiko delete menu yang mungkin direferensikan order item.
- Hardening schema/cleanup/auth/CORS setelah membedakan kebutuhan MVP dan production.
- Baru lanjut ke endpoint order dan transaksi.

Jangan menyelesaikan seluruh roadmap dalam satu respons. Satu konsep/fungsi per tahap, sesuai pemahaman Mas Daffa.

## 6. Daftar acceptance criteria global

MVP belum boleh disebut selesai sampai setidaknya:

- [ ] Build/typecheck frontend dan backend berhasil dari scripts aktual.
- [ ] Auth login per role dan API menolak token/role tidak sah.
- [ ] Admin mengelola kategori/menu; upload/change image berjalan dan error cleanup dites.
- [ ] Kasir dapat membuat order dengan perhitungan server-side dan receipt benar.
- [ ] Barista melihat dan memproses ticket melalui transisi status legal.
- [ ] Riwayat order tidak rusak oleh edit/delete master data.
- [ ] Automated tests mencakup business-critical flows dan permission.
- [ ] Environment, CORS, secrets, DB migration, storage dan deployment diperiksa.
- [ ] Manual smoke test semua role selesai dan hasilnya dicatat.

## 7. Known risks untuk dipantau sepanjang roadmap

- Case-insensitive duplicate check di controller tidak atomik; butuh DB constraint/index.
- `onDelete: Cascade` Category→Menu tidak selaras dengan larangan delete kategori berisi menu dan bisa berdampak pada histori.
- Menu yang terikat OrderItem tidak boleh dihapus tanpa strategi historis yang jelas.
- `fs.unlinkSync` memblokir event loop; failure cleanup perlu ditangani tanpa double response.
- MIME type berasal dari client, bukan bukti konten file.
- `process.cwd()` bisa berubah berdasarkan direktori command.
- TypeScript `as string` tidak memvalidasi runtime input.
- `z.coerce.number()` perlu batas format/integer; string kosong dapat menghasilkan nilai yang tidak dimaksudkan.
- `z.coerce.boolean()`/`Boolean("false")` dapat mengubah teks `"false"` menjadi true.
- JWT secret fallback default perlu dihapus sebelum deployment.
- `cors()` wildcard perlu dibatasi untuk production.
- Static uploads publik; filesystem lokal tidak otomatis persisten pada platform ephemeral/multi-instance.
- Jangan mengasumsikan data menu/kategori/akun uji masih sama; query database aktual bila perlu dan diizinkan.

## 8. Format update progres setiap akhir sesi

Saat satu pekerjaan selesai, catat dengan format ini:

- Tanggal/sesi:
- Fitur/isu:
- File yang diperiksa/diubah (oleh Mas Daffa):
- Keputusan arsitektur:
- Tes yang benar-benar dijalankan:
- Output aktual:
- Yang belum dites:
- Risiko/utang teknis baru:
- Next step tunggal:

Jangan menandai `Done` hanya karena kode terlihat benar; tulis jenis bukti yang mendukung status.
