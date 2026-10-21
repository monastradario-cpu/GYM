"""Test dell'interfaccia GYM in Chromium (viewport del telefono): apre le schermate principali,
raccoglie gli errori JavaScript e salva gli screenshot. Uso: python tools/test_app.py <cartella_out>"""
import http.server
import json
import os
import socketserver
import sys
import threading
import time

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
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

STATE = {"v": 3, "onboarded": True,
         "profile": {"goals": ["dimagrimento", "massa"], "level": "intermedio", "days": [1, 3, 5], "sex": "m", "age": 35, "height": 178},
         "weights": [{"date": "2026-10-20", "kg": 82}],
         "history": [{"start": int(time.time() * 1000) - 20 * 3600e3, "end": int(time.time() * 1000) - 19 * 3600e3,
                      "items": [{"ex": "panca_piana_bil", "sets": [{"kg": 60, "reps": 8, "done": True}] * 3}]}]}
errors = []
SCREENS = [
    ("home", "go('home')"), ("coach", "go('coach')"), ("chest_press", "go('exercise',{id:'chest_press'})"),
    ("lat_machine", "go('exercise',{id:'lat_machine'})"), ("stacco", "go('exercise',{id:'stacco_bil'})"),
    ("sissy", "go('exercise',{id:'sissy_squat_peso'})"), ("libreria", "go('library')"), ("progressi", "go('progress')"),
    ("scienza", "go('science')"), ("cibo", "go('food')"), ("schede", "go('schede')"),
]
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 412, "height": 915}, device_scale_factor=2)
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.on("console", lambda m: m.type == "error" and errors.append(f"console: {m.text}"))
    pg.goto(f"http://127.0.0.1:{port}/index.html")
    pg.evaluate(f"localStorage.setItem('gym.v1', JSON.stringify({json.dumps(STATE)}))")
    pg.reload()
    pg.wait_for_timeout(800)
    for name, js in SCREENS:
        try:
            pg.evaluate(js)
        except Exception as e:  # noqa: BLE001
            errors.append(f"{name}: {e}")
            continue
        pg.wait_for_timeout(700)
        pg.screenshot(path=f"{OUT}/{name}.png")
    # tocco di un muscolo sulla figura del Coach
    pg.evaluate("go('coach')")
    pg.wait_for_timeout(500)
    el = pg.query_selector(".body-pick [data-m='petto']")
    if el:
        el.click(force=True)
        pg.wait_for_timeout(500)
        pg.screenshot(path=f"{OUT}/coach_petto.png")
    else:
        errors.append("coach: zona petto non trovata")
    # tutti gli esercizi: la scheda si apre senza errori
    ids = pg.evaluate("EXERCISES.map(e => e.id)")
    bad = []
    for i in ids:
        try:
            pg.evaluate(f"go('exercise',{{id:'{i}'}})")
        except Exception as e:  # noqa: BLE001
            bad.append(f"{i}: {e}")
    b.close()
print(json.dumps({"errori": errors[:30], "esercizi_aperti": len(ids), "esercizi_con_errore": bad[:20]}, ensure_ascii=False, indent=1))
sys.exit(1 if errors or bad else 0)
