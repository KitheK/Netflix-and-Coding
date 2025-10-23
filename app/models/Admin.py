from app.models.User import User, UserRole, RefundStatus
from typing import List, Dict, Any
from app.models.Order import Order, RefundRequest
from datetime import datetime

#TODO: Define the product class

class Admin(User):
   def __init__(self, user_id: int, name: str, email: str, password_hash: str):
       super().__init__(user_id, name, email, password_hash, UserRole.ADMIN)
       self.permissions: List[str] = ["edit_products","delete_reviews","apply_penalties", "resolve_disputes", "approve_refunds"]


   def edit_product(self, product_id, new_info) -> str:
       msg = f"Editing product {product_id}"
       print(msg)
       return msg


   def delete_review(self, review_id) -> str:
       msg = f"Deleted review {review_id}"
       print(msg)
       return msg


   def apply_penalty(self, penalty: 'Penalty') -> str:
        msg = f"Penalty {penalty.penalty_id} applied to user {penalty.user_id}: {penalty.reason}"
        print(msg)
        return msg



   def resolve_dispute(self, dispute_id) -> str:
       msg = f"Resolved dispute {dispute_id}"
       print(msg)
       return msg


   def approve_refund(self, refund: RefundRequest) -> str:
       """
       Approve a refund request and return a confirmation message.
       """
       refund.approve()  #from Order.py
       msg = f"Admin {self.user_id} approved refund {refund.refund_id}"
       print(msg)
       return msg
  
   def deny_refund(self, refund: RefundRequest) -> str:
       """
       Deny a refund request and return a confirmation message.
       """
       refund.deny()
       msg = f"Admin {self.user_id} denied refund {refund.refund_id}"
       print(msg)
       return msg



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




  

