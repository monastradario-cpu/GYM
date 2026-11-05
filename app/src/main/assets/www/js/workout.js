/* Coach — le sedute si fanno in Hevy: qui resta solo come Coach prepara la seduta (serie, carichi, obiettivi di oggi).
   L'allenamento in corso, i timer e i circuiti guidati sono passati a Hevy (vedi hevy.js). */
'use strict';

function newItem(src, kind) {
  const e = EX[src.ex] || {};
  const it = { ex: src.ex, note: (S.exNotes || {})[src.ex] || '', ss: src.ss || null, role: src.role || defaultRole(src.ex), rmin: src.rmin || 8, rmax: src.rmax || 12, rest: src.rest || 90, secs: src.secs || 0, reps: src.reps || 0, repMode: src.repMode || (src.rmin && src.rmin === src.rmax ? 'fixed' : 'range'), sets: [] };
  const last = lastPerformance(src.ex);
  let n = kind === 'circuito' ? 0 : deloadActive() ? Math.max(1, Math.ceil((src.sets || 3) / 2)) : (src.sets || 3);
  // obiettivi di oggi dal trainer (doppia progressione)
  let tg = kind === 'circuito' ? null : (progression(src.ex, it.rmin, it.rmax).targets || null);
  // programma a cicli: +serie nelle settimane di carico, percentuali del massimale nel ciclo di forza
  const cy = kind !== 'circuito' && typeof cycleInfo === 'function' ? cycleInfo() : { on: false };
  if (cy.on && !cy.deload && (it.role === 'main' || it.role === 'sec')) {
    const mx = cy.pct && it.role === 'main' && e.type !== 'time' ? maxOf(src.ex) : null;
    // giornata no dal check-in (src.light): 5% in meno sul carico a percentuale
    if (mx) { const step = stepFor(src.ex), kg = Math.round(mx.kg * (cy.pct - (src.light ? 0.05 : 0)) / step) * step; n = cy.sets; it.rmin = it.rmax = cy.reps; tg = Array.from({ length: n }, () => ({ kg, reps: cy.reps })); }
    else n += cy.setsAdd;
  }
  // check-in con poco sonno o poca energia: una serie in meno (mai sotto 2), dopo le serie aggiunte dal ciclo
  if (src.less && kind !== 'circuito') n = Math.max(Math.min(2, n), n - src.less);
  if (deloadActive() && last) tg = last.sets.map(s => ({ kg: num(s.kg), ast: s.ast ? num(s.ast) : 0, reps: it.rmin })); // scarico: stesso carico, meno serie, lontano dal cedimento
  for (let i = 0; i < n; i++) {
    const ls = last && (last.sets[i] || last.sets[last.sets.length - 1]);
    const t = tg && (tg[i] || tg[tg.length - 1]);
    it.sets.push({ kg: '', reps: '', done: false, pk: t ? (t.kg || '') : ls ? num(ls.kg) : '', pa: t ? (t.ast || '') : ls && ls.ast ? num(ls.ast) : '', pr: t ? t.reps : ls ? num(ls.reps) : (e.type === 'time' ? (src.secs || 40) : (src.rmax || '')) });
  }
  return it;
}

/* avvio di una seduta (dopo l'eventuale check-in del percorso): va in Hevy */
function startWorkout(t) { hvLaunch(t); }
function finishWorkout() { }
function endActive() { S.active = null; save(true); }
function tick() { }
function emptyWorkoutCard() { return ''; }
function exProg(it) {
  return deloadActive() ? { kind: 'info', text: 'Settimana di scarico: stessi carichi dell\'ultima volta, metà delle serie, fermati a 3–4 ripetizioni dal cedimento.' } : progression(it.ex, it.rmin, it.rmax);
}
/* carico di lavoro di riferimento (per riscaldamento e dischi) */
function workKg(it) {
  const last = lastPerformance(it.ex), cur = Math.max(0, ...it.sets.filter(s => !s.wu).map(s => num(s.kg)));
  return cur || exProg(it).kg || (last ? Math.max(...last.sets.map(s => num(s.kg))) : 0);
}
function starRow(n, g) { let o = ''; for (let i = 0; i < Math.max(g, n); i++) o += '<span class="star' + (i < n ? ' on' : '') + '">★</span>'; return o; }
VIEWS.workout = () => { S.active = null; return VIEWS.home(); };
