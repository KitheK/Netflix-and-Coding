from app.models.User import User, UserRole
from app.models.Product import Product,ProductCreate, ProductUpdate, ProductResponse
from app.models.Admin import AnalyticsDashboard
from typing import List, Optional
from pydantic import BaseModel, validator, Field
from datetime import datetime



class Seller(User):
    def __init__(self, user_id: int, name: str, email: str, password_hash: str, analytics: AnalyticsDashboard):
        super().__init__(user_id, name, email, password_hash, UserRole.SELLER)
        self.products = []
        self.analytics = analytics

    def add_product(self, product):
        self.products.append(product)

    def update_product(self, product_id, details):
        for p in self.products:
            if p.product_id == product_id:
                p.__dict__.update(details)
                print(f"Product {product_id} updated.")
                return
            print(f"Product {product_id} not found.")

    def remove_product(self, product_id):
        self.products = [p for p in self.products if p.product_id != product_id]
        print(f"Product {product_id} removed.")

    def view_sales_report(self):
        return self.analytics.generate_report(self.user_id)

# Pydantic models for API requests/responses
class SellerCreate(BaseModel):
    """Model for creating a new seller"""
    name: str
    email: str
    password: str
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Seller name cannot be empty')
        return v.strip()
    
    @validator('password')
    def password_must_be_strong(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class SellerResponse(BaseModel):
    """Model for seller response (without sensitive data)"""
    user_id: int
    name: str
    email: str
    role: UserRole
    product_count: int
    total_products: int
    
    class Config:
        from_attributes = True

class SellerProfileUpdate(BaseModel):
    """Model for updating seller profile"""
    name: Optional[str] = None
    email: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip() if v else v

class ProductOperationResponse(BaseModel):
    """Model for product operation responses"""
    success: bool
    message: str
    product_id: Optional[str] = None
    product: Optional[ProductResponse] = None

class SalesReportRequest(BaseModel):
    seller_id: str
    start_date: datetime
    end_date: datetime
    report_type: str = Field(default="summary", pattern="^(summary|detailed|financial)$")
    
    def __init__(self, seller_id: str, start_date: datetime, end_date: datetime, report_type: str = "summary"):
        super().__init__(seller_id=seller_id, start_date=start_date, end_date=end_date, report_type=report_type)

class SalesReportResponse(BaseModel):
    """Model for sales report response"""
    seller_id: int
    report_type: str
    period: str
    total_sales: float
    total_products: int
    top_performing_products: List[dict]
    generated_at: datetime

class SellerProductsResponse(BaseModel):
    """Model for listing seller's products"""
    seller_id: int
    seller_name: str
    products: List[ProductResponse]
    total_products: int
    average_rating: float