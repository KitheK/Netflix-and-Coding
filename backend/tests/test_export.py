"""Tests for Export functionality (admin only)"""

import pytest
import json
import os
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.export_service import ExportService

client = TestClient(app)

# Test data directory
TEST_DATA_DIR = "backend/data"


@pytest.fixture
def admin_headers():
    """Create admin user and return auth headers"""
    # Create admin user in test DB
    users_file = os.path.join(TEST_DATA_DIR, "users.json")
    admin_user = {
        "user_id": "admin-test-id",
        "name": "Admin Test",
        "email": "admin@test.com",
        "password_hash": "$2b$12$testhashedpassword",
        "user_token": "admin_test_token_123456789012",
        "role": "admin"
    }
    
    # Save admin user (append if file exists)
    if os.path.exists(users_file):
        with open(users_file, 'r') as f:
            users = json.load(f)
    else:
        users = []
    
    users.append(admin_user)
    with open(users_file, 'w') as f:
        json.dump(users, f, indent=2)
    
    yield {"Authorization": f"Bearer {admin_user['user_token']}"}
    
    # Cleanup: remove admin user after test
    with open(users_file, 'r') as f:
        users = json.load(f)
    users = [u for u in users if u["user_id"] != "admin-test-id"]
    with open(users_file, 'w') as f:
        json.dump(users, f, indent=2)


@pytest.fixture
def customer_headers():
    """Create customer user and return auth headers"""
    users_file = os.path.join(TEST_DATA_DIR, "users.json")
    customer_user = {
        "user_id": "customer-test-id",
        "name": "Customer Test",
        "email": "customer@test.com",
        "password_hash": "$2b$12$testhashedpassword",
        "user_token": "customer_test_token_12345678",
        "role": "customer"
    }
    
    if os.path.exists(users_file):
        with open(users_file, 'r') as f:
            users = json.load(f)
    else:
        users = []
    
    users.append(customer_user)
    with open(users_file, 'w') as f:
        json.dump(users, f, indent=2)
    
    yield {"Authorization": f"Bearer {customer_user['user_token']}"}
    
    # Cleanup
    with open(users_file, 'r') as f:
        users = json.load(f)
    users = [u for u in users if u["user_id"] != "customer-test-id"]
    with open(users_file, 'w') as f:
        json.dump(users, f, indent=2)


# ============================================================================
# UNIT TESTS - ExportService
# ============================================================================

@pytest.mark.unit
def test_export_service_get_available_files():
    """Unit test: ExportService returns list of available files"""
    service = ExportService()
    available = service.get_available_files()
    
    assert isinstance(available, list)
    assert len(available) == 6
    assert "users" in available
    assert "products" in available
    assert "cart" in available
    assert "transactions" in available
    assert "reviews" in available
    assert "penalties" in available


@pytest.mark.unit
def test_export_service_export_valid_file():
    """Unit test: ExportService can export a valid file"""
    service = ExportService()
    
    # Export users file (should exist)
    result = service.export_file("users")
    
    assert result is not None
    assert "file_key" in result
    assert "filename" in result
    assert "data" in result
    assert "exported_at" in result
    assert result["file_key"] == "users"
    assert result["filename"] == "users.json"


@pytest.mark.unit
def test_export_service_invalid_file_key():
    """Unit test: ExportService raises error for invalid file key"""
    service = ExportService()
    
    with pytest.raises(ValueError, match="Invalid file key"):
        service.export_file("invalid_file")


@pytest.mark.unit
def test_export_service_generate_filename():
    """Unit test: ExportService generates timestamped filename"""
    service = ExportService()
    filename = service.generate_export_filename("users")
    
    assert filename.startswith("users_export_")
    assert filename.endswith(".json")
    assert len(filename) > len("users_export_.json")  # Has timestamp


# ============================================================================
# INTEGRATION TESTS - Export Router
# ============================================================================

@pytest.mark.integration
def test_admin_can_export_users(admin_headers):
    """Integration test: Admin can export users.json"""
    response = client.get("/export?file=users", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert "file_key" in data
    assert "data" in data
    assert data["file_key"] == "users"


@pytest.mark.integration
def test_admin_can_export_products(admin_headers):
    """Integration test: Admin can export products.json"""
    response = client.get("/export?file=products", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["file_key"] == "products"
    assert "data" in data


@pytest.mark.integration
def test_admin_can_export_cart(admin_headers):
    """Integration test: Admin can export cart.json"""
    response = client.get("/export?file=cart", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["file_key"] == "cart"


@pytest.mark.integration
def test_admin_can_export_transactions(admin_headers):
    """Integration test: Admin can export transactions.json"""
    response = client.get("/export?file=transactions", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["file_key"] == "transactions"


@pytest.mark.integration
def test_admin_can_export_reviews(admin_headers):
    """Integration test: Admin can export reviews.json"""
    response = client.get("/export?file=reviews", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["file_key"] == "reviews"


@pytest.mark.integration
def test_admin_can_export_penalties(admin_headers):
    """Integration test: Admin can export penalties.json"""
    response = client.get("/export?file=penalties", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["file_key"] == "penalties"


@pytest.mark.integration
def test_customer_cannot_export(customer_headers):
    """Integration test: Customer (non-admin) cannot export files"""
    response = client.get("/export?file=users", headers=customer_headers)
    
    assert response.status_code == 403
    assert "admin" in response.json()["detail"].lower()


@pytest.mark.integration
def test_export_without_auth():
    """Integration test: Cannot export without authentication"""
    response = client.get("/export?file=users")
    
    assert response.status_code == 401


@pytest.mark.integration
def test_export_invalid_file_key(admin_headers):
    """Integration test: Export with invalid file key returns 400"""
    response = client.get("/export?file=invalid_file", headers=admin_headers)
    
    assert response.status_code == 400
    assert "Invalid file key" in response.json()["detail"]


@pytest.mark.integration
def test_export_response_headers(admin_headers):
    """Integration test: Export response includes download headers"""
    response = client.get("/export?file=users", headers=admin_headers)
    
    assert response.status_code == 200
    assert "content-disposition" in response.headers
    assert "attachment" in response.headers["content-disposition"]
    assert "users_export_" in response.headers["content-disposition"]
    assert ".json" in response.headers["content-disposition"]


@pytest.mark.integration
def test_export_data_contents_correct(admin_headers):
    """Integration test: Exported data matches actual file contents"""
    # Read actual file
    with open(os.path.join(TEST_DATA_DIR, "users.json"), 'r') as f:
        actual_data = json.load(f)
    
    # Export via API
    response = client.get("/export?file=users", headers=admin_headers)
    exported_data = response.json()["data"]
    
    # Compare
    assert exported_data == actual_data


@pytest.mark.integration
def test_get_available_exports_admin(admin_headers):
    """Integration test: Admin can get list of available exports"""
    response = client.get("/export/available", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert "available_files" in data
    assert len(data["available_files"]) == 6


@pytest.mark.integration
def test_get_available_exports_customer(customer_headers):
    """Integration test: Customer cannot get list of available exports"""
    response = client.get("/export/available", headers=customer_headers)
    
    assert response.status_code == 403
