import os
import logging
from dotenv import load_dotenv

# Load env variables from .env
load_dotenv()

class Config:
    """Base Configuration class with common settings and defaults."""
    APP_ENV: str = os.getenv("APP_ENV", "development").lower()
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nexasdf3r@#14(*h&#)(jdhm02G$#fDd123")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    
    # Safely convert integer settings
    try:
        ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    except ValueError:
        ACCESS_TOKEN_EXPIRE_MINUTES = 60

    try:
        PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", "30"))
    except ValueError:
        PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = 30

    # Common default settings that might be overridden in subclasses
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    ALLOWED_ORIGINS: list[str] = []

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"
    
    # Read origins from env, default to local development ports
    _default_origins = "http://localhost:5173,http://localhost:3000"
    _allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", _default_origins)
    ALLOWED_ORIGINS: list[str] = [
        origin.strip() for origin in _allowed_origins_raw.split(",") if origin.strip()
    ]

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG: bool = False
    LOG_LEVEL: str = "WARNING"
    
    # Read origins from env, default to empty list if not set
    _default_origins = ""
    _allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", _default_origins)
    ALLOWED_ORIGINS: list[str] = [
        origin.strip() for origin in _allowed_origins_raw.split(",") if origin.strip()
    ]

# Simple mapping to get the current config class
config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}

# Determine which configuration to use based on APP_ENV
active_env = os.getenv("APP_ENV", "development").lower()
config_class = config_by_name.get(active_env, DevelopmentConfig)
settings = config_class()

# Helper to configure logging based on settings.LOG_LEVEL
def setup_logging():
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
