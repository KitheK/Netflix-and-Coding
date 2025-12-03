import json
from fastapi.testclient import TestClient
from backend.main import app
from backend.repositories.wishlist_repository import WishlistRepository

client = TestClient(app)


def test_get_wishlist_user_not_exist(tmp_path):
    repo = WishlistRepository()
    repo.data_dir = tmp_path

    # No wishlist file yet → should return empty list
    assert repo.get_wishlist("user123") == []


def test_get_all_returns_empty_if_file_missing(tmp_path):
    repo = WishlistRepository()
    repo.data_dir = tmp_path

    # Should return empty dict initially
    assert repo.get_all() == {}


def test_save_and_get_all(tmp_path):
    repo = WishlistRepository()
    repo.data_dir = tmp_path

    data = {
        "u1": ["p1"],
        "u2": ["p2", "p3"]
    }

    repo.save_all(data)
    loaded = repo.get_all()

    assert loaded == data


def test_add_to_wishlist_endpoint(tmp_path):
    repo = WishlistRepository()
    repo.data_dir = tmp_path

    # Override dependency to use patched repo
    app.dependency_overrides[WishlistRepository] = lambda: repo

    response = client.post("/wishlist/add", json={
        "user_id": "u1",
        "product_id": "p123"
    })

    assert response.status_code == 200
    assert response.json()["message"] == "Added to wishlist"

    # Ensure product was added
    assert repo.get_wishlist("u1") == ["p123"]

    app.dependency_overrides = {}


def test_get_wishlist_endpoint(tmp_path):
    repo = WishlistRepository()
    repo.data_dir = tmp_path

    # Save initial data in dict format
    repo.save_all({
        "bob": ["p1", "p2"]
    })

    app.dependency_overrides[WishlistRepository] = lambda: repo

    response = client.get("/wishlist/bob")

    assert response.status_code == 200
    assert response.json() == ["p1", "p2"]

    app.dependency_overrides = {}
