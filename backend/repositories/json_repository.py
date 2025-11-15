# This file gets JSON data from files in a specified directory

import json
from pathlib import Path
from typing import List, Dict, Any

# Repository to load JSON data files
class JsonRepository:
        #default directory is backend/data
    def __init__(self, data_dir: str = "backend/data"):
        self.data_dir = Path(data_dir)
    

    #gets all data from a json file in the data directory
    def get_all(self, filename: str) -> List[Dict[str, Any]]:
       
        #combines directory and filename to get full path.   ex. backend/data/ + products.json
        file_path = self.data_dir / filename
        
        #if file does not exist, return empty list
        if not file_path.exists():
            return [] 
        
        # opens and reads the json file, "with" automatically closes the file after reading, encoding utf-8 to support special characters
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # return the data
        return data
    


    # saves data to a json file in the data directory
    def save_all(self, filename: str, data: Dict[str, Any]) -> bool:
        
        # combines directory and filename to get full path. ex. backend/data/ + cart.json
        file_path = self.data_dir / filename
        
        # write data to file with pretty formatting (indent=2 makes it readable, ensure_ascii=False supports special characters)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        # return True if successful
        return True
