"""Refund Service: Business logic for refund request management"""

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException

from backend.models.refund_model import Refund, RefundRequest
from backend.repositories.refund_repository import RefundRepository
from backend.repositories.transaction_repository import TransactionRepository


class RefundService:
    
    def __init__(self):
        # Create repositories internally
        self.refund_repository = RefundRepository()
        self.transaction_repository = TransactionRepository()
    
    # Customer creates a new refund request
    def create_refund_request(self, refund_request: RefundRequest, user_id: str) -> Refund:
        """
        Create a new refund request for a transaction.
        Validates that:
        1. Transaction exists and belongs to this user
        2. No refund already exists for this transaction
        """
        
        # Check if transaction exists and belongs to this user
        all_transactions = self.transaction_repository.get_all()
        user_transactions = all_transactions.get(user_id, [])
        
        transaction_found = False
        for transaction in user_transactions:
            if transaction.get("transaction_id") == refund_request.transaction_id:
                transaction_found = True
                break
        
        if not transaction_found:
            raise HTTPException(
                status_code=404,
                detail="Transaction not found or does not belong to this user"
            )
        
        # Check if refund already exists for this transaction
        existing_refund = self.refund_repository.get_by_transaction_id(refund_request.transaction_id)
        if existing_refund:
            raise HTTPException(
                status_code=400,
                detail=f"Refund request already exists for this transaction with status: {existing_refund.get('status')}"
            )
        
        # Create new refund
        refund = Refund(
            refund_id=str(uuid.uuid4()),
            transaction_id=refund_request.transaction_id,
            user_id=user_id,
            message=refund_request.message,
            status="pending",
            created_at=datetime.now().isoformat(),
            updated_at=None
        )
        
        return self.refund_repository.create(refund)
    
    # Get all refund requests (admin only)
    def get_all_refund_requests(self) -> List[Refund]:
        """Get all refund requests for admin to review"""
        refund_dicts = self.refund_repository.get_all()
        return [Refund(**refund_dict) for refund_dict in refund_dicts]
    
    # Get refund requests for a specific user
    def get_user_refund_requests(self, user_id: str) -> List[Refund]:
        """Get all refund requests made by a specific user"""
        all_refunds = self.refund_repository.get_all()
        user_refunds = [r for r in all_refunds if r.get("user_id") == user_id]
        return [Refund(**refund_dict) for refund_dict in user_refunds]
    
    # Admin approves a refund request
    def approve_refund(self, refund_id: str) -> Refund:
        """
        Admin approves a refund request.
        Updates refund status to 'approved' and marks transaction as refunded.
        """
        
        # Get the refund
        refund_dict = self.refund_repository.get_by_id(refund_id)
        if not refund_dict:
            raise HTTPException(status_code=404, detail="Refund request not found")
        
        # Check if already processed
        if refund_dict.get("status") != "pending":
            raise HTTPException(
                status_code=400,
                detail=f"Refund request already {refund_dict.get('status')}"
            )
        
        # Update refund status
        refund_dict["status"] = "approved"
        refund_dict["updated_at"] = datetime.now().isoformat()
        
        updated_refund = self.refund_repository.update(refund_id, refund_dict)
        
        # Mark transaction as refunded
        self._update_transaction_status(refund_dict.get("transaction_id"), refund_dict.get("user_id"))
        
        return Refund(**updated_refund)
    
    # Admin denies a refund request
    def deny_refund(self, refund_id: str) -> Refund:
        """Admin denies a refund request"""
        
        # Get the refund
        refund_dict = self.refund_repository.get_by_id(refund_id)
        if not refund_dict:
            raise HTTPException(status_code=404, detail="Refund request not found")
        
        # Check if already processed
        if refund_dict.get("status") != "pending":
            raise HTTPException(
                status_code=400,
                detail=f"Refund request already {refund_dict.get('status')}"
            )
        
        # Update refund status
        refund_dict["status"] = "denied"
        refund_dict["updated_at"] = datetime.now().isoformat()
        
        updated_refund = self.refund_repository.update(refund_id, refund_dict)
        return Refund(**updated_refund)
    
    # Helper method to update transaction status when refund is approved
    def _update_transaction_status(self, transaction_id: str, user_id: str) -> None:
        """Update transaction status to 'refunded' when refund is approved"""
        
        all_transactions = self.transaction_repository.get_all()
        user_transactions = all_transactions.get(user_id, [])
        
        for transaction in user_transactions:
            if transaction.get("transaction_id") == transaction_id:
                transaction["status"] = "refunded"
                break
        
        all_transactions[user_id] = user_transactions
        self.transaction_repository.save_all(all_transactions)
