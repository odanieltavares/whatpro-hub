"""
GLiNER Service — Implementação Real
Extração de entidades Zero-Shot com o modelo urchade/gliner_multi-v2.1.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os

app = FastAPI(title="GLiNER Service", version="2.0.0")

# Carrega modelo na inicialização (lazy se LAZY_LOAD=true)
_model = None

def get_model():
    global _model
    if _model is None:
        try:
            from gliner import GLiNER
            model_name = os.getenv("MODEL_NAME", "urchade/gliner_multi-v2.1")
            print(f"[GLiNER] Carregando modelo: {model_name}")
            _model = GLiNER.from_pretrained(model_name)
            print("[GLiNER] Modelo carregado com sucesso!")
        except ImportError:
            raise RuntimeError("Biblioteca 'gliner' não instalada. Execute: pip install gliner")
    return _model


class ExtractRequest(BaseModel):
    text: str
    labels: list[str] = ["INTENCAO", "VEICULO_INTERESSE", "VEICULO_TROCA", "ORCAMENTO", "CONDICAO_VEICULO"]
    threshold: float = 0.5


class ExtractResponse(BaseModel):
    entities: dict
    confidence: float
    source: str = "gliner-real"


@app.post("/extract", response_model=ExtractResponse)
def extract_entities(req: ExtractRequest):
    try:
        model = get_model()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Inferência real com GLiNER
    predictions = model.predict_entities(req.text, req.labels, threshold=req.threshold)

    # Agrupa por label — mantém a entidade com maior score
    entities: dict = {}
    scores: dict = {}
    for pred in predictions:
        label = pred["label"]
        text_val = pred["text"]
        score = pred["score"]
        if label not in scores or score > scores[label]:
            entities[label] = text_val
            scores[label] = score

    avg_confidence = round(sum(scores.values()) / len(scores), 4) if scores else 0.0

    return ExtractResponse(
        entities=entities,
        confidence=avg_confidence,
        source="gliner-real",
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "gliner-real", "model": os.getenv("MODEL_NAME", "urchade/gliner_multi-v2.1")}
