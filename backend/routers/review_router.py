# Review Router: API endpoints for review operations

from fastapi import APIRouter, HTTPException
from backend.services.review_service import ReviewService
from backend.models.review_model import Review
from typing import List

# Create router with /reviews prefix and "reviews" tag
router = APIRouter(prefix="/reviews", tags=["reviews"])

# Create review service (it creates its own repository internally)
review_service = ReviewService()


"""Review router endpoints"""

# Endpoint to get all reviews for a specific product
# URL would be like /reviews/B07JW9H4J1 for product with ID B07JW9H4J1
@router.get("/{product_id}", response_model=List[Review])
async def get_reviews_for_product(product_id: str):
    # Call review_service's method to get reviews for this product
    reviews = review_service.get_reviews_for_product(product_id)
    
    # If no reviews found, return 404 error
    if not reviews:
        raise HTTPException(status_code=404, detail="No reviews found for this product")
    
    # Return the list of reviews
    return reviews
