"""Test CRUD item endpoints."""


def test_create_item(client, auth_headers):
    """Test membuat item baru → 201."""
    response = client.post("/items", json={
        "name": "Laptop",
        "description": "Laptop untuk cloud computing",
        "price": 15000000,
        "quantity": 5
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Laptop"
    assert data["price"] == 15000000
    assert "id" in data


def test_create_item_unauthorized(client):
    """Test membuat item tanpa login → 401."""
    response = client.post("/items", json={
        "name": "Laptop",
        "price": 15000000,
        "quantity": 1
    })
    assert response.status_code == 403


def test_get_items(client, auth_headers):
    """Test mengambil daftar items → 200."""
    # Buat 2 items
    client.post("/items", json={
        "name": "Laptop", "price": 15000000, "quantity": 1
    }, headers=auth_headers)
    client.post("/items", json={
        "name": "Mouse", "price": 250000, "quantity": 3
    }, headers=auth_headers)

    response = client.get("/items", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2


def test_get_item_not_found(client, auth_headers):
    """Test mengambil item yang tidak ada → 404."""
    response = client.get("/items/9999", headers=auth_headers)
    assert response.status_code == 404


def test_update_item(client, auth_headers):
    """Test update item → data berubah."""
    # Buat item
    create_resp = client.post("/items", json={
        "name": "Laptop", "price": 15000000, "quantity": 1
    }, headers=auth_headers)
    item_id = create_resp.json()["id"]

    # Update
    response = client.put(f"/items/{item_id}", json={
        "price": 14000000
    }, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["price"] == 14000000


def test_delete_item(client, auth_headers):
    """Test hapus item → 204, lalu GET → 404."""
    # Buat item
    create_resp = client.post("/items", json={
        "name": "Temporary", "price": 100, "quantity": 1
    }, headers=auth_headers)
    item_id = create_resp.json()["id"]

    # Hapus
    response = client.delete(f"/items/{item_id}", headers=auth_headers)
    assert response.status_code == 204

    # Verifikasi sudah tidak ada
    get_resp = client.get(f"/items/{item_id}", headers=auth_headers)
    assert get_resp.status_code == 404


def test_search_items(client, auth_headers):
    """Test search item berdasarkan nama."""
    client.post("/items", json={
        "name": "Laptop Gaming", "price": 20000000, "quantity": 1
    }, headers=auth_headers)
    client.post("/items", json={
        "name": "Mouse Wireless", "price": 350000, "quantity": 2
    }, headers=auth_headers)

    response = client.get("/items?search=laptop", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("laptop" in item["name"].lower() for item in data["items"])


# ==================== EDGE CASES TESTS ====================

def test_create_item_invalid_price_negative(client, auth_headers):
    """Test membuat item dengan harga negatif → 422."""
    response = client.post("/items", json={
        "name": "Laptop",
        "description": "Invalid price",
        "price": -5000,
        "quantity": 1
    }, headers=auth_headers)
    assert response.status_code == 422


def test_create_item_invalid_price_zero(client, auth_headers):
    """Test membuat item dengan harga 0 → 422."""
    response = client.post("/items", json={
        "name": "Free Item",
        "price": 0,
        "quantity": 1
    }, headers=auth_headers)
    assert response.status_code == 422


def test_create_item_missing_name(client, auth_headers):
    """Test membuat item tanpa nama → 422."""
    response = client.post("/items", json={
        "price": 100000,
        "quantity": 1
    }, headers=auth_headers)
    assert response.status_code == 422


def test_create_item_missing_price(client, auth_headers):
    """Test membuat item tanpa harga → 422."""
    response = client.post("/items", json={
        "name": "Item Tanpa Harga",
        "quantity": 1
    }, headers=auth_headers)
    assert response.status_code == 422


def test_create_item_empty_name(client, auth_headers):
    """Test membuat item dengan nama kosong → 422."""
    response = client.post("/items", json={
        "name": "",
        "price": 100000,
        "quantity": 1
    }, headers=auth_headers)
    assert response.status_code == 422


def test_create_item_invalid_quantity(client, auth_headers):
    """Test membuat item dengan quantity negatif → 422."""
    response = client.post("/items", json={
        "name": "Item",
        "price": 100000,
        "quantity": -5
    }, headers=auth_headers)
    assert response.status_code == 422


def test_create_item_zero_quantity_allowed(client, auth_headers):
    """Test membuat item dengan quantity 0 → 201 (allowed)."""
    response = client.post("/items", json={
        "name": "Out of Stock",
        "price": 100000,
        "quantity": 0
    }, headers=auth_headers)
    assert response.status_code == 201
    assert response.json()["quantity"] == 0


def test_create_item_name_too_long(client, auth_headers):
    """Test membuat item dengan nama terlalu panjang → 422."""
    long_name = "A" * 150  # Max length 100
    response = client.post("/items", json={
        "name": long_name,
        "price": 100000,
        "quantity": 1
    }, headers=auth_headers)
    assert response.status_code == 422


def test_create_item_with_category(client, auth_headers):
    """Test membuat item dengan kategori → 201."""
    response = client.post("/items", json={
        "name": "Keyboard",
        "price": 500000,
        "quantity": 2,
        "category": "electronics"
    }, headers=auth_headers)
    assert response.status_code == 201
    assert response.json()["category"] == "electronics"


def test_search_no_results(client, auth_headers):
    """Test search dengan hasil kosong."""
    client.post("/items", json={
        "name": "Laptop", "price": 15000000, "quantity": 1
    }, headers=auth_headers)

    response = client.get("/items?search=NonExistentProduct", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert len(data["items"]) == 0


# ==================== PAGINATION TESTS ====================

def test_pagination_with_limit(client, auth_headers):
    """Test pagination dengan limit parameter."""
    # Buat 5 items
    for i in range(5):
        client.post("/items", json={
            "name": f"Item {i}", "price": 100000 * (i + 1), "quantity": 1
        }, headers=auth_headers)

    # Request dengan limit=2
    response = client.get("/items?limit=2", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5


def test_pagination_with_skip(client, auth_headers):
    """Test pagination dengan skip parameter."""
    # Buat 5 items
    for i in range(5):
        client.post("/items", json={
            "name": f"Item {i}", "price": 100000 * (i + 1), "quantity": 1
        }, headers=auth_headers)

    # Request dengan skip=2
    response = client.get("/items?skip=2", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3  # 5 total - 2 skipped = 3
    assert data["total"] == 5


def test_pagination_skip_and_limit(client, auth_headers):
    """Test pagination dengan skip dan limit bersama → ?skip=0&limit=2."""
    # Buat 5 items
    for i in range(5):
        client.post("/items", json={
            "name": f"Item {i}", "price": 100000 * (i + 1), "quantity": 1
        }, headers=auth_headers)

    # Request dengan skip=0&limit=2 (sebagai requirement)
    response = client.get("/items?skip=0&limit=2", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5


def test_pagination_skip_exceeds_total(client, auth_headers):
    """Test pagination ketika skip melebihi total items."""
    # Buat 3 items
    for i in range(3):
        client.post("/items", json={
            "name": f"Item {i}", "price": 100000 * (i + 1), "quantity": 1
        }, headers=auth_headers)

    # Request dengan skip=5 (melebihi total)
    response = client.get("/items?skip=5&limit=10", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 0
    assert data["total"] == 3


def test_filter_items_by_category(client, auth_headers):
    """Test filter items berdasarkan kategori."""
    # Buat items dengan kategori berbeda
    client.post("/items", json={
        "name": "Laptop", "price": 15000000, "quantity": 1, "category": "electronics"
    }, headers=auth_headers)
    client.post("/items", json={
        "name": "Meja", "price": 500000, "quantity": 2, "category": "furniture"
    }, headers=auth_headers)

    response = client.get("/items?category=electronics", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert all(item["category"] == "electronics" for item in data["items"])


# ==================== STATS ENDPOINT TESTS ====================

def test_get_item_stats(client, auth_headers):
    """Test endpoint /items/stats → mengambil statistik agregat."""
    # Buat beberapa items
    client.post("/items", json={
        "name": "Laptop", "price": 15000000, "quantity": 2
    }, headers=auth_headers)
    client.post("/items", json={
        "name": "Mouse", "price": 250000, "quantity": 5
    }, headers=auth_headers)
    client.post("/items", json={
        "name": "Keyboard", "price": 500000, "quantity": 3
    }, headers=auth_headers)

    response = client.get("/items/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    
    # Verifikasi stats
    assert "total_items" in data
    assert "total_quantity" in data
    assert "total_value" in data
    assert "average_price" in data
    
    assert data["total_items"] == 3
    assert data["total_quantity"] == 10  # 2 + 5 + 3
    assert data["average_price"] > 0


def test_get_item_stats_empty(client, auth_headers):
    """Test /items/stats dengan database kosong."""
    response = client.get("/items/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_items"] == 0
    assert data["total_quantity"] == 0
    assert data["total_value"] == 0


# ==================== ADDITIONAL COVERAGE ====================

def test_update_item_partial(client, auth_headers):
    """Test update item dengan hanya beberapa field."""
    # Buat item
    create_resp = client.post("/items", json={
        "name": "Original Name",
        "description": "Original Description",
        "price": 100000,
        "quantity": 5,
        "category": "electronics"
    }, headers=auth_headers)
    item_id = create_resp.json()["id"]

    # Update hanya nama
    response = client.put(f"/items/{item_id}", json={
        "name": "Updated Name"
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["description"] == "Original Description"  # Tidak berubah
    assert data["price"] == 100000  # Tidak berubah


def test_update_item_nonexistent(client, auth_headers):
    """Test update item yang tidak ada → 404."""
    response = client.put("/items/9999", json={
        "name": "Updated"
    }, headers=auth_headers)
    assert response.status_code == 404


def test_create_item_with_very_high_price(client, auth_headers):
    """Test membuat item dengan harga sangat tinggi."""
    response = client.post("/items", json={
        "name": "Diamond Ring",
        "price": 999999999.99,
        "quantity": 1
    }, headers=auth_headers)
    assert response.status_code == 201
    assert response.json()["price"] == 999999999.99