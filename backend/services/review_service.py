# Review Service: Business logic for reviews

from backend.repositories.review_repository import ReviewRepository
from typing import List
from backend.models.review_model import Review
import json
from pathlib import Path


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
    
    def add_review(self, product_id: str, review_req: AddReviewRequest) -> Review:
        """Add a review if the user has purchased the product"""
        
        # Check purchase


        #TO DO check actual user for purchase
        purchased = self.purchased_products.get(review_req.user_id, [])
        if product_id not in purchased:
            raise ValueError("User has not purchased this product")
        
        # Create Review object
        new_review = Review(
            review_id=str(uuid.uuid4())[:14],  # 14-character generated ID
            user_id=review_req.user_id,
            user_name=review_req.user_name,
            review_title=review_req.review_title,
            review_content=review_req.review_content
        )
        
        #TO DO will handle writing to repository JSON later

        return new_review