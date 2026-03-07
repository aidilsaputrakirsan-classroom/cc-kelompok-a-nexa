#!/bin/bash

echo "=== Memulai instalasi dependencies Backend ==="
cd backend || exit
pip install -r requirements.txt
echo "Backend selesai!"