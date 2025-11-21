"""Tests for cart endpoints"""

import json
import os
from pathlib import Path

# Set environment variables BEFORE importing app
os.environ["PRODUCTS_FILE"] = "products_test.json"
os.environ["USERS_FILE"] = "users.json"
os.environ["CARTS_FILE"] = "cart.json"

from fastapi.testclient import TestClient
from backend.main import app

# TODO: still using backend/data/cart.json and users.json for tests
# should move to backend/data/test/ so we dont touch production data
# see kithe's test isolation issue

client = TestClient(app)

# Test user credentials
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
TEST_USER_TOKEN = "TESTTOKEN1234567890ABCDEFGH"
TEST_PRODUCT_ID = "B07JW9H4J1"  # A real product from products.json

# Additional test user IDs and tokens
TEST_USER_QTY_ID = "00000000-0000-0000-0000-000000000002"
TEST_USER_QTY_TOKEN = "TESTTOKEN2222222222AAABBBCCCC"

TEST_USER_REMOVE_ID = "00000000-0000-0000-0000-000000000003"
TEST_USER_REMOVE_TOKEN = "TESTTOKEN3333333333DDDEEEFFFF"

TEST_USER_UPDATE_ID = "00000000-0000-0000-0000-000000000004"
TEST_USER_UPDATE_TOKEN = "TESTTOKEN4444444444GGGHHHIIII"

TEST_USER_ZERO_ID = "00000000-0000-0000-0000-000000000005"
TEST_USER_ZERO_TOKEN = "TESTTOKEN5555555555JJJKKKLLL"

TEST_USER_TOTAL_ID = "00000000-0000-0000-0000-000000000006"
TEST_USER_TOTAL_TOKEN = "TESTTOKEN6666666666MMMNNNOOO"

# Test product data
TEST_PRODUCTS = [
    {
        "product_id": "B07JW9H4J1",
        "product_name": "Wayona Nylon Braided USB to Lightning Cable",
        "category": "Electronics|Cables",
        "discounted_price": 299.0,
        "actual_price": 1899.0,
        "discount_percentage": 84.0,
        "rating": 4.3,
        "rating_count": 8641,
        "about_product": "Test cable for cart operations",
        "img_link": "https://example.com/cable.jpg",
        "product_link": "https://example.com/cable"
    }
]


def setup_function():
    """Setup test users in users.json and clear their carts"""
    users_file = Path("backend/data/users.json")
    cart_file = Path("backend/data/cart.json")
    products_file = Path("backend/data/products_test.json")
    
    # CREATE TEST PRODUCTS FILE FIRST
    with open(products_file, 'w', encoding='utf-8') as f:
        json.dump(TEST_PRODUCTS, f, indent=2)
    
    # Create test users in users.json
    test_users = [
        {
            "user_id": TEST_USER_ID,
            "name": "Test User 1",
            "email": "testuser1@test.com",
            "password_hash": "$2b$12$test.hash.placeholder.for.testing",
            "role": "customer",
            "user_token": TEST_USER_TOKEN
        },
        {
            "user_id": TEST_USER_QTY_ID,
            "name": "Test User Qty",
            "email": "testuserqty@test.com",
            "password_hash": "$2b$12$test.hash.placeholder.for.testing",
            "role": "customer",
            "user_token": TEST_USER_QTY_TOKEN
        },
        {
            "user_id": TEST_USER_REMOVE_ID,
            "name": "Test User Remove",
            "email": "testuserremove@test.com",
            "password_hash": "$2b$12$test.hash.placeholder.for.testing",
            "role": "customer",
            "user_token": TEST_USER_REMOVE_TOKEN
        },
        {
            "user_id": TEST_USER_UPDATE_ID,
            "name": "Test User Update",
            "email": "testuserupdate@test.com",
            "password_hash": "$2b$12$test.hash.placeholder.for.testing",
            "role": "customer",
            "user_token": TEST_USER_UPDATE_TOKEN
        },
        {
            "user_id": TEST_USER_ZERO_ID,
            "name": "Test User Zero",
            "email": "testuserzero@test.com",
            "password_hash": "$2b$12$test.hash.placeholder.for.testing",
            "role": "customer",
            "user_token": TEST_USER_ZERO_TOKEN
        },
        {
            "user_id": TEST_USER_TOTAL_ID,
            "name": "Test User Total",
            "email": "testusertotal@test.com",
            "password_hash": "$2b$12$test.hash.placeholder.for.testing",
            "role": "customer",
            "user_token": TEST_USER_TOTAL_TOKEN
        }
    ]
    
    # Load existing users
    if users_file.exists():
        with open(users_file, 'r', encoding='utf-8') as f:
            try:
                users = json.load(f)
            except json.JSONDecodeError:
                users = []
    else:
        users = []
    
    # Remove any existing test users (by user_id) and add fresh ones
    test_user_ids = {user["user_id"] for user in test_users}
    users = [u for u in users if u["user_id"] not in test_user_ids]
    users.extend(test_users)
    
    # Save users
    with open(users_file, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2)
    
    # Clear test user carts (using user_id as keys now, not tokens)
    if cart_file.exists():
        with open(cart_file, 'r', encoding='utf-8') as f:
            try:
                carts = json.load(f)
            except json.JSONDecodeError:
                carts = {}
    else:
        carts = {}
    
    # Handle both list and dictionary formats for carts
    if isinstance(carts, list):
        # If carts is a list, convert it to a dictionary format
        carts_dict = {}
        for cart_item in carts:
            user_id = cart_item.get("user_id")
            if user_id and user_id not in test_user_ids:
                carts_dict[user_id] = cart_item
        carts = carts_dict
    else:
        # If carts is already a dictionary, remove test user carts
        for test_user_id in test_user_ids:
            carts.pop(test_user_id, None)
    
    # Save carts (ensure it's saved as a dictionary)
    with open(cart_file, 'w', encoding='utf-8') as f:
        json.dump(carts, f, indent=2)


def teardown_function():
    """Remove test users from users.json after tests"""
    users_file = Path("backend/data/users.json")
    products_file = Path("backend/data/products_test.json")
    
    test_user_ids = {
        TEST_USER_ID, TEST_USER_QTY_ID, TEST_USER_REMOVE_ID,
        TEST_USER_UPDATE_ID, TEST_USER_ZERO_ID, TEST_USER_TOTAL_ID
    }
    
    if users_file.exists():
        with open(users_file, 'r', encoding='utf-8') as f:
            try:
                users = json.load(f)
            except json.JSONDecodeError:
                users = []
        
        # Remove test users
        users = [u for u in users if u["user_id"] not in test_user_ids]
        
        with open(users_file, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2)
    
    # Clean up test products file
    if products_file.exists():
        products_file.unlink()


# Test 1: Add item to cart
def test_add_to_cart():
    """Test adding a product to the cart"""
    response = client.post("/cart/add", json={
        "user_token": TEST_USER_TOKEN,
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
        "user_token": TEST_USER_TOKEN,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 1
    })
    
    # Now get the cart (using token as query param)
    response = client.get(f"/cart/?user_token={TEST_USER_TOKEN}")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == TEST_USER_ID  # Response still returns user_id (UUID)
    assert len(data["items"]) > 0
    assert data["total_price"] > 0


# Test 3: Get empty cart
def test_get_empty_cart():
    """Test getting cart for user with no items"""
    # Use a test user that hasn't added anything yet
    response = client.get(f"/cart/?user_token={TEST_USER_QTY_TOKEN}")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == TEST_USER_QTY_ID
    assert data["items"] == []
    assert data["total_price"] == 0.0


# Test 4: Add same item twice (should increase quantity)
def test_add_same_item_increases_quantity():
    """Test that adding the same item twice increases quantity"""
    # Add item first time
    client.post("/cart/add", json={
        "user_token": TEST_USER_QTY_TOKEN,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 2
    })
    
    # Add same item again
    client.post("/cart/add", json={
        "user_token": TEST_USER_QTY_TOKEN,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 3
    })
    
    # Check cart
    response = client.get(f"/cart/?user_token={TEST_USER_QTY_TOKEN}")
    data = response.json()
    
    # Should only have 1 item with quantity 5 (2+3)
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 5


# Test 5: Remove item from cart
def test_remove_from_cart():
    """Test removing an item from cart"""
    # Add item
    client.post("/cart/add", json={
        "user_token": TEST_USER_REMOVE_TOKEN,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 1
    })
    
    # Remove item (using token as query param)
    response = client.delete(f"/cart/remove/{TEST_PRODUCT_ID}?user_token={TEST_USER_REMOVE_TOKEN}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Item removed from cart"
    
    # Cart should be empty now
    cart_response = client.get(f"/cart/?user_token={TEST_USER_REMOVE_TOKEN}")
    cart_data = cart_response.json()
    assert len(cart_data["items"]) == 0


# Test 6: Update cart item quantity
def test_update_cart_item():
    """Test updating quantity of an item in cart"""
    # Add item
    client.post("/cart/add", json={
        "user_token": TEST_USER_UPDATE_TOKEN,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 2
    })
    
    # Update quantity to 5
    response = client.put(f"/cart/update/{TEST_PRODUCT_ID}", json={
        "user_token": TEST_USER_UPDATE_TOKEN,
        "quantity": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == 5
    
    # Verify in cart
    cart_response = client.get(f"/cart/?user_token={TEST_USER_UPDATE_TOKEN}")
    cart_data = cart_response.json()
    assert cart_data["items"][0]["quantity"] == 5


# Test 7: Update quantity to 0 removes item
def test_update_quantity_zero_removes_item():
    """Test that updating quantity to 0 removes the item"""
    # Add item
    client.post("/cart/add", json={
        "user_token": TEST_USER_ZERO_TOKEN,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 3
    })
    
    # Update to 0
    response = client.put(f"/cart/update/{TEST_PRODUCT_ID}", json={
        "user_token": TEST_USER_ZERO_TOKEN,
        "quantity": 0
    })
    assert response.status_code == 200
    
    # Cart should be empty
    cart_response = client.get(f"/cart/?user_token={TEST_USER_ZERO_TOKEN}")
    cart_data = cart_response.json()
    assert len(cart_data["items"]) == 0


# Test 8: Add invalid product
def test_add_invalid_product():
    """Test adding a product that doesn't exist - should raise ValueError"""
    # This will raise ValueError which FastAPI doesn't catch by default
    # So we just verify the error happens
    try:
        response = client.post("/cart/add", json={
            "user_token": TEST_USER_TOKEN,
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
    # Add multiple items
    client.post("/cart/add", json={
        "user_token": TEST_USER_TOTAL_TOKEN,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 2
    })
    
    # Get cart
    response = client.get(f"/cart/?user_token={TEST_USER_TOTAL_TOKEN}")
    data = response.json()
    
    # Total should be price * quantity
    expected_total = data["items"][0]["discounted_price"] * data["items"][0]["quantity"]
    assert data["total_price"] == expected_total
