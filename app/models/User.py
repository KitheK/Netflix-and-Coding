from typing import List, Optional
import hashlib
from app.models.Enums import UserRole, OrderStatus, RefundStatus
from abc import ABC, abstractmethod
from pydantic import BaseModel, EmailStr, validator


"Abstract User class "
"Verify/store user information"
"Hash the password"
"Declare the role"

class User(ABC):
    def __init__(self, user_id: int, name: str, email: str, password_hash: str, role: UserRole):
        "Checking if login information is aqurate"
        self.user_id = user_id # Unique user identification
        self.name = name
        self.email = email
        self.password_hash = password_hash
        self.role = role #Role in the system; determinant of the landing page
        "Error handling for incorrect user information"
        #User ID is less than 0, if the email is invalid, or the password is invalid it will raise an error
        if not isinstance(user_id, int) or user_id < 0: 
            raise ValueError("Invalid user ID")
        if not email or '@' not in email:
            raise ValueError("Invalid email format") 
        if not name or not password_hash:
            raise ValueError("Name and password cannot be empty")

    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, plain: str) -> bool:
        return self._hash_password(plain) == self.password_hash
    
    def login(self, email: str, password: str) -> bool:
        return self.email == email and self.verify_password(password)

    def logout(self) -> None:
        print(f"{self.name} logged out.")


    @abstractmethod
#not yet coded out the dashboard
#The dashboard in this case refers to the custom landing page that the diffrent kinds of users will come to
    def view_dashboard(self):
        return f"Viewing dashboard for {self.role.value}"
    
# Pydantic models for API requests/responses
    "Pydantic Explanation and why we used it : "
    "Pydantic basically functions as a quick validator for the system and it will ensure that"
    "data is where it needs to be, it works with many of the already established functions above"
  
    
class UserCreate(BaseModel):
    """Model for creating a new user"""
    name: str
    email: str
    password: str
    role: UserRole
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @validator('password')
    def password_must_be_strong(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v

class UserLogin(BaseModel):
    """Model for user login"""
    email: str
    password: str

class UserResponse(BaseModel):
    """Model for user response (without sensitive data)"""
    user_id: int
    name: str
    email: str
    role: UserRole
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    """Model for JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    """Model for token payload data"""
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None