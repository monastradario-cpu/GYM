"""Costruisce tools/figure_spec.json: per ogni esercizio dell'app, i dati per disegnarlo.

Fonti del movimento corretto:
- free-exercise-db (pubblico dominio): istruzioni in inglese, allineate all'ordine di exdb.js
- passaggi in italiano scritti nell'app (data.js) per gli esercizi principali
- schede macchinari (MACCHINE) riassunte da NASM Exercise Library e guide tecniche
Uso: python tools/build_spec.py <ex.json> <match.json> <free-exercise-db/dist/exercises.json>
"""
import json
import re
import sys

ex = json.load(open(sys.argv[1]))
match = json.load(open(sys.argv[2]))
fedb = {x["id"]: x for x in json.load(open(sys.argv[3]))}

FRONT = {"fly", "lat_pull", "ohp", "lateral", "rear_fly", "upright_row", "abduction", "shrug",
         "rot_ext", "arm_circles", "neck_tilt", "twist_chair"}

ATTREZZO = {
    "bilanciere": "a straight Olympic barbell with black bumper plates",
    "manubri": "a pair of black hexagonal dumbbells",
    "cavi": "a cable pulley station with a single handle or rope attachment, the steel cable clearly visible",
    "macchinari": "a selectorized gym machine with a black weight stack",
    "kettlebell": "a black cast-iron kettlebell",
    "elastici": "a red resistance band",
    "ez": "an EZ curl bar with angled grips and black plates",
    "smith": "a Smith machine: barbell fixed on two vertical steel guide rails",
    "corpo": "no equipment, bodyweight only",
    "altro": "the equipment named in the exercise",
}

# Schede macchinari: meccanismo e posizione del corpo (NASM Exercise Library, guide tecniche).
MACCHINE = [
    (r"chest press|press.*petto.*macchina", "Seated chest press machine: upright padded backrest, handles at mid-chest height. "
     "Start: hands on the handles beside the chest, elbows about 45 degrees from the torso. End: arms pressed forward almost straight, back against the pad."),
    (r"pec deck|pectoral|butterfly", "Pec deck machine: seated upright, forearms or hands on two vertical swinging arms at shoulder height. "
     "Start: arms open wide to the sides. End: arms brought together in front of the chest."),
    (r"lat machine|pulldown|lat pull", "Lat pulldown machine: seated, thighs locked under knee pads, long bar hanging from a high cable. "
     "Start: arms straight overhead holding the bar wide. End: bar pulled down to the upper chest, elbows down and back."),
    (r"pulley|rematore.*cavo|seated cable row|low row", "Seated low cable row: sitting on a bench, feet on a foot plate, cable from a low pulley in front. "
     "Start: arms extended forward, torso upright. End: handle pulled to the belly, elbows behind the torso, shoulder blades squeezed."),
    (r"leg press", "45-degree leg press: lying back on an inclined padded seat, feet on a large sloped sled platform. "
     "Start: knees bent close to the chest. End: legs pushed out almost straight, knees soft."),
    (r"hack squat", "Hack squat machine: back against an angled back pad, shoulders under padded yokes, feet on an angled platform, sled on rails. "
     "Start: standing almost straight. End: deep squat with thighs parallel to the platform."),
    (r"leg extension", "Leg extension machine: seated upright, knees aligned with the pivot, roller pad on the front of the ankles. "
     "Start: knees bent 90 degrees. End: legs extended straight forward."),
    (r"leg curl.*sdraiat|lying leg curl", "Lying leg curl machine: lying face down on a bench, hips on the pad, roller just above the heels. "
     "Start: legs straight. End: heels curled toward the glutes."),
    (r"leg curl.*sedut|seated leg curl", "Seated leg curl machine: seated, thigh pad holding the legs, roller under the back of the ankles. "
     "Start: legs extended forward. End: knees bent, heels pulled under the seat."),
    (r"abductor|abduzion", "Hip abductor machine: seated, outer thighs against two padded arms. Start: knees together. End: legs pushed apart."),
    (r"adductor|adduzion", "Hip adductor machine: seated, inner thighs against two padded arms. Start: legs apart. End: legs squeezed together."),
    (r"calf.*sedut|seated calf", "Seated calf raise machine: seated, knees under a padded lever, balls of feet on a step. Start: heels low. End: heels raised high."),
    (r"calf", "Standing calf raise: balls of the feet on a step edge. Start: heels below the step. End: up on the toes."),
    (r"smith", "Smith machine: the barbell slides on two vertical guide rails; body position as in the free-weight version."),
    (r"scott|preacher", "Preacher curl bench: upper arms resting on an angled pad. Start: arms extended down the pad. End: forearms curled up."),
    (r"iperestension|hyperextension|back extension", "45-degree hyperextension bench: hips on the pad, ankles locked under rollers. "
     "Start: torso bent down toward the floor. End: body in a straight line."),
    (r"dip machine", "Seated dip machine: seated, hands on two handles at the sides. Start: elbows bent, hands at chest level. End: arms pushed down straight."),
    (r"shoulder press.*macchin|shoulder press", "Seated shoulder press machine: back on the pad, handles at shoulder height. Start: hands at shoulders. End: arms pressed overhead."),
    (r"crunch.*macchin|ab crunch machine", "Ab crunch machine: seated, hands on handles by the head, feet hooked. Start: torso upright. End: torso curled forward."),
    (r"croci ai cavi|cable crossover|crossover", "Cable crossover: standing between two high pulleys, one handle in each hand. "
     "Start: arms wide to the sides. End: hands meet in front of the lower chest."),
    (r"glute machine|slanci ai cavi|kickback.*cav", "Cable glute kickback: standing facing a low pulley, ankle strap on one foot. Start: leg under the hip. End: leg extended back."),
    (r"t.?bar", "T-bar row: one end of a barbell anchored to the floor, V-handle at the other end. Torso bent forward about 45 degrees. "
     "Start: arms extended down. End: handle pulled to the chest."),
    (r"landmine", "Landmine: one end of a barbell fixed in a floor pivot, the lifter holds the free end."),
    (r"trx|anelli", "Suspension straps (TRX) or gymnastic rings hanging from a high anchor point."),
    (r"fitball|swiss ball|exercise ball", "A large inflatable fitness ball."),
    (r"parallel|dip alle", "Parallel dip bars at hip height."),
    (r"sbarra|trazion|pull.?up|chin", "A horizontal pull-up bar above head height."),
    (r"panca inclinata|incline", "An adjustable bench with the backrest inclined at 30 to 45 degrees."),
    (r"panca declinata|decline", "A decline bench, head lower than the hips, feet locked under rollers."),
    (r"panca|bench", "A flat padded weight bench."),
]


def macchina(nome, en):
    t = (nome + " " + en).lower()
    for rx, d in MACCHINE:
        if re.search(rx, t):
            return d
    return ""


spec = []
for e in ex:
    f = fedb.get(match.get(e["id"], ""), None)
    instr = f["instructions"] if f else e.get("steps", [])
    spec.append({
        "id": e["id"],
        "it": e["n"],
        "en": f["name"] if f else "",
        "instr": [re.sub(r"\s+", " ", s)[:400] for s in instr][:6],
        "lang": "en" if f else "it",
        "eq": e["eq"],
        "attrezzo": ATTREZZO.get(e["eq"], ""),
        "macchina": macchina(e["n"], f["name"] if f else ""),
        "m": e["m"],
        "s": e.get("s", []),
        "vista": "front" if e.get("anim") in FRONT else "side",
    })

json.dump(spec, open("tools/figure_spec.json", "w"), ensure_ascii=False, indent=0)
print(len(spec), "esercizi;", sum(1 for s in spec if s["lang"] == "en"), "con istruzioni free-exercise-db;",
      sum(1 for s in spec if s["macchina"]), "con scheda macchinario")
