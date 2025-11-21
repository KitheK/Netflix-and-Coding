"""Penalty Service: Business logic for penalty operations"""

from typing import List, Optional
from datetime import datetime, timezone
import uuid
from backend.models.penalty_model import Penalty
from backend.repositories.penalty_repository import PenaltyRepository


class PenaltyService:
    """Handles all business logic related to penalties"""
    
    def __init__(self):
        # Create our own repository internally
        self.penalty_repository = PenaltyRepository()
    
    def apply_penalty(self, user_id: str, reason: str) -> Penalty:
        """
        Apply a penalty to a user (admin-only operation).
        
        This method:
        1. Validates the input (user_id and reason must be provided)
        2. Generates a unique penalty_id (UUID)
        3. Creates a timestamp in ISO format
        4. Creates a Penalty record
        5. Loads existing penalties from penalties.json
        6. Appends the new penalty to the list
        7. Saves the updated list back to penalties.json
        
        Args:
            user_id: UUID of the user to penalize
            reason: Reason why the penalty is being applied (must not be empty)
            
        Returns:
            Penalty: The created penalty record
            
        Raises:
            ValueError: If user_id or reason is empty/invalid
        """
        
        # Validate that user_id is provided and not empty
        if not user_id or len(user_id.strip()) == 0:
            raise ValueError("user_id cannot be empty")
        
        # Validate that reason is provided and not empty
        if not reason or len(reason.strip()) == 0:
            raise ValueError("reason cannot be empty")
        
        # Generate a unique UUID for this penalty record
        penalty_id = str(uuid.uuid4())
        
        # Create ISO format timestamp (with timezone) for when penalty is applied
        # Using UTC timezone ensures consistency across different server locations
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Create the Penalty model object with all required fields
        penalty = Penalty(
            penalty_id=penalty_id,
            user_id=user_id,
            reason=reason,
            timestamp=timestamp
        )
        
        # Load existing penalties from penalties.json file
        # If file doesn't exist or is corrupted, start with empty list
        all_penalties = self.penalty_repository.get_all()
        if not isinstance(all_penalties, list):
            all_penalties = []
        
        # Convert the Penalty Pydantic model to a dictionary and add to the list
        # Using model_dump() to serialize the model to a dict for JSON storage
        all_penalties.append(penalty.model_dump())
        
        # Save the updated list back to penalties.json file
        # This persists the new penalty to disk
        self.penalty_repository.save_all(all_penalties)
        
        # Return the created penalty object
        return penalty
    
    def get_user_penalties(self, user_id: str) -> List[Penalty]:
        """
        Get all penalties for a specific user, sorted by newest first.
        
        Args:
            user_id: UUID of the user to get penalties for
            
        Returns:
            List[Penalty]: List of penalties for the user, newest first
        """
        # Load all penalties from file
        all_penalties = self.penalty_repository.get_all()
        
        # Handle empty or corrupted file
        if not isinstance(all_penalties, list):
            return []
        
        # Filter penalties for this specific user
        # Convert each dict to Penalty model and filter by user_id
        user_penalties = [
            Penalty(**penalty_dict)  # Convert dict to Pydantic model
            for penalty_dict in all_penalties
            if penalty_dict.get("user_id") == user_id
        ]
        
        # Sort by timestamp, newest first
        # ISO format timestamps sort correctly alphabetically
        user_penalties.sort(key=lambda p: p.timestamp, reverse=True)
        
        return user_penalties

