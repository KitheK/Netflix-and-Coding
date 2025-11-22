from pydantic import BaseModel
from typing import List


# TransactionItem: Represents a single item in a transaction
# This is a snapshot of the product at the time of purchase
# Similar to CartItem, but immutable - captures price/quantity at checkout time
class TransactionItem(BaseModel):
    product_id: str              # The product ID (e.g., "B07JW9H4J1")
    product_name: str            # Product name at time of purchase
    img_link: str                # Product image URL
    product_link: str            # Link to product page
    discounted_price: float      # Price at time of purchase (snapshot)
    quantity: int                # How many of this item were purchased


# Transaction: Represents a completed purchase
# This is the full record of what a user bought
class Transaction(BaseModel):
    transaction_id: str          # Unique UUID for this transaction
    user_id: str                 # UUID of the user who made the purchase
    customer_name: str           # Customer name for receipt
    customer_email: str          # Customer email for receipt
    items: List[TransactionItem] # List of items purchased (snapshot from cart)
    total_price: float           # Total cost of all items (sum of price * quantity)
    timestamp: str               # ISO format timestamp of when purchase was made
    estimated_delivery: str      # Estimated delivery date (YYYY-MM-DD format)
    status: str = "completed"    # Status of transaction. this is always "completed" since there is no payment processing.


# CheckoutResponse: What gets returned after a successful checkout
# This confirms the order and provides the transaction details
class CheckoutResponse(BaseModel):
    message: str                 # Success message like "Order confirmed"
    transaction: Transaction     # Full transaction details (the "receipt")
