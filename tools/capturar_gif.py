"""
Captura prints reais do Lanterna Submersa e monta um GIF para divulgação.

Como usar (no seu computador, na pasta do projeto):
  1) npm run build
  2) npm run preview            (deixe rodando; anote a porta, normalmente 4173)
  3) em outro terminal:
       pip install playwright pillow
       python -m playwright install chromium
       python tools/capturar_gif.py --url http://localhost:4173

Saída:
  tools/capturas/*.png   um print por tela
  tools/lanterna.gif     GIF com menu, mapa e uma fase de cada ato

O script abre cada fase definindo o progresso salvo no navegador (chave lanterna-submersa:save),
então não é preciso jogar tudo para chegar nas fases do Ato V.
"""
import argparse
import json
import re
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
DADOS = ROOT.parent / "src" / "phases" / "data.ts"
SAIDA = ROOT / "capturas"
KEY = "lanterna-submersa:save"
# Galaxy S20 FE, em CSS pixels e escala de tela
VIEWPORT = {"width": 412, "height": 915}
ESCALA = 2


def ids_das_fases():
    texto = DADOS.read_text(encoding="utf-8")
    return re.findall(r'\{ id: "([a-z0-9]+)"', texto)


def progresso(ids, atual):
    return {
        "version": 2,
        "current": atual,
        "completed": ids,
        "inventory": [],
        "estrelas": {i: 3 for i in ids},
        "melhorTempo": {},
        "conquistas": [],
        "recordeInfinito": 0,
    }


def capturar(url, nome, atual, ids, pagina_ctx):
    pagina = pagina_ctx.new_page()
    valor = json.dumps(json.dumps(progresso(ids, atual)))
    pagina.add_init_script(f"localStorage.setItem({json.dumps(KEY)}, {valor});")
    pagina.goto(url, wait_until="networkidle")
    pagina.wait_for_timeout(1500)
    arquivo = SAIDA / f"{nome}.png"
    pagina.screenshot(path=str(arquivo))
    pagina.close()
    return arquivo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:4173")
    args = ap.parse_args()
    SAIDA.mkdir(parents=True, exist_ok=True)
    ids = ids_das_fases()
    print(f"{len(ids)} fases encontradas")

    # telas de apoio: menu (sem fase atual) e uma fase de cada ato
    roteiro = [("menu", None), ("cais", "cais"), ("sombra", "sombra"), ("viciosa", "viciosa"),
               ("alturas", "alturas"), ("travessia", "travessia"), ("bussola", "bussola"),
               ("cores", "cores"), ("mosaico", "mosaico"), ("volta", "volta")]
    arquivos = []
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        ctx = navegador.new_context(viewport=VIEWPORT, device_scale_factor=ESCALA)
        for nome, atual in roteiro:
            if atual is not None and atual not in ids:
                print(f"pulando {nome}: id não encontrado")
                continue
            arquivos.append(capturar(args.url, nome, atual, ids, ctx))
            print(f"capturado: {nome}")
        navegador.close()

    frames = [Image.open(a).convert("RGB") for a in arquivos]
    frames = [f.resize((412, 915)) for f in frames]
    if frames:
        frames[0].save(ROOT / "lanterna.gif", save_all=True, append_images=frames[1:],
                       duration=1800, loop=0, optimize=True)
        print(f"GIF salvo em {ROOT / 'lanterna.gif'}")


if __name__ == "__main__":
    main()
