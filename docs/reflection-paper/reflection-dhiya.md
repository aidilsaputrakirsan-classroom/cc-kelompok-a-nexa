# Reflection Paper

**Nama:** Dhiya Afifah 
**Peran:** Lead Frontend  

### 1. Keputusan Teknis & Arsitektur
Sebagai Lead Frontend dalam proyek *Cloud Computing* ini, tugas utama saya bukan sekadar membangun antarmuka, tetapi memastikan *frontend* dapat berinteraksi secara mulus dengan arsitektur *microservices* di *backend*. 

Keputusan teknis paling krusial yang saya ambil adalah mengarahkan seluruh *request* dari pengguna melalui *API Gateway* (menggunakan Nginx) yang merutekan *request* ke *service* yang tepat berdasarkan *URL path*. Saya memutuskan untuk tidak melakukan *fetching* langsung ke masing-masing *service* independen untuk menghindari kerumitan konfigurasi *Cross-Origin Resource Sharing* (CORS) di sisi klien dan menjaga keamanan *endpoint*.

Selain itu, untuk memastikan stabilitas kode antarmuka, saya mengimplementasikan *automated testing* menggunakan *Vitest* untuk *frontend*. Keputusan ini sangat penting agar setiap perubahan UI (terutama fitur esensial seperti fungsi CRUD dan autentikasi) tervalidasi secara otomatis setiap kali ada *push* atau *Pull Request* (PR).

### 2. Tantangan & Kesulitan
Kesulitan terbesar yang saya hadapi adalah mengubah pola pikir penanganan *error* dari aplikasi *monolith* ke *microservices*. Dalam sistem terdistribusi, saya harus mengasumsikan bahwa *backend* bisa saja gagal kapan saja. Hal ini memaksa saya untuk merancang antarmuka yang mendukung *graceful degradation*, di mana aplikasi harus tetap berfungsi secara terbatas ketika ada *service* yang bermasalah, tanpa memberikan layar *blank* kepada *user*.

Tantangan analitis lainnya adalah penanganan *error code* HTTP pada implementasi *retry logic* saat berkomunikasi antar-service atau dari *client* ke *backend*. Saya harus melakukan penyesuaian spesifik pada *interceptor frontend* agar *Error 401 (Unauthorized)* akibat token JWT yang salah, tidak di-*retry*. Hal ini karena secara nalar, token yang salah akan tetap ditolak meski dicoba berkali-kali, sehingga *retry* hanya akan membebani *network* dan *gateway.

### 3. Pelajaran yang Didapat
Proyek ini memberikan pelajaran berharga mengenai pentingnya *Continuous Integration* (CI) dalam menjaga kualitas *software*. Saya belajar bagaimana struktur *pipeline* di *GitHub Actions* bekerja; secara khusus bagaimana *job* `build-docker` diatur agar hanya berjalan apabila kedua pengujian, yaitu `test-backend` dan `test-frontend`, telah dinyatakan lulus. Ini membuktikan bahwa kelalaian sekecil apa pun di *frontend* dapat menghentikan seluruh proses *deployment* tim.

Terakhir, saya menyadari bahwa dalam *microservices*, performa aplikasi di mata *user* sangat bergantung pada *reliability* (keandalan) sistem secara menyeluruh, mulai dari *user*, *gateway*, hingga ke *service database*.