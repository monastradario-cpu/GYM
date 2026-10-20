/* GYM — azioni (tocchi) e campi di testo, avvio */
'use strict';

function weightSheet() {
  const last = S.weights[S.weights.length - 1];
  return '<h3>' + ic('scale', 'inline') + 'Registra il peso</h3>' + field('Peso (kg)', numIn('', 'data-in="wIn" id="w-in"', last ? fmtKg(last.kg) : 'es. 75')) +
    '<button class="btn wide" data-act="saveWeight">Salva</button>';
}
function plainSheet(html) { return html; }

const ACT = {
  tab: d => { if (d.v === 'coach' && !UI.coach.muscles.length) UI.coach.result = null; go(d.v); },
  go: d => go(d.v),
  back: () => back(),
  closeSheet: () => closeSheet(),
  confirmOk: () => { const cb = confirmCb; confirmCb = null; closeSheet(); if (cb) cb(); },
  openUrl: d => Native.openUrl(d.u),

  /* home */
  startTemplate: d => { if (S.active) { go('workout'); return; } startWorkout(S.templates.find(t => t.id === d.id)); },
  startEmpty: () => { if (S.active) { go('workout'); return; } startWorkout(null); },
  openWorkout: () => go('workout'),
  water: d => { const k = todayKey(); S.water[k] = Math.max(0, (S.water[k] || 0) + (+d.d)); save(); render(); },
  addWeight: () => { openSheet(weightSheet); setTimeout(() => { const i = document.getElementById('w-in'); if (i) i.focus(); }, 50); },
  saveWeight: () => { const v = num((document.getElementById('w-in') || {}).value); if (v < 20 || v > 400) { toast('Inserisci un peso valido'); return; } S.weights.push({ d: Date.now(), kg: v }); save(true); closeSheet(); render(); toast('Peso salvato'); },
  delWeight: d => ask('Eliminare questa pesata?', 'Elimina', () => { S.weights.splice(+d.n, 1); save(); render(); }, true),
  cardio: () => { UI.cardio = null; openSheet(cardioSheet); },
  cardioType: d => { UI.cardio.type = d.t; rerenderSheet(); },
  saveCardio: () => {
    const c = UI.cardio; if (!num(c.min)) { toast('Inserisci i minuti'); return; }
    const rec = { type: c.type, min: num(c.min), km: num(c.km), lvl: c.lvl };
    if (S.active) S.active.cardio.push(rec);
    else S.history.push({ id: uid(), name: 'Cardio · ' + c.type, kind: 'cardio', start: Date.now() - rec.min * 60000, end: Date.now(), items: [], cardio: [rec] });
    save(true); closeSheet(); render(); toast('Cardio salvato');
  },

  /* schede */
  schedeTab: d => { UI.schede = d.t; render(); },
  presets: () => openSheet(presetsSheet),
  addPreset: d => { S.templates.push(makeTemplateFromPreset(d.k, [])); save(); closeSheet(); UI.schede = 'schede'; render(); toast('Scheda aggiunta'); },
  addCircuit: d => { S.templates.push(makeCircuit(PRESET_CIRCUITS.find(c => c.key === d.k))); save(); closeSheet(); UI.schede = 'circuiti'; render(); toast('Circuito aggiunto'); },
  regen: () => ask('Rigenerare le schede per i tuoi giorni? Le schede con giorni assegnati verranno sostituite; le altre restano.', 'Rigenera', () => {
    const fresh = buildDefaultTemplates();
    const keep = S.templates.filter(t => t.kind === 'circuito' || !(t.days || []).length);
    keep.forEach(t => { t.days = []; });
    const hasCirc = keep.some(t => t.kind === 'circuito');
    S.templates = fresh.filter(t => t.kind !== 'circuito').concat(keep, hasCirc ? [] : fresh.filter(t => t.kind === 'circuito'));
    save(); syncReminders(); render(); toast('Schede aggiornate');
  }),
  newTemplate: d => {
    if (d.k !== 'circuito' && !d.blank) { openSheet(() => '<h3>Nuova scheda</h3><button class="list-item btnlike" data-act="coachFromNew"><div><b>Creala con il trainer</b><small>Scegli muscoli, attrezzi e durata: ti propongo più opzioni</small></div>' + ic('coach') + '</button><button class="list-item btnlike" data-act="newTemplate" data-k="scheda" data-blank="1"><div><b>Scheda vuota</b><small>Aggiungi tu gli esercizi</small></div>' + ic('plus') + '</button>'); return; }
    closeSheet(); UI.edit = d.k === 'circuito' ? { id: uid(), kind: 'circuito', name: 'Nuovo circuito', days: [], rounds: 4, restEx: 15, restRound: 120, warm: 8, cool: 5, work: 45, items: [] } : { id: uid(), kind: 'scheda', name: 'Nuova scheda', days: [], items: [] }; go('edit'); },
  editTemplate: d => { UI.edit = JSON.parse(JSON.stringify(S.templates.find(t => t.id === d.id))); go('edit'); },
  editDay: d => { const t = UI.edit, x = +d.d; t.days = t.days.includes(x) ? t.days.filter(y => y !== x) : t.days.concat(x); render(); },
  editMove: d => { const a = UI.edit.items, n = +d.n, m = n + (+d.d); if (m < 0 || m >= a.length) return; [a[n], a[m]] = [a[m], a[n]]; render(); },
  editDel: d => { UI.edit.items.splice(+d.n, 1); render(); },
  editSwap: d => openSwap(UI.edit.items[+d.n].ex, 'editDoSwap', +d.n, { used: UI.edit.items.map(x => x.ex) }),
  editDoSwap: d => { const it = UI.edit.items[+d.n], timed = EX[d.id].type === 'time'; it.ex = d.id; if (timed && !it.secs) it.secs = 40; if (UI.edit.kind === 'circuito') { if (timed) it.reps = 0; else { it.secs = 0; it.reps = it.reps || 12; } } closeSheet(); render(); },
  editAdd: () => pickExercise(id => { const t = UI.edit; t.items.push(t.kind === 'circuito' ? { ex: id, reps: EX[id].type === 'time' ? 0 : 12, secs: EX[id].type === 'time' ? 40 : 0 } : prescribe(id)); render(); }),
  saveTemplate: () => {
    const t = UI.edit; if (!t.items.length) { toast('Aggiungi almeno un esercizio'); return; }
    t.name = (t.name || '').trim() || 'Scheda';
    if (t.days.length) S.templates.forEach(o => { if (o.id !== t.id) o.days = (o.days || []).filter(x => !t.days.includes(x)); });
    const i = S.templates.findIndex(x => x.id === t.id); if (i >= 0) S.templates[i] = t; else S.templates.push(t);
    save(); syncReminders(); UI.schede = t.kind === 'circuito' ? 'circuiti' : 'schede'; back(); toast('Salvato');
  },
  delTemplate: () => ask('Eliminare "' + UI.edit.name + '"?', 'Elimina', () => { S.templates = S.templates.filter(t => t.id !== UI.edit.id); save(); syncReminders(); back(); }, true),
  pickM: d => { UI.pick.m = d.m; rerenderSheet(); },
  pickEq: d => { UI.pick.eq = d.e; rerenderSheet(); },
  pickDo: d => { const cb = UI.pick.cb; closeSheet(); if (cb) cb(d.id); },

  /* allenamento */
  minimize: () => go('home', null, true),
  setDone: d => {
    if (S.active.circ) { const s0 = S.active.items[+d.n].sets[+d.k]; if (s0.done) { s0.done = false; save(); render(); } else circMark(+d.n, +d.k); return; }
    const it = S.active.items[+d.n], s = it.sets[+d.k];
    s.done = !s.done;
    if (s.done) {
      if (s.kg === '' && s.pk !== '') s.kg = s.pk;
      if (s.reps === '' && s.pr !== '') s.reps = s.pr;
      const items = S.active.items, idx = items.indexOf(it);
      const isLast = it.sets.every(x => x.done) && idx === items.length - 1;
      const mate = it.ss ? items.find((x, j) => j !== idx && x.ss === it.ss) : null;
      const mateFirst = mate && items.indexOf(mate) > idx;
      const mateSet = mate ? mate.sets.filter(x => !x.wu)[it.sets.filter(x => !x.wu).indexOf(s)] : null;
      if (!s.wu && mateFirst && mateSet && !mateSet.done) { stopRest(true); toast('Superserie: ora ' + (EX[mate.ex] || {}).n + ', senza pausa'); setTimeout(() => { const el = document.querySelectorAll('.ex-card')[items.indexOf(mate)]; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); }
      else if (S.settings.autoRest && !isLast) startRest(s.wu ? 60 : it.rest, (mate ? 'Superserie ' + it.ss : (EX[it.ex] || {}).n));
      Native.vibrate(40);
    }
    save(); render();
  },
  addSet: d => { const it = S.active.items[+d.n], l = it.sets.filter(s => !s.wu).pop() || {}; it.sets.push({ kg: '', reps: '', done: false, pk: l.kg !== '' && l.kg != null ? num(l.kg) : (l.pk || ''), pr: l.reps !== '' && l.reps != null ? num(l.reps) : (l.pr || it.rmax) }); save(); render(); },
  delSet: d => { const it = S.active.items[+d.n]; it.sets.pop(); save(); closeSheet(); render(); },
  warmup: d => {
    const it = S.active.items[+d.n], kg = num(d.kg);
    const auto = kg ? warmupSets(it.ex, kg) : [];
    if (auto.length) { it.sets = auto.map(s => Object.assign(s, { pk: s.kg, pr: s.reps, kg: '', reps: '' })).concat(it.sets); toast('Riscaldamento calcolato sul carico di lavoro (R)'); }
    else {
      // una serie di riscaldamento in più, leggera (circa metà carico, 12 ripetizioni)
      const wus = it.sets.filter(s => s.wu), lastW = wus[wus.length - 1], work = it.sets.find(s => !s.wu) || {};
      const base = num(work.kg) || num(work.pk), step = stepFor(it.ex);
      const pk = lastW ? (num(lastW.kg) || num(lastW.pk)) : (base ? Math.max(0, Math.round(base * 0.5 / step) * step) : '');
      const pk2 = lastW && base ? Math.min(base, Math.round(((num(lastW.kg) || num(lastW.pk)) + base) / 2 / step) * step) : pk;
      it.sets.splice(wus.length, 0, { kg: '', reps: '', done: false, wu: true, pk: pk2 === 0 ? '' : pk2, pr: lastW ? 8 : 12 });
      toast('Serie di riscaldamento aggiunta (R): carico leggero');
    }
    save(); render();
  },
  toggleWu: d => { const s = S.active.items[+d.n].sets[+d.k]; s.wu = !s.wu; const it = S.active.items[+d.n]; it.sets.sort((a, b) => (b.wu ? 1 : 0) - (a.wu ? 1 : 0)); save(); render(); toast(s.wu ? 'Segnata come riscaldamento (non conta nei record)' : 'Segnata come serie di lavoro'); },
  exMenu: d => openSheet(() => exMenuSheet(+d.n)),
  woMove: d => { const a = S.active.items, n = +d.n, m = n + (+d.d); if (m < 0 || m >= a.length) return; [a[n], a[m]] = [a[m], a[n]]; save(); closeSheet(); render(); },
  woDel: d => { S.active.items.splice(+d.n, 1); save(); closeSheet(); render(); },
  woAdd: () => pickExercise(id => { S.active.items.push(newItem(prescribe(id), 'scheda')); save(); render(); setTimeout(() => { const v = $('#view'); v.scrollTop = v.scrollHeight; }, 30); }),
  addToActive: d => { S.active.items.push(newItem(prescribe(d.id), 'scheda')); save(); go('workout'); toast('Aggiunto'); },
  swapEx: d => openSwap(S.active.items[+d.n].ex, 'doSwap', +d.n, { used: S.active.items.map(x => x.ex) }),
  doSwap: d => {
    const a = S.active, it = a.items[+d.n];
    if (a.circ) { it.ex = d.id; const l = lastPerformance(d.id); it.sets.forEach(s => { if (!s.done) s.pk = l ? num(l.sets[0].kg) : ''; }); }
    else { const fresh = newItem({ ex: d.id, rmin: it.rmin, rmax: it.rmax, rest: it.rest, sets: Math.max(1, it.sets.filter(s => !s.wu).length) }, 'scheda'); a.items[+d.n] = fresh; }
    save(); closeSheet(); render(); toast('Esercizio cambiato');
  },
  restSkip: () => { stopRest(true); render(); },
  restAdd: d => { const r = S.active.rest; if (!r) return; r.until = Math.max(Date.now() + 1000, r.until + (+d.s) * 1000); r.total = Math.max(r.total, (r.until - Date.now()) / 1000); Native.restTimer(Math.round((r.until - Date.now()) / 1000), r.label); save(); render(); },
  manualRest: () => openSheet(() => '<h3>' + ic('timer', 'inline') + 'Timer</h3><div class="grid3">' + [30, 45, 60, 90, 120, 180].map(s => '<button class="btn ghost" data-act="startRestN" data-s="' + s + '">' + fmtClock(s) + '</button>').join('') + '</div>'),
  startRestN: d => { closeSheet(); startRest(+d.s, 'Timer'); render(); },
  plates: d => { UI.plates = { kg: d.kg ? num(d.kg) : (UI.plates ? UI.plates.kg : 60), bar: UI.plates ? UI.plates.bar : 20 }; openSheet(platesSheet); },
  platesBar: d => { UI.plates.bar = +d.b; rerenderSheet(); },
  delCardio: d => { S.active.cardio.splice(+d.n, 1); save(); render(); },
  finish: () => {
    const a = S.active; if (!a) return;
    const pending = a.circ ? 0 : a.items.reduce((s, i) => s + i.sets.filter(x => !x.done && !x.wu).length, 0);
    if (pending && !a.circ) ask('Hai ancora ' + pending + ' serie non segnate. Terminare comunque?', 'Termina e salva', finishWorkout);
    else finishWorkout();
  },
  discard: () => ask('Annullare l\'allenamento senza salvare?', 'Annulla allenamento', () => { endActive(); go('home', null, true); }, true),
  circGo: () => { S.active.circ.phase = 'work'; stopRest(true); save(); render(); },
  circRest: d => { startRest(+d.s, d.l); render(); },
  circWork: () => { const a = S.active, it = a.items[a.circ.idx]; a.circ.workUntil = Date.now() + it.secs * 1000; Native.restTimer(it.secs, 'Stazione finita'); save(); render(); },
  circDone: () => { Native.cancelRest(); circDone(false); },
  circSkip: () => { Native.cancelRest(); circDone(true); },

  /* allenatore */
  coachM: d => { const c = UI.coach; c.muscles = c.muscles.includes(d.m) ? c.muscles.filter(x => x !== d.m) : c.muscles.concat(d.m); c.result = null; render(); },
  coachQuick: d => { UI.coach.muscles = d.q.split(','); UI.coach.result = null; render(); },
  coachFor: d => { UI.coach.muscles = d.q.split(','); coachGenerate(); go('coach'); },
  coachEq: d => { const c = UI.coach; c.eq = c.eq.includes(d.k) ? c.eq.filter(x => x !== d.k) : c.eq.concat(d.k); c.result = null; render(); },
  coachGo: () => { if (!UI.coach.muscles.length) { toast('Scegli almeno un muscolo'); return; } coachGenerate(Date.now()); render(); setTimeout(() => { const el = document.getElementById('proposal'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); },
  coachDur: d => { UI.coach.dur = +d.d; if (UI.coach.result) coachGenerate(UI.coach.result.seed); render(); },
  coachOpt: d => { UI.coach.result.sel = +d.i; render(); },
  coachSwap: d => { const items = UI.coach.result.options[UI.coach.result.sel].items; openSwap(items[+d.n].ex, 'coachDoSwap', +d.n, { eqs: coachEquip(), used: items.map(x => x.ex) }); },
  coachDoSwap: d => {
    const o = UI.coach.result.options[UI.coach.result.sel], items = o.items, old = items[+d.n], timed = EX[d.id].type === 'time';
    if (o.circuit) items[+d.n] = { ex: d.id, reps: timed ? 0 : (old.reps || 12), secs: timed ? 40 : 0 };
    else items[+d.n] = Object.assign(prescribe(d.id, old.role), { sets: old.sets, ss: old.ss });
    closeSheet(); render(); toast('Esercizio sostituito');
  },
  swapM: d => { UI.swap.m = d.m; rerenderSheet(); },
  swapPick: d => { const w = UI.swap; ACT[w.act]({ n: String(w.n), id: d.id }); },
  coachStart: () => {
    const o = UI.coach.result.options[UI.coach.result.sel], name = (o.k === 'classico' ? 'Allenamento ' : o.n + ' ') + UI.coach.muscles.map(m => MUSCLES[m]).join(', ');
    if (o.circuit) startWorkout(Object.assign({ id: null }, JSON.parse(JSON.stringify(o.circuit)), { name }));
    else startWorkout({ id: null, kind: 'scheda', name, items: JSON.parse(JSON.stringify(o.items)) });
  },
  coachSave: () => {
    const o = UI.coach.result.options[UI.coach.result.sel], base = UI.coach.muscles.map(m => MUSCLES[m]).join(' + ');
    const t = o.circuit ? Object.assign({ id: uid(), days: [] }, JSON.parse(JSON.stringify(o.circuit)), { name: 'Circuito ' + base })
      : { id: uid(), kind: 'scheda', name: (o.k === 'superserie' ? 'Superserie ' : '') + base, days: [], items: JSON.parse(JSON.stringify(o.items)) };
    S.templates.push(t); save(); UI.edit = JSON.parse(JSON.stringify(t)); go('edit'); toast('Salvata: puoi rinominarla e assegnare i giorni');
  },
  openAI: () => { if (!aiReady()) { go('settings'); setTimeout(() => { const el = document.querySelector('[data-in="aiKey"]'); if (el) el.scrollIntoView({ block: 'center' }); }, 50); toast('Inserisci una chiave API per attivare il coach AI'); return; } go('aichat'); },
  aiSugg: d => aiSend(d.t),
  aiSend: () => { const t = document.querySelector('[data-in="aiText"]'); aiSend(t ? t.value : ''); },

  coachFromNew: () => { closeSheet(); UI.coachTab = 'train'; go('coach'); toast('Scegli muscoli, attrezzi e durata'); },
  toggleBW: () => {
    S.profile.bodyweight = !bodyweightOn(); save();
    ask((bodyweightOn() ? 'Corpo libero incluso. ' : 'Corpo libero escluso. ') + 'Aggiorno anche le schede e i circuiti pronti? Quelli creati da te restano.', 'Aggiorna', () => { regenPresets(); toast('Schede e circuiti aggiornati'); });
    render();
  },
  reorder: d => { UI.reorderKey = d.k; openSheet(reorderSheet); },
  roMove: d => { moveItem(UI.reorderKey, +d.n, +d.n + (+d.d)); rerenderSheet(); render(); },
  circJump: d => {
    const c = S.active && S.active.circ; if (!c) return;
    const n = +d.n; if (c.phase !== 'work') c.phase = 'work';
    stopRest(true); c.workUntil = 0; c.idx = n; save(); render(); window.scrollTo(0, 0); document.getElementById('view').scrollTo({ top: 0, behavior: 'smooth' });
  },
  muscleDist: () => openSheet(muscleDistSheet),
  restPick: d => { const it = S.active.items[+d.n]; openSheet(() => '<h3>Recupero per ' + esc((EX[it.ex] || {}).n || '') + '</h3><p class="small muted">Il timer parte da solo quando segni una serie.</p><div class="grid3">' + REST_OPTS.map(s => '<button class="btn ' + (it.rest === s ? '' : 'ghost') + '" data-act="restSet" data-n="' + d.n + '" data-s="' + s + '">' + restLabel(s) + '</button>').join('') + '</div>'); },
  restSet: d => { S.active.items[+d.n].rest = +d.s; save(); closeSheet(); render(); },
  exNote: d => { const it = S.active.items[+d.n]; UI.noteN = +d.n; openSheet(() => '<h3>Nota</h3><p class="small muted">Es. regolazione del sedile, presa, sensazioni. La ritrovi la prossima volta.</p><textarea rows="4" id="note-in" placeholder="Scrivi una nota…">' + esc(it.note || '') + '</textarea><button class="btn wide" data-act="noteSave">Salva nota</button>'); setTimeout(() => { const t = document.getElementById('note-in'); if (t) t.focus(); }, 60); },
  noteSave: () => { const it = S.active.items[UI.noteN]; it.note = (document.getElementById('note-in').value || '').trim(); S.exNotes = S.exNotes || {}; if (it.note) S.exNotes[it.ex] = it.note; else delete S.exNotes[it.ex]; save(); closeSheet(); render(); },
  usePrev: d => { if (!d.kg) return; const s = S.active.items[+d.n].sets[+d.k]; s.kg = num(d.kg); s.reps = num(d.r); save(); render(); },
  circTimed: d => { const a = S.active, c = a.circ, it = a.items[+d.n]; stopRest(true); c.idx = +d.n; c.round = +d.k; c.workUntil = Date.now() + it.secs * 1000; Native.restTimer(it.secs, 'Stazione finita'); save(); render(); },
  foodDayNav: d => { const x = new Date((UI.foodDay || todayKey()) + 'T12:00:00'); x.setDate(x.getDate() + (+d.d)); const k = dayKey(x); UI.foodDay = k > todayKey() ? todayKey() : k; render(); },
  foodAdd: d => { UI.fadd = { meal: d.m || mealNow(), q: '' }; openSheet(foodAddSheet); },
  foodScan: () => {
    UI.fadd = UI.fadd || { meal: mealNow() };
    if (Native.has() && window.Android.scanBarcode) { closeSheet(); window.Android.scanBarcode(); }
    else ACT.foodCode();
  },
  foodCode: () => { UI.fadd = UI.fadd || { meal: mealNow() }; openSheet(() => '<h3>Codice a barre</h3><p class="small muted">Scrivi le cifre sotto il codice a barre (8 o 13 cifre).</p><input type="text" inputmode="numeric" id="bc-in" class="big-in" placeholder="es. 8001234567890"><button class="btn wide" data-act="foodCodeGo">Cerca prodotto</button>'); setTimeout(() => { const i = document.getElementById('bc-in'); if (i) i.focus(); }, 60); },
  foodCodeGo: () => foodLookup((document.getElementById('bc-in') || {}).value || ''),
  foodPhoto: () => {
    UI.fadd = UI.fadd || { meal: mealNow() };
    if (!aiReady()) { closeSheet(); toast('Per le foto collega il coach AI (Gemini è gratis)'); go('settings'); setTimeout(() => { const el = document.querySelector('[data-act=aiPaste]'); if (el) el.scrollIntoView({ block: 'center' }); }, 80); return; }
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.setAttribute('capture', 'environment');
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      UI.fadd.busy = 'Analizzo la foto…'; openSheet(foodAddSheet);
      try { const img = await shrinkImage(f, 1024); const p = await aiFoodFromPhoto(img); UI.fadd.busy = ''; openQty(p, { edit: !p.kcal }); }
      catch (e) { UI.fadd.busy = e.message || String(e); rerenderSheet(); }
    };
    inp.click();
  },
  foodOnline: async () => {
    const F = UI.fadd; if (!F.q || F.q.trim().length < 2) { toast('Scrivi prima cosa cercare'); return; }
    F.busy = 'Cerco "' + F.q + '" su Open Food Facts…'; F.online = []; rerenderSheet();
    try { F.online = await offSearch(F.q.trim()); F.busy = F.online.length ? '' : 'Nessun prodotto trovato.'; } catch (e) { F.busy = 'Errore di connessione: ' + e.message; }
    rerenderSheet();
  },
  foodPick: d => {
    const F = UI.fadd, pool = d.src === 'db' ? FOOD_DB : d.src === 'online' ? (F.online || []) : (S.foodRecent || []);
    const p = pool.find(x => x.id === d.id); if (p) openQty(p);
  },
  foodManual: () => openQty({ id: 'man:' + uid(), name: (UI.fadd && UI.fadd.q) || 'Alimento', kcal: 0, p: 0, c: 0, f: 0, serving: 100, src: 'man' }, { edit: true, askName: true }),
  foodValEdit: () => { UI.fprod.edit = true; rerenderSheet(); },
  foodG: d => { UI.fprod.g = +d.g; rerenderSheet(); },
  foodMeal: d => { UI.fprod.meal = d.m; rerenderSheet(); },
  foodSave: () => {
    const P = UI.fprod, g = num(P.g);
    if (!(g > 0)) { toast('Inserisci i grammi'); return; }
    if (!(num(P.kcal) >= 0) || (P.edit && !num(P.kcal) && !num(P.p) && !num(P.c) && !num(P.f))) { toast('Inserisci i valori per 100 g'); return; }
    const k = UI.foodDay || todayKey(); S.food = S.food || {}; const list = S.food[k] = S.food[k] || [];
    const entry = { name: P.name, brand: P.brand || '', g, kcal: num(P.kcal), p: num(P.p), c: num(P.c), f: num(P.f), meal: P.meal, t: Date.now(), pid: P.id };
    if (P.i != null) list[P.i] = entry; else list.push(entry);
    rememberFood(Object.assign({}, P, { kcal: entry.kcal, p: entry.p, c: entry.c, f: entry.f, serving: P.serving || g }));
    save(true); closeSheet(); if (current().v !== 'food') go('food'); else render();
    toast(Math.round(entry.kcal * g / 100) + ' kcal aggiunte');
  },
  foodEdit: d => { const x = foodDay()[+d.i]; openQty(Object.assign({ id: x.pid || 'x', serving: x.g }, x), { i: +d.i, g: x.g }); },
  foodDel: () => { const k = UI.foodDay || todayKey(); S.food[k].splice(UI.fprod.i, 1); save(true); closeSheet(); render(); },
  dietRate: d => { dietState().rate = +d.r; S.diet.adj = 0; S.diet.since = Date.now(); save(); render(); },
  dietStyle: d => { dietState().style = d.k; save(); render(); },
  dietAdj: d => { dietState().adj += +d.a; S.diet.since = Date.now(); save(); render(); toast('Piano aggiornato'); },
  dietToDiary: () => {
    const n = nutritionTargets(), sd = sampleDay(dietState().style, n.kcal), k = todayKey();
    S.food = S.food || {}; S.food[k] = S.food[k] || [];
    sd.rows.forEach(r => S.food[k].push({ name: r.f.name, g: r.g, kcal: r.f.kcal, p: r.f.p, c: r.f.c, f: r.f.f, meal: r.m, t: Date.now(), pid: r.f.id }));
    save(true); UI.foodDay = k; go('food'); toast('Giornata copiata: modifica ciò che mangi davvero');
  },
  deloadOn: () => { S.deloadUntil = Date.now() + 7 * 864e5; S.lastDeload = Date.now(); save(); render(); toast('Settimana di scarico attiva: serie dimezzate per 7 giorni'); },
  deloadOff: () => { S.deloadUntil = 0; save(); render(); toast('Scarico terminato'); },
  setBodyStyle: d => { S.settings.body2 = d.k; save(); render(); },
  coachTab: d => { UI.coachTab = d.t === 'food' ? 'food' : 'train'; render(true); },
  goFood: () => { UI.coachTab = 'food'; go('coach'); },
  setSex: d => { S.profile.sex = d.k; save(); render(); },
  mobility: () => openSheet(mobilitySheet),
  woGroup: d => { const ms = d.q.split(','); pickExercise(id => { S.active.items.push(newItem(prescribe(id), 'scheda')); save(); render(); }, { m: ms[0], group: ms }); },

  /* libreria / esercizio */
  exInfo: d => { closeSheet(); go('exercise', { id: d.id }); },
  libM: d => { UI.lib.m = d.m; render(); },
  libEq: d => { UI.lib.eq = d.e; render(); },

  /* progressi */
  progTab: d => { UI.prog.tab = d.t; render(); if (d.t === 'foto') loadPhotos(); },
  progEx: d => { UI.prog.ex = d.id; render(true); },
  progMetric: d => { UI.prog.metric = d.m; render(); },
  progPickEx: () => pickExercise(id => { UI.prog.ex = id; render(); }),
  calMonth: d => { const m = new Date(UI.prog.month || new Date(new Date().getFullYear(), new Date().getMonth(), 1)); m.setMonth(m.getMonth() + (+d.d)); UI.prog.month = m.getTime(); render(); },
  calDay: d => { const hs = S.history.filter(h => dayKey(h.start) === d.k); if (hs.length === 1) openSheet(() => histSheet(hs[0].id)); else openSheet(() => '<h3>' + fmtDateLong(hs[0].start) + '</h3>' + hs.map(h => '<button class="list-item btnlike" data-act="histOpen" data-id="' + h.id + '"><div><b>' + esc(h.name) + '</b></div></button>').join('')); },
  weekNav: d => { const w = new Date(UI.prog.week || startOfWeek(Date.now())); w.setDate(w.getDate() + 7 * (+d.d)); UI.prog.week = w.getTime(); render(); },
  histOpen: d => openSheet(() => histSheet(d.id)),
  histDel: d => ask('Eliminare questo allenamento dallo storico?', 'Elimina', () => { S.history = S.history.filter(h => h.id !== d.id); save(); render(); }, true),
  histRepeat: d => { const h = S.history.find(x => x.id === d.id); closeSheet(); startWorkout({ id: null, kind: 'scheda', name: h.name, items: h.items.map(it => { const p = prescribe(it.ex); p.sets = it.sets.filter(s => !s.wu).length || p.sets; return p; }) }); },
  photoView: d => Photos.all().then(list => { const p = list.find(x => x.id === d.id); if (!p) return; openSheet(() => '<img class="photo-full" src="' + p.data + '"><p class="center muted">' + fmtDateLong(p.date) + '</p><button class="btn danger ghost wide" data-act="photoDel" data-id="' + p.id + '">' + ic('trash') + 'Elimina foto</button>'); }),
  photoDel: d => ask('Eliminare la foto?', 'Elimina', () => Photos.del(d.id).then(() => { render(); loadPhotos(); }), true),

  /* impostazioni */
  setTheme: d => { S.settings.theme = d.t; applyTheme(); save(); render(); },
  setAccent: d => { S.settings.accent = d.k; applyTheme(); save(); render(); },
  setGoal: d => { const g = S.profile.goals; if (g.includes(d.k)) { if (g.length > 1) S.profile.goals = g.filter(x => x !== d.k); else toast('Scegli almeno un obiettivo'); } else g.push(d.k); save(); render(); },
  setLevel: d => { S.profile.level = d.k; save(); render(); },
  setDay: d => { const x = +d.d, p = S.profile; p.days = p.days.includes(x) ? p.days.filter(y => y !== x) : p.days.concat(x); save(); if (S.onboarded) syncReminders(); render(); },
  setFlag: d => { S.settings[d.k] = !S.settings[d.k]; save(); if (d.k === 'keepScreen' && S.active) Native.keepScreen(S.settings.keepScreen); render(); },
  remOn: d => { S.reminders[d.k].on = !S.reminders[d.k].on; save(); if (S.onboarded) syncReminders(); render(); },
  weighDay: d => { S.reminders.weigh.day = +d.d; save(); syncReminders(); render(); },
  askNotif: () => { Native.askNotifications(); syncReminders(); toast('Promemoria aggiornati'); },
  aiProv: d => { const ai = S.settings.ai; ai.keys = ai.keys || {}; ai.keys[ai.provider] = ai.key; ai.provider = d.k; ai.key = ai.keys[d.k] || ''; ai.model = ''; UI.aiStatus = null; save(); render(); },
  toggleKey: () => { UI.showKey = !UI.showKey; render(); },
  aiClear: () => { S.settings.ai.key = ''; UI.aiStatus = null; save(); render(); },
  aiPaste: async () => {
    let t = '';
    try { t = Native.has() && window.Android.clipboard ? window.Android.clipboard() : await navigator.clipboard.readText(); } catch (e) { }
    const ai = S.settings.ai, k = cleanKey(t, ai.provider);
    if (!k) { toast('Gli appunti sono vuoti: copia prima la chiave'); return; }
    if (!keyLooksValid(k, ai.provider)) { toast('Negli appunti non c\'è una chiave ' + (ai.provider === 'gemini' ? 'Gemini (deve iniziare con AIza)' : 'valida') + ': copiala di nuovo'); return; }
    ai.key = k; save(true); UI.showKey = false; render();
    ACT.aiTest();
  },
  aiTest: async () => {
    const ai = S.settings.ai; ai.key = cleanKey(ai.key, ai.provider); save();
    if (!ai.key) { toast('Inserisci prima la chiave'); return; }
    UI.aiStatus = { state: 'testing' }; render();
    try { await aiAsk([{ role: 'user', text: 'Rispondi solo: OK' }]); UI.aiStatus = { state: 'ok' }; save(); }
    catch (e) { UI.aiStatus = { state: 'err', msg: e.message || String(e) }; }
    if (current().v === 'settings') render(); else toast(UI.aiStatus.state === 'ok' ? 'Coach AI collegato!' : UI.aiStatus.msg);
  },
  exportB: d => exportBackup(d.p === '1').then(() => toast('Backup creato')).catch(e => toast('Errore: ' + e.message)),
  resetAll: () => ask('Cancellare TUTTI i dati (schede, storico, peso, foto)? Non si può annullare.', 'Cancella tutto', async () => { try { await Photos.clear(); } catch (e) { } localStorage.removeItem(KEY); S = defaultState(); UI.ob.step = 0; UI.stack = []; render(); }, true),
  updCheck: () => { UI.update = { state: 'checking', info: null, progress: 0 }; render(); window.Android.checkUpdate(); },
  updDownload: () => { UI.update.state = 'downloading'; UI.update.progress = 0; render(); window.Android.downloadUpdate(UI.update.info.url); },

  /* primo avvio */
  obNext: () => {
    if (UI.ob.step === 3 && !S.profile.days.length) { toast('Scegli almeno un giorno'); return; }
    UI.ob.step++; render();
  },
  obPrev: () => { UI.ob.step = Math.max(0, UI.ob.step - 1); render(); },
  obFinish: () => {
    const w = num(UI.ob.weight); if (w >= 20 && w <= 400) S.weights.push({ d: Date.now(), kg: w });
    S.templates = buildDefaultTemplates(); S.onboarded = true;
    if (goalsOf().includes('dimagrimento')) { dietState(); setTimeout(() => toast('Ho impostato un deficit calorico: trovi il piano in Calorie'), 2600); }
    save(true);
    Native.askNotifications(); syncReminders();
    UI.stack = [{ v: 'home' }]; render(true); toast('Tutto pronto! Le tue schede sono in "Schede"');
  }
};

function regenPresets(quiet) {
  const mine = S.templates.filter(t => !t.preset);
  S.templates = buildDefaultTemplates().concat(mine);
  save(true); syncReminders(); if (!quiet) render();
}

/* tocchi */
document.addEventListener('click', ev => {
  // figura del corpo nell'allenatore
  const shape = ev.target.closest('.body-pick [data-m]');
  if (shape) { ACT.coachM({ m: shape.dataset.m === 'avambracci' ? 'bicipiti' : shape.dataset.m }); return; }
  const el = ev.target.closest('[data-act]'); if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  if (el.tagName === 'A') ev.preventDefault();
  try { fn(el.dataset, el, ev); } catch (e) { console.error(e); toast('Errore: ' + e.message); }
});
$('#sheet').addEventListener('click', ev => { if (ev.target.id === 'sheet') closeSheet(); });

/* campi */
document.addEventListener('input', ev => {
  const el = ev.target, k = el.dataset.in; if (!k) return;
  const v = el.value, d = el.dataset;
  switch (k) {
    case 'setKg': S.active.items[+d.n].sets[+d.k].kg = v === '' ? '' : num(v); save(); break;
    case 'setReps': S.active.items[+d.n].sets[+d.k].reps = v === '' ? '' : num(v); save(); break;
    case 'woItem': S.active.items[+d.n][d.k] = num(v); save(); break;
    case 'editName': UI.edit.name = v; break;
    case 'editNum': UI.edit[d.k] = num(v); break;
    case 'editItem': UI.edit.items[+d.n][d.k] = num(v); break;
    case 'pickQ': UI.pick.q = v; document.getElementById('pick-list').innerHTML = pickerList(); break;
    case 'libQ': UI.lib.q = v; document.getElementById('lib-list').innerHTML = libList(); break;
    case 'cardio': UI.cardio[d.k] = v; break;
    case 'plates': UI.plates[d.k] = v; { const b = $('#sheet-body'), f = document.activeElement, name = f && f.dataset.k; b.innerHTML = platesSheet(); const nf = b.querySelector('[data-in="plates"][data-k="' + name + '"]'); if (nf) { nf.focus(); nf.setSelectionRange(nf.value.length, nf.value.length); } } break;
    case 'waterGoal': S.profile.waterGoal = Math.max(1, Math.min(20, num(v) | 0)); save(); break;
    case 'remNum': S.reminders.water[d.k] = num(v) | 0; save(); syncReminders(); break;
    case 'aiKey': S.settings.ai.key = cleanKey(v, S.settings.ai.provider); UI.aiStatus = null; save(); break;
    case 'aiModel': S.settings.ai.model = v.trim(); save(); break;
    case 'obWeight': UI.ob.weight = v; break;
    case 'prof': S.profile[d.k] = v === '' ? '' : num(v); save(); break;
    case 'foodQ': UI.fadd.q = v; UI.fadd.online = []; { const b = $('#sheet-body'), y = b.scrollTop; b.innerHTML = foodAddSheet(); const i = b.querySelector('[data-in=foodQ]'); i.focus(); i.setSelectionRange(v.length, v.length); b.scrollTop = y; } break;
    case 'fname': UI.fprod.name = v; break;
    case 'fgrams': UI.fprod.g = v; foodQtyUpdate(); break;
    case 'fprod': UI.fprod[d.k] = num(v); foodQtyUpdate(); break;
    case 'aiText': el.style.height = 'auto'; el.style.height = Math.min(140, el.scrollHeight) + 'px'; break;
  }
});
document.addEventListener('change', async ev => {
  const el = ev.target, k = el.dataset.in; if (!k) return;
  if (k === 'profW') {
    const v = num(el.value); if (v < 25 || v > 350) { toast('Inserisci un peso valido'); return; }
    const last = S.weights[S.weights.length - 1];
    if (last && dayKey(last.d) === todayKey()) { last.kg = v; last.d = Date.now(); } else S.weights.push({ d: Date.now(), kg: v });
    save(true); toast('Peso aggiornato: ' + fmtKg(v) + ' kg'); render();
  }
  if (k === 'remTime') { const [h, m] = el.value.split(':').map(Number); const r = S.reminders[el.dataset.k]; r.hour = h || 0; r.min = m || 0; save(); syncReminders(); }
  if (k === 'editNum' || k === 'editItem') render();
  if (k === 'importB' && el.files[0]) {
    const f = el.files[0], text = await f.text();
    ask('Importare il backup? I dati attuali verranno sostituiti.', 'Importa', async () => { try { await importBackup(text); applyTheme(); syncReminders(); UI.stack = [{ v: 'home' }]; render(true); toast('Backup importato'); } catch (e) { toast('Errore: ' + e.message); } });
  }
  if (k === 'photo' && el.files[0]) {
    try { const data = await shrinkImage(el.files[0], 1280); const w = S.weights[S.weights.length - 1]; await Photos.put({ id: uid(), date: Date.now(), data, kg: w ? w.kg : 0 }); loadPhotos(); toast('Foto salvata'); }
    catch (e) { toast('Impossibile salvare la foto'); }
    el.value = '';
  }
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && ev.target.dataset && ev.target.dataset.in === 'aiText' && !ev.shiftKey) { ev.preventDefault(); ACT.aiSend(); }
  if (ev.key === 'Enter' && ev.target.id === 'w-in') ACT.saveWeight();
  if (ev.key === 'Enter' && ev.target.id === 'bc-in') ACT.foodCodeGo();
  if (ev.key === 'Enter' && ev.target.dataset && ev.target.dataset.in === 'foodQ') ACT.foodOnline();
});

/* il tempo continua anche se l'app torna in primo piano */
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.settings.theme === 'system') applyTheme(); });

/* ---------- Avvio ---------- */
applyTheme();
if (S.onboarded && !S.templates.length) S.templates = buildDefaultTemplates();
if (S.onboarded && S.needRegen) {
  // nuove schede del trainer: sostituisce quelle preimpostate, tiene quelle create da te
  regenPresets(true);
  delete S.needRegen; save(true);
  setTimeout(() => toast('Schede aggiornate dal trainer: dai un\'occhiata in "Schede"'), 800);
}
delete S.needRegen;
UI.stack = [{ v: S.active ? 'workout' : 'home' }];
render(true);
if (S.onboarded) syncReminders();
/* controllo aggiornamenti silenzioso all'avvio */
if (Native.has() && window.Android.checkUpdate) setTimeout(() => { try { window.Android.checkUpdate(); } catch (e) { } }, 1500);
