/* GYM — allenamento in corso (schede e circuiti guidati), timer, riepilogo */
'use strict';

function newItem(src, kind) {
  const e = EX[src.ex] || {};
  const it = { ex: src.ex, note: (S.exNotes || {})[src.ex] || '', ss: src.ss || null, role: src.role || defaultRole(src.ex), rmin: src.rmin || 8, rmax: src.rmax || 12, rest: src.rest || 90, secs: src.secs || 0, reps: src.reps || 0, sets: [] };
  const last = lastPerformance(src.ex);
  const n = kind === 'circuito' ? 0 : (src.sets || 3);
  for (let i = 0; i < n; i++) {
    const ls = last && (last.sets[i] || last.sets[last.sets.length - 1]);
    it.sets.push({ kg: '', reps: '', done: false, pk: ls ? num(ls.kg) : '', pr: ls ? num(ls.reps) : (e.type === 'time' ? (src.secs || 40) : (src.rmax || '')) });
  }
  return it;
}

function startWorkout(t) {
  if (S.active) { ask('C\'è già un allenamento in corso. Vuoi chiuderlo senza salvare e iniziarne uno nuovo?', 'Sì, nuovo', () => { S.active = null; startWorkout(t); }, true); return; }
  const a = { id: uid(), start: Date.now(), name: t ? t.name : 'Allenamento libero', kind: t ? (t.kind || 'scheda') : 'vuoto', tplId: t ? t.id : null, items: [], cardio: [], rest: null };
  if (t) a.items = t.items.map(i => newItem(i, a.kind));
  if (a.kind === 'circuito') {
    a.circ = { rounds: t.rounds, restEx: t.restEx, restRound: t.restRound, warm: t.warm, cool: t.cool, round: 0, idx: 0, phase: 'warm', workUntil: 0 };
    a.items.forEach(it => { for (let r = 0; r < t.rounds; r++) { const last = lastPerformance(it.ex); it.sets.push({ kg: '', reps: '', done: false, pk: last ? num(last.sets[0].kg) : '', pr: it.secs || it.reps }); } });
  }
  S.active = a; save(true);
  if (S.settings.keepScreen) Native.keepScreen(true);
  go('workout', null, true);
}

/* ---------- Timer ---------- */
function startRest(secs, label) {
  if (!S.active || !secs) return;
  S.active.rest = { until: Date.now() + secs * 1000, total: secs, label: label || 'Recupero' };
  Native.restTimer(secs, label || 'Recupero finito');
  save();
}
function stopRest(silent) { if (S.active && S.active.rest) { S.active.rest = null; Native.cancelRest(); save(); if (!silent) render(); } }

let audioCtx = null;
function beep() {
  if (!S.settings.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = i === 2 ? 1320 : 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.3, audioCtx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + t + 0.2);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.22);
    });
  } catch (e) { }
}

function tick() {
  const a = S.active, now = Date.now();
  document.querySelectorAll('[data-clock="elapsed"]').forEach(el => { if (a) el.textContent = fmtClock((now - a.start) / 1000); });
  if (!a) return;
  if (a.rest) {
    const left = (a.rest.until - now) / 1000;
    if (left <= 0) { a.rest = null; Native.vibrate(600); beep(); save(); if (a.circ) circAfterRest(); render(); return; }
    document.querySelectorAll('[data-clock="rest"]').forEach(el => { el.textContent = fmtClock(left); });
    document.querySelectorAll('[data-clock="restbar"]').forEach(el => { el.style.width = (100 * left / a.rest.total) + '%'; });
  }
  if (a.circ && a.circ.workUntil) {
    const left = (a.circ.workUntil - now) / 1000;
    if (left <= 0) { a.circ.workUntil = 0; Native.vibrate(300); beep(); circDone(); return; }
    document.querySelectorAll('[data-clock="work"]').forEach(el => { el.textContent = fmtClock(left); });
  }
}
setInterval(tick, 250);

/* ---------- Vista scheda/libero ---------- */
VIEWS.workout = () => {
  const a = S.active;
  if (!a) return header('Allenamento', { back: true }) + '<div class="pad empty">Nessun allenamento in corso.</div>';
  if (a.circ) return circuitView(a);
  const doneSets = a.items.reduce((s, i) => s + workSets(i).length, 0);
  const vol = a.items.reduce((s, i) => s + workSets(i).reduce((x, st) => x + num(st.kg === '' ? st.pk : st.kg) * num(st.reps === '' ? st.pr : st.reps), 0), 0);
  return '<header class="top workout-top"><button class="icon-btn" data-act="minimize">' + ic('down') + '</button><div class="top-title"><h1>' + esc(a.name) + '</h1></div><button class="icon-btn" data-act="manualRest">' + ic('timer') + '</button><button class="btn sm" data-act="finish">Termina</button></header>' +
    '<div class="wo-stats"><div><small>Durata</small><b class="accent-t" data-clock="elapsed"></b></div><div><small>Volume</small><b>' + Math.round(vol) + ' kg</b></div><div><small>Serie</small><b>' + doneSets + '</b></div>' +
      '<button class="mini-body" data-act="muscleDist" aria-label="Distribuzione dei muscoli">' + heatBody(activeMuscleLoad(), true) + '</button></div>' +
    '<div class="pad">' +
    (a.items.length ? '' : emptyWorkoutCard()) +
    a.items.map((it, n) => exerciseCard(it, n)).join('') +
    (a.cardio.length ? '<div class="card"><h3>' + ic('run', 'inline') + 'Cardio</h3>' + a.cardio.map((c, n) => '<div class="list-item flat"><div><b>' + esc(c.type) + '</b><small>' + c.min + ' min' + (c.km ? ' · ' + fmtKg(c.km) + ' km' : '') + (c.lvl ? ' · livello ' + esc(c.lvl) : '') + '</small></div><button class="icon-btn sm" data-act="delCardio" data-n="' + n + '">' + ic('trash') + '</button></div>').join('') + '</div>' : '') +
    '<button class="btn wide big" data-act="woAdd">' + ic('plus') + 'Aggiungi esercizio</button>' +
    '<div class="grid2"><button class="btn ghost" data-act="cardio">' + ic('run') + 'Cardio</button>' + (a.items.length > 1 ? '<button class="btn ghost" data-act="reorder" data-k="wo">' + ic('list') + 'Riordina</button>' : '<button class="btn ghost" data-act="plates" data-kg="">' + ic('calc') + 'Calcola dischi</button>') + '</div>' +
    (a.items.length > 1 ? '<button class="btn ghost wide" data-act="plates" data-kg="">' + ic('calc') + 'Calcola dischi</button>' : '') +
    '<button class="btn wide" data-act="finish">' + ic('check') + 'Termina allenamento</button>' +
    '<button class="btn danger ghost wide" data-act="discard">Annulla senza salvare</button>' +
    '</div>' + restBar(a);
};

/* serie fatte per muscolo nell'allenamento in corso */
function activeMuscleLoad() {
  const m = {}; if (!S.active) return m;
  S.active.items.forEach(it => { const e = EX[it.ex], n = workSets(it).length; if (!e || !n) return; m[e.m] = (m[e.m] || 0) + n; e.s.forEach(x => { m[x] = (m[x] || 0) + n * 0.5; }); });
  return m;
}
function muscleDistSheet() {
  const load = activeMuscleLoad(), keys = Object.keys(MUSCLES).filter(k => load[k]).sort((a, b) => load[b] - load[a]), max = Math.max(1, ...keys.map(k => load[k]));
  return '<h3 class="center">Distribuzione dei muscoli</h3><div class="dist-body">' + heatBody(load) + '</div>' +
    '<div class="dist-h"><span>Muscolo</span><span>Serie completate</span></div>' +
    (keys.length ? keys.map(k => '<div class="mbar"><span>' + MUSCLES[k] + '</span><div><i style="width:' + (100 * load[k] / max) + '%"></i></div><b>' + fmtKg(Math.round(load[k] * 10) / 10) + '</b></div>').join('') : '<p class="muted small center">Segna le serie fatte per vedere i muscoli lavorati. I secondari contano metà.</p>');
}

const REST_OPTS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
const restLabel = s => !s ? 'No' : s < 60 ? s + 's' : Math.floor(s / 60) + 'min' + (s % 60 ? ' ' + (s % 60) + 's' : '');

function restBar(a) {
  if (!a.rest) return '';
  return '<div class="restbar"><div class="restbar-fill" data-clock="restbar"></div><div class="restbar-in">' +
    '<button class="btn sm ghost" data-act="restAdd" data-s="-15">−15</button>' +
    '<div class="rest-mid"><small>' + esc(a.rest.label || 'Recupero') + '</small><b data-clock="rest">' + fmtClock((a.rest.until - Date.now()) / 1000) + '</b></div>' +
    '<button class="btn sm ghost" data-act="restAdd" data-s="15">+15</button><button class="btn sm" data-act="restSkip">Salta</button></div></div>';
}

function exerciseCard(it, n) {
  const e = EX[it.ex] || { n: it.ex, eq: '', m: '' }, timed = e.type === 'time';
  const last = lastPerformance(it.ex), prog = progression(it.ex, it.rmin, it.rmax);
  const curKg = Math.max(0, ...it.sets.filter(s => !s.wu).map(s => num(s.kg)));
  const wkKg = curKg || prog.kg || (last ? Math.max(...last.sets.map(s => num(s.kg))) : 0);
  const hasWu = it.sets.some(s => s.wu);
  const prevWork = last ? last.sets : [], prevWu = last ? (last.item.sets || []).filter(s => s.wu) : [];
  let wsN = 0, wuN = 0;
  const items = S.active.items, prevSS = n > 0 && items[n - 1].ss === it.ss;
  return (it.ss && !prevSS ? '<div class="ss-head">Superserie ' + it.ss + ': fai una serie di ciascun esercizio senza pausa, poi recupera</div>' : '') +
    '<div class="card ex-card' + (it.ss ? ' ss' : '') + (it.sets.length && it.sets.every(s => s.done) ? ' done' : '') + '">' +
    '<div class="card-h"><button class="link ex-title" data-act="exInfo" data-id="' + it.ex + '"><span class="ex-thumb">' + exerciseThumb(it.ex) + '</span><span><h3>' + esc(e.n) + '</h3><small class="muted">' + muscleName(e.m) + ' · ' + (EQUIP[e.eq] || '') + ' · ' + (timed ? (it.secs || 40) + ' sec' : it.rmin + '–' + it.rmax + ' rip.') + ' <span class="role ' + (it.role || '') + '">' + (ROLE_N[it.role] || '') + '</span></small></span></button>' +
      '<button class="icon-btn sm" data-act="exMenu" data-n="' + n + '">' + ic('more') + '</button></div>' +
    '<div class="row gap wrap ex-chips"><button class="pill" data-act="restPick" data-n="' + n + '">' + ic('timer', 'inline') + 'Recupero: ' + restLabel(it.rest) + '</button><button class="pill" data-act="exNote" data-n="' + n + '">' + ic('edit', 'inline') + (it.note ? 'Nota' : 'Aggiungi nota') + '</button></div>' +
    (it.note ? '<div class="ex-note">' + esc(it.note) + '</div>' : '') +
    '<div class="tip ' + prog.kind + '">' + ic(prog.kind === 'up' ? 'up' : prog.kind === 'down' ? 'down' : 'info', 'inline') + esc(prog.text) + '</div>' +
    '<div class="sets"><div class="set-h"><span>Serie</span><span>Precedente</span><span>kg</span><span>' + (timed ? 'sec' : 'rip.') + '</span><span>' + ic('check', 'inline') + '</span></div>' +
    it.sets.map((s, k) => {
      const label = s.wu ? 'R' : String(++wsN);
      const pv = s.wu ? prevWu[wuN++] : prevWork[wsN - 1];
      return '<div class="set ' + (s.done ? 'done ' : '') + (s.wu ? 'wu' : '') + '"><button class="set-n" data-act="toggleWu" data-n="' + n + '" data-k="' + k + '">' + label + '</button>' +
        '<button class="prev" data-act="usePrev" data-n="' + n + '" data-k="' + k + '"' + (pv ? ' data-kg="' + num(pv.kg) + '" data-r="' + num(pv.reps) + '"' : '') + '>' + (pv ? fmtKg(num(pv.kg)) + 'kg × ' + num(pv.reps) : '—') + '</button>' +
        numIn(s.kg, 'data-in="setKg" data-n="' + n + '" data-k="' + k + '"', s.pk === '' ? '0' : fmtKg(s.pk)) +
        numIn(s.reps, 'data-in="setReps" data-n="' + n + '" data-k="' + k + '"', s.pr === '' ? '' : s.pr) +
        '<button class="chk ' + (s.done ? 'on' : '') + '" data-act="setDone" data-n="' + n + '" data-k="' + k + '">' + ic('check') + '</button></div>';
    }).join('') + '</div>' +
    '<div class="set-actions"><button class="btn ghost" data-act="addSet" data-n="' + n + '">+ Aggiungi serie</button>' +
      (!timed ? '<button class="btn ghost wu-btn" data-act="warmup" data-n="' + n + '" data-kg="' + (hasWu ? '' : (wkKg || '')) + '">+ Riscaldamento</button>' : '') + '</div>' +
    '<div class="row gap wrap"><button class="btn sm ghost" data-act="swapEx" data-n="' + n + '">' + ic('swap', 'inline') + 'Occupato?</button>' +
      (e.eq === 'bilanciere' ? '<button class="btn sm ghost" data-act="plates" data-kg="' + (wkKg || '') + '">Dischi</button>' : '') +
      '<span class="small muted grow tn">' + esc(trainerNote(it)) + '</span>' +
    '</div></div>';
}

/* miniatura animata ferma dell'esercizio */
function exerciseThumb(id) {
  try { const def = animDef(id), k = def.seq ? 1 : 1; return '<svg viewBox="40 -10 240 220">' + frameSvg(def, EX[id], k, k, 0) + '</svg>'; } catch (e) { return ''; }
}

/* ---------- Circuito guidato ---------- */
function circuitView(a) {
  const c = a.circ, nx = circNext(a);
  const doneCount = a.items.reduce((s, i) => s + i.sets.filter(x => x.done).length, 0), total = a.items.length * c.rounds;
  const vol = a.items.reduce((s, i) => s + i.sets.filter(x => x.done).reduce((t, x) => t + num(x.kg) * num(x.reps), 0), 0);
  let out = '<header class="top workout-top"><button class="icon-btn" data-act="minimize">' + ic('down') + '</button><div class="top-title"><h1>' + esc(a.name) + '</h1></div><button class="icon-btn" data-act="manualRest">' + ic('timer') + '</button><button class="btn sm" data-act="finish">Termina</button></header>' +
    '<div class="progress thin"><i style="width:' + (100 * doneCount / total) + '%"></i></div>' +
    '<div class="wo-stats"><div><small>Durata</small><b class="accent-t" data-clock="elapsed"></b></div><div><small>Volume</small><b>' + Math.round(vol) + ' kg</b></div><div><small>Serie</small><b>' + doneCount + '/' + total + '</b></div>' +
      '<button class="mini-body" data-act="muscleDist" aria-label="Distribuzione dei muscoli">' + heatBody(activeMuscleLoad(), true) + '</button></div><div class="pad">';
  out += '<div class="circ-info">' + (nx ? '<b>Giro ' + (nx.k + 1) + ' di ' + c.rounds + '</b> · ora: ' + esc((EX[a.items[nx.n].ex] || {}).n || '') : '<b>Circuito completato!</b> ' + esc(COOLDOWN_TEXT)) +
    '<small>Pausa ' + c.restEx + ' s tra le stazioni · ' + c.restRound + ' s tra i giri</small></div>';
  if (doneCount === 0) out += '<div class="card warm-mini"><div><b>' + ic('flame', 'inline') + 'Riscaldamento</b><small>' + esc(WARMUP_TEXT) + '</small></div><button class="btn sm ghost" data-act="circRest" data-s="' + ((c.warm || 8) * 60) + '" data-l="Riscaldamento">' + (c.warm || 8) + ' min</button></div>';
  out += a.items.map((it, n) => circuitStationCard(a, it, n, nx)).join('');
  if (!nx) out += '<div class="card warm-mini"><div><b>' + ic('run', 'inline') + 'Defaticamento</b><small>' + esc(COOLDOWN_TEXT) + '</small></div><button class="btn sm ghost" data-act="circRest" data-s="' + ((c.cool || 5) * 60) + '" data-l="Defaticamento">' + (c.cool || 5) + ' min</button></div>';
  out += (a.items.length > 1 ? '<button class="btn ghost wide" data-act="reorder" data-k="wo">' + ic('list') + 'Riordina le stazioni</button>' : '') +
    '<button class="btn wide' + (nx ? ' ghost' : ' big') + '" data-act="finish">' + ic('check') + 'Termina allenamento</button>' +
    '<button class="btn danger ghost wide" data-act="discard">Annulla senza salvare</button></div>' + restBar(a);
  return out;
}

function circuitStationCard(a, it, n, nx) {
  const c = a.circ, e = EX[it.ex] || { n: it.ex, m: '', eq: '' }, timed = !!it.secs;
  const last = lastPerformance(it.ex), prev = last ? last.sets : [];
  return '<div class="card ex-card' + (it.sets.every(s => s.done || s.skip) ? ' done' : '') + (nx && nx.n === n ? ' current' : '') + '" id="st-' + n + '">' +
    '<div class="card-h"><button class="link ex-title" data-act="exInfo" data-id="' + it.ex + '"><span class="ex-thumb">' + exerciseThumb(it.ex) + '</span><span><h3>' + (n + 1) + '. ' + esc(e.n) + '</h3><small class="muted">' + muscleName(e.m) + ' · ' + (EQUIP[e.eq] || '') + ' · ' + (timed ? it.secs + ' sec' : it.reps + ' rip.') + '</small></span></button>' +
      '<button class="icon-btn sm" data-act="swapEx" data-n="' + n + '">' + ic('swap') + '</button></div>' +
    '<div class="row gap wrap ex-chips"><button class="pill" data-act="exNote" data-n="' + n + '">' + ic('edit', 'inline') + (it.note ? 'Nota' : 'Aggiungi nota') + '</button></div>' +
    (it.note ? '<div class="ex-note">' + esc(it.note) + '</div>' : '') +
    '<div class="sets"><div class="set-h"><span>Giro</span><span>Precedente</span><span>kg</span><span>' + (timed ? 'sec' : 'rip.') + '</span><span>' + ic('check', 'inline') + '</span></div>' +
    it.sets.map((s, k) => {
      const pv = prev[k] || prev[prev.length - 1], running = c.workUntil && c.idx === n && c.round === k, cur = running || (!c.workUntil && nx && nx.n === n && nx.k === k);
      const btn = s.done ? '<button class="chk on" data-act="setDone" data-n="' + n + '" data-k="' + k + '">' + ic('check') + '</button>'
        : timed ? (running ? '<span class="chk run" data-clock="work">' + fmtClock((c.workUntil - Date.now()) / 1000) + '</span>' : '<button class="chk play" data-act="circTimed" data-n="' + n + '" data-k="' + k + '">' + ic('play') + '</button>')
        : '<button class="chk" data-act="setDone" data-n="' + n + '" data-k="' + k + '">' + ic('check') + '</button>';
      return '<div class="set ' + (s.done ? 'done ' : '') + (s.skip ? 'skip ' : '') + (cur ? 'cur' : '') + '"><span class="set-n">' + (k + 1) + '</span>' +
        '<button class="prev" data-act="usePrev" data-n="' + n + '" data-k="' + k + '"' + (pv ? ' data-kg="' + num(pv.kg) + '" data-r="' + num(pv.reps) + '"' : '') + '>' + (pv ? fmtKg(num(pv.kg)) + 'kg × ' + num(pv.reps) : '—') + '</button>' +
        (e.eq === 'corpo' ? '<span class="prev">—</span>' : numIn(s.kg, 'data-in="setKg" data-n="' + n + '" data-k="' + k + '"', s.pk === '' ? '0' : fmtKg(s.pk))) +
        numIn(s.reps, 'data-in="setReps" data-n="' + n + '" data-k="' + k + '"', timed ? it.secs : it.reps) + btn + '</div>';
    }).join('') + '</div></div>';
}

/* prossima serie da fare: giro per giro, stazione per stazione */
function circNext(a) {
  for (let k = 0; k < a.circ.rounds; k++) for (let n = 0; n < a.items.length; n++) { const s = a.items[n].sets[k]; if (s && !s.done && !s.skip) return { n, k }; }
  return null;
}
/* segna una serie del circuito e avvia la pausa giusta */
function circMark(n, k) {
  const a = S.active, c = a.circ, it = a.items[n], s = it.sets[k];
  c.workUntil = 0;
  s.done = true;
  if (s.kg === '' && s.pk !== '') s.kg = s.pk;
  if (s.reps === '') s.reps = it.secs || it.reps;
  const nx = circNext(a);
  if (nx) {
    c.idx = nx.n; c.round = nx.k;
    const newRound = nx.k > k;
    startRest(newRound ? c.restRound : c.restEx, newRound ? 'Pausa tra i giri · poi ' + (EX[a.items[nx.n].ex] || {}).n : 'Pausa · poi ' + (EX[a.items[nx.n].ex] || {}).n);
  } else { stopRest(true); toast('Circuito completato! Fai il defaticamento e termina.'); }
  Native.vibrate(40); save(); render();
  setTimeout(() => { const t = nx && document.getElementById('st-' + nx.n); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
}
function circDone() { const a = S.active; if (!a || !a.circ) return; const c = a.circ; circMark(c.idx, c.round); }
function circAfterRest() { }

/* ---------- Fine allenamento ---------- */
function finishWorkout() {
  const a = S.active; if (!a) return;
  const items = a.items.map(it => ({ ex: it.ex, sets: it.sets.filter(s => s.done).map(s => ({ kg: s.kg === '' ? num(s.pk) : num(s.kg), reps: s.reps === '' ? num(s.pr) : num(s.reps), done: true, wu: !!s.wu })) })).filter(it => it.sets.length);
  if (!items.length && !a.cardio.length) { ask('Non hai segnato nessuna serie. Vuoi chiudere senza salvare?', 'Chiudi', () => { endActive(); go('home', null, true); }, true); return; }
  const before = {}; items.forEach(it => { before[it.ex] = records(it.ex); });
  const h = { id: a.id, name: a.name, kind: a.kind, start: a.start, end: Date.now(), items, cardio: a.cardio };
  S.history.push(h);
  const prs = [];
  items.forEach(it => {
    const b = before[it.ex];
    it.sets.filter(s => !s.wu).forEach(s => {
      const e = e1rm(s.kg, s.reps);
      if (s.kg > 0 && (e > b.e1rm + 0.01 || s.kg > b.kg) && !prs.some(p => p.ex === it.ex)) prs.push({ ex: it.ex, kg: s.kg, reps: s.reps, first: !b.e1rm });
    });
  });
  h.prs = prs.filter(p => !p.first);
  endActive();
  save(true);
  go('summary', { id: h.id }, true);
}
function endActive() { Native.cancelRest(); Native.keepScreen(false); S.active = null; save(true); }

VIEWS.summary = p => {
  const h = S.history.find(x => x.id === p.id); if (!h) return VIEWS.home();
  let vol = 0, sets = 0; h.items.forEach(it => it.sets.filter(s => !s.wu).forEach(s => { vol += s.kg * s.reps; sets++; }));
  const st = streaks();
  return header('Allenamento salvato', { noGear: true }) + '<div class="pad">' +
    '<div class="card hero center"><div class="big-ic">' + ic('flame', 'xl') + '</div><h2>Grande lavoro!</h2><div class="muted">' + esc(h.name) + ' · ' + fmtDateLong(h.start) + '</div>' +
      '<div class="stats3"><div><b>' + fmtDur((h.end - h.start) / 1000) + '</b><small>durata</small></div><div><b>' + sets + '</b><small>serie</small></div><div><b>' + Math.round(vol) + '</b><small>kg sollevati</small></div></div>' +
      '<div class="muted small">Settimane consecutive: <b>' + st.weekStreak + '</b> · allenamenti totali: <b>' + st.total + '</b></div></div>' +
    '<div class="card meal"><h3>' + ic('dumbbell', 'inline') + 'Adesso: pasto di recupero</h3><p class="small muted">Entro 1–2 ore: proteine (' + (nutritionTargets().protein ? Math.round(nutritionTargets().protein / 4) + ' g circa' : '25–40 g') + ') e carboidrati per ricaricare. Bevi 500 ml d\'acqua.</p><ul class="tips">' + MEALS.post.ex.slice(0, 3).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' +
    (h.prs && h.prs.length ? '<div class="card"><h3>' + ic('sparkle', 'inline') + 'Nuovi record!</h3>' + h.prs.map(p => '<div class="list-item flat"><div><b>' + exLine(p.ex) + '</b><small>' + fmtKg(p.kg) + ' kg × ' + p.reps + ' · massimale stimato ' + Math.round(e1rm(p.kg, p.reps)) + ' kg</small></div></div>').join('') + '</div>' : '') +
    '<div class="card"><h3>Dettaglio</h3>' + h.items.map(it => '<div class="list-item flat"><div><b>' + exLine(it.ex) + '</b><small>' + it.sets.map(s => (s.wu ? 'R ' : '') + fmtKg(s.kg) + '×' + s.reps).join('  ') + '</small></div></div>').join('') +
      (h.cardio || []).map(c => '<div class="list-item flat"><div><b>' + esc(c.type) + '</b><small>' + c.min + ' min' + (c.km ? ' · ' + fmtKg(c.km) + ' km' : '') + '</small></div></div>').join('') + '</div>' +
    '<button class="btn wide big" data-act="tab" data-v="home">Torna alla home</button></div>';
};

/* ---------- Fogli dell'allenamento ---------- */
function cardioSheet() {
  const c = UI.cardio || (UI.cardio = { type: CARDIO_TYPES[0], min: '', km: '', lvl: '' });
  return '<h3>' + ic('run', 'inline') + 'Cardio</h3><div class="chips">' + CARDIO_TYPES.map(t => chip(t, c.type === t, 'cardioType', 'data-t="' + t + '"')).join('') + '</div>' +
    '<div class="grid3">' + field('Minuti', numIn(c.min, 'data-in="cardio" data-k="min"', '20')) + field('Km', numIn(c.km, 'data-in="cardio" data-k="km"', '0')) + field('Livello / incl.', '<input type="text" value="' + esc(c.lvl) + '" data-in="cardio" data-k="lvl" placeholder="es. 8 o 5%">') + '</div>' +
    '<button class="btn wide" data-act="saveCardio">Salva cardio</button>';
}

function platesSheet() {
  const p = UI.plates || (UI.plates = { kg: 60, bar: 20 });
  const r = platesFor(num(p.kg), num(p.bar));
  const colors = { 25: '#e11d48', 20: '#2563eb', 15: '#eab308', 10: '#16a34a', 5: '#f8fafc', 2.5: '#334155', 1.25: '#94a3b8' };
  return '<h3>' + ic('calc', 'inline') + 'Calcolatore dischi</h3>' +
    '<div class="grid2">' + field('Peso totale (kg)', numIn(p.kg, 'data-in="plates" data-k="kg"')) + field('Bilanciere (kg)', numIn(p.bar, 'data-in="plates" data-k="bar"')) + '</div>' +
    '<div class="chips">' + [20, 15, 10].map(b => chip('Bilanciere ' + b, num(p.bar) === b, 'platesBar', 'data-b="' + b + '"')).join('') + '</div>' +
    '<div class="barbell"><div class="bar-shaft"></div>' + r.plates.map(x => '<div class="plate" style="background:' + colors[x] + ';height:' + (40 + x * 3) + 'px"><span>' + fmtKg(x) + '</span></div>').join('') + '</div>' +
    '<p class="center">' + (num(p.kg) < num(p.bar) ? 'Il peso è inferiore al bilanciere.' : r.plates.length ? 'Per lato: <b>' + r.plates.map(fmtKg).join(' + ') + '</b> kg' : 'Solo bilanciere') + (r.ok ? '' : '<br><span class="bad small">Mancano ' + fmtKg(r.rest * 2) + ' kg: non ottenibile esattamente.</span>') + '</p>';
}

function exMenuSheet(n) {
  const it = S.active.items[n];
  return '<h3>' + exLine(it.ex) + '</h3>' +
    '<div class="grid3">' + field('Rip. min', numIn(it.rmin, 'data-in="woItem" data-n="' + n + '" data-k="rmin"')) + field('Rip. max', numIn(it.rmax, 'data-in="woItem" data-n="' + n + '" data-k="rmax"')) + field('Recupero s', numIn(it.rest, 'data-in="woItem" data-n="' + n + '" data-k="rest"')) + '</div>' +
    '<button class="list-item btnlike" data-act="exInfo" data-id="' + it.ex + '"><div><b>Come si esegue</b></div>' + ic('info') + '</button>' +
    '<button class="list-item btnlike" data-act="woMove" data-n="' + n + '" data-d="-1"><div><b>Sposta su</b></div>' + ic('up') + '</button>' +
    '<button class="list-item btnlike" data-act="woMove" data-n="' + n + '" data-d="1"><div><b>Sposta giù</b></div>' + ic('down') + '</button>' +
    '<button class="list-item btnlike" data-act="delSet" data-n="' + n + '"><div><b>Togli ultima serie</b></div>' + ic('trash') + '</button>' +
    '<button class="list-item btnlike danger" data-act="woDel" data-n="' + n + '"><div><b>Rimuovi esercizio</b></div>' + ic('trash') + '</button>';
}


/* allenamento libero: il trainer consiglia cosa allenare */
function emptyWorkoutCard() {
  const g = suggestedGroups().slice(0, 3), rec = muscleRecovery();
  return '<div class="card trainer"><div class="eyebrow">' + ic('coach', 'inline') + 'Cosa alleni oggi?</div><p class="small muted">In base a recupero e volume della settimana ti consiglio:</p>' +
    g.map((x, i) => '<button class="pair" data-act="woGroup" data-q="' + x.m.join(',') + '"><b>' + (i === 0 ? '★ ' : '') + x.n + '</b><small>' + x.m.map(m => MUSCLES[m] + (rec[m].ready ? '' : ' (in recupero)')).join(', ') + '</small></button>').join('') +
    '<p class="small muted">Oppure aggiungi un esercizio qualsiasi qui sotto.</p></div>';
}
