/* GYM — allenamento in corso (schede e circuiti guidati), timer, riepilogo */
'use strict';

function newItem(src, kind) {
  const e = EX[src.ex] || {};
  const it = { ex: src.ex, note: (S.exNotes || {})[src.ex] || '', ss: src.ss || null, role: src.role || defaultRole(src.ex), rmin: src.rmin || 8, rmax: src.rmax || 12, rest: src.rest || 90, secs: src.secs || 0, reps: src.reps || 0, sets: [] };
  const last = lastPerformance(src.ex);
  const n = kind === 'circuito' ? 0 : deloadActive() ? Math.max(1, Math.ceil((src.sets || 3) / 2)) : (src.sets || 3);
  // obiettivi di oggi dal trainer (doppia progressione)
  let tg = kind === 'circuito' ? null : (progression(src.ex, it.rmin, it.rmax).targets || null);
  if (deloadActive() && last) tg = last.sets.map(s => ({ kg: num(s.kg), reps: it.rmin })); // scarico: stesso carico, meno serie, lontano dal cedimento
  for (let i = 0; i < n; i++) {
    const ls = last && (last.sets[i] || last.sets[last.sets.length - 1]);
    const t = tg && (tg[i] || tg[tg.length - 1]);
    it.sets.push({ kg: '', reps: '', done: false, pk: t ? (t.kg || '') : ls ? num(ls.kg) : '', pr: t ? t.reps : ls ? num(ls.reps) : (e.type === 'time' ? (src.secs || 40) : (src.rmax || '')) });
  }
  return it;
}

function startWorkout(t) {
  if (S.active) { ask('C\'è già un allenamento in corso. Vuoi chiuderlo senza salvare e iniziarne uno nuovo?', 'Sì, nuovo', () => { S.active = null; startWorkout(t); }, true); return; }
  const a = { id: uid(), start: Date.now(), name: t ? t.name : 'Allenamento libero', kind: t ? (t.kind || 'scheda') : 'vuoto', tplId: t ? t.id : null, items: [], cardio: [], rest: null };
  if (t && t.quick) { a.quick = t.quick; a.zone = t.zone; }
  if (t) a.items = t.items.map(i => newItem(i, a.kind));
  if (a.kind === 'circuito') {
    a.circ = { rounds: t.rounds, restEx: t.restEx, restRound: t.restRound, warm: t.warm, cool: t.cool, round: 0, idx: 0, phase: 'warm', workUntil: 0, auto: !!t.quick };
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
  if (a.quick) return quickView(a);
  if (a.circ) return circuitView(a);
  const doneSets = a.items.reduce((s, i) => s + workSets(i).length, 0), allSets = a.items.reduce((s, i) => s + i.sets.filter(x => !x.wu).length, 0);
  const vol = a.items.reduce((s, i) => s + workSets(i).reduce((x, st) => x + num(st.kg === '' ? st.pk : st.kg) * num(st.reps === '' ? st.pr : st.reps), 0), 0);
  const focus = S.settings.woMode === 'focus' && a.items.length;
  return '<header class="top workout-top"><button class="icon-btn" data-act="minimize">' + ic('down') + '</button><div class="top-title"><h1>' + esc(a.name) + '</h1></div><button class="icon-btn" data-act="manualRest">' + ic('timer') + '</button><button class="btn sm" data-act="finish">Termina</button></header>' +
    '<div class="wo-stats"><div><small>Durata</small><b class="accent-t" data-clock="elapsed"></b></div><div><small>Volume</small><b>' + Math.round(vol) + ' kg</b></div><div><small>Serie</small><b>' + doneSets + (allSets ? '/' + allSets : '') + '</b></div>' +
      '<button class="mini-body" data-act="muscleDist" aria-label="Distribuzione dei muscoli">' + heatBody(activeMuscleLoad(), true) + '</button></div>' +
    (a.items.length ? '<div class="wo-mode seg">' + chip(ic('list', 'inline') + 'Lista', !focus, 'woMode', 'data-m="list"') + chip(ic('play', 'inline') + 'Una serie alla volta', focus, 'woMode', 'data-m="focus"') + '</div>' : '') +
    (focus ? focusView(a) :
    '<div class="exl-wrap">' +
    (a.items.length ? '' : '<div class="pad">' + emptyWorkoutCard() + '</div>') +
    a.items.map((it, n) => exerciseCard(it, n)).join('') + '</div>' +
    '<div class="pad">' +
    (a.cardio.length ? cardioCard(a) : '') +
    '<button class="btn wide big" data-act="woAdd">' + ic('plus') + 'Aggiungi esercizio</button>' +
    '<div class="grid2"><button class="btn ghost" data-act="cardio">' + ic('run') + 'Cardio</button>' + (a.items.length > 1 ? '<button class="btn ghost" data-act="reorder" data-k="wo">' + ic('list') + 'Riordina</button>' : '<button class="btn ghost" data-act="discard">Annulla</button>') + '</div>' +
    (a.items.length > 1 ? '<button class="link danger-t wide center small" data-act="discard">Annulla allenamento senza salvare</button>' : '') +
    '</div>') + restBar(a);
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
  if (!a.rest || a.quick) return '';
  return '<div class="restbar"><div class="restbar-fill" data-clock="restbar"></div><div class="restbar-in">' +
    '<button class="btn sm ghost" data-act="restAdd" data-s="-15">−15</button>' +
    '<div class="rest-mid"><small>' + esc(a.rest.label || 'Recupero') + '</small><b data-clock="rest">' + fmtClock((a.rest.until - Date.now()) / 1000) + '</b></div>' +
    '<button class="btn sm ghost" data-act="restAdd" data-s="15">+15</button><button class="btn sm" data-act="restSkip">Salta</button></div></div>';
}

function cardioCard(a) {
  return '<div class="card"><h3>' + ic('run', 'inline') + 'Cardio</h3>' + a.cardio.map((c, n) => '<div class="list-item flat"><div><b>' + esc(c.type) + '</b><small>' + c.min + ' min' + (c.km ? ' · ' + fmtKg(c.km) + ' km' : '') + (c.lvl ? ' · livello ' + esc(c.lvl) : '') + '</small></div><button class="icon-btn sm" data-act="delCardio" data-n="' + n + '">' + ic('trash') + '</button></div>').join('') + '</div>';
}
/* consiglio di oggi per l'esercizio (doppia progressione o scarico) */
function exProg(it) {
  return deloadActive() ? { kind: 'info', text: 'Settimana di scarico: stessi carichi dell\'ultima volta, metà delle serie, fermati a 3–4 ripetizioni dal cedimento.' } : progression(it.ex, it.rmin, it.rmax);
}
/* carico di lavoro di riferimento (per riscaldamento e dischi) */
function workKg(it) {
  const last = lastPerformance(it.ex), cur = Math.max(0, ...it.sets.filter(s => !s.wu).map(s => num(s.kg)));
  return cur || exProg(it).kg || (last ? Math.max(...last.sets.map(s => num(s.kg))) : 0);
}
/* obiettivo breve della prossima serie: "60 kg × 10" */
function objLine(it, prog) {
  const e = EX[it.ex] || {}, s = it.sets.find(x => !x.done && !x.wu) || it.sets.filter(x => !x.wu).slice(-1)[0];
  const arrow = prog.kind === 'up' ? '↑ ' : prog.kind === 'down' ? '↓ ' : '';
  if (!s) return '';
  if (e.type === 'time') return arrow + (s.pr || it.secs || 40) + ' s';
  if (!lastPerformance(it.ex) && !num(s.pk)) return 'Prima volta: trova il carico per ' + it.rmax + ' rip.';
  return arrow + (num(s.pk) ? fmtKg(num(s.pk)) + ' kg × ' : '') + (s.pr || it.rmax) + (num(s.pk) ? '' : ' rip.');
}
/* due riquadri per l'intervallo di ripetizioni (min–max) */
function repRange(it, n) {
  if ((EX[it.ex] || {}).type === 'time') return '<span class="rr"><input class="rr-in" inputmode="numeric" value="' + (it.secs || 40) + '" data-in="woItem" data-n="' + n + '" data-k="secs" aria-label="Secondi"><small>sec</small></span>';
  return '<span class="rr"><input class="rr-in" inputmode="numeric" value="' + it.rmin + '" data-in="woItem" data-n="' + n + '" data-k="rmin" aria-label="Ripetizioni minime"><i>–</i><input class="rr-in" inputmode="numeric" value="' + it.rmax + '" data-in="woItem" data-n="' + n + '" data-k="rmax" aria-label="Ripetizioni massime"><small>rip</small></span>';
}

function exerciseCard(it, n) {
  const e = EX[it.ex] || { n: it.ex, eq: '', m: '' }, timed = e.type === 'time';
  const last = lastPerformance(it.ex), prog = exProg(it);
  const prevWork = last ? last.sets : [], prevWu = last ? (last.item.sets || []).filter(s => s.wu) : [];
  let wsN = 0, wuN = 0;
  const items = S.active.items, prevSS = n > 0 && items[n - 1].ss === it.ss;
  return (it.ss && !prevSS ? '<div class="ss-head">Superserie ' + it.ss + ': una serie di ciascuno senza pausa, poi recupera</div>' : '') +
    '<div class="exl ex-card' + (it.ss ? ' ss' : '') + (it.sets.length && it.sets.every(s => s.done) ? ' done' : '') + '">' +
    '<div class="exl-h"><button class="link ex-title" data-act="exInfo" data-id="' + it.ex + '"><span class="ex-thumb">' + exerciseThumb(it.ex) + '</span><h3>' + esc(e.n) + '</h3></button>' +
      '<button class="icon-btn sm" data-act="exMenu" data-n="' + n + '" aria-label="Altro">' + ic('more') + '</button></div>' +
    '<div class="exl-sub"><button class="exl-rest" data-act="restPick" data-n="' + n + '">' + ic('timer', 'inline') + restLabel(it.rest) + '</button>' + repRange(it, n) +
      '<button class="exl-obj ' + prog.kind + '" data-act="trainerTip" data-n="' + n + '">' + esc(objLine(it, prog)) + '</button></div>' +
    (it.note ? '<button class="exl-note" data-act="exNote" data-n="' + n + '">' + ic('edit', 'inline') + esc(it.note) + '</button>' : '') +
    '<div class="sets"><div class="set-h"><span>Serie</span><span>Precedente</span><span>kg</span><span>' + (timed ? 'sec' : 'rip') + '</span><span></span></div>' +
    it.sets.map((s, k) => {
      const label = s.wu ? 'R' : String(++wsN);
      const pv = s.wu ? prevWu[wuN++] : prevWork[wsN - 1];
      return '<div class="set ' + (s.done ? 'done ' : '') + (s.wu ? 'wu' : '') + '"><button class="set-n" data-act="toggleWu" data-n="' + n + '" data-k="' + k + '">' + label + '</button>' +
        '<button class="prev" data-act="usePrev" data-n="' + n + '" data-k="' + k + '"' + (pv ? ' data-kg="' + num(pv.kg) + '" data-r="' + num(pv.reps) + '"' : '') + '>' + (pv ? fmtKg(num(pv.kg)) + ' × ' + num(pv.reps) : '—') + '</button>' +
        numIn(s.kg, 'data-in="setKg" data-n="' + n + '" data-k="' + k + '"', s.pk === '' ? '0' : fmtKg(s.pk)) +
        numIn(s.reps, 'data-in="setReps" data-n="' + n + '" data-k="' + k + '"', s.pr === '' ? '' : s.pr) +
        '<button class="chk ' + (s.done ? 'on' : '') + '" data-act="setDone" data-n="' + n + '" data-k="' + k + '" aria-label="Fatta">' + ic('check') + '</button></div>';
    }).join('') + '</div>' +
    '<button class="exl-add" data-act="addSet" data-n="' + n + '">+ Aggiungi serie</button></div>';
}

/* ---------- Modalità "una serie alla volta" ---------- */
function focusTarget(a) {
  const has = n => a.items[n] && a.items[n].sets.some(s => !s.done);
  const n = UI.focusN != null && a.items[UI.focusN] && (UI.focusK != null || has(UI.focusN)) ? UI.focusN : a.items.findIndex((_, i) => has(i));
  if (n < 0) return null;
  const sets = a.items[n].sets, k = UI.focusK != null && sets[UI.focusK] ? UI.focusK : sets.findIndex(s => !s.done);
  return k < 0 ? null : { n, k };
}
function focusView(a) {
  const t = focusTarget(a);
  let out = '<div class="pad">';
  if (!t) {
    out += '<div class="card fo-card center"><div class="big-ic">' + ic('check', 'xl') + '</div><h2>Tutto fatto!</h2><p class="muted">Hai completato tutte le serie. Aggiungi un esercizio o termina l\'allenamento.</p>' +
      '<button class="btn wide big" data-act="finish">' + ic('check') + 'Termina allenamento</button></div>';
  } else {
    const it = a.items[t.n], s = it.sets[t.k], e = EX[it.ex] || {}, timed = e.type === 'time', prog = exProg(it);
    const last = lastPerformance(it.ex), works = it.sets.filter(x => !x.wu), wi = works.indexOf(s);
    const pv = last ? (s.wu ? (last.item.sets || []).filter(x => x.wu)[it.sets.filter(x => x.wu).indexOf(s)] : last.sets[wi]) : null;
    const kgV = s.kg !== '' ? s.kg : (s.pk === '' ? '' : fmtKg(s.pk)), rV = s.reps !== '' ? s.reps : s.pr;
    out += '<div class="card fo-card">' +
      '<div class="fo-top"><button class="link fo-name" data-act="exInfo" data-id="' + it.ex + '">' + esc(e.n || '') + '</button><button class="icon-btn sm" data-act="exMenu" data-n="' + t.n + '">' + ic('more') + '</button></div>' +
      '<div class="fo-sn' + (s.wu ? ' wu' : '') + '">' + (s.wu ? 'RISCALDAMENTO' : 'SERIE ' + (wi + 1) + ' DI ' + works.length) + (s.done ? ' · FATTA' : '') + '</div>' +
      '<div class="fo-grid">' +
        (e.eq === 'corpo' && !num(s.pk) && !num(s.kg) ? '' : '<div class="fo-box"><small>Chili</small><div class="fo-num"><button data-act="focStep" data-f="kg" data-d="-1">−</button>' + numIn(kgV, 'data-in="setKg" data-n="' + t.n + '" data-k="' + t.k + '"', '0') + '<button data-act="focStep" data-f="kg" data-d="1">+</button></div></div>') +
        '<div class="fo-box"><small>' + (timed ? 'Secondi' : 'Ripetizioni') + '</small><div class="fo-num"><button data-act="focStep" data-f="reps" data-d="-1">−</button>' + numIn(rV, 'data-in="setReps" data-n="' + t.n + '" data-k="' + t.k + '"', '') + '<button data-act="focStep" data-f="reps" data-d="1">+</button></div></div>' +
      '</div>' +
      '<div class="fo-meta"><span class="muted small">Intervallo</span>' + repRange(it, t.n) + '<button class="exl-rest" data-act="restPick" data-n="' + t.n + '">' + ic('timer', 'inline') + restLabel(it.rest) + '</button></div>' +
      '<button class="btn wide big fo-done' + (s.done ? ' ghost' : '') + '" data-act="setDone" data-n="' + t.n + '" data-k="' + t.k + '">' + (s.done ? 'Annulla serie fatta' : ic('check') + 'Serie fatta') + '</button>' +
      '<button class="fo-prev" data-act="trainerTip" data-n="' + t.n + '">' + (pv ? 'Ultima volta ' + fmtKg(num(pv.kg)) + ' kg × ' + num(pv.reps) + ' · ' : '') + '<b>' + esc(objLine(it, prog)) + '</b> ' + ic('info', 'inline') + '</button>' +
      '<div class="fo-dots">' + it.sets.map((x, k) => '<button class="' + (x.done ? 'on ' : '') + (k === t.k ? 'cur ' : '') + (x.wu ? 'wu' : '') + '" data-act="focSet" data-n="' + t.n + '" data-k="' + k + '" aria-label="Serie ' + (k + 1) + '"></button>').join('') + '<button class="add" data-act="addSet" data-n="' + t.n + '" aria-label="Aggiungi serie">+</button></div>' +
    '</div>';
  }
  out += '<h3 class="sec">Esercizi</h3><div class="card fo-list">' + a.items.map((x, n) => {
    const e = EX[x.ex] || {}, w = x.sets.filter(z => !z.wu), dn = w.filter(z => z.done).length, all = dn === w.length && w.length;
    return '<button class="fo-row' + (t && t.n === n ? ' on' : '') + (all ? ' done' : '') + '" data-act="focEx" data-n="' + n + '"><span class="ex-thumb sm">' + exerciseThumb(x.ex) + '</span><span class="grow"><b>' + esc(e.n || x.ex) + '</b><small>' + dn + '/' + w.length + ' serie · ' + (e.type === 'time' ? (x.secs || 40) + ' s' : x.rmin + '–' + x.rmax + ' rip') + '</small></span>' + (all ? '<span class="good-t">' + ic('check') + '</span>' : '') + '</button>';
  }).join('') + '</div>' +
    (a.cardio.length ? cardioCard(a) : '') +
    '<div class="grid2"><button class="btn ghost" data-act="woAdd">' + ic('plus') + 'Esercizio</button><button class="btn ghost" data-act="cardio">' + ic('run') + 'Cardio</button></div>' +
    '<button class="link danger-t wide center small" data-act="discard">Annulla allenamento senza salvare</button></div>';
  return out;
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
  if (doneCount === 0 && c.warm) out += '<div class="card warm-mini"><div><b>' + ic('flame', 'inline') + 'Riscaldamento</b><small>' + esc(WARMUP_TEXT) + '</small></div><button class="btn sm ghost" data-act="circRest" data-s="' + ((c.warm || 8) * 60) + '" data-l="Riscaldamento">' + (c.warm || 8) + ' min</button></div>';
  out += a.items.map((it, n) => circuitStationCard(a, it, n, nx)).join('');
  if (!nx && c.cool !== 0) out += '<div class="card warm-mini"><div><b>' + ic('run', 'inline') + 'Defaticamento</b><small>' + esc(COOLDOWN_TEXT) + '</small></div><button class="btn sm ghost" data-act="circRest" data-s="' + ((c.cool || 5) * 60) + '" data-l="Defaticamento">' + (c.cool || 5) + ' min</button></div>';
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
    const newRound = nx.k > k, secs = newRound ? c.restRound : c.restEx;
    startRest(secs, newRound ? 'Pausa tra i giri · poi ' + (EX[a.items[nx.n].ex] || {}).n : 'Pausa · poi ' + (EX[a.items[nx.n].ex] || {}).n);
    if (c.auto && !secs) circStartWork(nx.n, nx.k);
  } else { stopRest(true); if (a.quick) { Native.vibrate(500); beep(); } else toast('Circuito completato! Fai il defaticamento e termina.'); }
  Native.vibrate(40); save(); render();
  setTimeout(() => { const t = nx && document.getElementById('st-' + nx.n); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
}
function circDone() { const a = S.active; if (!a || !a.circ) return; const c = a.circ; circMark(c.idx, c.round); }
function circAfterRest() {
  const a = S.active; if (!a || !a.circ || !a.circ.auto || a.circ.paused) return;
  const nx = circNext(a); if (nx && a.items[nx.n].secs) circStartWork(nx.n, nx.k);
}
/* fa partire il tempo di lavoro di una stazione */
function circStartWork(n, k) {
  const a = S.active, c = a.circ, it = a.items[n];
  if (a.rest) { a.rest = null; Native.cancelRest(); }
  c.paused = null; c.idx = n; c.round = k; c.workUntil = Date.now() + it.secs * 1000; c.workTotal = it.secs;
  Native.restTimer(it.secs, 'Stazione finita'); save();
}

/* ---------- Casa e lavoro: guida automatica a tempo ---------- */
function quickView(a) {
  const c = a.circ, nx = circNext(a), total = a.items.length * c.rounds;
  const doneCount = a.items.reduce((x, i) => x + i.sets.filter(s => s.done).length, 0);
  const working = !!c.workUntil, resting = !!a.rest, paused = !!c.paused, started = doneCount > 0 || working || resting || paused;
  const cur = working ? { n: c.idx, k: c.round } : nx, it = cur ? a.items[cur.n] : null, e = it ? (EX[it.ex] || {}) : {};
  const step = cur ? cur.k * a.items.length + cur.n + 1 : total;
  let after = null;
  if (cur) { const k2 = cur.n + 1 < a.items.length ? cur.k : cur.k + 1, n2 = cur.n + 1 < a.items.length ? cur.n + 1 : 0; if (k2 < c.rounds) after = a.items[n2]; }
  const phase = !cur ? 'FATTO' : resting ? 'PAUSA · POI' : paused ? 'IN PAUSA' : working ? 'ORA' : 'PRONTO?';
  let out = '<header class="top workout-top"><button class="icon-btn" data-act="minimize">' + ic('down') + '</button><div class="top-title"><h1>' + esc(a.name) + '</h1></div><button class="btn sm" data-act="finish">Termina</button></header>' +
    '<div class="progress thin"><i style="width:' + (100 * doneCount / total) + '%"></i></div><div class="pad">';
  if (!cur) {
    out += '<div class="card qk-now center"><div class="big-ic">⭐</div><h2>Fatto!</h2><p class="muted">' + (a.zone === 'casa' ? 'Allenamento completato.' : 'Pausa attiva completata.') + ' Tocca <b>Salva</b> per prendere la stella.</p>' +
      '<button class="btn wide big" data-act="finish">' + ic('check') + 'Salva e prendi la stella</button></div>';
  } else {
    out += '<div class="card qk-now"><div class="qk-phase">' + phase + ' <span>' + step + '/' + total + (c.rounds > 1 ? ' · giro ' + (cur.k + 1) + ' di ' + c.rounds : '') + '</span></div>' +
      '<h2 class="qk-name">' + esc(e.n || '') + '</h2>' +
      '<div class="qk-clock' + (resting ? ' rest' : '') + '"' + (working ? ' data-clock="work"' : resting ? ' data-clock="rest"' : '') + '>' +
        fmtClock(working ? (c.workUntil - Date.now()) / 1000 : resting ? (a.rest.until - Date.now()) / 1000 : paused && c.paused.left ? c.paused.left : it.secs) + '</div>' +
      '<div id="demo" class="qk-demo" data-ex="' + it.ex + '" data-compact="1"></div>' +
      (e.steps ? '<p class="small muted qk-how">' + esc(e.steps[1] || e.steps[0]) + '</p>' : '') +
      '<div class="qk-ctrl">' +
        (!started ? '<button class="btn wide big" data-act="qkGo">' + ic('play') + 'Inizia</button>'
        : paused ? '<button class="btn big grow" data-act="qkResume">' + ic('play') + 'Riprendi</button>'
        : '<button class="btn ghost big grow" data-act="qkPause">Pausa</button>') +
        (started ? '<button class="btn ghost big" data-act="qkSkip">Salta ⏭</button>' : '') + '</div>' +
      (after ? '<div class="qk-after">Dopo: <b>' + esc((EX[after.ex] || {}).n || '') + '</b> · ' + after.secs + ' s</div>' : '') + '</div>';
  }
  out += '<h3 class="sec">Programma · circa ' + quickMinutes({ rounds: c.rounds, restEx: c.restEx, restRound: c.restRound, warm: c.warm, st: a.items.map(i => [i.ex, i.secs]) }) + ' min</h3><div class="card qk-list">' +
    a.items.map((x, n) => { const dn = x.sets.filter(s => s.done).length; return '<button class="qk-row' + (cur && cur.n === n ? ' on' : '') + (dn === c.rounds ? ' done' : '') + '" data-act="exInfo" data-id="' + x.ex + '"><span class="qk-th">' + exerciseThumb(x.ex) + '</span><span class="grow"><b>' + esc((EX[x.ex] || {}).n || '') + '</b><small>' + x.secs + ' s' + (c.rounds > 1 ? ' · ' + dn + '/' + c.rounds : '') + '</small></span>' + (dn === c.rounds ? '<span class="good-t">' + ic('check') + '</span>' : '') + '</button>'; }).join('') + '</div>' +
    '<button class="btn danger ghost wide" data-act="discard">Annulla senza salvare</button></div>';
  return out;
}

/* ---------- Fine allenamento ---------- */
function finishWorkout() {
  const a = S.active; if (!a) return;
  const items = a.items.map(it => ({ ex: it.ex, sets: it.sets.filter(s => s.done).map(s => ({ kg: s.kg === '' ? num(s.pk) : num(s.kg), reps: s.reps === '' ? num(s.pr) : num(s.reps), done: true, wu: !!s.wu })) })).filter(it => it.sets.length);
  if (!items.length && !a.cardio.length) { ask('Non hai segnato nessuna serie. Vuoi chiudere senza salvare?', 'Chiudi', () => { endActive(); go('home', null, true); }, true); return; }
  const before = {}; items.forEach(it => { before[it.ex] = records(it.ex); });
  if (a.quick) {
    S.breaks = S.breaks || [];
    S.breaks.push({ d: Date.now(), key: a.quick, zone: a.zone, min: Math.max(1, Math.round((Date.now() - a.start) / 60000)) });
    if (a.zone !== 'casa') { endActive(); save(true); go('starDone', null, true); return; }
  }
  const h = { id: a.id, name: a.name, kind: a.kind, start: a.start, end: Date.now(), items, cardio: a.cardio };
  if (a.quick) { h.quick = a.quick; h.zone = a.zone; }
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
      '<div class="stats3"><div><b>' + fmtDur((h.end - h.start) / 1000) + '</b><small>durata</small></div><div><b>' + sets + '</b><small>' + (h.quick ? 'esercizi fatti' : 'serie') + '</small></div><div><b>' + (h.quick ? Math.round(h.items.reduce((x, it) => x + it.sets.reduce((y, st) => y + num(st.reps), 0), 0) / 60) + ' min' : Math.round(vol)) + '</b><small>' + (h.quick ? 'di lavoro' : 'kg sollevati') + '</small></div></div>' +
      '<div class="muted small">Settimane consecutive: <b>' + st.weekStreak + '</b> · allenamenti totali: <b>' + st.total + '</b></div></div>' +
    '<div class="card meal"><h3>' + ic('dumbbell', 'inline') + 'Adesso: pasto di recupero</h3><p class="small muted">Entro 1–2 ore: proteine (' + (nutritionTargets().protein ? Math.round(nutritionTargets().protein / 4) + ' g circa' : '25–40 g') + ') e carboidrati per ricaricare. Bevi 500 ml d\'acqua.</p><ul class="tips">' + MEALS.post.ex.slice(0, 3).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' +
    (h.quick ? '<div class="card center"><div class="stars big">' + starRow(starsOn(dayKey(h.end)), starGoal()) + '</div><p class="small muted">Stella guadagnata! ' + starsOn(dayKey(h.end)) + ' di ' + starGoal() + ' oggi.</p></div>' : '') +
    (h.prs && h.prs.length ? '<div class="card"><h3>' + ic('sparkle', 'inline') + 'Nuovi record!</h3>' + h.prs.map(p => '<div class="list-item flat"><div><b>' + exLine(p.ex) + '</b><small>' + fmtKg(p.kg) + ' kg × ' + p.reps + ' · massimale stimato ' + Math.round(e1rm(p.kg, p.reps)) + ' kg</small></div></div>').join('') + '</div>' : '') +
    '<div class="card"><h3>Dettaglio</h3>' + h.items.map(it => '<div class="list-item flat"><div><b>' + exLine(it.ex) + '</b><small>' + it.sets.map(s => h.quick ? s.reps + ' s' : (s.wu ? 'R ' : '') + fmtKg(s.kg) + '×' + s.reps).join('  ') + '</small></div></div>').join('') +
      (h.cardio || []).map(c => '<div class="list-item flat"><div><b>' + esc(c.type) + '</b><small>' + c.min + ' min' + (c.km ? ' · ' + fmtKg(c.km) + ' km' : '') + '</small></div></div>').join('') + '</div>' +
    '<button class="btn wide big" data-act="tab" data-v="home">Torna alla home</button></div>';
};

VIEWS.starDone = () => {
  const n = starsOn(), g = starGoal(), nb = nextBreak();
  return header('Pausa attiva', { noGear: true }) + '<div class="pad">' +
    '<div class="card hero center"><div class="stars big">' + starRow(n, g) + '</div><h2>' + (n >= g ? 'Obiettivo di oggi raggiunto!' : 'Stella guadagnata!') + '</h2>' +
      '<p class="muted">' + n + ' di ' + g + ' pause attive oggi.' + (n < g ? ' Alla prossima pausa: ' + esc(nb.n) + '.' : ' Ottimo lavoro per la tua schiena e la circolazione.') + '</p></div>' +
    '<button class="btn wide big" data-act="tab" data-v="home">Torna alla home</button></div>';
};
function starRow(n, g) { let o = ''; for (let i = 0; i < Math.max(g, n); i++) o += '<span class="star' + (i < n ? ' on' : '') + '">★</span>'; return o; }

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
  const it = S.active.items[n], e = EX[it.ex] || {}, timed = e.type === 'time', prog = exProg(it), wk = workKg(it), hasWu = it.sets.some(s => s.wu);
  const row = (act, label, icon, extra, cls) => '<button class="list-item btnlike' + (cls ? ' ' + cls : '') + '" data-act="menuDo" data-a="' + act + '" data-n="' + n + '"' + (extra || '') + '><div><b>' + label + '</b></div>' + ic(icon) + '</button>';
  return '<h3>' + exLine(it.ex) + '</h3>' +
    '<div class="tip ' + prog.kind + '">' + ic(prog.kind === 'up' ? 'up' : prog.kind === 'down' ? 'down' : 'coach', 'inline') + esc(prog.text) + '</div>' +
    '<p class="small muted">' + esc(trainerNote(it)) + '</p>' +
    row('exInfo', 'Come si esegue', 'video', ' data-id="' + it.ex + '"') +
    (!timed ? row('warmup', hasWu ? 'Aggiungi un\'altra serie di riscaldamento' : 'Aggiungi riscaldamento', 'flame', ' data-kg="' + (hasWu ? '' : (wk || '')) + '"') : '') +
    row('exNote', it.note ? 'Modifica nota' : 'Aggiungi nota', 'edit') +
    row('swapEx', 'Occupato? Sostituisci esercizio', 'swap') +
    (e.eq === 'bilanciere' ? row('plates', 'Calcola i dischi', 'calc', ' data-kg="' + (wk || '') + '"') : '') +
    row('woMove', 'Sposta su', 'up', ' data-d="-1"') + row('woMove', 'Sposta giù', 'down', ' data-d="1"') +
    row('delSet', 'Togli ultima serie', 'trash') +
    row('woDel', 'Rimuovi esercizio', 'trash', '', 'danger');
}

/* allenamento libero: il trainer consiglia cosa allenare */
function emptyWorkoutCard() {
  const g = suggestedGroups().slice(0, 3), rec = muscleRecovery();
  return '<div class="card trainer"><div class="eyebrow">' + ic('coach', 'inline') + 'Cosa alleni oggi?</div><p class="small muted">In base a recupero e volume della settimana ti consiglio:</p>' +
    g.map((x, i) => '<button class="pair" data-act="woGroup" data-q="' + x.m.join(',') + '"><b>' + (i === 0 ? '★ ' : '') + x.n + '</b><small>' + x.m.map(m => MUSCLES[m] + (rec[m].ready ? '' : ' (in recupero)')).join(', ') + '</small></button>').join('') +
    '<p class="small muted">Oppure aggiungi un esercizio qualsiasi qui sotto.</p></div>';
}
