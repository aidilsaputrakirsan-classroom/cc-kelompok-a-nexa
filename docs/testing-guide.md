# Testing Guide — Cloud Team Studyfy
Panduan untuk menjalankan, membaca, dan menulis testing pada project **Studyfy**.

---

## 🐍 Backend Testing (pytest)

### Prasyarat
- Python 3.10+
- Dependencies testing sudah terinstall:
  ```
  pytest==8.3.4
  pytest-cov==6.0.0
  httpx==0.28.1
  ```

### Struktur Folder Test
```
backend/
├── pytest.ini              # Konfigurasi pytest
├── tests/
│   ├── __init__.py         # Wajib agar Python recognize folder
│   ├── conftest.py         # Fixtures & konfigurasi shared
│   ├── test_auth.py        # Test autentikasi
│   ├── test_items.py       # Test CRUD item
│   └── test_health.py      # Test health check
```

### Menjalankan Semua Test
```bash
cd backend
pytest
```

Output:
```
========================= test session starts ==========================
tests/test_auth.py::test_register_success PASSED
tests/test_auth.py::test_register_duplicate_email PASSED
tests/test_auth.py::test_login_success PASSED
tests/test_auth.py::test_login_wrong_password PASSED
tests/test_items.py::test_create_item PASSED
tests/test_items.py::test_create_item_unauthorized PASSED
tests/test_items.py::test_get_items PASSED
tests/test_items.py::test_get_item_not_found PASSED
tests/test_items.py::test_update_item PASSED
tests/test_items.py::test_delete_item PASSED
tests/test_items.py::test_search_items PASSED
tests/test_health.py::test_health_check PASSED
========================= 12 passed in 2.34s ==========================
```

### Melihat Test Coverage
```bash
cd backend
pytest --cov=. --cov-report=term-missing
```

Output:
```
Name           Stmts   Miss  Cover   Missing
--------------------------------------------
auth.py           30      2    93%   45-46
crud.py           50      8    84%   20-24, 55-57
database.py       10      0   100%
main.py           90     20    78%   120-130, 200-210
models.py         15      0   100%
schemas.py        25      0   100%
--------------------------------------------
TOTAL            220     30    86%
```

### Menjalankan Test Spesifik
```bash
# Test satu file
pytest tests/test_auth.py

# Test satu function
pytest tests/test_auth.py::test_register_success

# Test dengan pattern nama
pytest -k "item"

# Test verbose (lebih detail)
pytest -v

# Test tanpa coverage
pytest --no-cov
```

---

## ⚛️ Frontend Testing (Vitest)

### Prasyarat
- Node.js 18+
- Dependencies testing sudah terinstall:
  ```bash
  npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
  ```

### Struktur Folder Test
```
frontend/
├── vite.config.js               # Konfigurasi Vitest (di dalam file)
├── src/
│   ├── components/
│   │   └── __tests__/
│   │       ├── Header.test.jsx      # Test komponen Header
│   │       └── ItemCard.test.jsx    # Test komponen ItemCard
│   └── test/
│       ├── setup.js                 # Setup testing library
│       └── api.test.js              # Test API service
```

### Menjalankan Semua Test
```bash
cd frontend
npm test
```

Output:
```
 ✓ src/components/__tests__/Header.test.jsx (2 tests)
 ✓ src/components/__tests__/ItemCard.test.jsx (3 tests)
 ✓ src/test/api.test.js (2 tests)

 Test Files  3 passed (3)
      Tests  7 passed (7)
```

### Mode Watch (auto re-run saat file berubah)
```bash
cd frontend
npm run test:watch
```

### Test Coverage
```bash
cd frontend
npm run test:coverage
```

---

## 📖 Cara Membaca CI Log

Saat CI pipeline berjalan di GitHub Actions, Anda mungkin perlu membaca log untuk debugging.

### Akses Log CI

1. Buka Pull Request di GitHub
2. Scroll ke bagian bawah halaman PR
3. Cari section **"Checks"** — ini menampilkan setiap job di pipeline
4. Jika ada job gagal (❌), klik **"Details"** di samping nama job

### Memahami Tampilan Log

```yaml
Run pytest --cov=. --cov-report=term-missing
============================= test session starts =============================
platform linux -- Python 3.12.0
rootdir: /home/runner/work/repo/repo/backend
configfile: pytest.ini
collected 12 items

tests/test_auth.py ....                                                  [ 33%]
tests/test_items.py .......                                              [ 91%]
tests/test_health.py F                                                   [100%]

=================================== FAILURES ===================================
_________________________________ test_health _________________________________

    def test_health():
        response = client.get("/health")
>       assert response.status_code == 999
E       assert 200 == 999
```

**Cara membaca:**
- `tests/test_health.py F` — test dengan huruf `F` berarti FAILED (`.` = PASSED)
- Bagian `FAILURES` menunjukkan detail error
- `assert 200 == 999` — yang expected 999, tapi actual 200
- `>` menunjuk ke baris yang gagal beserta nilai actual vs expected

### Status Icons di Log CI

| Icon | Arti |
|------|------|
| `.` | Test PASSED |
| `F` | Test FAILED |
| `s` | Test skipped |
| `x` | Test expected failure |
| `E` | Error di test (bukan assertion failure) |

### Common CI Error Messages

| Error | Arti | Solusi |
|-------|------|--------|
| `ModuleNotFoundError: No module named 'xxx'` | Module tidak terdaftar di requirements.txt | Tambahkan module ke requirements.txt |
| `AssertionError: assert ...` | Nilai tidak sesuai expected | Cek kode atau update test assertion |
| `npm ERR! Missing: xxx@x.x.x` | package-lock.json tidak sinkron | Jalankan `npm install`, commit package-lock.json |
| `Error: Process completed with exit code 1` | Command gagal (generic) | Baca log di atas baris error untuk detail |
| `docker build: COPY failed` | Path file tidak ditemukan di Dockerfile | Periksa path yang di-COPY di Dockerfile |

---

## 🔍 Cara Debug Test Failure

### Langkah Debug

**1. Reproduksi failure secara lokal**
```bash
cd backend
pytest tests/test_items.py::test_nama_function -v
```

**2. Baca error message dengan teliti**
```
FAILED tests/test_items.py::test_create_item - assert 401 == 201
```
Ini berarti: expected status code 201 (Created), tapi actual 401 (Unauthorized). Artinya auth headers tidak terkirim dengan benar.

**3. Tambahkan print untuk debugging**
```python
def test_debug(client):
    response = client.get("/health")
    print(f"Status code: {response.status_code}")
    print(f"Response body: {response.json()}")
    assert response.status_code == 200
```

Jalankan dengan flag `-s` untuk melihat output print:
```bash
pytest -s -k "debug"
```

**4. Test dengan flag verbose**
```bash
pytest -v --tb=long
```
- `-v` : verbose (tampilkan nama test lengkap)
- `--tb=long` : full traceback (bukan short)

### Checklist Debug Cepat

| Jika error... | Cek... |
|---------------|--------|
| `401 Unauthorized` | Auth headers tidak dikirim / token expired |
| `404 Not Found` | ID tidak valid / endpoint salah |
| `422 Validation Error` | Request body tidak sesuai schema |
| `500 Internal Server Error` | Ada exception di kode backend |
| `ModuleNotFoundError` | Belum `pip install` atau module tidak ada di requirements |

---

## ✏️ Cara Menambah Test Baru

### Backend (pytest)

**1. Buat file test baru**

File: `backend/tests/test_users.py`
```python
"""Test user management endpoints."""


def test_list_users_unauthorized(client):
    """Test list users tanpa auth → 401."""
    response = client.get("/users")
    assert response.status_code == 401


def test_get_user_profile(client, auth_headers):
    """Test get profile user sendiri → 200."""
    response = client.get("/users/profile/1", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert "name" in data
```

**2. Aturan penamaan**
- Nama file: `test_<nama>.py` (wajib prefix `test_`)
- Nama function: `test_<deskripsi>` (wajib prefix `test_`)
- Nama function harus deskriptif dalam bahasa Inggris

**3. Gunakan fixtures dari conftest.py**
- `client` — test client FastAPI dengan database SQLite in-memory
- `auth_headers` — headers dengan JWT token (register + login otomatis)
- `db_session` — session database untuk test yang perlu akses langsung ke DB

### Frontend (Vitest)

**1. Buat file test baru**

File: `frontend/src/components/__tests__/SearchBar.test.jsx`
```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SearchBar from '../SearchBar'

describe('SearchBar Component', () => {
  it('menampilkan input search', () => {
    render(<SearchBar onSearch={() => {}} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('memanggil onSearch saat tombol diklik', () => {
    const handleSearch = vi.fn()
    render(<SearchBar onSearch={handleSearch} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'laptop' } })
    fireEvent.submit(input.closest('form'))
    expect(handleSearch).toHaveBeenCalledWith('laptop')
  })
})
```

**2. Aturan penamaan**
- Nama file: `<ComponentName>.test.jsx` (gunakan `.test.jsx`, bukan `.spec.jsx`)
- Letakkan di folder `__tests__/` dalam direktori komponen yang sama
- Gunakan `describe` untuk grouping test dalam satu komponen
- Gunakan `it` untuk deskripsi test individual

**3. Aturan import**
```javascript
// Wajib
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Jika perlu mock
import { vi } from 'vitest'       // vi.fn() untuk mock function
global.fetch = vi.fn()            // mock fetch API
```

### Checklist Menambah Test

- [ ] Nama file diawali `test_` (backend) atau `.test.jsx` (frontend)
- [ ] Nama function test deskriptif (english, snake_case / camelCase)
- [ ] Satu function test hanya menguji satu hal spesifik
- [ ] Ada assertion (`assert` / `expect`) — tanpa assertion test tidak berguna
- [ ] Test bisa dijalankan secara independen (tidak tergantung test lain)
- [ ] Jalankan test lokal sebelum push untuk memastikan PASS

---

*Terakhir diupdate: 2026-05-03 | Oleh: Lead QA & Docs Studyfy
