/* Coach — valutazione dell'allenamento fatto in Hevy.
   Il voto (1–10) è la media pesata di quattro parti, sempre mostrate con il loro peso: niente numeri magici.
   - Completezza (35%): serie di lavoro fatte rispetto a quelle previste dalla routine di Coach.
   - Prestazione (35%): obiettivi di carico e ripetizioni centrati; senza obiettivo, massimale stimato rispetto alla volta prima.
   - Intensità (20%): RPE segnato in Hevy rispetto alle ripetizioni di scorta previste (RPE = 10 − RIR, Helms 2016);
     senza RPE si guarda se le ripetizioni restano nel range (troppe = carico leggero, troppo poche = carico pesante).
   - Range (10%): serie di lavoro dentro l'intervallo di ripetizioni dell'obiettivo (Schoenfeld 2017).
   Se una parte non si può calcolare (seduta libera, prima volta) non conta e le altre si ripesano. */
'use strict';

function prevSessions(exId, before) {
  const c = canon(exId), out = [];
  for (let i = S.history.length - 1; i >= 0; i--) {
    const h = S.history[i]; if (h.quick || h.start >= before) continue;
    (h.items || []).forEach(it => { if (canon(it.ex) === c) { const ws = workSets(it); if (ws.length) out.push({ date: h.start, sets: ws }); } });
  }
  return out;
}
const clamp01 = v => Math.max(0, Math.min(1, v));
function rirRange(rir) { const p = String(rir || '1–2').split(/[–-]/).map(Number); return [p[0], p.length > 1 ? p[1] : p[0]]; }

function evaluateWorkout(h) {
  // la versione della routine valida quando hai iniziato la seduta, anche se è vecchia: se non è cambiata
  // (nessun progresso, una pausa lunga) in Hevy c'era ancora quella, quindi il confronto è giusto
  const usePlan = h.routine && typeof hvPlanAt === 'function' ? hvPlanAt(h.routine, h.start) : null;
  const items = [], good = [], fix = [];
  let planned = 0, doneSets = 0, perfSum = 0, perfN = 0, intSum = 0, intN = 0, inRange = 0, rangeN = 0, rpeSeen = 0;
  const skipped = usePlan ? usePlan.items.filter(p => !h.items.some(it => canon(it.ex) === p.ex)).map(p => p.ex) : [];
  if (usePlan) usePlan.items.forEach(p => { if (!p.secs) planned += p.sets; });
  h.items.forEach(it => {
    const e = EX[it.ex] || { n: it.ex }, ws = workSets(it), p = usePlan && usePlan.items.find(x => x.ex === canon(it.ex));
    if (!ws.length) return;
    const timed = e.type === 'time';
    if (p && !p.secs) doneSets += Math.min(ws.length, p.sets);
    const prev = prevSessions(it.ex, h.start), e1 = bestE1(ws), pe1 = prev[0] ? bestE1(prev[0].sets) : 0;
    const best = Math.max(0, ...prev.map(s => bestE1(s.sets)));
    const ti = (S.templates.find(t => t.id === h.tplId) || { items: [] }).items.find(x => canon(x.ex) === canon(it.ex)) || prescribe(it.ex);
    const r = { ex: it.ex, rmin: p ? p.rmin : ti.rmin, rmax: p ? p.rmax : ti.rmax, sets: ws.map(s => timed ? s.reps + ' s' : (s.kg ? fmtKg(s.kg) + '×' : '') + s.reps + (s.ast ? ' (aiuto ' + fmtKg(s.ast) + ' kg)' : '') + (s.rpe ? ' @' + fmtKg(s.rpe) : '')).join('  '), kind: 'first', txt: '' };
    // prestazione
    let perf = null;
    if (timed) {
      const ps = prev[0] ? Math.max(...prev[0].sets.map(s => num(s.reps))) : 0, cs = Math.max(...ws.map(s => num(s.reps)));
      if (ps) { perf = cs >= ps ? 1 : cs >= ps * 0.9 ? 0.75 : 0.45; r.kind = cs > ps ? 'up' : cs >= ps * 0.9 ? 'same' : 'down'; r.txt = cs > ps ? '+' + (cs - ps) + ' s rispetto alla volta prima' : cs >= ps * 0.9 ? 'Tenuta come la volta prima' : 'Meno della volta prima (' + ps + ' s)'; }
      else r.txt = 'Prima volta: punto di partenza segnato';
    } else if (p && p.kg > 0 && p.reps && p.reps.some(x => x > 0)) {
      // obiettivo di Coach: carico e ripetizioni serie per serie
      let sum = 0;
      for (let i = 0; i < p.sets; i++) {
        const s = ws[i], tr = p.reps[i] || p.reps[p.reps.length - 1] || p.rmin;
        if (!s) { sum += 0; continue; }
        sum += Math.min(1, num(s.kg) / p.kg) * Math.min(1, num(s.reps) / tr);
      }
      perf = clamp01(sum / p.sets);
      const hit = perf >= 0.97;
      r.kind = e1 > pe1 * 1.01 && pe1 ? 'up' : hit ? 'same' : 'down';
      r.txt = hit ? 'Obiettivo centrato (' + fmtKg(p.kg) + ' kg × ' + p.reps.filter(Boolean).join('-') + ')' : 'Obiettivo ' + fmtKg(p.kg) + ' kg × ' + p.reps.filter(Boolean).join('-') + ': ' + Math.round(perf * 100) + '% fatto';
    } else if (p && !(p.kg > 0) && p.reps && p.reps.some(x => x > 0)) {
      // corpo libero o assistito: obiettivo di ripetizioni (e di aiuto, se c'è: usarne di più vale meno)
      let sum = 0;
      for (let i = 0; i < p.sets; i++) {
        const s = ws[i], tr = p.reps[i] || p.reps[p.reps.length - 1] || p.rmin;
        if (!s) continue;
        const aid = p.ast > 0 && num(s.ast) > p.ast ? p.ast / num(s.ast) : 1;
        sum += Math.min(1, num(s.reps) / tr) * aid;
      }
      perf = clamp01(sum / p.sets);
      const hit = perf >= 0.97, aidTxt = p.ast > 0 ? ' con ' + fmtKg(p.ast) + ' kg di aiuto' : '';
      const tot = x => x.reduce((a, s) => a + num(s.reps), 0), pa = prev[0] ? Math.max(0, ...prev[0].sets.map(s => num(s.ast))) : 0, ca = Math.max(0, ...ws.map(s => num(s.ast)));
      r.kind = prev[0] && (tot(ws) > tot(prev[0].sets) && ca <= pa || ca < pa && tot(ws) >= tot(prev[0].sets) * 0.9) ? 'up' : hit ? 'same' : 'down';
      r.txt = (hit ? 'Obiettivo centrato (' : 'Obiettivo ') + p.reps.filter(Boolean).join('-') + ' ripetizioni' + aidTxt + (hit ? ')' : ': ' + Math.round(perf * 100) + '% fatto');
    } else if (pe1) {
      const d = (e1 - pe1) / pe1;
      perf = d >= 0.01 ? 1 : d >= -0.02 ? 0.8 : d >= -0.05 ? 0.55 : 0.3;
      r.kind = d >= 0.01 ? 'up' : d >= -0.02 ? 'same' : 'down';
      r.txt = d >= 0.01 ? 'Massimale stimato +' + Math.round(d * 100) + '%' : d >= -0.02 ? 'Stabile rispetto alla volta prima' : 'Massimale stimato ' + Math.round(d * 100) + '%';
    } else if (!prev.length) r.txt = 'Prima volta: seduta di taratura, il carico giusto lo calcolo da qui';
    else r.txt = 'Senza carico: ripetizioni ' + ws.map(s => s.reps).join('-');
    if (perf != null) { perfSum += perf; perfN++; }
    // record
    if (!timed && best && e1 > best * 1.005) { r.pr = true; good.push('Record su ' + e.n + ': massimale stimato ' + Math.round(e1) + ' kg'); }
    // intensità: RPE o ripetizioni nel range
    const rmin = p ? p.rmin : null, rmax = p ? p.rmax : null;
    if (!timed) {
      const rpes = ws.filter(s => s.rpe).map(s => s.rpe);
      if (rpes.length) {
        rpeSeen++;
        const [a, b] = rirRange(p ? p.rir : rirFor(defaultRole(it.ex))), lo = 10 - b, hi = 10 - a, avg = rpes.reduce((x, y) => x + y, 0) / rpes.length;
        const off = avg < lo ? lo - avg : avg > hi ? avg - hi : 0;
        intSum += off <= 0.5 ? 1 : off <= 1 ? 0.75 : off <= 2 ? 0.45 : 0.2; intN++;
        if (avg < lo - 1) fix.push(e.n + ': RPE medio ' + fmtKg(Math.round(avg * 10) / 10) + ', troppo facile (obiettivo ' + lo + (hi !== lo ? '–' + hi : '') + '). ' + (ws.some(s => num(s.kg) > 0) ? 'Aumenta il carico.' : ws.some(s => num(s.ast) > 0) ? 'Togli un po\' di aiuto.' : 'Rendilo più duro: più ripetizioni, una zavorra o una variante più difficile.'));
        if (avg > hi + 0.5 && a >= 1) fix.push(e.n + ': RPE medio ' + fmtKg(Math.round(avg * 10) / 10) + ', troppo vicino al cedimento per questa fase (obiettivo ' + lo + (hi !== lo ? '–' + hi : '') + ').');
      } else if (rmin) {
        const avgR = ws.reduce((x, s) => x + num(s.reps), 0) / ws.length;
        intSum += avgR > rmax + 2 ? 0.5 : avgR < rmin - 1 ? 0.5 : 1; intN++;
        if (avgR > rmax + 2) fix.push(e.n + ': ' + Math.round(avgR) + ' ripetizioni di media, sopra il range ' + rmin + '–' + rmax + ': ' + (ws.some(s => num(s.kg) > 0) ? 'il carico è leggero.' : ws.some(s => num(s.ast) > 0) ? 'puoi togliere aiuto.' : 'passa a una variante più difficile o aggiungi una zavorra.'));
        if (avgR < rmin - 1) fix.push(e.n + ': ' + Math.round(avgR) + ' ripetizioni di media, sotto il range ' + rmin + '–' + rmax + ': ' + (ws.some(s => num(s.kg) > 0) ? 'il carico è pesante.' : ws.some(s => num(s.ast) > 0) ? 'usa un po\' più di aiuto.' : 'normale all\'inizio: aggiungi 1 ripetizione alla volta (o usa una variante più facile).'));
      }
      if (rmin) ws.forEach(s => { rangeN++; if (num(s.reps) >= rmin - 1 && num(s.reps) <= rmax + 2) inRange++; });
      if (ws.some(s => s.fail) && p && rirRange(p.rir)[0] >= 2) fix.push(e.n + ': serie a cedimento, ma in questa fase ne servono ' + p.rir + ' di scorta. Il cedimento non serve e allunga il recupero.');
    }
    items.push(r);
  });
  // completezza
  const comp = usePlan && planned ? clamp01(doneSets / planned) : null;
  if (comp != null) {
    if (comp >= 0.95) good.push('Hai fatto tutte le serie previste (' + doneSets + '/' + planned + ').');
    else fix.push('Fatte ' + doneSets + ' serie su ' + planned + ' previste' + (skipped.length ? '; saltati: ' + skipped.map(id => (EX[id] || { n: id }).n).join(', ') : '') + '.');
  }
  if (!rpeSeen && h.items.some(it => (EX[it.ex] || {}).type !== 'time')) fix.push('Segna l\'RPE in Hevy (quanto era dura la serie, da 6 a 10): la valutazione dell\'intensità diventa precisa.');
  const ups = items.filter(i => i.kind === 'up').length;
  if (ups >= 2) good.push('In progresso su ' + ups + ' esercizi.');
  const parts = [
    { k: 'comp', n: 'Completezza', w: 0.35, v: comp },
    { k: 'perf', n: 'Prestazione', w: 0.35, v: perfN ? perfSum / perfN : null },
    { k: 'int', n: rpeSeen ? 'Intensità (RPE)' : 'Intensità', w: 0.2, v: intN ? intSum / intN : null },
    { k: 'range', n: 'Ripetizioni nel range', w: 0.1, v: rangeN ? inRange / rangeN : null }
  ];
  const act = parts.filter(x => x.v != null), wsum = act.reduce((a, x) => a + x.w, 0);
  const score = act.length ? Math.max(1, Math.round(10 * act.reduce((a, x) => a + x.w * x.v, 0) / wsum * 10) / 10) : null;
  const label = score == null ? 'Seduta di taratura' : score >= 8.5 ? 'Ottima' : score >= 7 ? 'Buona' : score >= 5.5 ? 'Discreta' : 'Da rivedere';
  return { at: Date.now(), score, label, parts, items, good: good.slice(0, 5), fix: fix.slice(0, 6), planned: !!usePlan, dur: Math.round((h.end - h.start) / 60000) };
}

/* ---------- vista ---------- */
const VAL_KIND = { up: ['↑', 'good'], same: ['=', 'muted'], down: ['↓', 'bad'], first: ['•', 'muted'] };
VIEWS.valutazione = p => {
  const h = S.history.find(x => x.id === p.id) || S.history.filter(x => x.val).slice(-1)[0];
  if (!h) return header('Valutazione', { back: true }) + '<div class="pad"><div class="empty">Ancora nessun allenamento da Hevy.</div></div>';
  const v = h.val || (h.val = evaluateWorkout(h)), latest = S.history.filter(x => !x.quick && x.items.length).slice(-1)[0] === h;
  const pct = v.score == null ? 0 : v.score * 10;
  const nut = nutritionTargets();
  return header('Valutazione', { back: true, noGear: true, sub: esc(h.name) + ' · ' + fmtDateLong(h.start) }) + '<div class="pad">' +
    '<div class="card hero center val-hero"><div class="ring" style="--p:' + pct + '"><b>' + (v.score == null ? '—' : fmtKg(v.score)) + '</b><small>/10</small></div><h2>' + esc(v.label) + '</h2>' +
      '<div class="muted small">' + v.dur + ' min · ' + h.items.reduce((a, it) => a + workSets(it).length, 0) + ' serie' + (v.planned ? ' · confrontata con la routine di Coach' : ' · seduta libera') + '</div></div>' +
    '<div class="card"><h3>Come nasce il voto</h3>' + v.parts.map(x => '<div class="vpart"><span>' + esc(x.n) + ' <small class="muted">' + Math.round(x.w * 100) + '%</small></span>' +
      (x.v == null ? '<small class="muted">non calcolabile</small>' : '<div class="gbar"><i style="width:' + Math.round(x.v * 100) + '%"></i></div><b>' + Math.round(x.v * 100) + '%</b>') + '</div>').join('') + '</div>' +
    (v.good.length ? '<div class="card"><h3>' + ic('check', 'inline') + 'Bene</h3><ul class="tips">' + v.good.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '') +
    (v.fix.length ? '<div class="card"><h3>' + ic('coach', 'inline') + 'Da migliorare</h3><ul class="tips">' + v.fix.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '') +
    '<div class="card"><h3>Esercizio per esercizio</h3>' + v.items.map(r => {
      const k = VAL_KIND[r.kind] || VAL_KIND.first, e = EX[r.ex] || {};
      const nx = latest && e.type !== 'time' && typeof progression === 'function' ? progression(r.ex, r.rmin, r.rmax) : null;
      return '<div class="list-item flat"><div><b>' + (r.pr ? '🏆 ' : '') + exLine(r.ex) + ' <span class="' + k[1] + '">' + k[0] + '</span></b><small>' + esc(r.sets) + '</small><small class="' + k[1] + '">' + esc(r.txt) + '</small>' +
        (nx && nx.text ? '<small><b>Prossima volta:</b> ' + esc(nx.text) + '</small>' : '') + '</div></div>';
    }).join('') + '</div>' +
    (latest && hvOn() ? '<p class="small muted">' + ic('check', 'inline') + 'Carichi e ripetizioni della prossima volta sono già scritti nelle routine di Hevy.</p>' : '') +
    (latest ? '<div class="card meal"><h3>' + ic('dumbbell', 'inline') + 'Adesso: pasto di recupero</h3><p class="small muted">Entro 1–2 ore: proteine (' + (nut.protein ? Math.round(nut.protein / 4) + ' g circa' : '25–40 g') + ') e carboidrati per ricaricare. Bevi 500 ml d\'acqua.</p></div>' : '') +
    '<button class="btn wide big" data-act="tab" data-v="home">Torna alla home</button></div>';
};
VIEWS.summary = p => VIEWS.valutazione(p);

/* andamento dei voti in Progressi */
function valTrendCard() {
  const L = S.history.filter(h => h.val && h.val.score != null).slice(-20);
  if (!L.length) return '';
  const avg = L.slice(-5).reduce((a, h) => a + h.val.score, 0) / Math.min(5, L.length);
  return '<div class="card"><div class="card-h"><h3>Voto delle sedute</h3><span class="muted small">media ultime 5: <b>' + fmtKg(Math.round(avg * 10) / 10) + '</b></span></div>' +
    lineChart(L.map(h => ({ x: h.start, y: h.val.score }))) +
    L.slice().reverse().slice(0, 8).map(h => '<button class="list-item" data-act="go" data-v="valutazione" data-id="' + h.id + '"><div><b>' + esc(h.name) + '</b><small>' + fmtDate(h.start) + ' · ' + esc(h.val.label) + '</small></div><b>' + fmtKg(h.val.score) + '</b></button>').join('') + '</div>';
}
function lastValCard() {
  const h = S.history.filter(x => x.val && !x.quick).slice(-1)[0];
  if (!h || h.start < Date.now() - 4 * 864e5) return '';
  return '<button class="card trainer" data-act="go" data-v="valutazione" data-id="' + h.id + '"><div class="eyebrow">' + ic('chart', 'inline') + 'Ultima seduta</div><p><b>' + esc(h.name) + ': ' + (h.val.score == null ? 'taratura' : fmtKg(h.val.score) + '/10 · ' + esc(h.val.label)) + '</b><br><small class="muted">' + esc((h.val.fix[0] || h.val.good[0] || 'Vedi i dettagli e cosa fare la prossima volta.')) + '</small></p></button>';
}
