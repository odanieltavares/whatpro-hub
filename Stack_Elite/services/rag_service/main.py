"""
RAG Service — Stub FastAPI
Provides: /embed (text → vector) + /rerank (reorder documents by relevance)
Stub: returns random float vectors of dimension 384 (BGE-small compatible)
Production: fastembed + bge-reranker-base models
"""
from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI(title="RAG Service", version="1.0.0")

VECTOR_DIM = 384  # Compatible with FastEmbed / BGE-small


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    vector: list[float]
    dimensions: int
    source: str = "stub"


class RerankRequest(BaseModel):
    query: str
    documents: list[dict]
    top_k: int = 3


class RerankResponse(BaseModel):
    reranked: list[dict]


@app.post("/embed", response_model=EmbedResponse)
def embed_text(req: EmbedRequest):
    """Returns a random unit-normalized vector (stub).
    In production, this calls FastEmbed's inference for the text.
    """
    raw = [random.gauss(0, 1) for _ in range(VECTOR_DIM)]
    # Normalize to unit vector (cosine similarity will still work)
    magnitude = sum(x ** 2 for x in raw) ** 0.5
    vector = [round(x / magnitude, 6) for x in raw]
    return EmbedResponse(vector=vector, dimensions=VECTOR_DIM)


@app.post("/rerank", response_model=RerankResponse)
def rerank_documents(req: RerankRequest):
    """Passes documents through with stub scores (stub).
    In production, this calls BGE-Reranker which scores each (query, doc) pair.
    We add a dummy relevance_score for downstream consumption.
    """
    docs = req.documents[:req.top_k]
    # Assign decreasing stub scores
    for i, doc in enumerate(docs):
        doc["relevance_score"] = round(0.98 - (i * 0.08), 3)
    return RerankResponse(reranked=docs)


@app.get("/health")
def health():
    return {"status": "ok", "service": "rag-stub", "vector_dim": VECTOR_DIM}
