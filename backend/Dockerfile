<<<<<<< HEAD
FROM python:3.10-slim
=======
# 1. Gunakan base image Python yang ringan
FROM python:3.12-slim

# 2. Set working directory di dalam container
>>>>>>> 7c73b498d7c8d7be198eb2f8cb8b908d0e5dd044
WORKDIR /app

# 3. Copy file requirements terlebih dahulu (untuk efisiensi cache)
COPY requirements.txt .

# 4. Install dependencies backend
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy seluruh sisa kode aplikasi ke dalam container
COPY . .
<<<<<<< HEAD
CMD ["python", "main.py"]
=======

# 6. == OPTIMASI TUGAS 5: Tambahkan non-root user ==
RUN useradd -m appuser
USER appuser
# ====================================================

# 7. Buka port 8000 untuk FastAPI
EXPOSE 8000

# 8. Command untuk menjalankan server saat container menyala
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
>>>>>>> 7c73b498d7c8d7be198eb2f8cb8b908d0e5dd044
