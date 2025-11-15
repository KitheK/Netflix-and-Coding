import os
import uuid
import bcrypt
import secrets
import string
from typing import List, Optional, Any
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

    # Internal Helper: Load all users
    def _load_all_users(self) -> List[User]:
        raw_users = self._repo_load(self.user_file) or []
        users: List[User] = []
        for user_dict in raw_users:
            users.append(User(**user_dict))
        return users

    # Register a new user
    def register_user(self, name: str, email: str, password: str) -> User:
        users = self._load_all_users()

        # Normalize email to lowercase for storage and comparison
        email_normalized = email.strip().lower()

        # Relaxed password validation to match existing tests:
        # min 8 chars and at least one digit
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isdigit() for c in password):
            raise ValueError("Password must include at least one digit")
        if not any(c.isupper() for c in password):
            raise ValueError("Password must include at least one uppercase letter")
        if not any(c.islower() for c in password):
            raise ValueError("Password must include at least one lowercase letter")
        if not any(c in "!@#$%^&*()-_=+[]{};:'\",.<>?/|`~" for c in password):
            raise ValueError("Password must include at least one special character")
        if password.lower() in ["password", "qwerty", "123456", "abc123", "letmein", "welcome", "admin"]:
            raise ValueError("Password is too common or weak")
        
        # Duplicate email check (case-insensitive)
        if any(u.email.lower() == email_normalized for u in users):
            raise ValueError("Email already exists")

        # Hash password using bcrypt
        hashed_pwd = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        # Generate unique 28-character token (very unlikely to collide)
        existing_tokens = {getattr(u, "user_token", None) for u in users}
        user_token = self._generate_user_token()
        while user_token in existing_tokens:
            user_token = self._generate_user_token()

        # Create new user object (store normalized email)
        new_user = User(
            user_id=str(uuid.uuid4()),
            name=name,
            email=email_normalized,
            password_hash=hashed_pwd,
            user_token=user_token,
            role="customer"
        )

        # Persist users (Pydantic v2 uses model_dump)
        updated_list = [u.model_dump() for u in users]
        updated_list.append(new_user.model_dump())
        self._repo_save(self.user_file, updated_list)

        return new_user

    # Login: validate password
    def login_user(self, email: str, password: str) -> Optional[User]:
        users = self._load_all_users()
        target_email = email.strip().lower()

        for user in users:
            if user.email.lower() == target_email:
                # Verify bcrypt password
                if bcrypt.checkpw(password.encode(), user.password_hash.encode()):
                    return user
                else:
                    return None

        return None

    # Get user by ID
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        users = self._load_all_users()

        for user in users:
            if user.user_id == user_id:
                return user

        return None

    # Get user by email
    def get_user_by_email(self, email: str) -> Optional[User]:
        users = self._load_all_users()
        target_email = email.strip().lower()

        for user in users:
            if user.email.lower() == target_email:
                return user

        return None