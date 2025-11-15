import os
import json
import uuid
import secrets
import string
import bcrypt
import pytest
from fastapi.testclient import TestClient
from backend.main import app

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
    
    os.environ["USERS_FILE"] = TEST_DB_PATH
    
    yield  # Run test here
    
    os.environ.pop("USERS_FILE", None)
    # Clean up after test
    # if os.path.exists(TEST_DB_PATH):
    #     os.remove(TEST_DB_PATH)

client = TestClient(app)

def test_register_user_success():
    """Test successful user registration"""
    response = client.post("/auth/register", json={
        "name": "John Doe",
        "email": "john@example.com",
        "password": "SecureUserPass@1"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "User registered successfully"
    assert response.json()["user"]["email"] == "john@example.com"

def test_register_user_invalid_email():
    """Test registration with invalid email"""
    response = client.post("/auth/register", json={
        "name": "Jane Doe",
        "email": "invalid-email",
        "password": "pass123"
    })
    assert response.status_code == 422

def test_register_user_missing_fields():
    """Test registration with missing fields"""
    response = client.post("/auth/register", json={
        "name": "Bob Smith"
    })
    assert response.status_code == 422

def test_register_duplicate_email():
    """Test registration with duplicate email"""
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

# --- Added tests for login functionality ---

def _write_test_user(email: str, plain_password: str, name: str = "Test User"):
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

def test_login_success():
    """Valid credentials return 200 and user data including token"""
    user, plain = _write_test_user("john@example.com", "NewUser@1", "John Doe")
    resp = client.post("/auth/login", json={"email": "john@example.com", "password": plain})
    assert resp.status_code == 200
    body = resp.json()
    assert "user" in body
    assert body["user"]["email"] == "john@example.com"
    assert "user_token" in body["user"]
    assert isinstance(body["user"]["user_token"], str)
    assert len(body["user"]["user_token"]) == 28

def test_login_wrong_password():
    """Wrong password yields 401 Unauthorized"""
    _write_test_user("john@example.com", "NewUser@2", "John Doe")
    resp = client.post("/auth/login", json={"email": "john@example.com", "password": "badpass"})
    assert resp.status_code == 401

def test_login_user_not_found():
    """Non-existent email yields 401 Unauthorized (no user leak)"""
    # create a different user
    _write_test_user("someoneelse@example.com", "NewUser@1", "Other")
    resp = client.post("/auth/login", json={"email": "noone@example.com", "password": "Password1"})
    assert resp.status_code == 401

