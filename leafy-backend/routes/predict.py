from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from services.model_service import predict_disease
from services.chatbot_service import generate_chat_stream
from utils.severity import get_severity
from db import scans_collection
from datetime import datetime
from routes.auth import get_current_user
import json, asyncio

router = APIRouter()

# NEW: SSE predict — DragDropUpload.tsx connects here
@router.post("/predict/stream")
async def predict_stream(file: UploadFile = File(...), email: str = Depends(get_current_user)):
    image_bytes = await file.read()

    async def event_generator():
        # Step 1: emit the prediction immediately
        predicted_class, confidence = predict_disease(image_bytes)
        severity = get_severity(confidence)
        yield f"data: {json.dumps({'type': 'prediction', 'predicted_class': predicted_class, 'confidence': round(confidence, 4), 'severity': severity})}\n\n"

        # Step 2: stream the chatbot response token by token
        full_response = ""
        async for chunk in generate_chat_stream(
            f"My leaves look {predicted_class.lower()}. What should I do?",
            predicted_class, confidence
        ):
            full_response += chunk
            yield f"data: {json.dumps({'type': 'chat_chunk', 'chunk': chunk})}\n\n"
            await asyncio.sleep(0)

        # Step 3: persist to DB
        await scans_collection.insert_one({
            "email": email,
            "disease": predicted_class,
            "confidence": confidence,
            "severity": severity,
            "chatbot_response": full_response,
            "created_at": datetime.utcnow()
        })
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})