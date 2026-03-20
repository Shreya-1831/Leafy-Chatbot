from typing import Literal

SeverityLevel = Literal["Mild", "Moderate", "Severe"]


def get_severity(confidence: float) -> SeverityLevel:
    """
    Maps model confidence to a human-readable severity level.

    The logic is intentionally inverted from raw confidence:
    - High confidence in a disease diagnosis → the model is SURE it's sick → Severe
    - Low confidence                         → uncertain, treat cautiously  → Mild

    This matches how predict.py stores severity and how SummaryCard.tsx renders it.
    """
    if confidence > 0.8:
        return "Severe"
    elif confidence > 0.5:
        return "Moderate"
    else:
        return "Mild"