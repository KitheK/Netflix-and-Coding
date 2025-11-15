"""Tests for cart endpoints"""

import json
from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app

# TODO: still using backend/data/cart.json for tests
# should move to backend/data/test/cart.json so we dont touch production data
# see kithe's test isolation issue

client = TestClient(app)

# Test user ID (just a fake ID for testing)
TEST_USER_ID = "TESTUSER123456789ABCDEFGH"
TEST_PRODUCT_ID = "B07JW9H4J1"  # A real product from products.json

 # Clear only test user carts before each test, leaving real user data intact
def setup_function():
    """Remove only test users from cart.json to avoid deleting real data"""
    cart_file = Path("backend/data/cart.json")
    
    # List of all test user IDs used in tests
    test_users = [
        "TESTUSER123456789ABCDEFGH",
        "NONEXISTENT_USER_999",
        "TEST_USER_QTY_28CHAR1234567",
        "TEST_USER_REMOVE",
        "TEST_USER_UPDATE",
        "TEST_USER_ZERO",
        "TEST_USER_TOTAL"
    ]
    
    # Load existing carts
    if cart_file.exists():
        with open(cart_file, 'r') as f:
            try:
                carts = json.load(f)
            except json.JSONDecodeError:
                carts = {}
    else:
        carts = {}
    
    # Remove only test users
    for test_user in test_users:
        carts.pop(test_user, None)
    
    # Save back
    with open(cart_file, 'w') as f:
        json.dump(carts, f, indent=2)


# Test 1: Add item to cart
def test_add_to_cart():
    """Test adding a product to the cart"""
    response = client.post("/cart/add", json={
        "user_id": TEST_USER_ID,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 2
    })
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Item added to cart"
    assert data["product_id"] == TEST_PRODUCT_ID
    assert data["quantity"] == 2


# Test 2: Get cart
def test_get_cart():
    """Test getting a user's cart"""
    # First add an item
    client.post("/cart/add", json={
        "user_id": TEST_USER_ID,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 1
    })
    
    # Now get the cart
    response = client.get(f"/cart/{TEST_USER_ID}")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == TEST_USER_ID
    assert len(data["items"]) > 0
    assert data["total_price"] > 0


# Test 3: Get empty cart
def test_get_empty_cart():
    """Test getting cart for user with no cart"""
    fake_user = "NONEXISTENT_USER_999"
    response = client.get(f"/cart/{fake_user}")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == fake_user
    assert data["items"] == []
    assert data["total_price"] == 0.0


# Test 4: Add same item twice (should increase quantity)
def test_add_same_item_increases_quantity():
    """Test that adding the same item twice increases quantity"""
    test_user = "TEST_USER_QTY_28CHAR1234567"
    
    # Add item first time
    client.post("/cart/add", json={
        "user_id": test_user,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 2
    })
    
    # Add same item again
    client.post("/cart/add", json={
        "user_id": test_user,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 3
    })
    
    # Check cart
    response = client.get(f"/cart/{test_user}")
    data = response.json()
    
    # Should only have 1 item with quantity 5 (2+3)
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 5


# Test 5: Remove item from cart
def test_remove_from_cart():
    """Test removing an item from cart"""
    test_user = "TEST_USER_REMOVE"
    
    # Add item
    client.post("/cart/add", json={
        "user_id": test_user,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 1
    })
    
    # Remove item
    response = client.delete(f"/cart/remove/{TEST_PRODUCT_ID}?user_id={test_user}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Item removed from cart"
    
    # Cart should be empty now
    cart_response = client.get(f"/cart/{test_user}")
    cart_data = cart_response.json()
    assert len(cart_data["items"]) == 0


# Test 6: Update cart item quantity
def test_update_cart_item():
    """Test updating quantity of an item in cart"""
    test_user = "TEST_USER_UPDATE"
    
    # Add item
    client.post("/cart/add", json={
        "user_id": test_user,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 2
    })
    
    # Update quantity to 5
    response = client.put(f"/cart/update/{TEST_PRODUCT_ID}", json={
        "user_id": test_user,
        "quantity": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == 5
    
    # Verify in cart
    cart_response = client.get(f"/cart/{test_user}")
    cart_data = cart_response.json()
    assert cart_data["items"][0]["quantity"] == 5


# Test 7: Update quantity to 0 removes item
def test_update_quantity_zero_removes_item():
    """Test that updating quantity to 0 removes the item"""
    test_user = "TEST_USER_ZERO"
    
    # Add item
    client.post("/cart/add", json={
        "user_id": test_user,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 3
    })
    
    # Update to 0
    response = client.put(f"/cart/update/{TEST_PRODUCT_ID}", json={
        "user_id": test_user,
        "quantity": 0
    })
    assert response.status_code == 200
    
    # Cart should be empty
    cart_response = client.get(f"/cart/{test_user}")
    cart_data = cart_response.json()
    assert len(cart_data["items"]) == 0


# Test 8: Add invalid product
def test_add_invalid_product():
    """Test adding a product that doesn't exist - should raise ValueError"""
    # This will raise ValueError which FastAPI doesn't catch by default
    # So we just verify the error happens
    try:
        response = client.post("/cart/add", json={
            "user_id": TEST_USER_ID,
            "product_id": "FAKE_PRODUCT_999",
            "quantity": 1
        })
        # If we get here, test should fail
        assert False, "Expected ValueError but got success"
    except Exception as e:
        # Expected to fail - product doesn't exist
        assert "FAKE_PRODUCT_999" in str(e)


# Test 9: Calculate total price correctly
def test_calculate_total_price():
    """Test that total price is calculated correctly"""
    test_user = "TEST_USER_TOTAL"
    
    # Add multiple items
    client.post("/cart/add", json={
        "user_id": test_user,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 2
    })
    
    # Get cart
    response = client.get(f"/cart/{test_user}")
    data = response.json()
    
    # Total should be price * quantity
    expected_total = data["items"][0]["discounted_price"] * data["items"][0]["quantity"]
    assert data["total_price"] == expected_total
