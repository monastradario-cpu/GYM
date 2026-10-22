/* GYM — consigli in più del trainer:
   settimana leggera suggerita dai dati, sedute saltate, test di forma, riepilogo della settimana, foto di confronto,
   proteine per pasto, lista della spesa, riscaldamento specifico, segnali d'allarme sui dolori. */
'use strict';

const DAY = 864e5;
const isGymTpl = t => t && t.kind !== 'circuito' && !t.quick;

/* ---------- 1. settimana leggera suggerita dai dati ----------
   Segnali: sonno o energia bassi nei check-in, dolori ripetuti, forza in calo sui principali.
   Uno scarico di circa una settimana quando la fatica si accumula: consenso Bell 2023 (doi:10.1186/s40798-023-00633-0). */
function mainLifts() {
  const s = new Set();
  S.templates.filter(isGymTpl).forEach(t => t.items.forEach(i => { if (i.role === 'main') s.add(i.ex); }));
  return [...s];
}
function fatigueSignals() {
  if (deloadActive() || S.active) return null;
  if (S.lastDeload && Date.now() - S.lastDeload < 21 * DAY) return null;
  if (S.fatigueSkip && Date.now() - S.fatigueSkip < 7 * DAY) return null;
  const ck = (S.checkins || []).filter(c => c.d > Date.now() - 7 * DAY);
  const low = ck.filter(c => c.sleep === 0 || c.energy === 0).length, pains = ck.filter(c => (c.pain || []).length).length;
  let drop = 0, checked = 0;
  mainLifts().forEach(id => {
    const tr = exerciseTrend(id); if (tr.length < 4) return;
    checked++;
    const last2 = Math.max(tr[0].e1, tr[1].e1), best = Math.max(...tr.slice(2, 8).map(x => x.e1));
    if (best && last2 < best * 0.95) drop++;
  });
  const why = [];
  if (low >= 3) why.push('Sonno o energia bassi in ' + low + ' check-in degli ultimi 7 giorni.');
  if (pains >= 2) why.push('Dolori segnalati in ' + pains + ' sedute.');
  if (checked && drop >= Math.max(1, Math.ceil(checked / 2))) why.push('Forza in calo sugli esercizi principali nelle ultime sedute.');
  return why.length >= 2 || low >= 4 ? why : null;
}
function fatigueCard() {
  const why = fatigueSignals(); if (!why) return '';
  return '<div class="card warn-card"><div class="eyebrow">' + ic('info', 'inline') + 'Il trainer ti consiglia</div><p><b>Una settimana più leggera</b></p><ul class="tips small">' + why.map(w => '<li>' + esc(w) + '</li>').join('') + '</ul>' +
    '<p class="small muted">Per 7 giorni metà delle serie con gli stessi carichi: la fatica scende e poi riparti più forte.</p>' +
    '<div class="row gap"><button class="btn grow" data-act="deloadOn">Attiva la settimana leggera</button><button class="btn ghost" data-act="fatigueSkip">Non ora</button></div></div>';
}

/* ---------- 2. seduta saltata: recuperala oggi o in versione breve ---------- */
function missedSession() {
  if (S.active) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (S.history.some(h => h.start >= today.getTime())) return null;
  const tToday = todayTemplate(); if (isGymTpl(tToday)) return null;
  for (let back = 1; back <= 2; back++) {
    const d = new Date(today.getTime() - back * DAY);
    const t = S.templates.find(x => isGymTpl(x) && (x.days || []).includes(d.getDay()));
    if (!t) continue;
    if (S.history.some(h => h.start >= d.getTime() && !h.quick)) return null;
    if (S.path && S.path.start && d.getTime() < new Date(S.path.start).setHours(0, 0, 0, 0)) return null; // prima che iniziasse il percorso
    const key = dayKey(d) + ':' + t.id;
    if ((S.missedSkip || []).includes(key)) return null;
    return { t, d, key, back };
  }
  return null;
}
/* versione breve: principali e complementari, meno serie (anche poche serie danno buona parte dei risultati: Pelland 2025) */
function shortVersion(t, minutes) {
  let items = t.items.map(i => Object.assign({}, i, { sets: Math.min(i.sets || 3, i.role === 'main' ? 3 : 2) }));
  while (items.length > 3 && estMinutes(items) > minutes) {
    let k = -1; for (let i = items.length - 1; i >= 0; i--) if (items[i].role !== 'main') { k = i; break; }
    if (k < 0) k = items.length - 1;
    items.splice(k, 1);
  }
  return { id: uid(), kind: 'scheda', name: t.name + ' · ' + minutes + ' min', items, days: [] };
}
function missedCard() {
  const m = missedSession(); if (!m) return '';
  const s = shortVersion(m.t, 30);
  return '<div class="card"><div class="eyebrow">' + ic('calendar', 'inline') + (m.back === 1 ? 'Ieri' : 'L\'altro ieri') + ' hai saltato una seduta</div><p><b>' + esc(m.t.name) + '</b><br><small class="muted">Nessun problema: recuperala oggi, anche in versione breve.</small></p>' +
    '<div class="row gap wrap"><button class="btn grow" data-act="startTemplate" data-id="' + m.t.id + '">' + ic('play') + 'Falla oggi</button>' +
    '<button class="btn ghost grow" data-act="missedShort">Versione da ' + estMinutes(s.items) + ' min</button></div>' +
    '<button class="link-inline small" data-act="missedSkip" data-k="' + m.key + '">Lascia stare, riprendo dalla prossima</button></div>';
}

/* ---------- 3. test di forma ogni 4 settimane ----------
   Piegamenti in 1 minuto, plank massimo, alzate dalla sedia in 30 s (30-second chair stand, Jones 1999, doi:10.1080/02701367.1999.10608028). */
const FTESTS = {
  push: { n: 'Piegamenti in 1 minuto', u: 'ripetizioni', how: 'Corpo dritto dalla testa ai talloni, petto fino a un pugno da terra. Se serve, sulle ginocchia: usa sempre la stessa versione.', skip: ['polsi', 'spalle', 'gomiti'], ex: 'piegamenti' },
  plank: { n: 'Plank il più a lungo possibile', u: 'secondi', how: 'Sugli avambracci, corpo in linea. Ti fermi quando il bacino scende o sale.', skip: ['spalle'], ex: 'plank' },
  sts: { n: 'Alzati e siediti in 30 secondi', u: 'volte', how: 'Sedia senza braccioli contro il muro, braccia incrociate sul petto. Conta quante volte ti alzi in piedi del tutto in 30 secondi.', skip: ['ginocchia', 'anche'], ex: 'alzati_siediti' }
};
const ftestOk = k => !(S.profile.pain || []).some(z => FTESTS[k].skip.includes(z));
function ftestLast() { const T = S.ftests || []; return { last: T[T.length - 1] || null, first: T[0] || null }; }
VIEWS.ftest = () => {
  const { last, first } = ftestLast(), v = UI.ft || (UI.ft = {});
  return header('Test di forma', { back: true, noGear: true, sub: '5 minuti, ogni 4 settimane' }) + '<div class="pad">' +
    '<p class="small muted">Tre prove semplici danno numeri chiari: vedi i miglioramenti anche senza pesi. Riposa 2–3 minuti tra una prova e l\'altra.</p>' +
    Object.keys(FTESTS).filter(ftestOk).map(k => {
      const t = FTESTS[k], pv = last && last[k] != null ? last[k] : null, f0 = first && first[k] != null && first !== last ? first[k] : null;
      return '<div class="card"><h3>' + t.n + '</h3><p class="small muted">' + esc(t.how) + '</p>' +
        (pv != null ? '<p class="small">Ultima volta: <b>' + pv + ' ' + t.u + '</b>' + (f0 != null ? ' · all\'inizio: ' + f0 : '') + '</p>' : '') +
        field('Risultato (' + t.u + ')', numIn(v[k] || '', 'data-in="ftest" data-k="' + k + '"', pv != null ? String(pv) : '')) +
        '<button class="link-inline small" data-act="exInfo" data-id="' + t.ex + '">Come si esegue</button></div>';
    }).join('') +
    '<button class="btn wide" data-act="ftestSave">' + ic('check') + 'Salva i risultati</button>' +
    ((S.ftests || []).length ? '<h3 class="sec">Storico</h3><div class="card">' + S.ftests.slice().reverse().map(r => '<div class="list-item flat"><div><b>' + fmtDateLong(r.d) + '</b><small>' +
      Object.keys(FTESTS).filter(k => r[k] != null).map(k => FTESTS[k].n.split(' ')[0] + ': ' + r[k]).join(' · ') + '</small></div></div>').join('') + '</div>' : '') + '</div>';
};
function ftestDue() {
  if (!pathOn()) return false;
  const { last } = ftestLast();
  return !last || Date.now() - last.d > 27 * DAY;
}
function ftestCard() {
  if (!ftestDue()) return '';
  const first = !(S.ftests || []).length;
  return '<button class="card" data-act="go" data-v="ftest"><div class="eyebrow">' + ic('chart', 'inline') + 'Test di forma</div><p><b>' + (first ? 'Fai i test di partenza' : 'Sono passate 4 settimane: rifai i test') + '</b><br><small class="muted">Piegamenti, plank e sedia: 5 minuti per misurare i progressi.</small></p></button>';
}
function ftestCompare() {
  const T = S.ftests || []; if (T.length < 2) return '';
  const a = T[T.length - 2], b = T[T.length - 1];
  return Object.keys(FTESTS).filter(k => a[k] != null && b[k] != null).map(k => {
    const d = b[k] - a[k];
    return FTESTS[k].n + ': ' + a[k] + ' → ' + b[k] + ' ' + FTESTS[k].u + (d > 0 ? ' (+' + d + ')' : d < 0 ? ' (' + d + ')' : ' (uguale)');
  }).join('<br>');
}

Object.assign(ACT, {
  fatigueSkip: () => { S.fatigueSkip = Date.now(); save(); render(); },
  missedShort: () => { const m = missedSession(); if (m) startWorkout(shortVersion(m.t, 30)); },
  missedSkip: d => { S.missedSkip = (S.missedSkip || []).concat([d.k]).slice(-30); save(); render(); },
  ftestSave: () => {
    const v = UI.ft || {}, r = { d: Date.now() };
    Object.keys(FTESTS).forEach(k => { if (num(v[k]) > 0) r[k] = num(v[k]); });
    if (Object.keys(r).length < 2) { toast('Inserisci almeno un risultato'); return; }
    S.ftests = (S.ftests || []).concat([r]); UI.ft = {}; save(true);
    const cmp = ftestCompare();
    back(); toast(cmp ? 'Salvato! Confronto con la volta scorsa nei traguardi.' : 'Salvato: è il tuo punto di partenza.');
  }
});

/* ---------- 4. riepilogo della settimana (domenica sera e lunedì) ---------- */
function weekRecap() {
  const now = new Date(), wd = now.getDay();
  const show = (wd === 0 && now.getHours() >= 17) || wd === 1;
  if (!show || !S.history.length) return null;
  const ws = wd === 1 ? startOfWeek(Date.now() - DAY).getTime() : startOfWeek(Date.now()).getTime();
  if (S.recapSeen === ws) return null;
  const s = weekStats(ws), planned = S.templates.filter(isGymTpl).reduce((a, t) => a + (t.days || []).length, 0) + S.templates.filter(t => t.zone === 'allenamento').reduce((a, t) => a + (t.days || []).length, 0);
  const top = Object.keys(s.musc).filter(m => MUSCLES[m]).sort((a, b) => s.musc[b] - s.musc[a]).slice(0, 3);
  const low = Object.keys(MUSCLES).filter(m => !MINOR_MUSCLES.includes(m) && (s.musc[m] || 0) < 10 && S.templates.some(t => isGymTpl(t) && t.items.some(i => (EX[i.ex] || {}).m === m)));
  const goals = typeof goalStatus === 'function' && pathOn() ? goalStatus() : [];
  return { ws, s, planned, top, low, goals, st: streaks() };
}
function recapCard() {
  const r = weekRecap(); if (!r) return '';
  const { s, planned } = r;
  return '<div class="card recap"><div class="eyebrow">' + ic('chart', 'inline') + 'La tua settimana</div>' +
    '<div class="stats3"><div><b>' + s.count + (planned ? '/' + planned : '') + '</b><small>allenamenti</small></div><div><b>' + fmtDur(s.time) + '</b><small>tempo</small></div><div><b>' + r.st.weekStreak + '</b><small>settimane di fila</small></div></div>' +
    (r.top.length ? '<p class="small">Muscoli più allenati: <b>' + r.top.map(m => MUSCLES[m]).join(', ') + '</b>.</p>' : '') +
    (r.low.length ? '<p class="small muted">Sotto le 10 serie: ' + r.low.slice(0, 4).map(m => MUSCLES[m]).join(', ') + '.</p>' : '') +
    r.goals.slice(0, 2).map(g => '<p class="small"><b>' + esc(g.t) + '</b><br><span class="muted">' + esc(g.eta) + '</span></p>').join('') +
    (planned && s.count >= planned ? '<p class="small good">Settimana completa: ottimo lavoro! 💪</p>' : planned && s.count ? '<p class="small">Ogni seduta conta: la costanza nel tempo pesa più della settimana perfetta.</p>' : '') +
    '<div class="row gap"><button class="btn ghost grow" data-act="recapOpen">Dettagli</button><button class="btn ghost" data-act="recapSeen" data-k="' + r.ws + '">Ok</button></div></div>';
}

/* ---------- 5. foto di confronto ---------- */
const _loadPhotos = loadPhotos;
loadPhotos = async function () {
  await _loadPhotos();
  const box = document.getElementById('photos'); if (!box) return;
  try {
    const list = await Photos.all(); // dalla più recente
    if (list.length) { S.lastPhoto = list[0].date; save(); }
    if (list.length < 2) return;
    const a = list[list.length - 1], b = list[0], kg = a.kg && b.kg ? Math.round((b.kg - a.kg) * 10) / 10 : null;
    const cmp = document.createElement('div'); cmp.className = 'card photo-cmp';
    cmp.innerHTML = '<h3>Prima e adesso</h3><div class="cmp-row"><figure><img src="' + a.data + '" alt=""><figcaption>' + fmtDate(a.date) + (a.kg ? ' · ' + fmtKg(a.kg) + ' kg' : '') + '</figcaption></figure>' +
      '<figure><img src="' + b.data + '" alt=""><figcaption>' + fmtDate(b.date) + (b.kg ? ' · ' + fmtKg(b.kg) + ' kg' : '') + '</figcaption></figure></div>' +
      '<p class="small muted">' + Math.round((b.date - a.date) / (7 * DAY)) + ' settimane' + (kg != null ? ' · ' + (kg > 0 ? '+' : '') + fmtKg(kg) + ' kg' : '') + '. Lo specchio cambia prima della bilancia: confronta forma di spalle, vita e gambe.</p>';
    box.parentNode.insertBefore(cmp, box);
  } catch (e) { }
};
function photoCard() {
  if (!pathOn()) return '';
  if (S.lastPhoto == null) { Photos.all().then(l => { S.lastPhoto = l.length ? l[0].date : 0; save(); }).catch(() => { }); return ''; }
  if (Date.now() - S.lastPhoto < 28 * DAY) return '';
  return '<button class="card" data-act="goPhotos"><div class="eyebrow">' + ic('camera', 'inline') + 'Foto di confronto</div><p><b>' + (S.lastPhoto ? 'È il momento della foto del mese' : 'Scatta la foto di partenza') + '</b><br><small class="muted">Stessa luce e stessa posizione: tra qualche settimana la metti accanto a quella di oggi. Resta solo sul telefono.</small></p></button>';
}

/* ---------- 6. proteine distribuite nei pasti ----------
   Circa 0,4 g per kg di peso a pasto in almeno 4 pasti (fino a 0,55 g/kg): Schoenfeld e Aragon 2018, doi:10.1186/s12970-018-0215-1 */
function proteinPerMeal() { const w = curWeight(); return w ? Math.round(w * 0.4) : 0; }
function proteinMealsCard(list) {
  const t = proteinPerMeal(); if (!t) return '';
  const rows = MEALS_DAY.map(([mk, mn]) => { const p = foodTotals(list.filter(x => x.meal === mk)).p; return { mn, p, ok: p >= t * 0.85 }; });
  const any = rows.some(r => r.p > 0);
  return '<div class="card"><h3>Proteine nei pasti</h3><p class="small muted">Per i muscoli conta anche come le distribuisci: circa <b>' + t + ' g a pasto</b> (0,4 g per kg) in almeno 4 pasti. Fonte: Schoenfeld e Aragon 2018.</p>' +
    rows.map(r => '<div class="mac"><div class="mac-h"><span>' + r.mn + (r.ok ? ' ✓' : '') + '</span><b>' + Math.round(r.p) + ' / ' + t + ' g</b></div><div class="mac-bar"><i class="pro" style="width:' + Math.min(100, 100 * r.p / t) + '%"></i></div></div>').join('') +
    (any ? '' : '<p class="small muted">Segna i pasti nel diario per vedere come sono distribuite.</p>') + '</div>';
}
const _foodView = VIEWS.food;
VIEWS.food = () => {
  let out = _foodView();
  if ((UI.nutTab || 'diario') === 'diario') { const k = UI.foodDay || todayKey(); out = out.replace('<div class="grid2 add-quick">', proteinMealsCard(foodDay(k)) + '<div class="grid2 add-quick">'); }
  return out;
};
/* promemoria in home: la sera, se in un pasto sono mancate le proteine */
function proteinNudge() {
  const t = proteinPerMeal(), h = new Date().getHours(); if (!t || h < 17 || h >= 22) return '';
  const list = foodDay(todayKey()); if (!list.length) return '';
  const cena = foodTotals(list.filter(x => x.meal === 'cena')).p, tot = foodTotals(list).p, n = nutritionTargets();
  if (cena >= t * 0.85 || (n.protein && tot >= n.protein)) return '';
  return '<button class="card meal-mini" data-act="goFood"><div class="eyebrow">' + ic('flame', 'inline') + 'Proteine a cena</div><p>Per stasera punta a circa <b>' + t + ' g di proteine</b>' + (n.protein ? ' (oggi sei a ' + Math.round(tot) + ' di ' + n.protein + ' g)' : '') + ': pesce, carne magra, uova, legumi o latticini.</p></button>';
}

/* ---------- 7. lista della spesa: aggiungi le tue voci ---------- */
const _nutShop = nutShop;
nutShop = function () {
  const mine = S.shopMine || [], chk = S.shopChecked || {};
  return _nutShop() + '<div class="card"><h3>Aggiunti da te</h3>' +
    mine.map((n, i) => '<div class="list-item"><button class="list-item btnlike shop flat' + (chk['+' + n] ? ' done' : '') + '" data-act="shopChk" data-n="+' + esc(n) + '"><div><b>' + esc(n) + '</b></div></button><button class="icon-btn sm" data-act="shopDel" data-n="' + i + '">' + ic('trash') + '</button></div>').join('') +
    '<div class="row gap"><input type="text" id="shop-in" placeholder="es. detersivo, caffè…" class="grow"><button class="btn sm" data-act="shopAdd">' + ic('plus', 'inline') + 'Aggiungi</button></div>' +
    (Object.keys(chk).some(k => chk[k]) ? '<button class="btn ghost wide" data-act="shopClear">Togli le spunte</button>' : '') + '</div>';
};

/* ---------- 8. riscaldamento specifico prima della scheda ---------- */
const WU_LOW = ['circonduzioni_anche', 'slanci_gamba', 'mob_worlds', 'circonduzioni_caviglie', 'squat_corpo'];
const WU_UP = ['circonduzioni_braccia', 'apri_petto_dinamico', 'passaggi_bastone', 'gatto_mucca', 'retrazione_scapole'];
function warmupFor(items) {
  const ms = items.map(i => (EX[i.ex] || {}).m), low = ms.filter(m => ['quadricipiti', 'femorali', 'glutei', 'polpacci', 'adduttori'].includes(m)).length, up = ms.length - low;
  const okW = id => EX[id] && (typeof mobOk !== 'function' || mobOk(id)) && (typeof okFor !== 'function' || !EX[id].pat || EX[id].pat === 'mobilita' || EX[id].pat === 'ufficio' || okFor(id));
  const L = WU_LOW.filter(okW), U = WU_UP.filter(okW);
  const pick = low && up ? L.slice(0, 3).concat(U.slice(0, 3)) : low ? L.slice(0, 4).concat(U.slice(0, 1)) : U.slice(0, 4).concat(L.slice(0, 1));
  return pick.map(ex => ({ ex, secs: 40 }));
}
function warmCard(a) {
  if (!a || a.circ || a.quick || a.wuDone || a.items.some(i => i.sets.some(s => s.done))) return '';
  const w = warmupFor(a.items); if (!w.length) return '';
  return '<div class="card wu-card"><div class="eyebrow">' + ic('flame', 'inline') + 'Riscaldamento specifico · ' + Math.round(w.length * 45 / 60) + ' min</div>' +
    '<div class="ex-preview">' + w.map(x => '<span>' + esc(EX[x.ex].n) + '</span>').join('') + '</div>' +
    '<p class="small muted">Scelto per i muscoli di oggi. Poi 1–2 serie leggere del primo esercizio.</p>' +
    '<div class="row gap"><button class="btn grow" data-act="wuStart">' + ic('play') + 'Inizia</button><button class="btn ghost" data-act="wuSkip">Salta</button></div></div>';
}
function wuSheet() {
  const W = UI.wu; if (!W) return '';
  const it = W.list[W.i]; if (!it) return '<div class="center"><div class="big-ic">🔥</div><h3>Riscaldamento fatto!</h3><p class="small muted">Ora 1–2 serie leggere del primo esercizio e si parte.</p><button class="btn wide" data-act="wuEnd">Vai all\'allenamento</button></div>';
  const e = EX[it.ex], left = Math.max(0, Math.ceil((W.until - Date.now()) / 1000));
  return '<div class="qk-phase">RISCALDAMENTO <span>' + (W.i + 1) + '/' + W.list.length + '</span></div><h2 class="qk-name">' + esc(e.n) + '</h2>' +
    '<div class="qk-clock" id="wu-clock">' + fmtClock(left) + '</div>' + (ekImgs(it.ex) ? ekPlayer(it.ex, true) : '') +
    '<p class="small muted qk-how">' + esc(e.steps[1] || e.steps[0]) + '</p>' +
    '<div class="row gap"><button class="btn ghost grow" data-act="wuNext">Salta ⏭</button><button class="btn ghost" data-act="wuEnd">Chiudi</button></div>';
}
setInterval(() => {
  const W = UI.wu; if (!W || !W.list[W.i]) return;
  const left = (W.until - Date.now()) / 1000, el = document.getElementById('wu-clock');
  if (el) el.textContent = fmtClock(Math.max(0, left));
  if (left <= 0) { Native.vibrate(200); ACT.wuNext(); }
}, 250);
const _woView = VIEWS.workout;
VIEWS.workout = () => {
  const out = _woView(), wc = warmCard(S.active);
  return wc && out.includes('<div class="wo-moderow">') ? out.replace('<div class="wo-moderow">', wc + '<div class="wo-moderow">') : out;
};

/* ---------- 9. segnali d'allarme: stesso dolore in 3 check-in di fila ---------- */
function painAlarm() {
  const C = (S.checkins || []).slice(-3); if (C.length < 3) return [];
  return Object.keys(PAIN_ZONES).filter(z => C.every(c => (c.pain || []).includes(z)));
}
function painAlarmApply() {
  const zs = painAlarm(), p = S.profile; if (!zs.length) return;
  const add = zs.filter(z => !(p.pain || []).includes(z)); if (!add.length) return;
  p.pain = (p.pain || []).concat(add); S.painAuto = (S.painAuto || []).concat(add);
  if (pathOn()) regenPath();
  save(true);
}
function painCard() {
  const auto = (S.painAuto || []).filter(z => (S.profile.pain || []).includes(z)); if (!auto.length) return '';
  return '<div class="card warn-card"><div class="eyebrow">' + ic('info', 'inline') + 'Attenzione ai dolori</div><p><b>' + auto.map(z => PAIN_ZONES[z]).join(', ') + ': dolore in 3 sedute di fila</b></p>' +
    '<p class="small">Un dolore che torna ogni volta va controllato: senti il medico o un fisioterapista. Se è forte, compare a riposo, di notte o con gonfiore, formicolio o perdita di forza, fallo prima di riprendere.</p>' +
    '<p class="small muted">Intanto ho tolto dalle schede gli esercizi che caricano la zona.</p>' +
    '<button class="btn ghost wide" data-act="painOk">Il dolore è passato: rimetti gli esercizi</button></div>';
}

Object.assign(ACT, {
  recapOpen: () => { UI.prog = UI.prog || {}; UI.prog.tab = 'settimana'; UI.prog.week = weekRecap() ? weekRecap().ws : undefined; go('progress'); },
  recapSeen: d => { S.recapSeen = num(d.k); save(); render(); },
  goPhotos: () => { UI.prog = UI.prog || {}; UI.prog.tab = 'foto'; go('progress'); setTimeout(loadPhotos, 50); },
  shopAdd: () => { const el = document.getElementById('shop-in'), v = el && el.value.trim(); if (!v) return; S.shopMine = (S.shopMine || []).concat([v]); save(); render(); },
  shopDel: d => { S.shopMine.splice(num(d.n), 1); save(); render(); },
  shopClear: () => { S.shopChecked = {}; save(); render(); },
  wuStart: () => { const a = S.active; UI.wu = { list: warmupFor(a.items), i: 0, until: Date.now() + 40000 }; openSheet(wuSheet); },
  wuNext: () => { const W = UI.wu; if (!W) return; W.i++; W.until = Date.now() + 40000; const b = $('#sheet-body'); if (b) b.innerHTML = wuSheet(); },
  wuEnd: () => { UI.wu = null; if (S.active) { S.active.wuDone = true; save(); } closeSheet(); render(); },
  wuSkip: () => { if (S.active) { S.active.wuDone = true; save(); } render(); },
  painOk: () => { const p = S.profile, auto = S.painAuto || []; p.pain = (p.pain || []).filter(z => !auto.includes(z)); S.painAuto = []; S.checkins = (S.checkins || []).concat([{ d: Date.now(), sleep: 1, energy: 1, pain: [] }]); if (pathOn()) regenPath(); save(true); render(); toast('Esercizi rimessi nelle schede'); }
});
/* dopo ogni check-in controlla i dolori ripetuti */
const _ckGo = ACT.ckGo;
ACT.ckGo = () => { _ckGo(); const before = (S.painAuto || []).length; painAlarmApply(); if ((S.painAuto || []).length > before) setTimeout(() => toast('Stesso dolore per 3 volte: senti un medico o un fisioterapista. Esercizi della zona tolti.'), 3200); };

/* ---------- in home ---------- */
const _homeCards5 = homeTrainerCards2;
homeTrainerCards2 = function (t, doneToday) {
  return _homeCards5(t, doneToday) + ftestCard() + photoCard();
};
/* subito sotto l'allenamento di oggi: le cose che contano adesso */
function homeTopCards() { return painCard() + fatigueCard() + missedCard() + recapCard() + proteinNudge(); }
UI.stack = [{ v: S.active ? 'workout' : 'home' }];
render(true);
