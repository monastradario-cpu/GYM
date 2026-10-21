"""Prova di Cloudflare Workers AI su pochi esercizi: salva le figure in anteprima/ senza toccare il repo."""
import json, os, sys, zlib
sys.path.insert(0, "tools")
import genera_tutte as G
os.makedirs("anteprima", exist_ok=True)
ids = (os.environ.get("SOLO") or "").split(",")
esito = {}
for s in G.SPEC:
    if s["id"] not in ids:
        continue
    d = G.DESC.get(s["id"])
    if not d:
        esito[s["id"]] = "manca la descrizione"; continue
    for f in (1, 2):
        try:
            for t in range(3):
                data = G.cf_image(G.prompt_img(s, d, f), 0)
                ok = G.cf_check(data, d["start_img"] if f == 1 else d["end_img"], s["en"] or s["it"])
                G.salva_webp(data, f"anteprima/{s['id']}-{f}-t{t + 1}{'' if ok else '-NO'}.webp")
                if ok:
                    break
            esito[f"{s['id']}-{f}"] = "ok" if ok else "scartata 3 volte"
        except Exception as e:
            esito[f"{s['id']}-{f}"] = str(e)[:300]
        print(s["id"], f, esito.get(f"{s['id']}-{f}"), flush=True)
json.dump(esito, open("anteprima/esito.json", "w"), indent=1)
if not any(v == "ok" for v in esito.values()):
    sys.exit("Nessuna immagine: " + json.dumps(esito)[:500])
