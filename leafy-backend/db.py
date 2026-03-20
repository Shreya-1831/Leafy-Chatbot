from motor.motor_asyncio import AsyncIOMotorClient # type: ignore
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not set.")

client = AsyncIOMotorClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000,
    tls=True,
    tlsAllowInvalidCertificates=True  # ✅ fixes SSL handshake error on Render
)

db = client["leafy_db"]

users_collection    = db["users"]
scans_collection    = db["scans"]
chats_collection    = db["chats"]
sessions_collection = db["sessions"]