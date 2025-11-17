# TestClient simulates HTTP requests to your FastAPI app in memory without starting a server.
# It makes testing fast and simple while still validating the full request/response cycle.
# This is the official FastAPI testing method.
import os
import json
import uuid
import secrets
import string
import bcrypt
import pytest
from fastapi.testclient import TestClient
from backend.main import app

TEST_DB_PATH_USERS = "backend/data/users.json"
TEST_DB_PATH_PRODUCTS = "backend/data/products_test.json"

# Sample test products to populate for read/search/sort tests
TEST_PRODUCTS = [
    {
        "product_id": "B07JW9H4J1",
        "product_name": "Wayona Nylon Braided USB to Lightning Cable",
        "category": "Electronics|Cables",
        "discounted_price": 299.0,
        "actual_price": 599.0,
        "discount_percentage": 50.0,
        "about_product": "Fast charging cable",
        "img_link": "https://example.com/cable.jpg",
        "product_link": "https://example.com/cable",
        "rating": 4.5,
        "rating_count": 24269
    },
    {
        "product_id": "B08KT5LMRX",
        "product_name": "Samsung 55-inch 4K Smart TV",
        "category": "Electronics|TVs",
        "discounted_price": 35999.0,
        "actual_price": 54999.0,
        "discount_percentage": 34.5,
        "about_product": "4K Smart TV with HDR support",
        "img_link": "https://example.com/tv.jpg",
        "product_link": "https://example.com/tv",
        "rating": 4.8,
        "rating_count": 43994
    },
    {
        "product_id": "B09NX5K7QP",
        "product_name": "Dell XPS 13 Laptop",
        "category": "Electronics|Computers",
        "discounted_price": 89999.0,
        "actual_price": 119999.0,
        "discount_percentage": 25.0,
        "about_product": "Ultra-portable laptop",
        "img_link": "https://example.com/laptop.jpg",
        "product_link": "https://example.com/laptop",
        "rating": 4.6,
        "rating_count": 7928
    },
    {
        "product_id": "B07QR3N8VX",
        "product_name": "iPhone 13 Pro",
        "category": "Electronics|Phones",
        "discounted_price": 99999.0,
        "actual_price": 139999.0,
        "discount_percentage": 28.6,
        "about_product": "Latest iPhone with Pro camera",
        "img_link": "https://example.com/iphone.jpg",
        "product_link": "https://example.com/iphone",
        "rating": 4.7,
        "rating_count": 94363
    },
    {
        "product_id": "B08F5N7KJX",
        "product_name": "Wireless Mouse",
        "category": "Electronics|Accessories",
        "discounted_price": 1499.0,
        "actual_price": 2999.0,
        "discount_percentage": 50.0,
        "about_product": "Ergonomic wireless mouse",
        "img_link": "https://example.com/mouse.jpg",
        "product_link": "https://example.com/mouse",
        "rating": 4.2,
        "rating_count": 16905
    }
]


@pytest.fixture(scope="function", autouse=True)
def prepare_test_env():
    """Create fresh test files, populate with sample data, and set env vars."""
    os.makedirs(os.path.dirname(TEST_DB_PATH_USERS), exist_ok=True)
    os.makedirs(os.path.dirname(TEST_DB_PATH_PRODUCTS), exist_ok=True)

    # Create empty users file
    with open(TEST_DB_PATH_USERS, "w", encoding="utf-8") as f:
        json.dump([], f)

    # Populate products file with test data (so read/search/sort tests have data)
    with open(TEST_DB_PATH_PRODUCTS, "w", encoding="utf-8") as f:
        json.dump(TEST_PRODUCTS, f, indent=2)

    # Set env vars so services use test files
    os.environ["USERS_FILE"] = "users.json"
    os.environ["PRODUCTS_FILE"] = "products_test.json"

    yield

    os.environ.pop("USERS_FILE", None)
    os.environ.pop("PRODUCTS_FILE", None)


client = TestClient(app)


def _gen_token(n=28):
    """Generate a random 28-character token."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(n))


def _hash(password: str) -> str:
    """Hash a password with bcrypt."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _create_admin_user():
    """Helper: create an admin user and return (token, user_dict)."""
    admin_token = _gen_token()
    admin = {
        "user_id": str(uuid.uuid4()),
        "name": "Admin",
        "email": "admin@example.com",
        "password_hash": _hash("AdminPass1"),
        "user_token": admin_token,
        "role": "admin"
    }
    with open(TEST_DB_PATH_USERS, "w", encoding="utf-8") as f:
        json.dump([admin], f, indent=2)
    return admin_token, admin


def _create_customer_user():
    """Helper: create a customer user and return (token, user_dict)."""
    customer_token = _gen_token()
    customer = {
        "user_id": str(uuid.uuid4()),
        "name": "Customer",
        "email": "customer@example.com",
        "password_hash": _hash("CustPass1"),
        "user_token": customer_token,
        "role": "customer"
    }
    # Append to existing users
    try:
        with open(TEST_DB_PATH_USERS, "r", encoding="utf-8") as f:
            users = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        users = []
    users.append(customer)
    with open(TEST_DB_PATH_USERS, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)
    return customer_token, customer




def test_get_all_products():
    """ GET /products/ returns all products from database"""
    response = client.get("/products/")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) > 0  # should have products in the list


def test_get_product_by_id_success():
    """GET /products/{id} retrieves specific product"""
    response = client.get("/products/")
    products = response.json()
    valid_id = products[0]["product_id"]
    
    response = client.get(f"/products/{valid_id}")
    assert response.status_code == 200
    product = response.json()
    assert product["product_id"] == valid_id
    assert "product_name" in product
    assert "discounted_price" in product


def test_get_product_by_id_not_found():
    """ GET /products/{id} returns 404 for invalid ID"""
    response = client.get("/products/INVALID_ID_12345")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_search_products_with_results():
    """ GET /products/search/{keyword} filters by keyword"""
    response = client.get("/products/search/laptop")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) > 0
    for product in products:
        assert "laptop" in product["product_name"].lower() or "laptop" in product["category"].lower()


def test_search_products_no_results():
    """: Search with no matches returns empty list"""
    response = client.get("/products/search/xyznonexistentkeyword123")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) == 0


def test_sort_products_by_price_asc():
    """ GET /products/?sort=price_asc sorts ascending"""
    response = client.get("/products/?sort=price_asc")
    assert response.status_code == 200
    products = response.json()
    prices = [p["discounted_price"] for p in products]
    assert prices == sorted(prices)


def test_sort_products_by_price_desc():
    """ GET /products/?sort=price_desc sorts descending"""
    response = client.get("/products/?sort=price_desc")
    assert response.status_code == 200
    products = response.json()
    prices = [p["discounted_price"] for p in products]
    assert prices == sorted(prices, reverse=True)

def test_sort_products_by_rating_desc():
    """GET /products/?sort=rating_desc sorts by rating"""
    response = client.get("/products/?sort=rating_desc")
    assert response.status_code == 200
    products = response.json()
    ratings = [p["rating"] for p in products]
    assert ratings == sorted(ratings, reverse=True)


def test_sort_search_results():
    """Combined search and sort works correctly"""
    response = client.get("/products/search/phone?sort=price_asc")
    assert response.status_code == 200
    products = response.json()
    if len(products) > 1:
        prices = [p["discounted_price"] for p in products]
        assert prices == sorted(prices)


def test_product_has_required_fields():
    """Product response includes all required fields"""
    response = client.get("/products/")
    products = response.json()
    product = products[0]
    
    required_fields = [
        "product_id", "product_name", "category",
        "discounted_price", "actual_price", "discount_percentage",
        "rating", "about_product", "img_link", "product_link"
    ]
    
    for field in required_fields:
        assert field in product, f"Missing required field: {field}"


def test_numeric_types():
    """ Numeric fields are numbers not strings"""
    response = client.get("/products/")
    products = response.json()
    product = products[0]
    
    assert isinstance(product["discounted_price"], (int, float))
    assert isinstance(product["actual_price"], (int, float))
    assert isinstance(product["discount_percentage"], (int, float))
    assert isinstance(product["rating"], (int, float))

def test_create_product_success():
    """Admin can create valid product (full request cycle)"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/products", headers=headers, json={
        "product_name": "New Test Product",
        "category": "Electronics|Test",
        "discounted_price": 5999.0,
        "actual_price": 9999.0,
        "discount_percentage": 40.0,
        "about_product": "Test product description",
        "img_link": "https://example.com/img.jpg",
        "product_link": "https://example.com/prod",
        "rating": 4.5,
        "rating_count": 100
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["product_name"] == "New Test Product"
    assert body["category"] == "Electronics|Test"
    assert body["discounted_price"] == 5999.0
    assert "product_id" in body
    assert len(body["product_id"]) == 10  # ASIN format


def test_create_product_default_rating():
    """ Product created without rating defaults to 0.0"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/products", headers=headers, json={
        "product_name": "Mouse",
        "category": "Accessories",
        "discounted_price": 299.0,
        "actual_price": 599.0,
        "discount_percentage": 50.0,
        "about_product": "Wireless mouse",
        "img_link": "https://example.com/mouse.jpg",
        "product_link": "https://example.com/mouse"
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["rating"] == 0.0


def test_create_product_invalid_discounted_price():
    """Validation rejects discounted_price <= 0"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/products", headers=headers, json={
        "product_name": "Bad Product",
        "category": "Test",
        "discounted_price": -100.0,
        "actual_price": 500.0,
        "discount_percentage": 50.0,
        "about_product": "Invalid price",
        "img_link": "https://example.com/img.jpg",
        "product_link": "https://example.com/prod"
    })
    assert resp.status_code == 400
    assert "discounted_price" in resp.json()["detail"].lower()


def test_create_product_invalid_actual_price():
    """Validation rejects actual_price <= 0"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/products", headers=headers, json={
        "product_name": "Bad Product",
        "category": "Test",
        "discounted_price": 100.0,
        "actual_price": 0,
        "discount_percentage": 50.0,
        "about_product": "Invalid price",
        "img_link": "https://example.com/img.jpg",
        "product_link": "https://example.com/prod"
    })
    assert resp.status_code == 400
    assert "actual_price" in resp.json()["detail"].lower()


def test_create_product_invalid_discount_percentage():
    """Validation rejects discount_percentage > 100"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/products", headers=headers, json={
        "product_name": "Bad Product",
        "category": "Test",
        "discounted_price": 100.0,
        "actual_price": 500.0,
        "discount_percentage": 150.0,
        "about_product": "Invalid discount",
        "img_link": "https://example.com/img.jpg",
        "product_link": "https://example.com/prod"
    })
    assert resp.status_code == 400
    assert "discount percentage" in resp.json()["detail"].lower()


def test_create_product_empty_product_name():
    """Validation rejects empty product_name"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/products", headers=headers, json={
        "product_name": "",
        "category": "Test",
        "discounted_price": 100.0,
        "actual_price": 500.0,
        "discount_percentage": 50.0,
        "about_product": "Description",
        "img_link": "https://example.com/img.jpg",
        "product_link": "https://example.com/prod"
    })
    assert resp.status_code == 400
    assert "name cannot be empty" in resp.json()["detail"].lower()


def test_create_product_empty_category():
    """Validation rejects empty category"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/products", headers=headers, json={
        "product_name": "Product",
        "category": "",
        "discounted_price": 100.0,
        "actual_price": 500.0,
        "discount_percentage": 50.0,
        "about_product": "Description",
        "img_link": "https://example.com/img.jpg",
        "product_link": "https://example.com/prod"
    })
    assert resp.status_code == 400
    assert "category cannot be empty" in resp.json()["detail"].lower()


def test_create_product_empty_description():
    """Validation rejects empty about_product"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/products", headers=headers, json={
        "product_name": "Product",
        "category": "Test",
        "discounted_price": 100.0,
        "actual_price": 500.0,
        "discount_percentage": 50.0,
        "about_product": "",
        "img_link": "https://example.com/img.jpg",
        "product_link": "https://example.com/prod"
    })
    assert resp.status_code == 400
    assert "description cannot be empty" in resp.json()["detail"].lower()


def test_create_product_empty_img_link():
    """Validation rejects empty img_link"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/products", headers=headers, json={
        "product_name": "Product",
        "category": "Test",
        "discounted_price": 100.0,
        "actual_price": 500.0,
        "discount_percentage": 50.0,
        "about_product": "Description",
        "img_link": "",
        "product_link": "https://example.com/prod"
    })
    assert resp.status_code == 400
    assert "image link cannot be empty" in resp.json()["detail"].lower()


def test_create_product_empty_product_link():
    """ Validation rejects empty product_link"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/products", headers=headers, json={
        "product_name": "Product",
        "category": "Test",
        "discounted_price": 100.0,
        "actual_price": 500.0,
        "discount_percentage": 50.0,
        "about_product": "Description",
        "img_link": "https://example.com/img.jpg",
        "product_link": ""
    })
    assert resp.status_code == 400
    assert "product link cannot be empty" in resp.json()["detail"].lower()


def test_create_product_invalid_rating():
    """ Validation rejects rating > 5"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/products", headers=headers, json={
        "product_name": "Product",
        "category": "Test",
        "discounted_price": 100.0,
        "actual_price": 500.0,
        "discount_percentage": 50.0,
        "about_product": "Description",
        "img_link": "https://example.com/img.jpg",
        "product_link": "https://example.com/prod",
        "rating": 6.0
    })
    assert resp.status_code == 400
    assert "rating must be between 0 and 5" in resp.json()["detail"].lower()


def test_create_product_forbidden_for_customer():
    """ Authorization prevents non-admin from creating products"""
    token, _ = _create_customer_user()
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/products", headers=headers, json={
        "product_name": "Unauthorized Product",
        "category": "Test",
        "discounted_price": 100.0,
        "actual_price": 500.0,
        "discount_percentage": 50.0,
        "about_product": "Should fail",
        "img_link": "https://example.com/img.jpg",
        "product_link": "https://example.com/prod"
    })
    assert resp.status_code == 403
    assert "admin" in resp.json()["detail"].lower()


def test_create_product_no_auth():
    """ Authentication required to create products"""
    resp = client.post("/products", json={
        "product_name": "No Auth Product",
        "category": "Test",
        "discounted_price": 100.0,
        "actual_price": 500.0,
        "discount_percentage": 50.0,
        "about_product": "No token",
        "img_link": "https://example.com/img.jpg",
        "product_link": "https://example.com/prod"
    })
    assert resp.status_code == 401


def test_create_product_persists_to_file():
    """ Created product is persisted to products_test.json"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/products", headers=headers, json={
        "product_name": "Persistent Product",
        "category": "Electronics",
        "discounted_price": 5999.0,
        "actual_price": 9999.0,
        "discount_percentage": 40.0,
        "about_product": "Should be saved",
        "img_link": "https://example.com/img.jpg",
        "product_link": "https://example.com/prod",
        "rating": 4.8
    })
    assert resp.status_code == 200
    product_id = resp.json()["product_id"]

    # Verify file contains the product (file has 5 seed + 1 new = 6 total)
    with open(TEST_DB_PATH_PRODUCTS, "r", encoding="utf-8") as f:
        products = json.load(f)
    
    # Should have original 5 test products + 1 new one
    assert len(products) == 6
    
    # Find our new product in the list
    created_product = next((p for p in products if p["product_id"] == product_id), None)
    assert created_product is not None
    assert created_product["product_name"] == "Persistent Product"
    assert created_product["category"] == "Electronics"
