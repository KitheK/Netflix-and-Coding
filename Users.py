from enum import Enum
from typing import List, Optional
from datetime import datetime
import hashlib
import json

#Data Enumerations
#Constant values that come up alot in the data
#Just declaring these early
class UserRole(Enum):
    CUSTOMER = "Customer"
    SELLER = "Seller"
    ADMIN = "Admin"

class OrderStatus(Enum):
    PENDING = "Pending"
    PAID = "Paid"
    FULFILLED = "Fulfilled"
    CANCELLED = "Cancelled"

class RefundStatus(Enum):
    REQUESTED = "Requested"
    APPROVED = "Approved"
    DENIED = "Denied"

from abc import ABC, abstractmethod
from typing import List

"Abstract User class "
"Verify/store user information"
"Hash the password"
"Declare the role"
class User(ABC):
    def __init__(self, user_id: int, name: str, email: str, password_hash: str, role: str):
        "Checking if login information is aqurate"
        self.user_id = user_id # Unique user identification
        self.name = name
        self.email = email
        self.password_hash = password_hash
        self.role = role #Role in the system; determinant of the landing page
        "Error handling for incorrect user information"
        #User ID is less than 0, if the email is invalid, or the password is invalid it will raise an error
        if not isinstance(user_id, int) or user_id < 0: 
            raise ValueError("Invalid user ID")
        if not email or '@' not in email:
            raise ValueError("Invalid email format") 
        if not name or not password_hash:
            raise ValueError("Name and password cannot be empty")

    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest
    
    def login(self, email: str, password: str) -> bool:
        return self.email == email and password == self.password_hash(password)

    def logout(self) -> None:
        print(f"{self.name} logged out.")

    @abstractmethod
#not yet coded out the dashboard
#The dashboard in this case refers to the custom landing page that the diffrent kinds of users will come to
    def view_dashboard(self):
        pass

"Abstract seller class"
class Seller(User):
    
    def __init__(self, user_id: int, name: str, email: str, password_hash: str, analytics):
        super().__init__(user_id, name, email, password_hash, UserRole.SELLER)
        self.products = []
        self.analytics = analytics

    def add_product(self, product):
        self.products.append(product)

    def update_product(self, product_id, details):
        for p in self.products:
            if p.product_id == product_id:
                p.__dict__.update(details)
                return

    def remove_product(self, product_id):
        self.products = [p for p in self.products if p.product_id != product_id]

    def view_sales_report(self):
        return self.analytics.generate_report(self.user_id)