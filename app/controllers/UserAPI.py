from fastapi import APIRouter, HTTPException
from app.services.UserService import UserService
from app.services.AuthService import AuthService
from app.models.User import UserCreate, UserLogin, UserResponse


router = APIRouter(prefix="/users", tags=["Users"])
user_service = UserService()
auth_service = AuthService()


@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        user = user_service.create_user(user_data.dict())
        return user.to_dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login_user(credentials: UserLogin):
    """User login"""
    try:
        user = auth_service.authenticate_user(credentials.email, credentials.password)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = auth_service.create_access_token(user.user_id)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    """Get user details"""
    try:
        user = user_service.get_user_by_id(user_id)
        return user.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
