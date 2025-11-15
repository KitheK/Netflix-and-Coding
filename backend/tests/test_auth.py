import os
import json
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
    with open(TEST_DB_PATH, "w") as f:
        json.dump([], f)
    
    yield  # Run test here
    
    # Clean up after test
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

client = TestClient(app)

def test_register_user_success():
    """Test successful user registration"""
    response = client.post("/auth/register", json={
        "name": "John Doe",
        "email": "john@example.com",
        "password": "securepass123"
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
        "password": "pass123"
    })
    assert response1.status_code == 200
    
    response2 = client.post("/auth/register", json={
        "name": "User Two",
        "email": "duplicate@example.com",
        "password": "pass456"
    })
    assert response2.status_code == 400
