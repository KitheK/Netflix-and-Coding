"Admin Review Deletion Service"
from typing import Optional, List
from backend.models.review_model import Review
from backend.models.user_model import User


class Delete_Review:

    def _load_all_reviews(self) -> List [Review]:
        # Get raw data from repository
        raw_products = self.repository.load("reviews.son")

        #write code to get raw review

    def get_review_by_userId(self, User_id: str)-> Optional [Review]: 

        reviews = self._load_all_reviews()
        # Search through
        for review in reviews:
            if review.user_id == User_id:
                return review #Return the found product
            
        return None
    def get_review(self, User_id: str, review_id: str)-> Optional [Review]: 

        reviews = self._load_all_reviews()
        # Search through
        for review in reviews:
            if review.user_id == User_id & review.review_id == review_id:
                return review #Return the found product
        print(f"Rewview : {review_id}does not exist")
        return None
    
    def delete_review(self, review_id: str) -> List[Review]:

        reviews = self._load_all_reviews()

        #Look for specific review to delete
        for review in reviews:
             if review.review_id == review_id:
                 #delete(review)
                print(f"Review {review.review_title} delete")
        return None
    def delete(self, review: Review)-> List [Review]:
        
             rev1 =self.get_review_by_userId(review.user_id)  # delete the review
             rev1 =  None