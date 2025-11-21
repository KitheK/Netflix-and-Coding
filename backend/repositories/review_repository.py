# Review Repository: Data access for reviews.json

from backend.repositories.base_repository import BaseRepository
import json
from typing import Dict, Any


class ReviewRepository(BaseRepository):
    """Repository for review data. Handles all data access to reviews.json."""
    
    def get_filename(self) -> str:
        return "reviews.json"
    

    #must override the get_all and save_all methods to use a dict structure instead of the default list (array)

    def get_all(self) -> Dict[str, Any]:
        file_path = self.data_dir / self.get_filename()
        
        # Return empty dict if file doesn't exist
        if not file_path.exists():
            return {}
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Ensure we return a dict
                if isinstance(data, dict):
                    return data
                else:
                    return {}
        except (json.JSONDecodeError, IOError):
            return {}
        

    
    def save_all(self, data: Dict[str, Any]) -> None:
        file_path = self.data_dir / self.get_filename()
        
        # Write data to file with pretty formatting
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)