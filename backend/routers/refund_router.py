"""Refund Router: API endpoints for refund request management"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List

from backend.services.refund_service import RefundService
from backend.services.auth_service import get_current_user_dep, admin_required_dep
from backend.models.refund_model import Refund, RefundRequest, RefundResponse
from backend.models.user_model import User


router = APIRouter(prefix="/refunds", tags=["refunds"])

# Create refund service internally
refund_service = RefundService()


# Customer creates a new refund request
@router.post("", response_model=RefundResponse)
async def create_refund_request(
    refund_request: RefundRequest,
    current_user: User = Depends(get_current_user_dep)
):
    """
    Customer creates a refund request for one of their transactions.
    Requires authentication.
    """
    try:
        refund = refund_service.create_refund_request(refund_request, current_user.user_id)
        return RefundResponse(
            message="Refund request created successfully",
            refund=refund
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get all refund requests (admin only)
@router.get("/all", response_model=List[Refund])
async def get_all_refund_requests(
    current_user: User = Depends(admin_required_dep)
):
    """
    Admin views all refund requests.
    Requires admin authentication.
    """
    try:
        refunds = refund_service.get_all_refund_requests()
        return refunds
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get current user's refund requests
@router.get("/my-requests", response_model=List[Refund])
async def get_my_refund_requests(
    current_user: User = Depends(get_current_user_dep)
):
    """
    Customer views their own refund requests.
    Requires authentication.
    """
    try:
        refunds = refund_service.get_user_refund_requests(current_user.user_id)
        return refunds
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Admin approves a refund request
@router.put("/{refund_id}/approve", response_model=RefundResponse)
async def approve_refund(
    refund_id: str,
    current_user: User = Depends(admin_required_dep)
):
    """
    Admin approves a refund request.
    Updates refund status to 'approved' and marks transaction as refunded.
    Requires admin authentication.
    """
    try:
        refund = refund_service.approve_refund(refund_id)
        return RefundResponse(
            message="Refund approved successfully",
            refund=refund
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Admin denies a refund request
@router.put("/{refund_id}/deny", response_model=RefundResponse)
async def deny_refund(
    refund_id: str,
    current_user: User = Depends(admin_required_dep)
):
    """
    Admin denies a refund request.
    Updates refund status to 'denied'.
    Requires admin authentication.
    """
    try:
        refund = refund_service.deny_refund(refund_id)
        return RefundResponse(
            message="Refund denied",
            refund=refund
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
