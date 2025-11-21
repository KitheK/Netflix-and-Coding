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
from backend.repositories.json_repository import JsonRepository
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
        """Create a temporary repository for isolated unit tests"""
        # Create temporary data directory
        test_data_dir = tmp_path / "test_data"
        test_data_dir.mkdir()
        
        # Create JsonRepository with test directory
        self.repository = JsonRepository(data_dir=str(test_data_dir))
        self.service = PenaltyService(self.repository)
        
        # Clean up penalties file
        penalties_file = test_data_dir / "penalties.json"
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
        saved_penalties = self.repository.load("penalties.json")
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
    
    def test_apply_penalty_generates_unique_ids(self):
        """UNIT TEST: Multiple penalties have unique penalty_ids"""
        user_id = str(uuid.uuid4())
        
        penalty1 = self.service.apply_penalty(user_id=user_id, reason="Reason 1")
        penalty2 = self.service.apply_penalty(user_id=user_id, reason="Reason 2")
        
        assert penalty1.penalty_id != penalty2.penalty_id
    
    def test_apply_penalty_appends_to_existing(self):
        """UNIT TEST: New penalties are appended to existing penalties list"""
        user_id = str(uuid.uuid4())
        
        # Apply first penalty
        penalty1 = self.service.apply_penalty(user_id=user_id, reason="First reason")
        
        # Apply second penalty
        penalty2 = self.service.apply_penalty(user_id=user_id, reason="Second reason")
        
        # Verify both are in file
        saved_penalties = self.repository.load("penalties.json")
        assert len(saved_penalties) == 2
        assert saved_penalties[0]["penalty_id"] == penalty1.penalty_id
        assert saved_penalties[1]["penalty_id"] == penalty2.penalty_id
    
    def test_get_user_penalties_empty(self):
        """UNIT TEST: Get penalties for user with no penalties returns empty list"""
        user_id = str(uuid.uuid4())
        
        penalties = self.service.get_user_penalties(user_id)
        
        assert penalties == []
        assert isinstance(penalties, list)
    
    def test_get_user_penalties_filters_by_user(self):
        """UNIT TEST: get_user_penalties only returns penalties for specified user"""
        user_id_1 = str(uuid.uuid4())
        user_id_2 = str(uuid.uuid4())
        
        # Apply penalties for both users
        penalty1 = self.service.apply_penalty(user_id=user_id_1, reason="User 1 penalty")
        penalty2 = self.service.apply_penalty(user_id=user_id_2, reason="User 2 penalty")
        penalty3 = self.service.apply_penalty(user_id=user_id_1, reason="User 1 second penalty")
        
        # Get penalties for user 1
        user1_penalties = self.service.get_user_penalties(user_id_1)
        
        # Verify only user 1's penalties are returned
        assert len(user1_penalties) == 2
        assert all(p.user_id == user_id_1 for p in user1_penalties)
        assert user1_penalties[0].penalty_id == penalty3.penalty_id  # Newest first
        assert user1_penalties[1].penalty_id == penalty1.penalty_id
    
    def test_get_user_penalties_sorted_newest_first(self):
        """UNIT TEST: get_user_penalties returns penalties sorted by timestamp, newest first"""
        user_id = str(uuid.uuid4())
        
        # Apply multiple penalties with slight delay
        penalty1 = self.service.apply_penalty(user_id=user_id, reason="First")
        import time
        time.sleep(0.01)  # Small delay to ensure different timestamps
        penalty2 = self.service.apply_penalty(user_id=user_id, reason="Second")
        time.sleep(0.01)
        penalty3 = self.service.apply_penalty(user_id=user_id, reason="Third")
        
        # Get penalties
        penalties = self.service.get_user_penalties(user_id)
        
        # Verify sorted newest first
        assert len(penalties) == 3
        assert penalties[0].penalty_id == penalty3.penalty_id
        assert penalties[1].penalty_id == penalty2.penalty_id
        assert penalties[2].penalty_id == penalty1.penalty_id


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
    
    def test_apply_penalty_no_auth(self):
        """INTEGRATION TEST: Applying penalty without authentication returns 401"""
        response = client.post(
            "/penalties/apply",
            json={
                "user_id": TEST_USER_ID_1,
                "reason": "Some reason"
            }
        )
        
        assert response.status_code == 401
    
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
    
    def test_apply_penalty_empty_reason_integration(self):
        """INTEGRATION TEST: Apply penalty with empty reason returns 400"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response = client.post(
            "/penalties/apply",
            json={
                "user_id": TEST_USER_ID_1,
                "reason": ""
            },
            headers=headers
        )
        
        assert response.status_code == 400
        assert "reason cannot be empty" in response.json()["detail"]
    
    def test_apply_penalty_multiple_penalties_integration(self):
        """INTEGRATION TEST: Admin can apply multiple penalties to same user"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Apply first penalty
        response1 = client.post(
            "/penalties/apply",
            json={
                "user_id": TEST_USER_ID_1,
                "reason": "First violation"
            },
            headers=headers
        )
        
        assert response1.status_code == 200
        penalty1_id = response1.json()["penalty"]["penalty_id"]
        
        # Apply second penalty
        response2 = client.post(
            "/penalties/apply",
            json={
                "user_id": TEST_USER_ID_1,
                "reason": "Second violation"
            },
            headers=headers
        )
        
        assert response2.status_code == 200
        penalty2_id = response2.json()["penalty"]["penalty_id"]
        
        # Verify both penalties have different IDs
        assert penalty1_id != penalty2_id
        
        # Verify both are saved
        with open(TEST_DB_PATH_PENALTIES, "r", encoding="utf-8") as f:
            penalties = json.load(f)
        
        assert len(penalties) == 2
        penalty_ids = {p["penalty_id"] for p in penalties}
        assert penalty1_id in penalty_ids
        assert penalty2_id in penalty_ids
    
    def test_apply_penalty_different_users_integration(self):
        """INTEGRATION TEST: Admin can apply penalties to different users"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Apply penalty to user 1
        response1 = client.post(
            "/penalties/apply",
            json={
                "user_id": TEST_USER_ID_1,
                "reason": "User 1 violation"
            },
            headers=headers
        )
        
        assert response1.status_code == 200
        
        # Apply penalty to user 2
        response2 = client.post(
            "/penalties/apply",
            json={
                "user_id": TEST_USER_ID_2,
                "reason": "User 2 violation"
            },
            headers=headers
        )
        
        assert response2.status_code == 200
        
        # Verify both penalties are saved
        with open(TEST_DB_PATH_PENALTIES, "r", encoding="utf-8") as f:
            penalties = json.load(f)
        
        assert len(penalties) == 2
        user_ids = {p["user_id"] for p in penalties}
        assert TEST_USER_ID_1 in user_ids
        assert TEST_USER_ID_2 in user_ids
    
    def test_apply_penalty_timestamp_format_integration(self):
        """INTEGRATION TEST: Penalty timestamp is valid ISO format"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response = client.post(
            "/penalties/apply",
            json={
                "user_id": TEST_USER_ID_1,
                "reason": "Test penalty"
            },
            headers=headers
        )
        
        assert response.status_code == 200
        penalty = response.json()["penalty"]
        
        # Verify timestamp is valid ISO format
        timestamp = penalty["timestamp"]
        try:
            # Try to parse ISO timestamp
            datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except ValueError:
            pytest.fail(f"Invalid timestamp format: {timestamp}")

