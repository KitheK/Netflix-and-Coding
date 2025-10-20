from datetime import datetime
from typing import List, Optional, Dict, Any
from datetime import datetime
import hashlib
import json
from abc import ABC, abstractmethod
from Users import User
from enum import Enum, RefundStatus
class Order:
    def __init__(self, customer_id: int, items: list):
        self.order_id = int(datetime.now().timestamp())
        self.customer_id = customer_id
        self.items = items
        self.total_amount = sum(item.price * item.quantity for item in items)
        self.status = "Pending"
        self.transaction_id = f"TXN-{self.order_id}"

    def confirm_order(self):
        self.status = "Confirmed"

    def mark_fulfilled(self):
        self.status = "Fulfilled"

    def generate_receipt(self):
        return Receipt(self.order_id, self.items, self.total_amount)


class OrderItem:
    def __init__(self, product, quantity: int, price: float):
        self.product = product
        self.quantity = quantity
        self.price = price


class Receipt:
    def __init__(self, order_id: int, items: list, total_amount: float):
        self.receipt_id = int(datetime.now().timestamp())
        self.order_id = order_id
        self.date_issued = datetime.now()
        self.total_amount = total_amount
        self.items = items

    def print_receipt(self) -> str:
        return f"Receipt #{self.receipt_id} - Total: ${self.total_amount:.2f}"

    def email_receipt(self, email: str):
        print(f"Receipt emailed to {email}")


class RefundRequest:
    def __init__(self, order_id: int, reason: str):
        self.refund_id = int(datetime.now().timestamp())
        self.order_id = order_id
        self.reason = reason
        self.status = "Pending"

    def approve(self):
        self.status = "Approved"

    def deny(self):
        self.status = "Denied"
class RefundRequest:
    def __init__(self, refund_id: int, order_id: int, reason: str):
        self.refund_id = refund_id
        self.order_id = order_id
        self.reason = reason
        self.status = RefundStatus.REQUESTED
        self.date_requested = datetime.now()
    
    def approve(self) -> None:
        self.status = RefundStatus.APPROVED
        print(f"Refund {self.refund_id} approved")
    
    def deny(self) -> None:
        self.status = RefundStatus.DENIED
        print(f"Refund {self.refund_id} denied")
    
    def __str__(self):
        return f"Refund #{self.refund_id} - {self.status.value} - Reason: {self.reason}"