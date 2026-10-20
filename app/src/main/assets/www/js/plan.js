/* GYM — piano di dimagrimento basato sugli studi + storico progressioni */
'use strict';

/* ===== Piano alimentare ===== */
const DIET_RATES = [
  { r: 0.25, n: 'Ricomposizione', d: 'Deficit minimo: perdi grasso piano piano mentre costruisci muscolo. Adatto se vuoi anche aumentare la massa.' },
  { r: 0.5, n: 'Lento', d: 'Consigliato: 0,5% del peso a settimana conserva al meglio i muscoli, soprattutto se sei già abbastanza asciutto.' },
  { r: 0.75, n: 'Moderato', d: 'Buon compromesso tra velocità e mantenimento dei muscoli.' },
  { r: 1, n: 'Rapido', d: '1% a settimana: solo se hai parecchio grasso da perdere. Più fame e più rischio di perdere muscolo.' }
];
const DIETS = {
  mediterranea: { n: 'Mediterranea ipocalorica', fatPct: 0.30, d: 'Verdura, legumi, cereali integrali, pesce, olio extravergine e frutta secca. È lo schema con più prove anche sulla salute: nello studio PREDIMED-Plus la versione con −600 kcal e più movimento ha ridotto il rischio di diabete del 31%.',
    menu: [['colazione', 'Yogurt greco 0%', 170], ['colazione', 'Fiocchi d\'avena', 40], ['colazione', 'Fragole', 150], ['colazione', 'Noci', 15],
      ['pranzo', 'Pasta integrale (cruda)', 80], ['pranzo', 'Ceci (cotti/in scatola)', 120], ['pranzo', 'Pomodori', 150], ['pranzo', 'Olio extravergine d\'oliva', 10],
      ['spuntini', 'Mela', 150], ['spuntini', 'Mandorle', 15],
      ['cena', 'Salmone fresco', 150], ['cena', 'Patate', 200], ['cena', 'Zucchine', 200], ['cena', 'Olio extravergine d\'oliva', 10], ['cena', 'Pane integrale', 40]] },
  proteica: { n: 'Alta proteina bilanciata', fatPct: 0.25, d: 'Proteine a ogni pasto e carboidrati soprattutto intorno all\'allenamento. Le proteine alte aiutano a conservare i muscoli in deficit e saziano di più.',
    menu: [['colazione', 'Albume d\'uovo', 150], ['colazione', 'Uovo intero', 55], ['colazione', 'Pane integrale', 50], ['colazione', 'Arancia', 150],
      ['pranzo', 'Riso basmati (crudo)', 70], ['pranzo', 'Petto di pollo (crudo)', 150], ['pranzo', 'Zucchine', 200], ['pranzo', 'Olio extravergine d\'oliva', 10],
      ['spuntini', 'Yogurt greco 0%', 170], ['spuntini', 'Banana', 120],
      ['cena', 'Merluzzo', 200], ['cena', 'Patate', 200], ['cena', 'Broccoli', 200], ['cena', 'Olio extravergine d\'oliva', 10], ['cena', 'Fiocchi di latte', 150]] },
  lowcarb: { n: 'Pochi carboidrati', carbs: 100, d: 'Circa 100 g di carboidrati al giorno, più proteine e grassi buoni. Utile se ti aiuta a controllare la fame: a parità di calorie il risultato è simile alle altre diete (studio DIETFITS).',
    menu: [['colazione', 'Uovo intero', 110], ['colazione', 'Prosciutto crudo', 30], ['colazione', 'Pane integrale', 30],
      ['pranzo', 'Petto di tacchino (crudo)', 150], ['pranzo', 'Mozzarella', 60], ['pranzo', 'Insalata', 100], ['pranzo', 'Pomodori', 150], ['pranzo', 'Olio extravergine d\'oliva', 15],
      ['spuntini', 'Yogurt greco intero', 170], ['spuntini', 'Noci', 20],
      ['cena', 'Salmone fresco', 150], ['cena', 'Broccoli', 250], ['cena', 'Olio extravergine d\'oliva', 10], ['cena', 'Fragole', 150]] },
  digiuno: { n: 'Digiuno intermittente 16:8', fatPct: 0.30, d: 'Mangi in una finestra di 8 ore (es. 12–20) con le stesse calorie. Gli studi non mostrano più perdita di peso rispetto al deficit normale, ma ad alcuni rende più facile rispettarlo.',
    menu: [['pranzo', 'Pasta di semola (cruda)', 80], ['pranzo', 'Tonno al naturale (sgocciolato)', 80], ['pranzo', 'Pomodori', 150], ['pranzo', 'Olio extravergine d\'oliva', 10],
      ['spuntini', 'Yogurt greco 0%', 170], ['spuntini', 'Banana', 120], ['spuntini', 'Mandorle', 15],
      ['cena', 'Petto di pollo (crudo)', 150], ['cena', 'Patate', 250], ['cena', 'Zucchine', 200], ['cena', 'Olio extravergine d\'oliva', 10], ['cena', 'Pane integrale', 40]] }
};
const FIXED_FOODS = ['Pomodori', 'Zucchine', 'Insalata', 'Broccoli', 'Olio extravergine d\'oliva'];
const DIET_SOURCES = [
  ['ISSN 2017 – Diete e composizione corporea', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5470183/'],
  ['Helms 2014 – Raccomandazioni nutrizionali in deficit', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4033492/'],
  ['DIETFITS 2018 – Low-fat vs low-carb', 'https://www.tctmd.com/news/diet-draw-no-weight-loss-differences-between-low-carb-low-fat-approaches-dietfits'],
  ['Liu 2022 – Digiuno + restrizione calorica', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11236600/'],
  ['PREDIMED-Plus – Mediterranea ipocalorica', 'https://www.asebio.com/en/actualidad/noticias/dieta-mediterranea-hipocalorica-actividad-fisica-reduce-diabetes-PREDIMEDPLUS']
];

function dietState() {
  S.diet = S.diet || {};
  const g = goalsOf();
  if (S.diet.rate == null) S.diet.rate = g.includes('massa') || g.includes('forza') ? 0.25 : 0.5;
  if (!S.diet.style) S.diet.style = 'mediterranea';
  if (S.diet.adj == null) S.diet.adj = 0;
  if (!S.diet.since) S.diet.since = Date.now();
  return S.diet;
}
const dietActive = () => goalsOf().includes('dimagrimento');

/* applica il piano ai fabbisogni (chiamata da nutritionTargets) */
function applyDietPlan(out, p) {
  if (!dietActive() || !out.w) return out;
  const D = dietState();
  out.protein = Math.round(out.w * 2.2); // 2,3–3,1 g/kg di massa magra ≈ 2–2,4 g/kg di peso
  out.diet = D;
  out.kgWeek = Math.round(out.w * D.rate / 100 * 100) / 100;
  if (out.ready) {
    let deficit = Math.round(out.w * D.rate / 100 * 7700 / 7);
    deficit = Math.min(deficit, Math.round(out.tdee * 0.25)) - D.adj;
    out.deficit = deficit;
    out.kcal = Math.max(out.bmr, Math.round((out.tdee - deficit) / 10) * 10);
    out.floor = out.kcal === out.bmr;
    const style = DIETS[D.style] || DIETS.mediterranea;
    if (style.carbs) { out.carbs = style.carbs; out.fat = Math.max(Math.round(out.w * 0.6), Math.round((out.kcal - out.protein * 4 - out.carbs * 4) / 9)); }
    else { out.fat = Math.max(Math.round(out.w * 0.6), Math.round(out.kcal * style.fatPct / 9)); out.carbs = Math.max(0, Math.round((out.kcal - out.protein * 4 - out.fat * 9) / 4)); }
    out.kcalAdj = -deficit;
  }
  return out;
}

/* esempio di giornata scalato sulle tue calorie */
function sampleDay(styleKey, kcal) {
  const st = DIETS[styleKey] || DIETS.mediterranea, find = n => FOOD_DB.find(f => f.name === n);
  const rows = st.menu.map(([m, n, g]) => ({ m, f: find(n), g })).filter(r => r.f);
  const fixed = rows.filter(r => FIXED_FOODS.includes(r.f.name)), scal = rows.filter(r => !FIXED_FOODS.includes(r.f.name));
  const kc = rs => rs.reduce((a, r) => a + r.f.kcal * r.g / 100, 0);
  const k = Math.max(0.6, Math.min(1.9, (kcal - kc(fixed)) / kc(scal)));
  rows.forEach(r => { if (!FIXED_FOODS.includes(r.f.name)) r.g = Math.max(5, Math.round(r.g * k / 5) * 5); });
  const tot = rows.reduce((t, r) => { const q = r.g / 100; t.kcal += r.f.kcal * q; t.p += r.f.p * q; t.c += r.f.c * q; t.f += r.f.f * q; return t; }, { kcal: 0, p: 0, c: 0, f: 0 });
  return { rows, tot };
}

/* controllo settimanale del peso */
function weeklyCheck() {
  const D = dietState(), now = Date.now(), W = S.weights;
  const avg = (a, b) => { const l = W.filter(w => w.d > now - b * 864e5 && w.d <= now - a * 864e5); return l.length ? { v: l.reduce((s, w) => s + w.kg, 0) / l.length, n: l.length } : null; };
  const cur = avg(0, 7), prev = avg(7, 14);
  if (!cur || !prev) return { state: 'wait', text: 'Pesati almeno 2–3 volte a settimana, alla stessa ora (mattina, a digiuno): dopo due settimane ti dico se il deficit va regolato.' };
  const pct = (prev.v - cur.v) / prev.v * 100, days = (now - D.since) / 864e5;
  const txt = 'Media ultimi 7 giorni ' + fmtKg(Math.round(cur.v * 10) / 10) + ' kg (' + (pct >= 0 ? '−' : '+') + fmtKg(Math.abs(Math.round(pct * 100) / 100)) + '% rispetto alla settimana prima). Obiettivo: −' + fmtKg(D.rate) + '%.';
  if (days >= 14 && pct < D.rate * 0.5) return { state: 'slow', text: txt + ' Stai perdendo meno del previsto: togli circa 150 kcal al giorno (o aggiungi 2.000–3.000 passi).', adj: 150 };
  if (pct > Math.max(1.2, D.rate * 1.6)) return { state: 'fast', text: txt + ' Stai perdendo troppo in fretta: rischi di perdere muscolo. Aggiungi circa 150 kcal al giorno.', adj: -150 };
  return { state: 'ok', text: txt + ' Sei in linea: continua così.' };
}

VIEWS.diet = () => {
  const n = nutritionTargets(), D = dietState(), g = goalsOf();
  let out = header('Piano alimentare', { back: true, noGear: true, sub: dietActive() ? 'Dimagrimento basato sugli studi' : 'Alimentazione' }) + '<div class="pad">';
  if (!dietActive()) out += '<div class="note">Il piano di dimagrimento si attiva quando tra i tuoi obiettivi c\'è "Dimagrimento" (Impostazioni → Profilo).</div>';
  if (!n.ready) out += '<div class="card"><h3>I tuoi dati</h3><p class="small muted">Servono per calcolare il deficit.</p>' + bodyDataFields() + '</div>';
  out += '<div class="card"><h3>1. A che ritmo vuoi dimagrire?</h3>' + DIET_RATES.map(x => {
      const kg = n.w ? Math.round(n.w * x.r / 100 * 100) / 100 : null, def = n.w ? Math.round(n.w * x.r / 100 * 7700 / 7) : null;
      return '<button class="opt ' + (D.rate === x.r ? 'on' : '') + '" data-act="dietRate" data-r="' + x.r + '"><b>' + x.n + ' · ' + fmtKg(x.r) + '% a settimana' + (kg ? ' (≈ ' + fmtKg(kg) + ' kg)' : '') + '</b><small>' + x.d + (def ? ' Deficit ≈ ' + def + ' kcal/giorno.' : '') + '</small></button>';
    }).join('') + '</div>';
  if (n.kcal) {
    out += '<div class="card"><h3>I tuoi numeri</h3><div class="stats3"><div><b>' + n.kcal + '</b><small>kcal al giorno</small></div><div><b>' + (n.deficit != null ? '−' + n.deficit : '—') + '</b><small>deficit</small></div><div><b>' + n.protein + ' g</b><small>proteine</small></div></div>' +
      '<div class="macro"><i style="flex:' + n.protein * 4 + '" class="pro"></i><i style="flex:' + n.carbs * 4 + '" class="carb"></i><i style="flex:' + n.fat * 9 + '" class="fat"></i></div>' +
      '<div class="macro-l small"><span><i class="pro"></i>Proteine ' + n.protein + ' g</span><span><i class="carb"></i>Carboidrati ' + n.carbs + ' g</span><span><i class="fat"></i>Grassi ' + n.fat + ' g</span></div>' +
      '<p class="small muted">Consumo stimato ' + n.tdee + ' kcal. Proteine 2,2 g/kg per conservare i muscoli in deficit. ' + (n.floor ? 'Non scendo sotto il metabolismo a riposo (' + n.bmr + ' kcal): meglio aumentare il movimento.' : '') + (D.adj ? ' Correzione settimanale applicata: ' + (D.adj > 0 ? '−' : '+') + Math.abs(D.adj) + ' kcal.' : '') + '</p></div>';
  }
  out += '<div class="card"><h3>2. Che tipo di dieta preferisci?</h3><p class="small muted">A parità di calorie e proteine funzionano tutte in modo simile: scegli quella che riesci a seguire con piacere.</p>' +
    Object.keys(DIETS).map(k => '<button class="opt ' + (D.style === k ? 'on' : '') + '" data-act="dietStyle" data-k="' + k + '"><b>' + DIETS[k].n + '</b><small>' + DIETS[k].d + '</small></button>').join('') + '</div>';
  if (n.kcal) {
    const sd = sampleDay(D.style, n.kcal);
    out += '<div class="card"><div class="card-h"><h3>Esempio di giornata</h3><span class="muted small">≈ ' + Math.round(sd.tot.kcal) + ' kcal</span></div>' +
      (D.style === 'digiuno' ? '<p class="small muted">Dalle 20 alle 12: solo acqua, tè o caffè senza zucchero.</p>' : '') +
      MEALS_DAY.map(([mk, mn]) => { const r = sd.rows.filter(x => x.m === mk); return r.length ? '<div class="menu-m"><b>' + mn + '</b>' + r.map(x => '<div class="menu-r"><span>' + esc(x.f.name.replace(/ \(.*\)/, '')) + '</span><span>' + x.g + ' g</span></div>').join('') + '</div>' : ''; }).join('') +
      '<p class="small muted">P ' + Math.round(sd.tot.p) + ' g · C ' + Math.round(sd.tot.c) + ' g · G ' + Math.round(sd.tot.f) + ' g. Grammi a crudo; verdure a volontà.</p>' +
      '<button class="btn ghost wide" data-act="dietToDiary">' + ic('plus') + 'Copia nel diario di oggi</button></div>';
  }
  if (dietActive()) {
    const wc = weeklyCheck();
    out += '<div class="card"><h3>Controllo settimanale</h3><p class="small">' + esc(wc.text) + '</p>' +
      (wc.adj ? '<button class="btn wide" data-act="dietAdj" data-a="' + wc.adj + '">' + (wc.adj > 0 ? 'Applica −150 kcal' : 'Applica +150 kcal') + '</button>' : '') +
      '<button class="btn ghost wide" data-act="addWeight">' + ic('scale') + 'Registra il peso</button></div>';
  }
  out += '<div class="card"><h3>Su cosa si basa</h3><ul class="tips small">' +
    '<li>Ritmo 0,5–1% del peso a settimana; più lento se sei asciutto (Helms 2014, ISSN 2017).</li>' +
    '<li>Proteine 2,3–3,1 g per kg di massa magra in deficit; grassi 15–30% delle calorie (Helms 2014).</li>' +
    '<li>Low-fat, low-carb, chetogenica e digiuno funzionano in modo simile a parità di calorie: conta riuscire a seguirla (ISSN 2017, DIETFITS 2018).</li>' +
    '<li>Il digiuno intermittente non dà vantaggi certi rispetto al deficit giornaliero (ISSN 2017; Liu 2022).</li></ul>' +
    DIET_SOURCES.map(s => '<button class="list-item btnlike" data-act="openUrl" data-u="' + s[1] + '"><div><b>' + s[0] + '</b></div>' + ic('back', 'flip') + '</button>').join('') + '</div>' +
    '<p class="small muted center">Indicazioni generali per adulti sani, non sostituiscono medico o nutrizionista. In gravidanza, con patologie o disturbi alimentari rivolgiti a un professionista.</p></div>';
  return out;
};

/* ===== Storico progressioni ===== */
PROG.andamento = () => {
  const ids = []; S.history.slice().reverse().forEach(h => (h.items || []).forEach(i => { if (!ids.includes(i.ex) && workSets(i).length && EX[i.ex]) ids.push(i.ex); }));
  if (!ids.length) return '<div class="empty">Completa qualche allenamento: qui vedrai per ogni esercizio progressi, stalli e regressioni, con il consiglio per la prossima volta.</div>';
  const sums = ids.map(id => ({ id, tr: exerciseTrend(id) })).map(x => Object.assign(x, { s: trendSummary(x.tr) }));
  const cnt = k => sums.filter(x => x.s.kind === k).length;
  return '<div class="stats3 card"><div><b class="good">' + cnt('up') + '</b><small>in progressione</small></div><div><b>' + cnt('same') + '</b><small>stabili</small></div><div><b class="bad">' + cnt('down') + '</b><small>in calo</small></div></div>' +
    sums.map(({ id, tr, s }) => {
      const e = EX[id], pre = prescribe(id), prog = progression(id, pre.rmin, pre.rmax);
      return '<div class="card trend-card"><div class="card-h"><button class="link" data-act="exInfo" data-id="' + id + '"><h3>' + esc(e.n) + '</h3><small class="muted">' + muscleName(e.m) + ' · ' + tr.length + ' sedute</small></button><span class="tbadge ' + s.kind + '">' + (s.kind === 'up' ? '▲ ' : s.kind === 'down' ? '▼ ' : s.kind === 'same' ? '= ' : '') + s.label + '</span></div>' +
        tr.slice(0, 5).map(t => '<div class="trow"><span class="td">' + fmtDate(t.date) + '</span><span class="tt">' + fmtKg(num(t.top.kg)) + ' kg × ' + num(t.top.reps) + '</span><span class="tw ' + t.kind + '">' + (t.kind === 'up' ? '▲ ' : t.kind === 'down' ? '▼ ' : '') + esc(t.what) + '</span><span class="te">' + Math.round(t.e1) + '</span></div>').join('') +
        '<div class="tip ' + prog.kind + '">' + ic('coach', 'inline') + '<b>Prossima volta:</b> ' + esc(prog.text) + '</div>' +
        (s.kind === 'down' ? '<p class="small muted">' + (dietActive() ? 'In deficit calorico è normale fare fatica a salire: l\'obiettivo è mantenere i carichi. ' : '') + 'Controlla sonno (7–9 ore), proteine e recupero; se il calo continua fai una settimana di scarico.</p>' : '') +
      '</div>';
    }).join('') + '<p class="small muted center">L\'ultima colonna è il massimale stimato (kg). ▲ progressione, ▼ regressione rispetto alla seduta precedente.</p>';
};
