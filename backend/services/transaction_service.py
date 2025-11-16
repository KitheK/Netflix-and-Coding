"""Transaction Service: Business logic for viewing transaction history"""

from typing import List, Optional
from backend.models.transaction_model import Transaction
from backend.repositories.json_repository import JsonRepository


class TransactionService:
    
    def __init__(self, repository: JsonRepository):
        self.repository = repository
    
    #get all transactions for a specific user, sorted by newest first
    def get_user_transactions(self, user_id: str) -> List[Transaction]:

        # Load all transactions from file
        all_transactions = self.repository.load("transactions.json")
        
        # Handle empty or corrupted file
        if not isinstance(all_transactions, list):
            return []
        
        # Filter transactions for this specific user
        user_transactions = [
            Transaction(**transaction_dict)  # Convert dict to Pydantic model
            for transaction_dict in all_transactions
            if transaction_dict.get("user_id") == user_id
        ]
        
        # Sort by timestamp, newest first
        # The timestamp is ISO format string, so it sorts correctly alphabetically
        user_transactions.sort(key=lambda t: t.timestamp, reverse=True)
        
        return user_transactions
    

    #get a specific transaction by its ID, includes authorization check (so user can only view their own transactions)
    def get_transaction_by_id(self, transaction_id: str, user_id: str) -> Optional[Transaction]:
       
        # Load all transactions
        all_transactions = self.repository.load("transactions.json")
        
        # Handle empty or corrupted file
        if not isinstance(all_transactions, list):
            return None
        
        # Find the specific transaction
        for transaction_dict in all_transactions:
            if transaction_dict.get("transaction_id") == transaction_id:
                
                # Found the transaction - now check authorization
                if transaction_dict.get("user_id") != user_id:
                    # Transaction exists but belongs to someone else
                    raise PermissionError(
                        f"Access denied: Transaction {transaction_id} does not belong to this user"
                    )
                
                # Transaction found and belongs to this user
                return Transaction(**transaction_dict)
        
        # Transaction not found
        return None
