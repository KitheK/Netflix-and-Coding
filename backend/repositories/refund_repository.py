from backend.repositories.base_repository import BaseRepository
from backend.models.refund_model import Refund
from typing import List, Optional


class RefundRepository(BaseRepository):
    # Repository for managing refund data persistence
    # Handles CRUD operations for refunds.json
    
    def get_filename(self) -> str:
        # 1:1 mapping - this repository only manages refunds.json
        return "refunds.json"
    
    # Get all refunds from storage
    def get_all(self) -> List[dict]:
        return super().get_all()
    
    # Get a single refund by its ID
    def get_by_id(self, refund_id: str) -> Optional[dict]:
        refunds = self.get_all()
        for refund in refunds:
            if refund.get("refund_id") == refund_id:
                return refund
        return None
    
    # Get refund by transaction ID (to check if refund already exists)
    def get_by_transaction_id(self, transaction_id: str) -> Optional[dict]:
        refunds = self.get_all()
        for refund in refunds:
            if refund.get("transaction_id") == transaction_id:
                return refund
        return None
    
    # Create a new refund
    def create(self, refund: Refund) -> Refund:
        refunds = self.get_all()
        refunds.append(refund.model_dump())
        self.save_all(refunds)
        return refund
    
    # Update an existing refund
    def update(self, refund_id: str, updated_refund: dict) -> Optional[dict]:
        refunds = self.get_all()
        for i, refund in enumerate(refunds):
            if refund.get("refund_id") == refund_id:
                refunds[i] = updated_refund
                self.save_all(refunds)
                return updated_refund
        return None
