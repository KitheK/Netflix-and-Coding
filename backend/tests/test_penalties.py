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
    
    def setup_method(self):
        """Set up test repository before each test method"""
        import tempfile
        import shutil
        # Create temporary directory for this test
        self.temp_dir = tempfile.mkdtemp()
        # Create JsonRepository with test directory
        self.repository = JsonRepository(data_dir=self.temp_dir)
        self.service = PenaltyService(self.repository)
    
    def teardown_method(self):
        """Clean up after each test method"""
        import shutil
        if hasattr(self, 'temp_dir'):
            shutil.rmtree(self.temp_dir, ignore_errors=True)
    
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

    def test_get_user_penalties_filters_by_status(self):
        """UNIT TEST: Service can filter penalties by status (active vs resolved)"""
        user_id = str(uuid.uuid4())

        # Create test penalties with different statuses directly
        # Ensure at least 3 entries for this user with mixed statuses
        raw = []
        raw.append(
            {
                "penalty_id": "p1",
                "user_id": user_id,
                "reason": "Active 1",
                "timestamp": "2025-01-01T10:00:00+00:00",
                "status": "active",
            }
        )
        raw.append(
            {
                "penalty_id": "p2",
                "user_id": user_id,
                "reason": "Resolved 1",
                "timestamp": "2025-01-02T10:00:00+00:00",
                "status": "resolved",
            }
        )
        raw.append(
            {
                "penalty_id": "p3",
                "user_id": user_id,
                "reason": "Active 2",
                "timestamp": "2025-01-03T10:00:00+00:00",
                "status": "active",
            }
        )
        self.repository.save("penalties.json", raw)

        # Active only
        active = self.service.get_user_penalties(user_id=user_id, status="active")
        assert [p.penalty_id for p in active] == ["p3", "p1"]  # newest first
        assert all(p.status == "active" for p in active)

        # Resolved only
        resolved = self.service.get_user_penalties(user_id=user_id, status="resolved")
        assert [p.penalty_id for p in resolved] == ["p2"]
        assert all(p.status == "resolved" for p in resolved)

        # No status filter returns all
        all_penalties = self.service.get_user_penalties(user_id=user_id)
        assert [p.penalty_id for p in all_penalties] == ["p3", "p2", "p1"]


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

    def test_get_penalties_for_user_success(self):
        """INTEGRATION TEST: Admin can list all penalties for a specific user"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Create two penalties for TEST_USER_ID_1
        for reason in ["First violation", "Second violation"]:
            resp = client.post(
                "/penalties/apply",
                json={
                    "user_id": TEST_USER_ID_1,
                    "reason": reason,
                },
                headers=headers,
            )
            assert resp.status_code == 200

        # Create one penalty for TEST_USER_ID_2 (should not appear in results)
        other_resp = client.post(
            "/penalties/apply",
            json={
                "user_id": TEST_USER_ID_2,
                "reason": "Other user violation",
            },
            headers=headers,
        )
        assert other_resp.status_code == 200

        # Now fetch penalties for TEST_USER_ID_1
        list_resp = client.get(f"/penalties/{TEST_USER_ID_1}", headers=headers)
        assert list_resp.status_code == 200
        penalties = list_resp.json()

        # Should only return penalties for this user
        assert isinstance(penalties, list)
        assert len(penalties) == 2
        assert all(p["user_id"] == TEST_USER_ID_1 for p in penalties)

    def test_get_penalties_for_user_no_penalties(self):
        """INTEGRATION TEST: Getting penalties for a user with no penalties returns empty list"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Ensure there are no penalties yet for TEST_USER_ID_1
        list_resp = client.get(f"/penalties/{TEST_USER_ID_1}", headers=headers)
        assert list_resp.status_code == 200
        penalties = list_resp.json()
        assert isinstance(penalties, list)
        assert len(penalties) == 0

    def test_get_penalties_for_user_forbidden_for_customer(self):
        """INTEGRATION TEST: Non-admin user cannot view another user's penalties"""
        headers_customer = {"Authorization": f"Bearer {self.user1_token}"}

        # Customer tries to read penalties for another user
        resp = client.get(f"/penalties/{TEST_USER_ID_2}", headers=headers_customer)
        assert resp.status_code == 403
        assert "admin" in resp.json()["detail"].lower()

    def test_get_penalties_filtered_active(self):
        """INTEGRATION TEST: GET /penalties/{user_id}?status=active filters to active penalties only"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Create three penalties, then manually mark some resolved in the file
        for reason in ["Active 1", "Resolved 1", "Active 2"]:
            resp = client.post(
                "/penalties/apply",
                json={
                    "user_id": TEST_USER_ID_1,
                    "reason": reason,
                },
                headers=headers,
            )
            assert resp.status_code == 200

        # Load file and mark middle penalty as resolved
        with open(TEST_DB_PATH_PENALTIES, "r", encoding="utf-8") as f:
            penalties = json.load(f)

        # Assume all 3 belong to TEST_USER_ID_1 in order
        penalties[1]["status"] = "resolved"
        with open(TEST_DB_PATH_PENALTIES, "w", encoding="utf-8") as f:
            json.dump(penalties, f, indent=2)

        # Request only active penalties
        resp_active = client.get(
            f"/penalties/{TEST_USER_ID_1}?status=active", headers=headers
        )
        assert resp_active.status_code == 200
        body = resp_active.json()
        assert isinstance(body, list)
        # Should contain only the two active penalties
        assert len(body) == 2
        assert all(p["status"] == "active" for p in body)

    def test_get_penalties_filtered_resolved(self):
        """INTEGRATION TEST: GET /penalties/{user_id}?status=resolved filters to resolved penalties only"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Create two penalties for TEST_USER_ID_2
        for reason in ["Resolved X", "Resolved Y"]:
            resp = client.post(
                "/penalties/apply",
                json={
                    "user_id": TEST_USER_ID_2,
                    "reason": reason,
                },
                headers=headers,
            )
            assert resp.status_code == 200

        # Mark all TEST_USER_ID_2 penalties as resolved in the file
        with open(TEST_DB_PATH_PENALTIES, "r", encoding="utf-8") as f:
            penalties = json.load(f)

        for p in penalties:
            if p.get("user_id") == TEST_USER_ID_2:
                p["status"] = "resolved"

        with open(TEST_DB_PATH_PENALTIES, "w", encoding="utf-8") as f:
            json.dump(penalties, f, indent=2)

        # Request only resolved penalties
        resp_resolved = client.get(
            f"/penalties/{TEST_USER_ID_2}?status=resolved", headers=headers
        )
        assert resp_resolved.status_code == 200
        body = resp_resolved.json()
        assert isinstance(body, list)
        assert len(body) >= 2
        assert all(p["status"] == "resolved" for p in body)

    def test_get_penalties_invalid_status_returns_400(self):
        """INTEGRATION TEST: Unknown status value returns 400 Bad Request"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Use an invalid status filter; should return 400
        resp_invalid = client.get(
            f"/penalties/{TEST_USER_ID_1}?status=unknown", headers=headers
        )
        assert resp_invalid.status_code == 400
        assert "invalid status value" in resp_invalid.json()["detail"].lower()
        assert "active" in resp_invalid.json()["detail"].lower()
        assert "resolved" in resp_invalid.json()["detail"].lower()

    def test_get_penalties_invalid_status_no_penalties_returns_400(self):
        """INTEGRATION TEST: Invalid status with user having no penalties returns 400, not misleading 404"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Ensure user has no penalties (or use a fresh user)
        # Use an invalid status filter for a user with no penalties
        # Should return 400 (invalid status), not 404 with misleading message
        resp_invalid = client.get(
            f"/penalties/{TEST_USER_ID_2}?status=invalid_status", headers=headers
        )
        assert resp_invalid.status_code == 400
        assert "invalid status value" in resp_invalid.json()["detail"].lower()
        # Should NOT contain misleading message like "No invalid_status penalties found"
        assert "no invalid_status penalties" not in resp_invalid.json()["detail"].lower()

    def test_get_penalties_invalid_user(self):
        """INTEGRATION TEST: Invalid user ID returns 404 with message"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        fake_user_id = "00000000-0000-0000-0000-ABCDEFABCDEF"

        resp = client.get(f"/penalties/{fake_user_id}", headers=headers)
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    def test_get_penalties_filter_no_results(self):
        """INTEGRATION TEST: Status filter with no matching penalties returns 404"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Create one active penalty only
        resp = client.post(
            "/penalties/apply",
            json={
                "user_id": TEST_USER_ID_1,
                "reason": "Only active penalty",
            },
            headers=headers,
        )
        assert resp.status_code == 200

        # Request resolved penalties (none exist)
        resp_filtered = client.get(
            f"/penalties/{TEST_USER_ID_1}?status=resolved",
            headers=headers,
        )
        assert resp_filtered.status_code == 404
        assert "no resolved penalties" in resp_filtered.json()["detail"].lower()

    def test_resolve_penalty_success(self):
        """INTEGRATION TEST: Admin can resolve a penalty"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Create penalty
        resp = client.post(
            "/penalties/apply",
            json={
                "user_id": TEST_USER_ID_1,
                "reason": "Resolve me",
            },
            headers=headers,
        )
        assert resp.status_code == 200
        penalty_id = resp.json()["penalty"]["penalty_id"]

        # Resolve penalty
        resolve_resp = client.post(f"/penalties/{penalty_id}/resolve", headers=headers)
        assert resolve_resp.status_code == 200
        data = resolve_resp.json()
        assert data["message"] == "Penalty resolved successfully"
        assert data["penalty"]["status"] == "resolved"

        # Ensure GET with status filter shows no active penalties (should return 404)
        active_resp = client.get(
            f"/penalties/{TEST_USER_ID_1}?status=active", headers=headers
        )
        assert active_resp.status_code == 404
        assert "no active penalties found" in active_resp.json()["detail"].lower()

    def test_resolve_penalty_not_found(self):
        """INTEGRATION TEST: Resolving non-existent penalty returns 404"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        fake_id = "00000000-0000-0000-0000-999999999999"

        resp = client.post(f"/penalties/{fake_id}/resolve", headers=headers)
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    def test_resolve_penalty_already_resolved(self):
        """INTEGRATION TEST: Resolving an already resolved penalty returns 400"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        resp = client.post(
            "/penalties/apply",
            json={
                "user_id": TEST_USER_ID_2,
                "reason": "Already resolved test",
            },
            headers=headers,
        )
        penalty_id = resp.json()["penalty"]["penalty_id"]

        # First resolve succeeds
        first = client.post(f"/penalties/{penalty_id}/resolve", headers=headers)
        assert first.status_code == 200

        # Second resolve should fail with 400
        second = client.post(f"/penalties/{penalty_id}/resolve", headers=headers)
        assert second.status_code == 400
        assert "already resolved" in second.json()["detail"].lower()
