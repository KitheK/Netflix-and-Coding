from datetime import datetime
from typing import List, Dict, Optional
from app.models.Review import Review
import json

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
        self.reviews: List[Review] = [] #composition (product has maany reviews)

    def add_review(self, review: Review):
        self.reviews.append(review)

    #converts product and reviews to dict for json saving
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
