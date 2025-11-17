"""Product models for request/response"""

from pydantic import BaseModel
from typing import Optional


class Product(BaseModel):
    """Product model matching products.json structure"""
    product_id: str
    product_name: str
    category: str
    discounted_price: float
    actual_price: float
    discount_percentage: float
    rating: float
    rating_count: Optional[int] = None
    about_product: str
    img_link: str
    product_link: str


class CreateProductRequest(BaseModel):
    """Request model for creating a new product"""
    product_name: str
    category: str
    discounted_price: float
    actual_price: float
    discount_percentage: float
    about_product: str
    img_link: str
    product_link: str
    rating: float = 0.0  # Default to 0.0 if not provided
    rating_count: Optional[int] = None

