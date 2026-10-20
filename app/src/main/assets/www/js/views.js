/* GYM — allenatore, libreria esercizi, progressi, chat AI */
'use strict';

/* =================== ALLENATORE =================== */
function coachGenerate(seed) {
  const c = UI.coach, p = S.profile, lv = LEVELS[p.level] || LEVELS.intermedio;
  const muscles = c.muscles.slice(), eqs = c.eq.length ? c.eq : COACH_EQUIP;
  const maxEx = muscles.length === 1 ? (p.level === 'principiante' ? 4 : 5) : Math.min(9, Math.max(5, muscles.length * 2));
  const rnd = mulberry(seed || Date.now());
  const picks = [];
  // per ogni muscolo: quanti esercizi
  const quota = {}; muscles.forEach(m => { quota[m] = muscles.length === 1 ? maxEx : (BIG_MUSCLES.includes(m) ? lv.perBig : lv.perSmall); });
  let total = Object.values(quota).reduce((a, b) => a + b, 0);
  while (total > maxEx) { const m = muscles.slice().sort((a, b) => quota[b] - quota[a])[0]; quota[m]--; total--; }
  // pochi muscoli: aggiungi esercizi fino a un allenamento completo (prima ai muscoli grandi)
  const target = muscles.length === 1 ? maxEx : Math.min(maxEx, p.level === 'principiante' ? 5 : 6);
  const order = muscles.slice().sort((a, b) => BIG_MUSCLES.includes(b) - BIG_MUSCLES.includes(a));
  let guard = 0;
  while (total < target && guard++ < 30) {
    const m = order[guard % order.length];
    const avail = EXERCISES.filter(e => e.m === m && eqs.includes(e.eq) && e.pat !== 'condizionamento').length || 2;
    if (quota[m] < Math.min(avail, BIG_MUSCLES.includes(m) ? 4 : 3)) { quota[m]++; total++; }
  }
  muscles.forEach(m => {
    let pool = EXERCISES.filter(e => e.m === m && eqs.includes(e.eq) && e.pat !== 'condizionamento');
    if (!pool.length) pool = EXERCISES.filter(e => e.m === m && e.pat !== 'condizionamento'); // es. addome: corpo libero
    pool = pool.map(e => ({ e, r: rnd() + (e.comp ? 0.6 : 0) + (goalsOf().includes('forza') && e.comp ? 0.5 : 0) + (p.level === 'principiante' && e.eq === 'macchinari' ? 0.4 : 0) })).sort((a, b) => b.r - a.r).map(x => x.e);
    const used = new Set();
    for (const e of pool) {
      if (picks.filter(x => EX[x.ex].m === m).length >= quota[m]) break;
      if (used.has(e.pat) && pool.some(o => !used.has(o.pat) && !picks.some(pk => pk.ex === o.id))) continue;
      used.add(e.pat); picks.push(prescribe(e.id, e.comp && BIG_MUSCLES.includes(m) && !picks.some(x => x.role === 'main' && EX[x.ex].m === m) ? 'main' : null));
    }
  });
  // ordine: grandi multiarticolari prima, addome in fondo
  picks.sort((a, b) => (EX[b.ex].comp - EX[a.ex].comp) || ((EX[a.ex].m === 'addome') - (EX[b.ex].m === 'addome')));
  c.result = { items: picks, seed };
}
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function coachAdvice() {
  const goals = goalsOf(), t = [];
  const pr = prescribe('panca_piana_bil', 'main'), ac = prescribe('alzate_laterali', 'acc');
  t.push('Con i tuoi obiettivi: esercizi principali ' + pr.sets + '×' + pr.rmin + '–' + pr.rmax + ' con ' + pr.rest + ' s di recupero, isolamento ' + ac.sets + '×' + ac.rmin + '–' + ac.rmax + ' con ' + ac.rest + ' s.');
  if (goals.includes('massa')) t.push('Massa: 10–20 serie a settimana per muscolo, aumenta il carico appena completi tutte le ripetizioni.');
  if (goals.includes('forza')) t.push('Forza: riscaldamento progressivo prima delle serie pesanti, recuperi lunghi (2–3 minuti).');
  if (goals.includes('tonificazione')) t.push('Tonificazione: ripetizioni controllate con 2–3 secondi in discesa e contrazione in alto.');
  if (goals.includes('dimagrimento')) t.push('Dimagrimento: 15–20 minuti di cardio a fine seduta o i circuiti da un\'ora; mantieni carichi impegnativi per non perdere muscolo.');
  if (goals.includes('benessere')) t.push('Benessere: cura la mobilità ogni giorno e non trascurare dorso e glutei per una postura migliore.');
  return t;
}

VIEWS.coach = () => {
  const c = UI.coach, p = S.profile;
  const seg = '<div class="seg">' + chip('Allenamento', UI.coachTab !== 'food', 'coachTab', 'data-t="train"') + chip('Alimentazione', UI.coachTab === 'food', 'coachTab', 'data-t="food"') + '</div>';
  let out = header('Coach', { sub: goalLabel() + ' · ' + LEVELS[p.level].n }) + '<div class="pad">' + seg;
  if (UI.coachTab === 'food') return out + nutritionView() + '</div>';
  const rec = muscleRecovery(), sugg = suggestedGroups()[0], pairs = pairSuggestions(c.muscles);
  out += '<div class="card trainer"><div class="eyebrow">' + ic('coach', 'inline') + 'Il trainer consiglia oggi</div>' +
      '<p><b>' + sugg.n + '</b>: ' + (sugg.ready === 1 ? 'muscoli riposati e pronti.' : 'i muscoli più recuperati in questo momento.') + '</p>' +
      '<button class="btn sm" data-act="coachQuick" data-q="' + sugg.m.join(',') + '">Usa questo</button></div>' +
    '<div class="card"><h3>1. Cosa vuoi allenare?</h3><p class="muted small">Tocca i muscoli sulla figura o scegli dall\'elenco. Il puntino indica i muscoli ancora in recupero.</p>' +
      '<div class="body-pick">' + bodySvg(m => c.muscles.includes(m) ? { color: 'var(--accent)', op: 1 } : null, { click: true }) + '</div>' +
      '<div class="chips">' + Object.keys(MUSCLES).map(m => chip(MUSCLES[m] + (rec[m].ready ? '' : ' <i class="rec-dot" title="in recupero"></i>'), c.muscles.includes(m), 'coachM', 'data-m="' + m + '"')).join('') + '</div>' +
      (pairs.length ? '<div class="pairs"><div class="eyebrow">Si abbinano bene</div>' + pairs.map(x => '<button class="pair" data-act="coachM" data-m="' + x.m + '"><b>+ ' + MUSCLES[x.m] + '</b><small>' + esc(x.why) + (rec[x.m].ready ? '' : ' · ancora in recupero') + '</small></button>').join('') + '</div>' : '') +
      '<div class="row gap wrap">' + DAY_GROUPS.map(g => '<button class="btn sm ghost" data-act="coachQuick" data-q="' + g.m.join(',') + '">' + g.n + '</button>').join('') + '</div>' +
      (c.muscles.some(m => !rec[m].ready) ? '<div class="note warn small">' + c.muscles.filter(m => !rec[m].ready).map(m => MUSCLES[m]).join(', ') + ': allenati da meno di ' + '48 ore. Puoi farlo, ma con meno volume.</div>' : '') +
    '</div>' +
    '<div class="card"><h3>2. Preferisci manubri o macchinari?</h3><div class="grid3 eq-pick">' +
      COACH_EQUIP.map(k => '<button class="opt ' + (c.eq.includes(k) ? 'on' : '') + '" data-act="coachEq" data-k="' + k + '">' + ic(k === 'macchinari' ? 'gear' : 'dumbbell') + '<b>' + EQUIP[k] + '</b></button>').join('') +
      '</div><p class="muted small">Puoi sceglierne più di uno. Se non scegli, li uso tutti.' + (p.level === 'principiante' ? ' Da principiante i macchinari sono più facili e sicuri.' : '') + '</p></div>' +
    '<button class="btn wide big" data-act="coachGo"' + (c.muscles.length ? '' : ' disabled') + '>' + ic('sparkle') + 'Proponimi l\'allenamento</button>';
  if (c.result) {
    const items = c.result.items;
    out += '<div class="card"><div class="card-h"><h3>La mia proposta</h3><button class="btn sm ghost" data-act="coachGo">' + ic('swap', 'inline') + 'Rigenera</button></div>' +
      '<p class="muted small">' + items.length + ' esercizi · circa ' + templateMinutes({ items }) + ' min · riscaldamento incluso. Tocca un esercizio per vedere l\'animazione.</p>' +
      '<div class="note small">' + ic('timer', 'inline') + WARMUP_TEXT + '</div>' +
      items.map((i, n) => {
        const e = EX[i.ex], last = lastPerformance(i.ex), prog = progression(i.ex, i.rmin, i.rmax);
        return '<div class="coach-ex"><button class="link grow" data-act="exInfo" data-id="' + i.ex + '"><b>' + (n + 1) + '. ' + esc(e.n) + ' <span class="role ' + (i.role || '') + '">' + (ROLE_N[i.role] || '') + '</span></b><small>' + muscleName(e.m) + ' · ' + EQUIP[e.eq] + ' · ' + prescText(i) + '</small>' +
          '<span class="small tip-inline">' + esc(last ? prog.text : trainerNote(i)) + '</span></button>' +
          '<button class="icon-btn sm" data-act="coachSwap" data-n="' + n + '">' + ic('swap') + '</button></div>';
      }).join('') +
      (goalsOf().includes('dimagrimento') ? '<div class="note small">' + ic('run', 'inline') + 'Chiudi con 15–20 minuti di cardio moderato (tapis roulant in salita o cyclette).</div>' : '') +
      '<div class="grid2"><button class="btn" data-act="coachStart">' + ic('play') + 'Inizia ora</button><button class="btn ghost" data-act="coachSave">Salva come scheda</button></div></div>';
  }
  out += '<div class="card"><h3>' + ic('info', 'inline') + 'Consigli per i tuoi obiettivi</h3><ul class="tips">' + coachAdvice().map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></div>' +
    '<button class="btn ghost wide" data-act="openAI">' + ic('sparkle') + (aiReady() ? 'Chiedi al coach AI' : 'Coach AI: attivalo nelle impostazioni') + '</button></div>';
  return out;
};

/* ---------- Alimentazione ---------- */
function mealCard(m, icon) {
  return '<div class="card meal"><h3>' + ic(icon, 'inline') + m.t + '</h3><p class="small muted">' + m.d + '</p><ul class="tips">' + m.ex.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>';
}
function nutritionView() {
  const n = nutritionTargets(), p = S.profile, t = todayTemplate(), r = S.reminders.workout;
  let out = '';
  if (!n.ready) {
    out += '<div class="card"><h3>I tuoi dati</h3><p class="small muted">Servono per calcolare calorie e proteine. Restano solo sul telefono.</p>' + bodyDataFields() + '</div>';
  }
  if (n.w) {
    out += '<div class="card"><div class="card-h"><h3>Il tuo fabbisogno</h3><span class="muted small">' + goalLabel() + '</span></div>' +
      '<div class="stats3">' +
        '<div><b>' + (n.kcal ? n.kcal : '—') + '</b><small>kcal al giorno</small></div>' +
        '<div><b>' + n.protein + ' g</b><small>proteine</small></div>' +
        '<div><b>' + fmtKg(n.water) + ' l</b><small>acqua (+0,5 l se ti alleni)</small></div></div>' +
      (n.kcal ? '<div class="macro"><i style="flex:' + n.protein * 4 + '" class="pro"></i><i style="flex:' + n.carbs * 4 + '" class="carb"></i><i style="flex:' + n.fat * 9 + '" class="fat"></i></div>' +
        '<div class="macro-l small"><span><i class="pro"></i>Proteine ' + n.protein + ' g</span><span><i class="carb"></i>Carboidrati ' + n.carbs + ' g</span><span><i class="fat"></i>Grassi ' + n.fat + ' g</span></div>' +
        '<p class="small muted">Metabolismo a riposo circa ' + n.bmr + ' kcal, consumo giornaliero circa ' + n.tdee + ' kcal' + (n.kcalAdj ? ', ' + (n.kcalAdj > 0 ? '+' : '') + n.kcalAdj + ' kcal per il tuo obiettivo' : '') + '.</p>' : '<p class="small muted">Completa sesso, età e altezza per le calorie.</p>') +
    '</div>';
  } else out += '<div class="note">Registra il peso dalla home per calcolare proteine e acqua.</div>';
  if (t) out += '<div class="note good">' + ic('flame', 'inline') + 'Oggi ti alleni' + (r.on ? ' alle ' + pad(r.hour) + ':' + pad(r.min) : '') + ' (' + esc(t.name) + '): pasto completo 2–3 ore prima, spuntino leggero 30–60 minuti prima se hai fame, pasto di recupero entro 2 ore dopo.</div>';
  out += mealCard(MEALS.pre_full, 'timer') + mealCard(MEALS.pre_snack, 'flame') + mealCard(MEALS.post, 'dumbbell') + mealCard(MEALS.rest, 'water');
  const gt = goalNutritionTips(goalsOf());
  if (gt.length) out += '<div class="card"><h3>Per i tuoi obiettivi</h3><ul class="tips">' + gt.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>';
  out += '<p class="small muted center">Indicazioni generali, non sostituiscono un medico o un nutrizionista.</p>';
  if (n.ready) out += '<details class="card"><summary><b>Modifica i miei dati</b></summary>' + bodyDataFields() + '</details>';
  return out;
}
function bodyDataFields() {
  const p = S.profile;
  return '<div class="field"><span>Sesso</span><div class="seg">' + chip('Uomo', p.sex === 'm', 'setSex', 'data-k="m"') + chip('Donna', p.sex === 'f', 'setSex', 'data-k="f"') + '</div></div>' +
    '<div class="grid2">' + field('Età', numIn(p.age, 'data-in="prof" data-k="age"', 'es. 35')) + field('Altezza (cm)', numIn(p.height, 'data-in="prof" data-k="height"', 'es. 175')) + '</div>' +
    (S.weights.length ? '' : '<button class="btn ghost wide" data-act="addWeight">Registra il peso</button>');
}

function coachSwapSheet(n) {
  const i = UI.coach.result.items[n], e = EX[i.ex];
  const alts = alternatives(i.ex).filter(x => !UI.coach.result.items.some(y => y.ex === x.id)).slice(0, 8);
  return '<h3>Cambia ' + esc(e.n) + '</h3>' + alts.map(x => '<button class="list-item btnlike" data-act="coachDoSwap" data-n="' + n + '" data-id="' + x.id + '"><div><b>' + esc(x.n) + '</b><small>' + EQUIP[x.eq] + '</small></div>' + ic('swap') + '</button>').join('');
}

/* =================== LIBRERIA =================== */
VIEWS.library = () => {
  const L = UI.lib;
  return header('Esercizi') + '<div class="pad">' +
    '<input type="search" class="search" placeholder="Cerca un esercizio…" value="' + esc(L.q) + '" data-in="libQ">' +
    '<div class="chips scroll">' + chip('Tutti', !L.m, 'libM', 'data-m=""') + Object.keys(MUSCLES).map(m => chip(MUSCLES[m], L.m === m, 'libM', 'data-m="' + m + '"')).join('') + '</div>' +
    '<div class="chips scroll">' + chip('Ogni attrezzo', !L.eq, 'libEq', 'data-e=""') + Object.keys(EQUIP).map(k => chip(EQUIP[k], L.eq === k, 'libEq', 'data-e="' + k + '"')).join('') + '</div>' +
    '<div id="lib-list">' + libList() + '</div></div>';
};
function libList() {
  const L = UI.lib, q = L.q.toLowerCase();
  const list = EXERCISES.filter(e => (!L.m || e.m === L.m) && (!L.eq || e.eq === L.eq) && (!q || e.n.toLowerCase().includes(q)));
  const groups = {};
  list.forEach(e => { (groups[e.m] = groups[e.m] || []).push(e); });
  return Object.keys(groups).map(m => '<h3 class="sec">' + muscleName(m) + '</h3>' + groups[m].map(e => {
    const r = records(e.id);
    return '<button class="list-item btnlike" data-act="exInfo" data-id="' + e.id + '"><div><b>' + esc(e.n) + '</b><small>' + EQUIP[e.eq] + (r.kg ? ' · record ' + fmtKg(r.kg) + ' kg' : '') + '</small></div>' + ic('back', 'flip') + '</button>';
  }).join('')).join('') || '<div class="empty">Nessun esercizio trovato</div>';
}

VIEWS.exercise = p => {
  const e = EX[p.id]; if (!e) return VIEWS.library();
  const r = records(e.id), hist = exerciseHistory(e.id);
  const pts = hist.slice().reverse().map(h => ({ x: h.date, y: Math.max(...h.sets.map(s => e1rm(num(s.kg), num(s.reps)))) })).filter(x => x.y > 0);
  const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(e.n + ' esecuzione corretta');
  return header(esc(e.n), { back: true, sub: muscleName(e.m) + ' · ' + EQUIP[e.eq] }) + '<div class="pad">' +
    '<div class="card demo-card"><div class="card-h"><h3>' + ic('video', 'inline') + 'Esecuzione al rallentatore</h3></div><div id="demo" data-ex="' + e.id + '"></div>' +
      '<p class="small muted">I muscoli che lavorano sono evidenziati. Segui il ritmo: ' + (animDef(e.id).seq ? 'movimento continuo.' : 'fase di sforzo in 2 secondi, ritorno lento in 3.') + '</p></div>' +
    '<div class="card body-card">' + exerciseBody(e) + '<div class="legend"><span><i class="lg main"></i>Principale: ' + muscleName(e.m) + '</span>' + (e.s.length ? '<span><i class="lg sec"></i>Secondari: ' + e.s.map(muscleName).join(', ') + '</span>' : '') + '</div></div>' +
    '<div class="card"><h3>Come si esegue</h3><ol class="steps">' + e.steps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol></div>' +
    '<div class="card warn"><h3>Errori da evitare</h3><ul class="tips">' + e.err.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul></div>' +
    '<div class="card"><h3>' + ic('sparkle', 'inline') + 'Consiglio</h3><p>' + esc(e.tip) + '</p>' +
      '<p class="small"><b>Per i tuoi obiettivi:</b> ' + prescText(prescribe(e.id)) + '</p><p class="small muted">' + esc(trainerNote(prescribe(e.id))) + '</p></div>' +
    (r.kg ? '<div class="card"><h3>I tuoi record</h3><div class="stats3"><div><b>' + fmtKg(r.kg) + ' kg</b><small>carico max × ' + r.reps + '</small></div><div><b>' + Math.round(r.e1rm) + ' kg</b><small>massimale stimato</small></div><div><b>' + hist.length + '</b><small>volte</small></div></div>' +
      lineChart(pts) + '<div class="hist">' + hist.slice(0, 6).map(h => '<div class="list-item flat"><div><b>' + fmtDate(h.date) + '</b><small>' + h.sets.map(s => fmtKg(num(s.kg)) + '×' + num(s.reps)).join('  ') + '</small></div></div>').join('') + '</div></div>' : '') +
    '<div class="card"><h3>Alternative</h3>' + alternatives(e.id).slice(0, 5).map(x => '<button class="list-item btnlike" data-act="exInfo" data-id="' + x.id + '"><div><b>' + esc(x.n) + '</b><small>' + EQUIP[x.eq] + '</small></div>' + ic('back', 'flip') + '</button>').join('') + '</div>' +
    '<button class="btn ghost wide" data-act="openUrl" data-u="' + yt + '">' + ic('video') + 'Cerca anche un video su YouTube</button>' +
    (S.active && !S.active.circ ? '<button class="btn wide" data-act="addToActive" data-id="' + e.id + '">' + ic('plus') + 'Aggiungi all\'allenamento in corso</button>' : '') +
    '</div>';
};

/* =================== PROGRESSI =================== */
const PROG_TABS = [['esercizi', 'Esercizi'], ['calendario', 'Calendario'], ['settimana', 'Settimana'], ['muscoli', 'Muscoli'], ['peso', 'Peso'], ['foto', 'Foto'], ['cardio', 'Cardio'], ['storico', 'Storico']];

VIEWS.progress = () => {
  const P = UI.prog;
  return header('Progressi') + '<div class="chips scroll tabs">' + PROG_TABS.map(t => chip(t[1], P.tab === t[0], 'progTab', 'data-t="' + t[0] + '"')).join('') + '</div><div class="pad">' + (PROG[P.tab] || PROG.esercizi)() + '</div>';
};
const PROG = {};

PROG.esercizi = () => {
  const P = UI.prog, recs = allRecords();
  if (!recs.length) return '<div class="empty">Completa il primo allenamento per vedere qui grafici e record.</div>';
  if (!P.ex || !EX[P.ex]) P.ex = recs[0].id;
  const hist = exerciseHistory(P.ex).slice().reverse();
  const pts = hist.map(h => ({ x: h.date, y: P.metric === 'kg' ? Math.max(...h.sets.map(s => num(s.kg))) : P.metric === 'vol' ? h.sets.reduce((a, s) => a + num(s.kg) * num(s.reps), 0) : Math.max(...h.sets.map(s => e1rm(num(s.kg), num(s.reps)))) }));
  const r = records(P.ex);
  return '<div class="card"><div class="card-h"><h3>' + exLine(P.ex) + '</h3><button class="btn sm ghost" data-act="progPickEx">Cambia</button></div>' +
    '<div class="seg">' + [['e1rm', 'Massimale stimato'], ['kg', 'Carico max'], ['vol', 'Volume']].map(m => chip(m[1], P.metric === m[0], 'progMetric', 'data-m="' + m[0] + '"')).join('') + '</div>' +
    lineChart(pts) +
    '<div class="stats3"><div><b>' + fmtKg(r.kg) + ' kg</b><small>carico max</small></div><div><b>' + Math.round(r.e1rm) + ' kg</b><small>massimale stimato</small></div><div><b>' + (r.bestSet ? fmtKg(r.bestSet.kg) + '×' + r.bestSet.reps : '—') + '</b><small>miglior serie</small></div></div></div>' +
    '<h3 class="sec">' + ic('sparkle', 'inline') + 'Record personali</h3>' +
    recs.map(x => '<button class="list-item btnlike ' + (x.id === P.ex ? 'cur' : '') + '" data-act="progEx" data-id="' + x.id + '"><div><b>' + exLine(x.id) + '</b><small>' + fmtKg(x.r.kg) + ' kg × ' + x.r.reps + ' · stimato ' + Math.round(x.r.e1rm) + ' kg · ' + fmtDate(x.r.e1Date || x.r.maxKgDate) + '</small></div></button>').join('');
};

PROG.calendario = () => {
  const P = UI.prog, now = new Date();
  const m = P.month || new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const d0 = new Date(m), y = d0.getFullYear(), mo = d0.getMonth();
  const first = (new Date(y, mo, 1).getDay() + 6) % 7, nd = new Date(y, mo + 1, 0).getDate();
  const byDay = {}; S.history.forEach(h => { const k = dayKey(h.start); (byDay[k] = byDay[k] || []).push(h); });
  const st = streaks(), monthCount = S.history.filter(h => { const d = new Date(h.start); return d.getFullYear() === y && d.getMonth() === mo; }).length;
  let cells = '';
  for (let i = 0; i < first; i++) cells += '<i></i>';
  for (let d = 1; d <= nd; d++) {
    const k = y + '-' + pad(mo + 1) + '-' + pad(d), hs = byDay[k], today = k === todayKey(), planned = S.profile.days.includes(new Date(y, mo, d).getDay());
    cells += '<button class="cal-d ' + (hs ? 'on ' : '') + (today ? 'today ' : '') + (planned ? 'plan' : '') + '" ' + (hs ? 'data-act="calDay" data-k="' + k + '"' : '') + '>' + d + '</button>';
  }
  return '<div class="stats3 card"><div><b>' + st.weekStreak + '</b><small>settimane di fila</small></div><div><b>' + st.dayStreak + '</b><small>giorni di fila</small></div><div><b>' + st.total + '</b><small>allenamenti totali</small></div></div>' +
    '<div class="card"><div class="card-h"><button class="icon-btn" data-act="calMonth" data-d="-1">' + ic('back') + '</button><h3>' + d0.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }) + '</h3><button class="icon-btn" data-act="calMonth" data-d="1">' + ic('back', 'flip') + '</button></div>' +
    '<div class="cal"><b>L</b><b>M</b><b>M</b><b>G</b><b>V</b><b>S</b><b>D</b>' + cells + '</div>' +
    '<p class="muted small">' + monthCount + ' allenamenti in questo mese. Il bordo indica i giorni previsti.</p></div>';
};

PROG.settimana = () => {
  const P = UI.prog, ws0 = P.week || startOfWeek(Date.now()).getTime(), s = weekStats(ws0);
  const weeks = [...Array(8)].map((_, i) => { const w = new Date(ws0); w.setDate(w.getDate() - (7 - i) * 7 + 7); return w; });
  const bars = weeks.map(w => ({ label: fmtDate(w).split(' ')[0] + '/' + (w.getMonth() + 1), value: Math.round(weekStats(w).vol / 100) / 10, hi: w.getTime() === ws0 }));
  const end = new Date(ws0); end.setDate(end.getDate() + 6);
  return '<div class="card"><div class="card-h"><button class="icon-btn" data-act="weekNav" data-d="-1">' + ic('back') + '</button><h3>' + fmtDate(ws0) + ' – ' + fmtDate(end) + '</h3><button class="icon-btn" data-act="weekNav" data-d="1">' + ic('back', 'flip') + '</button></div>' +
    '<div class="stats3"><div><b>' + s.count + '</b><small>allenamenti</small></div><div><b>' + fmtDur(s.time) + '</b><small>tempo</small></div><div><b>' + s.sets + '</b><small>serie</small></div></div>' +
    '<div class="stats3"><div><b>' + (s.vol >= 1000 ? fmtKg(Math.round(s.vol / 100) / 10) + ' t' : Math.round(s.vol) + ' kg') + '</b><small>volume</small></div><div><b>' + Math.round(s.cardioMin) + ' min</b><small>cardio</small></div><div><b>' + fmtKg(Math.round(s.km * 10) / 10) + ' km</b><small>distanza</small></div></div></div>' +
    '<div class="card"><h3>Volume (tonnellate) per settimana</h3>' + barChart(bars, { fmt: v => fmtKg(v) }) + '</div>' +
    '<div class="card"><h3>Serie per muscolo</h3>' + muscleBars(s.musc) + '</div>';
};
function muscleBars(musc) {
  const max = Math.max(1, ...Object.values(musc));
  return Object.keys(MUSCLES).map(m => { const v = Math.round((musc[m] || 0) * 10) / 10; return '<div class="mbar"><span>' + MUSCLES[m] + '</span><div><i style="width:' + (100 * v / max) + '%"></i></div><b>' + fmtKg(v) + '</b></div>'; }).join('');
}

PROG.muscoli = () => {
  const load = muscleLoad(7), sorted = Object.keys(MUSCLES).sort((a, b) => (load[a] || 0) - (load[b] || 0));
  const low = sorted.filter(m => (load[m] || 0) < 4).slice(0, 3);
  return '<div class="card body-card"><h3>Ultimi 7 giorni</h3><p class="muted small">Più è intenso il colore, più serie hai fatto per quel muscolo (le secondarie contano metà).</p>' + heatBody(load) + '</div>' +
    (low.length ? '<div class="card"><h3>Da allenare di più</h3><p>' + low.map(m => '<b>' + MUSCLES[m] + '</b> (' + fmtKg(Math.round((load[m] || 0) * 10) / 10) + ' serie)').join(', ') + '.</p><p class="muted small">Per crescere servono circa 10–20 serie a settimana per muscolo.</p><button class="btn" data-act="coachFor" data-q="' + low.join(',') + '">' + ic('coach') + 'Crea un allenamento per questi</button></div>' : '') +
    '<div class="card">' + muscleBars(load) + '</div>';
};

PROG.peso = () => {
  const pts = S.weights.map(w => ({ x: w.d, y: w.kg }));
  const last = S.weights[S.weights.length - 1], first = S.weights[0];
  return '<div class="card"><div class="card-h"><h3>Peso corporeo</h3><button class="btn sm" data-act="addWeight">' + ic('plus', 'inline') + 'Registra</button></div>' +
    (last ? '<div class="stats3"><div><b>' + fmtKg(last.kg) + ' kg</b><small>attuale</small></div><div><b>' + ((last.kg - first.kg) > 0 ? '+' : '') + fmtKg(Math.round((last.kg - first.kg) * 10) / 10) + ' kg</b><small>dall\'inizio</small></div><div><b>' + S.weights.length + '</b><small>pesate</small></div></div>' : '') +
    lineChart(pts) + '</div>' +
    S.weights.slice().reverse().slice(0, 30).map((w, i) => '<div class="list-item"><div><b>' + fmtKg(w.kg) + ' kg</b><small>' + fmtDateLong(w.d) + '</small></div><button class="icon-btn sm" data-act="delWeight" data-n="' + (S.weights.length - 1 - i) + '">' + ic('trash') + '</button></div>').join('');
};

PROG.foto = () => '<div class="card"><h3>' + ic('camera', 'inline') + 'Foto progressi</h3><p class="muted small">Le foto restano solo sul telefono. Scattale sempre con la stessa luce e posizione.</p>' +
  '<label class="btn wide filebtn">' + ic('camera') + 'Aggiungi foto<input type="file" accept="image/*" data-in="photo" hidden></label></div><div id="photos" class="photos"><div class="empty small">Caricamento…</div></div>';

async function loadPhotos() {
  const box = document.getElementById('photos'); if (!box) return;
  try {
    const list = await Photos.all();
    box.innerHTML = list.length ? list.map(p => '<figure><img src="' + p.data + '" alt="" data-act="photoView" data-id="' + p.id + '"><figcaption>' + fmtDate(p.date) + (p.kg ? ' · ' + fmtKg(p.kg) + ' kg' : '') + '</figcaption></figure>').join('') : '<div class="empty small">Nessuna foto ancora.</div>';
  } catch (e) { box.innerHTML = '<div class="empty small">Impossibile leggere le foto.</div>'; }
}

PROG.cardio = () => {
  const list = []; S.history.forEach(h => (h.cardio || []).forEach(c => list.push(Object.assign({ date: h.start }, c))));
  list.sort((a, b) => b.date - a.date);
  const tot = list.reduce((a, c) => a + num(c.min), 0), km = list.reduce((a, c) => a + num(c.km), 0);
  const byType = {}; list.forEach(c => { byType[c.type] = (byType[c.type] || 0) + num(c.min); });
  return '<div class="card"><div class="stats3"><div><b>' + list.length + '</b><small>sessioni</small></div><div><b>' + fmtDur(tot * 60) + '</b><small>totale</small></div><div><b>' + fmtKg(Math.round(km * 10) / 10) + '</b><small>km</small></div></div>' +
    '<button class="btn wide" data-act="cardio">' + ic('run') + 'Registra cardio</button></div>' +
    (Object.keys(byType).length ? '<div class="card"><h3>Minuti per attività</h3>' + muscleBarsGeneric(byType) + '</div>' : '') +
    list.slice(0, 40).map(c => '<div class="list-item"><div><b>' + esc(c.type) + '</b><small>' + fmtDate(c.date) + ' · ' + c.min + ' min' + (c.km ? ' · ' + fmtKg(c.km) + ' km' : '') + (c.lvl ? ' · livello ' + esc(c.lvl) : '') + '</small></div></div>').join('');
};
function muscleBarsGeneric(o) { const max = Math.max(1, ...Object.values(o)); return Object.keys(o).map(k => '<div class="mbar"><span>' + esc(k) + '</span><div><i style="width:' + (100 * o[k] / max) + '%"></i></div><b>' + Math.round(o[k]) + '</b></div>').join(''); }

PROG.storico = () => {
  if (!S.history.length) return '<div class="empty">Nessun allenamento salvato.</div>';
  return S.history.slice().reverse().slice(0, 60).map(h => {
    const sets = h.items.reduce((a, i) => a + i.sets.filter(s => !s.wu).length, 0);
    return '<button class="list-item btnlike" data-act="histOpen" data-id="' + h.id + '"><div><b>' + esc(h.name) + '</b><small>' + fmtDateLong(h.start) + ' · ' + fmtDur((h.end - h.start) / 1000) + ' · ' + sets + ' serie' + ((h.cardio || []).length ? ' · cardio' : '') + '</small></div>' + ic('back', 'flip') + '</button>';
  }).join('');
};

function histSheet(id) {
  const h = S.history.find(x => x.id === id); if (!h) return '';
  return '<h3>' + esc(h.name) + '</h3><p class="muted small">' + fmtDateLong(h.start) + ' · ' + fmtDur((h.end - h.start) / 1000) + '</p>' +
    h.items.map(it => '<div class="list-item flat"><div><b>' + exLine(it.ex) + '</b><small>' + it.sets.map(s => (s.wu ? 'R ' : '') + fmtKg(num(s.kg)) + '×' + num(s.reps)).join('  ') + '</small></div></div>').join('') +
    (h.cardio || []).map(c => '<div class="list-item flat"><div><b>' + esc(c.type) + '</b><small>' + c.min + ' min' + (c.km ? ' · ' + fmtKg(c.km) + ' km' : '') + '</small></div></div>').join('') +
    '<div class="grid2"><button class="btn ghost" data-act="histRepeat" data-id="' + h.id + '">' + ic('play') + 'Ripeti</button><button class="btn danger ghost" data-act="histDel" data-id="' + h.id + '">' + ic('trash') + 'Elimina</button></div>';
}

/* =================== CHAT AI =================== */
VIEWS.aichat = () => {
  const A = UI.ai;
  const sugg = ['Come posso migliorare la panca piana?', 'Cosa mangio prima dell\'allenamento?', 'Analizza i miei ultimi allenamenti', 'Ho poco tempo: allenamento da 30 minuti?'];
  return header('Coach AI', { back: true, noGear: true, sub: (AI_PROVIDERS[S.settings.ai.provider] || {}).n }) + '<div class="pad chat">' +
    (A.msgs.length ? '' : '<div class="card"><p>Ciao! Conosco il tuo profilo e i tuoi ultimi allenamenti. Chiedimi quello che vuoi.</p><div class="chips">' + sugg.map(s => '<button class="chip" data-act="aiSugg" data-t="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div></div>') +
    A.msgs.map(m => '<div class="msg ' + m.role + '">' + (m.role === 'assistant' ? aiFormat(m.text) : esc(m.text)) + '</div>').join('') +
    (A.busy ? '<div class="msg assistant typing"><i></i><i></i><i></i></div>' : '') +
    '</div><div class="chat-in"><textarea rows="1" placeholder="Scrivi una domanda…" data-in="aiText"></textarea><button class="btn" data-act="aiSend"' + (A.busy ? ' disabled' : '') + '>Invia</button></div>';
};
async function aiSend(text) {
  text = (text || '').trim(); if (!text || UI.ai.busy) return;
  UI.ai.msgs.push({ role: 'user', text }); UI.ai.busy = true; render();
  scrollChat();
  try { UI.ai.msgs.push({ role: 'assistant', text: await aiAsk(UI.ai.msgs.slice(-12)) }); }
  catch (e) { UI.ai.msgs.push({ role: 'assistant', text: 'Errore: ' + (e.message || e) + '. Controlla la chiave nelle impostazioni e la connessione.' }); }
  UI.ai.busy = false; if (current().v === 'aichat') { render(); scrollChat(); }
}
function scrollChat() { const v = document.getElementById('view'); v.scrollTop = v.scrollHeight; }
