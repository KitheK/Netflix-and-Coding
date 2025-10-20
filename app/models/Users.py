from enum import Enum
from typing import List, Optional
from datetime import datetime
import hashlib
import json
from app.models.Enums import UserRole, OrderStatus, RefundStatus
from abc import ABC, abstractmethod
from typing import List

"Abstract User class "
"Verify/store user information"
"Hash the password"
"Declare the role"
class User(ABC):
    def __init__(self, user_id: int, name: str, email: str, password_hash: str, role: UserRole):
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
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, plain: str) -> bool:
        return self._hash_password(plain) == self.password_hash
    
    def login(self, email: str, password: str) -> bool:
        return self.email == email and self.verify_password(password)

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
                print(f"Product {product_id} updated.")
                return
            print(f"Product {product_id} not found.")

    def remove_product(self, product_id):
        self.products = [p for p in self.products if p.product_id != product_id]
        print(f"Product {product_id} removed.") 
    def view_sales_report(self):
        return self.analytics.generate_report(self.user_id)