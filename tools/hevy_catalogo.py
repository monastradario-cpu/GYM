"""Genera app/src/main/assets/www/js/hevycat.js: il catalogo esercizi unico di Coach = quello di Hevy.
- HV: tutti gli esercizi di Hevy {id: [nome italiano, titolo Hevy, attrezzo, tipo, muscolo, secondari]}
- HV_OF: esercizio di Coach -> esercizio di Hevy (solo i "canonici": uno per esercizio Hevy)
- HV_ALIAS: vecchi id di Coach che diventano lo stesso esercizio del canonico
- HV_NAME: nome mostrato quando l'esercizio di Coach era solo simile (si usa il nome di Hevy)
- HV_CUSTOM: esercizi senza equivalente: in Hevy vengono creati come personalizzati
Fonti: tools/esercizi_coach.json (esercizi di data.js + exdb.js, rigenerabile), tools/hevy_esercizi.json (API Hevy), tools/hevy_abbinamenti.json, tools/hevy_it.json."""
import json, re, glob

W = "app/src/main/assets/www/js/"
hv = json.load(open("tools/hevy_esercizi.json"))
it = json.load(open("tools/hevy_it.json"))
mp = json.load(open("tools/hevy_abbinamenti.json"))
ex = {e["id"]: e for e in json.load(open("tools/esercizi_coach.json"))}
# abbinamenti aggiunti a mano (esercizi di Coach che non erano nella tabella)
mp.update({"camminata_contadino": {"hevy": "50C613D0", "tipo": "uguale"}, "slam_palla_medica": {"hevy": "F51D9080", "tipo": "uguale"}})
for i in ex:
    mp.setdefault(i, {"hevy": None, "tipo": "nessuno"})
HOME = {"corpo", "elastici", "kettlebell", "manubri"}
code = "".join(open(f).read() for f in glob.glob(W + "*.js") if not re.search(r"(exdb|figdesc|foto|ekmap|hevycat|anim)\.js$", f))
data = open(W + "data.js").read()

def rank(g):
    v = mp[g]
    return (0 if v["tipo"] == "uguale" else 1, 0 if re.search(r"['\"]" + re.escape(g) + r"['\"]", code) else 1,
            0 if f"E('{g}'" in data else 1, len(g))

groups = {}
for g, v in mp.items():
    if v["hevy"]:
        groups.setdefault(v["hevy"], []).append(g)
HV_OF, ALIAS, NAME = {}, {}, {}
for h, gs in groups.items():
    gs.sort(key=rank)
    c = gs[0]
    HV_OF[c] = h
    if mp[c]["tipo"] != "uguale":
        NAME[c] = it[h]
    for a in gs[1:]:
        # stesso esercizio solo se resta fattibile negli stessi posti (casa/palestra) e con lo stesso tipo (a tempo o a ripetizioni);
        # altrimenti diventa un esercizio personalizzato in Hevy (per esempio il pull through con elastico per chi si allena a casa)
        if (ex[a]["eq"] in HOME) != (ex[c]["eq"] in HOME) or (ex[a]["type"] == "time") != (ex[c]["type"] == "time"):
            mp[a] = {"hevy": None, "tipo": "nessuno"}
        else:
            ALIAS[a] = c
CUSTOM = sorted(g for g, v in mp.items() if not v["hevy"])
HV = {x["id"]: [it.get(x["id"], x["title"]), x["title"], x["equipment"], x["type"], x["primary_muscle_group"], x["secondary_muscle_groups"]]
      for x in hv if not x["is_custom"]}
js = ("/* Coach — generato da tools/hevy_catalogo.py: catalogo esercizi unico con Hevy. Non modificare a mano. */\n'use strict';\n"
      + "const HV = " + json.dumps(HV, ensure_ascii=False, separators=(",", ":")) + ";\n"
      + "const HV_OF = " + json.dumps(HV_OF, separators=(",", ":")) + ";\n"
      + "const HV_ALIAS = " + json.dumps(ALIAS, separators=(",", ":")) + ";\n"
      + "const HV_NAME = " + json.dumps(NAME, ensure_ascii=False, separators=(",", ":")) + ";\n"
      + "const HV_CUSTOM = " + json.dumps(CUSTOM, separators=(",", ":")) + ";\n")
open(W + "hevycat.js", "w").write(js)
print(f"Hevy {len(HV)}, canonici {len(HV_OF)}, alias {len(ALIAS)}, nomi da Hevy {len(NAME)}, personalizzati {len(CUSTOM)}")
