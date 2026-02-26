"""
LLaVA Service — Stub FastAPI
Mock for LLaVA / Moondream.
"""
from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI(title="LLaVA Service", version="1.0.0")

class LLaVARequest(BaseModel):
    image_url: str | None = None
    image_base64: str | None = None
    prompt: str

class LLaVAResponse(BaseModel):
    description: str
    confidence: float
    source: str = "stub"

@app.post("/analyze", response_model=LLaVAResponse)
def analyze_image(req: LLaVARequest):
    return LLaVAResponse(
        description="Imagem de veículo analisada com LLaVA. Parece estar em bom estado aparente, sem avarias graves visíveis, cor escura, modelo sedan médio.",
        confidence=round(random.uniform(0.7, 0.95), 2)
    )

@app.get("/health")
def health():
    return {"status": "ok", "service": "llava-stub"}
