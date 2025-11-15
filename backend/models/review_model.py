from pydantic import BaseModel


class Review(BaseModel):
    """Review model - user reviews for products"""
    
    review_id: str
    product_id: str  # which product this review is for
    user_id: str
    user_name: str
    review_title: str
    review_content: str
