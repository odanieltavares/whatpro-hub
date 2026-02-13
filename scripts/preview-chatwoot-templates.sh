#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PREVIEW_DIR="$ROOT_DIR/deploy/docker/templates/previews"
ACTIVE_FILE="$ROOT_DIR/deploy/docker/templates/ACTIVE_SET"
SETS_DIR="$ROOT_DIR/deploy/docker/templates/sets"
DEFAULTS_DIR="$ROOT_DIR/deploy/docker/templates/defaults"
INDEX_FILE="$PREVIEW_DIR/index.html"

mkdir -p "$PREVIEW_DIR"
rm -rf "$PREVIEW_DIR"/*

ACTIVE_SET="(none)"
if [ -f "$ACTIVE_FILE" ]; then
  ACTIVE_SET=$(cat "$ACTIVE_FILE")
fi

CHATWOOT_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E 'chatwoot.*app' | head -n 1 || true)
if [ -n "$CHATWOOT_CONTAINER" ]; then
  rm -rf "$DEFAULTS_DIR"
  mkdir -p "$DEFAULTS_DIR"
  docker exec "$CHATWOOT_CONTAINER" tar -C /app/app/views -cf - devise/mailer mailers 2>/dev/null | tar -C "$DEFAULTS_DIR" -xf - 2>/dev/null || true
fi

PREVIEW_DIR="$PREVIEW_DIR" ACTIVE_SET="$ACTIVE_SET" SETS_DIR="$SETS_DIR" DEFAULTS_DIR="$DEFAULTS_DIR" INDEX_FILE="$INDEX_FILE" python3 - <<'PY'
import os
from pathlib import Path
import html
from datetime import datetime

previews_dir = Path(os.environ["PREVIEW_DIR"])
sets_dir = Path(os.environ["SETS_DIR"])
defaults_dir = Path(os.environ["DEFAULTS_DIR"])
index_file = Path(os.environ["INDEX_FILE"])
active_set = os.environ.get("ACTIVE_SET", "(none)")
previews_dir.mkdir(parents=True, exist_ok=True)
now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

def render_template(text: str) -> str:
    text = text.replace("<%= @resource.email %>", "user@whatpro.com")
    text = text.replace("<%= edit_password_url(@resource, reset_password_token: @token) %>", "https://example.com/reset")
    text = text.replace("<%= confirmation_url(@resource, confirmation_token: @token) %>", "https://example.com/confirm")
    text = text.replace("<%= unlock_url(@resource, unlock_token: @token) %>", "https://example.com/unlock")
    import re
    text = re.sub(r"<%=?[^%]*%>", "#", text)
    return text

def write_preview_file(out_path: Path, body_html: str) -> None:
    out_path.write_text(
        f"<!doctype html><html><head><meta charset='utf-8'><title>{out_path.name}</title></head><body>{body_html}</body></html>"
    )

def load_templates(base_dir: Path, kind: str):
    entries = []
    if not base_dir.exists():
        return entries
    if kind == "mailer":
        for src_path in sorted(base_dir.glob("*.erb")):
            base = src_path.name.replace(".html.erb", "")
            entries.append(("Devise Mailer", base, src_path))
    else:
        for src_path in sorted(base_dir.rglob("*")):
            if not src_path.is_file():
                continue
            rel = src_path.relative_to(base_dir)
            base = str(rel).replace("/", "_")
            if src_path.suffix == ".liquid":
                entries.append(("Mailers Liquid", base, src_path))
            elif src_path.suffix == ".erb":
                entries.append(("Mailers ERB", base, src_path))
            else:
                entries.append(("Mailers Outros", base, src_path))
    return entries

for set_dir in sets_dir.iterdir() if sets_dir.exists() else []:
    if not set_dir.is_dir():
        continue
    name = set_dir.name
    out_dir = previews_dir / name
    out_dir.mkdir(parents=True, exist_ok=True)
    mailer = set_dir / "chatwoot_mailer"
    mailers = set_dir / "chatwoot_mailers"
    rendered = []
    for group, base, src_path in load_templates(mailer, "mailer"):
        out_name = f"{base}.html"
        html_out = render_template(src_path.read_text(errors="ignore"))
        (out_dir / out_name).write_text(html_out)
        rendered.append((group, base, out_name))
    for group, base, src_path in load_templates(mailers, "mailers"):
        out_name = f"{base}.html"
        raw = src_path.read_text(errors="ignore")
        if src_path.suffix == ".erb":
            html_out = render_template(raw)
        else:
            html_out = "<pre style='white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;'>" + html.escape(raw) + "</pre>"
        write_preview_file(out_dir / out_name, html_out)
        rendered.append((group, base, out_name))
    items_html = ""
    if rendered:
        groups = {}
        for group, base, out_name in rendered:
            groups.setdefault(group, []).append((base, out_name))
        for group, items in groups.items():
            items_html += f"<h3 style='margin:16px 0 8px'>{group}</h3>"
            items_html += "<div class='grid'>"
            for base, out_name in items:
                label = base.replace("_", " ")
                items_html += f"<div><div style='font-weight:600;margin-bottom:6px;'>{label}</div><iframe src='/{name}/{out_name}'></iframe></div>"
            items_html += "</div>"
    else:
        items_html = "<p>Nenhum template encontrado neste set.</p>"
    (out_dir / "index.html").write_text(f"""<!doctype html>
<html><head><meta charset="utf-8" />
<title>Preview - {name}</title>
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
<style>
body{{font-family:Arial,Helvetica,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#0f172a}}
.top{{display:flex;align-items:center;gap:12px;margin-bottom:16px}}
.btn{{display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:8px 12px;border-radius:8px;font-weight:600}}
.grid{{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));}}
iframe{{width:100%;height:260px;border:1px solid #e2e8f0;border-radius:8px}}
.card{{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px}}
</style></head><body>
<div class="top"><a class="btn" href="/">Voltar</a><h1 style="margin:0">Set: {name}</h1></div>
<div class="card">{items_html}</div>
<div style="margin-top:12px;color:#64748b;font-size:12px">Atualizado em {now}</div>
</body></html>""")

defaults_out = previews_dir / "defaults"
defaults_out.mkdir(parents=True, exist_ok=True)
default_entries = []
if defaults_dir.exists():
    for src in sorted(defaults_dir.rglob("*")):
        if not src.is_file():
            continue
        rel = src.relative_to(defaults_dir)
        name = str(rel).replace("/", "_")
        out_name = f"{name}.html"
        raw = src.read_text(errors="ignore")
        if src.suffix == ".erb":
            body = render_template(raw)
        else:
            body = "<pre style='white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;'>" + html.escape(raw) + "</pre>"
        (defaults_out / out_name).write_text(f"<!doctype html><html><head><meta charset='utf-8'><title>{rel}</title></head><body>{body}</body></html>")
        default_entries.append((str(rel), out_name))

defaults_index = "<p>Nenhum template padrão encontrado (container do Chatwoot não disponível).</p>"
types_html = "<p>Nenhum tipo encontrado.</p>"
if default_entries:
    items = "".join([f"<div><div style='font-weight:600;margin-bottom:6px;'>{name}</div><iframe src='/defaults/{out}'></iframe></div>" for name, out in default_entries])
    defaults_index = f"<div class='grid'>{items}</div>"
    groups = {}
    for name, _ in default_entries:
        key = name.split("/", 1)[0]
        groups.setdefault(key, 0)
        groups[key] += 1
    types_html = "<ul style='margin:8px 0 0 18px'>"
    for key, count in sorted(groups.items()):
        types_html += f"<li>{key}: {count}</li>"
    types_html += "</ul>"

(defaults_out / "index.html").write_text(f"""<!doctype html>
<html><head><meta charset="utf-8" />
<title>Padrões Chatwoot</title>
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
<style>
body{{font-family:Arial,Helvetica,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#0f172a}}
.top{{display:flex;align-items:center;gap:12px;margin-bottom:16px}}
.btn{{display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:8px 12px;border-radius:8px;font-weight:600}}
.grid{{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));}}
iframe{{width:100%;height:260px;border:1px solid #e2e8f0;border-radius:8px}}
.card{{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px}}
</style></head><body>
<div class="top"><a class="btn" href="/">Voltar</a><h1 style="margin:0">Padrões do Chatwoot (container)</h1></div>
<div class="card">{defaults_index}</div>
<div style="margin-top:12px;color:#64748b;font-size:12px">Atualizado em {now}</div>
</body></html>""")

index_file.write_text(f"""<!doctype html>
<html><head><meta charset="utf-8"><title>Chatwoot Email Preview</title>
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
<style>
body{{font-family:Arial,Helvetica,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#0f172a}}
.card{{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px}}
a{{color:#2563eb;text-decoration:none}}
.grid{{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
</style></head><body>
<h1>Chatwoot Email Preview</h1>
<div class="card"><strong>Set em uso:</strong> {active_set}</div>
<div class="card"><strong>Sets disponíveis:</strong><div class="grid">
{''.join([f"<div><a href='/{d.name}/'>{d.name}</a></div>" for d in previews_dir.iterdir() if d.is_dir()])}
</div></div>
<div class="card"><strong>Tipos disponíveis (padrões do Chatwoot):</strong>{types_html}</div>
<div class="card"><strong>Pré-visualizações:</strong>
<p>Abra um set para ver todos os tipos disponíveis.</p>
<p>Templates padrão do Chatwoot: <a href="/defaults/">/defaults/</a></p>
</div>
<div style="margin-top:12px;color:#64748b;font-size:12px">Atualizado em {now}</div>
</body></html>""")
PY

if [ "${PREVIEW_GENERATE_ONLY:-0}" = "1" ]; then
  exit 0
fi

cd "$PREVIEW_DIR"
PORT=${PORT:-8099}
python3 -m http.server "$PORT" --bind 0.0.0.0
