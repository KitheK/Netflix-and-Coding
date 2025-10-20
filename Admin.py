from Users import User,UserRole
from typing import List, Dict, Any
from Customer import Cart
from Order import Order, RefundRequest
from datetime import datetime
from enum import Enum, RefundStatus
#TODO: Define the product class
class Admin(User):
    def __init__(self, user_id: int, name: str, email: str, password_hash: str):
        super().__init__(user_id, name, email, password_hash, UserRole.ADMIN)
        self.permissions:List[str] = ["edit_products","delete_reviews","apply_penalties", "resolve_disputes", "approve_refunds"]

    def edit_product(self, product_id, new_info):
        print(f"Editing product {product_id}")

    def delete_review(self, review_id):
        print(f"Deleted review {review_id}")

    def apply_penalty(self, user_id, penalty):
        print(f"Penalty applied to user {user_id}")

    def resolve_dispute(self, dispute_id):
        print(f"Resolved dispute {dispute_id}")

    def approve_refund(self, refund_id):
        print(f"Refund {refund_id} approved")
      
class AnalyticsDashboard:
    def __init__(self):
        self.total_revenue = 0.0
        self.orders_count = 0
        self.avg_order_value = 0.0
    
    def generate_report(self, seller_id: int) -> str:
        return f"Sales Report for Seller {seller_id}: Revenue: ${self.total_revenue:.2f}, Orders: {self.orders_count}"
    
    ## def get_top_products(self) -> List[Product]:
        # This would typically query actual sales data
        ## return []

class Penalty:
    def __init__(self, penalty_id: int, user_id: int, reason: str):
        self.penalty_id = penalty_id
        self.user_id = user_id
        self.reason = reason
        self.date_issued = datetime.now()
        self.status = "Active"


class RefundRequest:
    def __init__(self, refund_id: int, order_id: int, reason: str):
        self.refund_id = refund_id
        self.order_id = order_id
        self.reason = reason
        self.status = RefundStatus.Requested
        self.date_requested = datetime.now()
    
    def approve(self) -> None:
        self.status = RefundStatus.Approved
        print(f"Refund {self.refund_id} approved")
    
    def deny(self) -> None:
        self.status = RefundStatus.Denied
        print(f"Refund {self.refund_id} denied")
    
    def __str__(self):
        return f"Refund #{self.refund_id} - {self.status.value} - Reason: {self.reason}"

    