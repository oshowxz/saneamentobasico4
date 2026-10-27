"""Lê dados/Saneamento_Sinop_dados_ORIGINAL.xlsx e gera js/dados.js.

Uso (na raiz do projeto):  python scripts/gerar_dados.py
Precisa do pacote openpyxl:  pip install openpyxl
"""
import datetime
import json
import sys
from pathlib import Path

import openpyxl

RAIZ = Path(__file__).resolve().parent.parent
XLSX = RAIZ / "dados" / "Saneamento_Sinop_dados_ORIGINAL.xlsx"
SAIDA = RAIZ / "js" / "dados.js"


def linhas(ws):
    it = ws.iter_rows(values_only=True)
    cab = [str(c) for c in next(it)]
    for r in it:
        if all(c is None for c in r):
            continue
        yield dict(zip(cab, r))


def partes(txt, sep):
    return [p.strip() for p in str(txt).split(sep)] if txt else []


def numero(r, chave):
    v = r.get(chave)
    return float(v) if isinstance(v, (int, float)) else None


wb = openpyxl.load_workbook(XLSX, data_only=False)

bairros = []
for r in linhas(wb["Bairros"]):
    fontes = partes(r["esgoto_fonte"], " + ")
    refs = partes(r["esgoto_ref"], " + ")
    urls = partes(r["esgoto_url"], " | ")
    if not (len(fontes) == len(refs) == len(urls)):
        sys.exit("Fontes, datas e links com tamanhos diferentes em: " + str(r["bairro"]))
    bairros.append({
        "bairro": r["bairro"],
        "busca": partes(r["nome_busca"], "|"),
        "esgoto": r["esgoto_rede"],
        "obras2026": r["obras_2026"] == "sim",
        "fontes": [{"nome": f, "data": d, "url": u} for f, d, u in zip(fontes, refs, urls)],
        "obs": r["observacao"],
        "agua_pct": numero(r, "agua_pct"),
        "esgoto_pct": numero(r, "esgoto_pct"),
        "lixo_pct": numero(r, "lixo_pct"),
        "pct_ano": r.get("pct_ano"),
        "pct_fonte": r.get("pct_fonte"),
    })

indicadores = [
    {
        "id": r["id"], "descricao": r["descricao"], "valor": r["valor"],
        "unidade": r["unidade"], "ref": str(r["referencia"]),
        "fonte": r["fonte"], "url": r["url"],
    }
    for r in linhas(wb["Indicadores"])
]

fontes = [
    {"nome": r["Fonte"], "data": r["Data de referência"], "uso": r["Usada em"], "url": r["Link"]}
    for r in linhas(wb["Fontes"])
]

dados = {
    "gerado": datetime.date.today().isoformat(),
    "bairros": bairros,
    "indicadores": indicadores,
    "fontes": fontes,
}
SAIDA.write_text(
    "/* Gerado por scripts/gerar_dados.py. Não edite à mão. */\nwindow.DADOS = "
    + json.dumps(dados, ensure_ascii=False, indent=1) + ";\n",
    encoding="utf-8",
)
print(f"{len(bairros)} bairros, {len(indicadores)} indicadores, {len(fontes)} fontes -> {SAIDA}")
