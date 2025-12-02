"""Tests for refund endpoints (create, view, approve, deny)"""

import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.refund_service import RefundService

client = TestClient(app)

# Test user credentials
TEST_CUSTOMER_ID = "00000000-0000-0000-0000-000000000201"
TEST_CUSTOMER_TOKEN = "TESTCUSTOMERTOKEN123456789012"

TEST_ADMIN_ID = "00000000-0000-0000-0000-000000000202"
TEST_ADMIN_TOKEN = "TESTADMINTOKEN12345678901234"

# Test transaction ID
TEST_TRANSACTION_ID = "test-transaction-id-001"


def setup_function():
    """Setup test users, transactions, and clear refunds"""
    users_file = Path("backend/data/users.json")
    transactions_file = Path("backend/data/transactions.json")
    refunds_file = Path("backend/data/refunds.json")
    
    # Create test users (customer + admin)
    test_users = [
        {
            "user_id": TEST_CUSTOMER_ID,
            "name": "Test Customer",
            "email": "testcustomer@test.com",
            "password_hash": "$2b$12$test.hash.placeholder.for.testing",
            "role": "customer",
            "user_token": TEST_CUSTOMER_TOKEN
        },
        {
            "user_id": TEST_ADMIN_ID,
            "name": "Test Admin",
            "email": "testadmin@test.com",
            "password_hash": "$2b$12$test.hash.placeholder.for.testing",
            "role": "admin",
            "user_token": TEST_ADMIN_TOKEN
        }
    ]
    
    # Load existing users and add test users
    if users_file.exists():
        with open(users_file, 'r') as f:
            try:
                users = json.load(f)
            except json.JSONDecodeError:
                users = []
    else:
        users = []
    
    # Remove existing test users
    users = [u for u in users if u.get("user_id") not in [TEST_CUSTOMER_ID, TEST_ADMIN_ID]]
    users.extend(test_users)
    
    with open(users_file, 'w') as f:
        json.dump(users, f, indent=2)
    
    # Create test transaction for customer
    test_transactions = {
        TEST_CUSTOMER_ID: [
            {
                "transaction_id": TEST_TRANSACTION_ID,
                "user_id": TEST_CUSTOMER_ID,
                "customer_name": "Test Customer",
                "customer_email": "testcustomer@test.com",
                "items": [
                    {
                        "product_id": "B07JW9H4J1",
                        "product_name": "Test Product",
                        "img_link": "https://example.com/product.jpg",
                        "product_link": "https://example.com/product",
                        "discounted_price": 299.0,
                        "quantity": 1
                    }
                ],
                "total_price": 299.0,
                "timestamp": "2024-01-15T10:30:00",
                "estimated_delivery": "2024-01-20",
                "status": "completed"
            }
        ]
    }
    
    with open(transactions_file, 'w') as f:
        json.dump(test_transactions, f, indent=2)
    
    # Clear refunds
    with open(refunds_file, 'w') as f:
        json.dump([], f, indent=2)


def teardown_function():
    """Cleanup test data"""
    users_file = Path("backend/data/users.json")
    transactions_file = Path("backend/data/transactions.json")
    refunds_file = Path("backend/data/refunds.json")
    
    # Remove test users
    if users_file.exists():
        with open(users_file, 'r') as f:
            users = json.load(f)
        users = [u for u in users if u.get("user_id") not in [TEST_CUSTOMER_ID, TEST_ADMIN_ID]]
        with open(users_file, 'w') as f:
            json.dump(users, f, indent=2)
    
    # Clear test transactions
    if transactions_file.exists():
        with open(transactions_file, 'r') as f:
            transactions = json.load(f)
        if TEST_CUSTOMER_ID in transactions:
            del transactions[TEST_CUSTOMER_ID]
        with open(transactions_file, 'w') as f:
            json.dump(transactions, f, indent=2)
    
    # Clear refunds
    with open(refunds_file, 'w') as f:
        json.dump([], f, indent=2)


# ==================== UNIT TESTS ====================

@pytest.mark.unit
def test_create_refund_service():
    """Test creating refund request through service layer"""
    from backend.models.refund_model import RefundRequest
    
    service = RefundService()
    request = RefundRequest(
        transaction_id=TEST_TRANSACTION_ID,
        message="Product arrived damaged"
    )
    
    refund = service.create_refund_request(request, TEST_CUSTOMER_ID)
    
    assert refund.transaction_id == TEST_TRANSACTION_ID
    assert refund.user_id == TEST_CUSTOMER_ID
    assert refund.message == "Product arrived damaged"
    assert refund.status == "pending"
    assert refund.refund_id is not None
    assert refund.created_at is not None


@pytest.mark.unit
def test_create_duplicate_refund_fails():
    """Test that creating duplicate refund for same transaction fails"""
    from backend.models.refund_model import RefundRequest
    from fastapi import HTTPException
    
    service = RefundService()
    request = RefundRequest(
        transaction_id=TEST_TRANSACTION_ID,
        message="First refund request"
    )
    
    # Create first refund
    service.create_refund_request(request, TEST_CUSTOMER_ID)
    
    # Try to create duplicate
    with pytest.raises(HTTPException) as exc_info:
        service.create_refund_request(request, TEST_CUSTOMER_ID)
    
    assert exc_info.value.status_code == 400
    assert "already exists" in str(exc_info.value.detail)


@pytest.mark.unit
def test_approve_refund_service():
    """Test approving refund through service layer"""
    from backend.models.refund_model import RefundRequest
    
    service = RefundService()
    request = RefundRequest(
        transaction_id=TEST_TRANSACTION_ID,
        message="Need refund"
    )
    
    # Create refund
    refund = service.create_refund_request(request, TEST_CUSTOMER_ID)
    
    # Approve refund
    approved = service.approve_refund(refund.refund_id)
    
    assert approved.status == "approved"
    assert approved.updated_at is not None
    
    # Check transaction status updated
    transactions_file = Path("backend/data/transactions.json")
    with open(transactions_file, 'r') as f:
        transactions = json.load(f)
    
    user_transactions = transactions.get(TEST_CUSTOMER_ID, [])
    transaction = next(t for t in user_transactions if t.get("transaction_id") == TEST_TRANSACTION_ID)
    assert transaction.get("status") == "refunded"


@pytest.mark.unit
def test_deny_refund_service():
    """Test denying refund through service layer"""
    from backend.models.refund_model import RefundRequest
    
    service = RefundService()
    request = RefundRequest(
        transaction_id=TEST_TRANSACTION_ID,
        message="Want my money back"
    )
    
    # Create refund
    refund = service.create_refund_request(request, TEST_CUSTOMER_ID)
    
    # Deny refund
    denied = service.deny_refund(refund.refund_id)
    
    assert denied.status == "denied"
    assert denied.updated_at is not None


# ==================== INTEGRATION TESTS ====================

@pytest.mark.integration
def test_customer_create_refund_request():
    """Test customer can create refund request via API"""
    response = client.post(
        "/refunds",
        headers={"user-token": TEST_CUSTOMER_TOKEN},
        json={
            "transaction_id": TEST_TRANSACTION_ID,
            "message": "Product is defective"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Refund request created successfully"
    assert data["refund"]["transaction_id"] == TEST_TRANSACTION_ID
    assert data["refund"]["status"] == "pending"


@pytest.mark.integration
def test_customer_cannot_create_duplicate_refund():
    """Test customer cannot create duplicate refund request"""
    # Create first refund
    client.post(
        "/refunds",
        headers={"user-token": TEST_CUSTOMER_TOKEN},
        json={
            "transaction_id": TEST_TRANSACTION_ID,
            "message": "First request"
        }
    )
    
    # Try duplicate
    response = client.post(
        "/refunds",
        headers={"user-token": TEST_CUSTOMER_TOKEN},
        json={
            "transaction_id": TEST_TRANSACTION_ID,
            "message": "Second request"
        }
    )
    
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


@pytest.mark.integration
def test_customer_cannot_refund_nonexistent_transaction():
    """Test customer cannot create refund for transaction that doesn't exist"""
    response = client.post(
        "/refunds",
        headers={"user-token": TEST_CUSTOMER_TOKEN},
        json={
            "transaction_id": "fake-transaction-id",
            "message": "This won't work"
        }
    )
    
    assert response.status_code == 404


@pytest.mark.integration
def test_unauthenticated_cannot_create_refund():
    """Test unauthenticated user cannot create refund"""
    response = client.post(
        "/refunds",
        json={
            "transaction_id": TEST_TRANSACTION_ID,
            "message": "No auth"
        }
    )
    
    assert response.status_code == 401


@pytest.mark.integration
def test_admin_view_all_refunds():
    """Test admin can view all refund requests"""
    # Create a refund first
    client.post(
        "/refunds",
        headers={"user-token": TEST_CUSTOMER_TOKEN},
        json={
            "transaction_id": TEST_TRANSACTION_ID,
            "message": "Need refund"
        }
    )
    
    # Admin views all
    response = client.get(
        "/refunds/all",
        headers={"user-token": TEST_ADMIN_TOKEN}
    )
    
    assert response.status_code == 200
    refunds = response.json()
    assert len(refunds) == 1
    assert refunds[0]["transaction_id"] == TEST_TRANSACTION_ID


@pytest.mark.integration
def test_customer_cannot_view_all_refunds():
    """Test customer cannot view all refund requests (admin only)"""
    response = client.get(
        "/refunds/all",
        headers={"user-token": TEST_CUSTOMER_TOKEN}
    )
    
    assert response.status_code == 403


@pytest.mark.integration
def test_customer_view_own_refunds():
    """Test customer can view their own refund requests"""
    # Create a refund
    client.post(
        "/refunds",
        headers={"user-token": TEST_CUSTOMER_TOKEN},
        json={
            "transaction_id": TEST_TRANSACTION_ID,
            "message": "I want my money back"
        }
    )
    
    # View own refunds
    response = client.get(
        "/refunds/my-requests",
        headers={"user-token": TEST_CUSTOMER_TOKEN}
    )
    
    assert response.status_code == 200
    refunds = response.json()
    assert len(refunds) == 1
    assert refunds[0]["user_id"] == TEST_CUSTOMER_ID


@pytest.mark.integration
def test_admin_approve_refund():
    """Test admin can approve refund request"""
    # Create refund
    create_response = client.post(
        "/refunds",
        headers={"user-token": TEST_CUSTOMER_TOKEN},
        json={
            "transaction_id": TEST_TRANSACTION_ID,
            "message": "Approve this please"
        }
    )
    refund_id = create_response.json()["refund"]["refund_id"]
    
    # Admin approves
    response = client.put(
        f"/refunds/{refund_id}/approve",
        headers={"user-token": TEST_ADMIN_TOKEN}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Refund approved successfully"
    assert data["refund"]["status"] == "approved"


@pytest.mark.integration
def test_admin_deny_refund():
    """Test admin can deny refund request"""
    # Create refund
    create_response = client.post(
        "/refunds",
        headers={"user-token": TEST_CUSTOMER_TOKEN},
        json={
            "transaction_id": TEST_TRANSACTION_ID,
            "message": "Deny this"
        }
    )
    refund_id = create_response.json()["refund"]["refund_id"]
    
    # Admin denies
    response = client.put(
        f"/refunds/{refund_id}/deny",
        headers={"user-token": TEST_ADMIN_TOKEN}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Refund denied"
    assert data["refund"]["status"] == "denied"


@pytest.mark.integration
def test_customer_cannot_approve_refund():
    """Test customer cannot approve refund (admin only)"""
    # Create refund
    create_response = client.post(
        "/refunds",
        headers={"user-token": TEST_CUSTOMER_TOKEN},
        json={
            "transaction_id": TEST_TRANSACTION_ID,
            "message": "Customer shouldn't approve"
        }
    )
    refund_id = create_response.json()["refund"]["refund_id"]
    
    # Customer tries to approve
    response = client.put(
        f"/refunds/{refund_id}/approve",
        headers={"user-token": TEST_CUSTOMER_TOKEN}
    )
    
    assert response.status_code == 403


@pytest.mark.integration
def test_cannot_approve_already_processed_refund():
    """Test cannot approve refund that's already been approved or denied"""
    # Create and approve refund
    create_response = client.post(
        "/refunds",
        headers={"user-token": TEST_CUSTOMER_TOKEN},
        json={
            "transaction_id": TEST_TRANSACTION_ID,
            "message": "First approval"
        }
    )
    refund_id = create_response.json()["refund"]["refund_id"]
    
    client.put(
        f"/refunds/{refund_id}/approve",
        headers={"user-token": TEST_ADMIN_TOKEN}
    )
    
    # Try to approve again
    response = client.put(
        f"/refunds/{refund_id}/approve",
        headers={"user-token": TEST_ADMIN_TOKEN}
    )
    
    assert response.status_code == 400
    assert "already approved" in response.json()["detail"]


@pytest.mark.integration
def test_transaction_status_updated_on_approval():
    """Test transaction status changes to 'refunded' when refund is approved"""
    # Create and approve refund
    create_response = client.post(
        "/refunds",
        headers={"user-token": TEST_CUSTOMER_TOKEN},
        json={
            "transaction_id": TEST_TRANSACTION_ID,
            "message": "Check transaction status"
        }
    )
    refund_id = create_response.json()["refund"]["refund_id"]
    
    client.put(
        f"/refunds/{refund_id}/approve",
        headers={"user-token": TEST_ADMIN_TOKEN}
    )
    
    # Check transaction status
    transactions_file = Path("backend/data/transactions.json")
    with open(transactions_file, 'r') as f:
        transactions = json.load(f)
    
    user_transactions = transactions.get(TEST_CUSTOMER_ID, [])
    transaction = next(t for t in user_transactions if t.get("transaction_id") == TEST_TRANSACTION_ID)
    
    assert transaction.get("status") == "refunded"
