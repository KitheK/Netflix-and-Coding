# Auth Router: API endpoints for authentication operations

from fastapi import APIRouter, HTTPException
from backend.services.auth_service import AuthService
from backend.repositories.json_repository import JsonRepository
from backend.models.auth_model import RegisterRequest, LoginRequest
from typing import Optional


router = APIRouter(prefix="/auth", tags=["authentication"])

# Create repository and service
repository = JsonRepository()
auth_service = AuthService(repository)


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
        # Call auth_service's method to login user
        user = auth_service.login_user(
            email=request.email,
            password=request.password
        )
        # If user not found or password invalid, return 401
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
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
        raise HTTPException(status_code=404, detail="User not found")
    
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
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return user details
    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "user_token": user.user_token,
        "role": user.role
    }