"""GYM — prova di figure anatomiche realistiche generate con VideoDB.

Gira solo in GitHub Actions (workflow "Genera figure (anteprima)"), con la chiave
nel secret VIDEO_DB_API_KEY. Scarica i risultati in anteprima/ e scrive un indice
HTML da guardare dal telefono. Non tocca l'app: serve solo per approvare lo stile.
"""
import json
import os
import sys
import time
import urllib.request

import videodb

OUT = "anteprima"
os.makedirs(OUT, exist_ok=True)

STILE = (
    "Clean medical-anatomy illustration in the style of a premium fitness app: "
    "an athletic adult male figure with realistic proportions, skin rendered as a smooth "
    "light grey anatomical surface showing every major muscle group with subtle shading "
    "and fine fibre lines. Soft even studio light from the front, gentle ambient occlusion "
    "between muscles. Plain pure white background, the whole body fully inside the frame "
    "with generous margin. No text, no labels, no watermark, no logos."
)

IMMAGINI = [
    ("corpo_fronte", "3:4",
     "A full-body front view of the figure standing upright in a neutral anatomical pose, "
     "arms relaxed slightly away from the torso, palms facing forward, feet hip-width apart. "
     "Plain dark grey athletic shorts. " + STILE),
    ("corpo_retro", "3:4",
     "A full-body back view of the same figure standing upright in a neutral anatomical pose, "
     "arms relaxed slightly away from the torso, feet hip-width apart, showing trapezius, "
     "lats, rear deltoids, glutes, hamstrings and calves clearly. Plain dark grey athletic shorts. "
     + STILE),
    ("chest_press_lato_inizio", "1:1",
     "A side view of the figure seated upright on a gym chest press machine, back flat against "
     "the padded backrest, feet flat on the floor, hands gripping the two handles beside the chest "
     "with elbows bent behind the torso at shoulder height. The chest, front shoulders and triceps "
     "are tinted a warm coral red to show the working muscles. The machine is drawn in matte "
     "charcoal steel. " + STILE),
    ("chest_press_lato_fine", "1:1",
     "A side view of the figure seated upright on a gym chest press machine, back flat against "
     "the padded backrest, feet flat on the floor, arms extended straight forward at shoulder "
     "height pushing the two handles away, elbows soft. The chest, front shoulders and triceps "
     "are tinted a warm coral red to show the working muscles. The machine is drawn in matte "
     "charcoal steel. " + STILE),
    ("chest_press_fronte", "1:1",
     "A three-quarter front view of the figure seated on a gym chest press machine, arms "
     "extended forward pushing the handles, chest and front shoulders tinted a warm coral red. "
     "The machine is drawn in matte charcoal steel. " + STILE),
]

VIDEO = [
    ("chest_press_video", 8,
     "A slow, smooth side-view animation of an anatomical figure performing a seated chest press "
     "on a gym machine: from handles beside the chest the arms push slowly forward until extended, "
     "pause, then return slowly. The chest muscles glow warmer coral red as they contract during "
     "the push and fade back during the return. Static camera, plain white background, clean "
     "medical-anatomy illustration style, light grey muscles with fine fibre lines, no text."),
]


def scarica(url, path):
    with urllib.request.urlopen(url) as r, open(path, "wb") as f:
        f.write(r.read())


def main():
    conn = videodb.connect()  # legge VIDEO_DB_API_KEY dall'ambiente
    coll = conn.get_collection()
    log = {}

    for nome, ratio, prompt in IMMAGINI:
        try:
            img = coll.generate_image(prompt=prompt, aspect_ratio=ratio)
            scarica(img.generate_url(), f"{OUT}/{nome}.png")
            log[nome] = "ok"
        except Exception as e:  # noqa: BLE001
            log[nome] = f"errore: {e}"
        print(nome, log[nome], flush=True)

    for nome, durata, prompt in VIDEO:
        try:
            vid = coll.generate_video(prompt=prompt, duration=durata)
            stream = vid.generate_stream()
            log[nome] = {"stream": stream,
                         "player": f"https://console.videodb.io/player?url={stream}"}
            try:
                dl = vid.download(name=nome)
                url = (dl.get("download_url") or dl.get("url")) if isinstance(dl, dict) else None
                if url:
                    time.sleep(5)
                    scarica(url, f"{OUT}/{nome}.mp4")
            except Exception as e:  # noqa: BLE001
                log[nome]["download"] = f"non riuscito: {e}"
        except Exception as e:  # noqa: BLE001
            log[nome] = f"errore: {e}"
        print(nome, log[nome], flush=True)

    with open(f"{OUT}/risultati.json", "w") as f:
        json.dump(log, f, indent=2, ensure_ascii=False)

    righe = []
    for nome, _, _ in IMMAGINI:
        if os.path.exists(f"{OUT}/{nome}.png"):
            righe.append(f'<h3>{nome}</h3><img src="{nome}.png">')
    for nome, _, _ in VIDEO:
        if os.path.exists(f"{OUT}/{nome}.mp4"):
            righe.append(f'<h3>{nome}</h3><video src="{nome}.mp4" controls loop muted playsinline></video>')
    with open(f"{OUT}/index.html", "w") as f:
        f.write('<!doctype html><meta name="viewport" content="width=device-width">'
                '<style>body{font-family:sans-serif;background:#111;color:#eee;padding:12px}'
                'img,video{width:100%;border-radius:12px;background:#fff}</style>'
                + "".join(righe))

    if not any(v == "ok" for v in log.values()):
        sys.exit("Nessuna immagine generata: controlla la chiave e il piano VideoDB.")


if __name__ == "__main__":
    main()
