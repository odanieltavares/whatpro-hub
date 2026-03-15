"""
Sentiment Service — Implementação Real
Análise de sentimento multilingual com HuggingFace Transformers.
Modelo: lxyuan/distilbert-base-multilingual-cased-sentiments-student
(como documentado no stub original)
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os

app = FastAPI(title="Sentiment Service", version="2.0.0")

MODEL_NAME = os.getenv(
    "SENTIMENT_MODEL",
    "lxyuan/distilbert-base-multilingual-cased-sentiments-student"
)

_pipeline = None


def get_pipeline():
    global _pipeline
    if _pipeline is None:
        try:
            from transformers import pipeline as hf_pipeline
            print(f"[Sentiment] Carregando modelo: {MODEL_NAME}")
            _pipeline = hf_pipeline(
                "text-classification",
                model=MODEL_NAME,
                tokenizer=MODEL_NAME,
                top_k=None,  # retorna todos os scores
            )
            print("[Sentiment] Modelo carregado!")
        except ImportError:
            raise RuntimeError("Instale: pip install transformers torch")
    return _pipeline


# Labels que o modelo retorna
LABEL_MAP = {
    "positive": "Positivo / Engajado",
    "negative": "Negativo / Insatisfeito",
    "neutral": "Neutro",
}

# Palavras de alta urgência que merecem escalada mesmo sem NLP
HIGH_URGENCY_KEYWORDS = [
    "absurdo", "ridículo", "inaceitável", "revoltante", "vergonhoso",
    "horrível", "péssimo", "furiosa", "raiva", "indignado",
    "processarei", "advogado", "procon", "juiz", "nunca mais",
]


class SentimentRequest(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    sentiment: str   # positive | negative | neutral
    score: float     # 0.0 - 1.0
    label: str       # human-readable
    urgent: bool     # se true → acionar handoff imediato
    source: str = "transformers-real"


@app.post("/analyze", response_model=SentimentResponse)
def analyze_sentiment(req: SentimentRequest):
    # Checagem de urgência por keywords (determinística, sem ML)
    lower = req.text.lower()
    is_urgent = any(kw in lower for kw in HIGH_URGENCY_KEYWORDS)

    try:
        pipe = get_pipeline()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Trunca texto para o limite do modelo (512 tokens)
    text_truncated = req.text[:512] if len(req.text) > 512 else req.text

    results = pipe(text_truncated)
    # results = [[{label: 'positive', score: 0.97}, {label: 'negative', ...}, ...]]
    scores_list = results[0] if isinstance(results[0], list) else results

    # Pega o label com maior score
    best = max(scores_list, key=lambda x: x["score"])
    sentiment = best["label"].lower()
    score = round(best["score"], 4)

    # Se urgente, força negativo
    if is_urgent:
        sentiment = "negative"
        score = max(score, 0.9)

    label = LABEL_MAP.get(sentiment, sentiment)
    if is_urgent:
        label = "⚠️ Muito Negativo / Risco de Churn — HANDOFF URGENTE"

    return SentimentResponse(
        sentiment=sentiment,
        score=score,
        label=label,
        urgent=is_urgent or (sentiment == "negative" and score >= 0.85),
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "sentiment-real", "model": MODEL_NAME}
