"""Penalty Router: API endpoints for penalty operations (Admin-only)"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.models.penalty_model import ApplyPenaltyRequest, PenaltyResponse, Penalty
from backend.models.user_model import User
from backend.services.penalty_service import PenaltyService
from backend.services.auth_service import admin_required_dep
from backend.repositories.json_repository import JsonRepository

# Create router with prefix /penalties and tag "penalties"
# All endpoints in this router will be accessible at /penalties/*
router = APIRouter(prefix="/penalties", tags=["penalties"])

# Initialize dependencies (repository -> service)
# JsonRepository handles reading/writing JSON files from backend/data directory
repository = JsonRepository()
penalty_service = PenaltyService(repository)


# POST /penalties/apply - Apply a penalty to a user (Admin-only)
# This endpoint allows admins to create penalty records for users
@router.post("/apply", response_model=PenaltyResponse, dependencies=[Depends(admin_required_dep)])
async def apply_penalty(
    request: ApplyPenaltyRequest,
    current_user: User = Depends(admin_required_dep)
):
    """
    Admin-only endpoint to apply a penalty to a user.
    
    This endpoint:
    1. Checks that the current user is an admin (via admin_required_dep dependency)
    2. Validates the request body (user_id and reason)
    3. Calls the penalty service to create and save the penalty
    4. Returns a response with the created penalty details
    
    Request Body:
        {
            "user_id": "uuid-of-user",
            "reason": "Reason for penalty"
        }
    
    Returns:
        {
            "message": "Penalty applied successfully",
            "penalty": {
                "penalty_id": "uuid",
                "user_id": "uuid",
                "reason": "Reason",
                "timestamp": "2024-01-01T12:00:00.000000+00:00"
            }
        }
    
    Raises:
        400: If validation fails (empty user_id or reason)
        403: If user is not an admin
        500: If there's an unexpected error
    """
    try:
        # Call the penalty service to create and save the penalty
        # The service handles generating UUID, timestamp, and saving to penalties.json
        penalty = penalty_service.apply_penalty(
            user_id=request.user_id,
            reason=request.reason
        )
        
        # Return success response with the created penalty
        return PenaltyResponse(
            message="Penalty applied successfully",
            penalty=penalty
        )
        
    except ValueError as e:
        # Validation error - user_id or reason is empty/invalid
        # Return 400 Bad Request with error message
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Unexpected error - return 500 Internal Server Error
        raise HTTPException(status_code=500, detail=f"Failed to apply penalty: {str(e)}")

# GET /penalties/{user_id} - List penalties for a specific user (Admin-only)
@router.get("/{user_id}", response_model=List[Penalty])
async def get_user_penalties_for_user(
    user_id: str,
    status: Optional[str] = Query(
        None,
        description="Optional status filter: 'active' or 'resolved'. If omitted, returns all.",
    ),
    current_user: User = Depends(admin_required_dep),
):
    """
    Admin-only: list penalties for a specific user.

    - IN: path param user_id (UUID string)
    - IN (optional): query param status = 'active' | 'resolved'
    - OUT: JSON array of Penalty objects for that user, sorted newest first
    """
    try:
        if not penalty_service.user_exists(user_id):
            raise HTTPException(status_code=404, detail=f"User {user_id} not found")

        # Use the service to load and optionally filter penalties by status
        penalties = penalty_service.get_user_penalties(user_id=user_id, status=status)
        if status is not None and len(penalties) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No {status} penalties found for user {user_id}",
            )
        return penalties
    except HTTPException:
        # Re-raise HTTPException (404, etc.) without wrapping
        raise
    except Exception as e:
        # Generic error handler (e.g., file read issues)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve penalties for user {user_id}: {str(e)}",
        )


# POST /penalties/{penalty_id}/resolve - Mark a penalty as resolved (Admin-only)
@router.post("/{penalty_id}/resolve", response_model=PenaltyResponse, dependencies=[Depends(admin_required_dep)])
async def resolve_penalty(
    penalty_id: str,
    current_user: User = Depends(admin_required_dep),
):
    """
    Admin-only: resolve a specific penalty.
    Sets the penalty status to "resolved".
    """
    try:
        penalty = penalty_service.resolve_penalty(penalty_id=penalty_id)
        return PenaltyResponse(
            message="Penalty resolved successfully",
            penalty=penalty,
        )
    except ValueError as e:
        message = str(e)
        status_code = 404 if "not found" in message.lower() else 400
        raise HTTPException(status_code=status_code, detail=message)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to resolve penalty {penalty_id}: {str(e)}",
        )