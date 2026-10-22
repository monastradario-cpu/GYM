/* GYM — programma a cicli, massimali e percentuali, misure corporee (metodo US Navy), statistiche avanzate */
'use strict';

/* ===== Programma a cicli (mesocicli di 5 settimane: 4 di progressione + 1 di scarico) =====
   Il trainer sceglie il tipo dagli obiettivi. Basi: progressione di volume e vicinanza al cedimento (Pelland 2025,
   Robinson 2024), scarico ogni 4–6 settimane (Bell 2023), percentuali del massimale per la forza (ACSM 2026). */
const CYCLE_KINDS = {
  ipertrofia: { n: 'Ipertrofia', d: 'Volume che sale e ti avvicini al cedimento settimana dopo settimana, poi scarico.',
    w: [{ add: 0, rir: 3, t: 'Adattamento: serie di sempre, resta a 3 ripetizioni dal cedimento.' }, { add: 0, rir: 2, t: 'Spingi di più: 2 ripetizioni di scorta.' }, { add: 1, rir: 2, t: 'Volume +1 serie sugli esercizi principali e complementari.' }, { add: 1, rir: 1, t: 'Settimana più dura: +1 serie, 1 ripetizione di scorta.' }, { deload: true, t: 'Scarico: metà delle serie, stessi carichi, lontano dal cedimento.' }] },
  forza: { n: 'Forza', d: 'Carichi in percentuale del massimale che salgono, ripetizioni che scendono, poi scarico.',
    w: [{ sets: 5, reps: 5, pct: 0.75, rir: 3, t: '5×5 al 75% del massimale sugli esercizi principali.' }, { sets: 5, reps: 4, pct: 0.80, rir: 2, t: '5×4 all\'80%.' }, { sets: 4, reps: 3, pct: 0.85, rir: 2, t: '4×3 all\'85%.' }, { sets: 3, reps: 2, pct: 0.88, rir: 1, t: '3×2 all\'88%: carichi pesanti, tecnica perfetta.' }, { deload: true, t: 'Scarico: 3×5 al 60%, recupera prima del nuovo ciclo.' }] },
  mantenimento: { n: 'Tonificazione e mantenimento', d: 'Volume stabile e intensità costante: ideale in deficit calorico o per stare in forma.',
    w: [{ add: 0, rir: 2, t: 'Serie di sempre, 2 ripetizioni di scorta.' }, { add: 0, rir: 2, t: 'Prova ad aggiungere una ripetizione o un po\' di carico.' }, { add: 0, rir: 2, t: 'Stessa intensità, cura la tecnica.' }, { add: 0, rir: 1, t: 'Settimana più intensa: 1 ripetizione di scorta.' }, { deload: true, t: 'Scarico: metà delle serie.' }] }
};
function cycleKindFor() { const g = goalsOf(); return g.includes('forza') && !g.includes('massa') ? 'forza' : g.includes('massa') || g.includes('forza') ? 'ipertrofia' : 'mantenimento'; }
function cycleState() {
  S.cycle = S.cycle || { on: true };
  if (!S.cycle.start) { S.cycle.start = startOfWeek(Date.now()).getTime(); }
  return S.cycle;
}
function cycleInfo() {
  if (typeof S === 'undefined' || !S.cycle || !S.cycle.on || !S.onboarded) return { on: false };
  const C = cycleState(), kind = C.kind || cycleKindFor(), K = CYCLE_KINDS[kind], len = K.w.length;
  const wk = Math.floor((Date.now() - C.start) / (7 * 864e5)), w = ((wk % len) + len) % len, cfg = K.w[w];
  return Object.assign({ on: true, kind, K, w: w + 1, len, n: Math.floor(wk / len) + 1, deload: !!cfg.deload, setsAdd: cfg.add || 0 }, cfg);
}
function cycleCard() {
  const c = cycleInfo(); if (!c.on) return '';
  return '<button class="card cycle-card" data-act="go" data-v="cycle"><div class="eyebrow">' + ic('chart', 'inline') + 'Ciclo ' + c.K.n + ' · settimana ' + c.w + ' di ' + c.len + '</div>' +
    '<div class="cyc-bar">' + c.K.w.map((x, i) => '<i class="' + (i + 1 < c.w ? 'done ' : '') + (i + 1 === c.w ? 'cur ' : '') + (x.deload ? 'dl' : '') + '"></i>').join('') + '</div>' +
    '<small>' + esc(c.t) + (c.rir != null && !c.deload ? ' Ripetizioni di scorta (RIR): ' + c.rir + '.' : '') + '</small></button>';
}
VIEWS.cycle = () => {
  const C = cycleState(), c = cycleInfo(), kind = C.kind || cycleKindFor();
  return header('Programma a cicli', { back: true, noGear: true, sub: 'Deciso dal trainer sui tuoi obiettivi' }) + '<div class="pad">' +
    '<div class="card"><div class="list-item flat"><div><b>Programma a cicli</b><small>Le schede si adattano da sole settimana per settimana</small></div>' + toggle(C.on, 'cycleOn') + '</div>' +
    (C.on ? '<div class="field"><span>Tipo di ciclo</span><div class="chips">' + chip('Decide il trainer (' + CYCLE_KINDS[cycleKindFor()].n + ')', !C.kind, 'cycleKind', 'data-k=""') + Object.keys(CYCLE_KINDS).map(k => chip(CYCLE_KINDS[k].n, C.kind === k, 'cycleKind', 'data-k="' + k + '"')).join('') + '</div></div>' : '') + '</div>' +
    (c.on ? '<div class="card"><h3>' + esc(c.K.n) + ' · ciclo n. ' + c.n + '</h3><p class="small muted">' + esc(c.K.d) + '</p>' +
      c.K.w.map((x, i) => '<div class="list-item flat cyc-w' + (i + 1 === c.w ? ' cur' : '') + '"><div><b>Settimana ' + (i + 1) + (x.deload ? ' · scarico' : '') + (i + 1 === c.w ? ' · adesso' : '') + '</b><small>' + esc(x.t) + (x.rir != null && !x.deload ? ' RIR ' + x.rir + '.' : '') + '</small></div></div>').join('') +
      '<button class="btn ghost wide" data-act="cycleRestart">' + ic('swap') + 'Ricomincia dalla settimana 1</button></div>' : '') +
    '<p class="small muted">RIR = ripetizioni che ti restano "in canna" a fine serie. In settimana di scarico le serie si dimezzano da sole.</p></div>';
};

/* ===== Massimali e percentuali ===== */
function maxOf(id) {
  const t = (S.maxes || {})[id], r = records(id);
  if (t && t.kg) return { kg: t.kg, tested: true, d: t.d };
  return r.e1rm ? { kg: Math.round(r.e1rm * 2) / 2, tested: false, d: r.e1Date } : null;
}
const repsAt = (one, w) => w >= one ? 1 : Math.max(1, Math.round(30 * (one / w - 1)));
PROG.massimali = () => {
  const ids = [...new Set(S.history.flatMap(h => (h.items || []).map(i => i.ex)))].filter(id => EX[id] && EX[id].eq !== 'corpo' && maxOf(id));
  const main = ['squat_bil', 'panca_piana_bil', 'stacco_bil', 'military_bil', 'rematore_bil'];
  ids.sort((a, b) => (main.includes(b) - main.includes(a)) || (maxOf(b).kg - maxOf(a).kg));
  const sel = UI.maxEx && maxOf(UI.maxEx) ? UI.maxEx : ids[0];
  let out = '<div class="card"><h3>' + ic('chart', 'inline') + 'I tuoi massimali</h3><p class="small muted">Stimati dalle tue serie (formula di Epley) o inseriti da te dopo un test. Tocca un esercizio per la tabella delle percentuali.</p>' +
    (ids.length ? ids.slice(0, 20).map(id => { const m = maxOf(id); return '<button class="list-item btnlike' + (id === sel ? ' on' : '') + '" data-act="maxSel" data-id="' + id + '"><div><b>' + esc(EX[id].n) + '</b><small>' + (m.tested ? 'testato' : 'stimato') + (m.d ? ' · ' + fmtDate(m.d) : '') + '</small></div><b>' + fmtKg(m.kg) + ' kg</b></button>'; }).join('')
      : '<div class="empty small">Fai qualche allenamento con i pesi: qui compariranno i massimali stimati.</div>') + '</div>';
  if (sel) {
    const m = maxOf(sel), step = stepFor(sel);
    out += '<div class="card"><div class="card-h"><h3>' + esc(EX[sel].n) + '</h3><button class="btn sm ghost" data-act="maxSet" data-id="' + sel + '">Inserisci test</button></div>' +
      '<div class="pct-t"><div class="pct-h"><span>%</span><span>Carico</span><span>Ripetizioni circa</span><span>Per cosa</span></div>' +
      [100, 95, 90, 85, 80, 75, 70, 65, 60, 50].map(p => { const kg = Math.round(m.kg * p / 100 / step) * step; return '<div class="pct-r' + (p >= 85 ? ' hi' : '') + '"><span>' + p + '%</span><b>' + fmtKg(kg) + ' kg</b><span>' + (p === 100 ? 1 : repsAt(m.kg, m.kg * p / 100)) + '</span><small>' + (p >= 85 ? 'forza' : p >= 67 ? 'ipertrofia/forza' : p >= 55 ? 'tecnica, riscaldamento' : 'riscaldamento') + '</small></div>'; }).join('') + '</div>' +
      '<p class="small muted">Carichi arrotondati al salto disponibile (' + fmtKg(step) + ' kg). La stima è più precisa con serie da 3 a 8 ripetizioni.</p></div>';
  }
  out += '<div class="card"><h3>Come testare il massimale in sicurezza</h3><ol class="steps num"><li>Riscaldamento: 5 minuti di cardio leggero, poi 10 ripetizioni col 40–50%.</li><li>5 ripetizioni al 60%, 3 al 70%, 2 all\'80%, 1 al 90% (riposa 2–3 minuti tra le serie).</li><li>Prova il massimale: aumenta di 2,5–5 kg alla volta, massimo 3–4 tentativi, 3–5 minuti di riposo.</li><li>Sempre con le sicure o un compagno. Se la tecnica peggiora, fermati: conta l\'ultima ripetizione pulita.</li></ol></div>';
  return out;
};

/* ===== Misure corporee e grasso stimato (US Navy, Hodgdon & Beckett 1984) ===== */
const MEASURES = [['collo', 'Collo'], ['vita', 'Vita (all\'ombelico)'], ['fianchi', 'Fianchi'], ['petto', 'Petto'], ['braccio', 'Braccio (contratto)'], ['coscia', 'Coscia'], ['polpaccio', 'Polpaccio']];
function navyBF(m, sex, h) {
  const lg = Math.log10;
  if (!m || !h || !m.collo || !m.vita) return null;
  if (sex === 'f') { if (!m.fianchi) return null; const v = m.vita + m.fianchi - m.collo; if (v <= 0) return null; return 495 / (1.29579 - 0.35004 * lg(v) + 0.22100 * lg(h)) - 450; }
  const v = m.vita - m.collo; if (v <= 0) return null;
  return 495 / (1.0324 - 0.19077 * lg(v) + 0.15456 * lg(h)) - 450;
}
function lastBF() {
  const L = S.measures || [], p = S.profile;
  for (let i = L.length - 1; i >= 0; i--) { const b = navyBF(L[i], p.sex, num(p.height)); if (b != null && b > 2 && b < 60) return { bf: Math.round(b * 10) / 10, d: L[i].d }; }
  return null;
}
PROG.misure = () => {
  const L = (S.measures || []).slice().sort((a, b) => a.d - b.d), p = S.profile, last = L[L.length - 1], prev = L[L.length - 2];
  const w = S.weights.length ? S.weights[S.weights.length - 1].kg : 0, bf = lastBF();
  let out = '<button class="btn wide big" data-act="measAdd">' + ic('plus') + 'Nuove misure</button>';
  if (!p.height || !p.sex) out += '<div class="note">Per la % di grasso servono sesso e altezza nel profilo.</div>';
  if (bf) {
    const ffm = w ? Math.round(w * (1 - bf.bf / 100) * 10) / 10 : 0;
    out += '<div class="card"><div class="stats3"><div><b>' + fmtKg(bf.bf) + '%</b><small>grasso stimato</small></div><div><b>' + (ffm ? fmtKg(ffm) + ' kg' : '—') + '</b><small>massa magra</small></div><div><b>' + (w ? fmtKg(Math.round((w - ffm) * 10) / 10) + ' kg' : '—') + '</b><small>massa grassa</small></div></div>' +
      lineChart(L.map(m => ({ x: m.d, y: navyBF(m, p.sex, num(p.height)) })).filter(x => x.y != null && x.y > 2).map(x => ({ x: x.x, y: Math.round(x.y * 10) / 10 }))) +
      '<p class="small muted">Metodo US Navy (metro da sarta): errore tipico ±3–4% rispetto alla DEXA. Conta soprattutto la tendenza: misura sempre al mattino, a digiuno, nello stesso punto.</p></div>';
  }
  if (last) out += '<div class="card"><h3>Ultime misure · ' + fmtDate(last.d) + '</h3>' + MEASURES.filter(([k]) => last[k]).map(([k, l]) => { const dv = prev && prev[k] ? Math.round((last[k] - prev[k]) * 10) / 10 : null; return '<div class="list-item flat"><div><b>' + l + '</b></div><span>' + fmtKg(last[k]) + ' cm' + (dv ? ' <small class="' + ((k === 'vita' || k === 'fianchi') === (dv < 0) ? 'good' : 'muted') + '">' + (dv > 0 ? '+' : '') + fmtKg(dv) + '</small>' : '') + '</span></div>'; }).join('') + '</div>' +
    '<div class="card"><h3>Vita nel tempo</h3>' + lineChart(L.filter(m => m.vita).map(m => ({ x: m.d, y: m.vita }))) + '</div>' +
    '<div class="card"><h3>Storico</h3>' + L.slice().reverse().map((m, i) => '<button class="list-item btnlike" data-act="measEdit" data-i="' + (L.length - 1 - i) + '"><div><b>' + fmtDate(m.d) + '</b><small>' + MEASURES.filter(([k]) => m[k]).map(([k, l]) => l.split(' ')[0] + ' ' + fmtKg(m[k])).join(' · ') + '</small></div>' + ic('edit') + '</button>').join('') + '</div>';
  else out += '<div class="empty">Prendi le misure con un metro da sarta: collo sotto il pomo d\'Adamo, vita all\'altezza dell\'ombelico' + (p.sex === 'f' ? ', fianchi nel punto più largo' : '') + '.</div>';
  return out;
};
function measSheet() {
  const M = UI.meas, sex = S.profile.sex;
  return '<h3>Misure corporee (cm)</h3><p class="small muted">Al mattino, a digiuno, metro aderente ma senza stringere.</p><div class="grid2">' +
    MEASURES.filter(([k]) => k !== 'fianchi' || sex !== 'm').map(([k, l]) => field(l + (k === 'collo' || k === 'vita' || (k === 'fianchi' && sex === 'f') ? ' *' : ''), numIn(M[k] || '', 'data-in="meas" data-k="' + k + '"'))).join('') + '</div>' +
    '<p class="small muted">* servono per stimare la % di grasso.</p><button class="btn wide big" data-act="measSave">' + ic('check') + 'Salva</button>' +
    (M.i != null ? '<button class="btn danger ghost wide" data-act="measDel">' + ic('trash') + 'Elimina</button>' : '');
}

/* ===== Statistiche avanzate ===== */
function monthStats(y, m) {
  const list = S.history.filter(h => { const d = new Date(h.start); return d.getFullYear() === y && d.getMonth() === m; });
  let sets = 0, vol = 0, time = 0, prs = 0;
  list.forEach(h => { time += (h.end - h.start) / 1000; prs += (h.prs || []).length; (h.items || []).forEach(it => it.sets.filter(s => !s.wu).forEach(s => { sets++; vol += num(s.kg) * num(s.reps); })); });
  return { n: list.length, sets, vol, time, prs };
}
PROG.statistiche = () => {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth(), pm = m ? m - 1 : 11, py = m ? y : y - 1;
  const a = monthStats(y, m), b = monthStats(py, pm), MN = d => new Date(d[0], d[1], 1).toLocaleDateString('it-IT', { month: 'long' });
  const cmp = (lbl, va, vb, f) => { const dv = vb ? Math.round((va - vb) / vb * 100) : null; return '<div class="cmp-r"><span>' + lbl + '</span><b>' + f(va) + '</b><span class="muted">' + f(vb) + '</span><small class="' + (dv > 0 ? 'good' : dv < 0 ? 'bad' : 'muted') + '">' + (dv == null ? '' : (dv > 0 ? '+' : '') + dv + '%') + '</small></div>'; };
  let out = '<div class="card"><h3>Questo mese contro il precedente</h3><div class="cmp-r head"><span></span><b>' + MN([y, m]) + '</b><span>' + MN([py, pm]) + '</span><small></small></div>' +
    cmp('Allenamenti', a.n, b.n, v => v) + cmp('Serie', a.sets, b.sets, v => v) + cmp('Volume', a.vol, b.vol, v => v >= 1000 ? fmtKg(Math.round(v / 100) / 10) + ' t' : Math.round(v) + ' kg') + cmp('Tempo', a.time, b.time, v => fmtDur(v)) + cmp('Record', a.prs, b.prs, v => v) + '</div>';
  // costanza: allenamenti per settimana (12 settimane)
  const wk = []; for (let i = 11; i >= 0; i--) { const s = startOfWeek(Date.now()); s.setDate(s.getDate() - 7 * i); const e = new Date(s); e.setDate(e.getDate() + 7); wk.push({ label: s.getDate() + '/' + (s.getMonth() + 1), value: S.history.filter(h => h.start >= s && h.start < e).length, hi: i === 0 }); }
  out += '<div class="card"><h3>Costanza (allenamenti a settimana)</h3>' + barChart(wk) + '<p class="small muted">Obiettivo: ' + S.profile.days.length + ' a settimana.</p></div>';
  // serie per muscolo nelle ultime 8 settimane
  const weeks = [...Array(8)].map((_, i) => { const s = startOfWeek(Date.now()); s.setDate(s.getDate() - 7 * (7 - i)); return s.getTime(); });
  const load = {}; Object.keys(MUSCLES).forEach(k => { load[k] = weeks.map(() => 0); });
  S.history.forEach(h => { const wi = weeks.findIndex((w, i) => h.start >= w && h.start < (weeks[i + 1] || w + 7 * 864e5)); if (wi < 0) return; (h.items || []).forEach(it => { const e = EX[it.ex], n = workSets(it).length; if (!e || !n || !load[e.m]) return; load[e.m][wi] += n; e.s.forEach(x => { if (load[x]) load[x][wi] += n * 0.5; }); }); });
  out += '<div class="card"><h3>Serie a settimana per muscolo</h3><p class="small muted">Ultime 8 settimane. La fascia verde è la zona consigliata (10–20 serie).</p>' +
    Object.keys(MUSCLES).map(k => { const v = load[k], mx = Math.max(22, ...v); return '<div class="mspark"><span>' + MUSCLES[k] + '</span><svg viewBox="0 0 160 30" preserveAspectRatio="none"><rect x="0" y="' + (30 - 20 / mx * 30) + '" width="160" height="' + (10 / mx * 30) + '" class="band"/>' + v.map((x, i) => '<rect x="' + (i * 20 + 3) + '" y="' + (30 - x / mx * 30) + '" width="14" height="' + (x / mx * 30) + '" rx="2" class="' + (i === 7 ? 'cur' : '') + '"/>').join('') + '</svg><b>' + fmtKg(Math.round(v[7] * 10) / 10) + '</b></div>'; }).join('') + '</div>';
  // miglioramenti di forza (8 settimane)
  const since = Date.now() - 56 * 864e5, gains = [];
  [...new Set(S.history.flatMap(h => (h.items || []).map(i => i.ex)))].forEach(id => {
    const hist = exerciseHistory(id).slice().reverse(); if (hist.length < 2) return;
    const old = hist.filter(x => x.date < since).pop() || hist[0], cur = hist[hist.length - 1];
    const e0 = Math.max(...old.sets.map(s => e1rm(num(s.kg), num(s.reps)))), e1 = Math.max(...cur.sets.map(s => e1rm(num(s.kg), num(s.reps))));
    if (e0 > 0 && old !== cur) gains.push({ id, pct: (e1 - e0) / e0 * 100, e0, e1 });
  });
  gains.sort((x, y2) => y2.pct - x.pct);
  out += '<div class="card"><h3>Progressi di forza (ultime 8 settimane)</h3>' + (gains.length ? gains.slice(0, 8).map(g => '<button class="list-item btnlike" data-act="exInfo" data-id="' + g.id + '"><div><b>' + esc(EX[g.id].n) + '</b><small>massimale stimato ' + Math.round(g.e0) + ' → ' + Math.round(g.e1) + ' kg</small></div><b class="' + (g.pct >= 0 ? 'good' : 'bad') + '">' + (g.pct >= 0 ? '+' : '') + fmtKg(Math.round(g.pct * 10) / 10) + '%</b></button>').join('') : '<div class="empty small">Servono almeno due sedute dello stesso esercizio.</div>') + '</div>';
  return out;
};
