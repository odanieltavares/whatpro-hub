"""
Whisper Service — Stub FastAPI
Mock for audio transcription.
"""
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel

app = FastAPI(title="Whisper Service", version="1.0.0")

class WhisperResponse(BaseModel):
    text: str
    language: str = "pt"
    source: str = "stub"

@app.post("/v1/audio/transcriptions", response_model=WhisperResponse)
async def transcribe(file: UploadFile = File(...)):
    # Em um stub, retornamos um texto hardcoded pois não estamos processando o áudio real
    return WhisperResponse(
        text="Ou, tô querendo dar meu HB20 de entrada num Creta, tem algum aí na loja hoje?"
    )

@app.get("/health")
def health():
    return {"status": "ok", "service": "whisper-stub"}
