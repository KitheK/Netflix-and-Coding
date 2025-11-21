"""Penalty Model: Data models for penalty records"""

from pydantic import BaseModel
from datetime import datetime, timezone
import uuid


# Penalty: Represents a penalty record for a user
# This is the full record of a penalty applied by an admin to a user
class Penalty(BaseModel):
    penalty_id: str          # Unique UUID for this penalty record
    user_id: str             # UUID of the user who received the penalty
    reason: str              # Reason why the penalty was applied (e.g., "Late payment", "Terms violation")
    timestamp: str           # ISO format timestamp of when penalty was applied


# ApplyPenaltyRequest: Request body for applying a penalty
# This is what the admin sends when creating a new penalty
class ApplyPenaltyRequest(BaseModel):
    user_id: str             # UUID of the user to penalize
    reason: str              # Reason for the penalty (must be provided)


# PenaltyResponse: Response after successfully applying a penalty
# This confirms the penalty was created and returns the penalty details
class PenaltyResponse(BaseModel):
    message: str             # Success message like "Penalty applied successfully"
    penalty: Penalty         # Full penalty details that were created

