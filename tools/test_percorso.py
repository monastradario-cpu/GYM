"""Test del percorso su misura: nuovo utente che compila il questionario, poi check-in e controllo di fase.
Uso: python tools/test_percorso.py <cartella_screenshot>"""
import http.server
import json
import re
import os
import socketserver
import sys
import threading

from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from hevy_mock import HevyMock  # noqa: E402

WWW = os.path.join(os.path.dirname(__file__), "..", "app/src/main/assets/www")
OUT = sys.argv[1] if len(sys.argv) > 1 else "screens"
os.makedirs(OUT, exist_ok=True)


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=WWW, **k)

    def log_message(self, *a):
        pass


srv = socketserver.TCPServer(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
errors = []
JUMP = re.compile(r"jumping_jack|burpee|skip|squat_jump|salt")
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 412, "height": 915}, device_scale_factor=2)
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errors.append(f"console: {m.text}"))
    hv = HevyMock(pg)
    pg.goto(f"http://127.0.0.1:{srv.server_address[1]}/index.html")
    pg.evaluate("localStorage.clear()")
    pg.reload(); pg.wait_for_timeout(600)
    KEY = "11111111-2222-3333-4444-555555555555"

    def launch(js):
        """avvia una seduta: Coach la manda a Hevy; ritorna gli esercizi della routine (id di Coach : serie)"""
        n0 = pg.evaluate("S.hevy && S.hevy.launch ? S.hevy.launch.d : 0")
        pg.evaluate(js)
        pg.wait_for_function(f"S.hevy && S.hevy.launch && S.hevy.launch.d > {n0}", timeout=15000)
        return pg.evaluate("S.hevy.plans[S.hevy.launch.id].items.map(i => i.ex + ':' + i.sets)")

    def click(sel):
        pg.click(sel); pg.wait_for_timeout(250)

    def shot(n):
        pg.screenshot(path=f"{OUT}/pp_{n}.png", full_page=False)

    shot("0_benvenuto"); click("[data-act=ppNext]")
    click("[data-act=setSex][data-k=m]"); click("[data-act=ppBody][data-k=skinnyfat]"); shot("1_fisico"); click("[data-act=ppNext]")
    pg.fill("[data-in=prof][data-k=age]", "52"); pg.fill("[data-in=prof][data-k=height]", "176"); pg.fill("[data-in=obWeight]", "84")
    pg.dispatch_event("[data-in=obWeight]", "input"); click("[data-act=setLevel][data-k=intermedio]"); shot("2_dati"); click("[data-act=ppNext]")
    click("[data-act=ppJob][data-k=seduto]"); click("[data-act=ppSteps][data-k=s2]"); click("[data-act=ppSleep][data-k=h1]"); click("[data-act=ppStress][data-k=alto]"); shot("3_vita"); click("[data-act=ppNext]")
    for d in ("1", "3", "5"):
        if not pg.is_visible(f"[data-act=setDay][data-d='{d}'].on"):
            try:
                click(f"[data-act=setDay][data-d='{d}']")
            except Exception:  # noqa: BLE001
                pass
    click("[data-act=ppSport][data-k=camminate][data-n='3']"); shot("4_attivita"); click("[data-act=ppNext]")
    click("[data-act=ppPlace][data-k=palestra]"); click("[data-act=ppMin][data-k='60']"); shot("5_luogo"); click("[data-act=ppNext]")
    click("[data-act=ppPain][data-k=schiena]"); shot("6_dolori"); click("[data-act=ppNext]")
    shot("7_obiettivi"); click("[data-act=ppNext]")
    shot("8_traguardi"); click("[data-act=ppNext]")
    shot("9_percorso"); pg.evaluate("document.querySelector('.pad').scrollTo(0, 2000)"); click("[data-act=ppFinish]")
    pg.wait_for_timeout(800); shot("10_home")
    pg.evaluate("go('hevySetup')"); pg.wait_for_timeout(300); shot("10b_collega_hevy")
    pg.fill("#hv-key", KEY); click("[data-act=hvConnect]")
    pg.wait_for_function("S.hevy && S.hevy.firstDone && S.hevy.pushedAt", timeout=20000); pg.wait_for_timeout(300); shot("10c_home_collegato")
    routine_iniziali = sorted(r["title"] for r in hv.routines.values())
    if not any("Full body" in t or "Parte" in t or "Spinta" in t for t in routine_iniziali) or not hv.folders:
        errors.append(f"routine in Hevy dopo il collegamento: {routine_iniziali}")
    st = pg.evaluate("({ path: S.profile.path, pal: palFor(S.profile), goals: S.profile.goals, kind: cycleInfo().kind, len: cycleInfo().len, tpl: S.templates.filter(t => t.preset && t.kind === 'scheda').map(t => ({ n: t.name, min: estMinutes(t.items), ex: t.items.map(i => i.ex + ':' + i.sets + 'x' + (i.secs ? i.secs + 's' : i.rmin + '-' + i.rmax)) })), kcal: nutritionTargets().kcal, prot: nutritionTargets().protein })")
    # nessun esercizio che carica la schiena nelle schede
    bad = pg.evaluate("S.templates.filter(t => t.preset && t.kind === 'scheda').flatMap(t => t.items).filter(i => painHit(EX[i.ex], 'schiena')).map(i => i.ex)")
    pg.evaluate("go('schede')"); pg.wait_for_timeout(400); shot("11_schede")
    # check-in prima della seduta
    pg.evaluate("startWorkout(S.templates.find(t => t.preset && t.kind === 'scheda'))"); pg.wait_for_timeout(400); shot("12_checkin")
    click("[data-act=ckSet][data-k=sleep][data-v='0']"); click("[data-act=ckSet][data-k=energy][data-v='0']"); click("[data-act=ckPain][data-k=spalle]")
    wo = launch("ACT.ckGo()")
    sp = pg.evaluate("S.hevy.plans[S.hevy.launch.id].items.filter(i => painHit(EX[i.ex], 'spalle')).map(i => i.ex)")
    rt = hv.routines[pg.evaluate("S.hevy.launch.id")]
    if sp or not rt["exercises"] or any(not x["exercise_template_id"] for x in rt["exercises"]):
        errors.append(f"seduta di oggi in Hevy (dolore spalle): {wo} {sp}")
    # traguardi e controllo di fase (simula 4 settimane passate)
    pg.evaluate("go('goals')"); pg.wait_for_timeout(300); shot("14_traguardi")
    pg.evaluate("S.cycle.start -= 28 * 864e5; save(true); go('home')"); pg.wait_for_timeout(300); shot("15_home_controllo")
    due = pg.evaluate("checkpointDue()")
    pg.evaluate("go('checkpoint')"); pg.wait_for_timeout(300); shot("16_controllo")
    # funzionale e mobilità: create nei giorni liberi, a tempo con guida
    fm = pg.evaluate("S.templates.filter(t => t.zone === 'allenamento').map(t => ({ n: t.name, days: t.days, min: templateMinutes(t), giri: t.rounds, ex: t.items.map(i => i.ex + ':' + i.secs) }))")
    pg.evaluate("UI.schede = 'circuiti'; go('schede')"); pg.wait_for_timeout(300); shot("17_funz_mob")
    mob = launch("startWorkout(S.templates.find(t => t.quick === 'f_mob'))")
    rm = hv.routines[pg.evaluate("S.hevy.launch.id")]
    if not rm["exercises"] or any(x["superset_id"] != 0 or not all(st.get("duration_seconds") for st in x["sets"]) for x in rm["exercises"]):
        errors.append(f"mobilità in Hevy: deve essere una superserie a tempo {rm['exercises'][:2]}")
    if not hv.custom:
        errors.append("mobilità: gli allungamenti senza equivalente vanno creati in Hevy come esercizi personalizzati")
    tit = [v["title"] for v in hv.custom.values()]
    if len(tit) != len(set(tit)) or any(x["exercise_template_id"] not in hv.custom and len(x["exercise_template_id"]) < 8 for x in rm["exercises"]):
        errors.append(f"esercizi personalizzati doppi o id sbagliati: {tit}")
    # fatta in Hevy: torna in Coach come seduta di mobilità
    hv.add_workout(rm["id"], rm["title"], [{"exercise_template_id": x["exercise_template_id"], "title": "x", "notes": "", "sets": [{"index": i, "type": "normal", "duration_seconds": st["duration_seconds"]} for i, st in enumerate(x["sets"])]} for x in rm["exercises"]], ago_h=3, dur_min=20)
    pg.evaluate("hvSync()"); pg.wait_for_timeout(1500)
    salvato = pg.evaluate("S.history.slice(-1)[0] ? { n: S.history.slice(-1)[0].name, quick: S.history.slice(-1)[0].quick } : null")
    if not salvato or salvato["quick"] != "f_mob":
        errors.append(f"seduta di mobilità da Hevy: {salvato}")
    # oggi niente palestra: alternative a casa
    pg.evaluate("const t = S.templates.find(t => t.preset && t.kind === 'scheda'); S.templates.forEach(x => { x.days = (x.days || []).filter(d => d !== new Date().getDay()); }); t.days.push(new Date().getDay()); S.history = S.history.filter(h => new Date(h.start).toDateString() !== new Date().toDateString()); save(true); go('home')")
    pg.wait_for_timeout(400); shot("19b_home_casa")
    pg.click("[data-act=homeOpen]"); pg.wait_for_timeout(500); shot("19c_opzioni_casa")
    casa_tutto = pg.evaluate("homeVersion(UI.homeT).items.map(i => i.ex + ':' + EX[i.ex].eq + ':' + i.rmin + '-' + i.rmax)")
    pg.click("[data-act=homeEq][data-k=manubri]"); pg.click("[data-act=homeEq][data-k=kettlebell]"); pg.click("[data-act=homeEq][data-k=elastici]"); pg.wait_for_timeout(300); shot("19d_solo_corpo")
    casa_corpo = pg.evaluate("homeVersion(UI.homeT).items.map(i => i.ex + ':' + EX[i.ex].eq)")
    casa_att = launch("ACT.homeGo({ k: 'scheda' })")
    pg.evaluate("S.profile.homeEq = null; save(true)")
    # check-in con dolore alle ginocchia e poi "Oggi sono a casa": la scheda a casa tiene conto del dolore e il check-in viene salvato
    pg.evaluate("S.checkins = []; startWorkout(todayTemplate())"); pg.wait_for_timeout(400)
    pg.evaluate("UI.ck.pain = ['ginocchia']; UI.ck.sleep = 0; $('#sheet-body').innerHTML = checkinSheet()"); pg.wait_for_timeout(200)
    pg.click("[data-act=ckHome]"); pg.wait_for_timeout(700); shot("19f_casa_dopo_checkin")
    casa_dolore_anteprima = pg.evaluate("homeOptions(UI.homeT)[0].mk ? withPain(UI.ckHome.pain, homeOptions(UI.homeT)[0].mk).items.filter(i => painHit(EX[i.ex], 'ginocchia')).map(i => i.ex) : null")
    launch("ACT.homeGo({ k: 'scheda' })")
    casa_dolore = pg.evaluate("(A => ({ attivo: A.map(i => i.ex), ginocchia: A.filter(i => painHit(EX[i.ex], 'ginocchia')).map(i => i.ex), fuori_casa: A.filter(i => !['corpo', 'manubri', 'elastici', 'kettlebell'].includes(EX[i.ex].eq)).map(i => i.ex), checkin: (S.checkins || []).slice(-1)[0] || null, dolori_profilo: S.profile.pain }))(S.hevy.plans[S.hevy.launch.id].items)")
    if not casa_dolore["attivo"] or casa_dolore["ginocchia"] or casa_dolore_anteprima or casa_dolore["fuori_casa"] or not casa_dolore["checkin"] or casa_dolore["checkin"]["pain"] != ["ginocchia"] or "ginocchia" in (casa_dolore["dolori_profilo"] or []):
        errors.append(f"check-in e poi a casa: {casa_dolore} anteprima {casa_dolore_anteprima}")
    pg.evaluate("S.active = null; S.checkins = []; save(true)")
    # traguardo: costanza raggiunta -> nuovo traguardo e schede aggiornate
    prima = pg.evaluate("S.templates.filter(t => t.preset && t.kind === 'scheda').map(t => t.items.map(i => i.ex + ':' + i.sets).join(','))")
    pg.evaluate("S.profile.mgoals.costanza = { on: true, perWeek: 1, weeks: 1 }; S.path.start = Date.now() - 3 * 864e5; S.history.push({ id: 'x', name: 'x', kind: 'scheda', start: Date.now() - 864e5, end: Date.now() - 864e5 + 36e5, items: [], cardio: [] }); save(true); go('home')")
    pg.wait_for_timeout(900); shot("20_traguardo")
    dopo = pg.evaluate("({ stage: S.path.stage, liv: S.profile.level, costanza: S.profile.mgoals.costanza.weeks, schede: S.templates.filter(t => t.preset && t.kind === 'scheda').map(t => t.items.map(i => i.ex + ':' + i.sets).join(',')), reached: S.path.reached })")
    # obiettivo di peso superato (es. 80 kg e ora 79,5): deve risultare raggiunto, non "non ti stai avvicinando"
    peso_superato = pg.evaluate("(() => { const g = S.profile.mgoals.peso, old = S.weights.slice(); g.on = true; g.from = 84; g.kg = 80; S.weights.push({ d: Date.now(), kg: 79.5 }); const r = goalStatus().find(x => x.k === 'peso'); S.weights = old; return r && r.eta; })()")
    peso_in_corso = pg.evaluate("(() => { const g = S.profile.mgoals.peso, old = S.weights.slice(); g.from = 84; g.kg = 80; S.weights.push({ d: Date.now(), kg: 82 }); const r = goalStatus().find(x => x.k === 'peso'); S.weights = old; return r && r.eta; })()")
    # barra del peso: da 84 a 80 kg, ora 82 -> metà strada; peso salito -> 0; mai 100% se non raggiunto
    peso_bar = pg.evaluate("(() => { const g = S.profile.mgoals.peso, old = S.weights.slice(), on = g.on; g.on = true; g.from = 84; g.kg = 80; const r = []; [82, 85, 80.4].forEach(kg => { S.weights = old.concat([{ d: Date.now(), kg }]); r.push(goalStatus().find(x => x.k === 'peso').pct); }); S.weights = old; g.on = on; return r; })()")
    if not (peso_bar[0] is not None and abs(peso_bar[0] - 0.5) < 0.01 and peso_bar[1] == 0 and peso_bar[2] is not None and peso_bar[2] < 1):
        errors.append(f"barra obiettivo di peso: {peso_bar}")
    if peso_superato != "Raggiunto!" or peso_in_corso == "Raggiunto!":
        errors.append(f"obiettivo di peso: superato={peso_superato} in corso={peso_in_corso}")
    # obiettivo di forza lasciato vuoto: si fissa a +10% e non si sposta quando il massimale cresce
    forza = pg.evaluate("(() => { const G = S.profile.mgoals, oldG = JSON.stringify(G.forza), oldH = S.history.slice(); G.forza = { on: true, ex: 'panca_piana_bil', kg: 0 }; const it = kg => ({ id: 'f' + kg, name: 'f', kind: 'scheda', start: Date.now() - (100 - kg) * 864e5, end: Date.now(), items: [{ ex: 'panca_piana_bil', sets: [{ kg, reps: 5, done: true }] }], cardio: [] }); S.history.push(it(60)); const a = goalStatus().find(x => x.k === 'forza'); S.history.push(it(70)); const b = goalStatus().find(x => x.k === 'forza'); const r = { prima: a && a.t, dopo: b && b.t, eta: b && b.eta, kg: G.forza.kg }; S.history = oldH; G.forza = JSON.parse(oldG); save(true); return r; })()")
    if not forza.get("eta") == "Raggiunto!":
        errors.append(f"obiettivo di forza: {forza}")
    # fase Sviluppo: il testo della settimana deve dire +1 serie solo quando la serie in più c'è davvero (sonno scarso/stress alto)
    sviluppo = pg.evaluate("(() => { const p = S.profile, o = [p.sleep, p.stress], r = []; for (const lr of [false, true]) { p.sleep = lr ? 'h1' : 'h3'; p.stress = lr ? 'alto' : 'basso'; buildPathCycle().w.slice(4, 7).forEach(x => r.push({ lr, add: x.add, piu: /\\+1 serie/.test(x.t) })); } [p.sleep, p.stress] = o; return r; })()")
    for x in sviluppo:
        if bool(x["add"]) != x["piu"]:
            errors.append(f"testo fase Sviluppo incoerente con le serie: {x}")
    # fase Intensificazione (senza obiettivo forza): +1 serie e "cedimento" nel testo coerenti con serie e RIR, anche dopo i 50 anni
    intens = pg.evaluate("(() => { const p = S.profile, o = [p.age, p.goals], r = []; p.goals = ['massa']; for (const age of [30, 60]) { p.age = age; buildPathCycle().w.slice(8, 11).forEach(x => r.push({ age, add: x.add, rir: x.rir, piu: /\\+1 serie/.test(x.t), ced: /cedimento tecnico/.test(x.t) })); } [p.age, p.goals] = o; return r; })()")
    for x in intens:
        if bool(x["add"]) != x["piu"] or (x["rir"] == 0) != x["ced"]:
            errors.append(f"testo fase Intensificazione incoerente: {x}")
    # proteine e grassi con BMI alto: calcolati sul peso corretto, i carboidrati non devono finire a zero
    macro = pg.evaluate("(() => { const p = S.profile, o = [p.sex, p.height, p.age, p.body, p.goals], W = S.weights.slice(); Object.assign(p, { sex: 'f', height: 165, age: 40, body: 'obeso', goals: ['dimagrimento'] }); S.weights.push({ d: Date.now(), kg: 120 }); const n = nutritionTargets(); p.body = 'atletico'; S.weights[S.weights.length - 1].kg = 90; const a = nutritionTargets(); [p.sex, p.height, p.age, p.body, p.goals] = o; S.weights = W; return { prot: n.protein, fat: n.fat, carbs: n.carbs, kcal: n.kcal, protAtl: a.protein }; })()")
    if not (150 <= macro["prot"] <= 210 and macro["carbs"] >= 80 and macro["protAtl"] == round(90 * 2.2)):
        errors.append(f"macro con BMI alto: {macro}")
    # dimagrimento: calorie mai sotto il metabolismo a riposo; acqua sul peso corretto (max 4 L)
    fl = pg.evaluate("(() => { const p = S.profile, o = JSON.stringify({ sex: p.sex, height: p.height, age: p.age, body: p.body, goals: p.goals, days: p.days, path: p.path }), W = S.weights.slice(); Object.assign(p, { sex: 'f', height: 155, age: 65, body: 'normo', goals: ['dimagrimento'], days: [1], path: false }); S.weights.push({ d: Date.now(), kg: 48 }); const n = nutritionTargets(); Object.assign(p, { height: 170, body: 'obeso' }); S.weights[S.weights.length - 1].kg = 150; const h = nutritionTargets(); Object.assign(p, JSON.parse(o)); S.weights = W; return { kcal: n.kcal, bmr: n.bmr, floor: !!n.floor, adj: n.kcalAdj, water: h.water }; })()")
    if not (fl["kcal"] >= fl["bmr"] and 3 <= fl["water"] <= 4):
        errors.append(f"pavimento calorie / acqua: {fl}")
    # trainer (circuito per dimagrire): la stazione cardio deve rispettare il percorso (niente jumping jack con dolori alle ginocchia o BMI alto)
    cardio = pg.evaluate("(() => { const p = S.profile, o = JSON.stringify({ pain: p.pain, level: p.level, goals: p.goals, body: p.body }), oc = UI.coach, r = {}; Object.assign(p, { level: 'principiante', goals: ['dimagrimento'], body: 'normo' }); for (const [k, pain, body] of [['libero', [], 'normo'], ['ginocchia', ['ginocchia'], 'normo'], ['obeso', [], 'obeso'], ['ginocchia_polsi', ['ginocchia', 'polsi'], 'normo']]) { p.pain = pain; p.body = body; UI.coach = { muscles: ['quadricipiti', 'petto'], eq: ['corpo'], dur: 40, result: null }; coachGenerate(7); r[k] = UI.coach.result.options[2].items.map(i => i.ex); } Object.assign(p, JSON.parse(o)); UI.coach = oc; return r; })()")
    if "jumping_jack" not in cardio["libero"] or any("jumping_jack" in cardio[k] or any(JUMP.search(x) for x in cardio[k]) for k in ("ginocchia", "obeso")) or "mountain_climber" in cardio["ginocchia_polsi"]:
        errors.append(f"stazione cardio del trainer: {cardio}")
    # check-in "giornata no" nelle settimane a percentuale (5×5, 4×4, 3×3): una serie in meno e carico un po' più basso anche lì (mai sotto le serie di partenza se erano già 1–2)
    giornata_no = pg.evaluate("(() => { const oc = cycleInfo, oh = S.history.slice(); S.history.push({ id: 'pct', name: 'p', kind: 'scheda', start: Date.now() - 864e5, end: Date.now(), items: [{ ex: 'panca_piana_bil', sets: [{ kg: 100, reps: 5, done: true }] }], cardio: [] }); cycleInfo = () => ({ on: true, deload: false, pct: 0.85, sets: 3, reps: 3, setsAdd: 0 }); const f = src => { const it = newItem(src, 'scheda'); return { n: it.sets.length, kg: it.sets[0].pk }; }; const r = { normale: f({ ex: 'panca_piana_bil', role: 'main', sets: 3 }), no: f({ ex: 'panca_piana_bil', role: 'main', sets: 3, less: 1, light: true }) }; cycleInfo = () => ({ on: true, deload: false, setsAdd: 1 }); r.svil = f({ ex: 'panca_piana_bil', role: 'sec', sets: 3 }); r.svilNo = f({ ex: 'panca_piana_bil', role: 'sec', sets: 3, less: 1 }); r.min2 = f({ ex: 'curl_man', role: 'acc', sets: 1, less: 1 }); cycleInfo = oc; S.history = oh; return r; })()")
    if not (giornata_no["no"]["n"] == giornata_no["normale"]["n"] - 1 and giornata_no["no"]["kg"] < giornata_no["normale"]["kg"] and giornata_no["svilNo"]["n"] == giornata_no["svil"]["n"] - 1 and giornata_no["min2"]["n"] == 1):
        errors.append(f"check-in giornata no: {giornata_no}")
    # girovita: barra dalla prima misura al traguardo e previsione anche con misure rade (oltre 60 giorni)
    vita = pg.evaluate("(() => { const G = S.profile.mgoals = S.profile.mgoals || {}, og = JSON.stringify(G), om = S.measures, D = 864e5, now = Date.now(); Object.keys(G).forEach(k => G[k].on = false); G.vita = { on: true, cm: 94 }; S.measures = [{ d: now - 150 * D, vita: 104 }, { d: now - 80 * D, vita: 100 }, { d: now - 5 * D, vita: 99 }]; const g = goalStatus().find(x => x.k === 'vita'); S.measures = om; Object.assign(S.profile.mgoals, JSON.parse(og)); if (!JSON.parse(og).vita) delete S.profile.mgoals.vita; return { pct: g.pct, eta: g.eta }; })()")
    if not (vita["pct"] is not None and 0.45 <= vita["pct"] <= 0.55 and vita["eta"].startswith("Previsione")):
        errors.append(f"traguardo girovita: {vita}")
    # ---------- Hevy: valutazione delle sedute, modifiche adottate, cancellazioni ----------
    pg.evaluate("S.hevy.routines = Object.fromEntries(Object.entries(S.hevy.routines).map(([k, r]) => [k, Object.assign(r, { body: '' })])); hvPushAll()"); pg.wait_for_timeout(2500)
    fa_key = pg.evaluate("hvKey(S.templates.find(t => t.preset && t.kind === 'scheda'))")
    rid = pg.evaluate(f"S.hevy.routines['{fa_key}'].id")

    def wk_from(r, frac=1.0, reps_delta=0, rpe=8, kg=None):
        ex = []
        for x in r["exercises"]:
            ws = [st for st in x["sets"] if st["type"] != "warmup"]
            n = max(1, round(len(ws) * frac))
            ex.append({"exercise_template_id": x["exercise_template_id"], "title": "x", "notes": "", "sets": [
                {"index": i, "type": "normal", "weight_kg": kg if kg is not None else st.get("weight_kg") or 40, "reps": (st.get("reps") or (st.get("rep_range") or {}).get("end") or 10) + reps_delta,
                 "duration_seconds": st.get("duration_seconds"), "rpe": rpe} for i, st in enumerate(ws[:n])]})
        return ex
    hv.add_workout(rid, hv.routines[rid]["title"], wk_from(hv.routines[rid], kg=40), ago_h=-0.2)
    pg.evaluate("hvSync()"); pg.wait_for_timeout(3000)
    hv.add_workout(rid, hv.routines[rid]["title"], wk_from(hv.routines[rid]), ago_h=-0.4)
    pg.evaluate("hvSync()"); pg.wait_for_timeout(3000)
    hv.add_workout(rid, hv.routines[rid]["title"], wk_from(hv.routines[rid], frac=0.5, reps_delta=-3, rpe=10), ago_h=-0.6)
    pg.evaluate("hvSyncUI(false)"); pg.wait_for_timeout(3000); shot("22_valutazione")
    voti = pg.evaluate("S.history.filter(h => h.val && h.routine).map(h => ({ n: h.name, v: h.val.score, l: h.val.label, fix: h.val.fix.length, plan: h.val.planned }))")
    if len(voti) < 3 or not (voti[-2]["v"] and voti[-2]["v"] >= 8.5) or not (voti[-1]["v"] and voti[-1]["v"] < voti[-2]["v"] - 2) or not voti[-1]["fix"]:
        errors.append(f"valutazione delle sedute: {voti}")
    vista = pg.evaluate("current().v")
    if vista != "valutazione":
        errors.append(f"dopo un allenamento nuovo si apre la valutazione, invece: {vista}")
    # la prossima volta è già scritta in Hevy: i carichi della routine vengono dall'ultima seduta
    pesi = [st.get("weight_kg") for x in hv.routines[rid]["exercises"] for st in x["sets"] if st["type"] == "normal"]
    if not any(pesi):
        errors.append("routine in Hevy senza carichi dopo le sedute")
    pg.evaluate("go('progress')"); pg.wait_for_timeout(400); shot("23_progressi_voti")
    # modifica fatta in Hevy: cambio il secondo esercizio con la panca con manubri -> Coach la adotta e la tiene anche rigenerando
    nuovo = pg.evaluate("HV_OF['chest_press']")
    vecchio = pg.evaluate(f"S.hevy.plans['{rid}'].items[1].ex")
    hv.edit_routine(rid, lambda r: r["exercises"][1].update({"exercise_template_id": nuovo}))
    pg.evaluate("hvSync({ manual: true })"); pg.wait_for_timeout(4000)
    adottata = pg.evaluate(f"({{ swap: (S.stepLog || []).filter(x => x.hevy).map(x => x.from + '>' + x.to), scheda: S.templates.find(t => hvKey(t) === '{fa_key}').items.map(i => i.ex) }})")
    if vecchio + ">chest_press" not in adottata["swap"] or "chest_press" not in adottata["scheda"] or vecchio in adottata["scheda"]:
        errors.append(f"modifica fatta in Hevy non adottata: {vecchio} -> {adottata}")
    pg.evaluate("regenPath(); save(true)")
    if "chest_press" not in pg.evaluate(f"S.templates.find(t => hvKey(t) === '{fa_key}').items.map(i => i.ex)"):
        errors.append("la modifica fatta in Hevy si perde rigenerando le schede")
    # allenamento cancellato in Hevy: sparisce anche da Coach
    n_prima = pg.evaluate("S.history.length")
    hv.delete_workout(list(hv.workouts)[-1])
    pg.evaluate("hvSync()"); pg.wait_for_timeout(2500)
    if pg.evaluate("S.history.length") != n_prima - 1:
        errors.append("allenamento cancellato in Hevy ancora in Coach")
    # migrazione: chi aveva le schede pronte senza percorso le perde, tiene le sue
    pg.evaluate("localStorage.setItem('gym.v1', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('gym.v1')), { mig23: 0, profile: Object.assign(S.profile, { path: false }), templates: [{ id: 'a', kind: 'scheda', name: 'Full body A', preset: 'fullA', days: [1], items: [] }, { id: 'b', kind: 'scheda', name: 'Mia', days: [], items: [] }] })))")
    pg.reload(); pg.wait_for_timeout(700)
    mig = pg.evaluate("S.templates.map(t => t.name)")
    pg.evaluate("UI.schede = 'schede'; go('schede')"); pg.wait_for_timeout(300); shot("21_schede_senza_percorso")
    b.close()
print(json.dumps({"errori": errors, "stato": st, "schiena_nelle_schede": bad, "seduta": wo, "spalle_oggi": sp, "controllo": due, "funz_mob": fm, "salvato": salvato, "prima": prima, "dopo": dopo, "migrazione": mig, "casa_tutto": casa_tutto, "casa_corpo": casa_corpo, "casa_attivo": casa_att, "peso_superato": peso_superato, "peso_in_corso": peso_in_corso, "peso_bar": peso_bar, "forza": forza, "macro": macro, "cardio_trainer": cardio, "giornata_no": giornata_no, "casa_dopo_checkin": casa_dolore, "vita": vita, "voti": voti, "adottata": adottata}, ensure_ascii=False, indent=1))
