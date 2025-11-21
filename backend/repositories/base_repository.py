# Base Repository: Common data access logic for all repositories

import json
import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Any


class BaseRepository(ABC):
    # Abstract base class for all repositories
    # Provides common load/save logic while each subclass specifies its own file
    
    def __init__(self):
        # Initialize repository with data directory path
        self.data_dir = Path("backend/data")
        self.data_dir.mkdir(parents=True, exist_ok=True)
    
    @abstractmethod
    def get_filename(self) -> str:
        # Each repository must implement this to return its specific filename
        # This enforces the 1:1 mapping between repository and data file
        pass
    
    # Load all data from the repository's JSON file
    def get_all(self) -> List[Any]:
        file_path = self.data_dir / self.get_filename()
        
        # Return empty list if file doesn't exist
        if not file_path.exists():
            return []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Ensure we always return a list
                if isinstance(data, list):
                    return data
                else:
                    return []
        except (json.JSONDecodeError, IOError):
            return []
    
    # Save all data to the repository's JSON file
    def save_all(self, data: List[Any]) -> None:
        file_path = self.data_dir / self.get_filename()
        
        # Write data to file with pretty formatting
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


