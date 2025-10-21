from datetime import datetime
from typing import List, Dict, Optional
import json

class Review:
    def __init__(self, review_id: str, user_id: str, user_name: str, rating: float, title: str, content: str):
        self.review_id = review_id
        self.user_id = user_id
        self.user_name = user_name
        self.rating = rating
        self.title = title
        self.content = content
        self.date_posted = datetime.now().isoformat()

    def to_dict(self) -> Dict:
        return {
            "review_id": self.review_id,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "rating": self.rating,
            "review_title": self.title,
            "review_content": self.content,
            "date_posted": self.date_posted
        }


class Product:
    def __init__(self, product_id: str, product_name: str, category: str, discounted_price: str, actual_price: str, discount_percentage: str, rating: float, rating_count: int, about_product: str, img_link: str, product_link: str):
        self.product_id = product_id
        self.product_name = product_name
        self.category = category
        self.discounted_price = discounted_price
        self.actual_price = actual_price
        self.discount_percentage = discount_percentage
        self.rating = rating
        self.rating_count = rating_count
        self.about_product = about_product
        self.img_link = img_link
        self.product_link = product_link
        self.reviews: List[Review] = []

    def add_review(self, review: Review):
        self.reviews.append(review)

    def to_dict(self) -> Dict:
        return {
            "product_id": self.product_id,
            "product_name": self.product_name,
            "category": self.category,
            "discounted_price": self.discounted_price,
            "actual_price": self.actual_price,
            "discount_percentage": self.discount_percentage,
            "rating": self.rating,
            "rating_count": self.rating_count,
            "about_product": self.about_product,
            "reviews": [r.to_dict() for r in self.reviews],
            "img_link": self.img_link,
            "product_link": self.product_link
        }
