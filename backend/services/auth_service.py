import uuid
import bcrypt
import secrets
import string
from typing import List, Optional, Any

from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.repositories.user_repository import UserRepository
from backend.models.user_model import User

class AuthService:
    # Handles all authentication & user-related business logic

    def __init__(self):
        # Create our own UserRepository internally
        # UserRepository is locked to users.json
        self.repository = UserRepository()

    # Generate a cryptographically secure 28-character token
    def _generate_user_token(self) -> str:
        characters = string.ascii_letters + string.digits
        return ''.join(secrets.choice(characters) for _ in range(28))

    # Load all users from repository
    # Load all users from repository
    def _repo_load(self) -> List[dict]:
        return self.repository.get_all()

    # Save all users to repository
    def _repo_save(self, data: List[dict]) -> None:
        self.repository.save_all(data)

    # Load all users and convert to User objects
    def _load_all_users(self) -> List[User]:
        raw_users = self._repo_load() or []
        users: List[User] = []
        for user_dict in raw_users:
            users.append(User(**user_dict))
        return users

    def register_user(self, name: str, email: str, password: str) -> User:
        # load users
        users = self._load_all_users()
        email_normalized = email.strip().lower()

        # pass validation
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long")
        if not any(c.isdigit() for c in password):
            raise ValueError("Password must include at least one digit")

        # check if email exists
        if any(u.email.lower() == email_normalized for u in users):
            raise ValueError("Email already exists")

        # hash the password
        hashed_pwd = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        # Generate a unique user token
        existing_tokens = {getattr(u, "user_token", None) for u in users}
        user_token = self._generate_user_token()
        while user_token in existing_tokens:
            user_token = self._generate_user_token()

        # Create the new user object
        new_user = User(
            user_id=str(uuid.uuid4()),
            name=name,
            email=email_normalized,
            password_hash=hashed_pwd,
            user_token=user_token,
            role="customer"
        )

        # Add new user to the list and save to repository
        updated_list = [u.model_dump() for u in users]
        updated_list.append(new_user.model_dump())
        self._repo_save(updated_list)

        # Return the new user object
        return new_user

    def login_user(self, email: str, password: str) -> Optional[User]:
        users = self._load_all_users()
        target_email = email.strip().lower()
        for user in users:
            if user.email.lower() == target_email:
                if bcrypt.checkpw(password.encode(), user.password_hash.encode()):
                    return user
                return None
        return None

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        users = self._load_all_users()
        for user in users:
            if user.user_id == user_id:
                return user
        return None

    def get_user_by_email(self, email: str) -> Optional[User]:
        users = self._load_all_users()
        target_email = email.strip().lower()
        for user in users:
            if user.email.lower() == target_email:
                return user
        return None

    def get_user_by_token(self, token: str) -> Optional[User]:
        """Return a user by their user_token (or None if not found)."""
        if not token:
            return None
        users = self._load_all_users()
        for user in users:
            if getattr(user, "user_token", None) == token:
                return user
        return None

    def set_user_role(self, user_id: str, role: str) -> User:
        """
        Update a user's role by user_id.
        Valid roles: 'admin' or 'customer'
        Raises ValueError if user not found or invalid role.
        """
        if role.lower() not in ["admin", "customer"]:
            raise ValueError(f"Invalid role '{role}'. Must be 'admin' or 'customer'")
        
        users = self._load_all_users()
        user_found = False
        
        for user in users:
            if user.user_id == user_id:
                user_found = True
                # Update the role
                user.role = role.lower()
                break
        
        if not user_found:
            raise ValueError(f"User with ID '{user_id}' not found")
        
        # Save updated users back to repository
        updated_list = [u.model_dump() for u in users]
        self._repo_save(updated_list)
        
        # Return the updated user
        updated_user = self.get_user_by_id(user_id)
        return updated_user

# --- Dependency helpers (use these in routers, no separate file required) ---

# HTTP bearer instance used by the dependency
_security = HTTPBearer(auto_error=False)

# Module-level default service used by the dependency helpers
# AuthService creates its own UserRepository internally
default_auth_service = AuthService()


def _extract_token(credentials: Optional[HTTPAuthorizationCredentials]) -> str:
    if not credentials:
        return ""
    return credentials.credentials or ""


def get_current_user_dep(credentials: Optional[HTTPAuthorizationCredentials] = Security(_security)) -> User:
    """
    FastAPI dependency to return the current authenticated user based on Bearer token.
    Raises 401 if missing/invalid.
    Uses default_auth_service (created above) so routers can import this dependency.
    """
    token = _extract_token(credentials)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = default_auth_service.get_user_by_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


def admin_required_dep(current_user: User = Depends(get_current_user_dep)) -> User:
    """
    FastAPI dependency to enforce admin role.
    Raises 403 if the current_user is not an admin.
    """
    if getattr(current_user, "role", "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user