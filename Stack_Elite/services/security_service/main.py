"""
Security Service — Implementação Real
Presidio Analyzer + Anonymizer para mascaramento de PII em pt-BR.
Inclui detecção de spam via Textstat (legibilidade) + regras heurísticas.
"""
from fastapi import FastAPI
from pydantic import BaseModel
import os, re

app = FastAPI(title="Security Service", version="2.0.0")

# ── Presidio setup (lazy) ────────────────────────────────────────────────────

_analyzer = None
_anonymizer = None


def get_presidio():
    global _analyzer, _anonymizer
    if _analyzer is None:
        try:
            from presidio_analyzer import AnalyzerEngine
            from presidio_analyzer.nlp_engine import NlpEngineProvider
            from presidio_anonymizer import AnonymizerEngine

            print("[Security] Inicializando Presidio com suporte pt-BR...")

            # Usa modelo spaCy multilingual (pt_core_news_md) ou fallback en_core_web_lg
            nlp_config = {
                "nlp_engine_name": "spacy",
                "models": [
                    {"lang_code": "pt", "model_name": "pt_core_news_md"},
                ],
            }
            try:
                provider = NlpEngineProvider(nlp_configuration=nlp_config)
                nlp_engine = provider.create_engine()
                _analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["pt", "en"])
            except Exception:
                # Fallback sem modelo específico de pt
                _analyzer = AnalyzerEngine()
            
            _anonymizer = AnonymizerEngine()
            print("[Security] Presidio pronto!")
        except ImportError:
            raise RuntimeError("Instale: pip install presidio-analyzer presidio-anonymizer spacy && python -m spacy download pt_core_news_md")
    return _analyzer, _anonymizer


# ── Padrões extras BR que o Presidio não cobre nativamente ──────────────────

EXTRA_PII_RULES = [
    (re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b"), "CPF_REDACTED"),           # CPF
    (re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?0001-?\d{2}\b"), "CNPJ_REDACTED"),   # CNPJ
    (re.compile(r"\(?[1-9]{2}\)?[\s-]?9?\d{4}-?\d{4}"), "PHONE_BR_REDACTED"),   # Cel BR
    (re.compile(r"\b[A-Z]{3}\d[A-Z\d]\d{2}\b"), "PLATE_REDACTED"),              # Placa Mercosul
    (re.compile(r"\b[A-Z]{3}-?\d{4}\b"), "PLATE_REDACTED"),                      # Placa antiga
]

# ── Spam Detection ───────────────────────────────────────────────────────────

SPAM_PATTERNS = [
    re.compile(r"(clique aqui|acesse agora|promoção relâmpago|ganhe grátis|oferta exclusiva)", re.I),
    re.compile(r"(https?://\S+){3,}"),             # 3+ URLs = spam
    re.compile(r"[A-ZÁÉÍÓÚ]{10,}"),               # Caps lock = spam
    re.compile(r"(.)\1{5,}"),                       # Caracteres repetidos
]


class SpamRequest(BaseModel):
    text: str


class SpamResponse(BaseModel):
    is_spam: bool
    spam_score: float
    reason: str | None = None


@app.post("/spam-check", response_model=SpamResponse)
def check_spam(req: SpamRequest):
    score = 0.0
    reason = None

    if len(req.text.strip()) < 3:
        return SpamResponse(is_spam=True, spam_score=1.0, reason="mensagem muito curta")

    for pat in SPAM_PATTERNS:
        if pat.search(req.text):
            score = min(score + 0.35, 1.0)
            reason = f"padrão suspeito detectado"

    # Bonus legibilidade com textstat (opcional)
    try:
        import textstat
        textstat.set_lang("pt_BR")
        fk = textstat.flesch_reading_ease(req.text)
        # Textos de legibilidade extremamente alta (simples demais) podem ser spam
        if fk > 95 and len(req.text) < 50:
            score = min(score + 0.2, 1.0)
    except ImportError:
        pass  # textstat opcional

    return SpamResponse(is_spam=score > 0.7, spam_score=round(score, 3), reason=reason)


class PIIRequest(BaseModel):
    text: str
    language: str = "pt"


class PIIResponse(BaseModel):
    masked_text: str
    entities_found: list[str]


@app.post("/mask-pii", response_model=PIIResponse)
def mask_pii(req: PIIRequest):
    text = req.text
    found: list[str] = []

    # 1. Presidio (detecta PERSON, EMAIL, PHONE, etc.)
    try:
        analyzer, anonymizer = get_presidio()
        results = analyzer.analyze(text=text, language=req.language or "pt")
        if results:
            from presidio_anonymizer.entities import OperatorConfig
            anonymized = anonymizer.anonymize(
                text=text,
                analyzer_results=results,
                operators={"DEFAULT": OperatorConfig("replace", {"new_value": "<REDACTED>"})},
            )
            text = anonymized.text
            found.extend([r.entity_type for r in results])
    except Exception as e:
        # Presidio pode falhar no primeiro boot — aplica só as regex extras
        print(f"[Security] Presidio error (usando fallback regex): {e}")

    # 2. Padrões extras BR (CPF, CNPJ, Placa, etc.)
    for pattern, label in EXTRA_PII_RULES:
        if pattern.search(text):
            found.append(label.split("_")[0])
        text = pattern.sub(f"[{label}]", text)

    return PIIResponse(masked_text=text, entities_found=list(set(found)))


@app.get("/health")
def health():
    return {"status": "ok", "service": "security-real"}
