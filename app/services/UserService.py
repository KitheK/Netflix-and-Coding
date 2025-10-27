from typing import Dict, Optional, List
from app.models.User import User
from app.models.Customer import Customer
from app.models.Seller import Seller
from app.models.Admin import Admin
from app.models.Enums import UserRole

class UserService:
    def __init__(self):
        self.users: Dict[int, User] = {}
        self.email_index: Dict[str, User] = {}
        self._next_user_id = 1
    
    def get_next_user_id(self) -> int:
        user_id = self._next_user_id
        self._next_user_id += 1
        return user_id
    
    def add_user(self, user: User) -> None:
        self.users[user.user_id] = user
        self.email_index[user.email] = user
    
    def get_user_by_id(self, user_id: int) -> User:
        if user_id not in self.users:
            raise ValueError(f"User with ID {user_id} not found")
        return self.users[user_id]
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.email_index.get(email)
    
    def get_user_count(self) -> int:
        return len(self.users)
    
    def get_users_by_role(self, role: UserRole) -> List[User]:
        return [user for user in self.users.values() if user.role == role]