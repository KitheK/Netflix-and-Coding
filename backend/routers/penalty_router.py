"""Penalty Router: API endpoints for penalty operations (Admin-only)"""

from fastapi import APIRouter, HTTPException, Depends
from backend.models.penalty_model import ApplyPenaltyRequest, PenaltyResponse
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

