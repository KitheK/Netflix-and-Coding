"""
Tests for metrics endpoints and service

This file contains:
- UNIT TESTS: Test the metrics service logic in isolation
- INTEGRATION TESTS: Test the full API endpoints with database interactions
"""

import os
import json
import uuid
import secrets
import string
import bcrypt
import pytest
from pathlib import Path
from unittest.mock import Mock
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.metrics_service import MetricsService

# Test file paths
TEST_DB_PATH_USERS = "backend/data/users.json"
TEST_DB_PATH_TRANSACTIONS = "backend/data/transactions.json"

# Test client for integration tests
client = TestClient(app)

# Test user IDs for testing
TEST_ADMIN_USER_ID = "00000000-0000-0000-0000-000000000301"
TEST_USER_ID_1 = "00000000-0000-0000-0000-000000000302"

# ============================================================================
# UNIT TESTS - Testing MetricsService in isolation
# ============================================================================
class TestMetricsServiceUnit:
    """UNIT TESTS: Test MetricsService business logic without API layer"""
    
    def setup_method(self):
        """Set up test mocks before each test method"""
        self.service = MetricsService()
        self.service.transaction_repository = Mock()
        self.service.user_repository = Mock()
        self.service.product_repository = Mock()
    
    @pytest.mark.unit
    def test_get_category_metrics_single_transaction(self):
        """UNIT TEST: Calculates metrics for a single transaction"""
        product_id = "B07JW9H4J1"
        user_id = str(uuid.uuid4())
        
        transactions_data = {
            user_id: [{
                "transaction_id": str(uuid.uuid4()),
                "user_id": user_id,
                "customer_name": "Test User",
                "customer_email": "test@example.com",
                "items": [{
                    "product_id": product_id,
                    "product_name": "Test Product",
                    "img_link": "https://example.com/img.jpg",
                    "product_link": "https://example.com/product",
                    "discounted_price": 100.0,
                    "quantity": 2
                }],
                "total_price": 200.0,
                "timestamp": "2025-01-01T10:00:00+00:00",
                "estimated_delivery": "2025-01-05",
                "status": "completed"
            }]
        }
        
        products_data = [{
            "product_id": product_id,
            "product_name": "Test Product",
            "category": "Electronics|Cables",
            "discounted_price": 100.0,
            "actual_price": 200.0,
            "discount_percentage": 50.0,
            "about_product": "Test product",
            "img_link": "https://example.com/img.jpg",
            "product_link": "https://example.com/product",
            "rating": 4.5
        }]
        
        self.service.transaction_repository.get_all.return_value = transactions_data
        self.service.user_repository.get_all.return_value = []
        self.service.product_repository.get_all.return_value = products_data
        
        metrics = self.service.get_category_metrics()
        
        assert metrics["summary"]["total_revenue"] == 200.0
        assert metrics["summary"]["total_transactions"] == 1
        assert "Electronics|Cables" in metrics["categories"]
        assert metrics["most_purchased_products"][0]["product_id"] == product_id
    
    @pytest.mark.unit
    def test_get_chart_data_top_products(self):
        """UNIT TEST: Correctly calculates top products by sales"""
        user_id = str(uuid.uuid4())
        product1_id = "B07JW9H4J1"
        product2_id = "B08KT5LMRX"
        
        transactions_data = {
            user_id: [{
                "transaction_id": str(uuid.uuid4()),
                "user_id": user_id,
                "customer_name": "Test User",
                "customer_email": "test@example.com",
                "items": [
                    {
                        "product_id": product1_id,
                        "product_name": "Product 1",
                        "img_link": "https://example.com/img.jpg",
                        "product_link": "https://example.com/product",
                        "discounted_price": 100.0,
                        "quantity": 5
                    },
                    {
                        "product_id": product2_id,
                        "product_name": "Product 2",
                        "img_link": "https://example.com/img2.jpg",
                        "product_link": "https://example.com/product2",
                        "discounted_price": 200.0,
                        "quantity": 10
                    }
                ],
                "total_price": 2500.0,
                "timestamp": "2025-01-01T10:00:00+00:00",
                "estimated_delivery": "2025-01-05",
                "status": "completed"
            }]
        }
        
        products_data = [
            {
                "product_id": product1_id,
                "product_name": "Product 1",
                "category": "Electronics|Cables",
                "discounted_price": 100.0,
                "actual_price": 200.0,
                "discount_percentage": 50.0,
                "about_product": "Test product",
                "img_link": "https://example.com/img.jpg",
                "product_link": "https://example.com/product",
                "rating": 4.5
            },
            {
                "product_id": product2_id,
                "product_name": "Product 2",
                "category": "Electronics|TVs",
                "discounted_price": 200.0,
                "actual_price": 400.0,
                "discount_percentage": 50.0,
                "about_product": "Test product",
                "img_link": "https://example.com/img2.jpg",
                "product_link": "https://example.com/product2",
                "rating": 4.8
            }
        ]
        
        self.service.transaction_repository.get_all.return_value = transactions_data
        self.service.user_repository.get_all.return_value = []
        self.service.product_repository.get_all.return_value = products_data
        
        chart_data = self.service.get_chart_data()
        
        assert chart_data["top_products_by_sales"][0]["product_name"] == "Product 2"
        assert chart_data["top_products_by_sales"][0]["sales"] == 10
        assert chart_data["top_products_by_sales"][1]["sales"] == 5


# ============================================================================
# INTEGRATION TESTS - Testing full API endpoints with database
# ============================================================================

class TestMetricsAPIIntegration:
    """INTEGRATION TESTS: Test full API endpoints with database interactions"""
    
    @pytest.fixture(scope="function", autouse=True)
    def setup_test_env(self):
        """Setup test environment before each test"""
        users_dir = os.path.dirname(TEST_DB_PATH_USERS)
        transactions_dir = os.path.dirname(TEST_DB_PATH_TRANSACTIONS)
        
        if users_dir:
            os.makedirs(users_dir, exist_ok=True)
        if transactions_dir:
            os.makedirs(transactions_dir, exist_ok=True)
        
        # Create test admin user
        admin_token = self._gen_token()
        admin_user = {
            "user_id": TEST_ADMIN_USER_ID,
            "name": "Test Admin",
            "email": "admin@test.com",
            "password_hash": self._hash("AdminPass1"),
            "user_token": admin_token,
            "role": "admin"
        }
        
        # Create test customer user
        customer_token = self._gen_token()
        customer_user = {
            "user_id": TEST_USER_ID_1,
            "name": "Test Customer",
            "email": "customer@test.com",
            "password_hash": self._hash("CustomerPass1"),
            "user_token": customer_token,
            "role": "customer"
        }
        
        users = [admin_user, customer_user]
        with open(TEST_DB_PATH_USERS, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
        
        # Create test transactions
        transactions_data = {
            TEST_USER_ID_1: [{
                "transaction_id": str(uuid.uuid4()),
                "user_id": TEST_USER_ID_1,
                "customer_name": "Test Customer",
                "customer_email": "customer@test.com",
                "items": [{
                    "product_id": "B07JW9H4J1",
                    "product_name": "Test Product",
                    "img_link": "https://example.com/img.jpg",
                    "product_link": "https://example.com/product",
                    "discounted_price": 100.0,
                    "quantity": 2
                }],
                "total_price": 200.0,
                "timestamp": "2025-01-01T10:00:00+00:00",
                "estimated_delivery": "2025-01-05",
                "status": "completed"
            }]
        }
        
        with open(TEST_DB_PATH_TRANSACTIONS, "w", encoding="utf-8") as f:
            json.dump(transactions_data, f, indent=2)
        
        self.admin_token = admin_token
        self.customer_token = customer_token
        
        yield
        
        # Cleanup
        if os.path.exists(TEST_DB_PATH_USERS):
            with open(TEST_DB_PATH_USERS, "r", encoding="utf-8") as f:
                try:
                    users = json.load(f)
                except json.JSONDecodeError:
                    users = []
            
            test_user_ids = {TEST_ADMIN_USER_ID, TEST_USER_ID_1}
            users = [u for u in users if u.get("user_id") not in test_user_ids]
            
            with open(TEST_DB_PATH_USERS, "w", encoding="utf-8") as f:
                json.dump(users, f, indent=2)
        
        if os.path.exists(TEST_DB_PATH_TRANSACTIONS):
            with open(TEST_DB_PATH_TRANSACTIONS, "r", encoding="utf-8") as f:
                try:
                    transactions = json.load(f)
                except json.JSONDecodeError:
                    transactions = {}
            
            test_user_ids = {TEST_ADMIN_USER_ID, TEST_USER_ID_1}
            transactions = {k: v for k, v in transactions.items() if k not in test_user_ids}
            
            with open(TEST_DB_PATH_TRANSACTIONS, "w", encoding="utf-8") as f:
                json.dump(transactions, f, indent=2)
    
    def _gen_token(self, n=28):
        """Helper: Generate random token"""
        alphabet = string.ascii_letters + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(n))
    
    def _hash(self, password: str) -> str:
        """Helper: Hash password with bcrypt"""
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    @pytest.mark.integration
    def test_get_category_metrics_success(self):
        """INTEGRATION TEST: Admin can successfully get category metrics"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response = client.get("/admin/metrics/product/category", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "summary" in data
        assert "categories" in data
        assert "most_purchased_products" in data
        assert "total_revenue" in data["summary"]
        assert "total_transactions" in data["summary"]
    
    @pytest.mark.integration
    def test_get_chart_data_success(self):
        """INTEGRATION TEST: Admin can successfully get chart data"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response = client.get("/admin/metrics/product/charts", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "top_products_by_sales" in data
        assert "category_distribution" in data
        assert "new_vs_returning_users" in data
        assert isinstance(data["top_products_by_sales"], list)
        assert len(data["new_vs_returning_users"]) == 2
