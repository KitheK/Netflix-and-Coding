from fastapi import FastAPI
from fastapi.testclient import TestClient
import app.controllers.productAPI as product_module

def make_app():
    app = FastAPI()
    app.include_router(product_module.router, prefix="/api")
    return app

"Dummy product for the test"
class DummyProduct:
    def __init__(self, id, name, category):
        self.id = id
        self.name = name
        self.category = category

    def to_dict(self):
        return {
            "product_id": str(self.id),
            "product_name": self.name,
            "category": self.category,
            "discounted_price": 9.99,
            "actual_price": 19.99,
            "discount_percentage": 50.0,
            "rating": 4.5,
            "rating_count": 123,
            "about_product": f"About {self.name}",
            "img_link": "http://example.com/img.jpg",
            "product_link": "http://example.com/product",
            "review_count": 10,
        }

class DummyService:
    def __init__(self, products):
        self._products = products

    def get_all_products(self):
        return self._products

    def get_product_by_id(self, pid):
        for p in self._products:
            if getattr(p, "id", None) == pid:
                return p
        raise ValueError("Product not found")

    def search_products(self, keyword):
        return [p for p in self._products if keyword.lower() in p.name.lower()]

    def create_product(self, product_data):
        # For testing POST endpoints
        new_id = max(p.id for p in self._products) + 1
        new_product = DummyProduct(new_id, product_data["product_name"], product_data["category"])
        self._products.append(new_product)
        return new_product

    def update_product(self, pid, update_data):
        # For testing PUT endpoints
        for p in self._products:
            if p.id == pid:
                if "product_name" in update_data:
                    p.name = update_data["product_name"]
                if "category" in update_data:
                    p.category = update_data["category"]
                return p
        raise ValueError("Product not found")

    def delete_product(self, pid):
        # For testing DELETE endpoints
        for i, p in enumerate(self._products):
            if p.id == pid:
                return self._products.pop(i)
        raise ValueError("Product not found")

def setup_dummy_service(monkeypatch):
    products = [
        DummyProduct(1, "Alpha Movie", "Movies"),
        DummyProduct(2, "Beta Show", "TV"),
        DummyProduct(3, "Gamma Movie", "Movies"),
        DummyProduct(4, "Delta Series", "TV"),
    ]
    dummy = DummyService(products)
    monkeypatch.setattr(product_module, "product_service", dummy)
    return products

# Existing tests
def test_products_route_registered():
    app = make_app()
    paths = [r.path for r in app.routes if hasattr(r, "path")]
    assert any(p.startswith("/api/products") for p in paths), "products router not registered under /api/products"

def test_get_products_list(monkeypatch):
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    resp = client.get("/api/products")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 4
    assert data[0]["product_name"] == "Alpha Movie"

def test_get_products_with_category_and_pagination(monkeypatch):
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    resp = client.get("/api/products?category=Movies&skip=0&limit=1")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["category"].lower() == "movies"

def test_get_product_by_id_found(monkeypatch):
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    resp = client.get("/api/products/1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["product_id"] == "1"
    assert data["product_name"] == "Alpha Movie"

def test_get_product_by_id_not_found(monkeypatch):
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    resp = client.get("/api/products/999")
    assert resp.status_code == 404

def test_search_products(monkeypatch):
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    resp = client.get("/api/products/search/alpha")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["product_name"] == "Alpha Movie"


def test_get_products_pagination_only(monkeypatch):
    """Test pagination without category filter"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    resp = client.get("/api/products?skip=1&limit=2")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["product_name"] == "Beta Show"  # Skip first item

def test_get_products_empty_category(monkeypatch):
    """Test category filter with no results"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    resp = client.get("/api/products?category=Books")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 0

def test_get_products_invalid_pagination(monkeypatch):
    """Test invalid pagination parameters"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    resp = client.get("/api/products?skip=-1&limit=0")
    # FastAPI should handle validation - might return 422 or handle gracefully
    assert resp.status_code in [200, 422]

def test_search_products_multiple_results(monkeypatch):
    """Test search that returns multiple results"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    resp = client.get("/api/products/search/movie")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2  # "Alpha Movie" and "Gamma Movie"
    movie_names = [item["product_name"] for item in data]
    assert "Alpha Movie" in movie_names
    assert "Gamma Movie" in movie_names

def test_search_products_no_results(monkeypatch):
    """Test search with no matching results"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    resp = client.get("/api/products/search/xyz")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 0

def test_search_products_case_insensitive(monkeypatch):
    """Test case-insensitive search"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    resp = client.get("/api/products/search/MOVIE")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2

def test_product_response_structure(monkeypatch):
    """Test that product response has all expected fields"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    resp = client.get("/api/products/1")
    assert resp.status_code == 200
    data = resp.json()
    
    expected_fields = {
        "product_id", "product_name", "category", "discounted_price",
        "actual_price", "discount_percentage", "rating", "rating_count",
        "about_product", "img_link", "product_link", "review_count"
    }
    
    assert set(data.keys()) == expected_fields
    
    # Check data types
    assert isinstance(data["product_id"], str)
    assert isinstance(data["product_name"], str)
    assert isinstance(data["discounted_price"], float)
    assert isinstance(data["actual_price"], float)
    assert isinstance(data["discount_percentage"], float)
    assert isinstance(data["rating"], float)
    assert isinstance(data["rating_count"], int)

def test_get_all_products_structure(monkeypatch):
    """Test that all products endpoint returns correct structure"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    resp = client.get("/api/products")
    assert resp.status_code == 200
    data = resp.json()
    
    assert isinstance(data, list)
    assert len(data) == 4
    
    # Check first product has all required fields
    first_product = data[0]
    assert "product_id" in first_product
    assert "product_name" in first_product
    assert "category" in first_product

# POST Endpoint Tests
def test_create_product_success(monkeypatch):
    """Test creating a new product"""
    products = setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    
    new_product_data = {
        "product_name": "New Test Product",
        "category": "Books",
        "discounted_price": 15.99,
        "actual_price": 29.99,
        "discount_percentage": 46.7,
        "rating": 4.2,
        "rating_count": 50,
        "about_product": "A great new product",
        "img_link": "http://example.com/new.jpg",
        "product_link": "http://example.com/new-product"
    }
    
    resp = client.post("/api/products", json=new_product_data)
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["product_name"] == "New Test Product"
    assert data["category"] == "Books"

def test_create_product_missing_required_fields(monkeypatch):
    """Test creating product with missing required fields"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    
    incomplete_data = {
        "product_name": "Incomplete Product",
        # Missing other required fields
    }
    
    resp = client.post("/api/products", json=incomplete_data)
    # Should return 422 Unprocessable Entity for validation errors
    assert resp.status_code == 422

# PUT Endpoint Tests
def test_update_product_success(monkeypatch):
    """Test updating an existing product"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    
    update_data = {
        "product_name": "Updated Movie Name",
        "category": "Updated Category"
    }
    
    resp = client.put("/api/products/1", json=update_data)
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["product_name"] == "Updated Movie Name"
    assert data["category"] == "Updated Category"

def test_update_product_not_found(monkeypatch):
    """Test updating a non-existent product"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    
    update_data = {
        "product_name": "Updated Name"
    }
    
    resp = client.put("/api/products/999", json=update_data)
    assert resp.status_code == 404

# DELETE Endpoint Tests
def test_delete_product_success(monkeypatch):
    """Test deleting an existing product"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    
    resp = client.delete("/api/products/1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["message"] == "Product deleted successfully"

def test_delete_product_not_found(monkeypatch):
    """Test deleting a non-existent product"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    
    resp = client.delete("/api/products/999")
    assert resp.status_code == 404

# Edge Case Tests
def test_product_id_string_handling(monkeypatch):
    """Test that string product IDs are handled correctly"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    
    # Test with string ID that matches existing numeric ID
    resp = client.get("/api/products/1")
    assert resp.status_code == 200
    
    # Test with non-numeric string ID
    resp = client.get("/api/products/abc")
    assert resp.status_code == 422  # changed to type validation error

def test_empty_database_scenario(monkeypatch):
    """Test behavior when no products exist"""
    empty_service = DummyService([])
    monkeypatch.setattr(product_module, "product_service", empty_service)
    
    app = make_app()
    client = TestClient(app)
    
    resp = client.get("/api/products")
    assert resp.status_code == 200
    data = resp.json()
    assert data == []

def test_large_pagination(monkeypatch):
    """Test pagination with large limit values"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    
    resp = client.get("/api/products?limit=100")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 4  # Should return all products

def test_malformed_url_parameters(monkeypatch):
    """Test handling of malformed URL parameters"""
    setup_dummy_service(monkeypatch)
    app = make_app()
    client = TestClient(app)
    
    # Test with non-integer parameters
    resp = client.get("/api/products?skip=abc&limit=def")
    # FastAPI should handle type conversion and return appropriate status
    assert resp.status_code in [200, 422]