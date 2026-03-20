from fastapi import APIRouter, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from services.pdf_service import create_pdf
from routes.auth import get_current_user
import uuid, os
from datetime import datetime

router = APIRouter()

@router.post("/download")
async def download_report(
    disease: str = Form(...),
    confidence: str = Form(...),        # ✅ accept as str first, then cast
    severity: str = Form(...),
    chatbot_response: str = Form(""),   # ✅ default to empty string, not required
    image: UploadFile = File(None),
    email: str = Depends(get_current_user)
):
    os.makedirs("static", exist_ok=True)

    # ✅ safely cast confidence to float
    try:
        confidence_float = float(confidence)
    except (ValueError, TypeError):
        confidence_float = 0.0

    image_bytes = await image.read() if image else None

    file_name = f"report_{uuid.uuid4()}.pdf"
    file_path = f"static/{file_name}"

    create_pdf({
        "disease": disease,
        "confidence": confidence_float,
        "severity": severity,
        "chatbot_response": chatbot_response,
        "email": email,
        "created_at": datetime.utcnow(),
        "image_bytes": image_bytes,
    }, file_path)

    date_str = datetime.utcnow().strftime("%Y-%m-%d_%H-%M")
    return FileResponse(file_path, filename=f"plant-report_{date_str}.pdf", media_type="application/pdf")