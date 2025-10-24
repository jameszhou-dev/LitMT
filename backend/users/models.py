from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Schema for creating a new user"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    isadmin: bool = False


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    isadmin: Optional[bool] = None


class UserResponse(BaseModel):
    """Schema for returning user information (without password)"""
    id: str = Field(..., alias="_id")
    username: str
    email: str
    isadmin: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class User(BaseModel):
    """Database model for users"""
    username: str
    email: str
    password_hash: str
    isadmin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "username": "john_doe",
                "email": "john@example.com",
                "password_hash": "hashed_password_here",
                "isadmin": False,
                "created_at": "2025-10-23T12:00:00",
                "updated_at": "2025-10-23T12:00:00"
            }
        }
