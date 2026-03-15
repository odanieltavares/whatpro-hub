"""
Whisper Service — Implementação Real
Transcrição de áudio com faster-whisper (CTranslate2, muito mais rápido que openai-whisper).
Compatível com a rota /v1/audio/transcriptions (formato OpenAI-compatível).
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import os, tempfile, io

app = FastAPI(title="Whisper Service", version="2.0.0")

MODEL_SIZE = os.getenv("MODEL", "base")           # tiny, base, small, medium, large-v3
DEVICE = os.getenv("DEVICE", "cpu")               # cpu ou cuda
COMPUTE_TYPE = os.getenv("COMPUTE_TYPE", "int8")  # int8 (CPU) ou float16 (GPU)

_model = None


def get_model():
    global _model
    if _model is None:
        try:
            from faster_whisper import WhisperModel
            print(f"[Whisper] Carregando modelo: {MODEL_SIZE} ({DEVICE}/{COMPUTE_TYPE})")
            _model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
            print("[Whisper] Modelo carregado!")
        except ImportError:
            raise RuntimeError("Instale: pip install faster-whisper")
    return _model


class WhisperResponse(BaseModel):
    text: str
    language: str
    source: str = "faster-whisper-real"


@app.post("/v1/audio/transcriptions", response_model=WhisperResponse)
async def transcribe(file: UploadFile = File(...)):
    try:
        model = get_model()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    try:
        # Salva arquivo temporariamente (faster-whisper precisa de path em disco)
        content = await file.read()
        suffix = ".ogg"  # WhatsApp envia OGG opus
        if file.filename:
            ext = os.path.splitext(file.filename)[1]
            if ext:
                suffix = ext

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            segments, info = model.transcribe(
                tmp_path,
                beam_size=5,
                language=None,  # Auto-detect
                vad_filter=True,  # Remove silêncio
                vad_parameters={"min_silence_duration_ms": 500},
            )
            # Concatena todos os segmentos
            text = " ".join(seg.text.strip() for seg in segments).strip()
            detected_lang = info.language or "pt"
        finally:
            os.unlink(tmp_path)  # Remove arquivo temporário

        return WhisperResponse(text=text, language=detected_lang)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na transcrição: {str(e)}")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "whisper-real",
        "model": MODEL_SIZE,
        "device": DEVICE,
    }
