from enum import Enum

#Data Enumerations
#Constant values that come up alot in the data
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
