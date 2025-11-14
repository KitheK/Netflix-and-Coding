"""Tests for product endpoints"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_get_all_products():
    """Test getting all products returns a list"""
    response = client.get("/products/")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) > 0  # should have products in the list


def test_get_product_by_id_success():
    """Test getting a specific product by ID that exists"""
    # First get all products to grab a valid ID
    response = client.get("/products/")
    products = response.json()
    valid_id = products[0]["product_id"]
    
    # Now get that specific product
    response = client.get(f"/products/{valid_id}")
    assert response.status_code == 200
    product = response.json()
    assert product["product_id"] == valid_id
    assert "product_name" in product
    assert "discounted_price" in product


def test_get_product_by_id_not_found():
    """Test getting a product with invalid ID returns 404"""
    response = client.get("/products/INVALID_ID_12345")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_search_products_with_results():
    """Test searching for products with a keyword that exists"""
    response = client.get("/products/search/laptop")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    # Check that results contain the keyword in name or category
    for product in products[:5]:  # check first 5
        assert "laptop" in product["product_name"].lower() or "laptop" in product["category"].lower()


def test_search_products_no_results():
    """Test searching with keyword that matches nothing returns empty list"""
    response = client.get("/products/search/xyznonexistentkeyword123")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) == 0  # should be empty


def test_sort_products_by_price_asc():
    """Test sorting products by price ascending"""
    response = client.get("/products/?sort=price_asc")
    assert response.status_code == 200
    products = response.json()
    # Check that prices are in ascending order
    prices = [p["discounted_price"] for p in products[:10]]  # check first 10
    assert prices == sorted(prices)


def test_sort_products_by_price_desc():
    """Test sorting products by price descending"""
    response = client.get("/products/?sort=price_desc")
    assert response.status_code == 200
    products = response.json()
    # Check that prices are in descending order
    prices = [p["discounted_price"] for p in products[:10]]
    assert prices == sorted(prices, reverse=True)


def test_sort_products_by_rating_desc():
    """Test sorting products by rating descending"""
    response = client.get("/products/?sort=rating_desc")
    assert response.status_code == 200
    products = response.json()
    # Check that ratings are in descending order
    ratings = [p["rating"] for p in products[:10]]
    assert ratings == sorted(ratings, reverse=True)


def test_sort_search_results():
    """Test sorting search results"""
    response = client.get("/products/search/phone?sort=price_asc")
    assert response.status_code == 200
    products = response.json()
    if len(products) > 1:  # only test if we have results
        prices = [p["discounted_price"] for p in products]
        assert prices == sorted(prices)


def test_product_has_required_fields():
    """Test that product objects have all required fields"""
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
    """Test that numeric fields are actually numbers not strings"""
    response = client.get("/products/")
    products = response.json()
    product = products[0]
    
    assert isinstance(product["discounted_price"], (int, float))
    assert isinstance(product["actual_price"], (int, float))
    assert isinstance(product["discount_percentage"], (int, float))
    assert isinstance(product["rating"], (int, float))
