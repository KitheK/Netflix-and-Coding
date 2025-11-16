from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterRequest(BaseModel):
    """Request model for user registration."""
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Safe user representation returned by auth endpoints."""
    user_id: str
    name: str
    email: EmailStr
    user_token: str
    role: str