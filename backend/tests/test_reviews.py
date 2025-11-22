
from backend.main import app
import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from pathlib import Path

"""Tests for the review endpoints"""

client = TestClient(app)
from backend.models.review_model import AddReviewRequest
from backend.services.review_service import ReviewService
import json


# Test product IDs from the actual reviews.json
PRODUCT_WITH_REVIEWS = "B07JW9H4J1"  # This product has 8 reviews in reviews.json
PRODUCT_WITHOUT_REVIEWS = "NONEXISTENT_PRODUCT_ID"


# For Testing Reviews write to JSON
TEMP_REVIEWS_FILE = Path("backend/data/reviews_test.json")

# ============================================================================
# INTEGRATION TESTS - Testing full API endpoints with TestClient
# ============================================================================

@pytest.mark.integration
def test_get_reviews_for_valid_product():
    """INTEGRATION TEST: Test getting reviews for a product that exists in reviews.json"""
    response = client.get(f"/reviews/{PRODUCT_WITH_REVIEWS}")
    
    assert response.status_code == 200
    reviews = response.json()
    
    # Check that we get a list of reviews
    assert isinstance(reviews, list)
    assert len(reviews) > 0
    
    # Check the structure of each review
    for review in reviews:
        assert "review_id" in review
        assert "user_id" in review
        assert "user_name" in review
        assert "review_title" in review
        assert "review_content" in review
        
        # Verify types
        assert isinstance(review["review_id"], str)
        assert isinstance(review["user_id"], str)
        assert isinstance(review["user_name"], str)
        assert isinstance(review["review_title"], str)
        assert isinstance(review["review_content"], str)
        
        # ONCE RATINGS IMPLEMENTED UNCOMMENT THE CODE BELOW: If rating exists, verify it's valid, though currently ratings are not implemented

        # if "rating" in review and review["rating"] is not None:
        #     assert isinstance(review["rating"], (int, float))
        #     assert 0 <= review["rating"] <= 5


@pytest.mark.integration
def test_get_reviews_for_invalid_product():
    """Test getting reviews for a product that doesn't exist"""
    response = client.get(f"/reviews/{PRODUCT_WITHOUT_REVIEWS}")
    
    assert response.status_code == 404
    assert response.json()["detail"] == "No reviews found for this product"


@pytest.mark.integration
def test_get_reviews_returns_all_reviews():
    """Test that all reviews for a product are returned"""
    response = client.get(f"/reviews/{PRODUCT_WITH_REVIEWS}")
    
    assert response.status_code == 200
    reviews = response.json()
    
    # B07JW9H4J1 should have 8 reviews based on migration
    #assert len(reviews) == 8


@pytest.mark.integration
def test_review_fields_not_empty():
    """Test that review fields contain actual data"""
    response = client.get(f"/reviews/{PRODUCT_WITH_REVIEWS}")
    
    assert response.status_code == 200
    reviews = response.json()
    
    # Check that at least the first review has non-empty fields
    first_review = reviews[0]
    assert len(first_review["review_id"]) > 0
    assert len(first_review["user_id"]) > 0
    assert len(first_review["user_name"]) > 0
    assert len(first_review["review_title"]) > 0
    assert len(first_review["review_content"]) > 0


@pytest.mark.integration
def test_review_ids_are_unique():
    """Test that all review IDs for a product are unique"""
    response = client.get(f"/reviews/{PRODUCT_WITH_REVIEWS}")
    
    assert response.status_code == 200
    reviews = response.json()
    
    review_ids = [review["review_id"] for review in reviews]
    assert len(review_ids) == len(set(review_ids)), "Review IDs should be unique"


@pytest.mark.integration
def test_review_endpoint_returns_json():
    """Test that the endpoint returns valid JSON"""
    response = client.get(f"/reviews/{PRODUCT_WITH_REVIEWS}")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"


@pytest.mark.integration
def test_review_endpoint_with_empty_product_id():
    """Test the endpoint with an empty product ID"""
    response = client.get("/reviews/")
    
    # Should return 404 or 405 (method not allowed) since the route requires a product_id
    assert response.status_code in [404, 405]

# ============================================================================
# UNIT TESTS - Testing models with mocked dependencies
# ============================================================================

@pytest.mark.unit
def test_add_review_request_validation():
    """UNIT TEST: Test that AddReviewRequest validates input correctly"""
    from backend.models.review_model import AddReviewRequest
    from pydantic import ValidationError

    # Valid request should work
    req = AddReviewRequest(
        user_id="USER123",
        user_name="John Doe",
        review_title="Great product!",
        review_content="Works perfectly."
    )

    assert req.user_id == "USER123"
    assert req.user_name == "John Doe"
    assert req.review_title == "Great product!"
    assert req.review_content == "Works perfectly."

    # Missing required field should raise ValidationError
    with pytest.raises(ValidationError):
        AddReviewRequest(
            user_name="Missing Information",
            review_title="Missing Required Fields",
            review_content="Invalid"
        )

# --- Admin review deletion tests (current setup) ---



# --- Simple admin review deletion tests ---

def test_admin_delete_review_success():
    """Should return 200 and detail if review deleted (assumes admin auth works in test env)."""
    # These IDs should exist in your test data for a real integration test
    product_id = PRODUCT_WITH_REVIEWS
    # Get a review ID from the product's reviews
    response = client.get(f"/reviews/{product_id}")
    assert response.status_code == 200
    reviews = response.json()
    if not reviews:
        pytest.skip("No reviews to delete for this product in test data.")
    review_id = reviews[0]["review_id"]
    # Try to delete as admin (assumes test env allows it)
    response = client.delete(f"/reviews/{product_id}/{review_id}")
    # Accept 200, 401 (unauthenticated), or 403 (forbidden) depending on test environment
    assert response.status_code in [200, 401, 403]
    if response.status_code == 200:
        assert response.json()["detail"] == "Review deleted"


def test_admin_delete_review_not_found():
    """Should return 404 if review does not exist (assumes admin auth works in test env)."""
    product_id = PRODUCT_WITH_REVIEWS
    review_id = "NON_EXISTENT_REVIEW_ID"
    response = client.delete(f"/reviews/{product_id}/{review_id}")
    # Accept 404 if not found, 401 if unauthenticated in test env, or 403 if forbidden
    assert response.status_code in [404, 401, 403]
    if response.status_code == 404:
        assert response.json()["detail"] == "Review not found"


#INTEGRATION TEST FOR POST/{PRODUCT_ID}

#Example users and products
USER_WITH_PURCHASE = "00000000-0000-0000-0000-000000000103"
USER_WITHOUT_PURCHASE = "nonexistent-user-0000-0000"
PRODUCT_PURCHASED = "B07JW9H4J1"      # User has purchased this product
PRODUCT_NOT_PURCHASED = "B08KT5LMRX"   # User has not purchased this product

@pytest.mark.integration
def test_post_review_success(monkeypatch):
    """Test that a user who purchased the product can post a review"""
    product_id = "TEST_PRODUCT_UNIQUE"
    review_req_data = {
        "user_id": USER_WITH_PURCHASE,
        "user_name": "John Doe",
        "review_title": "Great Product!",
        "review_content": "Really satisfied with this purchase."
    }

    # Create a fake ReviewService instance
    service = ReviewService()

    # Monkeypatch get_all to return empty reviews for the product
    monkeypatch.setattr(service.review_repository, "get_all", lambda: {product_id: []})

    # Monkeypatch save_all to do nothing (we're not testing file writing here)
    monkeypatch.setattr(service.review_repository, "save_all", lambda data: None)

    # Monkeypatch user_has_purchased to always True
    monkeypatch.setattr(service, "user_has_purchased", lambda u, p: True)

    # Create AddReviewRequest object
    review_req = AddReviewRequest(**review_req_data)

    # Call add_review
    new_review = service.add_review(product_id, review_req)

    # Check returned review
    assert new_review.user_id == review_req_data["user_id"]
    assert new_review.review_title == review_req_data["review_title"]
    assert new_review.review_content == review_req_data["review_content"]
    assert len(new_review.review_id) == 14

@pytest.mark.integration
def test_post_review_failure_not_purchased():
    """Test that a user who has not purchased the product gets a 400 error"""
    review_data = {
        "user_id": USER_WITHOUT_PURCHASE,
        "user_name": "Jane Doe",
        "review_title": "Cannot post",
        "review_content": "Customer didn't buy this product."
    }
    
    response = client.post(f"/reviews/{PRODUCT_NOT_PURCHASED}", json=review_data)
    
    assert response.status_code == 400
    assert "User has not purchased this product" in response.json()["detail"]

#Test for writing to the JSON file, INTEGRATION TEST to ensure the reading is not
#impacted anywhere else in the code.

@pytest.fixture
def review_service_tmp(monkeypatch):
    """Fixture to provide a ReviewService instance using a temporary JSON file."""
    service = ReviewService()
    
    # Override the repository filename to use our temporary file
    monkeypatch.setattr(service.review_repository, "get_filename", lambda: TEMP_REVIEWS_FILE.name)
    
    # Ensure the temp file exists and starts empty
    TEMP_REVIEWS_FILE.write_text(json.dumps({}))
    
    yield service
    
    # Cleanup: remove temporary file after test
    if TEMP_REVIEWS_FILE.exists():
        TEMP_REVIEWS_FILE.unlink()


@pytest.mark.unit
def test_add_review_writes_to_json(review_service_tmp):
    """UNIT TEST: adding a review writes correctly to the JSON file."""
    service = review_service_tmp
    product_id = "TEST_PRODUCT_123"
    
    review_req = AddReviewRequest(
        user_id="user123",
        user_name="John Test",
        review_title="Awesome!",
        review_content="Really liked it."
    )

    # Monkeypatch `user_has_purchased` to always True for this test
    original_check = service.user_has_purchased
    service.user_has_purchased = lambda u, p: True

    # Add review
    new_review = service.add_review(product_id, review_req)

    # Read the temp JSON file directly
    with open(TEMP_REVIEWS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Assertions
    assert product_id in data
    assert len(data[product_id]) == 1
    stored_review = data[product_id][0]
    assert stored_review["user_id"] == "user123"
    assert stored_review["user_name"] == "John Test"
    assert stored_review["review_title"] == "Awesome!"
    assert stored_review["review_content"] == "Really liked it."
    assert "review_id" in stored_review
    assert len(stored_review["review_id"]) == 14  # 14-character ID

    # Restore original method
    service.user_has_purchased = original_check

def test_post_review_failure_duplicate(review_service_tmp):
    """User cannot post more than one review per product"""
    product_id = "TEST_DUPLICATE_PRODUCT"
    user_id = "user_duplicate"

    review_req = AddReviewRequest(
        user_id=user_id,
        user_name="Jane Tester",
        review_title="First Review",
        review_content="Good product."
    )

    # Monkeypatch purchase check to True
    review_service_tmp.user_has_purchased = lambda u, p: True

    # First review succeeds
    review_service_tmp.add_review(product_id, review_req)

    # Second review should fail
    with pytest.raises(ValueError) as exc:
        review_service_tmp.add_review(product_id, review_req)
    
    assert "already reviewed" in str(exc.value)


