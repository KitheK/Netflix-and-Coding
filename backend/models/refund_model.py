from pydantic import BaseModel
from typing import Optional


# RefundRequest: What the customer sends when requesting a refund
class RefundRequest(BaseModel):
    transaction_id: str  # The transaction they want to refund
    message: str         # Why they want a refund


# Refund: The stored refund request with status tracking
class Refund(BaseModel):
    refund_id: str                      # Unique UUID for this refund
    transaction_id: str                 # The transaction being refunded
    user_id: str                        # UUID of user requesting refund
    message: str                        # Customer's refund reason
    status: str = "pending"             # pending | approved | denied
    created_at: str                     # ISO format timestamp
    updated_at: Optional[str] = None    # ISO format timestamp when admin responded


# RefundResponse: What gets returned after creating/updating a refund
class RefundResponse(BaseModel):
    message: str         # Success message
    refund: Refund       # The refund details
