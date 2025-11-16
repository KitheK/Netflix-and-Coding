# This file gets JSON data from files in a specified directory

import json
from pathlib import Path
from typing import Any

# Repository to load JSON data files
class JsonRepository:
    # default directory is backend/data
    def __init__(self, data_dir: str = "backend/data"):
        self.data_dir = Path(data_dir)
    
    # gets all data from a json file in the data directory (can return list, dict, or any JSON type)
    def get_all(self, filename: str) -> Any:
        # combines directory and filename to get full path. ex. backend/data/ + products.json
        file_path = self.data_dir / filename
        
        # if file does not exist, return empty list
        if not file_path.exists():
            return []
        
        # opens and reads the json file, "with" automatically closes the file after reading, encoding utf-8 to support special characters
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # return the data
        return data
    
    # saves data to a json file in the data directory
    def save_all(self, filename: str, data: Any) -> bool:
        # combines directory and filename to get full path. ex. backend/data/ + cart.json
        file_path = self.data_dir / filename
        
        # create parent directories if they don't exist (needed for test subdirectories)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # write data to file with pretty formatting (indent=2 makes it readable, ensure_ascii=False supports special characters)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        # return True if successful
        return True
    
    # Compatibility wrapper - same as get_all()
    def load(self, filename: str):
        """Alias for get_all() - reads JSON file and returns data"""
        return self.get_all(filename)
    
    # Compatibility wrapper - same as save_all()
    def save(self, filename: str, data: Any):
        """Alias for save_all() - writes data to JSON file"""
        self.save_all(filename, data)
