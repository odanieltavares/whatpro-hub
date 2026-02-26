"""
Security Service — Stub FastAPI
Combines TextStat spam detection + Presidio PII masking.
Stub uses pure Python regex for PII masking (no ML models needed).
"""
from fastapi import FastAPI
from pydantic import BaseModel
import re, random

app = FastAPI(title="Security Service", version="1.0.0")

# ── Spam Detection (TextStat-inspired rules) ────────────────────────────────────

SPAM_PATTERNS = [
    r"(clique aqui|acesse agora|promoção relâmpago|ganhe grátis|oferta exclusiva)",
    r"(http[s]?://\S+){3,}",   # Many URLs = spam
    r"[A-Z]{10,}",             # All-caps = spam
    r"(.)\1{5,}",              # Repeated chars = spam
]


class SpamRequest(BaseModel):
    text: str


class SpamResponse(BaseModel):
    is_spam: bool
    spam_score: float
    reason: str | None = None


@app.post("/spam-check", response_model=SpamResponse)
def check_spam(req: SpamRequest):
    score = 0.0
    reason = None
    for pat in SPAM_PATTERNS:
        if re.search(pat, req.text, re.IGNORECASE):
            score += 0.35
            reason = f"pattern: {pat[:40]}"
    # Very short messages that are clearly noise
    if len(req.text.strip()) < 3:
        score = 1.0
        reason = "too short"
    score = min(score, 1.0)
    return SpamResponse(is_spam=score > 0.7, spam_score=round(score, 3), reason=reason)


# ── PII Masking (Presidio stub via regex) ────────────────────────────────────────

PII_RULES = [
    (r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b", "[CPF_REDACTED]"),          # CPF
    (r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b", "[CNPJ_REDACTED]"), # CNPJ
    (r"\(?\d{2}\)?[\s-]?9?\d{4}-?\d{4}", "[PHONE_REDACTED]"),         # Phone
    (r"[\w.+-]+@[\w-]+\.[a-zA-Z.]{2,}", "[EMAIL_REDACTED]"),           # Email
    (r"\b[A-Z]{3}\d[A-Z\d]\d{2}\b", "[PLATE_REDACTED]"),              # BR plate (new format)
    (r"\b[A-Z]{3}-?\d{4}\b", "[PLATE_REDACTED]"),                      # BR plate (old format)
]


class PIIRequest(BaseModel):
    text: str
    language: str = "pt"


class PIIResponse(BaseModel):
    masked_text: str
    entities_found: list[str]


@app.post("/mask-pii", response_model=PIIResponse)
def mask_pii(req: PIIRequest):
    text = req.text
    found = []
    for pattern, replacement in PII_RULES:
        if re.search(pattern, text):
            label = replacement.strip("[]").split("_")[0]
            found.append(label)
        text = re.sub(pattern, replacement, text)
    return PIIResponse(masked_text=text, entities_found=list(set(found)))


@app.get("/health")
def health():
    return {"status": "ok", "service": "security-stub"}
