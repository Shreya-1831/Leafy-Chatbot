from fastapi import APIRouter, Depends
from db import scans_collection
from routes.auth import get_current_user

router = APIRouter()

@router.get("/analytics/")
async def get_analytics(email: str = Depends(get_current_user)):  # ✅ auth added
    scans = await scans_collection.find(
        {"email": email},  # ✅ only this user's scans
        {"_id": 0}
    ).to_list(100)

    disease_freq = {}
    confidence_trend = []

    for scan in scans:
        disease = scan.get("disease", "unknown")
        confidence = scan.get("confidence", 0)
        date = scan.get("created_at")

        disease_freq[disease] = disease_freq.get(disease, 0) + 1
        confidence_trend.append({
            "date": str(date),
            "confidence": confidence
        })

    return {
        "disease_frequency": disease_freq,
        "confidence_trend": confidence_trend
    }