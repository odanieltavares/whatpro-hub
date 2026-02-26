"""
Sentiment Service — Stub FastAPI
Análise de sentimento do cliente para triagem de SLA crítico.
Stub usa palavras-chave de polaridade emotiva em PT-BR.
Produção substitui por: lxyuan/distilbert-base-multilingual-cased-sentiments-student
"""
from fastapi import FastAPI
from pydantic import BaseModel
import re

app = FastAPI(title="Sentiment Service", version="1.0.0")

NEGATIVE_STRONG = [
    "absurdo", "ridículo", "inaceitável", "revoltante", "vergonhoso", "horrível",
    "péssimo", "furiosa", "raiva", "indignado", "mentira", "enganado", "fraude",
    "processarei", "advogado", "procon", "juiz", "nunca mais", "piores"
]
NEGATIVE_MILD = [
    "chateado", "decepcionado", "triste", "frustrado", "demorou", "demora",
    "problema", "ruim", "não funcionou", "errado", "não gostei"
]
POSITIVE = [
    "ótimo", "excelente", "adorei", "perfeito", "maravilhoso", "feliz",
    "satisfeito", "gostei", "obrigado", "incrível", "top"
]


class SentimentRequest(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    sentiment: str  # "positive" | "negative" | "neutral"
    score: float    # 0.0 - 1.0 (intensity)
    label: str      # human readable


@app.post("/analyze", response_model=SentimentResponse)
def analyze_sentiment(req: SentimentRequest):
    lower = req.text.lower()

    strong_neg = sum(1 for w in NEGATIVE_STRONG if w in lower)
    mild_neg   = sum(1 for w in NEGATIVE_MILD   if w in lower)
    pos        = sum(1 for w in POSITIVE         if w in lower)

    if strong_neg >= 1:
        return SentimentResponse(sentiment="negative", score=round(0.85 + strong_neg * 0.05, 2), label="Muito Negativo / Risco de Churn")
    if mild_neg > pos:
        return SentimentResponse(sentiment="negative", score=round(0.55 + mild_neg * 0.05, 2), label="Negativo / Insatisfeito")
    if pos > mild_neg:
        return SentimentResponse(sentiment="positive", score=round(0.6 + pos * 0.08, 2), label="Positivo / Engajado")

    return SentimentResponse(sentiment="neutral", score=0.5, label="Neutro")


@app.get("/health")
def health():
    return {"status": "ok", "service": "sentiment-stub"}
