from datetime import datetime, timedelta
from typing import Dict, Any
import jwt
from fastapi import HTTPException, status
from app.models.Enums import UserRole
from app.controllers.config import settings

class AuthService:
    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    
    def create_access_token(self, user_id: int, role: UserRole) -> str:
        """Create JWT access token"""
        try:
            # Calculate expiration time
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
            
            # Create payload
            payload = {
                "sub": str(user_id),
                "role": role.value,
                "exp": expire,
                "iat": datetime.utcnow(),
                "type": "access"
            }
            
            # Encode the token
            token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
            return token
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Token creation failed: {str(e)}"
            )
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm]
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    
    def get_user_id_from_token(self, token: str) -> int:
        """Extract user ID from token"""
        payload = self.verify_token(token)
        return int(payload["sub"])
    
    def get_user_role_from_token(self, token: str) -> UserRole:
        """Extract user role from token"""
        payload = self.verify_token(token)
        return UserRole(payload["role"])