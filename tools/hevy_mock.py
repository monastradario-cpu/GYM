"""Finto server di Hevy per i test (intercetta https://api.hevyapp.com/* nel browser di Playwright).
Tiene cartelle, routine, esercizi personalizzati e allenamenti come farebbe l'API vera (v1)."""
import json
import re
import time
from datetime import datetime, timezone


def iso(t=None):
    return datetime.fromtimestamp(t or time.time(), timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")[:-4] + "Z"


class HevyMock:
    def __init__(self, page):
        self.folders, self.routines, self.custom, self.workouts, self.events, self.log = [], {}, {}, {}, [], []
        self.n = 0
        page.route("https://api.hevyapp.com/**", self.handle)

    def _id(self):
        self.n += 1
        return f"r{self.n:04d}"

    def handle(self, route, request):
        url, m = request.url, request.method
        path = re.sub(r"^https://api\.hevyapp\.com", "", url)
        body = json.loads(request.post_data) if request.post_data else None
        self.log.append((m, path, body))
        if request.headers.get("api-key") != "11111111-2222-3333-4444-555555555555":
            return route.fulfill(status=401, body='{"error":"Unauthorized"}', content_type="application/json")
        st, out = 200, {}
        if path.startswith("/v1/workouts/count"):
            out = {"workout_count": len(self.workouts)}
        elif path.startswith("/v1/workouts/events"):
            since = re.search(r"since=([^&]+)", path)
            since = since.group(1).replace("%3A", ":") if since else ""
            ev = [e for e in self.events if e["at"] > since]
            page = int(re.search(r"page=(\d+)", path).group(1))
            chunk = ev[(page - 1) * 10: page * 10]
            out = {"page": page, "page_count": max(1, -(-len(ev) // 10)), "events": [e["ev"] for e in chunk]}
        elif path.startswith("/v1/routine_folders") and m == "GET":
            out = {"page": 1, "page_count": 1, "routine_folders": self.folders}
        elif path.startswith("/v1/routine_folders") and m == "POST":
            f = {"id": 100 + len(self.folders), "title": body["routine_folder"]["title"]}
            self.folders.append(f)
            out = {"routine_folder": f}
            st = 201
        elif path == "/v1/exercise_templates" and m == "POST":
            cid = f"C{len(self.custom) + 1:04d}"
            self.custom[cid] = body["exercise"]
            out = {"id": cid}
        elif path == "/v1/routines" and m == "POST":
            r = dict(body["routine"], id=self._id(), updated_at=iso(), created_at=iso())
            self.routines[r["id"]] = r
            out, st = {"routine": [r]}, 201
        elif re.match(r"^/v1/routines/[^/?]+$", path):
            rid = path.split("/")[-1]
            if rid not in self.routines:
                return route.fulfill(status=404, body='{"error":"Not found"}', content_type="application/json")
            if m == "PUT":
                r = dict(self.routines[rid], **body["routine"], updated_at=iso())
                self.routines[rid] = r
                out = {"routine": [r]}
            else:
                out = {"routine": self.routines[rid]}
        else:
            st, out = 404, {"error": "not mocked " + path}
        route.fulfill(status=st, body=json.dumps(out), content_type="application/json")

    # ---- strumenti per i test ----
    def routine_by_title(self, part):
        return next((r for r in self.routines.values() if part in r["title"]), None)

    def edit_routine(self, rid, fn):
        """come se l'utente cambiasse la routine nell'app di Hevy"""
        time.sleep(0.01)
        r = self.routines[rid]
        fn(r)
        r["updated_at"] = iso(time.time() + 30)

    def add_workout(self, routine_id, title, exercises, ago_h=2, dur_min=60):
        wid = f"w{len(self.workouts) + 1:04d}"
        start = time.time() - ago_h * 3600
        w = {"id": wid, "title": title, "routine_id": routine_id, "description": "", "start_time": iso(start), "end_time": iso(start + dur_min * 60),
             "updated_at": iso(time.time() + len(self.events)), "created_at": iso(), "exercises": exercises}
        self.workouts[wid] = w
        self.events.append({"at": w["updated_at"], "ev": {"type": "updated", "workout": w}})
        return wid

    def delete_workout(self, wid):
        self.workouts.pop(wid, None)
        at = iso(time.time() + 100 + len(self.events))
        self.events.append({"at": at, "ev": {"type": "deleted", "id": wid, "deleted_at": at}})
