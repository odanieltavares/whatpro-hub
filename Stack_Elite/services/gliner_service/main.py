"""
GLiNER Service — Stub FastAPI
Extração de entidades com GLiNER Zero-Shot.
Em produção: carrega o modelo urchade/gliner_multi-v2.1
Em stub: retorna entidades parseadas por regex simples para testes.
"""
from fastapi import FastAPI
from pydantic import BaseModel
import re, random

app = FastAPI(title="GLiNER Service", version="1.0.0")


class ExtractRequest(BaseModel):
    text: str
    labels: list[str] = ["INTENCAO", "VEICULO_INTERESSE", "VEICULO_TROCA", "ORCAMENTO", "CONDICAO_VEICULO"]
    threshold: float = 0.5


class ExtractResponse(BaseModel):
    entities: dict
    confidence: float
    source: str = "stub"


# Mapeamentos heurísticos simples para o stub
INTENT_KEYWORDS = {
    "COMPRA_0KM":    ["0km", "zero km", "novo", "lançamento"],
    "SEMINOVO":      ["seminovo", "usado", "segunda mão", "km rodado"],
    "TROCA":         ["troca", "retoma", "meu carro", "dar entrada com"],
    "SIMULACAO_FINANCIAMENTO": ["financiamento", "parcela", "crédito", "entrada"],
    "CONSULTA_PRECO": ["quanto", "valor", "preço", "custo"],
    "AGENDAMENTO":   ["visita", "ver pessoal", "ir até", "agendar"],
}

BUDGET_PATTERN = re.compile(
    r"(até|por volta de|em torno de|máximo|limite)\s*R?\$?\s*(\d[\d.,]*)\s*(mil|k)?",
    re.IGNORECASE
)

VEHICLE_PATTERN = re.compile(
    r"(Corolla|HB20|Onix|Polo|T-Cross|Compass|Tracker|Cruze|Kwid|Pulse|Argo|Cronos|Creta|Tucson|Renegade|Jeep|Toyota|Hyundai|Chevrolet|Volkswagen|Fiat|Renault|Ford|Honda|Citroën|Peugeot|Nissan|Caoa|RAM)",
    re.IGNORECASE
)


def detect_intent(text: str) -> str:
    lower = text.lower()
    for intent, keys in INTENT_KEYWORDS.items():
        if any(k in lower for k in keys):
            return intent
    return "CONSULTA_GERAL"


def extract_budget(text: str) -> str | None:
    m = BUDGET_PATTERN.search(text)
    if not m:
        return None
    val = m.group(2).replace(".", "").replace(",", "")
    suffix = " mil" if m.group(3) else ""
    return f"R$ {val}{suffix}"


@app.post("/extract", response_model=ExtractResponse)
def extract_entities(req: ExtractRequest):
    entities: dict = {}

    if "INTENCAO" in req.labels:
        entities["INTENCAO"] = detect_intent(req.text)

    if "VEICULO_INTERESSE" in req.labels:
        cars = VEHICLE_PATTERN.findall(req.text)
        if cars:
            entities["VEICULO_INTERESSE"] = cars[0]

    if "VEICULO_TROCA" in req.labels:
        troca_match = re.search(r"(troca|retoma|dar meu)\s+(.{3,40})", req.text, re.IGNORECASE)
        if troca_match:
            entities["VEICULO_TROCA"] = troca_match.group(2).strip()

    if "ORCAMENTO" in req.labels:
        budget = extract_budget(req.text)
        if budget:
            entities["ORCAMENTO"] = budget

    return ExtractResponse(
        entities=entities,
        confidence=round(random.uniform(0.75, 0.97), 2),
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "gliner-stub"}
