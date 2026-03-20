from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage # type: ignore
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle # type: ignore 
from reportlab.lib.units import mm, inch # type: ignore
from reportlab.lib import colors # type: ignore
from datetime import datetime
import io

def create_pdf(data: dict, file_path: str) -> None:
    doc = SimpleDocTemplate(
        file_path,
        rightMargin=10 * mm,
        leftMargin=10 * mm,
        topMargin=10 * mm,
        bottomMargin=10 * mm,
    )

    styles = getSampleStyleSheet()

    # ✅ Improve default styles
    styles["Normal"].textColor = colors.black
    styles["Title"].textColor = colors.darkgreen

    # ✅ Custom styles
    heading_style = ParagraphStyle(
        name="HeadingCustom",
        parent=styles["Heading3"],
        textColor=colors.darkgreen,
        spaceAfter=6,
    )

    bullet_style = ParagraphStyle(
        name="Bullet",
        parent=styles["Normal"],
        leftIndent=12,
        spaceAfter=4,
    )

    normal_style = ParagraphStyle(
        name="NormalCustom",
        parent=styles["Normal"],
        spaceAfter=6,
    )

    content = []

    # ---------------- HEADER ----------------
    content.append(Paragraph("Plant Health Report", styles["Title"]))
    content.append(Spacer(1, 6))

    ts = data.get("created_at", datetime.utcnow())
    if isinstance(ts, datetime):
        ts = ts.strftime("%Y-%m-%d %H:%M UTC")

    content.append(Paragraph(f"Generated: {ts}", normal_style))

    if data.get("email"):
        content.append(Paragraph(f"User: {data['email']}", normal_style))

    content.append(Spacer(1, 10))

    # ---------------- PLANT IMAGE ----------------
    if data.get("image_bytes"):
        img_buffer = io.BytesIO(data["image_bytes"])
        img = RLImage(img_buffer, width=3 * inch, height=3 * inch)
        img.hAlign = 'CENTER'
        content.append(img)
        content.append(Spacer(1, 10))

    # ---------------- DIAGNOSIS ----------------
    content.append(Paragraph("Diagnosis", styles["Heading2"]))
    content.append(Paragraph(f"Condition: {data.get('disease', 'Unknown')}", normal_style))

    if data.get("severity"):
        content.append(Paragraph(f"Severity: {data['severity']}", normal_style))

    if data.get("confidence") is not None:
        pct = round(data["confidence"] * 100, 1)
        content.append(Paragraph(f"Confidence: {pct}%", normal_style))

    content.append(Spacer(1, 10))

    # ---------------- ACTIONS ----------------
    if data.get("actions"):
        content.append(Paragraph("Recommended Actions", heading_style))
        for action in data["actions"]:
            content.append(Paragraph(f"• {action}", bullet_style))
        content.append(Spacer(1, 10))

    # ---------------- AI ANALYSIS (FIXED) ----------------
    if data.get("chatbot_response"):
        content.append(Paragraph("AI Analysis", heading_style))

        text = data["chatbot_response"]

        # ✅ Clean markdown + emojis
        text = (
            text.replace("**", "")
            .replace("🌿", "")
            .replace("🌱", "")
            .replace("💧", "")
            .replace("⚠️", "")
            .replace("🔍", "")
        )

        lines = text.split("\n")

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # HEADINGS
            if any(keyword in line for keyword in [
                "What's Happening",
                "What You Should Do",
                "Care Tip",
                "Uncertainty"
            ]):
                content.append(Spacer(1, 6))
                content.append(Paragraph(line, heading_style))

            # BULLETS
            elif line.startswith("-"):
                content.append(Paragraph(f"• {line[1:].strip()}", bullet_style))

            # NORMAL TEXT
            else:
                content.append(Paragraph(line, normal_style))

        content.append(Spacer(1, 10))

    # ---------------- BUILD ----------------
    doc.build(content)