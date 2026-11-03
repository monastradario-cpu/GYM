"""Scarica l'elenco degli esercizi di Hevy (API ufficiale, serve Hevy Pro) in tools/hevy_esercizi.json.
La chiave arriva solo dal segreto HEVY_API_KEY: non viene mai scritta nei file."""
import json, os, sys, time, urllib.request, urllib.error

KEY = os.environ.get("HEVY_API_KEY", "").strip()
if not KEY:
    sys.exit("Manca il segreto HEVY_API_KEY")
out, page, pages = [], 1, 1
while page <= pages:
    req = urllib.request.Request(f"https://api.hevyapp.com/v1/exercise_templates?page={page}&pageSize=100",
                                 headers={"api-key": KEY, "accept": "application/json"})
    for t in range(4):
        try:
            d = json.load(urllib.request.urlopen(req, timeout=30)); break
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="ignore")[:300]
            if e.code in (401, 403):
                sys.exit(f"Chiave Hevy rifiutata ({e.code}): {msg}")
            if t == 3: sys.exit(f"Errore Hevy {e.code}: {msg}")
            time.sleep(5)
    pages = d.get("page_count", 1)
    out += [{k: x.get(k) for k in ("id", "title", "type", "primary_muscle_group", "secondary_muscle_groups", "equipment", "is_custom")}
            for x in d.get("exercise_templates", [])]
    page += 1
json.dump(out, open("tools/hevy_esercizi.json", "w"), indent=0, ensure_ascii=False)
print(f"Esercizi Hevy scaricati: {len(out)} ({sum(1 for x in out if x['is_custom'])} personalizzati)")
