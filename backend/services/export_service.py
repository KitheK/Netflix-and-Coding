"""Export Service: Business logic for exporting JSON data files"""

import os
import json
from typing import Dict, List, Optional
from datetime import datetime


class ExportService:
    """Service for handling data exports (admin only)"""
    
    # Define allowed files that can be exported
    ALLOWED_FILES = {
        "users": "users.json",
        "products": "products.json",
        "cart": "cart.json",
        "transactions": "transactions.json",
        "reviews": "reviews.json",
        "penalties": "penalties.json"
    }
    
    DATA_DIR = "backend/data"
    
    def __init__(self):
        pass
    
    def get_available_files(self) -> List[str]:
        """Get list of file keys that can be exported"""
        return list(self.ALLOWED_FILES.keys())
    
    def export_file(self, file_key: str) -> Optional[Dict]:
        """
        Load and return contents of a specific JSON file.
        
        Args:
            file_key: Key from ALLOWED_FILES (e.g., 'users', 'products')
            
        Returns:
            Dict with file data and metadata, or None if file not found/invalid
            
        Raises:
            ValueError: If file_key is not in ALLOWED_FILES
            FileNotFoundError: If the file doesn't exist
        """
        # Validate file key
        if file_key not in self.ALLOWED_FILES:
            raise ValueError(f"Invalid file key: {file_key}. Allowed: {list(self.ALLOWED_FILES.keys())}")
        
        # Get actual filename
        filename = self.ALLOWED_FILES[file_key]
        file_path = os.path.join(self.DATA_DIR, filename)
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {filename}")
        
        # Load and return file contents
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Return data with metadata
        return {
            "file_key": file_key,
            "filename": filename,
            "data": data,
            "exported_at": datetime.now().isoformat(),
            "record_count": len(data) if isinstance(data, (list, dict)) else None
        }
    
    def generate_export_filename(self, file_key: str) -> str:
        """
        Generate a timestamped filename for export.
        
        Args:
            file_key: Key from ALLOWED_FILES
            
        Returns:
            Filename with timestamp (e.g., 'users_export_2025-12-01_14:30:22.json')
        """
        timestamp = datetime.now().strftime("%Y-%m-%d_%H:%M:%S")
        return f"{file_key}_export_{timestamp}.json"
