from datetime import datetime
from typing import Dict

class Review:
    def __init__(self, review_id: str, user_id: str, user_name: str,
                 rating: float, title: str, content: str):
        self.review_id = review_id
        self.user_id = user_id
        self.user_name = user_name
        self.title = title
        self.content = content
        self.date_posted = datetime.now().isoformat()

    #convert review to dict for json saving    
    def to_dict(self) -> Dict:
        return {
            "review_id": self.review_id,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "review_title": self.title,
            "review_content": self.content,
            "date_posted": self.date_posted
        }
