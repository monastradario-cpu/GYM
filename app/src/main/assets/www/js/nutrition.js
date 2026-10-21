/* GYM — alimentazione e consigli del personal trainer */
'use strict';

/* fabbisogno stimato (Mifflin-St Jeor) */
function nutritionTargets() {
  const p = S.profile, w = S.weights.length ? S.weights[S.weights.length - 1].kg : 0;
  const goals = goalsOf(p);
  const days = (p.days || []).length;
  const act = days <= 1 ? 1.3 : days <= 3 ? 1.45 : days <= 5 ? 1.6 : 1.72;
  const kcalAdj = Math.round(goals.reduce((a, g) => a + GOALS[g].kcal, 0) / goals.length);
  const protK = Math.max(...goals.map(g => GOALS[g].protein));
  const out = { w, ready: !!(w && p.height && p.age && p.sex), goals, kcalAdj, protK };
  if (w) {
    out.protein = Math.round(w * protK);
    out.water = Math.round(w * 35 / 100) / 10; // litri
    out.waterTrain = 0.5;
  }
  if (out.ready) {
    const bmr = 10 * w + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
    out.bmr = Math.round(bmr);
    out.tdee = Math.round(bmr * act);
    out.kcal = Math.round((out.tdee + kcalAdj) / 10) * 10;
    out.fat = Math.round(w * 0.9);
    out.carbs = Math.max(0, Math.round((out.kcal - out.protein * 4 - out.fat * 9) / 4));
  }
  return typeof applyDietPlan === 'function' ? applyDietPlan(out, p) : out;
}

const MEALS = {
  pre_full: {
    t: '2–3 ore prima: pasto completo',
    d: 'Carboidrati per l\'energia, proteine magre, pochi grassi e poche fibre per digerire bene.',
    ex: ['Pasta o riso (70–90 g) con pollo o tacchino e un filo d\'olio', 'Panino integrale con bresaola o tonno e pomodoro', 'Riso basmati con merluzzo e zucchine', 'Patate al forno con petto di pollo']
  },
  pre_snack: {
    t: '30–60 minuti prima: spuntino leggero',
    d: 'Carboidrati veloci e digeribili, poca roba. Evita fritti e cibi molto grassi.',
    ex: ['Una banana', 'Yogurt greco con un cucchiaino di miele', '2–3 fette biscottate con marmellata', 'Una manciata di datteri o frutta secca dolce', 'Gallette di riso con un velo di miele']
  },
  post: {
    t: 'Entro 1–2 ore dopo: recupero',
    d: 'Proteine (25–40 g) per ricostruire i muscoli e carboidrati per ricaricare le energie.',
    ex: ['Yogurt greco con frutta e fiocchi d\'avena', 'Pasta o riso con tonno, pollo o legumi e verdure', 'Frittata (2 uova + albumi) con pane integrale', 'Frullato: latte, banana e una dose di proteine', 'Salmone con patate e insalata', 'Fiocchi di latte con pane integrale e frutta']
  },
  rest: {
    t: 'Giorni di riposo',
    d: 'Mantieni alte le proteine, riduci un po\' i carboidrati se il tuo obiettivo è dimagrire, tanta verdura e frutta.',
    ex: ['Proteine a ogni pasto (carne bianca, pesce, uova, legumi, latticini)', 'Verdure a pranzo e cena', '2–3 porzioni di frutta', 'Grassi buoni: olio extravergine, frutta secca, avocado']
  }
};

function goalNutritionTips(goals) {
  const t = [];
  if (goals.includes('massa')) t.push('Massa: mangia leggermente sopra il fabbisogno (+250–300 kcal). Se il peso non sale in 2 settimane, aggiungi una porzione di carboidrati.');
  if (goals.includes('forza')) t.push('Forza: carboidrati sufficienti nei giorni di allenamento pesante, non allenarti a digiuno.');
  if (goals.includes('dimagrimento')) t.push('Dimagrimento: deficit moderato (−300/−500 kcal), proteine alte per non perdere muscolo. Punta a perdere 0,5–1% del peso a settimana.');
  if (goals.includes('tonificazione')) t.push('Tonificazione: mangia intorno al fabbisogno, proteine alte e carboidrati concentrati intorno all\'allenamento.');
  if (goals.includes('benessere')) t.push('Benessere: cibi poco lavorati, verdura a ogni pasto, acqua e sonno regolare (7–9 ore).');
  if (goals.includes('massa') && goals.includes('dimagrimento')) t.push('Massa + dimagrimento insieme (ricomposizione): mangia vicino al fabbisogno, proteine alte e allenati con costanza. I risultati sono più lenti ma reali.');
  return t;
}

const TRAINER_TIPS = [
  'Il riscaldamento non è facoltativo: 5–10 minuti riducono gli infortuni e ti fanno sollevare di più.',
  'Progressione: quando completi tutte le serie al massimo delle ripetizioni, aumenta il carico la volta dopo.',
  'Dormi 7–9 ore: è durante il sonno che i muscoli crescono e si riparano.',
  'Bevi acqua durante l\'allenamento: anche una leggera disidratazione riduce la forza.',
  'La tecnica viene prima del carico: un\'esecuzione pulita allena meglio il muscolo e protegge le articolazioni.',
  'Ogni 6–8 settimane fai una settimana di scarico: stessi esercizi con il 60% del carico.',
  'Espira durante lo sforzo, inspira durante la fase di ritorno.',
  'Allenare ogni muscolo 2 volte a settimana è più efficace che una volta sola.',
  'Le proteine vanno distribuite: 20–40 g in ogni pasto principale.',
  'Annota sempre i carichi: quello che si misura, migliora.',
  'Il dolore articolare non è normale: se senti dolore, fermati e cambia esercizio.',
  'Per i glutei, spingi con i talloni e stringi in alto per un secondo.',
  'Nelle tirate pensa a portare i gomiti indietro, non a tirare con le mani.',
  'Recuperi più lunghi negli esercizi pesanti, più brevi nell\'isolamento.',
  'La costanza batte l\'intensità: meglio 3 allenamenti a settimana per un anno che 6 per un mese.',
  'Cammina ogni giorno: 7.000–10.000 passi aiutano recupero e dimagrimento.',
  'Non saltare le gambe: sono più della metà dei muscoli del corpo.',
  'Stretching leggero dopo l\'allenamento, mobilità prima.',
  'Mangia frutta e verdura colorate: vitamine e minerali aiutano il recupero.',
  'Se una settimana non migliori, non scoraggiarti: i progressi non sono mai una linea dritta.'
];
function tipOfDay() { const d = Math.floor(Date.now() / 864e5); return TRAINER_TIPS[d % TRAINER_TIPS.length]; }

const MOBILITY = [
  ['Rotazioni del collo', '10 per lato, lente'], ['Cerchi con le braccia', '15 avanti e 15 indietro'], ['Gatto-cammello', '10 ripetizioni respirando'],
  ['Affondo con rotazione', '6 per lato'], ['Allungamento flessori dell\'anca', '30 s per lato'], ['Ponte glutei', '15 ripetizioni'],
  ['Squat profondo tenuto', '30 s, talloni a terra'], ['Allungamento femorali', '30 s per lato'], ['Allungamento petto al muro', '30 s per lato'], ['Camminata', '20–30 minuti a passo svelto']
];

/* ===== Recupero muscolare e gruppi consigliati ===== */
function muscleRecovery() {
  const last = {}, now = Date.now();
  S.history.forEach(h => (h.items || []).forEach(it => {
    const e = EX[it.ex]; if (!e) return; const n = workSets(it).length; if (!n) return;
    const t = h.end || h.start;
    if (!last[e.m] || t > last[e.m]) last[e.m] = t;
    if (n >= 3) e.s.forEach(m => { if (MUSCLES[m] && (!last[m] || t > last[m])) last[m] = t; });
  }));
  const out = {};
  Object.keys(MUSCLES).forEach(m => {
    const hrs = last[m] ? (now - last[m]) / 36e5 : 999, need = BIG_MUSCLES.includes(m) ? 48 : 36;
    out[m] = { hrs, ready: hrs >= need, pct: Math.min(1, hrs / need) };
  });
  return out;
}
function suggestedGroups() {
  const rec = muscleRecovery(), wk = weekStats().musc;
  return DAY_GROUPS.map(g => {
    const ready = g.m.filter(m => rec[m].ready).length / g.m.length;
    const vol = g.m.reduce((a, m) => a + (wk[m] || 0), 0) / g.m.length;
    return Object.assign({}, g, { ready, score: ready * 10 - vol * 0.3 + (g.k === 'tutto' ? -1 : 0) });
  }).sort((a, b) => b.score - a.score);
}
function pairSuggestions(selected) {
  const out = [];
  selected.forEach(m => (PAIRS[m] || []).forEach(x => { if (!selected.includes(x) && !out.some(o => o.m === x)) out.push({ m: x, why: PAIR_WHY[m] }); }));
  return out.slice(0, 4);
}

/* acqua in litri (salvata in ml al giorno) */
function waterAuto() { const n = nutritionTargets(); const train = S.profile.days.includes(new Date().getDay()); return n.water ? Math.round((n.water + (train ? 0.5 : 0)) * 10) / 10 : 2; }
function waterGoalL() { return S.profile.waterL > 0 ? S.profile.waterL : waterAuto(); }
function waterToday() {
  S.waterMl = S.waterMl || {};
  if (!S.waterMigrated) { Object.keys(S.water || {}).forEach(k => { if (!S.waterMl[k] && S.water[k]) S.waterMl[k] = S.water[k] * 250; }); S.waterMigrated = true; }
  return S.waterMl[todayKey()] || 0;
}
