from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from datetime import datetime, timedelta
import jwt
import hashlib

from app.models.User import User,UserCreate,UserLogin, UserResponse, Token
from app.models.Customer import Customer
from app.models.Seller import Seller, SellerResponse
from app.models.Admin import Admin
from app.models.Enums import UserRole
from app.services.UserService import UserService
from app.controllers.config import settings


router = APIRouter(prefix="/auth", tags=["Authentication"])
user_service = UserService()
security = HTTPBearer()



class AuthService:
    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    
    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256 (same as your User class)"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return self._hash_password(plain_password) == hashed_password
    
    def authenticate_user(self, email: str, password: str) -> User:
        """Authenticate user using your User class login method"""
        user = user_service.get_user_by_email(email)
        if not user:
            return None
        
        # Use your User class's login method
        if user.login(email, password):
            return user
        return None
    
    def create_access_token(self, user_id: int, role: UserRole) -> str:
        """Create JWT access token"""
        expires_delta = timedelta(minutes=self.access_token_expire_minutes)
        expire = datetime.utcnow() + expires_delta
        
        payload = {
            "sub": str(user_id),
            "role": role.value,
            "exp": expire
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
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

auth_service = AuthService()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Dependency to get current user from JWT token"""
    token = credentials.credentials
    payload = auth_service.verify_token(token)
    
    user_id = int(payload["sub"])
    user = user_service.get_user_by_id(user_id)
    
    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role.value
    }

def get_current_active_user(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency to ensure user is active"""
    # You can add active status check here when you implement it
    return current_user

def require_role(required_role: UserRole):
    """Dependency to require specific user role"""
    def role_checker(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
        if UserRole(current_user["role"]) != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {required_role.value} role"
            )
        return current_user
    return role_checker

@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """
    Register a new user
    Uses your User class constructor and validation
    """
    try:
        # Hash password using the same method as your User class
        password_hash = hashlib.sha256(user_data.password.encode()).hexdigest()
        
        # Create appropriate user type based on role
        user_id = user_service.get_next_user_id()
        
        if user_data.role == UserRole.CUSTOMER:
            user = Customer(
                user_id=user_id,
                name=user_data.name,
                email=user_data.email,
                password_hash=password_hash
            )
        elif user_data.role == UserRole.SELLER:
            user = Seller(
                user_id=user_id,
                name=user_data.name,
                email=user_data.email,
                password_hash=password_hash
            )
        elif user_data.role == UserRole.ADMIN:
            user = Admin(
                user_id=user_id,
                name=user_data.name,
                email=user_data.email,
                password_hash=password_hash
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user role"
            )
        
        # Save user to service
        user_service.add_user(user)
        
        return UserResponse(
            user_id=str(user.user_id),
            name=user.name,
            email=user.email,
            role=user.role.value,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/auth/login", response_model=Token)
async def login_user(credentials: UserLogin):
    """
    User login using your User class login method
    """
    try:
        # Use your User class authentication
        user = auth_service.authenticate_user(credentials.email, credentials.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token
        access_token = auth_service.create_access_token(user.user_id, user.role)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                user_id=str(user.user_id),
                name=user.name,
                email=user.email,
                role=user.role.value,
                created_at=datetime.now(),  # You might want to store this in user object
                updated_at=datetime.now()
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_active_user)):
    """
    Get current authenticated user's profile
    """
    try:
        user = user_service.get_user_by_id(current_user["user_id"])
        
        return UserResponse(
            user_id=str(user.user_id),
            name=user.name,
            email=user.email,
            role=user.role.value,
            created_at=datetime.now(),  # You might want to store this in user object
            updated_at=datetime.now()
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post("/auth/logout")
async def logout_user(current_user: dict = Depends(get_current_user)):
    """
    Logout user - uses your User class logout method
    """
    try:
        user = user_service.get_user_by_id(current_user["user_id"])
        user.logout()  # Call your User class logout method
        
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )

@router.get("/auth/dashboard")
async def get_user_dashboard(current_user: dict = Depends(get_current_active_user)):
    """
    Get user's dashboard based on their role
    Uses your User class view_dashboard method
    """
    try:
        user = user_service.get_user_by_id(current_user["user_id"])
        dashboard_info = user.view_dashboard()
        
        return {
            "message": dashboard_info,
            "user_role": user.role.value,
            "dashboard_data": {
                "user_id": user.user_id,
                "name": user.name,
                "role": user.role.value
                # Add role-specific dashboard data here
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load dashboard: {str(e)}"
        )

@router.post("/auth/refresh")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """
    Refresh access token
    """
    try:
        user = user_service.get_user_by_id(current_user["user_id"])
        new_access_token = auth_service.create_access_token(user.user_id, user.role)
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )

# Role-specific endpoints
@router.get("/auth/admin/dashboard")
async def get_admin_dashboard(current_user: dict = Depends(require_role(UserRole.ADMIN))):
    """
    Admin-only dashboard endpoint
    """
    user = user_service.get_user_by_id(current_user["user_id"])
    return {
        "message": user.view_dashboard(),
        "admin_features": ["user_management", "system_analytics", "content_moderation"],
        "user_count": user_service.get_user_count(),
        "system_stats": {
            "total_users": user_service.get_user_count(),
            "active_sessions": 42  # Example stat
        }
    }

@router.get("/auth/seller/dashboard")
async def get_seller_dashboard(current_user: dict = Depends(require_role(UserRole.SELLER))):
    """
    Seller-only dashboard endpoint
    """
    user = user_service.get_user_by_id(current_user["user_id"])
    return {
        "message": user.view_dashboard(),
        "seller_features": ["product_management", "sales_analytics", "order_fulfillment"],
        "business_stats": {
            "total_products": 15,  # Example stat
            "pending_orders": 3,
            "monthly_revenue": 1250.00
        }
    }

@router.get("/auth/customer/dashboard")
async def get_customer_dashboard(current_user: dict = Depends(require_role(UserRole.CUSTOMER))):
    """
    Customer-only dashboard endpoint
    """
    user = user_service.get_user_by_id(current_user["user_id"])
    return {
        "message": user.view_dashboard(),
        "customer_features": ["order_history", "wishlist", "account_settings"],
        "shopping_stats": {
            "recent_orders": 5,  # Example stat
            "cart_items": 2,
            "loyalty_points": 150
        }
    }