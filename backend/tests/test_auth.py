import os
import json
import uuid
import secrets
import string
import bcrypt
import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.auth_service import AuthService
from backend.models.user_model import User

# TODO: this wipes users.json every test run - will delete real user data if it exists
# need to move to backend/data/test/ folder so tests dont touch production files
# see kithe's issue for test data isolation

TEST_DB_PATH = "backend/data/users.json"

@pytest.fixture(scope="function", autouse=True)
def prepare_test_env():
    """
    Before each test:
    - Create a fresh users.json for testing
    After each test:
    - Clean up test file
    """
    # Create data directory if it doesn't exist
    os.makedirs(os.path.dirname(TEST_DB_PATH), exist_ok=True)
    
    # Create empty users file
    with open(TEST_DB_PATH, "w", encoding="utf-8") as f:
        json.dump([], f)
    
    os.environ["USERS_FILE"] = "users.json"
    
    yield  # Run test here
    
    os.environ.pop("USERS_FILE", None)
    # Clean up after test
    # if os.path.exists(TEST_DB_PATH):
    #     os.remove(TEST_DB_PATH)

client = TestClient(app)

def _write_test_user(email: str, plain_password: str, name: str = "Test User", role: str = "customer"):
    """Helper: create a single user in TEST_DB_PATH with bcrypt-hashed password and 28-char token."""
    hashed = bcrypt.hashpw(plain_password.encode(), bcrypt.gensalt()).decode()
    alphabet = string.ascii_letters + string.digits
    token = "".join(secrets.choice(alphabet) for _ in range(28))
    user = {
        "user_id": str(uuid.uuid4()),
        "name": name,
        "email": email.lower(),
        "password_hash": hashed,
        "user_token": token,
        "role": role
    }
    with open(TEST_DB_PATH, "w", encoding="utf-8") as f:
        json.dump([user], f, indent=2)
    return user, plain_password

# ============================================================================
# UNIT TESTS - Testing AuthService with mocked dependencies
# ============================================================================

class TestAuthServiceUnit:
    """UNIT TESTS: Test AuthService business logic with mocked repository"""
    
    def setup_method(self):
        """Set up test service with mocked repository"""
        self.mock_repository = Mock()
        self.service = AuthService()
        self.service.repository = self.mock_repository
    
    @pytest.mark.unit
    def test_register_user_success(self):
        """UNIT TEST: Register user with valid data returns User object"""
        # Mock repository to return empty list (no existing users)
        self.mock_repository.get_all.return_value = []
        
        # Mock save to track calls
        self.mock_repository.save_all = Mock()
        
        # Register user
        user = self.service.register_user(
            name="John Doe",
            email="john@example.com",
            password="SecurePass123"
        )
        
        # Verify user object
        assert isinstance(user, User)
        assert user.name == "John Doe"
        assert user.email == "john@example.com"
        assert user.role == "customer"
        assert user.user_token is not None
        assert len(user.user_token) == 28
        
        # Verify repository was called
        self.mock_repository.save_all.assert_called_once()
    
    @pytest.mark.unit
    def test_register_user_duplicate_email(self):
        """UNIT TEST: Register with duplicate email raises ValueError"""
        # Mock repository to return existing user with same email
        existing_user = {
            "user_id": str(uuid.uuid4()),
            "name": "Existing User",
            "email": "john@example.com",
            "password_hash": "hashed",
            "user_token": "token123",
            "role": "customer"
        }
        self.mock_repository.get_all.return_value = [existing_user]
        
        # Should raise ValueError
        with pytest.raises(ValueError, match="Email already exists"):
            self.service.register_user(
                name="New User",
                email="john@example.com",
                password="NewPass123"
            )
    
    @pytest.mark.unit
    def test_register_user_short_password(self):
        """UNIT TEST: Register with password < 6 characters raises ValueError"""
        self.mock_repository.get_all.return_value = []
        
        with pytest.raises(ValueError, match="Password must be at least 6 characters"):
            self.service.register_user(
                name="John",
                email="john@example.com",
                password="short"
            )
    
    @pytest.mark.unit
    def test_register_user_no_digit_in_password(self):
        """UNIT TEST: Register with password without digit raises ValueError"""
        self.mock_repository.get_all.return_value = []
        
        with pytest.raises(ValueError, match="Password must include at least one digit"):
            self.service.register_user(
                name="John",
                email="john@example.com",
                password="NoDigits"
            )
    
    @pytest.mark.unit
    def test_login_user_success(self):
        """UNIT TEST: Login with valid credentials returns User"""
        # Mock user data
        password = "TestPass123"
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        user_data = {
            "user_id": str(uuid.uuid4()),
            "name": "Test User",
            "email": "test@example.com",
            "password_hash": hashed,
            "user_token": "token123",
            "role": "customer"
        }
        self.mock_repository.get_all.return_value = [user_data]
        
        # Login should succeed
        user = self.service.login_user("test@example.com", password)
        assert user is not None
        assert user.email == "test@example.com"
    
    @pytest.mark.unit
    def test_login_user_wrong_password(self):
        """UNIT TEST: Login with wrong password returns None"""
        password = "TestPass123"
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        user_data = {
            "user_id": str(uuid.uuid4()),
            "name": "Test User",
            "email": "test@example.com",
            "password_hash": hashed,
            "user_token": "token123",
            "role": "customer"
        }
        self.mock_repository.get_all.return_value = [user_data]
        
        # Wrong password should return None
        user = self.service.login_user("test@example.com", "WrongPassword")
        assert user is None
    
    @pytest.mark.unit
    def test_login_user_not_found(self):
        """UNIT TEST: Login with non-existent email returns None"""
        self.mock_repository.get_all.return_value = []
        
        user = self.service.login_user("nonexistent@example.com", "password")
        assert user is None
    
    @pytest.mark.unit
    def test_get_user_by_id_success(self):
        """UNIT TEST: Get user by valid ID returns User"""
        user_id = str(uuid.uuid4())
        user_data = {
            "user_id": user_id,
            "name": "Test User",
            "email": "test@example.com",
            "password_hash": "hashed",
            "user_token": "token123",
            "role": "customer"
        }
        self.mock_repository.get_all.return_value = [user_data]
        
        user = self.service.get_user_by_id(user_id)
        assert user is not None
        assert user.user_id == user_id
    
    @pytest.mark.unit
    def test_get_user_by_id_not_found(self):
        """UNIT TEST: Get user by invalid ID returns None"""
        self.mock_repository.get_all.return_value = []
        
        user = self.service.get_user_by_id(str(uuid.uuid4()))
        assert user is None
    
    @pytest.mark.unit
    def test_get_user_by_email_success(self):
        """UNIT TEST: Get user by valid email returns User"""
        user_data = {
            "user_id": str(uuid.uuid4()),
            "name": "Test User",
            "email": "test@example.com",
            "password_hash": "hashed",
            "user_token": "token123",
            "role": "customer"
        }
        self.mock_repository.get_all.return_value = [user_data]
        
        user = self.service.get_user_by_email("test@example.com")
        assert user is not None
        assert user.email == "test@example.com"
    
    @pytest.mark.unit
    def test_get_user_by_token_success(self):
        """UNIT TEST: Get user by valid token returns User"""
        token = "testtoken12345678901234567890"
        user_data = {
            "user_id": str(uuid.uuid4()),
            "name": "Test User",
            "email": "test@example.com",
            "password_hash": "hashed",
            "user_token": token,
            "role": "customer"
        }
        self.mock_repository.get_all.return_value = [user_data]
        
        user = self.service.get_user_by_token(token)
        assert user is not None
        assert user.user_token == token
    
    @pytest.mark.unit
    def test_get_user_by_token_not_found(self):
        """UNIT TEST: Get user by invalid token returns None"""
        self.mock_repository.get_all.return_value = []
        
        user = self.service.get_user_by_token("invalid_token")
        assert user is None


# ============================================================================
# INTEGRATION TESTS - Testing full API endpoints with TestClient
# ============================================================================

# User Registration Tests
@pytest.mark.integration
def test_register_user_success():
    """INTEGRATION TEST: Test successful user registration via API"""
    response = client.post("/auth/register", json={
        "name": "John Doe",
        "email": "john@example.com",
        "password": "SecureUserPass@1"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "User registered successfully"
    assert response.json()["user"]["email"] == "john@example.com"

@pytest.mark.integration
def test_register_user_invalid_email():
    """INTEGRATION TEST: Test registration with invalid email"""
    response = client.post("/auth/register", json={
        "name": "Jane Doe",
        "email": "invalid-email",
        "password": "pass123"
    })
    assert response.status_code == 422

@pytest.mark.integration
def test_register_user_missing_fields():
    """INTEGRATION TEST: Test registration with missing fields"""
    response = client.post("/auth/register", json={
        "name": "Bob Smith"
    })
    assert response.status_code == 422

@pytest.mark.integration
def test_register_duplicate_email():
    """INTEGRATION TEST: Test registration with duplicate email"""
    response1 = client.post("/auth/register", json={
        "name": "User One",
        "email": "duplicate@example.com",
        "password": "NewUser@1"
    })
    assert response1.status_code == 200
    
    response2 = client.post("/auth/register", json={
        "name": "User Two",
        "email": "duplicate@example.com",
        "password": "NewUser@2s"
    })
    assert response2.status_code == 400

# --- Tests for login functionality ---

def write_test_user(email: str, plain_password: str, name: str = "Test User"):
    """Helper: create a single user in TEST_DB_PATH with bcrypt-hashed password and 28-char token."""
    hashed = bcrypt.hashpw(plain_password.encode(), bcrypt.gensalt()).decode()
    alphabet = string.ascii_letters + string.digits
    token = "".join(secrets.choice(alphabet) for _ in range(28))
    user = {
        "user_id": str(uuid.uuid4()),
        "name": name,
        "email": email.lower(),
        "password_hash": hashed,
        "user_token": token,
        "role": "customer"
    }
    with open(TEST_DB_PATH, "w", encoding="utf-8") as f:
        json.dump([user], f, indent=2)
    return user, plain_password

@pytest.mark.integration
def test_login_success():
    """INTEGRATION TEST: Valid credentials return 200 and user data including token"""
    user, plain = write_test_user("john@example.com", "NewUser@1", "John Doe")
    resp = client.post("/auth/login", json={"email": "john@example.com", "password": plain})
    assert resp.status_code == 200
    body = resp.json()
    assert "user" in body
    assert body["user"]["email"] == "john@example.com"
    assert "user_token" in body["user"]
    assert isinstance(body["user"]["user_token"], str)
    assert len(body["user"]["user_token"]) == 28

@pytest.mark.integration
def test_login_wrong_password():
    """INTEGRATION TEST: Wrong password yields 401 Unauthorized"""
    write_test_user("john@example.com", "NewUser@2", "John Doe")
    resp = client.post("/auth/login", json={"email": "john@example.com", "password": "badpass"})
    assert resp.status_code == 401

@pytest.mark.integration
def test_login_user_not_found():
    """INTEGRATION TEST: Non-existent email yields 401 Unauthorized (no user leak)"""
    # create a different user
    write_test_user("someoneelse@example.com", "NewUser@1", "Other")
    resp = client.post("/auth/login", json={"email": "noone@example.com", "password": "Password1"})
    assert resp.status_code == 401

#--- Tests for retrieving users ---
@pytest.mark.integration
def test_get_user_by_id_success():
    """INTEGRATION TEST: Get user by valid ID returns 200 and user data"""
    user, _ = write_test_user("alice@example.com", "AlicePass1", "Alice")
    resp = client.get(f"/auth/users/{user['user_id']}")
    assert resp.status_code == 200
    assert resp.json()["user_id"] == user["user_id"]
    assert resp.json()["email"] == "alice@example.com"

@pytest.mark.integration
def test_get_user_by_id_not_found():
    """INTEGRATION TEST: Get user by invalid ID returns 404"""
    fake_id = "00000000-0000-0000-0000-000000000000"
    resp = client.get(f"/auth/users/{fake_id}")
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()

@pytest.mark.integration
def test_get_user_by_email_success():
    """INTEGRATION TEST: Get user by valid email returns 200 and user data"""
    user, _ = write_test_user("bob@example.com", "BobPass1", "Bob")
    resp = client.get(f"/auth/email/bob@example.com")
    assert resp.status_code == 200
    assert resp.json()["email"] == "bob@example.com"
    assert resp.json()["name"] == "Bob"

# --- Authentication & Authorization Tests (Issue 4) ---
@pytest.mark.integration
def test_me_endpoint_success():
    """INTEGRATION TEST: GET /me returns logged-in user profile with valid token"""
    user, _ = _write_test_user("meuser@example.com", "MePass#1", "MeUser", "customer")
    token = user["user_token"]
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/auth/me", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "meuser@example.com"
    assert body["user_token"] == token
    assert body["role"] == "customer"

@pytest.mark.integration
def test_me_endpoint_missing_token():
    """INTEGRATION TEST: GET /me without token returns 401"""
    resp = client.get("/auth/me")
    assert resp.status_code == 401
    assert "not authenticated" in resp.json()["detail"].lower()

@pytest.mark.integration
def test_me_endpoint_invalid_token():
    """INTEGRATION TEST: GET /me with invalid token returns 401"""
    headers = {"Authorization": "Bearer invalidtoken0123456789invalidtoken"}
    resp = client.get("/auth/me", headers=headers)
    assert resp.status_code == 401
    assert "invalid" in resp.json()["detail"].lower()

@pytest.mark.integration
def test_admin_route_allowed_for_admin():
    """INTEGRATION TEST: Admin user can access admin-only route"""
    admin, _ = _write_test_user("admin@example.com", "Admin@Pass1", "Admin User", "admin")
    headers = {"Authorization": f"Bearer {admin['user_token']}"}
    resp = client.get("/auth/admin-only", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["message"] == "admin access granted"
    assert resp.json()["user_id"] == admin["user_id"]

@pytest.mark.integration
def test_admin_route_forbidden_for_customer():
    """INTEGRATION TEST: Non-admin (customer) user cannot access admin-only route"""
    user, _ = _write_test_user("customer@example.com", "Cust@Pass1", "Customer User", "customer")
    headers = {"Authorization": f"Bearer {user['user_token']}"}
    resp = client.get("/auth/admin-only", headers=headers)
    assert resp.status_code == 403
    assert "admin" in resp.json()["detail"].lower()

@pytest.mark.integration
def test_admin_route_missing_token():
    """INTEGRATION TEST: Admin route without token returns 401"""
    resp = client.get("/auth/admin-only")
    assert resp.status_code == 401

@pytest.mark.integration
def test_me_endpoint_admin_user():
    """INTEGRATION TEST: GET /me returns admin role correctly"""
    admin, _ = _write_test_user("adminme@example.com", "Admin@Me1", "Admin Me", "admin")
    headers = {"Authorization": f"Bearer {admin['user_token']}"}
    resp = client.get("/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["role"] == "admin"