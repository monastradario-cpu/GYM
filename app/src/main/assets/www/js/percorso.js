/* GYM — percorso su misura: questionario iniziale (fisico, vita, attività, dolori, obiettivi misurabili),
   adattamenti della scheda, percorso a 3 fasi da 4 settimane con controlli, check-in prima di ogni seduta.
   Basi: OMS 2020 (attività, equilibrio dopo i 65 anni), ACSM 2026 (pesi), FAO/OMS/UNU 2004 (livelli di attività PAL),
   Fragala 2019 NSCA (anziani: potenza ed equilibrio), Helms 2014 / ISSN 2017 (dieta), Bell 2023 (scarico). */
'use strict';

/* ---------- dati del questionario ---------- */
const BODY_TYPES = {
  magro: { n: 'Magro', d: 'Poco muscolo e poco grasso', w: 0.86, goals: ['massa'] },
  normo: { n: 'Normopeso', d: 'Nella media, senza eccessi', w: 1, goals: ['tonificazione'] },
  skinnyfat: { n: 'Skinny fat', d: 'Peso normale, poco muscolo, grasso sulla pancia', w: 1.04, goals: ['massa', 'dimagrimento'] },
  atletico: { n: 'Atletico', d: 'Muscoli visibili, poco grasso', w: 1.08, goals: ['massa', 'forza'] },
  sovrappeso: { n: 'Sovrappeso', d: 'Qualche chilo di troppo', w: 1.2, goals: ['dimagrimento', 'tonificazione'] },
  obeso: { n: 'Obesità', d: 'Molti chili da perdere', w: 1.36, goals: ['dimagrimento', 'benessere'] }
};
const JOBS = { seduto: ['Seduto quasi sempre', 'Ufficio, auto, studio', 1.4], piedi: ['Spesso in piedi', 'Negozio, insegnamento, sanità', 1.55], fisico: ['Lavoro fisico', 'Cantiere, magazzino, campi', 1.75] };
const STEPS = { s1: ['Meno di 5.000', -0.05], s2: ['5.000–8.000', 0], s3: ['8.000–12.000', 0.05], s4: ['Più di 12.000', 0.1] };
const SLEEP = { h1: ['Meno di 6 ore', 0], h2: ['6–7 ore', 1], h3: ['7–9 ore', 2], h4: ['Più di 9 ore', 2] };
const STRESS = { basso: 'Basso', medio: 'Medio', alto: 'Alto' };
const SPORTS = { yoga: 'Yoga', pilates: 'Pilates', camminate: 'Camminate' };
const PLACES = { palestra: 'In palestra', casa: 'A casa' };
const HOME_EQ = ['corpo', 'manubri', 'elastici', 'kettlebell'];
const PAIN_ZONES = { schiena: 'Schiena / lombari', spalle: 'Spalle', ginocchia: 'Ginocchia', polsi: 'Polsi', gomiti: 'Gomiti', anche: 'Anche', collo: 'Collo' };
const JUMPS = /salt|jump|burpee|skip|balz|jack|plio|sprint|box jump|scatt/i;

/* esercizi da evitare per zona dolorante (schema di movimento + nome) */
function painHit(e, z) {
  const n = e.n, p = e.pat;
  if (z === 'schiena') return ['stacco', 'hinge', 'olimpico', 'swing'].includes(p) || /good morning|iperestension/i.test(n) || (e.eq === 'bilanciere' && (p === 'squat' || p === 'tirata_orizz'));
  if (z === 'spalle') return ['spinta_vert', 'spinta_vert_giu', 'olimpico', 'pullover'].includes(p) || /dietro la nuca|tirat\w* al mento|ghigliottina|dip/i.test(n);
  if (z === 'ginocchia') return ['affondo', 'estensione_ginocchio'].includes(p) || /sissy|pistol|una gamba|bulgar|leg extension/i.test(n) || JUMPS.test(n);
  if (z === 'polsi') return p === 'polso' || /piegament|push-up|front squat|plank su mani/i.test(n);
  if (z === 'gomiti') return /french|skull|dietro la testa|dip/i.test(n);
  if (z === 'anche') return ['abduzione', 'affondo', 'olimpico'].includes(p) || /sumo/i.test(n);
  if (z === 'collo') return ['collo', 'scrollata'].includes(p) || /dietro la nuca/i.test(n);
  return false;
}

/* ---------- calcoli dal profilo ---------- */
function curWeight() { const W = S.weights || []; return W.length ? W[W.length - 1].kg : 0; }
function bmiOf() { const w = curWeight(), h = num(S.profile.height) / 100; return w && h ? w / (h * h) : 0; }
function pathOn() { return !!(S.profile && S.profile.path); }
/* livello di attività fisica (PAL, FAO/OMS/UNU 2004): lavoro + passi + allenamenti + altre attività */
function palFor(p) {
  if (!p || !p.job || !JOBS[p.job]) return null;
  let pal = JOBS[p.job][2] + (STEPS[p.steps] ? STEPS[p.steps][1] : 0);
  const hours = (p.days || []).length * (num(p.minutes) || 60) / 60;
  pal += Math.min(0.2, hours * 0.03);
  Object.keys(p.sport || {}).forEach(k => { pal += (k === 'camminate' ? 0.02 : 0.01) * Math.min(7, num(p.sport[k])); });
  return Math.round(Math.max(1.3, Math.min(2.2, pal)) * 100) / 100;
}
function lowRecovery() { const p = S.profile; return (p.sleep === 'h1' ? 1 : 0) + (p.stress === 'alto' ? 1 : 0); }
function isOlder() { return num(S.profile.age) >= 50; }
function heavyBody() { return bmiOf() >= 30 || S.profile.body === 'obeso'; }

/* l'esercizio va bene per te? (dolori, luogo, salti con BMI alto) */
/* esercizio di equilibrio su una gamba compatibile con i dolori indicati (nessuno se non ce n'è uno sicuro) */
function balanceEx() { return ['stacco_gamba_kettlebell', 'step_up'].find(id => okFor(id)) || null; }
function okFor(id, extraZones) {
  const e = EX[id]; if (!e) return false;
  const p = S.profile, zones = (p.pain || []).concat(extraZones || []);
  if (zones.some(z => painHit(e, z))) return false;
  if (p.place === 'casa' && !HOME_EQ.includes(e.eq)) return false;
  if (heavyBody() && JUMPS.test(e.n)) return false;
  return true;
}
/* sostituisce un esercizio non adatto con l'alternativa più simile adatta */
function adaptEx(id, extraZones, main) {
  if (okFor(id, extraZones)) return id;
  const lv = S.profile.level, fits = x => okFor(x.id, extraZones) && !(x.lvl === 3 && lv !== 'avanzato');
  const alts = alternatives(id).filter(fits);
  const a = (main && alts.find(x => x.core && x.comp)) || alts.find(x => x.core) || (main && alts.find(x => x.comp)) || alts.find(x => x.eq === 'macchinari' || x.eq === 'cavi') || alts[0] ||
    EXERCISES.find(x => x.m === EX[id].m && okFor(x.id, extraZones) && !x.niche && !isBreakEx(x) && x.pat !== 'condizionamento');
  return a ? a.id : id;
}

/* ---------- prescrizione adattata ---------- */
const _prescribe = prescribe;
prescribe = function (exId, role) {
  const r = _prescribe(exId, role);
  if (!pathOn() || r.secs) return r;
  // sonno scarso o stress alto: nella prima fase una serie in meno sugli esercizi non principali
  if (lowRecovery() && pathPhase() === 1 && r.role !== 'main') r.sets = Math.max(2, r.sets - 1);
  // dopo i 50 anni: ripetizioni un po' più alte sui principali, recuperi pieni
  if (isOlder() && r.role === 'main' && !goalsOf().includes('forza')) { r.rmin = Math.max(r.rmin, 8); r.rmax = Math.max(r.rmax, 12); r.rest = Math.max(r.rest, 120); }
  return r;
};
const _trainerNote = trainerNote;
trainerNote = function (item) {
  let t = _trainerNote(item);
  if (pathOn() && isOlder() && (item.role || defaultRole(item.ex)) === 'main' && !deloadActive()) t += ' Sali più veloce che puoi mantenendo il controllo: allena la potenza.';
  return t;
};

/* minuti stimati di una scheda (riscaldamento 8 min) */
function estMinutes(items) { return Math.round(8 + items.reduce((a, it) => a + (it.sets || 3) * ((it.secs || 40) + (it.rest || 60)) / 60 + 1, 0)); }
const _splitItems = splitItems;
splitItems = function (key, level) {
  let items = _splitItems(key, level);
  if (!pathOn()) return items;
  items = items.map(it => { const id = adaptEx(it.ex, null, it.role === 'main'); return id === it.ex ? it : prescribe(id, it.role); });
  // dopo i 50 anni: un esercizio di equilibrio nelle schede con le gambe (OMS 2020, Fragala 2019)
  const bal = isOlder() && /full|lower|legs/.test(key) ? balanceEx() : null;
  if (bal && !items.some(i => i.ex === bal)) items.splice(Math.min(items.length, 3), 0, prescribe(bal, 'acc'));
  // togli doppioni nati dalle sostituzioni
  const seen = new Set(); items = items.filter(i => !seen.has(i.ex) && seen.add(i.ex));
  // sta nei minuti scelti: si tolgono prima isolamento e core
  const max = num(S.profile.minutes) || 0;
  while (max && items.length > 3 && estMinutes(items) > max) {
    let k = -1; for (let i = items.length - 1; i >= 0; i--) if (items[i].role === 'core' || items[i].role === 'acc') { k = i; break; }
    if (k < 0) k = items.length - 1;
    items.splice(k, 1);
  }
  return items;
};

/* ---------- percorso a fasi: 3 fasi da 4 settimane (3 di carico + 1 di scarico) ---------- */
const PHASES = [
  { n: 'Base', d: 'Tecnica, abitudine e carichi di partenza.' },
  { n: 'Sviluppo', d: 'Più volume: è la fase in cui si costruisce di più.' },
  { n: 'Intensificazione', d: 'Carichi più alti e serie più vicine al cedimento.' }
];
function buildPathCycle() {
  const g = goalsOf(), strength = g.includes('forza') && !g.includes('massa'), lr = lowRecovery();
  const w = [];
  // fase 1
  w.push({ add: 0, rir: 3, t: 'Base · settimana 1: impara i movimenti, resta a 3 ripetizioni dal cedimento.' });
  w.push({ add: 0, rir: lr ? 3 : 2, t: 'Base · settimana 2: stessi esercizi, prova ad aggiungere ripetizioni.' });
  w.push({ add: 0, rir: 2, t: 'Base · settimana 3: 2 ripetizioni di scorta, carichi in salita.' });
  w.push({ deload: true, t: 'Scarico di fine fase: metà delle serie, stessi carichi. Poi il controllo.' });
  // fase 2
  w.push({ add: lr ? 0 : 1, rir: 2, t: 'Sviluppo · settimana 1: +1 serie sui principali e complementari.' });
  w.push({ add: lr ? 0 : 1, rir: 1, t: 'Sviluppo · settimana 2: 1–2 ripetizioni di scorta.' });
  w.push({ add: 1, rir: 1, t: 'Sviluppo · settimana 3: la più impegnativa della fase.' });
  w.push({ deload: true, t: 'Scarico di fine fase: metà delle serie. Poi il controllo.' });
  // fase 3
  if (strength) {
    w.push({ sets: 5, reps: 5, pct: 0.75, rir: 3, t: 'Intensificazione · 5×5 al 75% del massimale sui principali.' });
    w.push({ sets: 4, reps: 4, pct: 0.80, rir: 2, t: 'Intensificazione · 4×4 all\'80%.' });
    w.push({ sets: 3, reps: 3, pct: 0.85, rir: 2, t: 'Intensificazione · 3×3 all\'85%, tecnica perfetta.' });
  } else {
    w.push({ add: 1, rir: 1, t: 'Intensificazione · settimana 1: carichi più alti, 1 ripetizione di scorta.' });
    w.push({ add: 1, rir: isOlder() ? 1 : 0, t: 'Intensificazione · settimana 2: l\'ultima serie fino quasi al cedimento.' });
    w.push({ add: 0, rir: 1, t: 'Intensificazione · settimana 3: mantieni i carichi migliori.' });
  }
  w.push({ deload: true, t: 'Scarico finale e controllo dei 3 mesi: si riparte con un nuovo percorso.' });
  return { n: 'Il tuo percorso', d: '12 settimane in 3 fasi: Base, Sviluppo, Intensificazione. Ogni 4 settimane un controllo.', w };
}
function pathPhase() { const c = typeof cycleInfo === 'function' ? cycleInfo() : null; return c && c.on && c.kind === 'percorso' ? Math.ceil(c.w / 4) : 1; }
const _cycleKindFor = cycleKindFor;
cycleKindFor = function () { return pathOn() ? 'percorso' : _cycleKindFor(); };
Object.defineProperty(CYCLE_KINDS, 'percorso', { get: buildPathCycle, enumerable: false, configurable: true });

/* controllo di fine fase: dovuto quando inizia una nuova fase e non è ancora stato fatto */
function checkpointDue() {
  if (!pathOn()) return null;
  const c = cycleInfo(); if (!c.on || c.kind !== 'percorso') return null;
  const ph = Math.ceil(c.w / 4), key = c.n + '-' + ph;
  if (ph === 1 && c.n === 1) return null;
  const done = (S.path && S.path.checks) || {};
  return done[key] ? null : { key, ph, n: c.n };
}

/* ---------- obiettivi misurabili ---------- */
const STRENGTH_EX = ['panca_piana_bil', 'squat_bil', 'stacco_bil', 'military_bil', 'lat_machine', 'panca_piana_man', 'leg_press', 'chest_press'];
function defaultMGoals() {
  const p = S.profile, w = curWeight(), bmi = bmiOf(), g = {};
  if (w) {
    if (bmi >= 25 || ['sovrappeso', 'obeso', 'skinnyfat'].includes(p.body)) g.peso = { on: true, kg: Math.round(w * (bmi >= 30 ? 0.9 : 0.95)) };
    else if (p.body === 'magro' || bmi < 20) g.peso = { on: true, kg: Math.round(w + 3) };
    else g.peso = { on: false, kg: Math.round(w) };
  }
  g.forza = { on: !!(p.place !== 'casa'), ex: p.place === 'casa' ? 'panca_piana_man' : 'panca_piana_bil', kg: 0 };
  g.vita = { on: ['sovrappeso', 'obeso', 'skinnyfat'].includes(p.body), cm: p.sex === 'f' ? 80 : 94 };
  g.costanza = { on: true, perWeek: (p.days || []).length || 3, weeks: 12 };
  return g;
}
/* andamento lineare (kg o cm al giorno) */
function slopePerDay(pts) {
  if (pts.length < 2) return null;
  const n = pts.length, mx = pts.reduce((a, q) => a + q.x, 0) / n, my = pts.reduce((a, q) => a + q.y, 0) / n;
  const den = pts.reduce((a, q) => a + (q.x - mx) ** 2, 0); if (!den) return null;
  return pts.reduce((a, q) => a + (q.x - mx) * (q.y - my), 0) / den;
}
function weeksText(w) { if (!isFinite(w) || w <= 0) return ''; if (w > 104) return 'oltre 2 anni'; const d = new Date(Date.now() + w * 7 * 864e5); return 'circa ' + Math.ceil(w) + ' settimane (' + d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) + ')'; }
function goalStatus() {
  const G = S.profile.mgoals || {}, out = [];
  if (G.peso && G.peso.on && G.peso.kg) {
    const w = curWeight(), d = G.peso.kg - w;
    const recent = (S.weights || []).filter(x => x.d > Date.now() - 35 * 864e5).map(x => ({ x: x.d / 864e5, y: x.kg }));
    let s = slopePerDay(recent); const span = recent.length ? recent[recent.length - 1].x - recent[0].x : 0;
    if (s == null || span < 10) s = (d < 0 ? -1 : 1) * w * (typeof dietActive === 'function' && dietActive() && S.diet ? S.diet.rate : 0.25) / 100 / 7;
    const wk = s && Math.sign(s) === Math.sign(d) ? Math.abs(d / s) / 7 : Infinity;
    out.push({ k: 'peso', t: 'Peso: ' + fmtKg(w) + ' → ' + fmtKg(G.peso.kg) + ' kg', pct: Math.abs(d) < 0.3 ? 1 : null, eta: Math.abs(d) < 0.3 ? 'Raggiunto!' : wk === Infinity ? 'Al ritmo attuale non ti stai avvicinando: controlla il piano alimentare.' : 'Previsione: ' + weeksText(wk) });
  }
  if (G.forza && G.forza.on && EX[G.forza.ex]) {
    const tr = exerciseTrend(G.forza.ex), cur = tr.length ? tr[0].e1 : 0, tgt = num(G.forza.kg) || (cur ? Math.round(cur * 1.1 / 2.5) * 2.5 : 0);
    let eta = cur ? '' : 'Dopo le prime sedute calcolo il punto di partenza.';
    if (cur && tgt) {
      const pts = tr.slice(0, 8).map(h => ({ x: h.date / 864e5, y: h.e1 })).reverse();
      let s = slopePerDay(pts); const lv = S.profile.level;
      if (s == null || pts.length < 3) s = cur * (lv === 'principiante' ? 0.01 : lv === 'avanzato' ? 0.0025 : 0.005) / 7;
      eta = cur >= tgt ? 'Raggiunto!' : s > 0 ? 'Previsione: ' + weeksText((tgt - cur) / s / 7) : 'Sei in stallo: il controllo di fase adatterà la scheda.';
    }
    out.push({ k: 'forza', t: EX[G.forza.ex].n + ': massimale ' + (cur ? Math.round(cur) + ' → ' : '') + (tgt ? tgt + ' kg' : 'da stimare'), pct: cur && tgt ? Math.min(1, cur / tgt) : null, eta });
  }
  if (G.vita && G.vita.on) {
    const M = (S.measures || []).filter(m => m.vita), last = M[M.length - 1];
    let eta = 'Misura il girovita (Progressi → Misure) per seguire l\'obiettivo.';
    if (last) {
      const pts = M.filter(m => m.d > Date.now() - 60 * 864e5).map(m => ({ x: m.d / 864e5, y: m.vita })), s = slopePerDay(pts), d = G.vita.cm - last.vita;
      eta = d >= 0 ? 'Raggiunto!' : s && s < 0 ? 'Previsione: ' + weeksText(d / s / 7) : 'Servono almeno due misure a distanza di qualche settimana per la previsione.';
    }
    out.push({ k: 'vita', t: 'Girovita: ' + (last ? last.vita + ' → ' : 'sotto i ') + G.vita.cm + ' cm', pct: null, eta });
  }
  if (G.costanza && G.costanza.on) {
    const start = (S.path && S.path.start) || Date.now(), wks = Math.max(1, Math.ceil((Date.now() - start) / (7 * 864e5)));
    let ok = 0; for (let i = 0; i < wks; i++) { const a = start + i * 7 * 864e5, b = a + 7 * 864e5; if (S.history.filter(h => h.start >= a && h.start < b).length >= G.costanza.perWeek) ok++; }
    out.push({ k: 'costanza', t: 'Costanza: ' + G.costanza.perWeek + ' allenamenti a settimana per ' + G.costanza.weeks + ' settimane', pct: Math.min(1, ok / G.costanza.weeks), eta: ok + ' settimane centrate su ' + G.costanza.weeks + '.' });
  }
  return out;
}

/* ---------- figure dei fisici ---------- */
const FISICO_URL = (typeof FIG_REMOTE !== 'undefined' ? FIG_REMOTE : 'fig/') + 'fisici/';
function bodyTypeImg(k, sex) {
  const s = sex === 'f' ? 'f' : 'm', w = BODY_TYPES[k].w;
  // figura generata (se c'è) altrimenti sagoma provvisoria: la figura anatomica allargata o stretta
  return '<span class="bt-img"><img src="' + FISICO_URL + k + '_' + s + '.webp" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">' +
    '<img class="bt-ph" src="fig/corpo_fronte.webp" alt="" style="display:none;transform:scaleX(' + w + ')"></span>';
}

/* ---------- questionario ---------- */
const PP_STEPS = 10;
function ppNav(o, next, label) {
  return '<div class="ob-nav">' + (o.step > (o.redo ? 1 : 0) ? '<button class="btn ghost" data-act="obPrev">Indietro</button>' : (o.redo ? '<button class="btn ghost" data-act="ppCancel">Annulla</button>' : '<span></span>')) +
    '<button class="btn" data-act="' + (next || 'ppNext') + '">' + (label || 'Avanti') + '</button></div>';
}
const ppChoice = (on, act, k, title, sub) => '<button class="opt ' + (on ? 'on' : '') + '" data-act="' + act + '" data-k="' + k + '"><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</button>';
VIEWS.onboarding = () => {
  const o = UI.ob, p = S.profile, r = S.reminders;
  const dots = '<div class="ob-dots">' + [...Array(PP_STEPS)].map((_, i) => '<i class="' + (i <= o.step ? 'on' : '') + '"></i>').join('') + '</div>';
  let body = '';
  if (o.step === 0) body = '<div class="ob-hero">' + ic('dumbbell', 'xl') + '<h1>Benvenuto in GYM</h1><p>Il tuo personal trainer in tasca. Rispondi a qualche domanda: costruisco un percorso di 12 settimane su misura per te, basato sugli studi.</p></div>' + ppNav(o, null, 'Iniziamo');
  if (o.step === 1) body = '<h2>Com\'è il tuo fisico oggi?</h2><div class="field"><span>Sesso</span><div class="seg">' + chip('Uomo', p.sex === 'm', 'setSex', 'data-k="m"') + chip('Donna', p.sex === 'f', 'setSex', 'data-k="f"') + '</div></div>' +
    '<p class="muted small">Tocca la figura più simile a te: serve al trainer per scegliere da dove partire.</p><div class="bt-grid">' +
    Object.keys(BODY_TYPES).map(k => '<button class="bt ' + (p.body === k ? 'on' : '') + '" data-act="ppBody" data-k="' + k + '">' + bodyTypeImg(k, p.sex) + '<b>' + BODY_TYPES[k].n + '</b><small>' + BODY_TYPES[k].d + '</small></button>').join('') + '</div>' + ppNav(o);
  if (o.step === 2) body = '<h2>I tuoi dati</h2><p class="muted">Servono per calorie, proteine e per adattare la scheda all\'età.</p>' +
    '<div class="grid2">' + field('Età', numIn(p.age, 'data-in="prof" data-k="age"', 'es. 35')) + field('Altezza (cm)', numIn(p.height, 'data-in="prof" data-k="height"', 'es. 175')) + '</div>' +
    field('Peso (kg)', numIn(o.weight || curWeight() || '', 'data-in="obWeight"', 'es. 75')) +
    '<h3 class="small muted" style="margin:16px 2px 8px">Da quanto ti alleni con i pesi?</h3>' + Object.keys(LEVELS).map(k => ppChoice(p.level === k, 'setLevel', k, LEVELS[k].n, LEVELS[k].desc)).join('') + ppNav(o);
  if (o.step === 3) body = '<h2>La tua giornata</h2><div class="field"><span>Lavoro</span></div>' + Object.keys(JOBS).map(k => ppChoice(p.job === k, 'ppJob', k, JOBS[k][0], JOBS[k][1])).join('') +
    '<div class="field"><span>Passi al giorno (circa)</span><div class="chips">' + Object.keys(STEPS).map(k => chip(STEPS[k][0], p.steps === k, 'ppSteps', 'data-k="' + k + '"')).join('') + '</div></div>' +
    '<div class="field"><span>Quanto dormi</span><div class="chips">' + Object.keys(SLEEP).map(k => chip(SLEEP[k][0], p.sleep === k, 'ppSleep', 'data-k="' + k + '"')).join('') + '</div></div>' +
    '<div class="field"><span>Stress</span><div class="seg">' + Object.keys(STRESS).map(k => chip(STRESS[k], p.stress === k, 'ppStress', 'data-k="' + k + '"')).join('') + '</div></div>' + ppNav(o);
  if (o.step === 4) body = '<h2>Allenamento e attività</h2><div class="field"><span>Giorni di pesi</span>' + daysChips(p.days, 'setDay') + '</div>' +
    '<p class="muted small">' + (p.days.length ? 'Schede: ' + splitForDays(p.days.length, p.level).map(k => PRESET_SPLITS[k].n).join(' · ') : 'Scegli almeno un giorno') + '</p>' +
    '<div class="field"><span>Fai anche altro? (volte a settimana)</span></div>' + Object.keys(SPORTS).map(k => { const v = num((p.sport || {})[k]); return '<div class="list-item flat"><div><b>' + SPORTS[k] + '</b></div><div class="row gap">' + [0, 1, 2, 3, 5].map(n => chip(n ? n + '×' : 'No', v === n, 'ppSport', 'data-k="' + k + '" data-n="' + n + '"')).join('') + '</div></div>'; }).join('') + ppNav(o);
  if (o.step === 5) body = '<h2>Dove e quanto tempo</h2>' + Object.keys(PLACES).map(k => ppChoice((p.place || 'palestra') === k, 'ppPlace', k, PLACES[k], k === 'casa' ? 'Corpo libero, manubri, elastici, kettlebell' : 'Macchine, bilanciere, manubri e cavi')).join('') +
    '<div class="field"><span>Minuti per seduta (riscaldamento compreso)</span><div class="chips">' + [30, 45, 60, 75, 90].map(m => chip(m + ' min', num(p.minutes || 60) === m, 'ppMin', 'data-k="' + m + '"')).join('') + '</div></div>' + ppNav(o);
  if (o.step === 6) body = '<h2>Dolori o limitazioni?</h2><p class="muted">Escludo gli esercizi che caricano quella zona e li sostituisco con alternative. Con un dolore importante o recente senti prima il medico.</p>' +
    '<div class="chips wrap">' + chip('Nessuno', !(p.pain || []).length, 'ppPainNone') + Object.keys(PAIN_ZONES).map(k => chip(PAIN_ZONES[k], (p.pain || []).includes(k), 'ppPain', 'data-k="' + k + '"')).join('') + '</div>' + ppNav(o);
  if (o.step === 7) {
    const sug = p.body ? BODY_TYPES[p.body].goals : [];
    body = '<h2>I tuoi obiettivi</h2><p class="muted">' + (sug.length ? 'Per il tuo fisico ti consiglio: <b>' + sug.map(k => GOALS[k].n).join(' + ') + '</b>. ' : '') + 'Puoi sceglierne più di uno.</p>' +
      Object.keys(GOALS).map(k => '<button class="opt check ' + (p.goals.includes(k) ? 'on' : '') + '" data-act="setGoal" data-k="' + k + '"><span class="ck"></span><span><b>' + GOALS[k].n + (sug.includes(k) ? ' · consigliato' : '') + '</b><small>' + GOALS[k].desc + '</small></span></button>').join('') + ppNav(o);
  }
  if (o.step === 8) {
    const G = p.mgoals || (p.mgoals = defaultMGoals());
    body = '<h2>Traguardi misurabili</h2><p class="muted">Ti mostro i progressi e quando ci arriverai.</p>' +
      (G.peso ? '<div class="card"><div class="list-item flat"><div><b>Peso corporeo</b><small>Obiettivo in kg</small></div>' + toggle(G.peso.on, 'ppG', 'data-k="peso"') + '</div>' + (G.peso.on ? field('Peso obiettivo (kg)', numIn(G.peso.kg, 'data-in="pg" data-g="peso" data-k="kg"')) : '') + '</div>' : '') +
      '<div class="card"><div class="list-item flat"><div><b>Forza su un esercizio</b><small>Massimale stimato dalle tue serie</small></div>' + toggle(G.forza.on, 'ppG', 'data-k="forza"') + '</div>' +
      (G.forza.on ? '<div class="chips wrap">' + STRENGTH_EX.filter(id => okFor(id)).map(id => chip(EX[id].n, G.forza.ex === id, 'ppGEx', 'data-k="' + id + '"')).join('') + '</div>' + field('Massimale obiettivo (kg)', numIn(G.forza.kg || '', 'data-in="pg" data-g="forza" data-k="kg"', 'vuoto = +10% dopo le prime sedute')) : '') + '</div>' +
      '<div class="card"><div class="list-item flat"><div><b>Girovita</b><small>Sotto ' + (p.sex === 'f' ? '80' : '94') + ' cm il rischio per la salute è più basso (OMS)</small></div>' + toggle(G.vita.on, 'ppG', 'data-k="vita"') + '</div>' + (G.vita.on ? field('Girovita obiettivo (cm)', numIn(G.vita.cm, 'data-in="pg" data-g="vita" data-k="cm"')) : '') + '</div>' +
      '<div class="card"><div class="list-item flat"><div><b>Costanza</b><small>' + G.costanza.perWeek + ' allenamenti a settimana per ' + G.costanza.weeks + ' settimane</small></div>' + toggle(G.costanza.on, 'ppG', 'data-k="costanza"') + '</div></div>' + ppNav(o);
  }
  if (o.step === 9) body = ppSummary() + (o.redo ? '' : '<h3 class="small muted" style="margin:16px 2px 8px">Promemoria</h3>' +
    '<div class="list-item flat"><div><b>Allenamento</b><small>Nei tuoi giorni</small></div>' + toggle(r.workout.on, 'remOn', 'data-k="workout"') + '</div>' + (r.workout.on ? field('Ora', timeIn(r.workout.hour, r.workout.min, 'workout')) : '') +
    '<div class="list-item flat"><div><b>Bere acqua</b><small>Ogni ' + r.water.every + ' ore dalle ' + r.water.from + ' alle ' + r.water.to + '</small></div>' + toggle(r.water.on, 'remOn', 'data-k="water"') + '</div>' +
    '<div class="list-item flat"><div><b>Pesata</b><small>' + WEEKDAYS_LONG[r.weigh.day] + '</small></div>' + toggle(r.weigh.on, 'remOn', 'data-k="weigh"') + '</div>') + ppNav(o, 'ppFinish', 'Inizia il percorso');
  return '<div class="pad ob">' + dots + body + '</div>';
};
/* riepilogo del percorso: cosa ha deciso il trainer e perché */
function ppSummary() {
  const p = S.profile, w = num(UI.ob.weight) || curWeight(), h = num(p.height) / 100, bmi = w && h ? w / (h * h) : 0;
  const pal = palFor(p), items = [];
  items.push('<b>Obiettivi:</b> ' + goalLabel(p) + '.');
  if (bmi) items.push('<b>BMI ' + bmi.toFixed(1).replace('.', ',') + '</b>' + (bmi >= 30 ? ': partiamo con macchine e cardio a basso impatto, niente salti.' : bmi >= 25 ? ': un deficit moderato e tanto movimento quotidiano.' : bmi < 18.5 ? ': serve mangiare di più, priorità alla massa.' : '.'));
  if (pal) items.push('<b>Attività quotidiana:</b> livello ' + String(pal).replace('.', ',') + ' (' + (pal < 1.7 ? 'sedentario-moderato' : pal < 2 ? 'attivo' : 'molto attivo') + '): lo uso per calcolare le calorie.');
  if (num(p.age) >= 50) items.push('<b>Età:</b> riscaldamento più lungo, ' + (balanceEx() ? 'un esercizio di equilibrio, ' : '') + 'salite veloci per la potenza e ripetizioni un po\' più alte sui principali.');
  if (lowRecovery()) items.push('<b>Sonno e stress:</b> nella prima fase meno serie sugli esercizi complementari, per recuperare bene. Dormire almeno 7 ore aiuta più di qualsiasi integratore.');
  if ((p.pain || []).length) items.push('<b>Dolori (' + p.pain.map(z => PAIN_ZONES[z].toLowerCase()).join(', ') + '):</b> esclusi gli esercizi che caricano la zona, con alternative.');
  items.push('<b>Dove e quanto:</b> ' + PLACES[p.place || 'palestra'].toLowerCase() + ', ' + (p.days || []).length + ' giorni a settimana, circa ' + (num(p.minutes) || 60) + ' minuti.');
  items.push('<b>Prime 2 sedute:</b> di taratura. Scegli carichi con cui ti restano 2–3 ripetizioni: da lì il trainer calcola i progressi.');
  return '<h2>Il tuo percorso</h2><div class="card"><div class="eyebrow">12 settimane · 3 fasi</div>' +
    '<div class="phase-row">' + PHASES.map((f, i) => '<div class="phase"><b>' + (i + 1) + '. ' + f.n + '</b><small>' + f.d + '</small></div>').join('') + '</div>' +
    '<p class="small muted">Ogni fase dura 4 settimane: 3 di carico e 1 di scarico, poi un controllo che rifà i calcoli e adatta la scheda.</p></div>' +
    '<div class="card"><ul class="tips small">' + items.map(x => '<li>' + x + '</li>').join('') + '</ul></div>';
}

/* ---------- check-in prima dell'allenamento ---------- */
const CK_SLEEP = ['Poco', 'Normale', 'Bene'], CK_EN = ['Bassa', 'Normale', 'Alta'];
function checkinSheet() {
  const c = UI.ck;
  return '<h3>Come stai oggi?</h3><p class="small muted">3 tocchi: adatto la seduta a come ti senti.</p>' +
    '<div class="field"><span>Come hai dormito?</span><div class="seg">' + CK_SLEEP.map((l, i) => chip(l, c.sleep === i, 'ckSet', 'data-k="sleep" data-v="' + i + '"')).join('') + '</div></div>' +
    '<div class="field"><span>Energia</span><div class="seg">' + CK_EN.map((l, i) => chip(l, c.energy === i, 'ckSet', 'data-k="energy" data-v="' + i + '"')).join('') + '</div></div>' +
    '<div class="field"><span>Dolori oggi?</span><div class="chips wrap">' + chip('Nessuno', !c.pain.length, 'ckPainNone') + Object.keys(PAIN_ZONES).map(k => chip(PAIN_ZONES[k], c.pain.includes(k), 'ckPain', 'data-k="' + k + '"')).join('') + '</div></div>' +
    '<button class="btn wide" data-act="ckGo">' + ic('play') + 'Inizia</button><button class="btn ghost wide" data-act="ckSkip">Salta il check-in</button>';
}
const _startWorkout = startWorkout;
startWorkout = function (t) {
  if (t && !t.quick && (t.kind || 'scheda') === 'scheda' && !S.active && pathOn() && !(UI.ck && UI.ck.ready)) {
    UI.ck = { t, sleep: 1, energy: 1, pain: [], ready: false };
    openSheet(checkinSheet); return;
  }
  const ck = UI.ck && UI.ck.ready ? UI.ck : null; UI.ck = null;
  if (!ck || !t) { _startWorkout(t); return; }
  const low = (ck.sleep === 0 ? 1 : 0) + (ck.energy === 0 ? 1 : 0);
  S.checkins = (S.checkins || []).concat([{ d: Date.now(), sleep: ck.sleep, energy: ck.energy, pain: ck.pain }]).slice(-120);
  // dolori di oggi: sostituisci gli esercizi della zona; giornata no: una serie in meno, lontano dal cedimento
  const t2 = Object.assign({}, t, { items: t.items.map(it => { const id = ck.pain.length ? adaptEx(it.ex, ck.pain) : it.ex; return Object.assign({}, it, { ex: id, sets: low ? Math.max(Math.min(2, it.sets || 3), (it.sets || 3) - (low >= 2 || it.role !== 'main' ? 1 : 0)) : it.sets }); }) });
  _startWorkout(t2);
  if (low >= 2) setTimeout(() => toast('Seduta leggera: una serie in meno e 3–4 ripetizioni di scorta. Va bene così.'), 400);
  else if (low) setTimeout(() => toast('Oggi recuperi un po\' meno: una serie in meno sui complementari.'), 400);
  if (ck.pain.length) setTimeout(() => toast('Esercizi della zona dolorante sostituiti con alternative.'), 2600);
};

/* ---------- home: percorso, controllo di fase, obiettivi ---------- */
const _homeCards = homeTrainerCards2;
homeTrainerCards2 = function (t, doneToday) {
  let out = '';
  if (!pathOn()) out += '<button class="card trainer" data-act="ppStart"><div class="eyebrow">' + ic('sparkle', 'inline') + 'Nuovo</div><p><b>Crea il tuo percorso su misura</b><br><small class="muted">Fisico, stile di vita, dolori e obiettivi: 12 settimane costruite per te.</small></p></button>';
  else {
    const due = checkpointDue();
    if (due) out += '<button class="card trainer" data-act="go" data-v="checkpoint"><div class="eyebrow">' + ic('chart', 'inline') + 'Controllo di fase</div><p><b>Fine fase ' + (due.ph - 1 || 3) + ': facciamo il punto</b><br><small class="muted">Peso, girovita e progressi: aggiorno il percorso.</small></p></button>';
    const gs = goalStatus();
    if (gs.length) out += '<button class="card" data-act="go" data-v="goals"><div class="eyebrow">' + ic('chart', 'inline') + 'I tuoi traguardi</div>' + gs.slice(0, 3).map(g => '<div class="goal-l"><b>' + esc(g.t) + '</b>' + (g.pct != null ? '<div class="gbar"><i style="width:' + Math.round(g.pct * 100) + '%"></i></div>' : '') + '<small class="muted">' + esc(g.eta) + '</small></div>').join('') + '</button>';
  }
  return out + _homeCards(t, doneToday);
};
VIEWS.goals = () => header('I tuoi traguardi', { back: true, noGear: true, sub: 'Previsioni dai tuoi dati reali' }) + '<div class="pad">' +
  goalStatus().map(g => '<div class="card"><h3>' + esc(g.t) + '</h3>' + (g.pct != null ? '<div class="gbar"><i style="width:' + Math.round(g.pct * 100) + '%"></i></div>' : '') + '<p class="small">' + esc(g.eta) + '</p></div>').join('') +
  '<button class="btn ghost wide" data-act="ppRedo" data-s="8">' + ic('gear') + 'Cambia i traguardi</button>' +
  '<p class="small muted">Le previsioni usano l\'andamento delle ultime settimane; con pochi dati uso i ritmi tipici del tuo livello. Sono stime: cambiano con te.</p></div>';
VIEWS.checkpoint = () => {
  const due = checkpointDue() || { ph: pathPhase(), key: 'manuale' }, ph = PHASES[(due.ph - 1) % 3];
  return header('Controllo di fase', { back: true, noGear: true, sub: 'Inizia la fase ' + due.ph + ': ' + ph.n }) + '<div class="pad">' +
    '<div class="card"><h3>1. Pesati e misura il girovita</h3>' + field('Peso di oggi (kg)', numIn('', 'data-in="profW"', fmtKg(curWeight() || 0))) +
    '<button class="btn ghost wide" data-act="go" data-v="progress">' + ic('chart', 'inline') + 'Misure (Progressi)</button></div>' +
    '<div class="card"><h3>2. Come stanno andando i traguardi</h3>' + goalStatus().map(g => '<p class="small"><b>' + esc(g.t) + '</b><br>' + esc(g.eta) + '</p>').join('') + '</div>' +
    '<div class="card"><h3>3. La prossima fase: ' + ph.n + '</h3><p class="small">' + esc(ph.d) + ' Ricalcolo calorie e schede con i dati aggiornati.</p>' +
    '<button class="btn wide" data-act="ppCheckDone" data-k="' + due.key + '">' + ic('play') + 'Aggiorna il percorso</button>' +
    '<button class="btn ghost wide" data-act="ppRedo" data-s="1">Cambia le risposte del questionario</button></div></div>';
};

/* ---------- azioni ---------- */
Object.assign(ACT, {
  ppNext: () => {
    const o = UI.ob, p = S.profile;
    if (o.step === 1 && !p.sex) { toast('Scegli uomo o donna'); return; }
    if (o.step === 1 && !p.body) { toast('Tocca la figura più simile a te'); return; }
    if (o.step === 1 && !o.goalsTouched) { p.goals = BODY_TYPES[p.body].goals.slice(); }
    if (o.step === 2) { const w = num(o.weight); if (w >= 25 && w <= 350 && w !== curWeight()) { S.weights.push({ d: Date.now(), kg: w }); } if (!num(p.age) || !num(p.height) || !curWeight()) { toast('Inserisci età, altezza e peso'); return; } }
    if (o.step === 3 && (!p.job || !p.steps || !p.sleep || !p.stress)) { toast('Rispondi a tutte le domande'); return; }
    if (o.step === 4 && !p.days.length) { toast('Scegli almeno un giorno'); return; }
    if (o.step === 7) p.mgoals = defaultMGoals();
    o.step++; save(); render();
  },
  ppCancel: () => { S.onboarded = true; UI.ob = { step: 0 }; UI.stack = [{ v: 'home' }]; render(); },
  ppBody: d => { S.profile.body = d.k; save(); render(); },
  ppJob: d => { S.profile.job = d.k; save(); render(); },
  ppSteps: d => { S.profile.steps = d.k; save(); render(); },
  ppSleep: d => { S.profile.sleep = d.k; save(); render(); },
  ppStress: d => { S.profile.stress = d.k; save(); render(); },
  ppSport: d => { S.profile.sport = S.profile.sport || {}; S.profile.sport[d.k] = num(d.n); save(); render(); },
  ppPlace: d => { S.profile.place = d.k; save(); render(); },
  ppMin: d => { S.profile.minutes = num(d.k); save(); render(); },
  ppPain: d => { const a = S.profile.pain || []; S.profile.pain = a.includes(d.k) ? a.filter(x => x !== d.k) : a.concat([d.k]); save(); render(); },
  ppPainNone: () => { S.profile.pain = []; save(); render(); },
  ppG: d => { const g = S.profile.mgoals[d.k]; g.on = !g.on; save(); render(); },
  ppGEx: d => { S.profile.mgoals.forza.ex = d.k; S.profile.mgoals.forza.kg = 0; save(); render(); },
  ppStart: () => { UI.ob = { step: 1, redo: true }; S.onboarded = false; render(true); },
  ppRedo: d => { UI.ob = { step: num(d.s) || 1, redo: true }; S.onboarded = false; render(true); },
  ppFinish: () => {
    const p = S.profile, first = !p.path;
    p.path = true; S.path = S.path || {};
    if (first || !S.path.start) { S.path.start = Date.now(); S.cycle = { on: true, start: startOfWeek(Date.now()).getTime() }; }
    S.onboarded = true;
    const mine = S.templates.filter(t => !t.preset);
    S.templates = buildDefaultTemplates().concat(mine);
    if (goalsOf().includes('dimagrimento')) dietState();
    save(true); if (!UI.ob.redo) { Native.askNotifications(); } syncReminders();
    UI.ob = { step: 0 }; UI.stack = [{ v: 'home' }]; render(true);
    toast(first ? 'Percorso creato: fase 1 di 3. Le schede sono in "Schede".' : 'Percorso aggiornato con le nuove risposte.');
  },
  ppCheckDone: d => {
    S.path = S.path || {}; S.path.checks = S.path.checks || {}; S.path.checks[d.k] = Date.now();
    const mine = S.templates.filter(t => !t.preset); S.templates = buildDefaultTemplates().concat(mine);
    save(true); UI.stack = [{ v: 'home' }]; render(true); toast('Percorso aggiornato: si parte con la nuova fase!');
  },
  ckSet: d => { UI.ck[d.k] = num(d.v); $('#sheet-body').innerHTML = checkinSheet(); },
  ckPain: d => { const a = UI.ck.pain; UI.ck.pain = a.includes(d.k) ? a.filter(x => x !== d.k) : a.concat([d.k]); $('#sheet-body').innerHTML = checkinSheet(); },
  ckPainNone: () => { UI.ck.pain = []; $('#sheet-body').innerHTML = checkinSheet(); },
  ckGo: () => { UI.ck.ready = true; const t = UI.ck.t; closeSheet(); startWorkout(t); },
  ckSkip: () => { const t = UI.ck.t; UI.ck = null; closeSheet(); _startWorkout(t); }
});
/* il primo avvio passa dal nuovo questionario */
ACT.obNext = ACT.ppNext;
const _setGoal = ACT.setGoal;
ACT.setGoal = d => { if (UI.ob) UI.ob.goalsTouched = true; _setGoal(d); };

/* events.js ha già disegnato la prima schermata: ridisegna con il percorso */
UI.stack = [{ v: S.active ? 'workout' : 'home' }];
render(true);
