"""Tests for the review endpoints"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

# Test product IDs from the actual reviews.json
PRODUCT_WITH_REVIEWS = "B07JW9H4J1"  # This product has 8 reviews in reviews.json
PRODUCT_WITHOUT_REVIEWS = "NONEXISTENT_PRODUCT_ID"


def test_get_reviews_for_valid_product():
    """Test getting reviews for a product that exists in reviews.json"""
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


def test_get_reviews_for_invalid_product():
    """Test getting reviews for a product that doesn't exist"""
    response = client.get(f"/reviews/{PRODUCT_WITHOUT_REVIEWS}")
    
    assert response.status_code == 404
    assert response.json()["detail"] == "No reviews found for this product"


def test_get_reviews_returns_all_reviews():
    """Test that all reviews for a product are returned"""
    response = client.get(f"/reviews/{PRODUCT_WITH_REVIEWS}")
    
    assert response.status_code == 200
    reviews = response.json()
    
    # B07JW9H4J1 should have 8 reviews based on migration
    assert len(reviews) == 8


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


#tests that the review ids are unique
def test_review_ids_are_unique():
    """Test that all review IDs for a product are unique"""
    response = client.get(f"/reviews/{PRODUCT_WITH_REVIEWS}")
    
    assert response.status_code == 200
    reviews = response.json()
    
    review_ids = [review["review_id"] for review in reviews]
    assert len(review_ids) == len(set(review_ids)), "Review IDs should be unique"


def test_review_endpoint_returns_json():
    """Test that the endpoint returns valid JSON"""
    response = client.get(f"/reviews/{PRODUCT_WITH_REVIEWS}")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"


def test_review_endpoint_with_empty_product_id():
    """Test the endpoint with an empty product ID"""
    response = client.get("/reviews/")
    
    # Should return 404 or 405 (method not allowed) since the route requires a product_id
    assert response.status_code in [404, 405]

def test_add_review_request_validation():
    """Test that AddReviewRequest validates input correctly"""
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
import pytest
from backend.models.review_model import AddReviewRequest
from backend.services.admin_delete_reviews import Delete_Review
from pydantic import ValidationError


def test_admin_delete_review(mocker):
    """Tests that an existing review is retrieved then deleted."""

    # Create a valid review request
    todel = AddReviewRequest(
        
        review_id="REVIEW123",
        user_id="USER234",
        user_name="Jane Doe",
        review_title="I like it!",
        review_content="This product is great, recommend"
    )

    # Act
    response_get = Delete_Review.get_review(todel.user_id, todel.review_id)
    response_delete = Delete_Review.delete_review(todel.review_id)

    # Assert

    assert response_get["exists"] is True
    assert response_delete is True


