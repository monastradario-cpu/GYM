/* GYM — nucleo interfaccia: navigazione, icone, home, schede, impostazioni, primo avvio */
'use strict';

const $ = s => document.querySelector(s);
const UI = {
  stack: [], sheetFn: null,
  coach: { muscles: [], eq: [], result: null },
  lib: { q: '', m: '', eq: '' },
  prog: { tab: 'andamento', ex: null, metric: 'e1rm', month: null, week: null },
  schede: 'schede',
  ob: { step: 0 },
  edit: null, pick: { q: '', m: '', eq: '', cb: null },
  ai: { msgs: [], busy: false },
  update: { state: 'idle', info: null, progress: 0 }
};

/* ---------- Icone ---------- */
const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  coach: '<path d="M12 3l2.4 5.2L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.6-.8z"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3"/><path d="M20 4v14h-7"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
  swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  flame: '<path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 2 0-2-1-4 0-6z"/>',
  dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/>',
  water: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9a4 4 0 0 1 6 0l-3 3"/>',
  run: '<circle cx="14" cy="4" r="2"/><path d="M8 21l3-6 3 2v5M6 12l3-4 4 1 3 4 3 1"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'
};
const ic = (n, cls) => '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[n] || '') + '</svg>';

/* ---------- Tema ---------- */
function applyTheme() {
  const t = S.settings.theme;
  const dark = t === 'dark' || (t === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.setProperty('--accent', ACCENTS[S.settings.accent] || ACCENTS.arancio);
}

/* ---------- Navigazione ---------- */
const VIEWS = {};
const TABS = [['home', 'Home', 'home'], ['schede', 'Schede', 'list'], ['coach', 'Coach', 'coach'], ['food', 'Cibo', 'flame'], ['library', 'Esercizi', 'book'], ['progress', 'Progressi', 'chart']];

function go(v, p, replace) {
  if (replace || TABS.some(t => t[0] === v)) UI.stack = [{ v, p }];
  else UI.stack.push({ v, p });
  render(true);
}
function current() { return UI.stack[UI.stack.length - 1] || { v: 'home' }; }
function back() {
  if (!$('#sheet').hidden) { closeSheet(); return true; }
  if (UI.stack.length > 1) { UI.stack.pop(); render(true); return true; }
  if (current().v !== 'home') { go('home'); return true; }
  return false;
}
window.appBack = () => back();

function render(scrollTop) {
  const main = $('#view'), y = main.scrollTop;
  if (!S.onboarded) { $('#nav').hidden = true; $('#banner').hidden = true; main.innerHTML = VIEWS.onboarding(); main.scrollTop = 0; return; }
  const c = current();
  const fn = VIEWS[c.v] || VIEWS.home;
  main.innerHTML = fn(c.p || {});
  main.scrollTop = scrollTop ? 0 : y;
  const demo = document.getElementById('demo');
  if (demo) Demo.mount(demo, demo.dataset.ex); else Demo.stop();
  const isWorkout = c.v === 'workout' || c.v === 'saveWo';
  $('#nav').hidden = isWorkout || c.v === 'aichat';
  $('#nav').innerHTML = TABS.map(t => '<button data-act="tab" data-v="' + t[0] + '" class="' + (navTab() === t[0] ? 'on' : '') + '">' + ic(t[2]) + '<span>' + t[1] + '</span></button>').join('');
  $('#banner').hidden = !S.active || isWorkout;
  if (S.active && !isWorkout) $('#banner').innerHTML = ic('timer') + '<span><b>' + esc(S.active.name) + '</b> in corso · <span data-clock="elapsed"></span></span><button class="btn sm" data-act="openWorkout">Riprendi</button>';
  tick();
}
function navTab() { for (let i = UI.stack.length - 1; i >= 0; i--) if (TABS.some(t => t[0] === UI.stack[i].v)) return UI.stack[i].v; return 'home'; }

/* ---------- Fogli, avvisi, conferme ---------- */
function openSheet(fn) { UI.sheetFn = fn; $('#sheet').hidden = false; $('#sheet-body').innerHTML = fn(); $('#sheet-body').scrollTop = 0; }
function rerenderSheet() { if (UI.sheetFn && !$('#sheet').hidden) { const b = $('#sheet-body'), y = b.scrollTop; b.innerHTML = UI.sheetFn(); b.scrollTop = y; } }
function closeSheet() { $('#sheet').hidden = true; UI.sheetFn = null; $('#sheet-body').innerHTML = ''; }
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); }
let confirmCb = null;
function ask(msg, okLabel, cb, danger) {
  confirmCb = cb;
  openSheet(() => '<h3>' + esc(msg) + '</h3><div class="row gap"><button class="btn ghost grow" data-act="closeSheet">Annulla</button><button class="btn grow ' + (danger ? 'danger' : '') + '" data-act="confirmOk">' + esc(okLabel) + '</button></div>');
}

/* ---------- Pezzi riutilizzabili ---------- */
const header = (title, opts) => {
  opts = opts || {};
  return '<header class="top">' + (opts.back ? '<button class="icon-btn" data-act="back">' + ic('back') + '</button>' : '') +
    '<div class="top-title"><h1>' + title + '</h1>' + (opts.sub ? '<div class="sub">' + opts.sub + '</div>' : '') + '</div>' +
    (opts.right || (opts.noGear ? '' : '<button class="icon-btn" data-act="go" data-v="settings">' + ic('gear') + '</button>')) + '</header>';
};
const chip = (label, on, act, data) => '<button class="chip ' + (on ? 'on' : '') + '" data-act="' + act + '" ' + (data || '') + '>' + label + '</button>';
const daysChips = (days, act) => '<div class="chips days">' + [1, 2, 3, 4, 5, 6, 0].map(d => chip(WEEKDAYS[d], days.includes(d), act, 'data-d="' + d + '"')).join('') + '</div>';
const toggle = (on, act, data) => '<button class="switch ' + (on ? 'on' : '') + '" data-act="' + act + '" ' + (data || '') + '><i></i></button>';
const field = (label, inner, hint) => '<label class="field"><span>' + label + '</span>' + inner + (hint ? '<small>' + hint + '</small>' : '') + '</label>';
const numIn = (val, attrs, ph) => '<input type="text" inputmode="decimal" value="' + esc(val == null ? '' : val) + '" placeholder="' + esc(ph == null ? '' : ph) + '" ' + attrs + '>';
const timeIn = (h, m, key) => '<input type="time" value="' + pad(h) + ':' + pad(m) + '" data-in="remTime" data-k="' + key + '">';

function prescText(i, t) {
  if (t && t.kind === 'circuito') return i.secs ? i.secs + ' sec' : (i.reps || '?') + ' rip.';
  const e = EX[i.ex];
  if (e && e.type === 'time') return i.sets + ' × ' + (i.secs || 40) + ' sec · rec. ' + i.rest + 's';
  return i.sets + ' × ' + i.rmin + (i.rmax && i.rmax !== i.rmin ? '–' + i.rmax : '') + ' · rec. ' + i.rest + 's';
}
function exLine(id) { const e = EX[id]; return e ? esc(e.n) : esc(id); }
function eqBadge(id) { const e = EX[id]; return e ? '<span class="badge">' + EQUIP[e.eq] + '</span>' : ''; }

/* =================== HOME =================== */
VIEWS.home = () => {
  const t = todayTemplate(), ws = weekStats(), now = new Date();
  const doneToday = S.history.some(h => dayKey(h.start) === todayKey() && h.kind !== 'cardio');
  const w = S.weights[S.weights.length - 1], w0 = S.weights[S.weights.length - 2];
  const water = S.water[todayKey()] || 0, wg = S.profile.waterGoal || 8;
  const sow = startOfWeek(now);
  const week = [...Array(7)].map((_, i) => { const d = new Date(sow); d.setDate(d.getDate() + i); return d; });
  const trained = new Set(S.history.map(h => dayKey(h.start)));
  let todayCard;
  if (t) {
    todayCard = '<div class="card hero"><div class="eyebrow">' + (doneToday ? 'Fatto oggi ' + ic('check', 'inline') : 'Allenamento di oggi') + '</div><h2>' + esc(t.name) + '</h2>' +
      '<div class="muted">' + t.items.length + (t.kind === 'circuito' ? ' stazioni · ' + t.rounds + ' giri' : ' esercizi') + ' · circa ' + templateMinutes(t) + ' min</div>' +
      '<div class="ex-preview">' + t.items.slice(0, 4).map(i => '<span>' + exLine(i.ex) + '</span>').join('') + (t.items.length > 4 ? '<span>+' + (t.items.length - 4) + '</span>' : '') + '</div>' +
      '<button class="btn big" data-act="startTemplate" data-id="' + t.id + '">' + ic('play') + (S.active ? 'Riprendi allenamento' : 'Inizia') + '</button></div>';
  } else {
    todayCard = '<div class="card hero rest"><div class="eyebrow">Oggi</div><h2>Giorno di riposo</h2><div class="muted">Il muscolo cresce mentre recuperi. Oggi: camminata e qualche minuto di mobilità. Se vuoi allenarti lo stesso, scegli una scheda o un circuito.</div>' +
      '<button class="btn ghost wide" data-act="quickStart" data-k="q_mob7">' + ic('run') + 'Mobilità guidata (7 min)</button>' +
      '<button class="btn big ghost" data-act="tab" data-v="schede">' + ic('list') + 'Scegli una scheda</button></div>';
  }
  return header('GYM', { sub: fmtDateLong(now) }) + '<div class="pad">' + todayCard +
    cycleCard() +
    breakCard() +
    homeKcalCard() +
    '<div class="grid2">' +
      '<button class="tile" data-act="startEmpty">' + ic('plus') + '<b>Allenamento vuoto</b><small>Aggiungi gli esercizi mentre vai</small></button>' +
      '<button class="tile accent" data-act="tab" data-v="coach">' + ic('coach') + '<b>Crea con l\'allenatore</b><small>Scegli muscoli e attrezzi</small></button>' +
    '</div>' +
    '<div class="card"><div class="card-h"><h3>Questa settimana</h3><span class="muted">' + ws.count + ' / ' + S.profile.days.length + ' allenamenti</span></div>' +
      '<div class="week">' + week.map(d => {
        const k = dayKey(d), planned = S.profile.days.includes(d.getDay()), done = trained.has(k), today = k === todayKey();
        return '<div class="wd ' + (done ? 'done ' : '') + (planned ? 'plan ' : '') + (today ? 'today' : '') + '"><small>' + WEEKDAYS[d.getDay()][0] + '</small><i>' + (done ? ic('check') : d.getDate()) + '</i></div>';
      }).join('') + '</div>' +
      '<div class="stats3"><div><b>' + fmtDur(ws.time) + '</b><small>tempo</small></div><div><b>' + (ws.vol >= 1000 ? fmtKg(Math.round(ws.vol / 100) / 10) + ' t' : Math.round(ws.vol) + ' kg') + '</b><small>volume</small></div><div><b>' + Math.round(ws.cardioMin) + '<small>/150</small> min</b><small>cardio (OMS)</small></div></div>' + weekVolumeNote() +
    '</div>' +
    '<div class="grid2">' +
      '<div class="card mini"><div class="mini-h">' + ic('scale') + 'Peso</div><b class="big-num">' + (w ? fmtKg(w.kg) + '<small> kg</small>' : '—') + '</b>' +
        (w && w0 ? '<small class="' + (w.kg <= w0.kg ? 'good' : 'muted') + '">' + (w.kg - w0.kg > 0 ? '+' : '') + fmtKg(Math.round((w.kg - w0.kg) * 10) / 10) + ' kg</small>' : '<small class="muted">' + (w ? fmtDate(w.d) : 'non registrato') + '</small>') +
        '<button class="btn sm ghost" data-act="addWeight">Registra</button></div>' +
      '<div class="card mini"><div class="mini-h">' + ic('water') + 'Acqua oggi</div><b class="big-num">' + water + '<small> / ' + wg + '</small></b>' +
        '<div class="water-dots">' + [...Array(wg)].map((_, i) => '<i class="' + (i < water ? 'on' : '') + '"></i>').join('') + '</div>' +
        '<div class="row gap"><button class="btn sm ghost" data-act="water" data-d="-1">−</button><button class="btn sm" data-act="water" data-d="1">+ bicchiere</button></div></div>' +
    '</div>' +
    '<button class="btn ghost wide" data-act="cardio">' + ic('run') + 'Registra cardio</button>' +
    homeTrainerCards(t, doneToday) +
    '</div>';
};

/* =================== SCHEDE =================== */
function quickList() {
  return breakCard(true) + Object.keys(QUICK_ZONES).map(z => '<h3 class="sec">' + QUICK_ZONES[z].n + '</h3><p class="small muted">' + QUICK_ZONES[z].d + '</p>' +
    QUICK_ROUTINES.filter(q => q.zone === z).map(q => '<div class="card tpl qk-tpl"><div class="card-h"><div><h3>' + esc(q.n) + '</h3><div class="muted small">' + q.st.length + ' esercizi' + (q.rounds > 1 ? ' · ' + q.rounds + ' giri' : '') + ' · ' + quickMinutes(q) + ' min · guida automatica</div></div></div>' +
      '<p class="small muted">' + esc(q.desc) + '</p>' +
      '<div class="ex-preview">' + q.st.map(x => '<span>' + esc((EX[x[0]] || {}).n || x[0]) + '</span>').join('') + '</div>' +
      '<button class="btn" data-act="quickStart" data-k="' + q.key + '">' + ic('play') + 'Inizia</button></div>').join('')).join('') +
    '<p class="small muted">Perché funziona: brevi "spuntini" di movimento di pochi minuti, più volte al giorno, migliorano la forma fisica (meta-analisi BJSM 2025); alzarsi e muoversi qualche minuto ogni 30–60 minuti abbassa pressione e glicemia (Columbia University, 2023); rinforzare collo e spalle sul lavoro riduce il dolore al collo (Physical Therapy, 2018).</p>';
}
/* card delle pause attive con le stelle di oggi */
function breakCard(inSchede) {
  const n = starsOn(), g = starGoal(), nb = nextBreak();
  return '<div class="card brk"><div class="card-h"><div><div class="eyebrow">⭐ Pause attive di oggi</div><div class="stars">' + starRow(n, g) + '</div></div><b class="brk-n">' + n + '/' + g + '</b></div>' +
    '<p class="small muted">' + (n >= g ? 'Obiettivo raggiunto! Ogni pausa in più fa comunque bene.' : 'Ogni pausa di 2–5 minuti vale una stella. Prossima consigliata: <b>' + esc(nb.n) + '</b>.') + '</p>' +
    '<div class="row gap"><button class="btn grow" data-act="quickStart" data-k="' + nb.key + '">' + ic('play') + 'Pausa di ' + quickMinutes(nb) + ' min</button>' +
    (inSchede ? '' : '<button class="btn ghost" data-act="goQuick">Altre</button>') + '</div></div>';
}
VIEWS.schede = () => {
  const tabs = '<div class="seg">' + chip('Le mie schede', UI.schede === 'schede', 'schedeTab', 'data-t="schede"') + chip('Circuiti 1 ora', UI.schede === 'circuiti', 'schedeTab', 'data-t="circuiti"') + chip('Casa e lavoro', UI.schede === 'casa', 'schedeTab', 'data-t="casa"') + '</div>';
  if (UI.schede === 'casa') return header('Schede') + '<div class="pad">' + tabs + quickList() + '</div>';
  const list = S.templates.filter(t => UI.schede === 'circuiti' ? t.kind === 'circuito' : t.kind !== 'circuito');
  return header('Schede') + '<div class="pad">' +
    tabs +
    (UI.schede === 'circuiti' ? '<p class="muted small">Circuiti pronti da circa un\'ora, riscaldamento e defaticamento inclusi. Puoi modificarli o crearne di nuovi.</p>' : '') +
    (list.length ? list.map(t => '<div class="card tpl">' +
      '<div class="card-h"><div><h3>' + esc(t.name) + '</h3><div class="muted small">' +
        (t.kind === 'circuito' ? t.items.length + ' stazioni · ' + t.rounds + ' giri' : t.items.length + ' esercizi') + ' · circa ' + templateMinutes(t) + ' min' +
        ((t.days || []).length ? ' · ' + t.days.map(d => WEEKDAYS[d]).join(', ') : '') + '</div></div>' +
        '<button class="icon-btn" data-act="editTemplate" data-id="' + t.id + '">' + ic('edit') + '</button></div>' +
      (t.desc ? '<p class="small muted">' + esc(t.desc) + '</p>' : '') +
      (t.focus ? '<div class="eyebrow">' + esc(t.focus) + '</div>' : '') +
      (t.note ? '<p class="small muted">' + ic('coach', 'inline') + esc(t.note) + '</p>' : '') +
      '<div class="ex-preview">' + t.items.slice(0, 6).map(i => '<span>' + exLine(i.ex) + '</span>').join('') + (t.items.length > 6 ? '<span>+' + (t.items.length - 6) + '</span>' : '') + '</div>' +
      '<button class="btn" data-act="startTemplate" data-id="' + t.id + '">' + ic('play') + 'Inizia</button></div>').join('')
      : '<div class="empty">Nessuna ' + (UI.schede === 'circuiti' ? 'circuito' : 'scheda') + ' qui.</div>') +
    '<div class="grid2">' +
      '<button class="tile" data-act="newTemplate" data-k="' + (UI.schede === 'circuiti' ? 'circuito' : 'scheda') + '">' + ic('plus') + '<b>' + (UI.schede === 'circuiti' ? 'Nuovo circuito' : 'Nuova scheda') + '</b></button>' +
      '<button class="tile" data-act="presets">' + ic('list') + '<b>Schede pronte</b><small>Aggiungi dai modelli</small></button>' +
    '</div>' +
    (UI.schede === 'schede' ? '<button class="btn ghost wide" data-act="regen">' + ic('swap') + 'Rigenera per i miei giorni</button>' : '') +
    '</div>';
};

function presetsSheet() {
  return '<h3>Schede pronte</h3><p class="muted small">Le serie e le ripetizioni si adattano a obiettivo e livello del tuo profilo.</p>' +
    Object.keys(PRESET_SPLITS).map(k => '<div class="list-item"><div><b>' + PRESET_SPLITS[k].n + '</b><small>' + PRESET_SPLITS[k].ex.length + ' esercizi</small></div><button class="btn sm" data-act="addPreset" data-k="' + k + '">Aggiungi</button></div>').join('') +
    '<h3>Circuiti da un\'ora</h3>' +
    PRESET_CIRCUITS.map(c => '<div class="list-item"><div><b>' + c.n + '</b><small>circa ' + circuitMinutes(c) + ' min · ' + c.desc + '</small></div><button class="btn sm" data-act="addCircuit" data-k="' + c.key + '">Aggiungi</button></div>').join('');
}

/* ---------- Modifica scheda ---------- */
VIEWS.edit = () => {
  const t = UI.edit; if (!t) return '';
  const circ = t.kind === 'circuito';
  return header(circ ? 'Circuito' : 'Scheda', { back: true, right: '<button class="btn sm" data-act="saveTemplate">Salva</button>' }) + '<div class="pad">' +
    field('Nome', '<input type="text" value="' + esc(t.name) + '" data-in="editName">') +
    '<div class="field"><span>Giorni (facoltativo)</span>' + daysChips(t.days || [], 'editDay') + '</div>' +
    (circ ? '<div class="grid3">' +
      field('Giri', numIn(t.rounds, 'data-in="editNum" data-k="rounds"')) +
      field('Pausa stazioni (s)', numIn(t.restEx, 'data-in="editNum" data-k="restEx"')) +
      field('Pausa giri (s)', numIn(t.restRound, 'data-in="editNum" data-k="restRound"')) + '</div>' +
      '<p class="muted small">Durata stimata: circa ' + templateMinutes(t) + ' minuti.</p>' : '') +
    '<div class="card-h sec-h"><h3 class="sec">' + (circ ? 'Stazioni' : 'Esercizi') + '</h3>' + (t.items.length > 1 ? '<button class="btn sm ghost" data-act="reorder" data-k="edit">' + ic('list', 'inline') + 'Riordina</button>' : '') + '</div>' +
    t.items.map((i, n) => {
      const e = EX[i.ex] || { n: i.ex }, timed = e.type === 'time';
      return '<div class="card edit-item"><div class="card-h"><button class="link" data-act="exInfo" data-id="' + i.ex + '"><b>' + (n + 1) + '. ' + esc(e.n) + '</b></button>' +
        '<div class="row"><button class="icon-btn sm" data-act="editMove" data-n="' + n + '" data-d="-1">' + ic('up') + '</button><button class="icon-btn sm" data-act="editMove" data-n="' + n + '" data-d="1">' + ic('down') + '</button><button class="icon-btn sm" data-act="editSwap" data-n="' + n + '">' + ic('swap') + '</button><button class="icon-btn sm" data-act="editDel" data-n="' + n + '">' + ic('trash') + '</button></div></div>' +
        (circ ? '<div class="grid2">' + (timed || i.secs ? field('Secondi', numIn(i.secs, 'data-in="editItem" data-n="' + n + '" data-k="secs"')) : field('Ripetizioni', numIn(i.reps, 'data-in="editItem" data-n="' + n + '" data-k="reps"'))) + '</div>'
          : (timed ? '' : '<div class="seg sm-seg">' + chip('Intervallo di ripetizioni', i.repMode !== 'fixed', 'editRepMode', 'data-n="' + n + '" data-m="range"') + chip('Ripetizioni fisse', i.repMode === 'fixed', 'editRepMode', 'data-n="' + n + '" data-m="fixed"') + '</div>') +
            '<div class="grid4">' + field('Serie', numIn(i.sets, 'data-in="editItem" data-n="' + n + '" data-k="sets"')) +
            (timed ? field('Secondi', numIn(i.secs || 40, 'data-in="editItem" data-n="' + n + '" data-k="secs"')) + '<span></span>' :
              i.repMode === 'fixed' ? field('Ripetizioni', numIn(i.rmax, 'data-in="editItem" data-n="' + n + '" data-k="fixed"')) + '<span></span>' :
              field('Rip. min', numIn(i.rmin, 'data-in="editItem" data-n="' + n + '" data-k="rmin"')) + field('Rip. max', numIn(i.rmax, 'data-in="editItem" data-n="' + n + '" data-k="rmax"'))) +
            field('Recupero s', numIn(i.rest, 'data-in="editItem" data-n="' + n + '" data-k="rest"')) + '</div>') +
        '</div>';
    }).join('') +
    '<button class="btn ghost wide" data-act="editAdd">' + ic('plus') + 'Aggiungi esercizio</button>' +
    (S.templates.some(x => x.id === t.id) ? '<button class="btn danger ghost wide" data-act="delTemplate">' + ic('trash') + 'Elimina</button>' : '') +
    '</div>';
};

/* ---------- Selettore esercizi ---------- */
function pickExercise(cb, preset) {
  UI.pick = Object.assign({ q: '', m: '', eq: '' }, preset || {}, { cb });
  openSheet(pickerSheet);
}
function pickerSheet() {
  const p = UI.pick;
  const pairs = p.m ? pairSuggestions(p.group && p.group.length ? p.group : [p.m]).filter(x => !(p.group || []).includes(x.m)) : [];
  return '<h3>Scegli esercizio</h3><input type="search" placeholder="Cerca…" value="' + esc(p.q) + '" data-in="pickQ" class="search">' +
    (p.group && p.group.length > 1 ? '<div class="eyebrow">Gruppo di oggi</div><div class="chips">' + p.group.map(m => chip(MUSCLES[m], p.m === m, 'pickM', 'data-m="' + m + '"')).join('') + '</div>' : '') +
    (pairs.length ? '<div class="small muted">' + ic('coach', 'inline') + 'Con ' + MUSCLES[p.m] + ' si abbina bene: ' + pairs.map(x => '<button class="link-inline" data-act="pickM" data-m="' + x.m + '">' + MUSCLES[x.m] + '</button>').join(', ') + '</div>' : '') +
    '<div class="chips scroll">' + chip('Tutti', !p.m, 'pickM', 'data-m=""') + Object.keys(MUSCLES).map(m => chip(MUSCLES[m], p.m === m, 'pickM', 'data-m="' + m + '"')).join('') + '</div>' +
    '<div class="chips scroll">' + chip('Ogni attrezzo', !p.eq, 'pickEq', 'data-e=""') + Object.keys(EQUIP).map(k => chip(EQUIP[k], p.eq === k, 'pickEq', 'data-e="' + k + '"')).join('') + '</div>' +
    '<div id="pick-list">' + pickerList() + '</div>';
}
function pickerList() {
  const p = UI.pick, q = p.q.toLowerCase();
  const list = EXERCISES.filter(e => (!p.m || e.m === p.m) && (!p.eq || e.eq === p.eq) && (!q || e.n.toLowerCase().includes(q)));
  return list.map(e => '<button class="list-item btnlike" data-act="pickDo" data-id="' + e.id + '"><div><b>' + esc(e.n) + '</b><small>' + muscleName(e.m) + ' · ' + EQUIP[e.eq] + '</small></div>' + ic('plus') + '</button>').join('') || '<div class="empty small">Nessun esercizio</div>';
}

/* =================== IMPOSTAZIONI =================== */
VIEWS.settings = () => {
  const st = S.settings, r = S.reminders, p = S.profile, ai = st.ai, prov = AI_PROVIDERS[ai.provider] || AI_PROVIDERS.gemini, u = UI.update;
  return header('Impostazioni', { back: true, noGear: true }) + '<div class="pad">' +
    '<h3 class="sec">Aggiornamenti</h3><div class="card">' +
      '<div class="list-item flat"><div><b>Versione installata</b><small>' + esc(Native.version()) + '</small></div></div>' +
      updateBox() + '</div>' +
    '<h3 class="sec">Aspetto</h3><div class="card">' +
      '<div class="field"><span>Tema</span><div class="seg">' + [['light', 'Chiaro'], ['dark', 'Scuro'], ['system', 'Sistema']].map(x => chip(x[1], st.theme === x[0], 'setTheme', 'data-t="' + x[0] + '"')).join('') + '</div></div>' +
      '<div class="field"><span>Figura del corpo</span><div class="chips">' + Object.keys(B2_STYLES).map(k => chip(B2_STYLES[k].n, ((S.settings.body2) || 'vettoriale') === k, 'setBodyStyle', 'data-k="' + k + '"')).join('') + '</div></div>' +
      '<div class="body-prev">' + bodySvg(m => m === 'petto' ? { color: 'var(--accent)' } : m === 'tricipiti' ? { color: 'var(--accent)', op: .45 } : null) + '</div>' +
      '<div class="field"><span>Omino degli esercizi</span><div class="chips">' + Object.keys(MQ_STYLES).map(k => chip(MQ_STYLES[k].n, mqStyle() === k, 'setMq', 'data-k="' + k + '"')).join('') + '</div><small>' + esc(MQ_STYLES[mqStyle()].d) + '</small></div>' +
      '<div class="mq-prev">' + ['squat_bil', 'curl_man', 'lat_machine'].map(id => { const d = animDef(id); return '<svg viewBox="70 0 190 205">' + frameSvg(d, EX[id], 0, d.seq ? 0 : 1, d.seq ? 0 : 0.7) + '</svg>'; }).join('') + '</div>' +
      '<div class="field"><span>Colore</span><div class="swatches">' + Object.keys(ACCENTS).map(k => '<button class="sw ' + (st.accent === k ? 'on' : '') + '" style="background:' + ACCENTS[k] + '" data-act="setAccent" data-k="' + k + '" aria-label="' + k + '"></button>').join('') + '</div></div>' +
    '</div>' +
    '<h3 class="sec">Profilo</h3><div class="card">' +
      '<div class="field"><span>Obiettivi (anche più di uno)</span><div class="chips">' + Object.keys(GOALS).map(k => chip(GOALS[k].n, p.goals.includes(k), 'setGoal', 'data-k="' + k + '"')).join('') + '</div></div>' +
      bodyDataFields() +
      '<div class="field"><span>Livello</span><div class="chips">' + Object.keys(LEVELS).map(k => chip(LEVELS[k].n, p.level === k, 'setLevel', 'data-k="' + k + '"')).join('') + '</div></div>' +
      '<div class="field"><span>Giorni di allenamento</span>' + daysChips(p.days, 'setDay') + '</div>' +
      field('Bicchieri d\'acqua al giorno', numIn(p.waterGoal, 'data-in="waterGoal"')) +
      '<button class="btn ghost wide" data-act="regen">' + ic('swap') + 'Rigenera le schede con questo profilo</button>' +
    '</div>' +
    '<h3 class="sec">Allenamento</h3><div class="card">' +
      '<button class="list-item btnlike" data-act="go" data-v="cycle"><div><b>Programma a cicli</b><small>' + (cycleInfo().on ? 'Attivo · ' + cycleInfo().K.n + ' · settimana ' + cycleInfo().w : 'Spento') + '</small></div>' + ic('back', 'flip') + '</button>' +
      '<div class="list-item flat"><div><b>Recupero automatico</b><small>Il timer parte quando segni la serie</small></div>' + toggle(st.autoRest, 'setFlag', 'data-k="autoRest"') + '</div>' +
      '<div class="list-item flat"><div><b>Suono a fine recupero</b></div>' + toggle(st.sound, 'setFlag', 'data-k="sound"') + '</div>' +
      '<div class="list-item flat"><div><b>Esercizi a corpo libero</b><small>Piegamenti, plank, trazioni, burpees… nelle schede, nei circuiti e nel Coach</small></div>' + toggle(bodyweightOn(), 'toggleBW') + '</div>' +
      '<div class="list-item flat"><div><b>Schermo sempre acceso</b><small>Durante l\'allenamento</small></div>' + toggle(st.keepScreen, 'setFlag', 'data-k="keepScreen"') + '</div>' +
    '</div>' +
    '<h3 class="sec">Promemoria</h3><div class="card">' +
      '<div class="list-item flat"><div><b>Giorni di allenamento</b><small>Nei giorni scelti nel profilo</small></div>' + toggle(r.workout.on, 'remOn', 'data-k="workout"') + '</div>' +
      (r.workout.on ? field('Ora', timeIn(r.workout.hour, r.workout.min, 'workout')) : '') +
      '<div class="list-item flat"><div><b>Bere acqua</b></div>' + toggle(r.water.on, 'remOn', 'data-k="water"') + '</div>' +
      (r.water.on ? '<div class="grid3">' + field('Dalle', numIn(r.water.from, 'data-in="remNum" data-k="from"')) + field('Alle', numIn(r.water.to, 'data-in="remNum" data-k="to"')) + field('Ogni (ore)', numIn(r.water.every, 'data-in="remNum" data-k="every"')) + '</div>' : '') +
      '<div class="list-item flat"><div><b>Pesata</b></div>' + toggle(r.weigh.on, 'remOn', 'data-k="weigh"') + '</div>' +
      (r.weigh.on ? '<div class="field"><span>Giorno</span>' + '<div class="chips days">' + [1, 2, 3, 4, 5, 6, 0].map(d => chip(WEEKDAYS[d], r.weigh.day === d, 'weighDay', 'data-d="' + d + '"')).join('') + '</div></div>' + field('Ora', timeIn(r.weigh.hour, r.weigh.min, 'weigh')) : '') +
      '<div class="list-item flat"><div><b>Pause attive al lavoro ⭐</b><small>' + (r.breaks.on ? 'Alle ' + breakTimes().map(m => pad(m / 60 | 0) + ':' + pad(m % 60)).join(' · ') : 'Ti ricorda di muoverti 2–5 minuti') + '</small></div>' + toggle(r.breaks.on, 'remOn', 'data-k="breaks"') + '</div>' +
      (r.breaks.on ? '<div class="field"><span>Giorni di lavoro</span>' + daysChips(r.breaks.days, 'brkDay') + '</div>' +
        '<div class="grid3">' + field('Dalle (ora)', numIn(r.breaks.from, 'data-in="brkNum" data-k="from"')) + field('Alle (ora)', numIn(r.breaks.to, 'data-in="brkNum" data-k="to"')) +
        '<div class="field"><span>Volte al giorno</span><div class="seg">' + [3, 4].map(n => chip(String(n), r.breaks.count === n, 'brkCount', 'data-n="' + n + '"')).join('') + '</div></div></div>' : '') +
      '<button class="btn ghost wide" data-act="askNotif">Consenti le notifiche</button>' +
    '</div>' +
    '<h3 class="sec">Coach AI (facoltativo)</h3><div class="card">' +
      '<p class="small muted">L\'app funziona al completo anche senza. Con una chiave puoi fare domande libere al coach. Gemini ha un piano gratuito.</p>' +
      '<div class="field"><span>Servizio</span><div class="chips">' + Object.keys(AI_PROVIDERS).map(k => chip(AI_PROVIDERS[k].n, ai.provider === k, 'aiProv', 'data-k="' + k + '"')).join('') + '</div></div>' +
      aiStatusBox() +
      (ai.provider === 'gemini' ? '<ol class="steps small key-steps">' +
        '<li>Tocca <b>Apri Google AI Studio</b> e accedi con il tuo account Google.</li>' +
        '<li>Premi <b>Create API key</b> (Crea chiave API). Se chiede un progetto, scegli quello proposto.</li>' +
        '<li>Copia la chiave: è una riga che inizia con <b>AIza</b>.</li>' +
        '<li>Torna qui e premi <b>Incolla chiave</b>: la provo subito.</li></ol>' +
        '<button class="btn wide" data-act="openUrl" data-u="' + prov.keyUrl + '">Apri Google AI Studio</button>'
        : '<p class="small"><a href="#" data-act="openUrl" data-u="' + prov.keyUrl + '">Ottieni la chiave</a> (servizio a pagamento a consumo).</p>') +
      '<div class="field"><span>Chiave API</span><div class="row gap"><input type="' + (UI.showKey ? 'text' : 'password') + '" class="grow" value="' + esc(ai.key) + '" data-in="aiKey" placeholder="' + (ai.provider === 'gemini' ? 'AIza…' : 'Incolla qui la chiave') + '" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn sm ghost" data-act="toggleKey">' + (UI.showKey ? 'Nascondi' : 'Mostra') + '</button></div></div>' +
      '<div class="grid2"><button class="btn" data-act="aiPaste">Incolla chiave</button><button class="btn ghost" data-act="aiTest">Prova la connessione</button></div>' +
      (ai.key ? '<button class="btn danger ghost wide" data-act="aiClear">Rimuovi la chiave</button>' : '') +
      '<details class="adv"><summary class="small muted">Avanzate: modello</summary>' + field('Modello', '<input type="text" value="' + esc(ai.model) + '" data-in="aiModel" placeholder="' + prov.model + '">', 'Lascia vuoto: se il modello non è disponibile ne provo un altro da solo.') + '</details>' +
    '</div>' +
    '<h3 class="sec">Backup</h3><div class="card">' +
      '<p class="small muted">I dati restano sul telefono. Esporta un file di backup e conservalo dove vuoi (Drive, PC…).</p>' +
      '<div class="grid2"><button class="btn" data-act="exportB" data-p="0">' + ic('download') + 'Esporta</button><button class="btn" data-act="exportB" data-p="1">Esporta con foto</button></div>' +
      '<label class="btn ghost wide filebtn">Importa backup<input type="file" accept="application/json,.json,*/*" data-in="importB" hidden></label>' +
      '<button class="btn danger ghost wide" data-act="resetAll">Azzera tutti i dati</button>' +
    '</div>' +
    '<p class="muted small center">GYM · uso personale</p></div>';
};

function updateBox() {
  const u = UI.update;
  if (!Native.has()) return '<p class="small muted">Gli aggiornamenti funzionano dall\'app installata.</p>';
  if (u.state === 'checking') return '<p class="small">Controllo in corso…</p>';
  if (u.state === 'downloading') return '<p class="small">Scaricamento… ' + u.progress + '%</p><div class="progress"><i style="width:' + u.progress + '%"></i></div>';
  if (u.state === 'available') return '<div class="note good">Nuova versione disponibile: <b>' + esc(u.info.name) + '</b></div>' + (u.info.notes ? '<p class="small muted">' + esc(u.info.notes).slice(0, 300) + '</p>' : '') + '<button class="btn wide" data-act="updDownload">' + ic('download') + 'Scarica e installa</button>';
  if (u.state === 'latest') return '<p class="small good">Hai già l\'ultima versione.</p><button class="btn ghost wide" data-act="updCheck">Controlla di nuovo</button>';
  if (u.state === 'error') return '<p class="small bad">' + esc(u.info || 'Errore') + '</p><button class="btn ghost wide" data-act="updCheck">Riprova</button>';
  return '<button class="btn ghost wide" data-act="updCheck">' + ic('download') + 'Controlla aggiornamenti</button>';
}

/* chiamate dal codice nativo per l'aggiornamento */
window.onUpdateInfo = (json) => {
  try {
    const d = JSON.parse(json);
    if (d.error) UI.update = { state: 'error', info: d.error, progress: 0 };
    else if (d.available) UI.update = { state: 'available', info: d, progress: 0 };
    else UI.update = { state: 'latest', info: d, progress: 0 };
  } catch (e) { UI.update = { state: 'error', info: 'Risposta non valida', progress: 0 }; }
  if (UI.update.state === 'available' && UI.update.silent !== false && current().v !== 'settings') {
    toast('Nuova versione di GYM disponibile: aggiorna dalle impostazioni');
  }
  if (current().v === 'settings') render();
};
window.onUpdateProgress = (p) => { UI.update.state = 'downloading'; UI.update.progress = p; if (current().v === 'settings') render(); };
window.onUpdateError = (msg) => { UI.update = { state: 'error', info: msg, progress: 0 }; if (current().v === 'settings') render(); };

/* =================== PRIMO AVVIO =================== */
VIEWS.onboarding = () => {
  const o = UI.ob, p = S.profile, r = S.reminders;
  const steps = 6, dots = '<div class="ob-dots">' + [...Array(steps)].map((_, i) => '<i class="' + (i <= o.step ? 'on' : '') + '"></i>').join('') + '</div>';
  const nav = (next, label) => '<div class="ob-nav">' + (o.step ? '<button class="btn ghost" data-act="obPrev">Indietro</button>' : '<span></span>') + '<button class="btn" data-act="' + (next || 'obNext') + '">' + (label || 'Avanti') + '</button></div>';
  let body = '';
  if (o.step === 0) body = '<div class="ob-hero">' + ic('dumbbell', 'xl') + '<h1>Benvenuto in GYM</h1><p>Il tuo allenatore personale in tasca. Ti faccio qualche domanda per preparare le schede su misura per te.</p></div>' + nav(null, 'Iniziamo');
  if (o.step === 1) body = '<h2>Quali sono i tuoi obiettivi?</h2><p class="muted">Puoi sceglierne più di uno: il trainer li combina.</p>' + Object.keys(GOALS).map(k => '<button class="opt check ' + (p.goals.includes(k) ? 'on' : '') + '" data-act="setGoal" data-k="' + k + '"><span><b>' + GOALS[k].n + '</b><small>' + GOALS[k].desc + '</small></span><i class="tick">' + ic('check') + '</i></button>').join('') + nav();
  if (o.step === 2) body = '<h2>Che livello hai?</h2>' + Object.keys(LEVELS).map(k => '<button class="opt ' + (p.level === k ? 'on' : '') + '" data-act="setLevel" data-k="' + k + '"><b>' + LEVELS[k].n + '</b><small>' + LEVELS[k].desc + '</small></button>').join('') + nav();
  if (o.step === 3) body = '<h2>In quali giorni ti alleni?</h2><p class="muted">Creo una scheda per ogni giorno.</p>' + daysChips(p.days, 'setDay') +
    '<p class="muted small">' + (p.days.length ? 'Schede: ' + splitForDays(p.days.length).map(k => PRESET_SPLITS[k].n).join(' · ') : 'Scegli almeno un giorno') + '</p>' + nav();
  if (o.step === 4) body = '<h2>I tuoi dati</h2><p class="muted">Servono per i progressi e per calcolare calorie e proteine. Puoi saltare.</p>' + field('Peso (kg)', numIn(o.weight || '', 'data-in="obWeight"', 'es. 75')) +
    '<div class="field"><span>Sesso</span><div class="seg">' + chip('Uomo', p.sex === 'm', 'setSex', 'data-k="m"') + chip('Donna', p.sex === 'f', 'setSex', 'data-k="f"') + '</div></div>' +
    '<div class="grid2">' + field('Età', numIn(p.age, 'data-in="prof" data-k="age"', 'es. 35')) + field('Altezza (cm)', numIn(p.height, 'data-in="prof" data-k="height"', 'es. 175')) + '</div>' + nav();
  if (o.step === 5) body = '<h2>Promemoria</h2>' +
    '<div class="list-item flat"><div><b>Allenamento</b><small>Nei tuoi giorni</small></div>' + toggle(r.workout.on, 'remOn', 'data-k="workout"') + '</div>' + (r.workout.on ? field('Ora', timeIn(r.workout.hour, r.workout.min, 'workout')) : '') +
    '<div class="list-item flat"><div><b>Bere acqua</b><small>Ogni ' + r.water.every + ' ore dalle ' + r.water.from + ' alle ' + r.water.to + '</small></div>' + toggle(r.water.on, 'remOn', 'data-k="water"') + '</div>' +
    '<div class="list-item flat"><div><b>Pesata</b><small>' + WEEKDAYS_LONG[r.weigh.day] + ' alle ' + pad(r.weigh.hour) + ':' + pad(r.weigh.min) + '</small></div>' + toggle(r.weigh.on, 'remOn', 'data-k="weigh"') + '</div>' +
    '<p class="muted small">Puoi cambiarli quando vuoi nelle impostazioni.</p>' + nav('obFinish', 'Fatto, entriamo!');
  return '<div class="pad ob">' + dots + body + '</div>';
};

/* carte del trainer in home */
function homeTrainerCards(t, doneToday) {
  return homeTrainerCards2(t, doneToday);
}
function homeKcalCard() {
  const ft = foodTotals(foodDay(todayKey())), nt = nutritionTargets();
  return '<button class="card kcal-mini" data-act="tab" data-v="food"><div class="eyebrow">' + ic('flame', 'inline') + 'Calorie di oggi</div><div class="row gap"><b class="big-num">' + Math.round(ft.kcal) + '<small>' + (nt.kcal ? ' / ' + nt.kcal + ' kcal' : ' kcal') + '</small></b><span class="grow"></span><span class="pill">' + ic('camera', 'inline') + 'Aggiungi</span></div>' + (nt.kcal ? '<div class="mac-bar"><i class="' + (ft.kcal > nt.kcal ? 'fat' : 'pro') + '" style="width:' + Math.min(100, 100 * ft.kcal / nt.kcal) + '%"></i></div>' : '') + '</button>';
}
function homeTrainerCards2(t, doneToday) {
  let out = '<div class="card trainer"><div class="eyebrow">' + ic('coach', 'inline') + 'Consiglio del trainer</div><p>' + esc(tipOfDay()) + '</p></div>';
  const n = nutritionTargets(), r = S.reminders.workout;
  if (t && !doneToday) {
    out += '<button class="card meal-mini" data-act="goFood"><div class="eyebrow">' + ic('flame', 'inline') + 'Prima dell\'allenamento</div><p><b>' + (r.on ? 'Alle ' + pad(Math.max(0, r.hour - 2)) + ':' + pad(r.min) + ' circa' : '2–3 ore prima') + '</b>: pasto con carboidrati e proteine magre. 30–60 min prima, se hai fame: una banana o uno yogurt con miele.</p><small class="muted">Tocca per l\'alimentazione completa</small></button>';
  } else if (doneToday) {
    out += '<button class="card meal-mini" data-act="goFood"><div class="eyebrow">' + ic('dumbbell', 'inline') + 'Recupero</div><p>Pasto di recupero entro 2 ore: ' + (n.protein ? Math.round(n.protein / 4) + ' g di proteine' : '25–40 g di proteine') + ' e carboidrati (es. yogurt greco con frutta e avena, o pasta con tonno e verdure).</p><small class="muted">Tocca per l\'alimentazione completa</small></button>';
  }
  const st = streaks();
  if (deloadActive()) out += '<div class="note warn">' + ic('info', 'inline') + '<b>Settimana di scarico attiva</b> fino a ' + fmtDateLong(S.deloadUntil) + ': metà delle serie, carichi uguali o poco più bassi, lontano dal cedimento. <button class="link-inline" data-act="deloadOff">Termina</button></div>';
  else if (st.weekStreak >= 5 && (!S.lastDeload || Date.now() - S.lastDeload > 35 * 864e5)) out += '<div class="note warn">' + ic('info', 'inline') + 'Ti alleni da ' + st.weekStreak + ' settimane di fila. Se ti senti stanco o i carichi non salgono, fai una <b>settimana di scarico</b> (ogni 4–8 settimane): metà delle serie e lontano dal cedimento. <button class="link-inline" data-act="deloadOn">Attiva per 7 giorni</button></div>';
  return out;
}
function mobilitySheet() {
  return '<h3>' + ic('run', 'inline') + 'Mobilità e stretching</h3><p class="small muted">Per i giorni di riposo o dopo l\'allenamento. Movimenti lenti, senza dolore.</p>' +
    MOBILITY.map((m, i) => '<div class="list-item flat"><div><b>' + (i + 1) + '. ' + m[0] + '</b><small>' + m[1] + '</small></div></div>').join('');
}

function aiStatusBox() {
  const st = UI.aiStatus, ai = S.settings.ai;
  if (st && st.state === 'testing') return '<div class="note">Provo la connessione…</div>';
  if (st && st.state === 'ok') return '<div class="note good">' + ic('check', 'inline') + 'Coach AI collegato e funzionante.</div>';
  if (st && st.state === 'err') return '<div class="note warn">' + esc(st.msg) + '</div>';
  if (ai.key && !keyLooksValid(ai.key, ai.provider)) return '<div class="note warn">La chiave non sembra completa' + (ai.provider === 'gemini' ? ': una chiave Gemini inizia con "AIza" ed è lunga circa 39 caratteri.' : '.') + '</div>';
  if (ai.key) return '<div class="note">Chiave salvata. Premi "Prova la connessione".</div>';
  return '';
}

/* ---------- Sostituzione esercizio: tutti gli esercizi del gruppo muscolare ---------- */
function openSwap(cur, act, n, opts) {
  UI.swap = Object.assign({ cur, act, n, m: (EX[cur] || {}).m, used: [] }, opts || {});
  openSheet(swapListSheet);
}
function swapListSheet() {
  const w = UI.swap, e = EX[w.cur] || {}, pref = w.eqs || null;
  const list = EXERCISES.filter(x => x.m === w.m && x.id !== w.cur && (isBreakEx(x) === isBreakEx(e)))
    .map(x => ({ x, s: (x.pat === e.pat ? 4 : 0) + (pref && pref.includes(x.eq) ? 6 : 0) + (x.eq === 'corpo' && !bodyweightOn() ? -5 : 0) + (x.comp === e.comp ? 1 : 0) }))
    .sort((a, b) => b.s - a.s).map(a => a.x);
  return '<h3>Sostituisci ' + esc(e.n || '') + '</h3>' +
    '<p class="small muted">Tutti gli esercizi per ' + MUSCLES[w.m] + '. In alto quelli più simili' + (pref ? ' e con gli attrezzi che hai scelto' : '') + '. Puoi anche cambiare gruppo muscolare.</p>' +
    '<div class="chips scroll">' + Object.keys(MUSCLES).map(m => chip(MUSCLES[m], w.m === m, 'swapM', 'data-m="' + m + '"')).join('') + '</div>' +
    (list.length ? list.map(x => {
      const used = w.used.includes(x.id);
      return '<button class="list-item btnlike" data-act="swapPick" data-id="' + x.id + '"><div><b>' + esc(x.n) + (used ? ' <span class="role">già presente</span>' : '') + '</b><small>' + EQUIP[x.eq] + (x.pat === e.pat ? ' · stesso movimento' : '') + (x.comp ? ' · multiarticolare' : ' · isolamento') + '</small></div>' + ic('swap') + '</button>';
    }).join('') : '<div class="empty small">Nessun altro esercizio</div>');
}

/* ---------- Riordino esercizi (trascina la maniglia o usa le frecce) ---------- */
function reorderItems(k) {
  if (k === 'wo') return S.active ? S.active.items : [];
  if (k === 'coach') { const o = UI.coach.result.options[UI.coach.result.sel]; return o.items; }
  if (k === 'edit') return UI.edit ? UI.edit.items : [];
  return [];
}
function reorderSheet() {
  const k = UI.reorderKey, items = reorderItems(k);
  return '<h3>Riordina</h3><p class="small muted">Tieni premuta la maniglia ≡ e trascina, oppure usa le frecce. Consiglio del trainer: prima i multiarticolari pesanti, poi l\'isolamento, addome alla fine.</p>' +
    '<div class="ro-list">' + items.map((it, n) => {
      const e = EX[it.ex] || { n: it.ex, m: '' }, done = it.sets && it.sets.some(s => s.done);
      return '<div class="ro-row" data-i="' + n + '"><span class="grip" data-grip="' + n + '">≡</span><div class="grow"><b>' + (n + 1) + '. ' + esc(e.n) + '</b><small>' + muscleName(e.m) + (it.ss ? ' · superserie ' + it.ss : '') + (done ? ' · iniziato' : '') + '</small></div>' +
        '<button class="icon-btn sm" data-act="roMove" data-n="' + n + '" data-d="-1"' + (n === 0 ? ' disabled' : '') + '>' + ic('up') + '</button><button class="icon-btn sm" data-act="roMove" data-n="' + n + '" data-d="1"' + (n === items.length - 1 ? ' disabled' : '') + '>' + ic('down') + '</button></div>';
    }).join('') + '</div><button class="btn wide" data-act="closeSheet">Fatto</button>';
}
function moveItem(k, from, to) {
  const items = reorderItems(k); if (to < 0 || to >= items.length || from === to) return;
  const cur = k === 'wo' && S.active && S.active.circ ? items[S.active.circ.idx] : null;
  const [x] = items.splice(from, 1); items.splice(to, 0, x);
  // superserie: restano tali solo se i due esercizi sono ancora vicini
  items.forEach((it, i) => { if (it.ss && !((items[i - 1] && items[i - 1].ss === it.ss) || (items[i + 1] && items[i + 1].ss === it.ss))) it.ss = null; });
  if (cur) S.active.circ.idx = items.indexOf(cur);
  if (k === 'wo') save();
}
/* trascinamento con il dito */
(function () {
  let drag = null;
  document.addEventListener('pointerdown', ev => {
    const g = ev.target.closest('[data-grip]'); if (!g) return;
    const row = g.closest('.ro-row'), list = row.parentElement;
    ev.preventDefault();
    drag = { row, list, from: +row.dataset.i, y0: ev.clientY, h: row.getBoundingClientRect().height + 6, rows: [...list.children], to: +row.dataset.i };
    row.classList.add('dragging'); g.setPointerCapture && g.setPointerCapture(ev.pointerId);
  });
  document.addEventListener('pointermove', ev => {
    if (!drag) return;
    const dy = ev.clientY - drag.y0, n = drag.rows.length;
    drag.to = Math.max(0, Math.min(n - 1, drag.from + Math.round(dy / drag.h)));
    drag.row.style.transform = 'translateY(' + dy + 'px)';
    drag.rows.forEach((r, i) => {
      if (r === drag.row) return;
      let s = 0;
      if (drag.to > drag.from && i > drag.from && i <= drag.to) s = -drag.h;
      if (drag.to < drag.from && i < drag.from && i >= drag.to) s = drag.h;
      r.style.transform = s ? 'translateY(' + s + 'px)' : '';
    });
  });
  const end = () => {
    if (!drag) return;
    const d = drag; drag = null;
    d.rows.forEach(r => { r.style.transform = ''; r.classList.remove('dragging'); });
    if (d.to !== d.from) { moveItem(UI.reorderKey, d.from, d.to); Native.vibrate(20); rerenderSheet(); render(); }
  };
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
})();

/* volume settimanale per muscolo: almeno ~10 serie (ACSM 2026), con rendimenti decrescenti oltre (Pelland 2024) */
function weekVolumeAdvice() {
  const m = weekStats().musc, low = Object.keys(MUSCLES).filter(k => k !== 'addome' && (m[k] || 0) < 10);
  return { m, low };
}
function weekVolumeNote() {
  const st = weekStats(); if (!st.count) return '';
  const { m, low } = weekVolumeAdvice(), d = new Date().getDay();
  if (!low.length) return '<p class="small good">Tutti i muscoli hanno almeno 10 serie questa settimana.</p>';
  if (d >= 1 && d <= 3) return '';
  return '<p class="small muted">Sotto le 10 serie settimanali: ' + low.slice(0, 5).map(k => MUSCLES[k] + ' ' + fmtKg(Math.round((m[k] || 0) * 10) / 10)).join(', ') + '.</p>';
}
