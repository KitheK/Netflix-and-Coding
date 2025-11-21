"""Transaction Service: Business logic for viewing transaction history"""

from typing import List, Optional
from backend.models.transaction_model import Transaction
from backend.repositories.transaction_repository import TransactionRepository


class TransactionService:
    
    def __init__(self):
        # Create our own repository internally
        self.transaction_repository = TransactionRepository()
    
    #get all transactions for a specific user, sorted by newest first
    def get_user_transactions(self, user_id: str) -> List[Transaction]:

        # Load all transactions from file (now a dict: {"user_id": [transactions]})
        all_transactions = self.transaction_repository.get_all()
        
        # Handle empty or corrupted file
        if not isinstance(all_transactions, dict):
            return []
        
        # Get transactions for this user (O(1) lookup instead of O(n) filtering!)
        user_transaction_dicts = all_transactions.get(user_id, [])
        
        # Convert dicts to Pydantic models
        user_transactions = [
            Transaction(**transaction_dict)
            for transaction_dict in user_transaction_dicts
        ]
        
        # Sort by timestamp, newest first
        # The timestamp is ISO format string, so it sorts correctly alphabetically
        user_transactions.sort(key=lambda t: t.timestamp, reverse=True)
        
        return user_transactions
    

    #get a specific transaction by its ID, includes authorization check (so user can only view their own transactions)
    def get_transaction_by_id(self, transaction_id: str, user_id: str) -> Optional[Transaction]:
       
        # Load all transactions (now a dict: {"user_id": [transactions]})
        all_transactions = self.transaction_repository.get_all()
        
        # Handle empty or corrupted file
        if not isinstance(all_transactions, dict):
            return None
        
        # Get transactions for this user (O(1) lookup)
        user_transaction_dicts = all_transactions.get(user_id, [])
        
        # Find the specific transaction in this user's transactions
        for transaction_dict in user_transaction_dicts:
            if transaction_dict.get("transaction_id") == transaction_id:
                # Found the transaction and it belongs to this user
                return Transaction(**transaction_dict)
        
        # Transaction not found in this user's transactions
        # Check if it exists for another user (for proper error messaging)
        for other_user_id, transactions in all_transactions.items():
            if other_user_id != user_id:
                for transaction_dict in transactions:
                    if transaction_dict.get("transaction_id") == transaction_id:
                        # Transaction exists but belongs to someone else
                        raise PermissionError(
                            f"Access denied: Transaction {transaction_id} does not belong to this user"
                        )
        
        # Transaction not found at all
        return None
