import os
import uuid
import bcrypt
import secrets
import string
from typing import List, Optional, Any

from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.repositories.json_repository import JsonRepository
from backend.models.user_model import User

class AuthService:
    """Handles all authentication & user-related business logic."""

    def __init__(self, repository: JsonRepository):
        self.repository = repository
        # allow override via env var for tests: set USERS_FILE=test_users.json
        self.user_file = os.environ.get("USERS_FILE", "users.json")

    def _generate_user_token(self) -> str:
        """Generate a cryptographically secure 28-character token."""
        characters = string.ascii_letters + string.digits
        return ''.join(secrets.choice(characters) for _ in range(28))

    def _repo_load(self, filename: str) -> List[dict]:
        for name in ("load", "get_all", "read", "read_all"):
            fn = getattr(self.repository, name, None)
            if callable(fn):
                try:
                    return fn(filename)
                except TypeError:
                    return fn()
        raise AttributeError("Repository has no load/get_all/read method")

    def _repo_save(self, filename: str, data: List[dict]) -> None:
        for name in ("save", "write", "write_all", "save_all"):
            fn = getattr(self.repository, name, None)
            if callable(fn):
                try:
                    return fn(filename, data)
                except TypeError:
                    return fn(data)
        raise AttributeError("Repository has no save/write method")

    def _load_all_users(self) -> List[User]:
        raw_users = self._repo_load(self.user_file) or []
        users: List[User] = []
        for user_dict in raw_users:
            users.append(User(**user_dict))
        return users

    def register_user(self, name: str, email: str, password: str) -> User:
        users = self._load_all_users()
        email_normalized = email.strip().lower()

        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long")
        if not any(c.isdigit() for c in password):
            raise ValueError("Password must include at least one digit")

        if any(u.email.lower() == email_normalized for u in users):
            raise ValueError("Email already exists")

        hashed_pwd = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        existing_tokens = {getattr(u, "user_token", None) for u in users}
        user_token = self._generate_user_token()
        while user_token in existing_tokens:
            user_token = self._generate_user_token()

        new_user = User(
            user_id=str(uuid.uuid4()),
            name=name,
            email=email_normalized,
            password_hash=hashed_pwd,
            user_token=user_token,
            role="customer"
        )

        updated_list = [u.model_dump() for u in users]
        updated_list.append(new_user.model_dump())
        self._repo_save(self.user_file, updated_list)

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

# --- Dependency helpers (use these in routers, no separate file required) ---

# HTTP bearer instance used by the dependency
_security = HTTPBearer(auto_error=False)

# module-level default repository + service used by the dependency helpers
_default_repository = JsonRepository()
default_auth_service = AuthService(_default_repository)


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