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
    
    def get_user_penalties(self, user_id: str, status: Optional[str] = None) -> List[Penalty]:
        """
        Get penalties for a specific user, optionally filtered by status, sorted by newest first.
        
        Args:
            user_id: UUID of the user to get penalties for
            status: Optional status filter ("active" or "resolved"). If None, return all.
            
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

        # Optional status filter: only "active" or "resolved"
        if status is not None:
            normalized = status.lower()
            if normalized in {"active", "resolved"}:
                user_penalties = [
                    p for p in user_penalties
                    if (p.status or "").lower() == normalized
                ]

        # Sort by timestamp, newest first
        # ISO format timestamps sort correctly alphabetically
        user_penalties.sort(key=lambda p: p.timestamp, reverse=True)
        
        return user_penalties

    def resolve_penalty(self, penalty_id: str) -> Penalty:
        """
        Mark a penalty as resolved.

        Args:
            penalty_id: The ID of the penalty to resolve.

        Returns:
            Penalty: The updated penalty with status "resolved".

        Raises:
            ValueError: If penalty is not found or already resolved.
        """
        if not penalty_id or len(penalty_id.strip()) == 0:
            raise ValueError("penalty_id cannot be empty")

        all_penalties = self.repository.load("penalties.json")
        if not isinstance(all_penalties, list):
            raise ValueError("penalties data is invalid")

        updated_penalty: Optional[Penalty] = None
        for penalty_dict in all_penalties:
            if penalty_dict.get("penalty_id") == penalty_id:
                current_status = (penalty_dict.get("status") or "active").lower()
                if current_status == "resolved":
                    raise ValueError("Penalty is already resolved")

                penalty_dict["status"] = "resolved"
                updated_penalty = Penalty(**penalty_dict)
                break

        if updated_penalty is None:
            raise ValueError("Penalty not found")

        self.repository.save("penalties.json", all_penalties)
        return updated_penalty

    def user_exists(self, user_id: str) -> bool:
        """
        Check if a user exists in users.json.
        Returns False if file doesn't exist, is invalid, or user not found.
        """
        try:
            users_data = self.repository.load("users.json")
            if isinstance(users_data, list):
                return any(user.get("user_id") == user_id for user in users_data)
            return False
        except Exception:
            # If file doesn't exist or any error occurs, return False
            return False

