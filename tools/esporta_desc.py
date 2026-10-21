"""Scrive app/src/main/assets/www/js/figdesc.js dalle figure e dalle descrizioni generate.

- FIGS: esercizi che hanno entrambe le figure (inizio e fine)
- FIGDESC: passaggi ed errori in italiano ricavati dalle istruzioni originali, usati al posto
  dei testi generici per gli esercizi del database esteso (quelli principali hanno testi scritti a mano).
"""
import json
import re
import os

OUT = "app/src/main/assets/www/fig"
desc = json.load(open("tools/pose_desc.json")) if os.path.exists("tools/pose_desc.json") else {}
spec = json.load(open("tools/figure_spec.json"))
figs = sorted(s["id"] for s in spec
              if os.path.exists(f"{OUT}/{s['id']}-1.webp") and os.path.exists(f"{OUT}/{s['id']}-2.webp"))
fd = {}
# miti da non insegnare: le ginocchia oltre le punte dei piedi non sono un errore di per sé
MITI = re.compile(r"(ginocchi\w*).{0,40}(supera|oltre|davanti).{0,20}(punt|dita)", re.I)
for k, d in desc.items():
    st, er = d.get("steps_it"), d.get("errors_it")
    if isinstance(st, list) and len(st) >= 3:
        fd[k] = {"s": [str(x).strip() for x in st][:5], "e": [str(x).strip() for x in (er or []) if not MITI.search(str(x))][:3]}

js = ("/* GYM — generato da tools/esporta_desc.py: figure anatomiche disponibili e testi di esecuzione\n"
      "   ricavati dalle istruzioni di free-exercise-db (pubblico dominio). Non modificare a mano. */\n"
      "'use strict';\n"
      f"const FIGS = new Set({json.dumps(figs)});\n"
      f"const FIGDESC = {json.dumps(fd, ensure_ascii=False)};\n"
      "(function () {\n"
      "  Object.keys(FIGDESC).forEach(id => {\n"
      "    const e = EX[id], d = FIGDESC[id]; if (!e || e.core) return;\n"
      "    e.steps = d.s; if (d.e.length) e.err = d.e;\n"
      "  });\n"
      "})();\n")
open("app/src/main/assets/www/js/figdesc.js", "w").write(js)
# elenco letto dall'app online: le figure nuove arrivano senza installare una nuova versione
json.dump(figs, open(f"{OUT}/index.json", "w"))
print(f"figdesc.js: {len(figs)} esercizi con figure, {len(fd)} con testi")
