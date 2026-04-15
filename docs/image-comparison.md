# Python:3.12 vs Python:3.12-Slim vs Python:3.12-Alpine

## python:3.12
<img src = "py-ver/python 3.12.png">

Varian standar ini memiliki ukuran yang paling besar. Ukurannya sangat membengkak karena image ini membawa sistem operasi bawaan yang utuh beserta berbagai macam tools tambahan. Varian ini seringkali berlebihan jika hanya digunakan untuk menjalankan aplikasi sederhana.


## python:3.12 slim
<img src = "py-ver/python 3.12 slim.png">
Varian slim tampil jauh lebih efisien dan memakan ruang penyimpanan yang jauh lebih sedikit. Penurunan ukuran yang drastis ini didapat dengan cara membuang package dan berkas sistem operasi yang tidak esensial. Varian ini sangat ideal dan aman digunakan sebagai standar karena ringan namun tetap stabil.

## python:3.12 alpine
<img src = "py-ver/python 3.12 alpine.png">
Varian alpine adalah image yang paling ringan dan berukuran paling kecil dibandingkan yang lain. Hal ini bisa dicapai karena ia dibangun menggunakan sistem operasi Alpine Linux yang sangat minimalis. Varian ini sangat menghemat penyimpanan, meskipun terkadang membutuhkan pengaturan tambahan jika aplikasi menggunakan library yang rumit.
