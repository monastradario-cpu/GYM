/* GYM — dati salvati, calcoli e ponte nativo */
'use strict';

const KEY = 'gym.v1';

/* ---------- Ponte nativo (Android) con alternative per il browser ---------- */
const Native = {
  has: () => typeof window.Android !== 'undefined',
  saveFile(name, mime, text) {
    if (Native.has()) { window.Android.saveFile(name, mime, text); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime }));
    a.download = name; a.click();
  },
  keepScreen(on) { if (Native.has()) window.Android.keepScreenOn(!!on); },
  vibrate(ms) { if (Native.has()) window.Android.vibrate(ms || 400); else if (navigator.vibrate) navigator.vibrate(ms || 400); },
  restTimer(secs, label) { if (Native.has()) window.Android.restTimer(secs | 0, label || ''); },
  cancelRest() { if (Native.has()) window.Android.cancelRest(); },
  setReminders(cfg) { if (Native.has()) window.Android.setReminders(JSON.stringify(cfg)); },
  askNotifications() { if (Native.has()) window.Android.askNotifications(); },
  openUrl(url) { if (Native.has()) window.Android.openUrl(url); else window.open(url, '_blank'); },
  version() { try { return Native.has() ? window.Android.version() : 'web'; } catch (e) { return '?'; } }
};

/* ---------- Utilità ---------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const dayKey = d => { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const todayKey = () => dayKey(Date.now());
const fmtDate = d => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
const fmtDateLong = d => new Date(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtKg = k => (Math.round(k * 100) / 100).toString().replace('.', ',');
const fmtDur = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + 'h ' + pad(m) + 'm' : m + ' min'; };
const fmtClock = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + pad(s % 60); };
const num = v => { const x = parseFloat(String(v).replace(',', '.')); return isFinite(x) ? x : 0; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const muscleName = m => MUSCLES[m] || (m === 'avambracci' ? 'Avambracci' : m);
function startOfWeek(d) { d = new Date(d); d.setHours(0, 0, 0, 0); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return d; }

/* ---------- Stato ---------- */
function defaultState() {
  return {
    v: 2,
    onboarded: false,
    profile: { goals: ['massa'], level: 'intermedio', days: [1, 3, 5], waterGoal: 8, sex: '', age: '', height: '' },
    settings: { theme: 'dark', accent: 'arancio', keepScreen: false, sound: true, autoRest: true,
      ai: { provider: 'gemini', key: '', model: '' } },
    reminders: {
      workout: { on: true, hour: 18, min: 0 },
      water: { on: true, from: 9, to: 21, every: 2 },
      weigh: { on: true, day: 1, hour: 8, min: 0 }
    },
    templates: [],
    history: [],
    weights: [],
    water: {},
    active: null
  };
}

let S = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const st = deepMerge(defaultState(), JSON.parse(raw)); return migrate(st); }
  } catch (e) { console.error(e); }
  return defaultState();
}
/* aggiornamenti dei dati salvati tra una versione e l'altra */
function migrate(st) {
  const p = st.profile;
  if (p.goal && GOALS[p.goal] && (st.v || 1) < 2) p.goals = [p.goal];
  if (!Array.isArray(p.goals) || !p.goals.length) p.goals = [p.goal && GOALS[p.goal] ? p.goal : 'massa'];
  delete p.goal;
  if ((st.v || 1) < 2) {
    st.v = 2;
    st.needRegen = true; // le schede preimpostate vengono rifatte con il nuovo metodo
  }
  return st;
}
function deepMerge(base, over) {
  for (const k in over) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) deepMerge(base[k], over[k]);
    else base[k] = over[k];
  }
  return base;
}
let saveTimer = null;
function save(now) {
  clearTimeout(saveTimer);
  const doSave = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Memoria piena: esporta un backup'); } };
  if (now) doSave(); else saveTimer = setTimeout(doSave, 250);
}

/* ---------- Schede ---------- */
function makeTemplateFromPreset(key, days) {
  const p = PRESET_SPLITS[key];
  return { id: uid(), kind: 'scheda', name: p.n, focus: p.focus, note: p.note, days: days || [], preset: key,
    items: splitItems(key, S.profile.level) };
}
function makeCircuit(c) {
  return { id: uid(), kind: 'circuito', name: c.n, desc: c.desc, days: [], preset: c.key,
    rounds: c.rounds, restEx: c.restEx, restRound: c.restRound, warm: c.warm, cool: c.cool, work: c.work,
    items: c.st.map(s => { const id = noBodyweight(s.ex), timed = EX[id].type === 'time'; return id === s.ex ? { ex: s.ex, reps: s.reps || 0, secs: s.secs || 0 } : { ex: id, reps: timed ? 0 : 15, secs: timed ? 40 : 0 }; }) };
}
function templateMinutes(t) {
  if (t.kind === 'circuito') {
    return circuitMinutes({ rounds: t.rounds, restEx: t.restEx, restRound: t.restRound, warm: t.warm, cool: t.cool, work: t.work || 45,
      st: t.items.map(i => ({ secs: i.secs || 0 })) });
  }
  return estMinutes(t.items.map(i => Object.assign({ sets: 3, rest: 60 }, i)));
}
function buildDefaultTemplates() {
  const days = S.profile.days.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const keys = splitForDays(days.length, S.profile.level);
  const list = keys.map((k, i) => makeTemplateFromPreset(k, [days[i]]));
  // con 1 solo giorno o schede ripetute, unisci nomi uguali
  const merged = [];
  list.forEach(t => { const m = merged.find(x => x.preset === t.preset); if (m) m.days.push(...t.days); else merged.push(t); });
  // circuiti sempre disponibili, senza giorno fisso
  PRESET_CIRCUITS.forEach(c => merged.push(makeCircuit(c)));
  return merged;
}
function todayTemplate() {
  const wd = new Date().getDay();
  return S.templates.find(t => (t.days || []).includes(wd));
}

/* ---------- Storico e calcoli ---------- */
const e1rm = (kg, reps) => reps <= 0 || kg <= 0 ? 0 : reps === 1 ? kg : kg * (1 + Math.min(reps, 12) / 30);

function workSets(entry) { return (entry.sets || []).filter(s => s.done && !s.wu); }

/* tutte le volte che è stato fatto un esercizio, dalla più recente */
function exerciseHistory(exId) {
  const out = [];
  for (let i = S.history.length - 1; i >= 0; i--) {
    const h = S.history[i];
    (h.items || []).forEach(it => { if (it.ex === exId) { const ws = workSets(it); if (ws.length) out.push({ date: h.start, sets: ws, item: it }); } });
  }
  return out;
}
function lastPerformance(exId) { return exerciseHistory(exId)[0] || null; }

function records(exId) {
  let best = { kg: 0, reps: 0, e1rm: 0, vol: 0, date: null, bestSet: null, maxKgDate: null, e1Date: null };
  exerciseHistory(exId).forEach(h => {
    let vol = 0;
    h.sets.forEach(s => {
      const kg = num(s.kg), r = num(s.reps); vol += kg * r;
      if (kg > best.kg || (kg === best.kg && r > best.reps)) { best.kg = kg; best.reps = r; best.maxKgDate = h.date; }
      const e = e1rm(kg, r); if (e > best.e1rm) { best.e1rm = e; best.e1Date = h.date; best.bestSet = { kg, reps: r }; }
    });
    if (vol > best.vol) best.vol = vol;
  });
  return best;
}

function allRecords() {
  const ids = new Set(); S.history.forEach(h => (h.items || []).forEach(i => ids.add(i.ex)));
  return [...ids].map(id => ({ id, r: records(id) })).filter(x => x.r.e1rm > 0 || x.r.kg > 0).sort((a, b) => b.r.e1rm - a.r.e1rm);
}

/* passo di incremento in base all'attrezzo */
function stepFor(exId) {
  const e = EX[exId]; if (!e) return 2.5;
  if (e.eq === 'manubri') return 2;
  if (e.eq === 'macchinari') return e.comp && ['quadricipiti', 'glutei', 'femorali'].includes(e.m) ? 10 : 5;
  if (e.eq === 'bilanciere') return e.comp && ['quadricipiti', 'glutei', 'femorali', 'dorso'].includes(e.m) ? 5 : 2.5;
  return 2.5;
}
const bestE1 = sets => Math.max(0, ...sets.map(s => e1rm(num(s.kg), num(s.reps))));

/* consiglio di progressione (doppia progressione: prima le ripetizioni, poi il carico)
   ritorna anche gli obiettivi serie per serie per l'allenamento di oggi */
function progression(exId, rmin, rmax) {
  const hist = exerciseHistory(exId), e = EX[exId] || {};
  const per = e.eq === 'manubri' ? ' (per manubrio)' : '';
  rmin = rmin || 8; rmax = rmax || 12;
  if (e.type === 'time') {
    const last = hist[0], secs = last ? Math.max(...last.sets.map(s => num(s.reps))) : 0;
    return { kind: 'info', text: secs ? 'L\'ultima volta ' + secs + ' s: oggi prova ' + (secs + 5) + ' s mantenendo la forma perfetta.' : 'Tieni la posizione con forma perfetta, poi aggiungi 5 s alla volta.', targets: secs ? [{ kg: 0, reps: secs + 5 }] : null };
  }
  if (!hist.length) return { kind: 'info', text: 'Prima volta: scegli un carico con cui arrivi a ' + rmax + ' ripetizioni lasciandone 2 di scorta. Annota bene: sarà il tuo punto di partenza.' };
  const last = hist[0], step = stepFor(exId);
  const kg = Math.max(...last.sets.map(s => num(s.kg)));
  if (kg === 0) {
    const r = Math.max(...last.sets.map(s => num(s.reps)));
    return { kind: r >= rmax + 5 ? 'up' : 'keep', text: r >= rmax + 5 ? 'Arrivi a ' + r + ' ripetizioni: aggiungi un carico (zavorra o manubrio) o passa a una variante più difficile.' : 'Oggi prova a fare 1–2 ripetizioni in più per serie (l\'ultima volta max ' + r + ').', targets: last.sets.map(s => ({ kg: 0, reps: num(s.reps) + 1 })) };
  }
  const work = last.sets.filter(s => num(s.kg) === kg);
  const nSets = last.sets.length;
  // 1) tutte le serie al massimo delle ripetizioni -> aumenta il carico
  if (work.every(s => num(s.reps) >= rmax)) {
    const nk = kg + step;
    return { kind: 'up', kg: nk, text: 'Obiettivo raggiunto: ' + work.length + '×' + rmax + '+ con ' + fmtKg(kg) + ' kg. Oggi aumenta a ' + fmtKg(nk) + ' kg' + per + ' e riparti da ' + rmin + ' ripetizioni.', targets: Array.from({ length: nSets }, () => ({ kg: nk, reps: rmin })) };
  }
  // 2) due sedute di fila sotto il minimo con lo stesso carico e forza in calo -> scarico
  const low = work.filter(s => num(s.reps) < rmin).length;
  const dropping = hist[1] && bestE1(last.sets) < bestE1(hist[1].sets) * 0.98;
  if (low > 0 && hist[1] && dropping) {
    const pk = Math.max(...hist[1].sets.map(s => num(s.kg)));
    if (pk === kg && hist[1].sets.some(s => num(s.kg) === pk && num(s.reps) < rmin)) {
      const down = Math.max(0, Math.round(kg * 0.9 / step) * step);
      return { kind: 'down', kg: down, text: 'Forza in calo nelle ultime due sedute con ' + fmtKg(kg) + ' kg. Settimana di scarico: ' + fmtKg(down) + ' kg (−10%) per ' + rmax + ' ripetizioni pulite, poi riparti. Controlla sonno, proteine e recupero.', targets: Array.from({ length: nSets }, () => ({ kg: down, reps: rmax })) };
    }
  }
  // 2b) lavori sotto il range del tuo obiettivo (non è un calo): adatta il carico
  const avgR = work.reduce((a, s) => a + num(s.reps), 0) / work.length;
  if (avgR < rmin - 1) {
    const nk = Math.max(step, Math.floor(bestE1(last.sets) / (1 + rmin / 30) / step) * step);
    return { kind: 'keep', kg: nk, text: 'Lavori intorno a ' + Math.round(avgR) + ' ripetizioni, ma per i tuoi obiettivi il range è ' + rmin + '–' + rmax + ': usa ' + fmtKg(nk) + ' kg' + per + ' e fai ' + rmin + ' ripetizioni, poi sali di ripetizioni come sempre.', targets: Array.from({ length: nSets }, () => ({ kg: nk, reps: rmin })) };
  }
  // 3) stallo: massimale stimato fermo da 3 sedute
  if (hist.length >= 3) {
    const e0 = bestE1(hist[0].sets), e2 = bestE1(hist[2].sets);
    if (e0 <= e2 * 1.005 && low === 0) {
      return { kind: 'keep', kg, text: 'Stallo da 3 sedute a ' + fmtKg(kg) + ' kg. Oggi cambia stimolo: aggiungi una serie oppure rallenta la discesa (3–4 s). Se non si sblocca, fai una settimana di scarico.', targets: last.sets.map(s => ({ kg, reps: Math.min(rmax, num(s.reps) + 1) })).concat([{ kg, reps: rmin }]) };
    }
  }
  // 4) default: stesso carico, +1 ripetizione per serie
  const targets = last.sets.map(s => ({ kg: num(s.kg) || kg, reps: Math.min(rmax, num(s.reps) + 1) }));
  const left = work.reduce((a, s) => a + Math.max(0, rmax - num(s.reps)), 0);
  return { kind: 'keep', kg, text: 'Resta a ' + fmtKg(kg) + ' kg' + per + ' e aggiungi 1 ripetizione per serie (' + targets.map(t => t.reps).join('-') + '). Ti mancano ' + left + ' ripetizioni per arrivare a ' + nSets + '×' + rmax + ', poi aumenti di ' + fmtKg(step) + ' kg.', targets };
}

/* andamento seduta per seduta: progressione, stallo o regressione */
function exerciseTrend(exId) {
  const hist = exerciseHistory(exId).slice().reverse(); // dalla più vecchia
  return hist.map((h, i) => {
    const e1 = bestE1(h.sets), vol = h.sets.reduce((a, s) => a + num(s.kg) * num(s.reps), 0);
    const top = h.sets.reduce((b, s) => (num(s.kg) > num(b.kg) || (num(s.kg) === num(b.kg) && num(s.reps) > num(b.reps))) ? s : b, h.sets[0]);
    const prev = i ? hist[i - 1] : null, pe1 = prev ? bestE1(prev.sets) : 0, pTop = prev ? prev.sets.reduce((b, s) => (num(s.kg) > num(b.kg) || (num(s.kg) === num(b.kg) && num(s.reps) > num(b.reps))) ? s : b, prev.sets[0]) : null;
    let kind = 'first', what = 'Prima seduta';
    if (prev) {
      const d = pe1 ? (e1 - pe1) / pe1 : 0;
      kind = d > 0.01 ? 'up' : d < -0.02 ? 'down' : 'same';
      const dk = num(top.kg) - num(pTop.kg), dr = num(top.reps) - num(pTop.reps);
      what = dk ? (dk > 0 ? '+' : '') + fmtKg(dk) + ' kg' : dr ? (dr > 0 ? '+' : '') + dr + ' rip' : 'uguale';
      if (kind === 'same' && vol > prev.sets.reduce((a, s) => a + num(s.kg) * num(s.reps), 0) * 1.03) { kind = 'up'; what += ' · più volume'; }
    }
    return { date: h.date, sets: h.sets, top, e1, vol, kind, what };
  }).reverse(); // dalla più recente
}
function trendSummary(tr) {
  if (!tr.length) return { kind: 'first', label: '' };
  if (tr.length === 1) return { kind: 'first', label: 'Prima seduta' };
  const recent = tr.slice(0, 3), base = tr[Math.min(3, tr.length - 1)];
  const d = base.e1 ? (tr[0].e1 - base.e1) / base.e1 : 0;
  if (d > 0.02) return { kind: 'up', label: 'In progressione +' + Math.round(d * 100) + '%' };
  if (d < -0.03) return { kind: 'down', label: 'In calo ' + Math.round(d * 100) + '%' };
  return { kind: 'same', label: 'Stabile' };
}

/* serie di riscaldamento */
function warmupSets(exId, workKg) {
  const e = EX[exId], bar = e && e.eq === 'bilanciere' ? 20 : 0, step = stepFor(exId);
  if (!workKg || workKg <= bar + step) return [];
  const pct = S.profile.level === 'principiante' ? [[0.5, 10], [0.75, 5]] : [[0.4, 10], [0.6, 6], [0.8, 3]];
  return pct.map(([p, r]) => ({ kg: Math.max(bar, Math.round(workKg * p / step) * step), reps: r, done: false, wu: true }));
}

/* calcolatore dischi (per lato) */
function platesFor(total, bar, avail) {
  avail = avail || [25, 20, 15, 10, 5, 2.5, 1.25];
  let side = (total - bar) / 2; const out = [];
  if (side < 0) return { ok: false, plates: [], rest: 0 };
  avail.forEach(p => { while (side >= p - 1e-9) { out.push(p); side = Math.round((side - p) * 1000) / 1000; } });
  return { ok: side < 1e-9, plates: out, rest: side };
}

/* statistiche settimanali */
function weekStats(weekStart) {
  const ws = startOfWeek(weekStart || Date.now()).getTime(), we = ws + 7 * 864e5;
  const list = S.history.filter(h => h.start >= ws && h.start < we);
  let vol = 0, sets = 0, time = 0, cardioMin = 0, km = 0; const musc = {};
  list.forEach(h => {
    time += (h.end || h.start) - h.start;
    (h.items || []).forEach(it => {
      const w = workSets(it); sets += w.length;
      w.forEach(s => { vol += num(s.kg) * num(s.reps); });
      const e = EX[it.ex]; if (e && w.length) { musc[e.m] = (musc[e.m] || 0) + w.length; e.s.forEach(m => { musc[m] = (musc[m] || 0) + w.length * 0.5; }); }
    });
    (h.cardio || []).forEach(c => { cardioMin += num(c.min); km += num(c.km); });
  });
  return { count: list.length, vol, sets, time: time / 1000, cardioMin, km, musc, list };
}

/* serie per muscolo negli ultimi N giorni */
function muscleLoad(days) {
  const from = Date.now() - days * 864e5, musc = {};
  S.history.filter(h => h.start >= from).forEach(h => (h.items || []).forEach(it => {
    const e = EX[it.ex], n = workSets(it).length; if (!e || !n) return;
    musc[e.m] = (musc[e.m] || 0) + n; e.s.forEach(m => { musc[m] = (musc[m] || 0) + n * 0.5; });
  }));
  return musc;
}

/* giorni consecutivi e settimane consecutive */
function streaks() {
  const days = new Set(S.history.map(h => dayKey(h.start)));
  let d = new Date(); d.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let dayStreak = 0; while (days.has(dayKey(d))) { dayStreak++; d.setDate(d.getDate() - 1); }
  const weeks = new Set(S.history.map(h => startOfWeek(h.start).getTime()));
  let w = startOfWeek(Date.now()); if (!weeks.has(w.getTime())) w.setDate(w.getDate() - 7);
  let weekStreak = 0; while (weeks.has(w.getTime())) { weekStreak++; w.setDate(w.getDate() - 7); }
  return { dayStreak, weekStreak, total: S.history.length };
}

/* alternative a un esercizio */
function alternatives(exId, avoidEq) {
  const e = EX[exId]; if (!e) return [];
  return EXERCISES.filter(x => x.id !== exId && x.m === e.m && x.pat !== 'condizionamento')
    .map(x => ({ x, score: (x.pat === e.pat ? 3 : 0) + (x.eq !== (avoidEq || e.eq) ? 1 : 0) + (x.comp === e.comp ? 1 : 0) }))
    .sort((a, b) => b.score - a.score).map(a => a.x);
}

/* ---------- Promemoria ---------- */
function syncReminders() {
  const r = S.reminders, names = {};
  S.templates.forEach(t => (t.days || []).forEach(d => { names[d + 1] = t.name; })); // Calendar.DAY_OF_WEEK: 1=dom
  Native.setReminders({
    workout: { on: r.workout.on, days: S.profile.days.map(d => d + 1), hour: r.workout.hour, min: r.workout.min, names },
    water: { on: r.water.on, from: r.water.from, to: r.water.to, every: r.water.every },
    weigh: { on: r.weigh.on, day: r.weigh.day + 1, hour: r.weigh.hour, min: r.weigh.min }
  });
}

/* ---------- Foto (IndexedDB) ---------- */
const Photos = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      const rq = indexedDB.open('gym-photos', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('p', { keyPath: 'id' });
      rq.onsuccess = () => { this.db = rq.result; res(this.db); };
      rq.onerror = () => rej(rq.error);
    });
  },
  async tx(mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('p', mode); const st = t.objectStore('p'); const r = fn(st); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); },
  all() { return this.tx('readonly', st => st.getAll()).then(a => (a || []).sort((x, y) => y.date - x.date)); },
  put(p) { return this.tx('readwrite', st => st.put(p)); },
  del(id) { return this.tx('readwrite', st => st.delete(id)); },
  clear() { return this.tx('readwrite', st => st.clear()); }
};

/* riduce l'immagine per non riempire la memoria */
function shrinkImage(file, max) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, (max || 1280) / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = rej; img.src = fr.result;
    };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}

/* ---------- Backup ---------- */
async function exportBackup(withPhotos) {
  const data = { app: 'GYM', version: 1, date: new Date().toISOString(), state: S };
  if (withPhotos) data.photos = await Photos.all();
  Native.saveFile('gym-backup-' + todayKey() + '.json', 'application/json', JSON.stringify(data));
}
async function importBackup(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== 'GYM' || !data.state) throw new Error('File non valido');
  S = migrate(deepMerge(defaultState(), data.state)); S.active = null; save(true);
  if (Array.isArray(data.photos)) { for (const p of data.photos) await Photos.put(p); }
}
