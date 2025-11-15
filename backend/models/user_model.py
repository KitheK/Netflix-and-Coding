from pydantic import BaseModel, EmailStr
from typing import Optional


class User(BaseModel):
    """User model for authentication and authorization."""
    user_id: str              # UUID4 generated
    name: str
    email: EmailStr
    password_hash: str
    role: str = "customer"     # default role
    user_token: str           # 28-character random token

    #TODO: Users are always created with role= "customer"
    #In the future it is important to have the ability to create or assign specific users with the admin role