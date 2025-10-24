from fastapi import APIRouter, HTTPException, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from bson import ObjectId
import bcrypt
from .models import UserCreate, UserUpdate, UserResponse, User

router = APIRouter(prefix="/users", tags=["users"])


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode(), password_hash.encode())


async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    """Retrieve a user by ID"""
    try:
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid user ID: {str(e)}")


async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> dict:
    """Retrieve a user by email"""
    user = await db["users"].find_one({"email": email})
    return user


async def get_user_by_username(db: AsyncIOMotorDatabase, username: str) -> dict:
    """Retrieve a user by username"""
    user = await db["users"].find_one({"username": username})
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, request: Request):
    """Register a new user"""
    db = request.app.state.db
    
    # Check if user already exists by email
    existing_email = await get_user_by_email(db, user_data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username is already taken
    existing_username = await get_user_by_username(db, user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create new user
    user_doc = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        isadmin=user_data.isadmin
    )

    result = await db["users"].insert_one(user_doc.model_dump())
    created_user = await get_user_by_id(db, str(result.inserted_id))

    return UserResponse(
        id=str(created_user["_id"]),
        username=created_user["username"],
        email=created_user["email"],
        isadmin=created_user["isadmin"],
        created_at=created_user["created_at"],
        updated_at=created_user["updated_at"]
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, request: Request):
    """Get a user by ID"""
    db = request.app.state.db
    user = await get_user_by_id(db, user_id)
    
    return UserResponse(
        id=str(user["_id"]),
        username=user["username"],
        email=user["email"],
        isadmin=user["isadmin"],
        created_at=user["created_at"],
        updated_at=user["updated_at"]
    )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_data: UserUpdate, request: Request):
    """Update a user"""
    db = request.app.state.db
    user = await get_user_by_id(db, user_id)

    # Check if new email is already taken by another user
    if user_data.email and user_data.email != user["email"]:
        existing_email = await get_user_by_email(db, user_data.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # Check if new username is already taken by another user
    if user_data.username and user_data.username != user["username"]:
        existing_username = await get_user_by_username(db, user_data.username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

    # Build update dictionary
    update_dict = {}
    if user_data.username:
        update_dict["username"] = user_data.username
    if user_data.email:
        update_dict["email"] = user_data.email
    if user_data.password:
        update_dict["password_hash"] = hash_password(user_data.password)
    if user_data.isadmin is not None:
        update_dict["isadmin"] = user_data.isadmin

    update_dict["updated_at"] = datetime.utcnow()

    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_dict}
    )

    updated_user = await get_user_by_id(db, user_id)

    return UserResponse(
        id=str(updated_user["_id"]),
        username=updated_user["username"],
        email=updated_user["email"],
        isadmin=updated_user["isadmin"],
        created_at=updated_user["created_at"],
        updated_at=updated_user["updated_at"]
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, request: Request):
    """Delete a user"""
    db = request.app.state.db
    user = await get_user_by_id(db, user_id)

    result = await db["users"].delete_one({"_id": ObjectId(user_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete user")

    return None


@router.get("/", response_model=list[UserResponse])
async def list_users(request: Request):
    """List all users"""
    db = request.app.state.db
    try:
        users = await db["users"].find().to_list(None)
        return [
            UserResponse(
                id=str(user["_id"]),
                username=user["username"],
                email=user["email"],
                isadmin=user["isadmin"],
                created_at=user["created_at"],
                updated_at=user["updated_at"]
            )
            for user in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list users: {str(e)}")


@router.post("/login", response_model=dict)
async def login_user(username: str, password: str, request: Request):
    """Authenticate a user (login)"""
    db = request.app.state.db
    user = await get_user_by_username(db, username)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "isadmin": user["isadmin"]
    }
