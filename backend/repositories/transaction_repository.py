from .base_repository import BaseRepository
import json
from typing import Dict, Any


class TransactionRepository(BaseRepository):
    """Repository for managing transaction data. 
    This repository handles access to transactions.json exclusively - 
    it cannot access any other files like cart.json or users.json.
    
    Transactions are stored in a nested dict structure: {"user_id": [transaction_objects]}
    This allows O(1) lookup of user transactions instead of O(n) filtering."""
    
    def get_filename(self) -> str:
        return "transactions.json"
    
    def get_all(self) -> Dict[str, Any]:
        """Override to return dict instead of list.
        Returns nested dict structure: {"user_id": [transactions]}"""
        file_path = self.data_dir / self.get_filename()
        if not file_path.exists():
            return {}
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
                else:
                    return {}
        except (json.JSONDecodeError, IOError):
            return {}
    
    def save_all(self, data: Dict[str, Any]) -> None:
        """Override to save dict structure instead of list."""
        file_path = self.data_dir / self.get_filename()
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
