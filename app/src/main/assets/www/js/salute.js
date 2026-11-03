/* Coach — Health Connect (passi, sonno, peso, calorie attive) e assistente AI che conosce i tuoi dati.
   I dati di Health Connect si leggono all'apertura (niente lavoro in sottofondo) e restano sul telefono.
   Come li uso:
   - passi medi degli ultimi 7 giorni -> livello di attività (PAL) per le calorie, al posto della stima del questionario;
   - sonno della notte -> il check-in parte già compilato (meno di 6 h = poco, 6–7 h = normale, 7 h o più = bene);
   - peso dalla bilancia -> registrato in Coach (traguardi, piano alimentare). */
'use strict';

const hcOn = () => !!(S.hc && S.hc.on);
function hcState() { S.hc = S.hc || {}; S.hc.days = S.hc.days || {}; return S.hc; }
const hcAvail = () => Native.has() && !!window.Android.hcStatus;

window.onHealth = json => {
  const r = JSON.parse(json), H = hcState();
  H.on = (r.granted || []).length > 0; H.granted = r.granted || []; save(true);
  toast(H.on ? 'Health Connect collegato' : 'Nessun permesso concesso');
  if (H.on) hcRead(); else render();
};
window.onHealthData = json => {
  const r = JSON.parse(json), H = hcState();
  if (r.error) { H.err = r.error; save(); return; }
  H.err = ''; H.readAt = Date.now(); H.granted = r.granted || H.granted;
  Object.assign(H.days, r.days || {});
  // tengo solo gli ultimi 60 giorni
  const keep = dayKey(Date.now() - 60 * 864e5);
  Object.keys(H.days).forEach(k => { if (k < keep) delete H.days[k]; });
  // pesate dalla bilancia: una per giorno, senza doppioni con quelle inserite a mano
  let nw = 0;
  (r.weights || []).forEach(w => {
    if (w.kg < 20 || w.kg > 400) return;
    if (S.weights.some(x => dayKey(x.d) === dayKey(w.t))) return;
    S.weights.push({ d: w.t, kg: w.kg, src: 'hc' }); nw++;
  });
  if (nw) S.weights.sort((a, b) => a.d - b.d);
  save(true);
  if (['home', 'food', 'hcSetup', 'progress'].includes(current().v)) render();
};
let _hcLast = 0;
function hcRead(force) {
  if (!hcAvail() || !hcOn()) return;
  if (!force && Date.now() - _hcLast < 5 * 60000) return;
  _hcLast = Date.now();
  try { window.Android.hcRead(30); } catch (e) { }
}

/* passi medi degli ultimi 7 giorni completi (serve almeno 4 giorni con dati) */
function hcSteps7() {
  if (!hcOn()) return null;
  const H = hcState(), L = [];
  for (let i = 1; i <= 7; i++) { const d = H.days[dayKey(Date.now() - i * 864e5)]; if (d && d.steps) L.push(d.steps); }
  return L.length >= 4 ? Math.round(L.reduce((a, b) => a + b, 0) / L.length) : null;
}
function hcSleepLast() { if (!hcOn()) return null; const d = hcState().days[todayKey()]; return d && d.sleep ? d.sleep : null; }
function hcToday() { return hcOn() ? hcState().days[todayKey()] || {} : {}; }

/* livello di attività: con i passi misurati, la fascia dei passi del questionario si sostituisce con quella vera */
if (typeof palFor === 'function') {
  const _palHc = palFor;
  palFor = function (p) {
    const st = hcSteps7();
    if (st == null || !p || !p.job) return _palHc(p);
    const k = st < 5000 ? 's1' : st < 8000 ? 's2' : st < 12000 ? 's3' : 's4';
    return _palHc(Object.assign({}, p, { steps: k }));
  };
}
/* check-in già compilato con il sonno di stanotte */
if (typeof checkinSheet === 'function') {
  const _ckHc = checkinSheet;
  checkinSheet = function () {
    const sl = hcSleepLast();
    if (UI.ck && sl && !UI.ck.hcSet) { UI.ck.sleep = sl < 360 ? 0 : sl < 420 ? 1 : 2; UI.ck.hcSet = true; }
    const out = _ckHc();
    return sl ? out.replace('Come hai dormito?', 'Come hai dormito? <small class="muted">(Health Connect: ' + Math.floor(sl / 60) + ' h ' + pad(sl % 60) + ')</small>') : out;
  };
}

/* ---------- impostazioni ---------- */
VIEWS.hcSetup = () => {
  const H = hcState(), st = hcAvail() ? window.Android.hcStatus() : 'web', t = hcToday(), s7 = hcSteps7();
  return header('Health Connect', { back: true, sub: 'Passi, sonno, peso e calorie attive' }) + '<div class="pad">' +
    '<div class="card"><p class="small">Coach legge (solo lettura) i dati del telefono, dell\'orologio o della bilancia collegati a Health Connect:</p><ul class="tips">' +
      '<li><b>Passi</b>: il livello di attività per le calorie si basa su quelli veri, non sulla stima del questionario.</li>' +
      '<li><b>Sonno</b>: il check-in prima della seduta parte già compilato.</li>' +
      '<li><b>Peso</b>: le pesate della bilancia entrano da sole nei traguardi e nel piano alimentare.</li></ul>' +
      '<p class="small muted">I dati restano sul telefono.</p></div>' +
    (st === 'web' ? '<div class="note">Disponibile nell\'app Android.</div>' :
      st === 'no' ? '<div class="note">Questo telefono non supporta Health Connect.</div>' :
      hcOn() ? '<div class="note good">' + ic('check', 'inline') + 'Collegato' + (H.readAt ? ' · letto ' + new Date(H.readAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '') + '</div>' +
        '<div class="card"><div class="stats3"><div><b>' + (t.steps != null ? t.steps.toLocaleString('it-IT') : '—') + '</b><small>passi oggi</small></div><div><b>' + (s7 != null ? s7.toLocaleString('it-IT') : '—') + '</b><small>media 7 giorni</small></div><div><b>' + (t.sleep ? Math.floor(t.sleep / 60) + 'h ' + pad(t.sleep % 60) : '—') + '</b><small>sonno stanotte</small></div></div></div>' +
        '<button class="btn wide" data-act="hcRefresh">' + ic('swap') + 'Aggiorna</button><button class="btn ghost wide" data-act="hcConnect">Permessi</button>' +
        '<button class="btn danger ghost wide" data-act="hcOff">Non usare più Health Connect</button>'
      : '<button class="btn wide big" data-act="hcConnect">' + (st === 'install' ? 'Installa o aggiorna Health Connect' : 'Collega Health Connect') + '</button>') +
    '</div>';
};
Object.assign(ACT, {
  hcSetup: () => go('hcSetup'),
  hcConnect: () => { if (hcAvail()) window.Android.hcRequest(); else toast('Disponibile nell\'app Android'); },
  hcRefresh: () => { hcRead(true); toast('Leggo Health Connect…'); },
  hcOff: () => { hcState().on = false; save(true); render(); }
});

/* ---------- assistente AI: conosce piano, valutazioni, traguardi, alimentazione e salute ---------- */
if (typeof aiContext === 'function') {
  const _aiCtx = aiContext;
  aiContext = function () {
    const L = [_aiCtx()];
    try {
      const p = S.profile;
      if (pathOn()) {
        const c = cycleInfo();
        L.push('Percorso su misura: fase ' + pathPhase() + ' di 3' + (c.on ? ', settimana ' + c.w + (c.deload ? ' (scarico)' : '') : '') + '. Luogo: ' + (p.place || 'palestra') + '. Dolori segnalati: ' + ((p.pain || []).map(z => PAIN_ZONES[z] || z).join(', ') || 'nessuno') + '.');
        const gs = goalStatus(); if (gs.length) L.push('Traguardi: ' + gs.map(g => g.t + ' (' + g.eta + ')').join('; ') + '.');
      }
      L.push('Schede attuali: ' + S.templates.filter(t => t.kind !== 'circuito').map(t => t.name + ' [' + t.items.map(i => (EX[i.ex] || { n: i.ex }).n + ' ' + (i.sets || '') + 'x' + (i.secs ? i.secs + 's' : (i.rmin || '') + '-' + (i.rmax || ''))).join(', ') + ']').join(' | '));
      const V = S.history.filter(h => h.val && h.val.score != null).slice(-5);
      if (V.length) L.push('Valutazioni delle ultime sedute (voto/10): ' + V.map(h => fmtDate(h.start) + ' ' + h.name + ' ' + h.val.score + (h.val.fix[0] ? ' — da migliorare: ' + h.val.fix[0] : '')).join(' | '));
      const ck = (S.checkins || []).slice(-5);
      if (ck.length) L.push('Ultimi check-in (sonno/energia 0=basso 2=alto): ' + ck.map(c => fmtDate(c.d) + ' sonno ' + c.sleep + ' energia ' + c.energy + (c.pain && c.pain.length ? ' dolori ' + c.pain.join(',') : '')).join('; '));
      const n = nutritionTargets();
      if (n.kcal) L.push('Alimentazione: obiettivo ' + n.kcal + ' kcal, proteine ' + n.protein + ' g, carboidrati ' + n.carbs + ' g, grassi ' + n.fat + ' g, acqua ' + fmtKg(n.water) + ' L.');
      const W = S.weights.slice(-8); if (W.length > 1) L.push('Andamento del peso: ' + W.map(w => fmtDate(w.d) + ' ' + fmtKg(w.kg)).join(', ') + '.');
      const s7 = hcSteps7(), sl = hcSleepLast(); if (s7 != null || sl) L.push('Health Connect: ' + (s7 != null ? 'passi medi 7 giorni ' + s7 : '') + (sl ? ', sonno stanotte ' + Math.floor(sl / 60) + ' h ' + (sl % 60) + ' min' : '') + '.');
      L.push('Le sedute si registrano in Hevy; Coach scrive in Hevy carichi e ripetizioni della prossima volta. Quando proponi modifiche alle schede, dì all\'utente che può farle in Hevy: Coach le adotta.');
    } catch (e) { }
    return L.join('\n');
  };
}

window.onAppResume = () => { if (typeof hvAuto === 'function') hvAuto(); hcRead(); };
setTimeout(() => hcRead(true), 1500);
