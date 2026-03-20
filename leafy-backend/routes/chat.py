from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.chatbot_service import generate_chat_stream, generate_chat
from db import chats_collection, sessions_collection
from datetime import datetime
from routes.auth import get_current_user
import json, asyncio
from bson import ObjectId

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    predicted_class: str | None = None
    confidence: float | None = None
    session_id: str | None = None

class PredictionMessage(BaseModel):
    session_id: str | None = None
    predicted_class: str
    confidence: float
    severity: str
    image_data_url: str | None = None  # ✅ store base64 image

class BotReplyMessage(BaseModel):
    session_id: str
    content: str

@router.post("/chat/sessions/bot-reply")
async def save_bot_reply(req: BotReplyMessage, email: str = Depends(get_current_user)):
    await chats_collection.insert_one({
        "email": email,
        "session_id": req.session_id,
        "role": "bot",
        "content": req.content,
        "created_at": datetime.utcnow(),
    })
    await sessions_collection.update_one(
        {"_id": ObjectId(req.session_id)},
        {"$set": {"updated_at": datetime.utcnow()}}
    )
    return {"saved": True}

@router.post("/chat/sessions")
async def create_session(email: str = Depends(get_current_user)):
    result = await sessions_collection.insert_one({
        "email": email,
        "title": "New Chat",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })
    return {"session_id": str(result.inserted_id)}

@router.get("/chat/sessions")
async def list_sessions(email: str = Depends(get_current_user)):
    sessions = await sessions_collection.find(
        {"email": email},
        {"_id": 1, "title": 1, "created_at": 1, "updated_at": 1}
    ).sort("updated_at", -1).to_list(50)
    return {"sessions": [{**s, "_id": str(s["_id"])} for s in sessions]}

@router.get("/chat/sessions/{session_id}")
async def get_session(session_id: str, email: str = Depends(get_current_user)):
    messages = await chats_collection.find(
        {"email": email, "session_id": session_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(200)

    # ✅ Extract prediction from the prediction-type message
    prediction = None
    for msg in messages:
        if msg.get("type") == "prediction":
            prediction = {
                "predicted_class": msg.get("predicted_class"),
                "confidence": msg.get("confidence"),
                "severity": msg.get("severity"),
            }
            break

    return {"messages": messages, "prediction": prediction}

@router.delete("/chat/sessions/{session_id}")
async def delete_session(session_id: str, email: str = Depends(get_current_user)):
    await sessions_collection.delete_one({"_id": ObjectId(session_id), "email": email})
    await chats_collection.delete_many({"session_id": session_id, "email": email})
    return {"deleted": True}

# ✅ MUST be before /{session_id} route
@router.post("/chat/sessions/prediction")
async def save_prediction_to_session(
    req: PredictionMessage,
    email: str = Depends(get_current_user)
):
    session_id = req.session_id

    if not session_id:
        result = await sessions_collection.insert_one({
            "email": email,
            "title": f"🌿 {req.predicted_class} scan",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })
        session_id = str(result.inserted_id)
    else:
        await sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {
                "title": f"🌿 {req.predicted_class} scan",
                "updated_at": datetime.utcnow()
            }}
        )

    await chats_collection.insert_one({
        "email": email,
        "session_id": session_id,
        "role": "user",
        "content": "I've uploaded an image of my plant for diagnosis.",
        "type": "prediction",
        "predicted_class": req.predicted_class,
        "confidence": req.confidence,
        "severity": req.severity,
        "image_data_url": req.image_data_url,  # ✅ saved to DB
        "created_at": datetime.utcnow(),
    })

    return {"session_id": session_id}

@router.post("/chat/stream")
async def chat_stream(req: ChatRequest, email: str = Depends(get_current_user)):
    session_id = req.session_id
    if not session_id:
        result = await sessions_collection.insert_one({
            "email": email,
            "title": req.message[:40],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })
        session_id = str(result.inserted_id)

    await chats_collection.insert_one({
        "email": email,
        "session_id": session_id,
        "role": "user",
        "content": req.message,
        "created_at": datetime.utcnow(),
    })

    async def event_generator():
        yield f"data: {json.dumps({'session_id': session_id})}\n\n"

        full_response = ""
        async for chunk in generate_chat_stream(req.message, req.predicted_class, req.confidence):
            full_response += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            await asyncio.sleep(0)

        await chats_collection.insert_one({
            "email": email,
            "session_id": session_id,
            "role": "bot",
            "content": full_response,
            "created_at": datetime.utcnow(),
        })

        await sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"updated_at": datetime.utcnow()}}
        )

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})