from fastapi import APIRouter, HTTPException, Depends
from typing import List
from backend.services.auth_service import AuthService
from backend.models.user_model import UserCreate, UserLogin, User

router = APIRouter()
auth_service = AuthService()

@router.post("/register", response_model=User)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        user = auth_service.register_user(user_data)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(credentials: UserLogin):
    """Authenticate user and return token"""
    try:
        result = auth_service.login(credentials)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/profile", response_model=User)
async def get_profile(user_id: str):
    """Get user profile"""
    try:
        user = auth_service.get_user_profile(user_id)
        return user
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))