from .base_repository import BaseRepository


class TransactionRepository(BaseRepository):
    """Repository for managing transaction data. 
    This repository handles access to transactions.json exclusively - 
    it cannot access any other files like cart.json or users.json."""
    
    def get_filename(self) -> str:
        return "transactions.json"
