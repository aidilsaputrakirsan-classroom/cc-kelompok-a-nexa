import os
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database import Base

DATABASE_URL = os.getenv("DATABASE_URL", "")
IS_SQLITE = DATABASE_URL.startswith("sqlite")

class Item(Base):
    __tablename__ = "items"
    if not IS_SQLITE:
        __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    category = Column(String(50), nullable=True)
    owner_id = Column(Integer, nullable=False)  # Refers to auth-service user ID
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())