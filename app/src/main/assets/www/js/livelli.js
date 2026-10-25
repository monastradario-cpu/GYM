/* GYM — difficoltà degli esercizi (semplice, medio, complesso) e progressioni passo passo.
   Idea presa da MuscleWiki (difficoltà visibile, progressioni per chi non riesce ancora a fare l'esercizio completo);
   contenuti scritti da noi. Salire di gradino quando le ripetizioni arrivano in alto nell'intervallo
   è la "doppia progressione" già usata dal trainer (ACSM 2026: progressione graduale del carico). */
'use strict';

/* ---------- difficoltà ---------- */
const DIFF_N = { 1: 'Semplice', 2: 'Medio', 3: 'Complesso' };
const DIFF_D = {
  1: 'Macchine, cavi e movimenti facili da imparare.',
  2: 'Pesi liberi e movimenti con più coordinazione.',
  3: 'Tecnica impegnativa: meglio con qualche mese di esperienza.'
};
/* esercizi principali (scritti a mano): difficoltà decisa uno per uno */
const DIFF_CORE = {
  stacco_bil: 3, squat_bil: 3, front_squat: 3, trazioni: 3, dip: 3, good_morning: 3,
  panca_piana_bil: 2, panca_inclinata_bil: 2, rematore_bil: 2, military_bil: 2, tirate_mento: 2, french_press: 2, panca_stretta: 2,
  stacco_rumeno_bil: 2, stacco_rumeno_man: 2, hip_thrust_bil: 2, bulgarian_man: 2, affondi_man: 2, step_up: 2, lento_man: 2,
  pullover_man: 2, piegamenti: 2, swing_man: 2, burpees: 2, mountain_climber: 2, hack_squat: 2, calf_bil: 2, russian_twist: 2,
  leg_raise: 2, affondi_corpo: 2, dip_sedia: 2, inchworm: 2, mob_worlds: 2, slam_palla_medica: 2, panca_inclinata_man: 2, panca_piana_man: 2, rematore_man: 1,
  // esercizi delle progressioni presi dal database esteso: difficoltà allineata ai gradini
  piegamenti_piedi_rialzati: 3, trazioni_zavorrate: 3, trazioni_presa_inversa: 3, trazioni_assistite_elastico: 2, rematore_inverso: 2,
  affondi_camminati_corpo_libero: 2, ponte_glutei_gamba: 1, plank_laterale: 2, dead_bug: 1, stacco_gamba_kettlebell: 2
};
function diffOf(e) {
  e = typeof e === 'string' ? EX[e] : e; if (!e) return 1;
  if (DIFF_CORE[e.id]) return DIFF_CORE[e.id];
  return e.core ? 1 : Math.min(3, Math.max(1, e.lvl || 1));
}
const diffBadge = e => { const d = diffOf(e); return '<span class="diff d' + d + '">' + DIFF_N[d] + '</span>'; };

/* libreria: filtro per difficoltà e etichetta su ogni esercizio */
VIEWS.library = () => {
  const L = UI.lib, D = L.diff || 0;
  return header('Esercizi') + '<div class="pad">' +
    '<input type="search" class="search" placeholder="Cerca un esercizio…" value="' + esc(L.q) + '" data-in="libQ">' +
    '<div class="seg diff-seg">' + chip('Tutti', !D, 'libDiff', 'data-d="0"') + [1, 2, 3].map(d => chip('<i class="dot d' + d + '"></i>' + DIFF_N[d], D === d, 'libDiff', 'data-d="' + d + '"')).join('') + '</div>' +
    (D ? '<p class="small muted">' + DIFF_D[D] + '</p>' : '') +
    '<div class="chips scroll">' + chip('Tutti i muscoli', !L.m, 'libM', 'data-m=""') + Object.keys(MUSCLES).map(m => chip(MUSCLES[m], L.m === m, 'libM', 'data-m="' + m + '"')).join('') + '</div>' +
    '<div class="chips scroll">' + chip('Ogni attrezzo', !L.eq, 'libEq', 'data-e=""') + Object.keys(EQUIP).map(k => chip(EQUIP[k], L.eq === k, 'libEq', 'data-e="' + k + '"')).join('') + '</div>' +
    '<div id="lib-list">' + libList() + '</div></div>';
};
libList = function () {
  const L = UI.lib, q = L.q.toLowerCase(), D = L.diff || 0;
  const list = EXERCISES.filter(e => (!L.m || e.m === L.m) && (!L.eq || e.eq === L.eq) && (!D || diffOf(e) === D) && (!q || e.n.toLowerCase().includes(q)));
  const groups = {};
  // dentro ogni muscolo: prima i più semplici, prima quelli scritti a mano
  list.slice().sort((a, b) => diffOf(a) - diffOf(b) || (b.core ? 1 : 0) - (a.core ? 1 : 0)).forEach(e => { (groups[e.m] = groups[e.m] || []).push(e); });
  const order = Object.keys(MUSCLES).filter(m => groups[m]).concat(Object.keys(groups).filter(m => !MUSCLES[m]));
  return order.map(m => '<h3 class="sec">' + muscleName(m) + ' <small class="muted">' + groups[m].length + '</small></h3>' + groups[m].map(e => {
    const r = records(e.id);
    return '<button class="list-item btnlike" data-act="exInfo" data-id="' + e.id + '"><div><b>' + esc(e.n) + '</b><small>' + diffBadge(e) + ' ' + EQUIP[e.eq] + (r.kg ? ' · record ' + fmtKg(r.kg) + ' kg' : '') + (chainOf(e.id) ? ' · progressione' : '') + '</small></div>' + ic('back', 'flip') + '</button>';
  }).join('')).join('') || '<div class="empty">Nessun esercizio trovato</div>';
};

/* ---------- progressioni passo passo ----------
   Ogni catena va dal gradino più facile al più difficile, stesso schema di movimento. */
const PROG_CHAINS = [
  { k: 'piegamenti', n: 'Piegamenti', ex: ['piegamenti_scrivania', 'piegamenti_inclinati', 'piegamenti_ginocchia', 'piegamenti', 'piegamenti_piedi_rialzati'] },
  { k: 'squat', n: 'Squat', ex: ['alzati_siediti', 'squat_corpo', 'goblet_squat', 'squat_bil'] },
  { k: 'trazioni', n: 'Trazioni', ex: ['lat_machine', 'trazioni_assistite_elastico', 'trazioni_presa_inversa', 'trazioni', 'trazioni_zavorrate'] },
  { k: 'rematore', n: 'Rematore a corpo libero', ex: ['superman', 'rematore_inverso_anelli_trx', 'rematore_inverso'] },
  { k: 'plank', n: 'Plank e core', ex: ['dead_bug', 'plank', 'plank_laterale'] },
  { k: 'affondi', n: 'Affondi', ex: ['step_up', 'affondi_corpo', 'affondi_camminati_corpo_libero', 'affondi_man', 'bulgarian_man'] },
  { k: 'ponte', n: 'Ponte e hip thrust', ex: ['ponte_glutei', 'ponte_glutei_gamba', 'hip_thrust_man', 'hip_thrust_bil'] },
  { k: 'dip', n: 'Dip', ex: ['dip_machine', 'dip_sedia', 'dip'] },
  { k: 'stacco', n: 'Stacco', ex: ['ponte_glutei', 'stacco_rumeno_man', 'stacco_rumeno_bil', 'stacco_bil'] },
  { k: 'spalle', n: 'Spinta sopra la testa', ex: ['shoulder_press_mac', 'lento_man', 'military_bil'] }
].map(c => Object.assign(c, { ex: c.ex.filter(id => EX[id]) }));
function chainOf(id) {
  for (const c of PROG_CHAINS) { const i = c.ex.indexOf(id); if (i >= 0) return { c, i }; }
  return null;
}
/* come è andata l'ultima volta: 'up' pronto a salire, 'down' troppo difficile, null continua così */
function stepStatus(id) {
  const ch = chainOf(id); if (!ch) return null;
  const e = EX[id], timed = e.type === 'time';
  const H = exerciseHistory(id).slice(0, 2); if (!H.length) return null;
  const reps = s => num(s.reps), last = H[0].sets;
  // salire: nelle ultime 2 sedute tutte le serie in alto (12 ripetizioni o 60 s), almeno 2 serie
  const top = timed ? 60 : e.eq === 'corpo' ? 12 : Math.max(12, num((S.templates.flatMap(t => t.items).find(i => i.ex === id) || {}).rmax) || 12);
  const allTop = h => h.sets.length >= 2 && h.sets.every(s => reps(s) >= top);
  if (H.length >= 2 && H.every(allTop) && ch.i < ch.c.ex.length - 1) return { k: 'up', to: ch.c.ex[ch.i + 1], ch };
  // scendere: la maggior parte delle serie sotto 5 ripetizioni (o 20 s)
  const low = timed ? 20 : 5;
  if (last.length >= 2 && last.filter(s => reps(s) < low).length > last.length / 2 && ch.i > 0) return { k: 'down', to: ch.c.ex[ch.i - 1], ch };
  return null;
}
function chainCard(id) {
  const ch = chainOf(id); if (!ch) return '';
  const st = stepStatus(id);
  return '<div class="card"><h3>' + ic('chart', 'inline') + 'Progressione: ' + esc(ch.c.n) + '</h3><p class="small muted">Dal più facile al più difficile. Quando fai tutte le serie a ' + (EX[id].type === 'time' ? '60 secondi' : '12 ripetizioni') + ' per 2 volte di fila, passi al gradino dopo.</p>' +
    '<div class="steps-chain">' + ch.c.ex.map((x, i) => '<button class="stp' + (i === ch.i ? ' on' : i < ch.i ? ' done' : '') + '" data-act="exInfo" data-id="' + x + '"><span class="n">' + (i + 1) + '</span><b>' + esc(EX[x].n) + '</b>' + diffBadge(x) + '</button>').join('') + '</div>' +
    (st ? '<div class="tip ' + (st.k === 'up' ? 'up' : 'info') + '">' + (st.k === 'up' ? 'Sei pronto per il gradino successivo: <b>' + esc(EX[st.to].n) + '</b>.' : 'Per ora è troppo difficile: torna a <b>' + esc(EX[st.to].n) + '</b> e risali.') + '</div>' +
      '<button class="btn wide" data-act="stepSwap" data-f="' + id + '" data-t="' + st.to + '">' + ic('swap') + 'Cambia nelle mie schede</button>' : '') + '</div>';
}
/* suggerimenti per gli esercizi delle schede: pronti a salire o da alleggerire */
function stepSuggestions() {
  const ids = [...new Set(S.templates.flatMap(t => t.items.map(i => i.ex)))], skip = S.stepSkip || {};
  return ids.map(id => Object.assign({ from: id }, stepStatus(id) || {})).filter(s => s.k && !(skip[s.from + '>' + s.to] && Date.now() - skip[s.from + '>' + s.to] < 14 * DAY));
}
function stepCard() {
  const L = stepSuggestions(); if (!L.length) return '';
  return '<div class="card"><div class="eyebrow">' + ic('chart', 'inline') + 'Progressione</div>' + L.slice(0, 2).map(s =>
    '<p class="small">' + (s.k === 'up' ? '💪 <b>' + esc(EX[s.from].n) + '</b> ti riesce bene: prova <b>' + esc(EX[s.to].n) + '</b>.' : '<b>' + esc(EX[s.from].n) + '</b> è ancora difficile: torna a <b>' + esc(EX[s.to].n) + '</b> e risali.') + '</p>' +
    '<div class="row gap"><button class="btn sm grow" data-act="stepSwap" data-f="' + s.from + '" data-t="' + s.to + '">Cambia nelle schede</button><button class="btn sm ghost" data-act="stepSkip" data-f="' + s.from + '" data-t="' + s.to + '">Non ora</button></div>').join('') + '</div>';
}
const _exView = VIEWS.exercise;
VIEWS.exercise = p => {
  const out = _exView(p), e = EX[p.id]; if (!e) return out;
  const add = '<div class="ex-diff">' + diffBadge(e) + '<small class="muted">' + DIFF_D[diffOf(e)] + '</small></div>' + chainCard(e.id);
  return out.replace('<div class="seg ex-tabs">', add + '<div class="seg ex-tabs">');
};
const _sumView = VIEWS.summary;
VIEWS.summary = p => {
  const out = _sumView(p), h = S.history.find(x => x.id === p.id); if (!h) return out;
  const L = h.items.map(it => Object.assign({ from: it.ex }, stepStatus(it.ex) || {})).filter(s => s.k === 'up');
  if (!L.length) return out;
  const card = '<div class="card"><h3>' + ic('sparkle', 'inline') + 'Pronto a salire di gradino</h3>' + L.map(s => '<div class="list-item flat"><div><b>' + esc(EX[s.from].n) + ' → ' + esc(EX[s.to].n) + '</b><small>Hai fatto tutte le serie in alto per 2 volte di fila</small></div><button class="btn sm" data-act="stepSwap" data-f="' + s.from + '" data-t="' + s.to + '">Cambia</button></div>').join('') + '</div>';
  return out.replace('<div class="card"><h3>Dettaglio</h3>', card + '<div class="card"><h3>Dettaglio</h3>');
};

Object.assign(ACT, {
  libDiff: d => { UI.lib.diff = num(d.d); render(); },
  stepSwap: d => {
    let n = 0;
    S.templates.forEach(t => { t.items = t.items.map(it => { if (it.ex !== d.f) return it; n++; return t.kind === 'circuito' ? Object.assign({}, it, { ex: d.t }) : Object.assign(prescribe(d.t, it.role), { ss: it.ss }); }); });
    S.stepLog = (S.stepLog || []).concat([{ d: Date.now(), from: d.f, to: d.t }]).slice(-50);
    save(true); render();
    toast(n ? EX[d.t].n + ': cambiato in ' + n + (n === 1 ? ' scheda' : ' schede') : 'Non è in nessuna scheda: aggiungilo dove vuoi');
  },
  stepSkip: d => { S.stepSkip = Object.assign(S.stepSkip || {}, { [d.f + '>' + d.t]: Date.now() }); save(); render(); }
});

/* le schede rigenerate dal percorso tengono i gradini già scelti */
const _bdtLiv = buildDefaultTemplates;
buildDefaultTemplates = function () {
  const T = _bdtLiv(), map = {};
  (S.stepLog || []).forEach(x => { map[x.from] = x.to; });
  const res = id => { let k = 0; while (map[id] && k++ < 8) id = map[id]; return id; };
  T.forEach(t => { t.items = t.items.map(it => { const id = res(it.ex); if (id === it.ex || !EX[id]) return it; return t.kind === 'circuito' ? Object.assign({}, it, { ex: id }) : prescribe(id, it.role); }); });
  return T;
};

/* ---------- testi scritti a mano per gli esercizi usati nelle schede (non presi dal database esteso) ---------- */
const HAND_TXT = {
  rematore_inverso_anelli_trx: { s: ['Regola gli anelli o il TRX all\'altezza della vita e afferra le maniglie.', 'Cammina con i piedi in avanti finché il corpo è inclinato e dritto, talloni a terra, braccia tese.', 'Tira il petto verso le mani portando i gomiti indietro e stringendo le scapole.', 'Scendi lento fino a braccia tese. Più i piedi sono avanti, più è difficile.'], e: ['Lasciar cadere il bacino.', 'Tirare con le spalle alzate verso le orecchie.'], t: 'Il corpo resta una tavola dalla testa ai talloni: alleni dorso e addome insieme.' },
  affondi_camminati_corpo_libero: { s: ['In piedi, mani sui fianchi, sguardo avanti.', 'Fai un passo lungo e scendi finché entrambe le ginocchia sono piegate a circa 90°.', 'Spingi con il tallone davanti e porta avanti l\'altra gamba nel passo successivo.', 'Continua alternando, busto dritto.'], e: ['Ginocchio davanti che cade verso l\'interno.', 'Passi troppo corti: il tallone si stacca.'], t: 'Se l\'equilibrio è incerto, fai gli affondi sul posto tenendoti a un appoggio.' },
  pallof_press: { s: ['Cavo all\'altezza del petto: mettiti di fianco alla macchina, maniglia stretta con due mani al petto.', 'Allontanati di un passo finché il cavo tira, piedi alla larghezza delle spalle, ginocchia morbide.', 'Spingi le mani dritte davanti a te senza farti ruotare dal cavo.', 'Tieni 2 secondi e riporta al petto. Poi cambia lato.'], e: ['Ruotare il busto verso la macchina.', 'Trattenere il respiro.'], t: 'È un esercizio "anti-rotazione": l\'addome lavora per restare fermo, come quando porti una borsa pesante.' },
  pull_through_elastico: { s: ['Fissa l\'elastico in basso dietro di te e passalo tra le gambe, tenendolo con due mani.', 'Fai un passo avanti, piedi un po\' più larghi delle spalle.', 'Piega le anche portando il bacino indietro, schiena dritta, ginocchia appena piegate.', 'Risali spingendo il bacino in avanti e stringendo i glutei.'], e: ['Piegare la schiena invece delle anche.', 'Tirare con le braccia.'], t: 'Insegna il movimento dello stacco senza caricare la schiena.' },
  rematore_due_manubri: { s: ['Manubri in mano, piega le anche e porta il busto inclinato in avanti, schiena dritta.', 'Braccia tese sotto le spalle, ginocchia leggermente piegate.', 'Tira i manubri verso i fianchi portando i gomiti indietro e stringendo le scapole.', 'Scendi lento fino a braccia tese.'], e: ['Curvare la schiena.', 'Raddrizzare il busto a ogni ripetizione.'], t: 'Se senti la zona lombare, appoggia la fronte o una mano a una panca e fai un braccio alla volta.' },
  stacco_gamba_kettlebell: { s: ['In piedi su una gamba, kettlebell nella mano opposta, ginocchio d\'appoggio appena piegato.', 'Piegati in avanti dall\'anca allungando l\'altra gamba indietro, schiena e gamba in linea.', 'Scendi finché senti tirare dietro la coscia, con il bacino parallelo al pavimento.', 'Risali stringendo il gluteo. Finisci le ripetizioni e cambia gamba.'], e: ['Ruotare il bacino aprendo l\'anca.', 'Curvare la schiena per scendere di più.'], t: 'Allena anche l\'equilibrio: all\'inizio tocca un muro con la mano libera.' },
  ponte_glutei_gamba: { s: ['Sdraiati sulla schiena, un piede a terra vicino al gluteo e l\'altra gamba tesa o piegata in aria.', 'Spingi con il tallone a terra e solleva il bacino fino a formare una linea spalle-ginocchio.', 'Stringi il gluteo per un secondo in alto.', 'Scendi lento. Finisci le ripetizioni e cambia gamba.'], e: ['Inarcare la schiena in alto.', 'Far scendere il bacino da un lato.'], t: 'Il doppio del lavoro per il gluteo rispetto al ponte classico, senza pesi.' },
  wood_chop_cavo: { s: ['Cavo in alto, mettiti di fianco alla macchina e afferra la maniglia con due mani sopra la spalla.', 'Piedi larghi, braccia quasi tese.', 'Porta la maniglia in diagonale verso il ginocchio opposto, ruotando busto e anche insieme.', 'Torna su controllando. Finisci il lato e cambia.'], e: ['Tirare solo con le braccia.', 'Ruotare la schiena tenendo i piedi bloccati: lascia girare il piede dietro.'], t: 'Il movimento parte dalle anche: è il gesto di chi spala o lancia.' },
  floor_press_alternata_kettlebell: { s: ['Sdraiati a terra con un kettlebell per mano, gomiti appoggiati a terra a circa 45° dal busto.', 'Spingi in alto un kettlebell fino a braccio teso, polso dritto.', 'Scendi lento finché il gomito tocca piano il pavimento.', 'Alterna le braccia.'], e: ['Lasciar cadere il gomito di colpo.', 'Piegare il polso all\'indietro.'], t: 'Il pavimento limita la discesa: più facile per le spalle della panca.' },
  rematore_alternato_kettlebell: { s: ['Kettlebell in mano, piega le anche e inclina il busto in avanti, schiena dritta.', 'Tira un kettlebell verso il fianco portando il gomito indietro.', 'Scendi lento e tira con l\'altro braccio.', 'Busto fermo durante tutto l\'esercizio.'], e: ['Ruotare il busto a ogni tirata.', 'Curvare la schiena.'], t: 'Alternare le braccia allena anche l\'addome a tenere il busto fermo.' },
  rematore_due_kettlebell: { s: ['Un kettlebell per mano, piega le anche e inclina il busto in avanti, schiena dritta.', 'Braccia tese sotto le spalle.', 'Tira insieme i due kettlebell verso i fianchi stringendo le scapole.', 'Scendi lento fino a braccia tese.'], e: ['Curvare la schiena.', 'Dare slancio con le gambe.'], t: 'Come il rematore con due manubri: se la schiena si stanca, appoggia la fronte a una panca.' },
  piegamenti_presa_stretta: { s: ['In posizione di piegamento con le mani sotto le spalle, un po\' più strette del solito.', 'Corpo dritto dalla testa ai talloni.', 'Scendi tenendo i gomiti vicini al busto, rivolti indietro.', 'Spingi fino a braccia tese sentendo lavorare i tricipiti.'], e: ['Aprire i gomiti.', 'Lasciar cadere il bacino.'], t: 'Se è troppo difficile, fallo sulle ginocchia o con le mani su un rialzo.' },
  dead_bug: { s: ['Sdraiati sulla schiena, braccia tese verso il soffitto, anche e ginocchia piegate a 90°.', 'Schiaccia la zona lombare a terra.', 'Allunga lentamente un braccio dietro la testa e la gamba opposta in avanti, senza staccare la schiena.', 'Torna al centro e cambia lato.'], e: ['Inarcare la schiena quando allunghi.', 'Andare veloce.'], t: 'Il core lavora senza caricare la schiena: ottimo anche con il mal di schiena.' },
  affondo_passaggio_kettlebell: { s: ['In piedi con un kettlebell in una mano.', 'Fai un affondo indietro e, in basso, passa il kettlebell sotto la gamba davanti all\'altra mano.', 'Torna in piedi e ripeti dall\'altro lato.', 'Busto dritto, movimento controllato.'], e: ['Curvare la schiena per passare il peso.', 'Ginocchio davanti che cade verso l\'interno.'], t: 'Unisce gambe, coordinazione e presa: inizia con un peso leggero.' },
  piegamenti_inclinati: { s: ['Mani su un rialzo stabile (panca, tavolo, gradino) alla larghezza delle spalle.', 'Piedi indietro finché il corpo è dritto dalla testa ai talloni.', 'Scendi con il petto verso il bordo, gomiti a circa 45° dal busto.', 'Spingi fino a braccia tese.'], e: ['Bacino che scende o sale.', 'Aprire i gomiti a 90°.'], t: 'Più il rialzo è alto, più è facile: abbassalo man mano che migliori.' },
  piegamenti_piedi_rialzati: { s: ['Piedi su una panca o un gradino, mani a terra un po\' più larghe delle spalle.', 'Corpo dritto dalla testa ai talloni.', 'Scendi con il petto verso terra, gomiti a circa 45°.', 'Spingi fino a braccia tese.'], e: ['Lasciar cadere il bacino.', 'Scendere solo a metà.'], t: 'Più i piedi sono alti, più lavorano la parte alta del petto e le spalle.' },
  trazioni_assistite_elastico: { s: ['Aggancia un elastico robusto alla sbarra e appoggiaci un ginocchio o un piede.', 'Afferra la sbarra con le mani poco più larghe delle spalle, braccia tese.', 'Tira il petto verso la sbarra portando i gomiti verso i fianchi.', 'Scendi lento fino a braccia tese.'], e: ['Dondolare.', 'Fermarsi a metà discesa.'], t: 'Quando fai 3 serie da 12 passa a un elastico più leggero.' },
  trazioni_presa_inversa: { s: ['Afferra la sbarra con i palmi verso di te, mani alla larghezza delle spalle.', 'Parti da braccia tese, spalle basse.', 'Tira fino a portare il mento sopra la sbarra, gomiti vicini al busto.', 'Scendi lento fino a braccia tese.'], e: ['Slanciarsi con le gambe.', 'Scendere solo a metà.'], t: 'Con i palmi verso di te aiutano di più i bicipiti: di solito è la prima trazione che si riesce a fare.' },
  trazioni_zavorrate: { s: ['Aggancia un disco alla cintura per zavorra o tieni un manubrio tra i piedi.', 'Afferra la sbarra poco più larga delle spalle, braccia tese.', 'Tira il petto verso la sbarra portando i gomiti verso i fianchi.', 'Scendi lento fino a braccia tese.'], e: ['Usare troppo peso e accorciare il movimento.', 'Dondolare.'], t: 'Aggiungi peso solo quando fai almeno 3 serie da 10 trazioni pulite.' },
  rematore_inverso: { s: ['Sotto un bilanciere su un rack (o il bordo di un tavolo molto robusto), afferralo con le mani poco più larghe delle spalle.', 'Corpo dritto, talloni a terra, braccia tese.', 'Tira il petto verso la sbarra stringendo le scapole.', 'Scendi lento fino a braccia tese.'], e: ['Bacino che cade.', 'Tirare con il collo in avanti.'], t: 'Con le ginocchia piegate è più facile, con le gambe tese più difficile.' },
  plank_laterale: { s: ['Sdraiati su un fianco, gomito sotto la spalla, gambe una sopra l\'altra.', 'Solleva il bacino finché il corpo è dritto dalla testa ai piedi.', 'Tieni respirando con calma.', 'Cambia lato a metà del tempo o fai un lato per serie.'], e: ['Bacino che scende o va indietro.', 'Spalla alzata verso l\'orecchio.'], t: 'Più facile con le ginocchia piegate a terra: parti da lì se serve.' }
};
/* esercizi principali: istruzioni più complete (preparazione, movimento, respirazione, ritorno) */
Object.assign(HAND_TXT, {
  squat_bil: { s: ['Bilanciere sulla parte alta della schiena (sui trapezi), mani poco più larghe delle spalle, gomiti sotto il bilanciere.', 'Piedi alla larghezza delle spalle, punte un po\' in fuori. Inspira e contrai l\'addome come prima di un colpo.', 'Scendi portando il bacino indietro e in basso, ginocchia nella direzione delle punte, almeno fino a cosce parallele.', 'Risali spingendo con tutto il piede ed espira in alto.'], e: ['Ginocchia che cadono verso l\'interno.', 'Talloni che si staccano.', 'Schiena che si curva in basso.'], t: 'Le ginocchia possono superare le punte: conta che il piede resti tutto a terra e la schiena dritta.' },
  stacco_bil: { s: ['Piedi alla larghezza delle anche, bilanciere sopra la metà del piede, vicino agli stinchi.', 'Piegati e afferralo appena fuori dalle gambe; schiena dritta, petto alto, spalle sopra il bilanciere.', 'Inspira, contrai l\'addome e spingi il pavimento con i piedi: il bilanciere sale strisciando lungo le gambe.', 'In alto stendi anche e ginocchia insieme senza inarcarti, poi riscendi portando prima il bacino indietro.'], e: ['Schiena curva.', 'Bilanciere che si allontana dalle gambe.', 'Strappare il peso con le braccia.'], t: 'Il carico lo muovono gambe e glutei: le braccia sono solo ganci.' },
  panca_piana_bil: { s: ['Sdraiati con gli occhi sotto il bilanciere, piedi ben piantati a terra.', 'Stringi le scapole e abbassale, presa poco più larga delle spalle, polsi dritti.', 'Inspira e scendi controllato fino a sfiorare il petto all\'altezza dei capezzoli, gomiti a circa 45–70° dal busto.', 'Spingi in alto espirando, fino a braccia tese, senza staccare i glutei.'], e: ['Gomiti aperti a 90°.', 'Bilanciere che rimbalza sul petto.', 'Glutei che si staccano dalla panca.'], t: 'Con carichi impegnativi fatti assistere da qualcuno o usa i fermi di sicurezza.' },
  rematore_bil: { s: ['In piedi con il bilanciere, presa poco più larga delle spalle.', 'Piega le anche fino a busto inclinato di circa 45°, ginocchia morbide, schiena dritta.', 'Tira il bilanciere verso l\'ombelico portando i gomiti indietro ed espira.', 'Stringi le scapole un attimo e scendi lento fino a braccia tese.'], e: ['Raddrizzare il busto per tirare.', 'Schiena curva.'], t: 'Se la zona lombare si stanca prima del dorso, passa al rematore con appoggio.' },
  military_bil: { s: ['In piedi, bilanciere appoggiato davanti sulle clavicole, presa poco più larga delle spalle.', 'Stringi glutei e addome: il busto non si inarca.', 'Spingi il bilanciere in verticale ed espira; quando passa la fronte porta la testa un po\' avanti.', 'Riscendi controllato fino alle clavicole.'], e: ['Inarcare la schiena.', 'Spingere il bilanciere in avanti invece che in alto.'], t: 'Se hai fastidio alle spalle usa i manubri: lasciano più libertà ai polsi.' },
  stacco_rumeno_bil: { s: ['In piedi con il bilanciere davanti alle cosce, presa alla larghezza delle spalle.', 'Ginocchia morbide e ferme: porta il bacino indietro facendo scivolare il bilanciere lungo le gambe.', 'Scendi finché senti tirare dietro le cosce, schiena dritta (di solito poco sotto le ginocchia).', 'Risali spingendo il bacino in avanti e stringendo i glutei; espira in alto.'], e: ['Curvare la schiena per scendere di più.', 'Piegare troppo le ginocchia (diventa uno squat).'], t: 'Quanto scendi lo decide la tua flessibilità, non il pavimento.' },
  stacco_rumeno_man: { s: ['In piedi, manubri davanti alle cosce, piedi alla larghezza delle anche.', 'Ginocchia morbide: porta il bacino indietro facendo scendere i manubri vicino alle gambe.', 'Fermati quando senti tirare dietro le cosce, schiena dritta.', 'Risali spingendo il bacino avanti e stringendo i glutei.'], e: ['Schiena curva.', 'Manubri lontani dalle gambe.'], t: 'La versione migliore per imparare il movimento dello stacco.' },
  hip_thrust_bil: { s: ['Siediti a terra con la parte alta della schiena contro una panca, bilanciere con imbottitura sul bacino.', 'Piedi a terra alla larghezza delle anche, abbastanza vicini da avere le ginocchia a 90° in alto.', 'Spingi con i talloni e solleva il bacino fino a busto e cosce in linea, mento verso il petto.', 'Stringi i glutei un secondo, poi scendi controllato.'], e: ['Inarcare la schiena in alto.', 'Piedi troppo lontani: lavorano i femorali.'], t: 'Uno dei migliori esercizi per i glutei, e non carica la schiena come lo stacco.' },
  hip_thrust_man: { s: ['Parte alta della schiena contro una panca, manubrio appoggiato sul bacino e tenuto con le mani.', 'Piedi a terra alla larghezza delle anche.', 'Spingi con i talloni e solleva il bacino fino a busto e cosce in linea.', 'Stringi i glutei un secondo e scendi lento.'], e: ['Spingere inarcando la schiena.'], t: 'Quando il manubrio diventa leggero, passa al bilanciere.' },
  leg_press: { s: ['Schiena e bacino ben appoggiati, piedi alla larghezza delle spalle a metà pedana.', 'Sblocca la sicura e scendi piegando le ginocchia verso il petto, fin dove il bacino resta appoggiato.', 'Spingi con tutto il piede ed espira.', 'Fermati prima di bloccare le ginocchia, poi riscendi.'], e: ['Bacino che si stacca in basso.', 'Ginocchia bloccate in alto.', 'Ginocchia che cadono verso l\'interno.'], t: 'Piedi alti: più glutei e femorali. Piedi bassi: più quadricipiti.' },
  goblet_squat: { s: ['Tieni un manubrio verticale contro il petto, mani sotto la testa del manubrio.', 'Piedi un po\' più larghi delle spalle, punte leggermente in fuori.', 'Scendi tra le gambe con il busto dritto, gomiti che passano dentro le ginocchia.', 'Risali spingendo con tutto il piede ed espira.'], e: ['Talloni che si staccano.', 'Schiena che si curva.'], t: 'Il modo migliore per imparare lo squat: il peso davanti aiuta a stare dritti.' },
  squat_corpo: { s: ['In piedi, piedi alla larghezza delle spalle, braccia avanti per l\'equilibrio.', 'Porta il bacino indietro e in basso come per sederti, schiena dritta.', 'Scendi fin dove riesci tenendo i talloni a terra.', 'Risali deciso spingendo con tutto il piede.'], e: ['Ginocchia che cadono verso l\'interno.', 'Talloni che si alzano.'], t: 'Se fai fatica a scendere, usa una sedia dietro di te come riferimento.' },
  lat_machine: { s: ['Regola il rullo per bloccare bene le cosce; afferra la barra poco più larga delle spalle.', 'Petto alto, busto appena inclinato indietro.', 'Tira la barra verso la parte alta del petto portando i gomiti verso i fianchi ed espira.', 'Risali lento fino a braccia tese, lasciando salire le spalle solo alla fine.'], e: ['Tirare dietro la nuca.', 'Dondolare con il busto.'], t: 'Pensa a portare i gomiti in tasca, non a tirare con le mani.' },
  pulley: { s: ['Seduto, piedi sulle pedane, ginocchia morbide, schiena dritta.', 'Afferra il triangolo a braccia tese.', 'Tira verso l\'ombelico portando i gomiti indietro e stringendo le scapole.', 'Torna allungando le braccia in avanti, senza curvare la schiena.'], e: ['Oscillare avanti e indietro con il busto.', 'Spalle che salgono verso le orecchie.'], t: 'Il busto resta quasi fermo: lavora il dorso, non la schiena bassa.' },
  rematore_man: { s: ['Mano e ginocchio dello stesso lato su una panca, schiena parallela al pavimento.', 'Manubrio nell\'altra mano, braccio teso.', 'Tira il manubrio verso l\'anca portando il gomito indietro e in alto.', 'Scendi lento allungando bene il dorso.'], e: ['Ruotare il busto per tirare di più.', 'Tirare verso la spalla invece che verso l\'anca.'], t: 'Un braccio alla volta: utile per correggere differenze tra i due lati.' },
  row_machine: { s: ['Regola il sedile: maniglie all\'altezza del petto, petto contro il supporto.', 'Afferra le maniglie a braccia tese.', 'Tira portando i gomiti indietro e stringendo le scapole.', 'Torna lento fino a braccia tese.'], e: ['Staccare il petto dal supporto.', 'Movimento troppo corto.'], t: 'Il supporto protegge la schiena: ottimo se hai la zona lombare delicata.' },
  chest_press: { s: ['Regola il sedile: maniglie all\'altezza del petto.', 'Schiena appoggiata, scapole strette e basse.', 'Spingi in avanti fino a braccia quasi tese ed espira.', 'Torna lento senza far toccare i pesi.'], e: ['Sedile troppo alto o troppo basso.', 'Staccare la schiena dallo schienale.'], t: 'Sicura anche da soli: puoi spingere vicino al cedimento senza rischi.' },
  panca_piana_man: { s: ['Siediti con i manubri sulle cosce e sdraiati portandoli al petto.', 'Scapole strette, polsi dritti sopra i gomiti.', 'Scendi fino a sentire allungare il petto, gomiti a circa 45° dal busto.', 'Spingi in alto ed espira, avvicinando i manubri senza farli sbattere.'], e: ['Scendere troppo poco.', 'Polsi piegati all\'indietro.'], t: 'Più escursione del bilanciere e meno stress per le spalle.' },
  panca_inclinata_man: { s: ['Schienale a 30–45°, manubri all\'altezza del petto alto.', 'Scapole strette, gomiti a circa 45° dal busto.', 'Spingi in alto ed espira, avvicinando i manubri.', 'Scendi lento e controllato.'], e: ['Schienale troppo verticale (lavorano le spalle).', 'Perdere il controllo in discesa.'], t: 'Il primo esercizio da scegliere per sviluppare il petto alto.' },
  lento_man: { s: ['Seduto con lo schienale verticale, manubri all\'altezza delle orecchie, palmi in avanti.', 'Schiena appoggiata, addome contratto.', 'Spingi in alto avvicinando i manubri ed espira.', 'Riscendi fino all\'altezza del mento.'], e: ['Inarcare la schiena.', 'Scendere troppo poco.'], t: 'I manubri lasciano più libertà alle spalle rispetto al bilanciere.' },
  shoulder_press_mac: { s: ['Regola il sedile: maniglie all\'altezza delle spalle.', 'Schiena appoggiata, addome contratto.', 'Spingi in alto fino a braccia quasi tese ed espira.', 'Torna lento fino all\'altezza delle spalle.'], e: ['Staccare la schiena.', 'Bloccare di scatto i gomiti.'], t: 'Ottima per spingere pesante in sicurezza.' },
  alzate_laterali: { s: ['In piedi, manubri ai fianchi, gomiti leggermente piegati.', 'Busto appena inclinato in avanti, spalle basse.', 'Alza le braccia di lato fino all\'altezza delle spalle, mignolo appena più alto del pollice.', 'Scendi lento in 2–3 secondi.'], e: ['Usare lo slancio.', 'Alzare le spalle verso le orecchie.', 'Salire oltre l\'altezza delle spalle.'], t: 'Carichi leggeri e 12–20 ripetizioni: la spalla laterale cresce bene così.' },
  affondi_man: { s: ['In piedi, manubri ai fianchi.', 'Fai un passo lungo in avanti e scendi finché il ginocchio dietro sfiora terra.', 'Busto dritto, ginocchio davanti nella direzione della punta.', 'Spingi con il tallone davanti e torna in piedi; alterna le gambe.'], e: ['Passo troppo corto.', 'Ginocchio davanti che cade verso l\'interno.'], t: 'Se l\'equilibrio è incerto, fai l\'affondo indietro: è più stabile.' },
  bulgarian_man: { s: ['Manubri ai fianchi, collo del piede dietro appoggiato su una panca.', 'Piede davanti abbastanza avanti da scendere con il busto dritto.', 'Scendi in verticale finché la coscia davanti è circa parallela al pavimento.', 'Risali spingendo con il tallone davanti. Finisci la gamba e cambia.'], e: ['Piede davanti troppo vicino alla panca.', 'Ginocchio che cade verso l\'interno.'], t: 'Uno dei migliori esercizi per gambe e glutei, una gamba alla volta.' },
  step_up: { s: ['Manubri ai fianchi, davanti a una panca o a un gradino stabile alto circa al ginocchio.', 'Appoggia tutto il piede sopra.', 'Sali spingendo con la gamba sopra, senza spingerti con quella sotto.', 'Scendi controllato e ripeti. Finisci la gamba e cambia.'], e: ['Darsi la spinta con il piede a terra.', 'Ginocchio che cade verso l\'interno.'], t: 'Allena forza e equilibrio insieme: utile a ogni età, come salire le scale con le borse.' },
  leg_extension: { s: ['Regola lo schienale: ginocchio allineato al perno della macchina, rullo sopra le caviglie.', 'Afferra le maniglie ai lati.', 'Stendi le gambe fino in alto e stringi un attimo i quadricipiti.', 'Scendi lento senza far toccare i pesi.'], e: ['Slancio.', 'Sollevare il bacino dal sedile.'], t: 'Isola i quadricipiti: utile come complemento allo squat.' },
  leg_curl: { s: ['Pancia in giù, rullo appena sopra i talloni, ginocchia appena oltre il bordo.', 'Afferra le maniglie, bacino appoggiato.', 'Piega le gambe portando i talloni verso i glutei.', 'Scendi lento in 2–3 secondi.'], e: ['Sollevare il bacino.', 'Scendere di colpo.'], t: 'Controlla bene la discesa: è lì che i femorali lavorano tanto.' },
  leg_curl_seduto: { s: ['Seduto, ginocchia allineate al perno, rullo sotto i polpacci.', 'Blocca le cosce con il cuscino superiore.', 'Piega le gambe verso il basso fino in fondo.', 'Torna lento fino quasi a gambe tese.'], e: ['Staccare la schiena.', 'Movimento troppo corto.'], t: 'Da seduto il femorale lavora allungato: ottimo per la crescita.' },
  calf_piedi: { s: ['Spalle sotto i cuscini, avampiedi sul bordo della pedana.', 'Gambe tese ma non bloccate.', 'Sali sulle punte il più possibile e tieni un secondo.', 'Scendi lento fino a sentire allungare i polpacci.'], e: ['Rimbalzare in basso.', 'Piegare le ginocchia.'], t: 'Tutta l\'escursione, lenta: i polpacci rispondono meglio così.' },
  calf_seduto: { s: ['Seduto, ginocchia sotto il cuscino, avampiedi sul bordo.', 'Sblocca la sicura.', 'Sali sulle punte il più possibile.', 'Scendi lento allungando bene.'], e: ['Movimento troppo corto.'], t: 'A ginocchia piegate lavora soprattutto il soleo, il muscolo profondo del polpaccio.' },
  trazioni: { s: ['Afferra la sbarra con i palmi in avanti, mani poco più larghe delle spalle.', 'Parti a braccia tese, spalle basse, gambe ferme.', 'Tira fino a portare il mento sopra la sbarra, gomiti verso i fianchi; espira.', 'Scendi controllato fino a braccia tese.'], e: ['Dondolare o slanciarsi.', 'Fermarsi a metà discesa.'], t: 'Se non riesci ancora, segui la progressione: elastico, poi presa inversa, poi trazione completa.' },
  dip: { s: ['Braccia tese sulle parallele, spalle basse.', 'Busto leggermente inclinato in avanti.', 'Scendi piegando i gomiti fino a circa 90°.', 'Spingi in alto fino a braccia tese ed espira.'], e: ['Scendere troppo in basso con dolore alle spalle.', 'Spalle che salgono verso le orecchie.'], t: 'Busto dritto: più tricipiti. Busto inclinato: più petto.' },
  dip_machine: { s: ['Seduto, schiena appoggiata, maniglie ai lati del busto.', 'Gomiti vicini al corpo.', 'Spingi in basso fino a braccia tese ed espira.', 'Risali controllato fino a gomiti a 90°.'], e: ['Aprire i gomiti.', 'Staccare la schiena.'], t: 'Il primo gradino verso i dip alle parallele.' },
  dip_sedia: { s: ['Mani sul bordo di una sedia stabile (contro il muro), dita in avanti.', 'Gambe piegate davanti a te: più sono tese, più è difficile.', 'Scendi piegando i gomiti fino a circa 90°, schiena vicina alla sedia.', 'Spingi fino a braccia tese.'], e: ['Gomiti che si aprono.', 'Scendere troppo con dolore alle spalle.'], t: 'Se senti fastidio davanti alla spalla, scendi di meno.' },
  piegamenti: { s: ['Mani poco più larghe delle spalle, corpo dritto dalla testa ai talloni.', 'Addome e glutei contratti.', 'Scendi con il petto fino quasi a terra, gomiti a circa 45° dal busto.', 'Spingi fino a braccia tese ed espira.'], e: ['Bacino che cade o sale.', 'Gomiti aperti a 90°.'], t: 'Se sono difficili segui la progressione: al muro, su un rialzo, sulle ginocchia.' },
  piegamenti_ginocchia: { s: ['Ginocchia a terra, mani poco più larghe delle spalle.', 'Corpo dritto dalle ginocchia alla testa.', 'Scendi con il petto verso terra, gomiti a circa 45°.', 'Spingi fino a braccia tese.'], e: ['Bacino indietro (sedere in alto).', 'Testa che cade in avanti.'], t: 'Quando fai 3 serie da 12, passa ai piegamenti completi.' },
  piegamenti_scrivania: { s: ['Mani sul bordo di una scrivania stabile o contro il muro, alla larghezza delle spalle.', 'Fai un passo indietro: corpo dritto e inclinato.', 'Piega i gomiti portando il petto verso il bordo.', 'Spingi fino a braccia tese.'], e: ['Bacino che sporge indietro.', 'Spalle che salgono.'], t: 'Il primo gradino dei piegamenti: perfetto per iniziare.' },
  ponte_glutei: { s: ['Sdraiati sulla schiena, ginocchia piegate, piedi a terra alla larghezza delle anche.', 'Braccia lungo i fianchi.', 'Spingi con i talloni e solleva il bacino fino a formare una linea spalle-ginocchia.', 'Stringi i glutei un secondo e scendi lento.'], e: ['Inarcare la schiena in alto.', 'Spingere con le punte.'], t: 'Quando diventa facile, passa al ponte a una gamba.' },
  affondi_corpo: { s: ['In piedi, mani sui fianchi.', 'Fai un passo lungo in avanti e scendi finché il ginocchio dietro sfiora terra.', 'Busto dritto, ginocchio davanti nella direzione della punta.', 'Spingi con il piede davanti e torna su; alterna le gambe.'], e: ['Passo troppo corto.', 'Ginocchio che cade verso l\'interno.'], t: 'Tieniti a un appoggio se l\'equilibrio è incerto.' },
  alzati_siediti: { s: ['Seduto sul bordo di una sedia stabile, piedi alla larghezza delle anche.', 'Braccia incrociate sul petto o in avanti.', 'Alzati in piedi senza aiutarti con le mani, spingendo con i talloni.', 'Torna a sederti piano, sfiorando appena la sedia.'], e: ['Lasciarsi cadere sulla sedia.', 'Ginocchia che cadono verso l\'interno.'], t: 'Il primo gradino dello squat: rinforza le gambe per le azioni di ogni giorno.' },
  curl_bil: { s: ['In piedi, presa con i palmi in avanti alla larghezza delle spalle.', 'Gomiti fermi ai fianchi, busto fermo.', 'Piega le braccia fino in alto ed espira.', 'Scendi lento fino a braccia tese.'], e: ['Slancio con la schiena.', 'Gomiti che vanno avanti.'], t: 'Con il bilanciere EZ i polsi stanno più comodi.' },
  pushdown: { s: ['Carrucola alta con barra o corda, gomiti stretti ai fianchi.', 'Busto appena inclinato in avanti.', 'Spingi in basso fino a braccia tese ed espira.', 'Risali fino a gomiti a 90°, senza spostarli.'], e: ['Gomiti che si alzano.', 'Usare il peso del corpo.'], t: 'Con la corda apri le mani in fondo per contrarre di più.' },
  croci_cavi: { s: ['Carrucole in alto, una maniglia per mano, un passo avanti.', 'Busto leggermente inclinato, gomiti appena piegati e fermi.', 'Porta le mani insieme davanti al bacino con un movimento ad arco.', 'Torna controllato fino a sentire allungare il petto.'], e: ['Piegare e stendere i gomiti (diventa una spinta).', 'Andare troppo indietro con le braccia.'], t: 'Carrucole basse: lavora di più il petto alto.' },
  face_pull: { s: ['Corda alla carrucola all\'altezza del viso, una mano per capo.', 'Un passo indietro, braccia tese.', 'Tira verso la fronte aprendo le mani ai lati, gomiti alti.', 'Stringi le scapole un secondo e torna lento.'], e: ['Gomiti bassi.', 'Tirare con il peso del corpo.'], t: 'Ottimo per la salute delle spalle e la postura: carichi leggeri.' },
  plank: { s: ['Avambracci a terra, gomiti sotto le spalle.', 'Piedi uniti o poco divaricati, corpo dritto dalla testa ai talloni.', 'Contrai addome e glutei come se dovessi ricevere un colpo.', 'Tieni respirando con calma.'], e: ['Bacino che cede.', 'Glutei troppo alti.'], t: 'Meglio 30 secondi perfetti che 2 minuti fatti male. Sulle ginocchia è più facile.' },
  leg_raise: { s: ['Sdraiato sulla schiena, mani sotto i glutei o lungo i fianchi.', 'Schiaccia la zona lombare a terra.', 'Alza le gambe tese (o piegate, più facile) fino a 90°.', 'Scendi lento senza toccare terra e senza inarcare la schiena.'], e: ['Inarcare la zona lombare.', 'Slancio.'], t: 'Con le ginocchia piegate è più facile e protegge la schiena.' },
  swing_man: { s: ['Piedi un po\' più larghi delle spalle, manubrio tenuto con due mani davanti.', 'Piega le anche e lascia passare il manubrio tra le gambe, schiena dritta.', 'Spingi con forza il bacino in avanti: il manubrio sale fino all\'altezza del petto.', 'Lascialo ridiscendere tra le gambe e ripeti con ritmo.'], e: ['Alzare il peso con le braccia.', 'Schiena curva.', 'Accosciarsi invece di piegare le anche.'], t: 'La forza viene dai glutei: le braccia sono solo corde.' }
});
Object.keys(HAND_TXT).forEach(id => { const e = EX[id], h = HAND_TXT[id]; if (!e) return; e.steps = h.s; e.err = h.e; e.tip = h.t; e.hand = true; });

/* ---------- home più pulita: in alto solo le 2 cose più importanti di oggi ---------- */
function homePriority() {
  const L = [], add = h => { if (h) L.push(h); };
  add(painCard()); add(fatigueCard()); add(pathInviteCard()); add(checkpointCard());
  add(missedCard()); add(stepCard()); add(recapCard());
  if (pathOn() && !(S.ftests || []).length) add(ftestCard());
  add(proteinNudge());
  return L;
}
ACT.homeMore = () => { UI.homeMore = !UI.homeMore; render(); };
UI.stack = [{ v: S.active ? 'workout' : 'home' }];
render(true);
