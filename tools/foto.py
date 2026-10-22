"""Copia nell'app le foto di inizio/fine degli esercizi da free-exercise-db (pubblico dominio, Unlicense).
Uso: python tools/foto.py <cartella free-exercise-db/exercises>
Abbinamento: tools/foto_match.json (database esteso, allineato per ordine) + tools/foto_core_map.py (esercizi principali)."""
import json
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from foto_core_map import CORE  # noqa: E402

SRC = sys.argv[1]
OUT = "app/src/main/assets/www/foto"
os.makedirs(OUT, exist_ok=True)
m = json.load(open("tools/foto_match.json"))
m.update(CORE)
fatti = []
for app_id, fid in sorted(m.items()):
    ok = True
    for i in (0, 1):
        p = os.path.join(SRC, fid, f"{i}.jpg")
        if not os.path.exists(p):
            ok = False
            break
        im = Image.open(p).convert("RGB")
        im.thumbnail((480, 480))
        im.save(f"{OUT}/{app_id}-{i + 1}.webp", "WEBP", quality=60, method=6)
    if ok:
        fatti.append(app_id)
js = ("/* GYM — generato da tools/foto.py: esercizi con foto di inizio e fine (free-exercise-db, pubblico dominio) */\n"
      "'use strict';\n"
      f"const FOTO = new Set({json.dumps(fatti)});\n")
open("app/src/main/assets/www/js/foto.js", "w").write(js)
print(len(fatti), "esercizi con foto")
