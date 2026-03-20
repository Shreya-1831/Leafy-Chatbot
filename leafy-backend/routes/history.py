from fastapi import APIRouter, Depends
from db import scans_collection
from routes.auth import get_current_user

router = APIRouter()

@router.get("/history/")
async def get_history(email: str = Depends(get_current_user)):
    scans = await scans_collection.find(
        {"email": email},          # only this user's scans
        {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    return {"history": scans}