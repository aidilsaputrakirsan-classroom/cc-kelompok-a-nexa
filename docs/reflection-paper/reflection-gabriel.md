# Reflection Paper — Lead QA & Docs

**Nama:** Gabriel Karmen Sanggalangi <br>
**NIM:** 10231039 <br>
**Peran:** Lead QA & Docs <br>
**Mata Kuliah:** Komputasi Awan — Sistem Informasi ITK

---

## Kontribusi

Sebagai Lead QA & Docs, tanggung jawab saya meliputi penulisan dan pemeliharaan seluruh dokumentasi teknis, perancangan skenario reliability testing, verifikasi kualitas kode melalui code review, serta memastikan setiap fitur terdokumentasi dengan baik sebelum dirilis.

Dokumentasi yang saya hasilkan meliputi: `docs/architecture.md` (arsitektur dual-mode dengan diagram Mermaid), `docs/reliability-testing.md` (9 skenario test), `docs/operations-guide.md` (panduan operasional), `docs/deployment-guide.md` (panduan deploy), `docs/release-notes.md` (changelog), dan update `README.md`. Total lebih dari 3.000 baris dokumentasi.

## Analisis Pembelajaran

### Dokumentasi sebagai Produk

Saya awalnya menganggap dokumentasi sebagai pelengkap — yang penting kode jalan. Tapi setelah mengerjakan proyek ini, pandangan saya berubah total. Dokumentasi yang baik adalah produk yang sama pentingnya dengan kode itu sendiri.

Tanpa `docs/architecture.md`, anggota tim baru akan bingung bagaimana service-service terhubung. Tanpa `docs/operations-guide.md`, on-call engineer tidak tahu harus ngapain saat production incident. Tanpa `docs/deployment-guide.md`, proses deploy bergantung pada ingatan satu orang.

Saya menerapkan prinsip "document as you build" — setiap selesai fitur, langsung tulis dokumentasinya. Ini mencegah akumulasi technical debt dokumentasi yang biasanya terjadi di akhir proyek.

### Reliability Testing

Reliability testing adalah area paling menantang. Saya harus merancang skenario yang merepresentasikan kegagalan dunia nyata: service down, timeout, network partition, circuit breaker trip, high error rate.

Setiap skenario harus punya cara reproduce yang jelas agar bisa diverifikasi ulang. Saya juga mencantumkan source code reference agar reviewer bisa cross-check langsung ke implementasi.

Hasilnya menarik: 8 dari 9 skenario PASS. Satu skenario (slow query/timeout) dapat WARNING karena total delay 17,5 detik yang perlu dioptimasi. Ini menunjukkan bahwa sistem sudah cukup resilience, tapi masih ada ruang perbaikan.

### Code Review sebagai Quality Gate

Saya melakukan review untuk setiap pull request, terutama yang menyentuh backend dan dokumentasi. Fokus review saya bukan hanya mencari error, tapi juga memastikan konsistensi dengan dokumentasi yang sudah ada.

Contoh: ketika backend mengubah response `/items/stats`, saya memastikan dokumentasi di README dan architecture.md ikut diupdate. Tanpa ini, dokumentasi akan cepat usang dan tidak berguna.

## Tantangan

1. **Menjaga dokumentasi tetap sinkron dengan kode** — Kode berubah cepat, dokumentasi butuh effort ekstra untuk mengikuti. Solusi saya adalah menjadikan update dokumentasi sebagai bagian dari checklist PR.

2. **Menulis skenario test yang reproducible** — Skenario reliability test harus bisa dijalankan ulang dengan hasil yang konsisten. Saya menghabiskan banyak waktu memastikan command-command di dokumentasi benar-benar berfungsi.

3. **Encoding file** — Satu kali dokumentasi ter-corrupt karena encoding UTF-16 LE (BOM). File terlihat normal di editor tapi penuh karakter random di terminal. Saya harus rewrite ulang dengan UTF-8 without BOM.

## Kesimpulan

Proyek ini mengajarkan bahwa Lead QA & Docs bukan sekadar "tukang nulis". Saya adalah jembatan antara tim teknis dan pengguna dokumentasi. Dokumentasi yang baik mengurangi waktu onboarding, mempercepat debugging, dan mencegah kesalahan yang sama terulang. Saya bangga bisa berkontribusi pada kualitas sistem secara keseluruhan melalui dokumentasi dan testing yang ketat.
