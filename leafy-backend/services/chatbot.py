import os
import re
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("Groq API key not found in environment variables.")

client = Groq(api_key=GROQ_API_KEY)

# ==============================
# SYSTEM PROMPTS
# ==============================

CHAT_MODE = """
You are a friendly, intelligent plant assistant 🌿
Respond naturally like a human conversation.
- Short and warm
- Light poetic touch allowed
- NO structured headings
"""

DIAGNOSIS_MODE = """
You are a plant disease expert. Reply using EXACTLY this format, no deviations:

🌿 "One short poetic line."

**🌱 What's Happening:**
One short paragraph explaining the disease clearly.

**💧 What You Should Do:**
- **Action**: One sentence explanation.
- **Action**: One sentence explanation.
- **Action**: One sentence explanation.
- **Action**: One sentence explanation.

**⚠️ Care Tip:**
One sentence tip.

**🔍 Uncertainty Note:**
One sentence if needed.

RULES:
- NO horizontal lines, NO ---, NO extra separators
- Each bullet on its OWN line, never inline
- Exactly 4 bullets under "What You Should Do"
- NO extra sections
- Each bullet MUST have a bold action name followed by a colon
- Keep total response under 350 words
"""

EMERGENCY_MODE = """
You are a plant emergency expert 🚨🌿
Respond with immediate action steps first, then explanation.

🚨 **Immediate Action:**
- Step one
- Step two

🌿 **What's Happening:**
Short explanation.

⚠️ **Critical Tip:**
One prevention tip.
"""

# ==============================
# DISEASE CONTEXT
# ==============================

disease_context = {
    "healthy": "The plant appears healthy.",
    "powdery": "Powdery mildew fungal infection.",
    "rust": "Rust disease causing orange/brown spots.",
}

# ==============================
# INTENT DETECTION
# ==============================

def detect_intent(user_prompt: str, predicted_class: str | None):
    text = user_prompt.lower().strip()

    emergency_keywords = [
        "dying", "dead", "wilting badly", "rotting",
        "urgent", "help fast", "plant dying", "leaves falling"
    ]
    diagnosis_keywords = [
        "disease", "spots", "yellow", "fungus", "infection",
        "rust", "powdery", "leaf problem"
    ]

    if len(text.split()) <= 3 and not predicted_class:
        return "chat"
    if any(word in text for word in emergency_keywords):
        return "emergency"
    if predicted_class or any(word in text for word in diagnosis_keywords):
        return "diagnosis"
    return "chat"


# ==============================
# PROMPT BUILDER
# ==============================

def build_prompt(user_prompt: str, predicted_class=None, confidence=None):
    context = ""
    if predicted_class:
        disease_info = disease_context.get(predicted_class.lower(), "")
        context += f"\nDetected condition: {predicted_class}\n{disease_info}\n"
    if confidence is not None:
        if confidence < 0.6:
            context += "\nConfidence LOW.\n"
        elif confidence < 0.8:
            context += "\nConfidence MODERATE.\n"
        else:
            context += "\nConfidence HIGH.\n"
    return f"{context}\nUser says:\n{user_prompt}"


# ==============================
# POST-PROCESSOR
# ==============================

def format_diagnosis_response(text: str) -> str:
    # ✅ Remove horizontal lines
    text = re.sub(r'\n[-—=]{2,}\n', '\n', text)
    text = re.sub(r'^[-—=]{2,}$', '', text, flags=re.MULTILINE)

    # ✅ Force every • onto its own line BEFORE splitting — handles inline bullets
    text = re.sub(r'\s*•\s*', '\n• ', text)

    # ✅ Force every - bullet onto its own line too
    text = re.sub(r'\s*(?<!\*)-\s+(?=\*\*)', '\n• ', text)

    lines = text.split('\n')
    result = []
    in_action_section = False

    for line in lines:
        stripped = line.strip()
        if not stripped:
            result.append('')
            continue

        if 'What You Should Do' in stripped:
            in_action_section = True
            result.append(stripped)
            continue

        if in_action_section and stripped.startswith('**') and 'What You Should Do' not in stripped:
            in_action_section = False

        # ✅ In action section — convert any - bullets to • 
        if in_action_section and stripped and not stripped.startswith('**'):
            cleaned = re.sub(r'^[\-\*•]\s*', '', stripped)
            if cleaned:
                result.append(f'• {cleaned}')
            continue

        result.append(stripped)

    return '\n'.join(result).strip()


# ==============================
# NON-STREAMING
# ==============================

def plant_chat(user_prompt: str, predicted_class=None, confidence=None):
    try:
        intent = detect_intent(user_prompt, predicted_class)
        system_prompt = CHAT_MODE if intent == "chat" else EMERGENCY_MODE if intent == "emergency" else DIAGNOSIS_MODE

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": build_prompt(user_prompt, predicted_class, confidence)},
            ],
            temperature=0.5,
            max_tokens=500,
            stream=False,
        )

        response_text = response.choices[0].message.content.strip()
        if intent == "diagnosis":
            response_text = format_diagnosis_response(response_text)
        return response_text

    except Exception as e:
        return f"🌧️ Even the strongest roots tremble. Error: {str(e)}"


# ==============================
# STREAMING
# ==============================

def plant_chat_stream(user_prompt: str, predicted_class=None, confidence=None):
    try:
        intent = detect_intent(user_prompt, predicted_class)
        system_prompt = CHAT_MODE if intent == "chat" else EMERGENCY_MODE if intent == "emergency" else DIAGNOSIS_MODE

        stream = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": build_prompt(user_prompt, predicted_class, confidence)},
            ],
            temperature=0.5,
            max_tokens=500,
            stream=True,
        )

        full_response = ""
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                full_response += delta

        if intent == "diagnosis":
            full_response = format_diagnosis_response(full_response)

        yield full_response

    except Exception as e:
        yield f"🌧️ Even the strongest roots tremble. Error: {str(e)}"