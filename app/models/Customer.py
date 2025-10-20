from datetime import datetime
from typing import List, Optional, Dict, Any
import hashlib
import json
from abc import ABC, abstractmethod
from app.models.Users import User, UserRole, RefundStatus
from app.models.Order import Order, OrderItem, RefundRequest, Review
from __future__ import annotations



class Customer(User):
   def __init__(self, user_id: int, name: str, email: str, password_hash: str):
       super().__init__(user_id, name, email, password_hash, UserRole.CUSTOMER)
       self.cart = Cart(user_id)
       self.penalties: List[str] = []
       self.orders: List['Order'] = []
       self.reviews: List['Review'] = []
       #Need to add the penalty list
       # self.penalties: List['Penalty'] = []


   def add_to_cart(self, product, qty: int):
       self.cart.add_item(product, qty)


   def checkout(self):
       order = self.cart.checkout()
       self.orders.append(order)
       return order


   def submit_review(self, product_id, rating, comment):
       review = Review(product_id, self.user_id, rating, comment)
       self.reviews.append(review)
       return review


   def request_refund(self, order_id, reason):
       refund_id = int(datetime.now().timestamp())  # generates unique refund ID
       return RefundRequest(refund_id, order_id, reason)



class Cart:
   def __init__(self, customer_id:int):
       self.customer_id = customer_id
       self.items: List[CartItem] = []


   def add_item(self, product, qty: int) -> None:
       #Check if product already in cart
       for item in self.items:
           if item.product.product_id == product.product_id:
               item.quantity += qty
               return
       #Add new item
       self.items.append(CartItem(product, qty))


   def remove_item(self, product) -> None:
       self.items = [item for item in self.items if item.product.product_id != product.product_id]


   def calculate_total(self)-> float:
       return sum(item.product.price * item.quantity for item in self.items)


   def checkout(self):
       order_items = [OrderItem(item.product, item.quantity, item.product.price) for item in self.items]
       order = Order(customer_id=self.customer_id, items=order_items)
       return order



class CartItem:
   def __init__(self, product, quantity: int):
       self.product = product
       self.quantity = quantity

