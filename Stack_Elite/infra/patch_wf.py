import requests
import json

URL = "http://localhost:5678/api/v1/workflows/JHRu9B936F8SzfNG"
HEADERS = {
    "X-N8N-API-KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzN2U4OTE4MS0yMzczLTQyNGEtODk5Mi1kZWYwYTU5NzRlMDQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNzc4Y2UzNjgtNzU2Yi00MDE5LWJkMjYtMjc2MzUzNDY2MzMyIiwiaWF0IjoxNzcyMDQ4NTkwfQ.5w_vY3Uehs9NRWzaFmjrM3sSc6TcaNLAuR-dueV725g",
    "Content-Type": "application/json"
}

resp = requests.get(URL, headers=HEADERS)
wf = resp.json()

# remove a dependencia da credencial e bota hardcode string (apenas pra teste rapido)
# mas n8n-nodes-base.postgres PRECISA de credencial na V1
# Vamos tentar setar as tags ssh falsas só pro n8n parar de reclamar:
cred_payload = {
    "name": "ElitePostgres",
    "type": "postgres",
    "data": {
        "host": "elite_postgres",
        "database": "elite_sdr_db",
        "user": "elite_admin",
        "password": "ultra_secure_elite_pass",
        "port": 5432,
        "ssl": "disable"
    }
}
# n8n postgres credential creation via API is notoriously buggy due to strict internal schemas from ssh node.
