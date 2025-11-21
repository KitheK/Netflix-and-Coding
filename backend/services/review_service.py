# Review Service: Business logic for reviews

from backend.repositories.review_repository import ReviewRepository
from typing import List
from backend.models.review_model import Review


class ReviewService:
    """Service for handling review-related business logic"""
    
    def __init__(self):
        # Create repository internally
        self.review_repository = ReviewRepository()
    
    def get_reviews_for_product(self, product_id: str) -> List[Review]:
        # Get all reviews (returns dict with product_id as keys)
        all_reviews = self.review_repository.get_all()
        
        # Look up this specific product's reviews
        # .get() returns [] if product_id doesn't exist
        product_reviews = all_reviews.get(product_id, [])
        
        # Convert dict data to Review objects
        return [Review(**review) for review in product_reviews]