from fastapi import APIRouter, HTTPException
from typing import List
from backend.services.review_service import ReviewService
from backend.models.review_model import Review, ReviewCreate, ReviewUpdate

router = APIRouter()
review_service = ReviewService()

@router.get("/product/{product_id}", response_model=List[Review])
async def get_product_reviews(product_id: str):
    """Get all reviews for a product"""
    try:
        reviews = review_service.get_product_reviews(product_id)
        return reviews
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/user/{user_id}", response_model=List[Review])
async def get_user_reviews(user_id: str):
    """Get all reviews by a user"""
    try:
        reviews = review_service.get_user_reviews(user_id)
        return reviews
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/", response_model=Review)
async def create_review(review_data: ReviewCreate):
    """Create a new review"""
    try:
        review = review_service.create_review(review_data)
        return review
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{review_id}", response_model=Review)
async def update_review(review_id: str, review_data: ReviewUpdate):
    """Update an existing review"""
    try:
        review = review_service.update_review(review_id, review_data)
        return review
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{review_id}")
async def delete_review(review_id: str):
    """Delete a review"""
    try:
        review_service.delete_review(review_id)
        return {"message": "Review deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))