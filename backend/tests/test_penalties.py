"""
Tests for penalty endpoints and service

This file contains:
- UNIT TESTS: Test the penalty service logic in isolation
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
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.penalty_service import PenaltyService
from backend.models.penalty_model import Penalty

# Test file paths
TEST_DB_PATH_USERS = "backend/data/users.json"
TEST_DB_PATH_PENALTIES = "backend/data/penalties.json"

# Test client for integration tests
client = TestClient(app)

# Test user IDs for testing
TEST_USER_ID_1 = "00000000-0000-0000-0000-000000000201"
TEST_USER_ID_2 = "00000000-0000-0000-0000-000000000202"
TEST_ADMIN_USER_ID = "00000000-0000-0000-0000-000000000203"


# ============================================================================
# UNIT TESTS - Testing PenaltyService in isolation
# ============================================================================

class TestPenaltyServiceUnit:
    """UNIT TESTS: Test PenaltyService business logic without API layer"""
    
    @pytest.fixture(scope="function", autouse=True)
    def setup_test_repository(self, tmp_path):
        """Create test service (repository created internally)"""
        # Service creates its own PenaltyRepository internally
        self.service = PenaltyService()
        
        # Clean up penalties file
        penalties_file = Path("backend/data/penalties.json")
        if penalties_file.exists():
            penalties_file.unlink()
        
        yield
        
        # Cleanup after test
        if penalties_file.exists():
            penalties_file.unlink()
    
    def test_apply_penalty_success(self):
        """UNIT TEST: Apply penalty creates valid penalty record"""
        user_id = str(uuid.uuid4())
        reason = "Late payment violation"
        
        # Apply penalty
        penalty = self.service.apply_penalty(user_id=user_id, reason=reason)
        
        # Verify penalty object structure
        assert penalty.penalty_id is not None
        assert len(penalty.penalty_id) > 0
        assert penalty.user_id == user_id
        assert penalty.reason == reason
        assert penalty.timestamp is not None
        
        # Verify timestamp is valid ISO format
        datetime.fromisoformat(penalty.timestamp.replace('Z', '+00:00'))
        
        # Verify penalty was saved to file
        penalties_file = Path("backend/data/penalties.json")
        assert penalties_file.exists()
        with open(penalties_file) as f:
            saved_penalties = json.load(f)
        assert len(saved_penalties) == 1
        assert saved_penalties[0]["penalty_id"] == penalty.penalty_id
        assert saved_penalties[0]["user_id"] == user_id
        assert saved_penalties[0]["reason"] == reason
    
    def test_apply_penalty_empty_user_id(self):
        """UNIT TEST: Apply penalty with empty user_id raises ValueError"""
        with pytest.raises(ValueError, match="user_id cannot be empty"):
            self.service.apply_penalty(user_id="", reason="Some reason")
        
        with pytest.raises(ValueError, match="user_id cannot be empty"):
            self.service.apply_penalty(user_id="   ", reason="Some reason")
    
    def test_apply_penalty_empty_reason(self):
        """UNIT TEST: Apply penalty with empty reason raises ValueError"""
        user_id = str(uuid.uuid4())
        
        with pytest.raises(ValueError, match="reason cannot be empty"):
            self.service.apply_penalty(user_id=user_id, reason="")
        
        with pytest.raises(ValueError, match="reason cannot be empty"):
            self.service.apply_penalty(user_id=user_id, reason="   ")


# ============================================================================
# INTEGRATION TESTS - Testing full API endpoints with database
# ============================================================================

class TestPenaltyAPIIntegration:
    """INTEGRATION TESTS: Test full API endpoints with database interactions"""
    
    @pytest.fixture(scope="function", autouse=True)
    def setup_test_env(self):
        """Setup test environment before each test"""
        # Ensure directories exist
        users_dir = os.path.dirname(TEST_DB_PATH_USERS)
        penalties_dir = os.path.dirname(TEST_DB_PATH_PENALTIES)
        
        if users_dir:
            os.makedirs(users_dir, exist_ok=True)
        if penalties_dir:
            os.makedirs(penalties_dir, exist_ok=True)
        
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
        
        # Create test regular users
        user1_token = self._gen_token()
        user1 = {
            "user_id": TEST_USER_ID_1,
            "name": "Test User 1",
            "email": "user1@test.com",
            "password_hash": self._hash("UserPass1"),
            "user_token": user1_token,
            "role": "customer"
        }
        
        user2_token = self._gen_token()
        user2 = {
            "user_id": TEST_USER_ID_2,
            "name": "Test User 2",
            "email": "user2@test.com",
            "password_hash": self._hash("UserPass2"),
            "user_token": user2_token,
            "role": "customer"
        }
        
        # Save users
        users = [admin_user, user1, user2]
        with open(TEST_DB_PATH_USERS, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
        
        # Clear penalties file
        with open(TEST_DB_PATH_PENALTIES, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)
        
        # Store tokens for use in tests
        self.admin_token = admin_token
        self.user1_token = user1_token
        self.user2_token = user2_token
        
        yield
        
        # Cleanup after test
        # Remove test users
        if os.path.exists(TEST_DB_PATH_USERS):
            with open(TEST_DB_PATH_USERS, "r", encoding="utf-8") as f:
                try:
                    users = json.load(f)
                except json.JSONDecodeError:
                    users = []
            
            test_user_ids = {TEST_ADMIN_USER_ID, TEST_USER_ID_1, TEST_USER_ID_2}
            users = [u for u in users if u.get("user_id") not in test_user_ids]
            
            with open(TEST_DB_PATH_USERS, "w", encoding="utf-8") as f:
                json.dump(users, f, indent=2)
        
        # Clear test penalties
        if os.path.exists(TEST_DB_PATH_PENALTIES):
            with open(TEST_DB_PATH_PENALTIES, "r", encoding="utf-8") as f:
                try:
                    penalties = json.load(f)
                except json.JSONDecodeError:
                    penalties = []
            
            # Remove penalties for test users
            test_user_ids = {TEST_ADMIN_USER_ID, TEST_USER_ID_1, TEST_USER_ID_2}
            penalties = [p for p in penalties if p.get("user_id") not in test_user_ids]
            
            with open(TEST_DB_PATH_PENALTIES, "w", encoding="utf-8") as f:
                json.dump(penalties, f, indent=2)
    
    def _gen_token(self, n=28):
        """Helper: Generate random token"""
        alphabet = string.ascii_letters + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(n))
    
    def _hash(self, password: str) -> str:
        """Helper: Hash password with bcrypt"""
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    def test_apply_penalty_success_integration(self):
        """INTEGRATION TEST: Admin can successfully apply penalty via API"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response = client.post(
            "/penalties/apply",
            json={
                "user_id": TEST_USER_ID_1,
                "reason": "Late payment violation"
            },
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "message" in data
        assert data["message"] == "Penalty applied successfully"
        assert "penalty" in data
        
        # Verify penalty details
        penalty = data["penalty"]
        assert "penalty_id" in penalty
        assert penalty["user_id"] == TEST_USER_ID_1
        assert penalty["reason"] == "Late payment violation"
        assert "timestamp" in penalty
        
        # Verify penalty was saved to file
        with open(TEST_DB_PATH_PENALTIES, "r", encoding="utf-8") as f:
            penalties = json.load(f)
        
        assert len(penalties) == 1
        assert penalties[0]["penalty_id"] == penalty["penalty_id"]
        assert penalties[0]["user_id"] == TEST_USER_ID_1
    
    def test_apply_penalty_forbidden_for_customer(self):
        """INTEGRATION TEST: Non-admin user cannot apply penalties"""
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        
        response = client.post(
            "/penalties/apply",
            json={
                "user_id": TEST_USER_ID_2,
                "reason": "Some reason"
            },
            headers=headers
        )
        
        assert response.status_code == 403
        assert "admin" in response.json()["detail"].lower()
    
    def test_apply_penalty_empty_user_id_integration(self):
        """INTEGRATION TEST: Apply penalty with empty user_id returns 400"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response = client.post(
            "/penalties/apply",
            json={
                "user_id": "",
                "reason": "Some reason"
            },
            headers=headers
        )
        
        assert response.status_code == 400
        assert "user_id cannot be empty" in response.json()["detail"]
