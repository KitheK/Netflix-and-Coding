"""Tests for the review endpoints"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.review_model import AddReviewRequest

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

#INTEGRATION TEST FOR POST/{PRODUCT_ID}
#Example users and products
USER_WITH_PURCHASE = "00000000-0000-0000-0000-000000000103"
USER_WITHOUT_PURCHASE = "nonexistent-user-0000-0000"
PRODUCT_PURCHASED = "B07JW9H4J1"      # User has purchased this product
PRODUCT_NOT_PURCHASED = "B08KT5LMRX"   # User has not purchased this product

#Goes well
def test_post_review_success():
    """Test that a user who purchased the product can post a review"""
    review_data = {
        "user_id": USER_WITH_PURCHASE,
        "user_name": "John Doe",
        "review_title": "Great Product!",
        "review_content": "Really satisfied with this purchase."
    }

    response = client.post(f"/reviews/{PRODUCT_PURCHASED}", json=review_data)
    
    assert response.status_code == 200
    review = response.json()
    
    # Check response fields
    assert review["user_id"] == USER_WITH_PURCHASE
    assert review["review_title"] == "Great Product!"
    assert review["review_content"] == "Really satisfied with this purchase."
    assert "review_id" in review
    assert len(review["review_id"]) == 14  # 14-character ID

#Test if customer has not purchased the product yet.
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