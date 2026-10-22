"""Test dei consigli in più: settimana leggera, seduta saltata, test di forma, riepilogo della domenica,
foto di confronto, proteine per pasto, lista della spesa, riscaldamento specifico, allarme dolori.
Uso: python tools/test_extra.py <cartella_screenshot>"""
import datetime
import http.server
import json
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
URL = f"http://127.0.0.1:{srv.server_address[1]}/index.html"
errors, res = [], {}

# profilo pronto: percorso fatto, 3 giorni (lun, mer, ven), palestra, 80 kg
SETUP = """
localStorage.clear();
const st = JSON.parse(localStorage.getItem('gym.v1') || '{}');
"""


def new_page(b, when=None):
    ctx = b.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2)
    pg = ctx.new_page()
    if when:
        pg.clock.install(time=when)
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errors.append(f"console: {m.text}"))
    pg.goto(URL)
    pg.wait_for_timeout(500)
    pg.evaluate("""() => {
      Object.assign(S.profile, { sex: 'm', age: 40, height: 178, level: 'intermedio', days: [1, 3, 5], goals: ['massa'], body: 'normo', job: 'seduto', steps: 's2', sleep: 'h3', stress: 'medio', place: 'palestra', minutes: 60, pain: [] });
      S.weights = [{ d: Date.now() - 864e5, kg: 80 }]; S.onboarded = true; S.profile.mgoals = defaultMGoals();
      UI.ob = { step: 9 }; ACT.ppFinish();
    }""")
    pg.wait_for_timeout(500)
    return pg


def shot(pg, n):
    pg.screenshot(path=f"{OUT}/ex_{n}.png")


with sync_playwright() as p:
    b = p.chromium.launch()
    # giovedì 22/10/2026 ore 12
    pg = new_page(b, datetime.datetime(2026, 10, 22, 12, 0))
    res["schede"] = pg.evaluate("S.templates.map(t => t.name + ' ' + (t.days || []).join(','))")
    # 2. seduta saltata: ieri (mercoledì) c'era la scheda, nessun allenamento
    pg.evaluate("go('home')"); pg.wait_for_timeout(300); shot(pg, "1_saltata")
    res["saltata"] = pg.evaluate("(missedSession() || {}).t ? missedSession().t.name : null")
    res["breve"] = pg.evaluate("(() => { const m = missedSession(); if (!m) return null; const s = shortVersion(m.t, 30); return { min: estMinutes(s.items), ex: s.items.map(i => i.ex + ':' + i.sets) }; })()")
    # 1. settimana leggera: 4 check-in con sonno scarso
    pg.evaluate("S.checkins = [1, 2, 3, 4].map(i => ({ d: Date.now() - i * 864e5, sleep: 0, energy: 1, pain: [] })); save(true); go('home')"); pg.wait_for_timeout(300); shot(pg, "2_leggera")
    res["leggera"] = pg.evaluate("fatigueSignals()")
    pg.click("[data-act=fatigueSkip]"); pg.wait_for_timeout(200)
    # 9. allarme dolori: 3 check-in con dolore alle ginocchia
    pg.evaluate("S.checkins = [3, 2, 1].map(i => ({ d: Date.now() - i * 864e5, sleep: 1, energy: 1, pain: ['ginocchia'] })); painAlarmApply(); go('home')"); pg.wait_for_timeout(300); shot(pg, "3_dolore")
    res["dolore"] = pg.evaluate("({ pain: S.profile.pain, auto: S.painAuto, ginocchia_nelle_schede: S.templates.filter(t => t.kind === 'scheda').flatMap(t => t.items).filter(i => painHit(EX[i.ex], 'ginocchia')).map(i => i.ex) })")
    pg.click("[data-act=painOk]"); pg.wait_for_timeout(300)
    res["dolore_passato"] = pg.evaluate("S.profile.pain")
    # 3. test di forma
    pg.evaluate("go('ftest')"); pg.wait_for_timeout(300); shot(pg, "4_test")
    pg.fill("[data-in=ftest][data-k=push]", "22"); pg.fill("[data-in=ftest][data-k=plank]", "75"); pg.fill("[data-in=ftest][data-k=sts]", "18")
    pg.click("[data-act=ftestSave]"); pg.wait_for_timeout(300)
    pg.evaluate("S.ftests[0].d -= 30 * 864e5; S.ftests.push({ d: Date.now(), push: 27, plank: 90, sts: 20 }); save(true); go('goals')"); pg.wait_for_timeout(300); shot(pg, "5_traguardi_test")
    res["test"] = pg.evaluate("ftestCompare()")
    # 6. proteine per pasto
    pg.evaluate("S.food = {}; S.food[todayKey()] = [{ name: 'Yogurt greco 0%', g: 170, kcal: 57, p: 10, c: 4, f: 0.2, meal: 'colazione' }, { name: 'Petto di pollo (crudo)', g: 150, kcal: 110, p: 23, c: 0, f: 1.2, meal: 'pranzo' }]; save(true); UI.nutTab = 'diario'; go('food')")
    pg.wait_for_timeout(300); pg.evaluate("document.querySelector('.pad').scrollTo(0, 0); const c = [...document.querySelectorAll('.card h3')].find(h => h.textContent.includes('Proteine nei pasti')); c && c.scrollIntoView()"); shot(pg, "6_proteine")
    res["proteine_pasto"] = pg.evaluate("proteinPerMeal()")
    # 7. lista della spesa con voci tue
    pg.evaluate("UI.nutTab = 'spesa'; go('food')"); pg.wait_for_timeout(300)
    pg.fill("#shop-in", "Caffè"); pg.click("[data-act=shopAdd]"); pg.wait_for_timeout(200)
    res["spesa"] = pg.evaluate("S.shopMine")
    shot(pg, "7_spesa")
    # 8. riscaldamento specifico
    pg.evaluate("_startWorkout(S.templates.find(t => t.kind === 'scheda'))"); pg.wait_for_timeout(400); shot(pg, "8_riscaldamento")
    res["riscaldamento"] = pg.evaluate("warmupFor(S.active.items).map(x => x.ex)")
    pg.click("[data-act=wuStart]"); pg.wait_for_timeout(600); shot(pg, "9_riscaldamento_guidato")
    pg.click("[data-act=wuNext]"); pg.wait_for_timeout(200)
    res["riscaldamento_passo"] = pg.evaluate("UI.wu.i")
    pg.click("[data-act=wuEnd]"); pg.wait_for_timeout(200)
    res["riscaldamento_chiuso"] = pg.evaluate("!document.querySelector('.wu-card')")
    pg.evaluate("S.active = null; save(true)")
    pg.context.close()

    # 4. riepilogo: domenica 25/10 ore 19
    pg = new_page(b, datetime.datetime(2026, 10, 25, 19, 0))
    pg.evaluate("S.history.push({ id: 'h1', name: 'Full body A', kind: 'scheda', start: Date.now() - 4 * 864e5, end: Date.now() - 4 * 864e5 + 3600e3, items: [{ ex: 'panca_piana_bil', sets: [{ kg: 60, reps: 8, done: true }, { kg: 60, reps: 8, done: true }, { kg: 60, reps: 8, done: true }] }], cardio: [] }); save(true); go('home')")
    pg.wait_for_timeout(400); shot(pg, "10_riepilogo")
    res["riepilogo"] = pg.evaluate("!!weekRecap()")
    # 5. foto di confronto: due foto a 5 settimane
    pg.evaluate("""async () => {
      const c = document.createElement('canvas'); c.width = 90; c.height = 120; const x = c.getContext('2d');
      x.fillStyle = '#c84'; x.fillRect(0, 0, 90, 120); const a = c.toDataURL('image/jpeg');
      x.fillStyle = '#4a8'; x.fillRect(0, 0, 90, 120); const b2 = c.toDataURL('image/jpeg');
      await Photos.put({ id: 'f1', date: Date.now() - 35 * 864e5, data: a, kg: 82 });
      await Photos.put({ id: 'f2', date: Date.now(), data: b2, kg: 80 });
    }""")
    pg.evaluate("ACT.goPhotos()"); pg.wait_for_timeout(800); shot(pg, "11_foto")
    res["foto_confronto"] = pg.evaluate("!!document.querySelector('.photo-cmp')")
    b.close()

print(json.dumps({"errori": errors, **res}, ensure_ascii=False, indent=1))
