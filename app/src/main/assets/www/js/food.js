/* GYM — conta calorie: diario, codice a barre (Open Food Facts), foto con AI, alimenti comuni */
'use strict';

const MEALS_DAY = [['colazione', 'Colazione'], ['pranzo', 'Pranzo'], ['cena', 'Cena'], ['spuntini', 'Spuntini']];

/* alimenti comuni: valori medi indicativi per 100 g [kcal, proteine, carboidrati, grassi, porzione g] */
const FOOD_DB = [
  ['Pasta di semola (cruda)', 353, 12.5, 72, 1.5, 80], ['Pasta integrale (cruda)', 340, 13, 64, 2.5, 80], ['Riso bianco (crudo)', 360, 7, 80, 0.6, 80],
  ['Riso basmati (crudo)', 355, 8, 78, 0.9, 80], ['Pane comune', 275, 8.5, 56, 1.2, 50], ['Pane integrale', 245, 9, 45, 2.5, 50],
  ['Fette biscottate', 410, 11, 75, 6, 20], ['Fiocchi d\'avena', 370, 13, 60, 7, 40], ['Gallette di riso', 380, 8, 82, 3, 10],
  ['Patate', 80, 2, 17, 0.1, 200], ['Pizza margherita', 270, 10, 33, 10, 300], ['Biscotti frollini', 460, 7, 70, 17, 30],
  ['Petto di pollo (crudo)', 110, 23, 0, 1.5, 150], ['Petto di tacchino (crudo)', 107, 24, 0, 1, 150], ['Manzo magro (crudo)', 130, 21, 0, 5, 150],
  ['Bresaola', 151, 32, 0.4, 2, 50], ['Prosciutto crudo', 224, 25.5, 0, 13.5, 50], ['Prosciutto cotto', 215, 20, 1, 14.7, 50],
  ['Tonno al naturale (sgocciolato)', 103, 25, 0, 0.3, 80], ['Tonno sott\'olio (sgocciolato)', 192, 25, 0, 10, 80], ['Salmone fresco', 185, 20, 0, 12, 150],
  ['Merluzzo', 71, 17, 0, 0.3, 150], ['Uovo intero', 128, 12.4, 0.5, 8.7, 55], ['Albume d\'uovo', 43, 11, 0.7, 0, 100],
  ['Latte parzialmente scremato', 46, 3.4, 5, 1.6, 200], ['Latte intero', 64, 3.3, 4.9, 3.6, 200], ['Yogurt greco 0%', 57, 10, 4, 0, 170],
  ['Yogurt greco intero', 97, 9, 4, 5, 170], ['Yogurt bianco intero', 66, 3.8, 4.3, 3.9, 125], ['Mozzarella', 250, 18.7, 0.7, 19.5, 125],
  ['Parmigiano', 392, 33, 0, 28, 20], ['Ricotta vaccina', 146, 8.8, 3.5, 10.9, 100], ['Fiocchi di latte', 98, 11, 3.4, 4.3, 150],
  ['Olio extravergine d\'oliva', 899, 0, 0, 99.9, 10], ['Burro', 758, 0.8, 1.1, 83.4, 10], ['Mandorle', 603, 22, 4.6, 55, 30],
  ['Noci', 689, 14.3, 5.1, 68, 30], ['Burro di arachidi', 600, 25, 15, 50, 20], ['Banana', 65, 1.2, 15.4, 0.3, 120],
  ['Mela', 52, 0.3, 14, 0.2, 150], ['Arancia', 34, 0.7, 7.8, 0.2, 150], ['Fragole', 27, 0.9, 5.3, 0.4, 150],
  ['Pomodori', 19, 1, 3.5, 0.2, 150], ['Zucchine', 11, 1.3, 1.4, 0.1, 200], ['Insalata', 15, 1.3, 2.2, 0.2, 80],
  ['Broccoli', 27, 3, 3.1, 0.4, 200], ['Ceci (cotti/in scatola)', 120, 7, 17, 2.5, 150], ['Lenticchie (cotte)', 116, 9, 20, 0.4, 150],
  ['Fagioli (cotti)', 100, 7, 17, 0.5, 150], ['Miele', 304, 0.6, 80, 0, 10], ['Marmellata', 250, 0.5, 60, 0, 20],
  ['Cioccolato fondente 70%', 590, 8, 34, 43, 20], ['Zucchero', 392, 0, 100, 0, 5], ['Proteine in polvere (whey)', 380, 78, 6, 6, 30],
  ['Bibita tipo cola', 42, 0, 10.6, 0, 330], ['Birra', 43, 0.4, 3.6, 0, 330], ['Vino rosso', 85, 0.1, 2.6, 0, 125]
].map(([n, kcal, p, c, f, por]) => ({ id: 'db:' + n, name: n, kcal, p, c, f, serving: por, src: 'db' }));

/* ---------- dati ---------- */
function foodDay(k) { S.food = S.food || {}; return S.food[k || UI.foodDay || todayKey()] || []; }
function foodTotals(list) {
  return list.reduce((t, x) => { const k = x.g / 100; t.kcal += x.kcal * k; t.p += x.p * k; t.c += x.c * k; t.f += x.f * k; return t; }, { kcal: 0, p: 0, c: 0, f: 0 });
}
function rememberFood(prod) {
  S.foodRecent = (S.foodRecent || []).filter(x => x.id !== prod.id);
  S.foodRecent.unshift({ id: prod.id, name: prod.name, brand: prod.brand || '', kcal: prod.kcal, p: prod.p, c: prod.c, f: prod.f, serving: prod.serving || 100, src: prod.src, code: prod.code || '' });
  S.foodRecent = S.foodRecent.slice(0, 40);
}
/* calorie bruciate stimate in palestra (MET × peso × ore) */
function burnedToday(k) {
  const w = S.weights.length ? S.weights[S.weights.length - 1].kg : 75;
  return Math.round(S.history.filter(h => dayKey(h.start) === (k || todayKey())).reduce((a, h) => {
    const hrs = Math.max(0, (h.end - h.start) / 36e5), cardio = (h.cardio || []).reduce((x, c) => x + num(c.min), 0) / 60;
    const met = h.kind === 'circuito' ? 8 : 5;
    return a + met * w * Math.max(0, hrs - cardio) + 7 * w * cardio;
  }, 0));
}

/* ---------- Open Food Facts ---------- */
function offToProduct(p, code) {
  const n = p.nutriments || {};
  let kcal = n['energy-kcal_100g']; if (kcal == null && n.energy_100g != null) kcal = n.energy_100g / 4.184;
  if (kcal == null) return null;
  const sq = num(p.serving_quantity);
  return { id: 'off:' + (code || p.code), code: code || p.code, name: p.product_name_it || p.product_name || p.generic_name_it || 'Prodotto ' + (code || ''), brand: (p.brands || '').split(',')[0],
    kcal: Math.round(kcal), p: Math.round(num(n.proteins_100g) * 10) / 10, c: Math.round(num(n.carbohydrates_100g) * 10) / 10, f: Math.round(num(n.fat_100g) * 10) / 10,
    serving: sq > 0 && sq < 2000 ? sq : 100, servingLabel: p.serving_size || '', img: p.image_front_small_url || '', src: 'off' };
}
async function offByBarcode(code) {
  const res = await aiFetch('https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(code) + '.json?fields=code,product_name,product_name_it,generic_name_it,brands,nutriments,serving_size,serving_quantity,image_front_small_url', { method: 'GET', headers: { 'User-Agent': 'GYM-app/1.0 (uso personale)' } });
  const d = await res.json();
  if (!res.ok || d.status === 0 || !d.product) return null;
  return offToProduct(d.product, code);
}
async function offSearch(q) {
  const url = 'https://it.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(q) + '&search_simple=1&action=process&json=1&page_size=15&fields=code,product_name,product_name_it,brands,nutriments,serving_size,serving_quantity,image_front_small_url';
  const res = await aiFetch(url, { method: 'GET', headers: { 'User-Agent': 'GYM-app/1.0 (uso personale)' } });
  const d = await res.json();
  return (d.products || []).map(p => offToProduct(p, p.code)).filter(Boolean);
}

/* ---------- foto con AI ---------- */
async function aiFoodFromPhoto(dataUrl) {
  const prompt = 'Guarda la foto: può essere un piatto, un alimento confezionato o la tabella nutrizionale di un prodotto. ' +
    'Se si legge la tabella nutrizionale usa quei valori. Rispondi SOLO con un oggetto JSON, senza altro testo: ' +
    '{"nome":"nome in italiano","kcal100":numero,"proteine100":numero,"carboidrati100":numero,"grassi100":numero,"grammi_stimati":numero,"nota":"breve nota in italiano"}. ' +
    'I valori sono per 100 g; grammi_stimati è la quantità che vedi nella foto (stima).';
  const txt = await aiVision(prompt, dataUrl);
  const m = txt.match(/\{[\s\S]*\}/); if (!m) throw new Error('Non ho riconosciuto il cibo, prova un\'altra foto.');
  const j = JSON.parse(m[0]);
  return { id: 'ai:' + uid(), name: j.nome || 'Alimento', kcal: Math.round(num(j.kcal100)), p: num(j.proteine100), c: num(j.carboidrati100), f: num(j.grassi100),
    serving: Math.round(num(j.grammi_stimati)) || 100, note: j.nota || '', src: 'ai' };
}

/* ---------- viste ---------- */
VIEWS.food = () => {
  const k = UI.foodDay || todayKey(), list = foodDay(k), tot = foodTotals(list), n = nutritionTargets();
  const target = n.kcal || 0, left = target - tot.kcal, burn = burnedToday(k);
  const pct = target ? Math.min(1, tot.kcal / target) : 0, R = 54, Cc = 2 * Math.PI * R;
  const d = new Date(k + 'T12:00:00');
  const isToday = k === todayKey();
  const macro = (lbl, v, t, cls) => '<div class="mac"><div class="mac-h"><span>' + lbl + '</span><b>' + Math.round(v) + (t ? ' / ' + t : '') + ' g</b></div><div class="mac-bar"><i class="' + cls + '" style="width:' + (t ? Math.min(100, 100 * v / t) : 0) + '%"></i></div></div>';
  let out = header('Calorie', { sub: isToday ? 'Oggi' : fmtDateLong(d) }) + '<div class="pad">' +
    '<div class="day-nav"><button class="icon-btn" data-act="foodDayNav" data-d="-1">' + ic('back') + '</button><b>' + (isToday ? 'Oggi' : d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })) + '</b><button class="icon-btn" data-act="foodDayNav" data-d="1"' + (isToday ? ' disabled' : '') + '>' + ic('back', 'flip') + '</button></div>' +
    '<div class="card kcal-card">' +
      '<div class="ring"><svg viewBox="0 0 130 130"><circle cx="65" cy="65" r="' + R + '" class="ring-bg"/>' + (pct > 0.005 ? '<circle cx="65" cy="65" r="' + R + '" class="ring-fg' + (left < 0 ? ' over' : '') + '" stroke-dasharray="' + (Cc * pct).toFixed(1) + ' ' + Cc.toFixed(1) + '" transform="rotate(-90 65 65)"/>' : '') + '</svg>' +
        '<div class="ring-t"><b>' + (target ? Math.abs(Math.round(left)) : Math.round(tot.kcal)) + '</b><small>' + (target ? (left >= 0 ? 'kcal rimaste' : 'kcal in più') : 'kcal mangiate') + '</small></div></div>' +
      '<div class="kcal-side"><div><small>Obiettivo</small><b>' + (target || '—') + '</b></div><div><small>Mangiate</small><b>' + Math.round(tot.kcal) + '</b></div><div><small>Palestra (stima)</small><b>' + (burn ? '−' + burn : '0') + '</b></div></div>' +
    '</div>' +
    dietMiniCard(n) +
    (target ? '' : '<div class="note">Per l\'obiettivo di calorie completa peso, sesso, età e altezza: <button class="link-inline" data-act="goFood">apri i tuoi dati</button>.</div>') +
    '<div class="card">' + macro('Proteine', tot.p, n.protein, 'pro') + macro('Carboidrati', tot.c, n.carbs, 'carb') + macro('Grassi', tot.f, n.fat, 'fat') + '</div>' +
    '<div class="grid2 add-quick"><button class="btn" data-act="foodScan">' + ic('camera') + 'Scansiona codice</button><button class="btn ghost" data-act="foodPhoto">' + ic('sparkle') + 'Foto del cibo</button></div>' +
    MEALS_DAY.map(([mk, mn]) => {
      const items = list.map((x, i) => Object.assign({ i }, x)).filter(x => x.meal === mk), t = foodTotals(items);
      return '<div class="card meal-day"><div class="card-h"><h3>' + mn + '</h3><span class="muted small">' + Math.round(t.kcal) + ' kcal</span></div>' +
        items.map(x => '<button class="list-item btnlike" data-act="foodEdit" data-i="' + x.i + '"><div><b>' + esc(x.name) + '</b><small>' + fmtKg(x.g) + ' g · P ' + fmtKg(Math.round(x.p * x.g / 10) / 10) + ' · C ' + fmtKg(Math.round(x.c * x.g / 10) / 10) + ' · G ' + fmtKg(Math.round(x.f * x.g / 10) / 10) + '</small></div><b class="kc">' + Math.round(x.kcal * x.g / 100) + '</b></button>').join('') +
        '<button class="btn sm ghost" data-act="foodAdd" data-m="' + mk + '">' + ic('plus', 'inline') + 'Aggiungi</button></div>';
    }).join('') +
    '<p class="small muted center">Valori indicativi. Prodotti da Open Food Facts; le foto vengono analizzate dal coach AI.</p></div>';
  return out;
};

function mealNow() { const h = new Date().getHours(); return h < 11 ? 'colazione' : h < 15 ? 'pranzo' : h < 18 ? 'spuntini' : h < 22 ? 'cena' : 'spuntini'; }

/* foglio: aggiungi alimento */
function foodAddSheet() {
  const F = UI.fadd, q = (F.q || '').toLowerCase().trim();
  const rec = (S.foodRecent || []).filter(x => !q || x.name.toLowerCase().includes(q)).slice(0, q ? 10 : 8);
  const db = q ? FOOD_DB.filter(x => x.name.toLowerCase().includes(q)).slice(0, 12) : [];
  const row = (x, src) => '<button class="list-item btnlike" data-act="foodPick" data-src="' + src + '" data-id="' + esc(x.id) + '"><div><b>' + esc(x.name) + '</b><small>' + (x.brand ? esc(x.brand) + ' · ' : '') + x.kcal + ' kcal / 100 g · P ' + fmtKg(x.p) + ' · C ' + fmtKg(x.c) + ' · G ' + fmtKg(x.f) + '</small></div>' + ic('plus') + '</button>';
  return '<h3>Aggiungi a ' + (MEALS_DAY.find(m => m[0] === F.meal) || [0, ''])[1] + '</h3>' +
    '<div class="grid2"><button class="btn" data-act="foodScan">' + ic('camera') + 'Codice a barre</button><button class="btn ghost" data-act="foodPhoto">' + ic('sparkle') + 'Foto del cibo</button></div>' +
    '<div class="row gap"><input type="search" class="search grow" placeholder="Cerca un alimento…" value="' + esc(F.q || '') + '" data-in="foodQ"><button class="btn sm ghost" data-act="foodOnline">Cerca online</button></div>' +
    (F.busy ? '<div class="note">' + esc(F.busy) + '</div>' : '') +
    (F.online && F.online.length ? '<div class="eyebrow">Prodotti (Open Food Facts)</div>' + F.online.map(x => row(x, 'online')).join('') : '') +
    (db.length ? '<div class="eyebrow">Alimenti comuni</div>' + db.map(x => row(x, 'db')).join('') : '') +
    (rec.length ? '<div class="eyebrow">' + (q ? 'Usati di recente' : 'Recenti') + '</div>' + rec.map(x => row(x, 'recent')).join('') : '') +
    (!q && !rec.length ? '<div class="eyebrow">Alimenti comuni</div>' + FOOD_DB.slice(0, 10).map(x => row(x, 'db')).join('') : '') +
    '<div class="row gap wrap"><button class="btn sm ghost" data-act="foodManual">Inserisci a mano</button><button class="btn sm ghost" data-act="foodCode">Scrivi il codice a barre</button></div>';
}

/* foglio: quantità */
function foodQtySheet() {
  const P = UI.fprod, g = num(P.g), k = g / 100;
  const chips = [P.serving && P.serving !== 100 ? [P.serving, P.servingLabel && /\d/.test(P.servingLabel) ? 'porzione ' + P.servingLabel : 'porzione (' + fmtKg(P.serving) + ' g)'] : null, [50, '50 g'], [100, '100 g'], [150, '150 g'], [200, '200 g']].filter(Boolean);
  return '<h3>' + esc(P.name) + '</h3>' + (P.brand ? '<p class="small muted">' + esc(P.brand) + '</p>' : '') +
    (P.note ? '<div class="note small">' + ic('sparkle', 'inline') + esc(P.note) + ' Controlla e correggi i valori se serve.</div>' : '') +
    (P.askName ? field('Nome', '<input type="text" value="' + esc(P.name) + '" data-in="fname">') : '') +
    (P.edit ? '<div class="grid4">' + [['kcal', 'kcal'], ['p', 'Prot.'], ['c', 'Carb.'], ['f', 'Grassi']].map(([kk, l]) => field(l + '/100g', numIn(P[kk], 'data-in="fprod" data-k="' + kk + '"'))).join('') + '</div>'
      : '<p class="small muted">Per 100 g: ' + P.kcal + ' kcal · P ' + fmtKg(P.p) + ' g · C ' + fmtKg(P.c) + ' g · G ' + fmtKg(P.f) + ' g <button class="link-inline" data-act="foodValEdit">modifica</button></p>') +
    '<div class="field"><span>Quanti grammi?</span><input type="text" inputmode="decimal" id="fg" value="' + esc(P.g) + '" data-in="fgrams" class="big-in"></div>' +
    '<div class="chips">' + chips.map(c => chip(c[1], num(P.g) === c[0], 'foodG', 'data-g="' + c[0] + '"')).join('') + '</div>' +
    '<div class="fq-res"><div><b id="fq-k">' + Math.round(P.kcal * k) + '</b><small>kcal</small></div><div><b id="fq-p">' + fmtKg(Math.round(P.p * k * 10) / 10) + '</b><small>proteine</small></div><div><b id="fq-c">' + fmtKg(Math.round(P.c * k * 10) / 10) + '</b><small>carboidrati</small></div><div><b id="fq-f">' + fmtKg(Math.round(P.f * k * 10) / 10) + '</b><small>grassi</small></div></div>' +
    '<div class="field"><span>Pasto</span><div class="seg">' + MEALS_DAY.map(([mk, mn]) => chip(mn, P.meal === mk, 'foodMeal', 'data-m="' + mk + '"')).join('') + '</div></div>' +
    '<button class="btn wide big" data-act="foodSave">' + ic('check') + (P.i != null ? 'Salva' : 'Aggiungi al diario') + '</button>' +
    (P.i != null ? '<button class="btn danger ghost wide" data-act="foodDel">' + ic('trash') + 'Elimina</button>' : '');
}
function foodQtyUpdate() {
  const P = UI.fprod, k = num(P.g) / 100, set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('fq-k', Math.round(P.kcal * k)); set('fq-p', fmtKg(Math.round(P.p * k * 10) / 10)); set('fq-c', fmtKg(Math.round(P.c * k * 10) / 10)); set('fq-f', fmtKg(Math.round(P.f * k * 10) / 10));
}
function openQty(prod, extra) {
  UI.fprod = Object.assign({ g: prod.serving || 100, meal: (UI.fadd && UI.fadd.meal) || mealNow() }, prod, extra || {});
  openSheet(foodQtySheet);
  setTimeout(() => { const i = document.getElementById('fg'); if (i) { i.focus(); i.select(); } }, 80);
}

/* risultati dello scanner nativo */
window.onBarcode = code => { if (code) foodLookup(code); };
window.onBarcodeError = msg => { toast('Scanner non disponibile: scrivi il codice a mano'); ACT.foodCode(); };
async function foodLookup(code) {
  code = String(code).replace(/\D/g, '');
  if (!code) return;
  const known = (S.foodRecent || []).find(x => x.code === code);
  if (known) { openQty(known); return; }
  UI.fadd = UI.fadd || { meal: mealNow() };
  UI.fadd.busy = 'Cerco il prodotto ' + code + '…'; openSheet(foodAddSheet);
  try {
    const p = await offByBarcode(code);
    UI.fadd.busy = '';
    if (p) openQty(p);
    else { toast('Prodotto non trovato: inserisci i valori dall\'etichetta'); openQty({ id: 'man:' + code, code, name: 'Prodotto ' + code, kcal: 0, p: 0, c: 0, f: 0, serving: 100, src: 'man' }, { edit: true }); }
  } catch (e) { UI.fadd.busy = 'Errore di connessione: ' + e.message; rerenderSheet(); }
}

function dietMiniCard(n) {
  if (!dietActive()) return '<button class="card diet-mini" data-act="go" data-v="diet"><div class="eyebrow">' + ic('flame', 'inline') + 'Piano alimentare</div><small class="muted">Diete, esempi di giornata e fonti scientifiche</small></button>';
  const D = dietState(), r = DIET_RATES.find(x => x.r === D.rate) || DIET_RATES[1];
  return '<button class="card diet-mini" data-act="go" data-v="diet"><div class="eyebrow">' + ic('flame', 'inline') + 'Piano dimagrimento</div><b>' + r.n + ' · ' + (n.deficit != null ? '−' + n.deficit + ' kcal/giorno' : fmtKg(D.rate) + '% a settimana') + '</b><small class="muted">' + DIETS[D.style].n + (n.kgWeek ? ' · ≈ ' + fmtKg(n.kgWeek) + ' kg a settimana' : '') + ' · tocca per modificare</small></button>';
}
