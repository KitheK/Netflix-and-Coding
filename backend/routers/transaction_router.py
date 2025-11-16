"""Transaction Router: API endpoints for viewing transaction history"""

from fastapi import APIRouter, HTTPException, Query
from typing import List
from backend.models.transaction_model import Transaction
from backend.services.transaction_service import TransactionService
from backend.services.cart_service import CartService
from backend.repositories.json_repository import JsonRepository

# Create router with prefix /transactions
router = APIRouter(prefix="/transactions", tags=["transactions"])

# Initialize dependencies
repository = JsonRepository()
transaction_service = TransactionService(repository)

# We need CartService just to access the _get_user_id_from_token helper
# In a real app, this helper would be in a shared auth service
from backend.services.product_service import ProductService
product_service = ProductService(repository)
cart_service = CartService(repository, product_service)


# GET /transactions/ - Get all transactions for current user
@router.get("/", response_model=List[Transaction])
def get_user_transactions(user_token: str = Query(..., description="User authentication token")):
    try:
        # Get user_id from token
        user_id = cart_service._get_user_id_from_token(user_token)
        
        # Get all transactions for this user
        transactions = transaction_service.get_user_transactions(user_id)
        
        return transactions
        
    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        # Unexpected error
        raise HTTPException(status_code=500, detail=f"Failed to retrieve transactions: {str(e)}")


# GET /transactions/{transaction_id} - Get one specific transaction by its ID, user can only view their own transactions
@router.get("/{transaction_id}", response_model=Transaction)
def get_transaction_by_id(
    transaction_id: str,
    user_token: str = Query(..., description="User authentication token")
):
    try:
        # Get user_id from token
        user_id = cart_service._get_user_id_from_token(user_token)
        
        # Get the specific transaction (includes auth check)
        transaction = transaction_service.get_transaction_by_id(transaction_id, user_id)
        
        # If None, transaction doesn't exist
        if transaction is None:
            raise HTTPException(
                status_code=404,
                detail=f"Transaction {transaction_id} not found"
            )
        
        return transaction
        
    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=401, detail=str(e))
    except PermissionError as e:
        # Transaction belongs to someone else
        raise HTTPException(status_code=403, detail=str(e))
    except HTTPException:
        # Re-raise HTTPExceptions (like 404) as-is
        raise
    except Exception as e:
        # Unexpected error
        raise HTTPException(status_code=500, detail=f"Failed to retrieve transaction: {str(e)}")
