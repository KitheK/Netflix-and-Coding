from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Web Service API"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    " This is a unqiue key/password, "
    "Under normal circumstance WE could be fucked if this pushed to git (assuming we working with real data)"

    " The password to our token system"
    SECRET_KEY: str = "f84d7a8b9c2e1f3a5b8c7d6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9"
    

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()