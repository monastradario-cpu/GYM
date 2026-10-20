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
  newTemplate: d => { UI.edit = d.k === 'circuito' ? { id: uid(), kind: 'circuito', name: 'Nuovo circuito', days: [], rounds: 4, restEx: 15, restRound: 120, warm: 8, cool: 5, work: 45, items: [] } : { id: uid(), kind: 'scheda', name: 'Nuova scheda', days: [], items: [] }; go('edit'); },
  editTemplate: d => { UI.edit = JSON.parse(JSON.stringify(S.templates.find(t => t.id === d.id))); go('edit'); },
  editDay: d => { const t = UI.edit, x = +d.d; t.days = t.days.includes(x) ? t.days.filter(y => y !== x) : t.days.concat(x); render(); },
  editMove: d => { const a = UI.edit.items, n = +d.n, m = n + (+d.d); if (m < 0 || m >= a.length) return; [a[n], a[m]] = [a[m], a[n]]; render(); },
  editDel: d => { UI.edit.items.splice(+d.n, 1); render(); },
  editSwap: d => pickExercise(id => { const it = UI.edit.items[+d.n]; it.ex = id; if (EX[id].type === 'time' && !it.secs) it.secs = 40; render(); }, { m: EX[UI.edit.items[+d.n].ex].m }),
  editAdd: () => pickExercise(id => { const t = UI.edit; t.items.push(t.kind === 'circuito' ? { ex: id, reps: EX[id].type === 'time' ? 0 : 12, secs: EX[id].type === 'time' ? 40 : 0 } : prescribe(id, S.profile.goal, S.profile.level)); render(); }),
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
    const it = S.active.items[+d.n], s = it.sets[+d.k];
    s.done = !s.done;
    if (s.done) {
      if (s.kg === '' && s.pk !== '') s.kg = s.pk;
      if (s.reps === '' && s.pr !== '') s.reps = s.pr;
      const isLast = it.sets.every(x => x.done) && S.active.items.indexOf(it) === S.active.items.length - 1;
      if (S.settings.autoRest && !isLast) startRest(s.wu ? 60 : it.rest, (EX[it.ex] || {}).n);
      Native.vibrate(40);
    }
    save(); render();
  },
  addSet: d => { const it = S.active.items[+d.n], l = it.sets.filter(s => !s.wu).pop() || {}; it.sets.push({ kg: '', reps: '', done: false, pk: l.kg !== '' && l.kg != null ? num(l.kg) : (l.pk || ''), pr: l.reps !== '' && l.reps != null ? num(l.reps) : (l.pr || it.rmax) }); save(); render(); },
  delSet: d => { const it = S.active.items[+d.n]; it.sets.pop(); save(); closeSheet(); render(); },
  warmup: d => { const it = S.active.items[+d.n]; it.sets = warmupSets(it.ex, num(d.kg)).map(s => Object.assign(s, { pk: s.kg, pr: s.reps, kg: '', reps: '' })).concat(it.sets); save(); render(); toast('Serie di riscaldamento aggiunte (R)'); },
  exMenu: d => openSheet(() => exMenuSheet(+d.n)),
  woMove: d => { const a = S.active.items, n = +d.n, m = n + (+d.d); if (m < 0 || m >= a.length) return; [a[n], a[m]] = [a[m], a[n]]; save(); closeSheet(); render(); },
  woDel: d => { S.active.items.splice(+d.n, 1); save(); closeSheet(); render(); },
  woAdd: () => pickExercise(id => { S.active.items.push(newItem(prescribe(id, S.profile.goal, S.profile.level), 'scheda')); save(); render(); setTimeout(() => { const v = $('#view'); v.scrollTop = v.scrollHeight; }, 30); }),
  addToActive: d => { S.active.items.push(newItem(prescribe(d.id, S.profile.goal, S.profile.level), 'scheda')); save(); go('workout'); toast('Aggiunto'); },
  swapEx: d => openSheet(() => swapSheet(+d.n)),
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
  coachGo: () => { if (!UI.coach.muscles.length) { toast('Scegli almeno un muscolo'); return; } coachGenerate(Date.now()); render(); setTimeout(() => { const el = document.querySelector('.coach-ex'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 30); },
  coachSwap: d => openSheet(() => coachSwapSheet(+d.n)),
  coachDoSwap: d => { const items = UI.coach.result.items, old = items[+d.n]; items[+d.n] = prescribe(d.id, S.profile.goal, S.profile.level); closeSheet(); render(); },
  coachStart: () => startWorkout({ id: null, kind: 'scheda', name: 'Allenamento ' + UI.coach.muscles.map(m => MUSCLES[m]).join(', '), items: UI.coach.result.items }),
  coachSave: () => {
    const t = { id: uid(), kind: 'scheda', name: UI.coach.muscles.map(m => MUSCLES[m]).join(' + '), days: [], items: JSON.parse(JSON.stringify(UI.coach.result.items)) };
    S.templates.push(t); save(); UI.edit = JSON.parse(JSON.stringify(t)); go('edit'); toast('Scheda salvata: puoi rinominarla e assegnare i giorni');
  },
  openAI: () => { if (!aiReady()) { go('settings'); setTimeout(() => { const el = document.querySelector('[data-in="aiKey"]'); if (el) el.scrollIntoView({ block: 'center' }); }, 50); toast('Inserisci una chiave API per attivare il coach AI'); return; } go('aichat'); },
  aiSugg: d => aiSend(d.t),
  aiSend: () => { const t = document.querySelector('[data-in="aiText"]'); aiSend(t ? t.value : ''); },

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
  histRepeat: d => { const h = S.history.find(x => x.id === d.id); closeSheet(); startWorkout({ id: null, kind: 'scheda', name: h.name, items: h.items.map(it => { const p = prescribe(it.ex, S.profile.goal, S.profile.level); p.sets = it.sets.filter(s => !s.wu).length || p.sets; return p; }) }); },
  photoView: d => Photos.all().then(list => { const p = list.find(x => x.id === d.id); if (!p) return; openSheet(() => '<img class="photo-full" src="' + p.data + '"><p class="center muted">' + fmtDateLong(p.date) + '</p><button class="btn danger ghost wide" data-act="photoDel" data-id="' + p.id + '">' + ic('trash') + 'Elimina foto</button>'); }),
  photoDel: d => ask('Eliminare la foto?', 'Elimina', () => Photos.del(d.id).then(() => { render(); loadPhotos(); }), true),

  /* impostazioni */
  setTheme: d => { S.settings.theme = d.t; applyTheme(); save(); render(); },
  setAccent: d => { S.settings.accent = d.k; applyTheme(); save(); render(); },
  setGoal: d => { S.profile.goal = d.k; save(); render(); },
  setLevel: d => { S.profile.level = d.k; save(); render(); },
  setDay: d => { const x = +d.d, p = S.profile; p.days = p.days.includes(x) ? p.days.filter(y => y !== x) : p.days.concat(x); save(); if (S.onboarded) syncReminders(); render(); },
  setFlag: d => { S.settings[d.k] = !S.settings[d.k]; save(); if (d.k === 'keepScreen' && S.active) Native.keepScreen(S.settings.keepScreen); render(); },
  remOn: d => { S.reminders[d.k].on = !S.reminders[d.k].on; save(); if (S.onboarded) syncReminders(); render(); },
  weighDay: d => { S.reminders.weigh.day = +d.d; save(); syncReminders(); render(); },
  askNotif: () => { Native.askNotifications(); syncReminders(); toast('Promemoria aggiornati'); },
  aiProv: d => { S.settings.ai.provider = d.k; S.settings.ai.model = ''; save(); render(); },
  aiTest: async () => {
    if (!aiReady()) { toast('Inserisci prima la chiave'); return; }
    toast('Provo la connessione…');
    try { await aiAsk([{ role: 'user', text: 'Rispondi solo: OK' }]); toast('Coach AI collegato!'); } catch (e) { toast('Errore: ' + (e.message || e)); }
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
    S.templates = buildDefaultTemplates(); S.onboarded = true; save(true);
    Native.askNotifications(); syncReminders();
    UI.stack = [{ v: 'home' }]; render(true); toast('Tutto pronto! Le tue schede sono in "Schede"');
  }
};

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
    case 'aiKey': S.settings.ai.key = v.trim(); save(); break;
    case 'aiModel': S.settings.ai.model = v.trim(); save(); break;
    case 'obWeight': UI.ob.weight = v; break;
    case 'aiText': el.style.height = 'auto'; el.style.height = Math.min(140, el.scrollHeight) + 'px'; break;
  }
});
document.addEventListener('change', async ev => {
  const el = ev.target, k = el.dataset.in; if (!k) return;
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
});

/* il tempo continua anche se l'app torna in primo piano */
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.settings.theme === 'system') applyTheme(); });

/* ---------- Avvio ---------- */
applyTheme();
if (S.onboarded && !S.templates.length) S.templates = buildDefaultTemplates();
UI.stack = [{ v: S.active ? 'workout' : 'home' }];
render(true);
if (S.onboarded) syncReminders();
/* controllo aggiornamenti silenzioso all'avvio */
if (Native.has() && window.Android.checkUpdate) setTimeout(() => { try { window.Android.checkUpdate(); } catch (e) { } }, 1500);
