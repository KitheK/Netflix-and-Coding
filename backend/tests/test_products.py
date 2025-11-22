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
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.product_service import ProductService
from backend.models.product_model import Product

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




# ============================================================================
# UNIT TESTS - Testing ProductService with mocked dependencies
# ============================================================================

class TestProductServiceUnit:
    """UNIT TESTS: Test ProductService business logic with mocked repository"""
    
    def setup_method(self):
        """Set up test service with mocked repository"""
        self.mock_repository = Mock()
        self.service = ProductService()
        self.service.repository = self.mock_repository
    
    @pytest.mark.unit
    def test_search_products_success(self):
        """UNIT TEST: Search products filters correctly"""
        # Mock repository data
        mock_products = [
            {"product_id": "1", "product_name": "Laptop Computer", "category": "Electronics",
             "discounted_price": 999.0, "actual_price": 1299.0, "discount_percentage": 23.0,
             "about_product": "Laptop", "img_link": "https://example.com/img.jpg",
             "product_link": "https://example.com/product", "rating": 4.5, "rating_count": 100},
            {"product_id": "2", "product_name": "Mouse Pad", "category": "Accessories",
             "discounted_price": 10.0, "actual_price": 15.0, "discount_percentage": 33.0,
             "about_product": "Mouse pad", "img_link": "https://example.com/img.jpg",
             "product_link": "https://example.com/product", "rating": 4.0, "rating_count": 50},
            {"product_id": "3", "product_name": "Gaming Laptop", "category": "Electronics",
             "discounted_price": 1499.0, "actual_price": 1999.0, "discount_percentage": 25.0,
             "about_product": "Gaming laptop", "img_link": "https://example.com/img.jpg",
             "product_link": "https://example.com/product", "rating": 4.8, "rating_count": 200},
        ]
        self.mock_repository.get_all.return_value = mock_products
        
        # Search for "laptop" using get_product_by_keyword
        results = self.service.get_product_by_keyword("laptop")
        
        # Should find 2 products
        assert len(results) == 2
        assert all("laptop" in p.product_name.lower() for p in results)
    
    @pytest.mark.unit
    def test_sort_products_by_price(self):
        """UNIT TEST: Sort products by price works correctly"""
        from backend.models.product_model import Product
        
        # Create Product objects
        products = [
            Product(product_id="1", product_name="Product 1", category="Test",
                   discounted_price=100.0, actual_price=150.0, discount_percentage=33.0,
                   about_product="Test", img_link="https://example.com/img.jpg",
                   product_link="https://example.com/product", rating=4.0, rating_count=10),
            Product(product_id="2", product_name="Product 2", category="Test",
                   discounted_price=50.0, actual_price=75.0, discount_percentage=33.0,
                   about_product="Test", img_link="https://example.com/img.jpg",
                   product_link="https://example.com/product", rating=4.0, rating_count=10),
            Product(product_id="3", product_name="Product 3", category="Test",
                   discounted_price=200.0, actual_price=250.0, discount_percentage=20.0,
                   about_product="Test", img_link="https://example.com/img.jpg",
                   product_link="https://example.com/product", rating=4.0, rating_count=10),
        ]
        
        # Sort ascending using sort_products method
        sorted_products = self.service.sort_products(products, "price_asc")
        prices = [p.discounted_price for p in sorted_products]
        assert prices == sorted(prices)
        
        # Sort descending
        sorted_products_desc = self.service.sort_products(products, "price_desc")
        prices_desc = [p.discounted_price for p in sorted_products_desc]
        assert prices_desc == sorted(prices, reverse=True)


# ============================================================================
# INTEGRATION TESTS - Testing full API endpoints with TestClient
# ============================================================================

@pytest.mark.integration
def test_get_all_products():
    """INTEGRATION TEST: GET /products/ returns all products from database"""
    response = client.get("/products/")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) > 0  # should have products in the list


@pytest.mark.integration
def test_get_product_by_id_success():
    """INTEGRATION TEST: GET /products/{id} retrieves specific product"""
    response = client.get("/products/")
    products = response.json()
    valid_id = products[0]["product_id"]
    
    response = client.get(f"/products/{valid_id}")
    assert response.status_code == 200
    product = response.json()
    assert product["product_id"] == valid_id
    assert "product_name" in product
    assert "discounted_price" in product


@pytest.mark.integration
def test_get_product_by_id_not_found():
    """INTEGRATION TEST: GET /products/{id} returns 404 for invalid ID"""
    response = client.get("/products/INVALID_ID_12345")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.integration
def test_search_products_with_results():
    """ GET /products/search/{keyword} filters by keyword"""
    response = client.get("/products/search/laptop")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) > 0
    for product in products:
        assert "laptop" in product["product_name"].lower() or "laptop" in product["category"].lower()


@pytest.mark.integration
def test_search_products_no_results():
    """: Search with no matches returns empty list"""
    response = client.get("/products/search/xyznonexistentkeyword123")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) == 0


@pytest.mark.integration
def test_sort_products_by_price_asc():
    """ GET /products/?sort=price_asc sorts ascending"""
    response = client.get("/products/?sort=price_asc")
    assert response.status_code == 200
    products = response.json()
    prices = [p["discounted_price"] for p in products]
    assert prices == sorted(prices)


@pytest.mark.integration
def test_sort_products_by_price_desc():
    """ GET /products/?sort=price_desc sorts descending"""
    response = client.get("/products/?sort=price_desc")
    assert response.status_code == 200
    products = response.json()
    prices = [p["discounted_price"] for p in products]
    assert prices == sorted(prices, reverse=True)

@pytest.mark.integration
def test_sort_products_by_rating_desc():
    """GET /products/?sort=rating_desc sorts by rating"""
    response = client.get("/products/?sort=rating_desc")
    assert response.status_code == 200
    products = response.json()
    ratings = [p["rating"] for p in products]
    assert ratings == sorted(ratings, reverse=True)


@pytest.mark.integration
def test_sort_search_results():
    """Combined search and sort works correctly"""
    response = client.get("/products/search/phone?sort=price_asc")
    assert response.status_code == 200
    products = response.json()
    if len(products) > 1:
        prices = [p["discounted_price"] for p in products]
        assert prices == sorted(prices)


@pytest.mark.integration
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


@pytest.mark.integration
def test_numeric_types():
    """ Numeric fields are numbers not strings"""
    response = client.get("/products/")
    products = response.json()
    product = products[0]
    
    assert isinstance(product["discounted_price"], (int, float))
    assert isinstance(product["actual_price"], (int, float))
    assert isinstance(product["discount_percentage"], (int, float))
    assert isinstance(product["rating"], (int, float))

@pytest.mark.integration
def test_create_product_success():
    """INTEGRATION TEST: Admin can create valid product (full request cycle)"""
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


@pytest.mark.integration
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


@pytest.mark.integration
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


@pytest.mark.integration
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


@pytest.mark.integration
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


@pytest.mark.integration
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


@pytest.mark.integration
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


@pytest.mark.integration
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


@pytest.mark.integration
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


@pytest.mark.integration
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


@pytest.mark.integration
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


@pytest.mark.integration
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


@pytest.mark.integration
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


@pytest.mark.integration
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


# ===== INTEGRATION TESTS: UPDATE PRODUCT (ADMIN-ONLY) =====

@pytest.mark.integration
def test_update_product_success():
    """INTEGRATION TEST: Admin can update product name and price"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get existing product ID
    product_id = TEST_PRODUCTS[0]["product_id"]
    
    # Update product
    resp = client.put(f"/products/{product_id}", headers=headers, json={
        "product_name": "Updated Product Name",
        "discounted_price": 399.0
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["product_name"] == "Updated Product Name"
    assert body["discounted_price"] == 399.0
    assert body["product_id"] == product_id
    # Other fields should remain unchanged
    assert body["category"] == TEST_PRODUCTS[0]["category"]
    assert body["actual_price"] == TEST_PRODUCTS[0]["actual_price"]


@pytest.mark.integration
def test_update_product_partial():
    """INTEGRATION TEST: Can update only description field"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    product_id = TEST_PRODUCTS[1]["product_id"]
    
    resp = client.put(f"/products/{product_id}", headers=headers, json={
        "about_product": "Updated description only"
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["about_product"] == "Updated description only"
    # All other fields unchanged
    assert body["product_name"] == TEST_PRODUCTS[1]["product_name"]
    assert body["discounted_price"] == TEST_PRODUCTS[1]["discounted_price"]


@pytest.mark.integration
def test_update_product_not_found():
    """INTEGRATION TEST: Returns 404 for non-existent product"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = client.put("/products/NONEXISTENT", headers=headers, json={
        "product_name": "Updated Name"
    })
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()


@pytest.mark.integration
def test_update_product_invalid_price():
    """INTEGRATION TEST: Validation rejects invalid discounted_price"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    product_id = TEST_PRODUCTS[0]["product_id"]
    
    resp = client.put(f"/products/{product_id}", headers=headers, json={
        "discounted_price": -100.0
    })
    assert resp.status_code == 400
    assert "discounted_price" in resp.json()["detail"].lower()


@pytest.mark.integration
def test_update_product_empty_name():
    """INTEGRATION TEST: Validation rejects empty product_name"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    product_id = TEST_PRODUCTS[0]["product_id"]
    
    resp = client.put(f"/products/{product_id}", headers=headers, json={
        "product_name": ""
    })
    assert resp.status_code == 400
    assert "name cannot be empty" in resp.json()["detail"].lower()


@pytest.mark.integration
def test_update_product_invalid_rating():
    """INTEGRATION TEST: Validation rejects rating > 5"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    product_id = TEST_PRODUCTS[0]["product_id"]
    
    resp = client.put(f"/products/{product_id}", headers=headers, json={
        "rating": 6.0
    })
    assert resp.status_code == 400
    assert "rating" in resp.json()["detail"].lower()


@pytest.mark.integration
def test_update_product_forbidden_for_customer():
    """INTEGRATION TEST: Non-admin cannot update products"""
    token, _ = _create_customer_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    product_id = TEST_PRODUCTS[0]["product_id"]
    
    resp = client.put(f"/products/{product_id}", headers=headers, json={
        "product_name": "Unauthorized Update"
    })
    assert resp.status_code == 403
    assert "admin" in resp.json()["detail"].lower()


@pytest.mark.integration
def test_update_product_no_auth():
    """INTEGRATION TEST: Authentication required to update products"""
    product_id = TEST_PRODUCTS[0]["product_id"]
    
    resp = client.put(f"/products/{product_id}", json={
        "product_name": "No Auth Update"
    })
    assert resp.status_code == 401


@pytest.mark.integration
def test_update_product_persists_to_file():
    """INTEGRATION TEST: Updated product is persisted to products_test.json"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    product_id = TEST_PRODUCTS[0]["product_id"]
    
    resp = client.put(f"/products/{product_id}", headers=headers, json={
        "product_name": "Persisted Update",
        "discounted_price": 499.0
    })
    assert resp.status_code == 200
    
    # Verify file was updated
    with open(TEST_DB_PATH_PRODUCTS, "r", encoding="utf-8") as f:
        products = json.load(f)
    
    updated_product = next((p for p in products if p["product_id"] == product_id), None)
    assert updated_product is not None
    assert updated_product["product_name"] == "Persisted Update"
    assert updated_product["discounted_price"] == 499.0


# ===== INTEGRATION TESTS: DELETE PRODUCT (ADMIN-ONLY) =====

@pytest.mark.integration
def test_delete_product_success():
    """INTEGRATION TEST: Admin can delete existing product"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get existing product ID
    product_id = TEST_PRODUCTS[0]["product_id"]
    
    # Delete product
    resp = client.delete(f"/products/{product_id}", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["product_id"] == product_id
    assert body["product_name"] == TEST_PRODUCTS[0]["product_name"]
    
    # Verify product is gone
    get_resp = client.get(f"/products/{product_id}")
    assert get_resp.status_code == 404


@pytest.mark.integration
def test_delete_product_not_found():
    """INTEGRATION TEST: Returns 404 for non-existent product"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = client.delete("/products/NONEXISTENT123", headers=headers)
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()


@pytest.mark.integration
def test_delete_product_forbidden_for_customer():
    """INTEGRATION TEST: Non-admin cannot delete products"""
    token, _ = _create_customer_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    product_id = TEST_PRODUCTS[0]["product_id"]
    
    resp = client.delete(f"/products/{product_id}", headers=headers)
    assert resp.status_code == 403
    assert "admin" in resp.json()["detail"].lower()


@pytest.mark.integration
def test_delete_product_no_auth():
    """INTEGRATION TEST: Authentication required to delete products"""
    product_id = TEST_PRODUCTS[0]["product_id"]
    
    resp = client.delete(f"/products/{product_id}")
    assert resp.status_code == 401


@pytest.mark.integration
def test_delete_product_persists_to_file():
    """INTEGRATION TEST: Deleted product is removed from products_test.json"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Count products before
    with open(TEST_DB_PATH_PRODUCTS, "r", encoding="utf-8") as f:
        products_before = json.load(f)
    initial_count = len(products_before)
    
    product_id = TEST_PRODUCTS[0]["product_id"]
    
    # Delete product
    resp = client.delete(f"/products/{product_id}", headers=headers)
    assert resp.status_code == 200
    
    # Verify the deleted product is not in the list
    with open(TEST_DB_PATH_PRODUCTS, "r", encoding="utf-8") as f:
        products_after = json.load(f)
    
    deleted_product = next((p for p in products_after if p["product_id"] == product_id), None)
    assert deleted_product is None


@pytest.mark.integration
def test_delete_product_returns_deleted_data():
    """INTEGRATION TEST: Response includes deleted product data"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    product_id = TEST_PRODUCTS[1]["product_id"]
    expected_name = TEST_PRODUCTS[1]["product_name"]
    expected_price = TEST_PRODUCTS[1]["discounted_price"]
    
    resp = client.delete(f"/products/{product_id}", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    
    # Should return the deleted product's data
    assert body["product_id"] == product_id
    assert body["product_name"] == expected_name
    assert body["discounted_price"] == expected_price


@pytest.mark.integration
def test_delete_product_twice_fails():
    """INTEGRATION TEST: Cannot delete same product twice"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    product_id = TEST_PRODUCTS[2]["product_id"]
    
    # First deletion succeeds
    resp1 = client.delete(f"/products/{product_id}", headers=headers)
    assert resp1.status_code == 200
    
    # Second deletion fails (product already gone)
    resp2 = client.delete(f"/products/{product_id}", headers=headers)
    assert resp2.status_code == 404


@pytest.mark.integration
def test_delete_all_products():
    """INTEGRATION TEST: Can delete all products sequentially"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Delete all test products
    for product in TEST_PRODUCTS:
        resp = client.delete(f"/products/{product['product_id']}", headers=headers)
        assert resp.status_code == 200
    
    # Verify all products are gone
    with open(TEST_DB_PATH_PRODUCTS, "r", encoding="utf-8") as f:
        products_after = json.load(f)
    
    assert len(products_after) == 0


@pytest.mark.integration
def test_delete_does_not_affect_other_products():
    """INTEGRATION TEST: Deleting one product doesn't affect others"""
    token, _ = _create_admin_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get initial product IDs
    with open(TEST_DB_PATH_PRODUCTS, "r", encoding="utf-8") as f:
        products_before = json.load(f)
    other_product_ids = [p["product_id"] for p in products_before if p["product_id"] != TEST_PRODUCTS[0]["product_id"]]
    
    # Delete first product
    resp = client.delete(f"/products/{TEST_PRODUCTS[0]['product_id']}", headers=headers)
    assert resp.status_code == 200
    
    # Verify other products still exist
    with open(TEST_DB_PATH_PRODUCTS, "r", encoding="utf-8") as f:
        products_after = json.load(f)
    remaining_ids = [p["product_id"] for p in products_after]
    
    for other_id in other_product_ids:
        assert other_id in remaining_ids, f"Product {other_id} should still exist"
