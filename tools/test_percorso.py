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
    pg.goto(f"http://127.0.0.1:{srv.server_address[1]}/index.html")
    pg.evaluate("localStorage.clear()")
    pg.reload(); pg.wait_for_timeout(600)

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
    st = pg.evaluate("({ path: S.profile.path, pal: palFor(S.profile), goals: S.profile.goals, kind: cycleInfo().kind, len: cycleInfo().len, tpl: S.templates.filter(t => t.preset && t.kind === 'scheda').map(t => ({ n: t.name, min: estMinutes(t.items), ex: t.items.map(i => i.ex + ':' + i.sets + 'x' + (i.secs ? i.secs + 's' : i.rmin + '-' + i.rmax)) })), kcal: nutritionTargets().kcal, prot: nutritionTargets().protein })")
    # nessun esercizio che carica la schiena nelle schede
    bad = pg.evaluate("S.templates.filter(t => t.preset && t.kind === 'scheda').flatMap(t => t.items).filter(i => painHit(EX[i.ex], 'schiena')).map(i => i.ex)")
    pg.evaluate("go('schede')"); pg.wait_for_timeout(400); shot("11_schede")
    # check-in prima della seduta
    pg.evaluate("startWorkout(S.templates.find(t => t.preset && t.kind === 'scheda'))"); pg.wait_for_timeout(400); shot("12_checkin")
    click("[data-act=ckSet][data-k=sleep][data-v='0']"); click("[data-act=ckSet][data-k=energy][data-v='0']"); click("[data-act=ckPain][data-k=spalle]"); click("[data-act=ckGo]")
    pg.wait_for_timeout(700); shot("13_allenamento")
    wo = pg.evaluate("S.active ? S.active.items.map(i => i.ex + ':' + i.sets.length) : null")
    sp = pg.evaluate("S.active ? S.active.items.filter(i => painHit(EX[i.ex], 'spalle')).map(i => i.ex) : []")
    pg.evaluate("S.active = null; save(true)")
    # traguardi e controllo di fase (simula 4 settimane passate)
    pg.evaluate("go('goals')"); pg.wait_for_timeout(300); shot("14_traguardi")
    pg.evaluate("S.cycle.start -= 28 * 864e5; save(true); go('home')"); pg.wait_for_timeout(300); shot("15_home_controllo")
    due = pg.evaluate("checkpointDue()")
    pg.evaluate("go('checkpoint')"); pg.wait_for_timeout(300); shot("16_controllo")
    # funzionale e mobilità: create nei giorni liberi, a tempo con guida
    fm = pg.evaluate("S.templates.filter(t => t.zone === 'allenamento').map(t => ({ n: t.name, days: t.days, min: templateMinutes(t), giri: t.rounds, ex: t.items.map(i => i.ex + ':' + i.secs) }))")
    pg.evaluate("UI.schede = 'circuiti'; go('schede')"); pg.wait_for_timeout(300); shot("17_funz_mob")
    pg.evaluate("startWorkout(S.templates.find(t => t.quick === 'f_mob'))"); pg.wait_for_timeout(400); shot("18_mobilita")
    pg.evaluate("S.active.items.forEach(it => it.sets.forEach(s => { s.done = true; s.reps = it.secs; })); save(true); render()"); pg.wait_for_timeout(200); shot("19_mobilita_fine")
    pg.evaluate("finishWorkout()"); pg.wait_for_timeout(300)
    salvato = pg.evaluate("S.history.slice(-1)[0] ? { n: S.history.slice(-1)[0].name, quick: S.history.slice(-1)[0].quick } : null")
    # oggi niente palestra: alternative a casa
    pg.evaluate("const t = S.templates.find(t => t.preset && t.kind === 'scheda'); S.templates.forEach(x => { x.days = (x.days || []).filter(d => d !== new Date().getDay()); }); t.days.push(new Date().getDay()); S.history = S.history.filter(h => new Date(h.start).toDateString() !== new Date().toDateString()); save(true); go('home')")
    pg.wait_for_timeout(400); shot("19b_home_casa")
    pg.click("[data-act=homeOpen]"); pg.wait_for_timeout(500); shot("19c_opzioni_casa")
    casa_tutto = pg.evaluate("homeVersion(UI.homeT).items.map(i => i.ex + ':' + EX[i.ex].eq + ':' + i.rmin + '-' + i.rmax)")
    pg.click("[data-act=homeEq][data-k=manubri]"); pg.click("[data-act=homeEq][data-k=kettlebell]"); pg.click("[data-act=homeEq][data-k=elastici]"); pg.wait_for_timeout(300); shot("19d_solo_corpo")
    casa_corpo = pg.evaluate("homeVersion(UI.homeT).items.map(i => i.ex + ':' + EX[i.ex].eq)")
    pg.click("[data-act=homeGo][data-k=scheda]"); pg.wait_for_timeout(500); shot("19e_scheda_casa")
    casa_att = pg.evaluate("S.active ? S.active.items.map(i => i.ex) : null")
    pg.evaluate("S.active = null; S.profile.homeEq = null; save(true)")
    # traguardo: costanza raggiunta -> nuovo traguardo e schede aggiornate
    prima = pg.evaluate("S.templates.filter(t => t.preset && t.kind === 'scheda').map(t => t.items.map(i => i.ex + ':' + i.sets).join(','))")
    pg.evaluate("S.profile.mgoals.costanza = { on: true, perWeek: 1, weeks: 1 }; S.path.start = Date.now() - 3 * 864e5; S.history.push({ id: 'x', name: 'x', kind: 'scheda', start: Date.now() - 864e5, end: Date.now() - 864e5 + 36e5, items: [], cardio: [] }); save(true); go('home')")
    pg.wait_for_timeout(900); shot("20_traguardo")
    dopo = pg.evaluate("({ stage: S.path.stage, liv: S.profile.level, costanza: S.profile.mgoals.costanza.weeks, schede: S.templates.filter(t => t.preset && t.kind === 'scheda').map(t => t.items.map(i => i.ex + ':' + i.sets).join(',')), reached: S.path.reached })")
    # obiettivo di peso superato (es. 80 kg e ora 79,5): deve risultare raggiunto, non "non ti stai avvicinando"
    peso_superato = pg.evaluate("(() => { const g = S.profile.mgoals.peso, old = S.weights.slice(); g.on = true; g.from = 84; g.kg = 80; S.weights.push({ d: Date.now(), kg: 79.5 }); const r = goalStatus().find(x => x.k === 'peso'); S.weights = old; return r && r.eta; })()")
    peso_in_corso = pg.evaluate("(() => { const g = S.profile.mgoals.peso, old = S.weights.slice(); g.from = 84; g.kg = 80; S.weights.push({ d: Date.now(), kg: 82 }); const r = goalStatus().find(x => x.k === 'peso'); S.weights = old; return r && r.eta; })()")
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
    # trainer (circuito per dimagrire): la stazione cardio deve rispettare il percorso (niente jumping jack con dolori alle ginocchia o BMI alto)
    cardio = pg.evaluate("(() => { const p = S.profile, o = JSON.stringify({ pain: p.pain, level: p.level, goals: p.goals, body: p.body }), oc = UI.coach, r = {}; Object.assign(p, { level: 'principiante', goals: ['dimagrimento'], body: 'normo' }); for (const [k, pain, body] of [['libero', [], 'normo'], ['ginocchia', ['ginocchia'], 'normo'], ['obeso', [], 'obeso'], ['ginocchia_polsi', ['ginocchia', 'polsi'], 'normo']]) { p.pain = pain; p.body = body; UI.coach = { muscles: ['quadricipiti', 'petto'], eq: ['corpo'], dur: 40, result: null }; coachGenerate(7); r[k] = UI.coach.result.options[2].items.map(i => i.ex); } Object.assign(p, JSON.parse(o)); UI.coach = oc; return r; })()")
    if "jumping_jack" not in cardio["libero"] or any("jumping_jack" in cardio[k] or any(JUMP.search(x) for x in cardio[k]) for k in ("ginocchia", "obeso")) or "mountain_climber" in cardio["ginocchia_polsi"]:
        errors.append(f"stazione cardio del trainer: {cardio}")
    # check-in "giornata no" nelle settimane a percentuale (5×5, 4×4, 3×3): una serie in meno e carico un po' più basso anche lì (mai sotto le serie di partenza se erano già 1–2)
    giornata_no = pg.evaluate("(() => { const oc = cycleInfo, oh = S.history.slice(); S.history.push({ id: 'pct', name: 'p', kind: 'scheda', start: Date.now() - 864e5, end: Date.now(), items: [{ ex: 'panca_piana_bil', sets: [{ kg: 100, reps: 5, done: true }] }], cardio: [] }); cycleInfo = () => ({ on: true, deload: false, pct: 0.85, sets: 3, reps: 3, setsAdd: 0 }); const f = src => { const it = newItem(src, 'scheda'); return { n: it.sets.length, kg: it.sets[0].pk }; }; const r = { normale: f({ ex: 'panca_piana_bil', role: 'main', sets: 3 }), no: f({ ex: 'panca_piana_bil', role: 'main', sets: 3, less: 1, light: true }) }; cycleInfo = () => ({ on: true, deload: false, setsAdd: 1 }); r.svil = f({ ex: 'panca_piana_bil', role: 'sec', sets: 3 }); r.svilNo = f({ ex: 'panca_piana_bil', role: 'sec', sets: 3, less: 1 }); r.min2 = f({ ex: 'curl_man', role: 'acc', sets: 1, less: 1 }); cycleInfo = oc; S.history = oh; return r; })()")
    if not (giornata_no["no"]["n"] == giornata_no["normale"]["n"] - 1 and giornata_no["no"]["kg"] < giornata_no["normale"]["kg"] and giornata_no["svilNo"]["n"] == giornata_no["svil"]["n"] - 1 and giornata_no["min2"]["n"] == 1):
        errors.append(f"check-in giornata no: {giornata_no}")
    # migrazione: chi aveva le schede pronte senza percorso le perde, tiene le sue
    pg.evaluate("localStorage.setItem('gym.v1', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('gym.v1')), { mig23: 0, profile: Object.assign(S.profile, { path: false }), templates: [{ id: 'a', kind: 'scheda', name: 'Full body A', preset: 'fullA', days: [1], items: [] }, { id: 'b', kind: 'scheda', name: 'Mia', days: [], items: [] }] })))")
    pg.reload(); pg.wait_for_timeout(700)
    mig = pg.evaluate("S.templates.map(t => t.name)")
    pg.evaluate("UI.schede = 'schede'; go('schede')"); pg.wait_for_timeout(300); shot("21_schede_senza_percorso")
    b.close()
print(json.dumps({"errori": errors, "stato": st, "schiena_nelle_schede": bad, "seduta": wo, "spalle_oggi": sp, "controllo": due, "funz_mob": fm, "salvato": salvato, "prima": prima, "dopo": dopo, "migrazione": mig, "casa_tutto": casa_tutto, "casa_corpo": casa_corpo, "casa_attivo": casa_att, "peso_superato": peso_superato, "peso_in_corso": peso_in_corso, "forza": forza, "macro": macro, "cardio_trainer": cardio, "giornata_no": giornata_no}, ensure_ascii=False, indent=1))
