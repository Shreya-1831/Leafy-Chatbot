import os
import hashlib
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext  # type: ignore
from jose import jwt, JWTError  # type: ignore

from db import db

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY must be set in environment variables")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

router = APIRouter()
bearer = HTTPBearer()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
users_collection = db["users"]

# ─────────────────────────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────────────────────────

class User(BaseModel):
    email: EmailStr
    password: str

# ─────────────────────────────────────────────────────────────
# PASSWORD HANDLING (FIXED 🔐)
# ─────────────────────────────────────────────────────────────

def _prehash(password: str) -> str:
    """
    Pre-hash using SHA-256 to avoid bcrypt 72-byte limit.
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def hash_password(password: str) -> str:
    return pwd_context.hash(_prehash(password))

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(_prehash(password), hashed)

# ─────────────────────────────────────────────────────────────
# JWT TOKEN
# ─────────────────────────────────────────────────────────────

def create_token(data: dict) -> str:
    to_encode = data.copy()  # FIX: avoid mutation bug
    to_encode.update({
        "exp": datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ─────────────────────────────────────────────────────────────
# AUTH DEPENDENCY
# ─────────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        email = payload.get("email")

        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")

        return email

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────

@router.post("/signup")
async def signup(user: User):
    email = user.email.lower().strip()

    existing_user = await users_collection.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User exists")

    await users_collection.insert_one({
        "email": email,
        "password": hash_password(user.password),
        "created_at": datetime.utcnow()
    })

    # 🔥 AUTO LOGIN (CRUCIAL FIX)
    token = create_token({"email": email})

    return {
        "message": "User created successfully",
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/login")
async def login(user: User):
    email = user.email.lower().strip()

    db_user = await users_collection.find_one({"email": email})

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({"email": email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.get("/me")
async def get_me(email: str = Depends(get_current_user)):
    user = await users_collection.find_one(
        {"email": email},
        {"_id": 0, "password": 0}
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user