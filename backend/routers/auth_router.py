# Auth Router: API endpoints for authentication operations
from fastapi import APIRouter, HTTPException,Depends
from backend.services.auth_service import AuthService,get_current_user_dep, admin_required_dep
from backend.models.auth_model import RegisterRequest, LoginRequest
from typing import Optional
from backend.models.auth_model import RegisterRequest, LoginRequest, UserResponse
from backend.models.user_model import User
from pydantic import BaseModel
from fastapi import Body


router = APIRouter(prefix="/auth", tags=["authentication"])

# Create auth service (it creates its own repository internally)
auth_service = AuthService()


"""Auth router endpoints"""

# Endpoint to register a new user. url would be /auth/register
@router.post("/register")
async def register_user(request: RegisterRequest):
    """Register a new user with name, email, and password"""
    try:
        # Call auth_service's method to register a new user
        new_user = auth_service.register_user(
            name=request.name,
            email=request.email,
            password=request.password
        )
        # Return success message with user details
        return {
            "message": "User registered successfully",
            "user": {
                "user_id": new_user.user_id,
                "name": new_user.name,
                "email": new_user.email,
                "user_token": new_user.user_token,
                "role": new_user.role
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Endpoint to login a user. url would be /auth/login
@router.post("/login")
async def login_user(request: LoginRequest):
    """Login user with email and password"""
    try:
        # First check if email exists
        user_by_email = auth_service.get_user_by_email(request.email)
        if user_by_email is None:
            raise HTTPException(
                status_code=401, 
                detail={"X-Error-Details": "email not found"}
            )      
        # Call auth_service's method to login user
        user = auth_service.login_user(
            email=request.email,
            password=request.password
        )
        
        # If user is None at this point, it means password was invalid
        if user is None:
            raise HTTPException(
                status_code=401, 
                detail={"X-Error-Details": "invalid password"}
            )
        # Return success message with user details and token
        return {
            "message": "Login successful",
            "user": {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "user_token": user.user_token,
                "role": user.role
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Endpoint to get user by ID. url would be like /auth/users/550e8400-e29b-41d4-a716-446655440000
@router.get("/users/{user_id}")
async def get_user_by_id(user_id: str):
    """Get user details by user ID"""
    # Call auth_service's method to get user by ID
    user = auth_service.get_user_by_id(user_id)
    
    # If user not found, return 404 error
    if user is None:
        raise HTTPException(status_code=404, detail=f"User with ID '{user_id}' not found")
    
    # Return user details
    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "user_token": user.user_token,
        "role": user.role
    }


# Endpoint to get user by email. url would be like /auth/email/john@example.com
@router.get("/email/{email}")
async def get_user_by_email(email: str):
    """Get user details by email"""
    # Call auth_service's method to get user by email
    user = auth_service.get_user_by_email(email)
    
    # If user not found, return 404 error
    if user is None:
        raise HTTPException(status_code=404, detail=f"User with email '{email}' not found")
    
    # Return user details
    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "user_token": user.user_token,
        "role": user.role
    }
@router.get("/me")
async def read_current_user(current_user: User = Depends(get_current_user_dep)):
    """Return profile for authenticated user (requires Bearer token)."""
    return {
        "user_id": current_user.user_id,
        "name": current_user.name,
        "email": current_user.email,
        "user_token": current_user.user_token,
        "role": current_user.role
    }


@router.get("/users")
async def get_all_users(current_user: User = Depends(admin_required_dep)):
    """Admin-only: Get list of all users"""
    users = auth_service._load_all_users()
    return [
        {
            "user_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "user_token": u.user_token,
            "role": u.role
        }
        for u in users
    ]


@router.get("/admin-only")
async def admin_only_route(current_user: User = Depends(admin_required_dep)):
    """ Endpoint protected by admin_required dependency."""
    return {"message": "admin access granted", "user_id": current_user.user_id}

class RoleRequest(BaseModel):
    role: str


@router.post("/users/{user_id}/role")
async def assign_role_to_user(user_id: str, body: RoleRequest, current_user: User = Depends(admin_required_dep)):
    """
    Admin-only: set role for a user by user_id.
    Request body: "role": "admin" or "role": "customer"
    """
    try:
        updated = auth_service.set_user_role(user_id=user_id, role=body.role)
        return {
            "message": "role updated",
            "user": {
                "user_id": updated.user_id,
                "email": updated.email,
                "role": updated.role
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/users/{user_id}/promote-admin")
async def promote_user_to_admin(user_id: str, current_user: User = Depends(admin_required_dep)):
    """
    Admin-only: promote a customer user to admin role.
    This is a convenience endpoint specifically for promoting users to admin.
    """
    try:
        updated = auth_service.set_user_role(user_id=user_id, role="admin")
        return {
            "message": "User promoted to admin successfully",
            "user": {
                "user_id": updated.user_id,
                "name": updated.name,
                "email": updated.email,
                "role": updated.role
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))