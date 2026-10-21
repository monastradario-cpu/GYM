"""GYM — genera con VideoDB le figure anatomiche di tutti gli esercizi.

Fase 1: per ogni esercizio un testo che descrive allestimento, posizione iniziale e finale,
        ricavato dalle istruzioni (free-exercise-db / app) e dalle schede macchinari.
        Salvato in tools/pose_desc.json (riusato nelle esecuzioni successive).
Fase 2: due immagini per esercizio (inizio e fine) con lo stesso omino e lo stesso attrezzo,
        salvate in app/src/main/assets/www/fig/<id>-1.webp e -2.webp.
Riprende da dove si era fermata: salta ciò che esiste già. Fa commit a lotti.
Variabili: VIDEO_DB_API_KEY (secret), QUANTI (max esercizi da fare, 0 = tutti), SOLO (id separati da virgola).
"""
import io
import json
import os
import re
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import zlib
from concurrent.futures import ThreadPoolExecutor, as_completed

import videodb
from PIL import Image

SPEC = json.load(open("tools/figure_spec.json"))
DESC_F = "tools/pose_desc.json"
OUT = "app/src/main/assets/www/fig"
os.makedirs(OUT, exist_ok=True)
DESC = json.load(open(DESC_F)) if os.path.exists(DESC_F) else {}
QUANTI = int(os.environ.get("QUANTI") or 0)
RIFAI = os.environ.get("RIFAI") == "1"
SOLO_TESTI = os.environ.get("SOLO_TESTI") == "1"
SOLO = [s.strip() for s in (os.environ.get("SOLO") or "").split(",") if s.strip()]
THREADS = int(os.environ.get("THREADS") or 4)
LOCK = threading.Lock()
STOP = threading.Event()
LOG = {"ok": [], "errori": {}}

MUSCOLI = {"petto": "pectoral muscles", "dorso": "latissimus dorsi, rhomboids and lower back", "spalle": "deltoids",
           "bicipiti": "biceps", "tricipiti": "triceps", "addome": "abdominal muscles and obliques",
           "quadricipiti": "quadriceps", "femorali": "hamstrings", "glutei": "gluteal muscles",
           "polpacci": "calf muscles", "avambracci": "forearm muscles", "collo": "neck muscles"}

PERSONAGGIO = ("the same athletic adult male anatomical figure used in every image: realistic proportions, "
               "short dark hair, calm neutral face, skin rendered as a smooth light grey anatomical surface "
               "showing every muscle with subtle shading and fine fibre lines, plain dark grey athletic shorts, barefoot")
STILE = ("Clean medical-anatomy illustration in the style of a premium fitness app. Soft even studio light, "
         "gentle ambient occlusion. Gym equipment drawn in matte charcoal black steel with dark grey padding. "
         "Plain pure white background, the whole figure and the whole equipment fully inside the frame with a generous "
         "margin, centered, static camera at chest height. No text, no labels, no arrows, no watermark, no logos.")
QUOTA = re.compile(r"credit|quota exceeded|insufficient|balance|payment required|upgrade|maximum limit|current plan|daily free allocation|neurons|4006|capacity exceeded", re.I)
RATE = re.compile(r"rate|429|too many|throttl", re.I)


_cf = os.environ.get("CF_ACCOUNT_ID", "")
# accetta anche l'indirizzo intero della dashboard: prende solo il codice di 32 caratteri
CF_ID = (re.search(r"[0-9a-f]{32}", _cf.lower()) or re.search(r".*", _cf.strip())).group(0)
CF_TOKEN = os.environ.get("CF_API_TOKEN", "").strip()
CF_MODEL = "@cf/black-forest-labs/flux-1-schnell"


def conn():
    return videodb.connect()


def cf_image(prompt, seed):
    """Cloudflare Workers AI (FLUX.1 schnell): restituisce i byte dell'immagine. Piano gratuito: 10.000 neuroni al giorno."""
    import base64
    body = json.dumps({"prompt": prompt[:2000], "steps": 6}).encode()
    req = urllib.request.Request(f"https://api.cloudflare.com/client/v4/accounts/{CF_ID}/ai/run/{CF_MODEL}", data=body,
                                 headers={"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            res = json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read()[:300]!r}")
    if not res.get("success", True) or not (res.get("result") or {}).get("image"):
        raise RuntimeError(str(res.get("errors") or res)[:300])
    return base64.b64decode(res["result"]["image"])


def scarica(url):
    with urllib.request.urlopen(url, timeout=120) as r:
        return r.read()


def salva_webp(data, path):
    im = Image.open(io.BytesIO(data)).convert("RGB")
    im.thumbnail((640, 640))
    im.save(path, "WEBP", quality=72, method=6)


def git_commit(msg):
    subprocess.run([sys.executable, "tools/esporta_desc.py"], check=False)
    subprocess.run(["git", "add", OUT, DESC_F, "tools/esito_figure.json", "app/src/main/assets/www/js/figdesc.js"], check=False)
    if subprocess.run(["git", "diff", "--cached", "--quiet"]).returncode == 0:
        return
    subprocess.run(["git", "commit", "-q", "-m", msg + " [skip ci]"], check=False)
    for _ in range(3):
        subprocess.run(["git", "pull", "-q", "--rebase", "origin", "main"], check=False)
        if subprocess.run(["git", "push", "-q", "origin", "HEAD:main"]).returncode == 0:
            return
        time.sleep(5)


# ---------------- fase 1: descrizioni delle pose ----------------
PROMPT_DESC = """You are an expert strength coach and medical illustrator. For each gym exercise below write precise
visual directions for an illustrator who must draw the CORRECT execution in two frames.
Use the instructions and machine notes as the source of truth for the correct movement and equipment.
Return ONLY a JSON object mapping each exercise id to an object with these string fields:
- "view": "side view" or "front view" or "three-quarter front view" (the angle where the movement is clearest; prefer the given hint)
- "setup": the equipment and how the body is placed on it, identical for both frames, max 45 words, concrete
  (bench angle, seat, pads, cable height, grip, foot position). Never mention text or labels.
- "start": exact body position at the START of the rep: joint angles of hips, knees, elbows, shoulders, torso angle,
  where the hands and the load are. Max 45 words.
- "end": exact body position at the END of the concentric phase (or the other extreme for stretches/isometrics). Max 45 words.
- "muscles": the main working muscles in plain anatomical English, max 8 words.
- "start_img" and "end_img": a short image-generation caption (max 35 words) for each frame, written in plain visual
  words a painter understands, NOT angles in degrees. It must start with the body position and say exactly where the
  hands, arms, legs and the weight are (e.g. "standing upright holding the barbell in both hands at mid-thigh, arms straight",
  "both arms raised straight out to the sides at shoulder height, dumbbells in hands, body forming a T").
  The two captions must clearly differ so the movement is visible.
- "steps_it": 4 short steps in Italian (imperative, max 18 words each) describing the correct execution,
  faithful to the instructions; "errors_it": 2 common mistakes in Italian (max 12 words each).
Exercises:
"""


def fase1(c, todo):
    coll = c.get_collection()
    mancanti = [s for s in todo if "start_img" not in DESC.get(s["id"], {})]
    print(f"Fase 1: {len(mancanti)} descrizioni da scrivere", flush=True)
    for i in range(0, len(mancanti), 8):
        if STOP.is_set():
            return
        lotto = mancanti[i:i + 8]
        testo = PROMPT_DESC + json.dumps([{
            "id": s["id"], "name": s["en"] or s["it"], "italian_name": s["it"], "equipment": s["attrezzo"],
            "machine_notes": s["macchina"], "instructions": s["instr"], "view_hint": s["vista"] + " view",
            "primary_muscle": MUSCOLI.get(s["m"], s["m"])} for s in lotto], ensure_ascii=False)
        for tent in range(3):
            try:
                r = coll.generate_text(prompt=testo, model_name="pro", response_type="json")
                out = r.get("output") if isinstance(r, dict) else r
                if isinstance(out, str):
                    out = json.loads(re.sub(r"^```(json)?|```$", "", out.strip(), flags=re.M))
                for s in lotto:
                    d = out.get(s["id"]) if isinstance(out, dict) else None
                    if d and all(k in d for k in ("setup", "start_img", "end_img")):
                        DESC[s["id"]] = d
                break
            except Exception as e:  # noqa: BLE001
                print("descrizioni errore:", e, flush=True)
                if QUOTA.search(str(e)):
                    STOP.set()
                    LOG["fermato"] = f"fase 1: {e}"
                    return
                time.sleep(10)
        json.dump(DESC, open(DESC_F, "w"), ensure_ascii=False, indent=0)
        print(f"  descrizioni {min(i + 8, len(mancanti))}/{len(mancanti)}", flush=True)
        if (i // 8) % 10 == 9:
            git_commit(f"Testi esecuzione: {len(DESC)} esercizi")


# ---------------- fase 2: immagini ----------------
def prompt_img(s, d, fase):
    pos = d["start_img"] if fase == 1 else d["end_img"]
    sec = ", ".join(MUSCOLI.get(m, m) for m in s["s"][:3])
    return (f"{d.get('view', 'side view').capitalize()} of an athletic anatomical man {pos.rstrip('.')}. "
            f"He is using {d['setup']} This is the only equipment in the picture, nothing else around him. "
            f"Style: {PERSONAGGIO}. The working muscles ({d.get('muscles') or MUSCOLI.get(s['m'], s['m'])}) are tinted "
            f"a strong warm coral red" + (f", the assisting muscles ({sec}) a lighter salmon pink" if sec else "")
            + f"; all other muscles stay light grey. {STILE}")


TL = threading.local()


def fai(s):
    if STOP.is_set():
        return
    d = DESC.get(s["id"])
    if not d:
        return
    if not CF_ID and not hasattr(TL, "coll"):
        TL.coll = conn().get_collection()
    for fase in (1, 2):
        path = f"{OUT}/{s['id']}-{fase}.webp"
        if os.path.exists(path):
            continue
        for tent in range(5):
            if STOP.is_set():
                return
            try:
                if CF_ID:
                    # stesso seme per inizio e fine: omino e attrezzo restano più simili tra le due figure
                    salva_webp(cf_image(prompt_img(s, d, fase), zlib.crc32(s["id"].encode()) % 2147483647), path)
                else:
                    img = TL.coll.generate_image(prompt=prompt_img(s, d, fase), aspect_ratio="1:1")
                    salva_webp(scarica(img.generate_url()), path)
                break
            except Exception as e:  # noqa: BLE001
                msg = str(e)
                print(f"  {s['id']}-{fase} errore: {msg[:200]}", flush=True)
                with LOCK:
                    LOG.setdefault("messaggi", []).append(f"{s['id']}-{fase}: {msg[:200]}")
                if QUOTA.search(msg) and not RATE.search(msg):
                    STOP.set()
                    LOG["fermato"] = msg[:300]
                    return
                time.sleep((60 if RATE.search(msg) else 15) * (tent + 1))
        else:
            with LOCK:
                LOG["errori"][s["id"]] = "immagine non generata"
            return
    with LOCK:
        LOG["ok"].append(s["id"])


def main():
    todo = [s for s in SPEC if (not SOLO or s["id"] in SOLO)]
    if RIFAI:
        for s in todo:
            for f in (1, 2):
                if os.path.exists(f"{OUT}/{s['id']}-{f}.webp"):
                    os.remove(f"{OUT}/{s['id']}-{f}.webp")
    if SOLO_TESTI:
        todo = [s for s in todo if "steps_it" not in DESC.get(s["id"], {})]
    else:
        todo = [s for s in todo if not (os.path.exists(f"{OUT}/{s['id']}-1.webp") and os.path.exists(f"{OUT}/{s['id']}-2.webp"))]
    if QUANTI:
        todo = todo[:QUANTI]
    print(f"Esercizi da fare: {len(todo)}", flush=True)
    c = conn()
    fase1(c, todo)
    git_commit("Figure: descrizioni delle pose")
    if SOLO_TESTI:
        LOG["descrizioni"] = f"{sum(1 for v in DESC.values() if 'steps_it' in v)}/{len(SPEC)}"
        json.dump(LOG, open("tools/esito_figure.json", "w"), indent=1, ensure_ascii=False)
        git_commit("Testi esecuzione: descrizioni da fonti")
        return
    fatti = 0
    with ThreadPoolExecutor(THREADS) as ex:
        futs = [ex.submit(fai, s) for s in todo]
        for f in as_completed(futs):
            f.result()
            fatti += 1
            if fatti % 30 == 0:
                print(f"Immagini: {fatti}/{len(todo)} esercizi", flush=True)
                with LOCK:
                    git_commit(f"Figure: {len(os.listdir(OUT)) // 2} esercizi disegnati")
    git_commit(f"Figure: {len(os.listdir(OUT)) // 2} esercizi disegnati")
    tot = sum(1 for s in SPEC if os.path.exists(f"{OUT}/{s['id']}-2.webp"))
    LOG["totale_con_figure"] = f"{tot}/{len(SPEC)}"
    json.dump(LOG, open("tools/esito_figure.json", "w"), indent=1, ensure_ascii=False)
    subprocess.run(["git", "add", "tools/esito_figure.json"], check=False)
    git_commit("Figure: esito")
    print(json.dumps({k: (v if not isinstance(v, list) else len(v)) for k, v in LOG.items()}, ensure_ascii=False)[:2000])
    if "fermato" in LOG:
        print("::warning::Generazione fermata: " + LOG["fermato"])


if __name__ == "__main__":
    main()
