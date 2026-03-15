"""
LLaVA Service — Implementação Real via Ollama
Analisa imagens enviadas pelo cliente usando o modelo LLaVA rodando no Ollama.

Pré-requisito: Ollama deve estar rodando com o modelo llava instalado.
  docker run -d -p 11434:11434 --name ollama ollama/ollama
  docker exec -it ollama ollama pull llava

Ou com GPU:
  docker run -d --gpus=all -p 11434:11434 --name ollama ollama/ollama
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os, base64

app = FastAPI(title="LLaVA Service", version="2.0.0")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
LLAVA_MODEL = os.getenv("LLAVA_MODEL", "llava")

import httpx

SYSTEM_PROMPT = """Você é um assistente de análise de veículos para uma concessionária.
Analise a imagem fornecida e descreva em português:
1. Tipo de veículo e modelo estimado
2. Cor e estado aparente de conservação
3. Se há avarias, arranhões ou danos visíveis
4. Qualquer informação relevante para uma negociação de trade-in
Seja direto e objetivo. Se não for uma imagem de veículo, descreva o que vê."""


class LLaVARequest(BaseModel):
    image_url: str | None = None
    image_base64: str | None = None
    prompt: str = "Descreva este veículo detalhadamente para fins de avaliação."


class LLaVAResponse(BaseModel):
    description: str
    model_used: str
    source: str = "ollama-llava-real"


async def fetch_image_as_base64(url: str) -> str:
    """Baixa imagem de URL e converte para base64."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return base64.b64encode(resp.content).decode("utf-8")


@app.post("/analyze", response_model=LLaVAResponse)
async def analyze_image(req: LLaVARequest):
    if not req.image_url and not req.image_base64:
        raise HTTPException(status_code=400, detail="Forneça image_url ou image_base64.")

    # Obtém imagem em base64
    try:
        if req.image_base64:
            image_b64 = req.image_base64
        else:
            image_b64 = await fetch_image_as_base64(req.image_url)  # type: ignore
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao obter imagem: {str(e)}")

    # Chama Ollama API (endpoint /api/generate)
    payload = {
        "model": LLAVA_MODEL,
        "prompt": f"{SYSTEM_PROMPT}\n\n{req.prompt}",
        "images": [image_b64],
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 512,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:  # imagens demoram mais
            resp = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
            if not resp.ok:
                raise HTTPException(
                    status_code=503,
                    detail=f"Ollama retornou {resp.status_code}: {resp.text[:200]}"
                )
            data = resp.json()
            description = data.get("response", "").strip()
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama não está acessível em {OLLAMA_URL}. "
                   f"Inicie com: docker run -d -p 11434:11434 ollama/ollama && "
                   f"ollama pull {LLAVA_MODEL}"
        )

    return LLaVAResponse(description=description, model_used=LLAVA_MODEL)


@app.get("/health")
async def health():
    # Verifica se Ollama está respondendo
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            ollama_status = "ok" if resp.status_code == 200 else "degraded"
    except Exception:
        ollama_status = "unreachable"

    return {
        "status": "ok" if ollama_status == "ok" else "degraded",
        "service": "llava-real",
        "ollama": ollama_status,
        "ollama_url": OLLAMA_URL,
        "model": LLAVA_MODEL,
    }
