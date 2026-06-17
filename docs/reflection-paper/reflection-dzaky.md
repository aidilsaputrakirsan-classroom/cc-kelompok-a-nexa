# Reflection Paper — Lead Backend

**Nama:** Dzaky Rasyiq Zuhair <br>
**NIM:** 10231035 <br>
**Peran:** Lead Backend <br>
**Mata Kuliah:** Komputasi Awan — Sistem Informasi ITK

---

## Pendahuluan

Platform **Studyfy** merupakan sistem **LMS (Learning Management System)** berbasis *cloud* yang dirancang untuk mendukung proses belajar-mengajar secara digital dengan arsitektur *microservices*. Dalam proyek ini, saya memegang peran sebagai **Lead Backend**, yang berarti saya bertanggung jawab atas perancangan dan implementasi seluruh logika bisnis sisi server, mulai dari pengelolaan otentikasi pengguna, manajemen kelas, materi pembelajaran, penugasan (*assignment*), hingga sistem pengiriman dan penilaian tugas (*submission & grading*).

Arsitektur yang kami bangun memisahkan fungsi-fungsi bisnis ke dalam layanan-layanan mandiri (*microservices*) yang saling berkomunikasi secara aman melalui HTTP internal. Dua layanan utama yang menjadi tulang punggung sistem adalah **Auth Service** untuk manajemen autentikasi dan **Item Service** sebagai *consolidated service* yang menangani inventaris, kelas, materi, dan penugasan.

---

## Kontribusi dalam Proyek

Sebagai Lead Backend, kontribusi saya berpusat pada pembangunan API yang andal, aman, dan terstruktur menggunakan **FastAPI** dengan **Python**. Saya merancang dan mengimplementasikan seluruh endpoint REST API pada *Item Service* yang mencakup lebih dari 30 endpoint, meliputi:

- **CRUD Items** — pengelolaan inventaris materi milik pengguna yang terautentikasi.
- **Manajemen Kelas** — endpoint pembuatan, pembaruan, pengarsipan, dan penghapusan kelas, serta manajemen keanggotaan mahasiswa dengan validasi peran (*role-based access control*) antara dosen dan mahasiswa.
- **Materi Pembelajaran** — upload, listing, dan pengelolaan materi per kelas dengan kontrol visibilitas (`is_published`).
- **Penugasan & Submission** — sistem pengumpulan tugas berbasis PDF dengan validasi ukuran file (maks. 2MB), deteksi *late submission* menggunakan zona waktu WITA, dan dukungan *resubmission*.
- **Sistem Penilaian** — endpoint pemberian nilai (*grading*) oleh dosen serta endpoint bagi mahasiswa untuk melihat nilai tugas mereka.

Saya juga mengimplementasikan **Circuit Breaker** pada `auth_client.py` untuk mengelola komunikasi antar-layanan dengan Auth Service. Pola ini memastikan bahwa jika Auth Service mengalami gangguan, Item Service tidak akan terus-menerus mengirimkan permintaan yang gagal, melainkan akan masuk ke status *OPEN* dan merespons dengan cepat untuk mencegah *cascading failure*. Selain itu, saya menyusun lapisan *metrics* dan *logging middleware* untuk mendukung observabilitas sistem secara menyeluruh.

---

## Tantangan yang Dihadapi

Tantangan paling signifikan yang saya hadapi adalah merancang sistem **otorisasi berbasis peran** (*role-based access control / RBAC*) yang konsisten di seluruh endpoint. Dalam sistem LMS, izin akses sangat granular: seorang dosen hanya boleh mengelola kelas yang ia ampu, mahasiswa hanya boleh melihat materi yang telah dipublikasikan, dan hanya mahasiswa yang terdaftar di kelas tertentu yang boleh mengumpulkan tugas. Menjaga konsistensi logika ini di lebih dari 30 endpoint sekaligus mencegah kebocoran data antar-pengguna membutuhkan ketelitian dan pendekatan yang sistematis dengan dependency injection FastAPI (`Depends`).

Tantangan kedua adalah implementasi **komunikasi antar-layanan** (*inter-service communication*) yang tangguh. Item Service perlu memverifikasi token JWT pengguna ke Auth Service pada setiap *request* yang masuk. Tanpa mekanisme toleransi kesalahan, satu gangguan kecil pada Auth Service akan langsung melumpuhkan seluruh Item Service. Proses membangun dan mengkalibrasi *Circuit Breaker* — menentukan ambang batas kegagalan, durasi *timeout* saat status *OPEN*, dan logika transisi ke *HALF-OPEN* — memerlukan pemahaman mendalam tentang pola *reliability* dalam sistem terdistribusi.

Tantangan ketiga muncul pada fitur **submission tugas**. Saya perlu menangani pengunggahan file secara *streaming* (`UploadFile`), memvalidasi format dan ukuran file, mengelola direktori penyimpanan di server, serta menangani skenario *resubmission* dengan menghapus file lama secara aman. Sinkronisasi antara operasi *file system* dan operasi database harus dilakukan dengan hati-hati untuk menghindari kondisi di mana data tersimpan di database tetapi file fisiknya tidak ada, atau sebaliknya.

---

## Pembelajaran yang Didapat

Proyek Studyfy memberikan saya pemahaman yang jauh lebih dalam mengenai **desain API dalam arsitektur microservices**. Saya belajar bahwa merancang API bukan hanya tentang membuat endpoint yang "bisa jalan", tetapi tentang memikirkan kontrak antarlayanan (*API contract*), granularitas otorisasi, penanganan *edge case*, dan konsistensi respons error.

Pengalaman mengimplementasikan *Circuit Breaker* secara langsung mengubah cara pandang saya terhadap *reliability*. Saya menyadari bahwa dalam sistem terdistribusi, **kegagalan adalah hal yang normal dan harus direncanakan**, bukan dihindari. Pola seperti *Circuit Breaker*, *Retry Logic*, dan *Health Check* adalah fondasi dari sistem yang benar-benar andal di lingkungan *cloud*.

Saya juga mendapat pelajaran berharga tentang pentingnya **observabilitas**. Logging yang terstruktur dan endpoint `/metrics` serta `/health` yang saya bangun terbukti sangat krusial saat proses *debugging* bersama tim DevOps. Tanpa visibilitas ini, melacak asal-usul error di sistem terdistribusi akan jauh lebih menyulitkan.

Secara tim, saya belajar bahwa peran Lead Backend memerlukan komunikasi intensif dengan semua pihak — berkoordinasi dengan DevOps terkait variabel lingkungan dan konfigurasi Docker, berdiskusi dengan Frontend tentang *shape* respons API yang dibutuhkan, serta membantu QA dalam menyusun skenario pengujian yang representatif. Kesuksesan backend bukan hanya diukur dari kode yang berjalan, tetapi dari seberapa baik layanan tersebut mendukung seluruh ekosistem tim.
