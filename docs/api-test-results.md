# Hasil Test API #

**POST/Items**

![Contoh Gambar](api_tes/post.jpeg)

Gambar diatas menunjukan hasil penambahan items, yaitu
- name items : "Laptop"
- deskription : "Laptop untuk cloud computing"
- price/harga : "15000000
- quantity/stok : 5

---

**GET/Items**

![Contoh Gambar](api_tes/get.jpeg)

Gambar diatas menunjukan Pengambilan data dilakukan terhadap item yang telah diinputkan. Tampilan tersebut menunjukkan bahwa item-item yang telah didaftarkan berhasil tersimpan di dalam database, dan data tersebut akan ditampilkan saat query `GET` dijalankan.

---

**GET/Items/4 - item laptop**

![Contoh Gambar](api_tes/get4.jpeg)

Endpoint GET /items/4 digunakan untuk menampilkan data item berdasarkan ID tertentu. Pada tampilan di atas, sistem menjalankan perintah untuk mengambil data item dengan ID ‘4’, sehingga data yang ditampilkan adalah laptop yang memiliki ID tersebut dari database.

---

**PUT/Items/4 - Update harga laptop**

![Contoh Gambar](api_tes/put.jpeg)
Gambar diatas menunjukan proses untuk memperbarui data item.  Data yang diperbarui yaitu harga laptop yang awalnya '15000000' menjadi '14000000'

---

**GET/Items/4 - update harga laptop**

![Contoh Gambar](api_tes/getnewprice.jpeg)

Gambar diatas menunjukan, database berhasil menyimpan hasil update harga laptop menjadi '14000000' 

---

**GET/Items/Search=laptop**

![Contoh Gambar](api_tes/srchitem.jpeg)

Gambar diatas menunjukan proses yang dilakukan untuk menampilkan data harga laptop yang telah diupdate.

---

**DELET/Items/4**

![Contoh Gambar](api_tes/dltitem.jpeg)

Gambar diatas menunjukan proses penghapusan items laptop dengan id '4' dengan pernitah 'DELET'

---

**GET/items/4 - Response 404**

![Contoh Gambar](api_tes/404.jpeg)

Gambar diatas menunjukan kode status '404' yang menandakan bahwa data item yang telah dihapus sudah tidak ada lagi didalam database.