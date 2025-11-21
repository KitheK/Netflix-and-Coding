# Review Service: Business logic for reviews

from backend.repositories.review_repository import ReviewRepository
from typing import List
from backend.models.review_model import Review, AddReviewRequest
import json
from pathlib import Path
import uuid


class ReviewService:
    """Service for handling review-related business logic"""
    
    #will need to be changed if path changes!!
    TRANSACTIONS_FILE = Path("backend/data/transactions.json")

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
        if not self.user_has_purchased(review_req.user_id, product_id):
            raise ValueError("User has not purchased this product")

         # Create Review object
        new_review = Review(
            review_id=str(uuid.uuid4())[:14],  # 14-character generated ID
            user_id=review_req.user_id,
            user_name=review_req.user_name,
            review_title=review_req.review_title,
            review_content=review_req.review_content
        )
        #
        # TO DO handle writing to repository JSON later
        #
        return new_review
    
    #loads the transactions from given file
    @classmethod
    def load_transactions(cls) -> dict:
        """Load transactions.json and return dict by user_id"""
        path = Path(__file__).parent.parent / "data" / "transactions.json"
        if not path.exists():
            return {}
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    @classmethod
    def user_has_purchased(cls, user_id: str, product_id: str) -> bool:
        """Return True if user has purchased the product in any completed transaction"""
        transactions_by_user = cls.load_transactions().get(user_id, [])
        for tx in transactions_by_user:
            if tx.get("status") != "completed":
                continue
            for item in tx.get("items", []):
                if item.get("product_id") == product_id:
                    return True
        return False