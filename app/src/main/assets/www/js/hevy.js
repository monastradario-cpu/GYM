/* Coach — collegamento con Hevy (API ufficiale, serve Hevy Pro).
   Coach decide cosa fare (schede, carichi, adattamenti), Hevy registra l'allenamento.
   - Da Coach a Hevy: le schede diventano routine nella cartella "Coach", con serie, ripetizioni, recuperi e carichi di oggi.
   - Da Hevy a Coach: gli allenamenti fatti diventano lo storico di Coach (valutazione, massimali, costanza, traguardi).
   - Se modifichi in Hevy una routine di Coach, Coach adotta la modifica (vedi hvAdopt).
   API: https://api.hevyapp.com/docs — routine e allenamenti massimo 10 per pagina, esercizi 100. */
'use strict';

/* ---------- catalogo unico: gli esercizi di Coach sono quelli di Hevy ---------- */
const HV_MUSCLE = { chest: 'petto', lats: 'dorso', upper_back: 'dorso', lower_back: 'dorso', traps: 'dorso', shoulders: 'spalle', biceps: 'bicipiti', triceps: 'tricipiti', forearms: 'avambracci', abdominals: 'addome', quadriceps: 'quadricipiti', hamstrings: 'femorali', glutes: 'glutei', adductors: 'adduttori', abductors: 'glutei', calves: 'polpacci', neck: 'collo' };
const HV_CARDIO_IT = { running: 'Corsa', cycling: 'Cyclette', elliptical: 'Ellittica', rowing: 'Vogatore', walking: 'Camminata', stair: 'Step' };
const canon = id => (typeof HV_ALIAS !== 'undefined' && HV_ALIAS[id]) || id;
function hvEqOf(h) {
  const [, en, eq] = HV[h];
  if (/smith/i.test(en)) return 'smith';
  if (/\bez\b/i.test(en)) return 'ez';
  return { barbell: 'bilanciere', dumbbell: 'manubri', kettlebell: 'kettlebell', resistance_band: 'elastici', none: 'corpo' }[eq] || (eq === 'machine' ? (/cable/i.test(en) ? 'cavi' : 'macchinari') : 'altro');
}
const hvIsCardio = h => HV[h] && /distance_duration|floors_duration|steps_duration/.test(HV[h][3]);
(function () {
  if (typeof HV === 'undefined') return;
  Object.keys(HV_NAME).forEach(id => { if (EX[id]) EX[id].n = HV_NAME[id]; });
  Object.keys(HV_ALIAS).forEach(a => { if (EX[a] && EX[HV_ALIAS[a]]) EX[a] = EX[HV_ALIAS[a]]; });
  const keep = new Set(Object.keys(HV_OF).concat(HV_CUSTOM));
  for (let i = EXERCISES.length - 1; i >= 0; i--) if (!keep.has(EXERCISES[i].id)) EXERCISES.splice(i, 1);
  EXERCISES.forEach(e => { e.hv = HV_OF[e.id] || null; if (e.hv) e.hvT = HV[e.hv][1]; });
  // gli esercizi di Hevy che Coach non aveva: ci sono anche qui (per lo storico e le schede), ma il percorso non li sceglie da solo
  const used = new Set(Object.values(HV_OF));
  Object.keys(HV).forEach(h => {
    if (used.has(h) || hvIsCardio(h)) return;
    const [n, en, , type, pm, sec] = HV[h], id = 'hv_' + h;
    const e = { id, n, m: HV_MUSCLE[pm] || 'addome', s: (sec || []).map(x => HV_MUSCLE[x]).filter((x, i, a) => x && a.indexOf(x) === i), eq: hvEqOf(h), pat: 'altro',
      steps: [], err: [], tip: '', type: type === 'duration' ? 'time' : 'reps', comp: false, lvl: 2, niche: true, hv: h, hvT: en };
    EXERCISES.push(e); EX[id] = e;
  });
})();
/* tutte le id dello stesso esercizio (alias compresi) contano come uno solo nello storico */
const _exHist = exerciseHistory;
exerciseHistory = function (exId) {
  const c = canon(exId), out = [];
  for (let i = S.history.length - 1; i >= 0; i--) {
    const h = S.history[i]; if (h.quick) continue;
    (h.items || []).forEach(it => { if (canon(it.ex) === c) { const ws = workSets(it); if (ws.length) out.push({ date: h.start, sets: ws, item: it }); } });
  }
  return out;
};
const _prescribeHv = prescribe;
prescribe = function (exId, role) { return _prescribeHv(canon(exId), role); };

/* ---------- stato del collegamento ---------- */
function hvState() {
  S.hevy = S.hevy || {};
  const H = S.hevy;
  H.routines = H.routines || {}; H.custom = H.custom || {}; H.plans = H.plans || {}; H.edits = H.edits || {};
  return H;
}
const hvOn = () => !!(S.hevy && S.hevy.key);
const HEVY_PKG = 'com.hevy';

/* ---------- chiamate all'API (dal codice nativo: niente blocchi CORS) ---------- */
async function hvReq(method, path, body) {
  const H = hvState();
  const r = await aiFetch('https://api.hevyapp.com' + path, { method, headers: { 'api-key': H.key, 'accept': 'application/json', 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  // alcune risposte di Hevy non sono JSON (per esempio la creazione di un esercizio rende solo l'id)
  let j;
  if (typeof r.text === 'function') { const t = await r.text(); try { j = JSON.parse(t || '{}'); } catch (e) { j = { error: { message: t } }; } }
  else j = await r.json();
  if (r.status === 401 || r.status === 403) throw new Error('Hevy rifiuta la chiave: controllala nelle impostazioni (serve Hevy Pro).');
  if (r.status === 429) throw new Error('Troppe richieste a Hevy: riprova tra un minuto.');
  if (!r.ok) throw new Error('Hevy ha risposto con un errore (' + r.status + ')' + (j && (j.error || j.message) ? ': ' + String(j.error || j.message).slice(0, 160) : ''));
  return j;
}

/* id Hevy di un esercizio di Coach; quelli senza equivalente vengono creati in Hevy come personalizzati (una volta sola) */
const HV_MG = { petto: 'chest', dorso: 'lats', spalle: 'shoulders', bicipiti: 'biceps', tricipiti: 'triceps', avambracci: 'forearms', addome: 'abdominals', quadricipiti: 'quadriceps', femorali: 'hamstrings', glutei: 'glutes', adduttori: 'adductors', polpacci: 'calves', collo: 'neck' };
const HV_EQ = { bilanciere: 'barbell', ez: 'barbell', smith: 'barbell', manubri: 'dumbbell', kettlebell: 'kettlebell', elastici: 'resistance_band', corpo: 'none', macchinari: 'machine', cavi: 'machine' };
async function hvTemplateId(exId) {
  const e = EX[canon(exId)]; if (!e) return null;
  if (e.hv) return e.hv;
  const H = hvState(); if (H.custom[e.id]) return H.custom[e.id];
  // c'è già in Hevy (creato prima, anche da un tentativo non andato a buon fine)? Allora uso quello: niente doppioni
  const found = (await hvCustomList()).find(x => x.title.trim().toLowerCase() === e.n.trim().toLowerCase());
  if (found) { H.custom[e.id] = String(found.id); save(); return H.custom[e.id]; }
  const mob = e.pat === 'mobilita' || e.pat === 'ufficio';
  let r;
  try { r = await hvReq('POST', '/v1/exercise_templates', { exercise: {
    title: e.n, exercise_type: e.type === 'time' ? 'duration' : e.eq === 'corpo' ? 'reps_only' : 'weight_reps',
    equipment_category: HV_EQ[e.eq] || 'other', muscle_group: mob ? 'other' : (HV_MG[e.m] || 'other'),
    other_muscles: mob ? [] : (e.s || []).map(m => HV_MG[m]).filter((m, i, a) => m && m !== HV_MG[e.m] && a.indexOf(m) === i) } }); }
  catch (err) { hvSkip(e, err.message); return null; }
  // la risposta può essere {id}, {exercise_template: {id}}, solo l'id (numero o testo)
  const raw = r && r.error && typeof r.error.message === 'string' ? r.error.message.trim().replace(/^"|"$/g, '') : '';
  let id = typeof r === 'number' || typeof r === 'string' ? r : r && (r.id != null ? r.id : r.exercise_template_id != null ? r.exercise_template_id : r.exercise_template && r.exercise_template.id);
  if (id == null && /^[\w-]{4,64}$/.test(raw)) id = raw;
  if (id == null) { _hvCustom = null; const f2 = (await hvCustomList()).find(x => x.title.trim().toLowerCase() === e.n.trim().toLowerCase()); if (f2) id = f2.id; }
  if (id == null) { hvSkip(e, 'risposta di Hevy senza id'); return null; }
  H.custom[e.id] = String(id); save();
  return H.custom[e.id];
}
/* esercizi personalizzati già presenti nel tuo Hevy (letti una volta per sessione) */
let _hvCustom = null;
async function hvCustomList() {
  if (_hvCustom) return _hvCustom;
  const out = [];
  for (let p = 1; p <= 20; p++) {
    const r = await hvReq('GET', '/v1/exercise_templates?page=' + p + '&pageSize=100');
    (r.exercise_templates || []).forEach(x => { if (x.is_custom) out.push({ id: x.id, title: x.title || '' }); });
    if (!r.page_count || p >= r.page_count) break;
  }
  return (_hvCustom = out);
}
/* esercizio che Hevy non ha accettato: la routine si crea lo stesso, senza di lui, e lo dico */
function hvSkip(e, why) {
  const H = hvState(); H.skipped = H.skipped || {};
  if (!H.skipped[e.id]) toast('Hevy non ha accettato "' + e.n + '": per ora lo salto (' + String(why || '').slice(0, 80) + ')');
  H.skipped[e.id] = { d: Date.now(), why: String(why || '').slice(0, 200) }; save();
}
/* esercizio di Coach da un esercizio di Hevy (anche personalizzato) */
function exFromHv(h, title) {
  const H = hvState();
  const own = Object.keys(H.custom).find(k => H.custom[k] === h); if (own) return canon(own);
  const c = Object.keys(HV_OF).find(k => HV_OF[k] === h); if (c) return c;
  if (EX['hv_' + h]) return 'hv_' + h;
  // personalizzato creato da te in Hevy: lo aggiungo a Coach con il suo nome
  const id = 'hv_' + h;
  H.extra = H.extra || {};
  H.extra[id] = H.extra[id] || { id, n: title || 'Esercizio Hevy', m: 'addome', s: [], eq: 'altro', pat: 'altro', steps: [], err: [], tip: '', type: 'reps', comp: false, lvl: 2, niche: true, hv: h, hvT: title };
  EX[id] = H.extra[id];
  return id;
}

/* ---------- routine di Hevy da una scheda di Coach ---------- */
const hvKey = t => t.hvKey || t.preset || t.quick || 'u_' + t.id;
/* sedute del momento (a casa, versione breve, dal trainer, ripetute): una sola routine "Oggi" che si riscrive ogni volta */
function hvLaunchKey(t) {
  if (S.templates.some(x => x.id === t.id)) return hvKey(t);
  if (t.quick && /^q_/.test(t.quick)) return t.quick;
  return t.kind === 'circuito' ? 'oggi_circuito' : 'oggi';
}
function hvTitle(t) { return 'Coach · ' + t.name; }
/* dopo ogni cambio delle schede (percorso, traguardi, modifiche): Hevy si aggiorna da solo */
let _hvSoonT = null;
function hvSoon() { if (!hvOn()) return; clearTimeout(_hvSoonT); _hvSoonT = setTimeout(() => hvSync().catch(e => toast(e.message || 'Hevy non risponde')), 1500); }
const _syncRemHv = syncReminders;
syncReminders = function () { _syncRemHv(); hvSoon(); };
async function hvRoutineBody(t) {
  const H = hvState(), circ = t.kind === 'circuito', exs = [], plan = [], ssMap = {};
  const hvSuperset = k => { if (!(k in ssMap)) ssMap[k] = Object.keys(ssMap).length; return ssMap[k]; };
  const items = t.items.map(i => Object.assign({}, i, { ex: canon(i.ex) }));
  for (const src of items) {
    const e = EX[src.ex]; if (!e) continue;
    const tid = await hvTemplateId(src.ex);
    if (!tid) continue;
    if (circ) {
      // circuito: ogni stazione ha una serie per giro, tutte nella stessa superserie (Hevy le alterna)
      const timed = e.type === 'time' || src.secs;
      exs.push({ exercise_template_id: tid, superset_id: 0, rest_seconds: t.restEx || 15,
        notes: timed ? (src.secs || 40) + ' s di lavoro' : (src.reps || 10) + ' ripetizioni',
        sets: Array.from({ length: Math.max(1, t.rounds || 1) }, () => timed ? { type: 'normal', duration_seconds: src.secs || 40 } : { type: 'normal', reps: src.reps || 10 }) });
      plan.push({ ex: src.ex, sets: t.rounds || 1, secs: src.secs || 0 });
      continue;
    }
    const it = newItem(src, 'scheda'), timed = e.type === 'time';
    const prog = deloadActive() ? null : progression(src.ex, it.rmin, it.rmax);
    const rir = rirFor(it.role);
    const sets = it.sets.map(s => {
      if (timed) return { type: 'normal', duration_seconds: num(s.pr) || src.secs || 40 };
      const o = { type: 'normal', rep_range: { start: it.rmin, end: it.rmax } };
      if (num(s.pk) > 0) o.weight_kg = num(s.pk);
      if (num(s.pr) > 0) o.reps = num(s.pr);
      return o;
    });
    // il riscaldamento sui multiarticolari principali (serie "warmup" di Hevy, non contano nel volume)
    const wk = Math.max(0, ...it.sets.map(s => num(s.pk)));
    const wu = it.role === 'main' && wk ? warmupSets(src.ex, wk).map(w => ({ type: 'warmup', weight_kg: w.kg, reps: w.reps })) : [];
    const notes = [timed ? 'Tieni la posizione con forma perfetta.' : (it.role === 'main' ? 'Principale' : ROLE_N[it.role] || '') + ': ' + it.rmin + (it.rmax !== it.rmin ? '–' + it.rmax : '') + ' rip, ' + rir + ' rip di scorta (RPE ' + rpeOf(rir) + ').',
      prog && prog.text ? prog.text : '', deloadActive() ? 'Settimana di scarico: lontano dal cedimento.' : ''].filter(Boolean).join(' ');
    exs.push({ exercise_template_id: tid, superset_id: src.ss != null && src.ss !== '' ? hvSuperset(src.ss) : null, rest_seconds: it.rest || null, notes: notes.slice(0, 500), sets: wu.concat(sets) });
    plan.push({ ex: src.ex, role: it.role, sets: sets.length, rmin: it.rmin, rmax: it.rmax, rir, kg: wk, reps: it.sets.map(s => num(s.pr)), secs: timed ? (num(it.sets[0] && it.sets[0].pr) || src.secs || 40) : 0 });
  }
  const notes = [t.focus, t.note, typeof cycleInfo === 'function' && cycleInfo().on ? cycleLine() : ''].filter(Boolean).join(' · ').slice(0, 900);
  return { body: { title: hvTitle(t), notes, exercises: exs }, plan };
}
/* "2–3" ripetizioni di scorta -> RPE 7–8 (RPE = 10 − RIR) */
function rpeOf(rir) { const p = String(rir).split(/[–-]/).map(Number); return p.length > 1 ? (10 - p[1]) + '–' + (10 - p[0]) : String(10 - p[0]); }
function cycleLine() { try { const c = cycleInfo(); return c.deload ? 'Settimana di scarico' : 'Settimana ' + c.w + (c.len ? ' di ' + c.len : ''); } catch (e) { return ''; } }

async function hvFolder() {
  const H = hvState(); if (H.folder) return H.folder;
  // cerca la cartella "Coach" (se l'app è stata reinstallata) prima di crearne una nuova
  for (let p = 1; p <= 5; p++) {
    const r = await hvReq('GET', '/v1/routine_folders?page=' + p + '&pageSize=10');
    const f = (r.routine_folders || []).find(x => x.title === 'Coach'); if (f) { H.folder = f.id; return f.id; }
    if (!r.page_count || p >= r.page_count) break;
  }
  const r = await hvReq('POST', '/v1/routine_folders', { routine_folder: { title: 'Coach' } });
  H.folder = (r.routine_folder || r).id; save(); return H.folder;
}

/* crea o aggiorna la routine di una scheda; ritorna l'id Hevy */
async function hvPush(t) {
  const H = hvState(), key = hvKey(t), rec = H.routines[key];
  const { body, plan } = await hvRoutineBody(t);
  const bsig = JSON.stringify(body);
  if (rec && rec.id && rec.body === bsig && !rec.archived) return rec.id; // niente di nuovo: non disturbo Hevy
  let r;
  if (rec && rec.id) {
    try { r = await hvReq('PUT', '/v1/routines/' + rec.id, { routine: body }); }
    catch (e) { if (!/\(404\)/.test(e.message)) throw e; r = null; } // routine cancellata in Hevy: la ricreo
  }
  if (!r) r = await hvReq('POST', '/v1/routines', { routine: Object.assign({ folder_id: await hvFolder() }, body) });
  const ro = Array.isArray(r.routine) ? r.routine[0] : (r.routine || r);
  H.routines[key] = { id: ro.id, at: Date.parse(ro.updated_at) || Date.now(), name: t.name, tpl: t.id, sig: hvSig(ro), temp: /^(oggi|q_)/.test(key), body: bsig };
  // le versioni precedenti restano: ogni seduta si valuta con la routine che c'era quando l'hai iniziata
  const hist = (H.plans[ro.id] && H.plans[ro.id].prev) || [];
  if (H.plans[ro.id]) hist.push(Object.assign({}, H.plans[ro.id], { prev: undefined }));
  H.plans[ro.id] = { at: Date.now(), name: t.name, key, kind: t.kind || 'scheda', items: plan, prev: hist.slice(-6) };
  save();
  return ro.id;
}
/* impronta della routine (esercizi, serie, ripetizioni, recuperi) per capire se l'hai cambiata tu in Hevy */
function hvSig(ro) {
  return (ro.exercises || []).map(x => x.exercise_template_id + ':' + (x.sets || []).filter(s => s.type !== 'warmup').length + ':' + (x.rest_seconds || 0)).join('|');
}

/* tutte le schede di Coach in Hevy (dopo il percorso, un traguardo o una valutazione) */
let _hvPushing = null;
async function hvPushAll() {
  if (!hvOn()) return;
  if (_hvPushing) return _hvPushing;
  _hvPushing = (async () => {
    const H = hvState(), keys = new Set();
    for (const t of S.templates) {
      if (!t.items || !t.items.length) continue;
      const k = hvKey(t); if (keys.has(k)) continue; keys.add(k);
      await hvPush(t);
    }
    // schede che il percorso non usa più: restano in Hevy (l'API non le cancella) ma con il nome "Archivio"
    for (const k of Object.keys(H.routines)) {
      const rec = H.routines[k];
      if (keys.has(k) || rec.temp || rec.archived) continue;
      try { const r = await hvReq('GET', '/v1/routines/' + rec.id); const ro = r.routine || r; await hvReq('PUT', '/v1/routines/' + rec.id, { routine: { title: 'Archivio · ' + (rec.name || ro.title), notes: 'Non più nel percorso di Coach.', exercises: (ro.exercises || []).map(x => ({ exercise_template_id: x.exercise_template_id, superset_id: x.superset_id, rest_seconds: x.rest_seconds, notes: x.notes, sets: (x.sets || []).map(s => ({ type: s.type, weight_kg: s.weight_kg, reps: s.reps, duration_seconds: s.duration_seconds, distance_meters: s.distance_meters })) })) } }); rec.archived = true; }
      catch (e) { rec.archived = true; }
    }
    H.pushedAt = Date.now(); save();
  })();
  try { await _hvPushing; } finally { _hvPushing = null; }
}

/* ---------- da Hevy a Coach: allenamenti fatti ---------- */
/* la routine com'era quando hai iniziato la seduta */
function hvPlanAt(rid, start) {
  const P = hvState().plans[rid]; if (!P) return null;
  const all = (P.prev || []).concat([P]).filter(x => x.at <= start + 30 * 60000);
  return all.length ? all[all.length - 1] : null;
}
function hvToHistory(w) {
  const H = hvState(), items = [], cardio = [];
  (w.exercises || []).forEach(x => {
    const h = x.exercise_template_id;
    if (hvIsCardio(h)) {
      const sec = (x.sets || []).reduce((a, s) => a + num(s.duration_seconds), 0), m = (x.sets || []).reduce((a, s) => a + num(s.distance_meters), 0);
      const k = Object.keys(HV_CARDIO_IT).find(k => (HV[h][1] || '').toLowerCase().includes(k));
      if (sec || m) cardio.push({ type: HV_CARDIO_IT[k] || HV[h][0], min: Math.round(sec / 60), km: Math.round(m / 10) / 100 });
      return;
    }
    const ex = exFromHv(h, x.title), timed = (EX[ex] || {}).type === 'time';
    const sets = (x.sets || []).map(s => ({ kg: num(s.weight_kg), reps: timed || (!num(s.reps) && num(s.duration_seconds)) ? num(s.duration_seconds) : num(s.reps), done: true, wu: s.type === 'warmup', fail: s.type === 'failure', drop: s.type === 'dropset', rpe: s.rpe != null ? num(s.rpe) : null }))
      .filter(s => s.reps > 0 || s.kg > 0);
    if (sets.length) items.push({ ex, sets, note: x.notes || '' });
  });
  const plan = w.routine_id ? H.plans[w.routine_id] : null;
  const key = plan ? plan.key : Object.keys(H.routines).find(k => H.routines[k].id === w.routine_id);
  const tpl = S.templates.find(t => key && hvKey(t) === key);
  const h = { id: 'hv_' + w.id, hv: w.id, name: (w.title || '').replace(/^Coach · /, '') || 'Allenamento', kind: plan ? plan.kind : 'scheda', start: Date.parse(w.start_time), end: Date.parse(w.end_time) || Date.parse(w.start_time), items, cardio, routine: w.routine_id || null, tplId: tpl ? tpl.id : null };
  if (w.description) h.note = w.description;
  if (key && /^q_/.test(key)) { h.quick = key; h.zone = (QUICK_ROUTINES.find(q => q.key === key) || {}).zone; }
  if (key === 'f_funz' || key === 'f_mob') { h.quick = key; h.zone = 'allenamento'; }
  if (!items.length && cardio.length) h.kind = 'cardio';
  return h;
}

/* scarica le novità da Hevy (nuovi allenamenti, modifiche, cancellazioni), valuta e aggiorna le routine */
let _hvSyncing = null;
async function hvSync(opts) {
  opts = opts || {};
  if (!hvOn()) return null;
  if (_hvSyncing) return _hvSyncing;
  _hvSyncing = (async () => {
    const H = hvState(), nuovi = [];
    if (!H.first) {
      // primo collegamento: lo storico di Coach riparte da quello di Hevy (scelta dell'utente)
      S.history = []; S.active = null; H.since = '1970-01-01T00:00:00Z'; H.first = Date.now();
    }
    const since = H.since || '1970-01-01T00:00:00Z';
    let page = 1, pages = 1, last = since;
    while (page <= pages && page <= 60) {
      const r = await hvReq('GET', '/v1/workouts/events?page=' + page + '&pageSize=10&since=' + encodeURIComponent(since));
      pages = r.page_count || 1;
      (r.events || []).forEach(ev => {
        if (ev.type === 'deleted') { S.history = S.history.filter(h => h.hv !== ev.id); if (ev.deleted_at > last) last = ev.deleted_at; return; }
        const w = ev.workout; if (!w) return;
        const h = hvToHistory(w), i = S.history.findIndex(x => x.hv === w.id);
        if (i >= 0) { h.val = null; S.history[i] = h; } else { S.history.push(h); nuovi.push(h); }
        if ((w.updated_at || '') > last) last = w.updated_at;
      });
      page++;
    }
    S.history.sort((a, b) => a.start - b.start);
    H.since = last; H.syncAt = Date.now();
    // pause attive e circuiti fatti in Hevy: valgono come stelle
    nuovi.filter(h => h.quick && h.zone === 'ufficio').forEach(h => { S.breaks = (S.breaks || []).concat([{ d: h.end, key: h.quick, zone: h.zone, min: Math.max(1, Math.round((h.end - h.start) / 60000)) }]); });
    // valutazione di tutte le sedute non ancora valutate, dalla più vecchia (ognuna confrontata solo con quelle prima)
    const first = !H.firstDone;
    const daValutare = S.history.filter(h => !h.val && h.items.length && !h.quick);
    daValutare.forEach(h => { h.val = evaluateWorkout(h); });
    H.firstDone = true;
    save(true);
    // modifiche fatte da te alle routine di Coach in Hevy
    let adopted = [];
    // prima di riscrivere le routine controllo se le hai cambiate tu in Hevy, così non perdo le tue modifiche
    try { adopted = await hvAdopt(); } catch (e) { console.warn(e); }
    if (opts.push !== false) await hvPushAll();
    return { nuovi, adopted, valutate: daValutare, first };
  })();
  try { return await _hvSyncing; } finally { _hvSyncing = null; }
}

/* ---------- modifiche fatte in Hevy: Coach le adotta ---------- */
async function hvAdopt() {
  const H = hvState(), out = [];
  for (const key of Object.keys(H.routines)) {
    const rec = H.routines[key]; if (rec.archived || rec.temp) continue;
    let ro; try { const r = await hvReq('GET', '/v1/routines/' + rec.id); ro = r.routine || r; } catch (e) { continue; }
    if (!ro || !ro.exercises) continue;
    const at = Date.parse(ro.updated_at) || 0;
    if (at <= rec.at + 5000 || hvSig(ro) === rec.sig) continue; // non l'hai toccata
    const plan = H.plans[rec.id]; if (!plan) continue;
    const tpl = S.templates.find(t => hvKey(t) === key); if (!tpl || tpl.kind === 'circuito') { rec.at = at; rec.sig = hvSig(ro); continue; }
    const nowEx = ro.exercises.map(x => ({ ex: exFromHv(x.exercise_template_id, x.title), x }));
    const before = plan.items.map(p => p.ex), after = nowEx.map(n => n.ex);
    const E2 = H.edits[key] = H.edits[key] || { add: [], del: [], over: {} };
    const removed = before.filter(id => !after.includes(id)), added = after.filter(id => !before.includes(id));
    // sostituzione: stesso posto nella routine -> resta anche quando il percorso rigenera le schede
    removed.slice().forEach(id => {
      const pos = before.indexOf(id), rep = added.find(a => after.indexOf(a) === pos) || (removed.length === 1 && added.length === 1 ? added[0] : null);
      if (rep) {
        S.stepLog = (S.stepLog || []).concat([{ d: Date.now(), from: id, to: rep, hevy: true }]).slice(-80);
        removed.splice(removed.indexOf(id), 1); added.splice(added.indexOf(rep), 1);
        out.push({ k: 'swap', from: id, to: rep, warn: hvWarn(rep) });
      }
    });
    added.forEach(id => { const n = nowEx.find(z => z.ex === id); E2.add = E2.add.filter(a => a.ex !== id).concat([hvItemFrom(n.x, id)]); E2.del = E2.del.filter(d => d !== id); out.push({ k: 'add', to: id, warn: hvWarn(id) }); });
    removed.forEach(id => { E2.del = E2.del.filter(d => d !== id).concat([id]); E2.add = E2.add.filter(a => a.ex !== id); out.push({ k: 'del', from: id }); });
    // serie, ripetizioni e recuperi cambiati
    nowEx.forEach(n => {
      const p = plan.items.find(i => i.ex === n.ex); if (!p || p.secs) return;
      const ws = (n.x.sets || []).filter(s => s.type !== 'warmup'), rr = ws.find(s => s.rep_range && s.rep_range.start) ;
      const o = {};
      if (ws.length && ws.length !== p.sets) o.sets = ws.length;
      if (rr && (rr.rep_range.start !== p.rmin || rr.rep_range.end !== p.rmax)) { o.rmin = rr.rep_range.start; o.rmax = rr.rep_range.end || rr.rep_range.start; }
      if (n.x.rest_seconds && Math.abs(n.x.rest_seconds - (tpl.items.find(i => canon(i.ex) === n.ex) || {}).rest) >= 15) o.rest = n.x.rest_seconds;
      if (Object.keys(o).length) { E2.over[n.ex] = Object.assign(E2.over[n.ex] || {}, o); out.push({ k: 'over', to: n.ex, o }); }
    });
    rec.at = at; rec.sig = hvSig(ro);
  }
  if (out.length) {
    S.hvAdopted = (S.hvAdopted || []).concat(out.map(o => Object.assign({ d: Date.now() }, o))).slice(-30);
    if (typeof regenPath === 'function' && pathOn()) regenPath(); else applyHvEdits(S.templates);
    save(true);
  }
  return out;
}
function hvItemFrom(x, id) {
  const ws = (x.sets || []).filter(s => s.type !== 'warmup'), rr = ws.find(s => s.rep_range && s.rep_range.start);
  const p = prescribe(id);
  if (ws.length) p.sets = ws.length;
  if (rr) { p.rmin = rr.rep_range.start; p.rmax = rr.rep_range.end || rr.rep_range.start; }
  if (x.rest_seconds) p.rest = x.rest_seconds;
  return p;
}
/* l'esercizio scelto da te va contro un dolore segnalato, il luogo o il livello? */
function hvWarn(id) {
  const e = EX[id]; if (!e) return '';
  if (typeof okFor === 'function' && !okFor(id)) {
    const z = (S.profile.pain || []).find(z => painHit(e, z));
    if (z) return 'Attenzione: ' + e.n + ' carica la zona che ti fa male (' + (PAIN_ZONES[z] || z).toLowerCase() + '). Lo tengo perché l\'hai scelto tu, ma se senti dolore cambialo.';
    return 'Attenzione: ' + e.n + ' non è tra gli esercizi consigliati per il tuo profilo (luogo, attrezzi o peso).';
  }
  return '';
}
function applyHvEdits(T) {
  const H = hvState();
  T.forEach(t => {
    const E2 = H.edits[hvKey(t)]; if (!E2 || t.kind === 'circuito') return;
    t.items = t.items.filter(it => !E2.del.includes(canon(it.ex))).map(it => { const o = E2.over[canon(it.ex)]; return o ? Object.assign({}, it, o) : it; });
    E2.add.forEach(a => { if (!t.items.some(it => canon(it.ex) === a.ex)) t.items.push(Object.assign({}, a)); });
  });
  return T;
}
const _bdtHv = buildDefaultTemplates;
buildDefaultTemplates = function () { return applyHvEdits(_bdtHv()); };

/* ---------- avvio di una seduta: la routine di oggi va in Hevy e si apre Hevy ---------- */
async function hvLaunch(t) {
  if (!hvOn()) { UI.hvAfter = t || null; go('hevySetup'); toast('Collega Hevy per allenarti: Coach prepara la seduta, Hevy la registra.'); return; }
  if (!t) { hvOpenApp(); return; }
  const key = hvLaunchKey(t);
  toast('Preparo la seduta in Hevy…');
  try {
    // se hai cambiato la routine in Hevy, prima adotto le tue modifiche (altrimenti le riscriverei)
    const ad = await hvAdopt();
    if (ad.length) { const nt = S.templates.find(x => hvKey(x) === key); if (nt) t = Object.assign({}, nt, { items: nt.items.map(i => Object.assign({}, i, (t.items.find(o => canon(o.ex) === canon(i.ex)) || {}).less ? { less: 1 } : {})) }); toast('Ho tenuto le modifiche che hai fatto in Hevy'); }
    const id = await hvPush(Object.assign({}, t, { hvKey: key }));
    S.hevy.launch = { d: Date.now(), key, id, name: t.name }; save(true);
    hvOpenApp();
  } catch (e) { toast(e.message || 'Hevy non risponde'); }
}
function hvOpenApp() {
  if (Native.has() && window.Android.openApp) window.Android.openApp(HEVY_PKG);
  else toast('Apri Hevy: la seduta è nella cartella Coach.');
}

/* ---------- impostazioni: collegamento ---------- */
VIEWS.hevySetup = () => {
  const H = hvState(), on = hvOn();
  return header('Collega Hevy', { back: true, sub: 'Coach decide, Hevy registra' }) + '<div class="pad">' +
    '<div class="card"><p><b>Come funziona</b></p><ul class="tips">' +
      '<li>Le tue schede diventano routine di Hevy nella cartella <b>Coach</b>, con serie, ripetizioni, recuperi e carichi di oggi.</li>' +
      '<li>Ti alleni in Hevy come sempre. Quando riapri Coach, la seduta viene <b>valutata</b> e la prossima è già aggiornata in Hevy.</li>' +
      '<li>Se cambi un esercizio in Hevy, Coach lo adotta e continua da lì.</li></ul></div>' +
    (on ? '<div class="note good">' + ic('check', 'inline') + 'Collegato' + (H.syncAt ? ' · ultimo aggiornamento ' + new Date(H.syncAt).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '') + '</div>' +
      '<button class="btn wide" data-act="hvSyncNow">' + ic('swap') + 'Aggiorna adesso</button>' +
      '<button class="btn ghost wide" data-act="hvOpen">' + ic('play') + 'Apri Hevy</button>' +
      '<button class="btn danger ghost wide" data-act="hvOff">Scollega</button>'
    : '<div class="card"><p><b>1.</b> Su <b>hevy.com</b> → Settings → Developer (serve Hevy Pro) genera la chiave API e copiala.</p>' +
      '<button class="btn ghost wide" data-act="hvKeyPage">' + ic('book') + 'Apri la pagina della chiave</button>' +
      '<p><b>2.</b> Incollala qui. Resta solo su questo telefono.</p>' +
      field('Chiave API di Hevy', '<input type="text" id="hv-key" autocomplete="off" placeholder="xxxxxxxx-xxxx-…">') +
      '<button class="btn ghost wide" data-act="hvPaste">Incolla</button>' +
      '<button class="btn wide big" data-act="hvConnect"' + (UI.hvBusy ? ' disabled' : '') + '>' + (UI.hvBusy ? 'Collego…' : 'Collega') + '</button>' +
      '<p class="small muted">Al primo collegamento lo storico degli allenamenti di Coach viene sostituito da quello di Hevy. Peso, misure, alimentazione e percorso restano.</p></div>') +
    '</div>';
};
Object.assign(ACT, {
  hvSetup: () => go('hevySetup'),
  hvKeyPage: () => Native.openUrl('https://hevy.com/settings?developer'),
  hvOpen: () => hvOpenApp(),
  hvPaste: () => { try { const v = Native.has() && window.Android.clipboard ? window.Android.clipboard() : ''; const el = document.getElementById('hv-key'); if (el && v) el.value = String(v).trim(); } catch (e) { } },
  hvConnect: async () => {
    const el = document.getElementById('hv-key'), k = String((el && el.value) || '').replace(/[\s"'`]/g, '');
    if (!/^[0-9a-f-]{20,}$/i.test(k)) { toast('La chiave non sembra giusta: copiala di nuovo da hevy.com'); return; }
    const H = hvState(); H.key = k; UI.hvBusy = true; render();
    try {
      await hvReq('GET', '/v1/workouts/count');
      const r = await hvSync();
      UI.hvBusy = false; toast('Hevy collegato' + (r && r.nuovi.length ? ': ' + r.nuovi.length + ' allenamenti importati' : ''));
      const t = UI.hvAfter; UI.hvAfter = null; go('home', null, true); if (t) hvLaunch(t);
    } catch (e) {
      // chiave sbagliata: la tolgo; altri errori: resto collegato e si riprova con "Aggiorna adesso"
      if (/rifiuta la chiave/.test(e.message || '')) H.key = '';
      UI.hvBusy = false; save(); render(); toast(e.message || 'Collegamento non riuscito');
    }
  },
  hvSyncNow: () => hvSyncUI(true),
  hvOff: () => ask('Scollegare Hevy? Le routine restano in Hevy, lo storico in Coach.', 'Scollega', () => { S.hevy.key = ''; save(true); render(); }, true)
});

/* aggiornamento all'apertura e quando torni su Coach da Hevy */
async function hvSyncUI(manual) {
  if (!hvOn()) { if (manual) go('hevySetup'); return; }
  if (manual) toast('Aggiorno da Hevy…');
  try {
    const r = await hvSync({ manual: !!manual });
    if (!r) return;
    const v = r.valutate.filter(h => r.nuovi.includes(h)).slice(-1)[0];
    (r.adopted || []).filter(a => a.warn).forEach(a => setTimeout(() => toast(a.warn), 600));
    if (v && !r.first && current().v !== 'hevySetup') go('valutazione', { id: v.id });
    else { if (manual) toast(r.nuovi.length ? r.nuovi.length + ' allenamenti nuovi' : 'Tutto aggiornato'); render(); }
  } catch (e) { if (manual) toast(e.message || 'Hevy non risponde'); }
}
let _hvLastAuto = 0;
function hvAuto() { if (hvOn() && Date.now() - _hvLastAuto > 60000) { _hvLastAuto = Date.now(); hvSyncUI(false); } }
document.addEventListener('visibilitychange', () => { if (!document.hidden) hvAuto(); });
window.addEventListener('focus', hvAuto);
setTimeout(hvAuto, 1200);

/* card in home: finché Hevy non è collegato è la cosa più importante */
function hevyCard() {
  if (hvOn()) return '';
  return '<button class="card trainer" data-act="hvSetup"><div class="eyebrow">' + ic('sparkle', 'inline') + 'Primo passo</div><p><b>Collega Hevy</b><br><small class="muted">Ti alleni in Hevy, io preparo le schede con i carichi di oggi e valuto ogni seduta.</small></p></button>';
}
