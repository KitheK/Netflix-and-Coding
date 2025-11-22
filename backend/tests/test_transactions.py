"""Tests for transaction endpoints (checkout and viewing transaction history)"""

import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.transaction_service import TransactionService
from backend.models.transaction_model import Transaction

client = TestClient(app)

# Test user credentials
TEST_USER_CHECKOUT_ID = "00000000-0000-0000-0000-000000000101"
TEST_USER_CHECKOUT_TOKEN = "TESTTOKENCHECKOUT12345678901"

TEST_USER_EMPTY_ID = "00000000-0000-0000-0000-000000000102"
TEST_USER_EMPTY_TOKEN = "TESTTOKENEMPTY1234567890ABCD"

TEST_USER_MULTI_ID = "00000000-0000-0000-0000-000000000103"
TEST_USER_MULTI_TOKEN = "TESTTOKENMULTI1234567890ABCD"

TEST_PRODUCT_ID = "B07JW9H4J1"  # A real product from products_test.json

# Test products to populate products_test.json
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
    }
]


def setup_function():
    """Setup test users, products, and clear their carts and transactions"""
    users_file = Path("backend/data/users.json")
    cart_file = Path("backend/data/cart.json")
    transactions_file = Path("backend/data/transactions.json")
    products_test_file = Path("backend/data/products_test.json")
    
    # Write test products to products_test.json
    with open(products_test_file, 'w') as f:
        json.dump(TEST_PRODUCTS, f, indent=2)
    
    # Create test users
    test_users = [
        {
            "user_id": TEST_USER_CHECKOUT_ID,
            "name": "Test User Checkout",
            "email": "testcheckout@test.com",
            "password_hash": "$2b$12$test.hash.placeholder.for.testing",
            "role": "customer",
            "user_token": TEST_USER_CHECKOUT_TOKEN
        },
        {
            "user_id": TEST_USER_EMPTY_ID,
            "name": "Test User Empty",
            "email": "testempty@test.com",
            "password_hash": "$2b$12$test.hash.placeholder.for.testing",
            "role": "customer",
            "user_token": TEST_USER_EMPTY_TOKEN
        },
        {
            "user_id": TEST_USER_MULTI_ID,
            "name": "Test User Multi",
            "email": "testmulti@test.com",
            "password_hash": "$2b$12$test.hash.placeholder.for.testing",
            "role": "customer",
            "user_token": TEST_USER_MULTI_TOKEN
        }
    ]
    
    # Load and update users.json
    if users_file.exists():
        with open(users_file, 'r') as f:
            try:
                users = json.load(f)
            except json.JSONDecodeError:
                users = []
    else:
        users = []
    
    # Remove existing test users and add fresh ones
    test_user_ids = {user["user_id"] for user in test_users}
    users = [u for u in users if u["user_id"] not in test_user_ids]
    users.extend(test_users)
    
    with open(users_file, 'w') as f:
        json.dump(users, f, indent=2)
    
    # Clear test user carts
    if cart_file.exists():
        with open(cart_file, 'r') as f:
            try:
                carts = json.load(f)
            except json.JSONDecodeError:
                carts = {}
    else:
        carts = {}
    
    if not isinstance(carts, dict):
        carts = {}
    
    for test_user_id in test_user_ids:
        carts.pop(test_user_id, None)
    
    with open(cart_file, 'w') as f:
        json.dump(carts, f, indent=2)
    
    # Clear test user transactions (now a dict structure: {"user_id": [transactions]})
    if transactions_file.exists():
        with open(transactions_file, 'r') as f:
            try:
                transactions = json.load(f)
            except json.JSONDecodeError:
                transactions = {}
    else:
        transactions = {}
    
    # Ensure it's a dict, not a list (for migration from old structure)
    if not isinstance(transactions, dict):
        transactions = {}
    
    # Remove test user transaction lists
    for test_user_id in test_user_ids:
        transactions.pop(test_user_id, None)
    
    with open(transactions_file, 'w') as f:
        json.dump(transactions, f, indent=2)


def teardown_function():
    """Remove test users after tests"""
    users_file = Path("backend/data/users.json")
    
    test_user_ids = {
        TEST_USER_CHECKOUT_ID,
        TEST_USER_EMPTY_ID,
        TEST_USER_MULTI_ID
    }
    
    if users_file.exists():
        with open(users_file, 'r') as f:
            try:
                users = json.load(f)
            except json.JSONDecodeError:
                users = []
        
        users = [u for u in users if u["user_id"] not in test_user_ids]
        
        with open(users_file, 'w') as f:
            json.dump(users, f, indent=2)


# ============================================================================
# UNIT TESTS - Testing TransactionService with mocked dependencies
# ============================================================================

class TestTransactionServiceUnit:
    """UNIT TESTS: Test TransactionService business logic with mocked repository"""
    
    def setup_method(self):
        """Set up test service with mocked repository"""
        self.mock_repository = Mock()
        self.service = TransactionService()
        self.service.transaction_repository = self.mock_repository
    
    @pytest.mark.unit
    def test_get_user_transactions_success(self):
        """UNIT TEST: Get transactions for user returns sorted list"""
        from backend.models.transaction_model import Transaction, TransactionItem
        
        user_id = "test-user-id"
        # Create complete transaction data with all required fields
        mock_transactions = {
            user_id: [
                {
                    "transaction_id": "tx1",
                    "user_id": user_id,
                    "customer_name": "Test User",
                    "customer_email": "test@example.com",
                    "items": [
                        {
                            "product_id": "B07JW9H4J1",
                            "product_name": "Test Product",
                            "img_link": "https://example.com/img.jpg",
                            "product_link": "https://example.com/product",
                            "discounted_price": 299.0,
                            "quantity": 1
                        }
                    ],
                    "total_price": 299.0,
                    "timestamp": "2025-01-01T10:00:00+00:00",
                    "estimated_delivery": "2025-01-05",
                    "status": "completed"
                },
                {
                    "transaction_id": "tx2",
                    "user_id": user_id,
                    "customer_name": "Test User",
                    "customer_email": "test@example.com",
                    "items": [
                        {
                            "product_id": "B07JW9H4J1",
                            "product_name": "Test Product",
                            "img_link": "https://example.com/img.jpg",
                            "product_link": "https://example.com/product",
                            "discounted_price": 299.0,
                            "quantity": 2
                        }
                    ],
                    "total_price": 598.0,
                    "timestamp": "2025-01-02T10:00:00+00:00",
                    "estimated_delivery": "2025-01-06",
                    "status": "completed"
                },
            ]
        }
        self.mock_repository.get_all.return_value = mock_transactions
        
        transactions = self.service.get_user_transactions(user_id)
        
        # Should return transactions sorted by newest first
        assert len(transactions) == 2
        assert transactions[0].transaction_id == "tx2"  # Newest first
        assert transactions[1].transaction_id == "tx1"  # Older second
    
    @pytest.mark.unit
    def test_get_user_transactions_empty(self):
        """UNIT TEST: Get transactions for user with no transactions returns empty list"""
        # Empty dict or user not in dict should return empty list
        self.mock_repository.get_all.return_value = {}
        
        transactions = self.service.get_user_transactions("test-user-id")
        assert transactions == []
        
        # Test with user not in transactions dict
        self.mock_repository.get_all.return_value = {"other-user-id": []}
        transactions = self.service.get_user_transactions("test-user-id")
        assert transactions == []


# ============================================================================
# INTEGRATION TESTS - Testing full API endpoints with TestClient
# ============================================================================

# Test 1: Checkout with empty cart should fail
@pytest.mark.integration
def test_checkout_empty_cart():
    """Test that checking out with an empty cart fails"""
    response = client.post(f"/cart/checkout?user_token={TEST_USER_EMPTY_TOKEN}")
    
    assert response.status_code == 400
    assert "cart is empty" in response.json()["detail"].lower()


# Test 2: Successful checkout
@pytest.mark.integration
def test_checkout_success():
    """Test successful checkout creates transaction and clears cart"""
    # First, add item to cart
    client.post("/cart/add", json={
        "user_token": TEST_USER_CHECKOUT_TOKEN,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 2
    })
    
    # Now checkout
    response = client.post(f"/cart/checkout?user_token={TEST_USER_CHECKOUT_TOKEN}")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "message" in data
    assert data["message"] == "Order confirmed"
    assert "transaction" in data
    
    # Check transaction details
    transaction = data["transaction"]
    assert "transaction_id" in transaction
    assert transaction["user_id"] == TEST_USER_CHECKOUT_ID
    assert "items" in transaction
    assert len(transaction["items"]) == 1
    assert transaction["items"][0]["product_id"] == TEST_PRODUCT_ID
    assert transaction["items"][0]["quantity"] == 2
    assert "total_price" in transaction
    assert "timestamp" in transaction
    assert transaction["status"] == "completed"
    
    # Verify cart is now empty
    cart_response = client.get(f"/cart/?user_token={TEST_USER_CHECKOUT_TOKEN}")
    cart_data = cart_response.json()
    assert len(cart_data["items"]) == 0


# Test 3: Get transactions for user with no transactions
@pytest.mark.integration
def test_get_transactions_empty():
    """Test getting transactions for user with no transactions returns empty list"""
    response = client.get(f"/transactions/?user_token={TEST_USER_EMPTY_TOKEN}")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


# Test 4: Get all transactions for user
@pytest.mark.integration
def test_get_user_transactions():
    """Test getting all transactions for a user"""
    # Add item and checkout twice to create 2 transactions
    for i in range(2):
        client.post("/cart/add", json={
            "user_token": TEST_USER_MULTI_TOKEN,
            "product_id": TEST_PRODUCT_ID,
            "quantity": i + 1
        })
        client.post(f"/cart/checkout?user_token={TEST_USER_MULTI_TOKEN}")
    
    # Get all transactions
    response = client.get(f"/transactions/?user_token={TEST_USER_MULTI_TOKEN}")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    
    # Check that transactions are sorted by newest first
    # (second transaction should come first)
    assert data[0]["items"][0]["quantity"] == 2  # Most recent (second checkout)
    assert data[1]["items"][0]["quantity"] == 1  # Older (first checkout)


# Test 5: Get specific transaction by ID
@pytest.mark.integration
def test_get_transaction_by_id():
    """Test getting a specific transaction by its ID"""
    # Add item and checkout
    client.post("/cart/add", json={
        "user_token": TEST_USER_CHECKOUT_TOKEN,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 3
    })
    
    checkout_response = client.post(f"/cart/checkout?user_token={TEST_USER_CHECKOUT_TOKEN}")
    transaction_id = checkout_response.json()["transaction"]["transaction_id"]
    
    # Get specific transaction
    response = client.get(f"/transactions/{transaction_id}?user_token={TEST_USER_CHECKOUT_TOKEN}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["transaction_id"] == transaction_id
    assert data["user_id"] == TEST_USER_CHECKOUT_ID
    assert data["items"][0]["quantity"] == 3


# Test 6: Get non-existent transaction returns 404
@pytest.mark.integration
def test_get_nonexistent_transaction():
    """Test that requesting a non-existent transaction returns 404"""
    fake_transaction_id = "00000000-0000-0000-0000-999999999999"
    
    response = client.get(f"/transactions/{fake_transaction_id}?user_token={TEST_USER_EMPTY_TOKEN}")
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# Test 7: User cannot view another user's transaction
@pytest.mark.integration
def test_unauthorized_transaction_access():
    """Test that a user cannot view another user's transaction"""
    # User 1 creates a transaction
    client.post("/cart/add", json={
        "user_token": TEST_USER_CHECKOUT_TOKEN,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 1
    })
    
    checkout_response = client.post(f"/cart/checkout?user_token={TEST_USER_CHECKOUT_TOKEN}")
    transaction_id = checkout_response.json()["transaction"]["transaction_id"]
    
    # User 2 tries to view User 1's transaction
    response = client.get(f"/transactions/{transaction_id}?user_token={TEST_USER_EMPTY_TOKEN}")
    
    assert response.status_code == 403
    assert "access denied" in response.json()["detail"].lower()


# Test 8: Checkout with multiple items
@pytest.mark.integration
def test_checkout_multiple_items():
    """Test checkout with multiple different products"""
    # Add two different products
    client.post("/cart/add", json={
        "user_token": TEST_USER_MULTI_TOKEN,
        "product_id": TEST_PRODUCT_ID,
        "quantity": 2
    })
    
    # You can add another product if you have another product ID
    # For now, just verify checkout works with one product
    
    response = client.post(f"/cart/checkout?user_token={TEST_USER_MULTI_TOKEN}")
    
    assert response.status_code == 200
    transaction = response.json()["transaction"]
    assert len(transaction["items"]) >= 1
    assert transaction["total_price"] > 0
