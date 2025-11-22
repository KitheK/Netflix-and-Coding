# Review Router: API endpoints for review operations

from fastapi import APIRouter, HTTPException, Depends
from backend.services.review_service import ReviewService
from backend.models.review_model import Review, AddReviewRequest
from typing import List
from backend.services.auth_service import admin_required_dep

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


# Post a new review for a specific product
@router.post("/{product_id}", response_model=Review)
async def add_review_for_product(product_id: str, review_req: AddReviewRequest):
    """
    Add a review for a product.
    Only allowed if user has purchased the product (enforced by ReviewService).
    """
    # Use review_service to validate purchase and create the review
    try:
        new_review = review_service.add_review(product_id, review_req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return new_review


# ADMIN ONLY: Delete a review by product_id and review_id
@router.delete("/{product_id}/{review_id}")
async def admin_delete_review(
    product_id: str,
    review_id: str,
    current_user=Depends(admin_required_dep)
):
    """
    Admin-only: Delete a review for a product by review_id.
    - Requires admin privileges (enforced by admin_required_dep)
    - Returns 404 if review not found
    - Returns success message if deleted
    """
    # admin_required_dep ensures only admins can access this endpoint
    deleted = review_service.delete_review_by_id(product_id, review_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"detail": "Review deleted"}