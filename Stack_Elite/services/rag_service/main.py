"""
RAG Service — Implementação Real
FastEmbed (BGE-small-en-v1.5 ou BAAI/bge-m3 multilingual) + BGE-Reranker para reranking.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os

app = FastAPI(title="RAG Service", version="2.0.0")

VECTOR_DIM = int(os.getenv("VECTOR_DIM", "384"))
EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-small-en-v1.5")
RERANK_MODEL = os.getenv("RERANK_MODEL", "BAAI/bge-reranker-base")

_embed_model = None
_rerank_model = None


def get_embed_model():
    global _embed_model
    if _embed_model is None:
        try:
            from fastembed import TextEmbedding
            print(f"[RAG] Carregando modelo de embedding: {EMBED_MODEL}")
            _embed_model = TextEmbedding(model_name=EMBED_MODEL)
            print("[RAG] Embedding model carregado!")
        except ImportError:
            raise RuntimeError("Biblioteca 'fastembed' não instalada. Execute: pip install fastembed")
    return _embed_model


def get_rerank_model():
    global _rerank_model
    if _rerank_model is None:
        try:
            from fastembed.rerank.cross_encoder import TextCrossEncoder
            print(f"[RAG] Carregando reranker: {RERANK_MODEL}")
            _rerank_model = TextCrossEncoder(model_name=RERANK_MODEL)
            print("[RAG] Reranker carregado!")
        except ImportError:
            raise RuntimeError("Biblioteca 'fastembed' não instalada. Execute: pip install fastembed")
    return _rerank_model


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    vector: list[float]
    dimensions: int
    source: str = "fastembed-real"


class RerankRequest(BaseModel):
    query: str
    documents: list[dict]
    top_k: int = 3


class RerankResponse(BaseModel):
    reranked: list[dict]


@app.post("/embed", response_model=EmbedResponse)
def embed_text(req: EmbedRequest):
    try:
        model = get_embed_model()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # fastembed retorna um generator — convertemos para lista
    embeddings = list(model.embed([req.text]))
    vector = embeddings[0].tolist()

    return EmbedResponse(
        vector=vector,
        dimensions=len(vector),
        source="fastembed-real",
    )


@app.post("/rerank", response_model=RerankResponse)
def rerank_documents(req: RerankRequest):
    try:
        reranker = get_rerank_model()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    if not req.documents:
        return RerankResponse(reranked=[])

    # Extrai textos dos documentos
    texts = [doc.get("text", doc.get("descricao_tecnica", str(doc))) for doc in req.documents]

    # Rerank via cross-encoder
    scores = list(reranker.rerank(req.query, texts))

    # Ordena pelo score (descrescente)
    scored_docs = sorted(
        zip(req.documents, scores),
        key=lambda x: x[1],
        reverse=True
    )

    # Adiciona relevance_score e retorna top_k
    reranked = []
    for doc, score in scored_docs[:req.top_k]:
        doc_copy = dict(doc)
        doc_copy["relevance_score"] = round(float(score), 4)
        reranked.append(doc_copy)

    return RerankResponse(reranked=reranked)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "rag-real",
        "embed_model": EMBED_MODEL,
        "rerank_model": RERANK_MODEL,
        "vector_dim": VECTOR_DIM,
    }
