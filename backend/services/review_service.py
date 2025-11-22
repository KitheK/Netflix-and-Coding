# Review Service: Business logic for reviews

from backend.repositories.review_repository import ReviewRepository
from typing import List
from backend.models.review_model import Review, AddReviewRequest
import json
from pathlib import Path
import uuid



class ReviewService:
    """
    Service layer for review-related business logic.
    Handles validation, business rules, and delegates persistence to ReviewRepository.
    All review endpoints should use this service instead of accessing the repository directly.
    """

    def delete_review_by_id(self, product_id: str, review_id: str) -> bool:
        """
        Delete a review by product_id and review_id.
        Returns True if deleted, False if not found.
        This is intended for admin use only (enforced at the router layer).
        """
        all_reviews = self.review_repository.get_all()
        if product_id not in all_reviews:
            return False
        reviews = all_reviews[product_id]
        initial_count = len(reviews)
        # Remove review with matching review_id
        reviews = [r for r in reviews if r.get("review_id") != review_id]
        if len(reviews) == initial_count:
            return False  # No review deleted
        all_reviews[product_id] = reviews
        self.review_repository.save_all(all_reviews)
        return True
    
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
        
        # Check if user has purchased this item
        if not self.user_has_purchased(review_req.user_id, product_id):
            raise ValueError("User has not purchased this product")

        #check if user has already reviewed this product
        all_reviews = self.review_repository.get_all()
        product_reviews = all_reviews.get(product_id, [])
        for review in product_reviews:
            if review["user_id"] == review_req.user_id:
                raise ValueError("User has already reviewed this product")

         # Create Review object
        new_review = Review(
            review_id=str(uuid.uuid4())[:14],  # 14-character generated ID
            user_id=review_req.user_id,
            user_name=review_req.user_name,
            review_title=review_req.review_title,
            review_content=review_req.review_content
        )
        # Writing to repository JSON
        self.save_review_to_file(product_id, new_review)
        
        return new_review
    #saves the review to the file
    def save_review_to_file(self, product_id: str, review: Review):
        """Append the review to reviews.json safely"""
        all_reviews = self.review_repository.get_all()  # get current data
        if product_id not in all_reviews:
            all_reviews[product_id] = []
    
        # Use Pydantic v2 API `model_dump()` to get a dict representation
        all_reviews[product_id].append(review.model_dump())

        # Write back to file
        self.review_repository.save_all(all_reviews)


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