from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict
import uuid

# Pydantic Models for API
class ProductBase(BaseModel):
    """Base model with common product fields"""
    product_name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    discounted_price: float = Field(..., gt=0)
    actual_price: float = Field(..., gt=0)
    discount_percentage: float = Field(..., ge=0, le=100)
    rating: float = Field(..., ge=0.0, le=5.0)
    rating_count: int = Field(..., ge=0)
    about_product: str = Field(..., min_length=1)
    img_link: str = Field(..., min_length=1)
    product_link: str = Field(..., min_length=1)

    model_config = ConfigDict(str_strip_whitespace=True)

    @field_validator('product_name', 'category', 'about_product')
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        return v.strip()


class ProductCreate(ProductBase):
    """Model for creating a new product"""
    pass


class ProductUpdate(BaseModel):
    """Model for updating an existing product"""
    product_name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    discounted_price: Optional[float] = Field(None, gt=0)
    actual_price: Optional[float] = Field(None, gt=0)
    discount_percentage: Optional[float] = Field(None, ge=0, le=100)
    rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    rating_count: Optional[int] = Field(None, ge=0)
    about_product: Optional[str] = Field(None, min_length=1)
    img_link: Optional[str] = Field(None, min_length=1)
    product_link: Optional[str] = Field(None, min_length=1)

    model_config = ConfigDict(str_strip_whitespace=True)


class ProductResponse(ProductBase):
    """Model for product response (API-safe format)"""
    product_id: str
    review_count: int = Field(0, ge=0)
    
    model_config = ConfigDict(from_attributes=True)


class ProductDetailResponse(ProductResponse):
    """Extended response including reviews"""
    reviews: List[Dict[str, Any]] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)


class ProductSearch(BaseModel):
    """Model for product search parameters"""
    query: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, min_length=1)
    min_rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    max_price: Optional[float] = Field(None, gt=0)
    min_discount: Optional[float] = Field(None, ge=0, le=100)
    skip: int = Field(0, ge=0)
    limit: int = Field(100, ge=1, le=1000)


# Simple Product class
class Product:
    def __init__(self, product_id: str = None, product_name: str = "", category: str = "", 
                 discounted_price: float = 0.0, actual_price: float = 0.0, 
                 discount_percentage: float = 0.0, rating: float = 0.0, rating_count: int = 0, 
                 about_product: str = "", img_link: str = "", product_link: str = ""):
        self.product_id = product_id or str(uuid.uuid4())
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
        self.reviews: List[Dict] = []

    def add_review(self, review_data: Dict):
        self.reviews.append(review_data)

    def to_dict(self) -> Dict[str, Any]:
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
            "reviews": self.reviews,
            "img_link": self.img_link,
            "product_link": self.product_link
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Product':
        return cls(
            product_id=data.get('product_id'),
            product_name=data['product_name'],
            category=data['category'],
            discounted_price=float(data['discounted_price']),
            actual_price=float(data['actual_price']),
            discount_percentage=float(data['discount_percentage']),
            rating=float(data['rating']),
            rating_count=int(data['rating_count']),
            about_product=data['about_product'],
            img_link=data['img_link'],
            product_link=data['product_link']
        )


# Export only what's available - NO Review class
__all__ = ['Product', 'ProductCreate', 'ProductUpdate', 'ProductResponse', 
           'ProductDetailResponse', 'ProductSearch', 'ProductBase']